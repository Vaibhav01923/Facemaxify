import { createClient } from '@supabase/supabase-js';
import { ClerkAuthError, verifyClerkSession } from './clerkAuth.js';
import { createDodoClient } from './dodoClient.js';

// "Manage subscription" in the dashboard (POST /api/checkout, see api/checkout.js; it lives here because the plan allows only 12 functions): returns a link to Dodo's customer portal, where the
// signed-in customer can cancel, update their card and see invoices. POST with the Clerk session
// token as "Authorization: Bearer ...". Answers { url } or { error }.
//
// Nothing here trusts the browser about who is asking: the token is verified (signature, issuer,
// expiry) and the customer is looked up from the verified user id, never from the request body.

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function manageSubscription(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId;
  try {
    ({ userId } = await verifyClerkSession(req.headers.authorization));
  } catch (error) {
    if (error instanceof ClerkAuthError) {
      return res.status(401).json({ error: 'Please sign in again.' });
    }
    console.error('[manage-subscription] could not verify the session:', error.message);
    return res.status(500).json({ error: 'Could not open billing right now.' });
  }

  const dodo = createDodoClient();
  if (!dodo) {
    console.error('CRITICAL: DODO_PAYMENTS_API_KEY is missing.');
    return res.status(500).json({ error: 'Could not open billing right now.' });
  }
  const { client } = dodo;

  try {
    // Subscribers: the Dodo customer id saved by the webhook.
    const { data: billing, error: billingError } = await supabase
      .from('user_billing')
      .select('dodo_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (billingError) throw new Error(`user_billing: ${billingError.message}`);
    let customerId = billing?.dodo_customer_id || null;

    // Everyone else who has paid (the old plan): find their Dodo customer by the account email.
    if (!customerId) {
      const { data: user, error: userError } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
      if (userError) throw new Error(`users: ${userError.message}`);
      const email = user?.email?.trim().toLowerCase();
      if (email) {
        const page = await client.customers.list({ email });
        // The filter can match loosely, so insist on the exact address before opening anyone's portal.
        customerId = page.items.find((c) => c.email?.trim().toLowerCase() === email)?.customer_id || null;
      }
    }

    if (!customerId) {
      return res.status(404).json({ error: 'We could not find a payment on this account yet.' });
    }

    const portal = await client.customers.customerPortal.create(customerId);
    return res.status(200).json({ url: portal.link });
  } catch (error) {
    console.error('[manage-subscription] failed:', error.message);
    return res.status(500).json({ error: 'Could not open billing right now.' });
  }
}
