// Turns Dodo Payments events into access in Supabase (api/webhooks/dodo.js calls this).
//
// Two kinds of paid users exist and must never be confused:
//   * Old plan: bought before the subscription existed. Their row has "isPaid" = true and
//     subscription_status = null. Nothing in this file ever turns them off. A payment on any product
//     other than the subscription product keeps working exactly as it always did (isPaid = true).
//   * Subscribers: bought the subscription product ($0.99 first month, then monthly). Their row has a
//     subscription_status, and the Dodo ids live in user_billing (service role only, see
//     supabase_subscriptions.sql). Only events for THEIR subscription id can switch their access off.
//
// Lifecycle for subscribers:
//   first payment / subscription.active ........ access on
//   subscription.renewed ....................... access stays on, period end moves forward
//   subscription.past_due (grace period) ....... access stays on
//   subscription.on_hold (renewal failed) ...... access off (comes back if they fix the card)
//   subscription.cancelled ..................... access stays until the end of the paid period
//   subscription.expired ....................... access off
// Events can arrive late or twice, so every write is idempotent and an event older than the last one
// applied for the same subscription is skipped.

const isTrue = (v) => v === true || v === 'true' || v === 't';

const toIso = (value) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
};

const emailOf = (data) => data?.metadata?.customer_email || data?.customer?.email || data?.billing?.email || null;

/**
 * What a subscription status means for access.
 *   'grant'  access on        'keep'  leave access as it is        'revoke'  access off
 * A cancelled subscription keeps access until the period it already paid for ends.
 * Returns null for statuses that say nothing about access (pending, failed, unknown).
 */
export function decideAccess(status, periodEndIso, now = Date.now()) {
  switch (status) {
    case 'active':
      return 'grant';
    case 'past_due':
      return 'keep';
    case 'cancelled':
      return periodEndIso && Date.parse(periodEndIso) > now ? 'keep' : 'revoke';
    case 'on_hold':
    case 'paused':
    case 'expired':
      return 'revoke';
    default:
      return null;
  }
}

// Subscription event type -> the status it announces ('updated' / 'plan_changed' carry it in the payload).
const STATUS_BY_EVENT = {
  'subscription.active': 'active',
  'subscription.renewed': 'active',
  'subscription.past_due': 'past_due',
  'subscription.on_hold': 'on_hold',
  'subscription.paused': 'paused',
  'subscription.cancelled': 'cancelled',
  'subscription.expired': 'expired',
};

function check(error, what) {
  if (error) {
    // Most likely cause right after a deploy: supabase_subscriptions.sql has not been run yet.
    throw new Error(`${what}: ${error.message}`);
  }
}

/**
 * @param {object} args
 * @param {import('@supabase/supabase-js').SupabaseClient} args.db  service-role client
 * @param {{ type: string, timestamp?: string, data: any }} args.event  a verified Dodo webhook event
 * @param {string} args.planProductId  DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID ('' when not configured)
 * @param {(subscriptionId: string) => Promise<{ product_id?: string }>} args.retrieveSubscription
 * @returns {Promise<string>} what happened, for the log. Throws when the database could not be updated
 *   (the webhook then answers 500 and Dodo sends the event again).
 */
export async function processDodoEvent({ db, event, planProductId, retrieveSubscription }) {
  const { type } = event;
  const data = event.data || {};
  const eventAt = toIso(event.timestamp) || new Date().toISOString();

  if (type === 'payment.succeeded') {
    const subscriptionId = data.subscription_id || null;
    if (!subscriptionId || !(await paymentIsForPlan(data, subscriptionId, planProductId, retrieveSubscription))) {
      return legacyPayment(db, data);
    }
    return applySubscription({ db, data, eventAt, status: 'active', subscriptionId });
  }

  if (type.startsWith('subscription.')) {
    // Subscriptions on any other product (the old monthly plan, if it was one) are not ours to touch.
    if (!planProductId || data.product_id !== planProductId) {
      return `ignored ${type}: not the subscription product`;
    }
    const status = STATUS_BY_EVENT[type] || (type === 'subscription.updated' || type === 'subscription.plan_changed' ? data.status : null);
    if (!status) return `ignored ${type}`;
    return applySubscription({
      db,
      data,
      eventAt,
      status,
      subscriptionId: data.subscription_id,
      periodEnd: toIso(data.next_billing_date),
      cancelAtPeriodEnd: typeof data.cancel_at_next_billing_date === 'boolean' ? data.cancel_at_next_billing_date : undefined,
    });
  }

  return `ignored ${type}`;
}

