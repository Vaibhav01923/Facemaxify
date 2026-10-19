import DodoPayments from 'dodopayments';

// One place that builds the Dodo client for the checkout, webhook and billing-portal functions.
// Test keys (sk_test_...) talk to Dodo's test mode and live keys (sk_live_...) to live mode, so
// pointing a Vercel environment at a test key and a test product is all it takes to test.
export function resolveDodoMode(apiKey) {
  if (apiKey?.startsWith('sk_test_')) return 'test_mode';
  if (apiKey?.startsWith('sk_live_')) return 'live_mode';
  return process.env.DODO_PAYMENTS_MODE || 'live_mode';
}

/** Returns { client, mode }, or null when DODO_PAYMENTS_API_KEY is not set. */
export function createDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) return null;
  const mode = resolveDodoMode(apiKey);
  return { client: new DodoPayments({ bearerToken: apiKey.trim(), environment: mode }), mode };
}

/** The id of the subscription product (the "$0.99 first month, then monthly" plan), or ''. */
export function subscriptionProductId() {
  return (process.env.DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID || '').trim();
}
