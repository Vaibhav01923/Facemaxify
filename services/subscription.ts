// What the signed-in user's row in `users` says about access, in one place (App.tsx reads it).
//
// "isPaid" is the switch the whole site already uses. For subscribers the webhook (api/webhooks/dodo.js)
// keeps it in step with Dodo; this adds one rule on top so a cancelled subscriber's access ends exactly
// when the period they paid for ends, even if no event arrives at that moment. People on the old plan
// (no subscription_status, or legacy_access) are never affected by it.

export interface SubscriptionInfo {
  /** active | past_due | on_hold | cancelled | expired */
  status: string;
  /** End of the period already paid for, ISO date. */
  periodEnd: string | null;
  /** They cancelled: no further payment will be taken. */
  cancelsAtPeriodEnd: boolean;
}

export interface Access {
  isPaid: boolean;
  /** Null for free accounts and for people on the old plan. */
  subscription: SubscriptionInfo | null;
}

const isTrue = (v: unknown) => v === true || v === "true" || v === "t";

export function resolveAccess(row: Record<string, any> | null | undefined, now: number = Date.now()): Access {
  if (!row) return { isPaid: false, subscription: null };

  // Both spellings are checked on purpose, as App.tsx always did.
  const paidFlag = isTrue(row.isPaid) || isTrue(row.is_paid);
  const status: string | null = typeof row.subscription_status === "string" ? row.subscription_status : null;
  const periodEnd: string | null = row.subscription_current_period_end ?? null;
  const oldPlan = row.legacy_access === true;

  const periodOver = periodEnd != null && Date.parse(periodEnd) <= now;
  const lapsed = status === "cancelled" && !oldPlan && periodOver;

  return {
    isPaid: paidFlag && !lapsed,
    subscription: status
      ? { status, periodEnd, cancelsAtPeriodEnd: status === "cancelled" || row.subscription_cancel_at_period_end === true }
      : null,
  };
}
