import { attributionFromCookieHeader, attributionMetadata } from './_lib/attribution.js';
import { createDodoClient, subscriptionProductId } from './_lib/dodoClient.js';
import { PLAN, formatUsd } from './_lib/pricing.js';
import { manageSubscription } from './_lib/manageSubscription.js';

// Checkout page languages we force for visitors who came through the Spanish / Japanese pages
// (Dodo supports both). Everyone else gets Dodo's default.
const CHECKOUT_LANGUAGE = { es: 'es', ja: 'ja' };

// What Dodo says the product costs is checked at most this often per warm function instance.
const PLAN_CHECK_TTL_MS = 5 * 60 * 1000;
let planCheck = { productId: '', at: 0, problems: [] };

// Everything the site promises next to a buy button ($0.99 first month, then $99.99 a month, see
// api/_lib/pricing.js) has to be what the Dodo product actually does, otherwise someone could be
// charged more than the page told them. Returns what does not match; an empty list means fine.
// Only a mismatch Dodo reports counts: if the product cannot be read at all we carry on, the
// checkout call itself will fail loudly if the product is wrong.
async function planProblems(client, productId) {
  if (planCheck.productId === productId && Date.now() - planCheck.at < PLAN_CHECK_TTL_MS) {
    return planCheck.problems;
  }

  let product;
  try {
    product = await client.products.retrieve(productId);
  } catch (error) {
    console.warn('[checkout] could not read the Dodo product to verify its price, continuing:', error.message);
    return [];
  }

  const problems = [];
  const price = product?.price;
  if (!price || price.type !== 'recurring_price') {
    problems.push('the product is not a subscription (recurring) product');
  } else {
    if (price.currency !== PLAN.currency) problems.push(`currency is ${price.currency}, expected ${PLAN.currency}`);
    if (price.price !== PLAN.recurringCents) {
      problems.push(`recurring price is ${price.price} cents, expected ${PLAN.recurringCents} (${formatUsd(PLAN.recurringCents)})`);
    }
    if (price.payment_frequency_interval !== PLAN.interval || price.payment_frequency_count !== 1) {
      problems.push(`billed every ${price.payment_frequency_count} ${price.payment_frequency_interval}, expected every 1 ${PLAN.interval}`);
    }
    if ((price.trial_period_days ?? 0) !== PLAN.firstPeriodDays) {
      problems.push(`trial period is ${price.trial_period_days ?? 0} days, expected ${PLAN.firstPeriodDays}`);
    }
    // trial_amount is the "$0.99 now" part. Older SDK typings do not list it, so only a value Dodo
    // actually returns can be compared.
    if (price.trial_amount != null && price.trial_amount !== PLAN.firstPaymentCents) {
      problems.push(`trial amount is ${price.trial_amount} cents, expected ${PLAN.firstPaymentCents} (${formatUsd(PLAN.firstPaymentCents)})`);
    }
    if (price.trial_amount == null) {
      console.warn('[checkout] Dodo did not return trial_amount for the product; confirm in the dashboard that Trial Amount is 99 (cents).');
    }
    // A percentage taken off the product itself would cut every renewal.
    if (price.discount) problems.push(`the product has a ${price.discount}% discount, expected none`);
  }

  planCheck = { productId, at: Date.now(), problems };
  return problems;
}

export default async function handler(req, res) {
  // POST = "Manage subscription": a link to Dodo's customer portal for the signed-in user. It shares
  // this function because the Vercel plan allows only 12 functions (api/_lib/manageSubscription.js).
  if (req.method === 'POST') {
    return manageSubscription(req, res);
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dodo = createDodoClient();
  if (!dodo) {
    console.error("CRITICAL: DODO_PAYMENTS_API_KEY is missing.");
    return res.status(500).json({ error: 'Internal Server Error: Payment configuration missing.' });
  }
  const { client, mode } = dodo;
  console.log('[checkout] mode:', mode);

  // The subscription product. No fallback to the old one-time product on purpose: sending someone to
  // the old price while the page promises "$0.99 first month" would charge them something else.
  const productId = subscriptionProductId();
  if (!productId) {
    console.error('CRITICAL: checkout is closed (DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID is set to off).');
    return res.status(503).json({ error: 'Checkout is not available right now. Please try again later.' });
  }

  try {
    const problems = await planProblems(client, productId);
    if (problems.length) {
      console.error('CRITICAL: the Dodo product does not match the plan the site advertises, checkout is closed:', problems.join('; '));
      return res.status(503).json({ error: 'Checkout is not available right now. Please try again later.' });
    }

    // Only the signed-in user's email and (optional) extra metadata come from the link. The product
    // and any discount code are fixed on the server: a link from before the subscription (for
    // example "?discountCode=EARLY40") must not discount the monthly price.
    const { customerEmail, metadata } = req.query;

    // Parse metadata if provided
    let parsedMetadata = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(decodeURIComponent(metadata));
      } catch (e) {
        console.warn('Failed to parse metadata JSON', e);
      }
    }

    // Where this buyer came from (first page, page they clicked "full report" on, language), read
    // from the first-party cookie services/attribution.ts keeps. It ends up on the payment in Dodo
    // and in the webhook. Metadata passed explicitly in the request wins over it.
    const attribution = attributionFromCookieHeader(req.headers.cookie);
    parsedMetadata = { ...attributionMetadata(attribution), ...parsedMetadata };
    console.log('[checkout] attribution:', JSON.stringify(attribution));

    // Forcefully inject the intended email into metadata so the webhook knows exactly who to upgrade
    if (customerEmail) {
      parsedMetadata.customer_email = String(customerEmail);
    }
    parsedMetadata.plan = 'monthly_subscription';

    const sessionParams = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      billing: {
        email: customerEmail || undefined, // Prefill email if available
      },
      customer: {
        email: customerEmail || undefined,
      },
      metadata: parsedMetadata,
      return_url: process.env.DODO_PAYMENTS_SUCCESS_URL || 'https://facemaxify.com/dashboard',
    };

    // Start the subscription through a Checkout Session: Dodo shows the first payment and the
    // recurring price on its page and sets up the monthly renewals after the first period.
    let session;
    const forceLanguage = CHECKOUT_LANGUAGE[attribution.lang];
    if (forceLanguage) {
      try {
        session = await client.checkoutSessions.create({
          ...sessionParams,
          customization: { force_language: forceLanguage },
        });
      } catch (languageError) {
        // The language is a nicety, never a reason to lose a sale: fall back to Dodo's default.
        console.warn('Checkout with forced language failed, retrying without it:', languageError.message);
      }
    }
    if (!session) {
      session = await client.checkoutSessions.create(sessionParams);
    }

    // Redirect the user to the checkout URL
    return res.redirect(session.checkout_url);
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
  }
}