async function paymentIsForPlan(data, subscriptionId, planProductId, retrieveSubscription) {
  if (!planProductId) return false;
  const productIds = (data.product_cart || []).map((item) => item.product_id);
  if (productIds.length) return productIds.includes(planProductId);
  const subscription = await retrieveSubscription(subscriptionId);
  return subscription?.product_id === planProductId;
}

// A payment that is not the subscription: the old plan. Same as before the subscription existed.
async function legacyPayment(db, data) {
  const email = emailOf(data);
  if (!email) return 'old-plan payment without an email, nothing to update';
  const { data: rows, error } = await db.from('users').update({ isPaid: true }).eq('email', email).select('id');
  check(error, 'could not mark the old-plan payment as paid');
  return rows?.length ? `old-plan payment: ${email} marked paid` : `old-plan payment: no users row for ${email}`;
}

async function applySubscription({ db, data, eventAt, status, subscriptionId, periodEnd, cancelAtPeriodEnd }) {
  if (!subscriptionId) return 'ignored: no subscription id';
  const email = emailOf(data);

  // Who is this? Prefer the subscription id we stored; the email is how a brand-new one is matched.
  let { data: billing, error } = await db.from('user_billing').select('*').eq('subscription_id', subscriptionId).maybeSingle();
  check(error, 'could not read user_billing');

  let user = null;
  if (billing) {
    const res = await db.from('users').select('*').eq('id', billing.user_id).maybeSingle();
    check(res.error, 'could not read the user');
    user = res.data;
  } else if (email) {
    const res = await db.from('users').select('*').eq('email', email).maybeSingle();
    check(res.error, 'could not read the user');
    user = res.data;
    if (user) {
      const own = await db.from('user_billing').select('*').eq('user_id', user.id).maybeSingle();
      check(own.error, 'could not read user_billing');
      // This user already has a different subscription on file. Only a brand-new active one may
      // replace it (they subscribed again); anything else is about the old one and is stale.
      if (own.data?.subscription_id && own.data.subscription_id !== subscriptionId && status !== 'active') {
        return `ignored ${status} for ${subscriptionId}: the user's current subscription is a different one`;
      }
      billing = own.data?.subscription_id === subscriptionId ? own.data : null;
    }
  }

  if (!user) {
    if (status === 'active') throw new Error(`no users row for ${email || subscriptionId}; Dodo will retry`);
    return `ignored ${status} for ${subscriptionId}: no matching user`;
  }

  // A late or repeated event must not undo a newer one.
  if (billing?.last_event_at && Date.parse(eventAt) < Date.parse(billing.last_event_at)) {
    return `skipped stale ${status} for ${subscriptionId}`;
  }

  const periodEndEffective = periodEnd ?? user.subscription_current_period_end ?? undefined;
  const access = decideAccess(status, periodEndEffective);
  if (access === null) return `ignored ${status} for ${subscriptionId}`;

  const update = { subscription_status: status };
  if (periodEnd) update.subscription_current_period_end = periodEnd;
  if (cancelAtPeriodEnd !== undefined) update.subscription_cancel_at_period_end = cancelAtPeriodEnd;
  else if (status === 'cancelled') update.subscription_cancel_at_period_end = true;

  // Someone who already had access from the old plan when they first subscribed keeps it for good.
  const firstSubscribe = user.subscription_status == null;
  const legacyAccess = user.legacy_access === true || (firstSubscribe && isTrue(user.isPaid));
  if (legacyAccess && user.legacy_access !== true) update.legacy_access = true;

  if (access === 'grant') update.isPaid = true;
  else if (access === 'revoke' && !legacyAccess) update.isPaid = false;

  const customerId = data.customer?.customer_id ?? billing?.dodo_customer_id ?? null;
  const up = await db.from('user_billing').upsert(
    {
      user_id: user.id,
      email: email || user.email || null,
      dodo_customer_id: customerId,
      subscription_id: subscriptionId,
      last_event_at: eventAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  check(up.error, 'could not save user_billing');

  const res = await db.from('users').update(update).eq('id', user.id);
  check(res.error, 'could not update the user');

  return `${status} for ${subscriptionId}: access ${access}${legacyAccess ? ' (old plan kept)' : ''}`;
}
