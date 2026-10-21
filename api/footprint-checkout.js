import DodoPayments from 'dodopayments';
import { createHash } from 'node:crypto';
import { createFootprintCheckout } from './_lib/footprint-checkout.js';
import { clientForFootprint, verifyFootprintAccess, saveCheckoutCookie } from './_lib/footprint-access.js';
import { anthropicProfileSearch } from './_lib/footprint-search.js';

const requests = new Map();
let searchCheckedUntil = 0;
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method === 'GET') {
    try {
      const access = await verifyFootprintAccess(req);
      return res.json({ active: access.active, pending: !!access.pending, searchAvailable: !!process.env.ANTHROPIC_API_KEY });
    } catch { return res.status(503).json({ error: 'Membership verification is temporarily unavailable.' }); }
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Use POST.' }); }
  if (req.body?.action === 'portal') {
    try {
      const client = clientForFootprint();
      const access = await verifyFootprintAccess(req, client);
      if (!access.customerId) return res.status(401).json({ error: 'Open this page in the browser used for purchase, or use the billing link in your Dodo email.' });
      const portal = await client.customers.customerPortal.create(access.customerId, { send_email: false });
      return res.json({ portal_url: portal.link });
    } catch { return res.status(503).json({ error: 'Billing management is temporarily unavailable. You can also use the link in your Dodo receipt.' }); }
  }
  if (!['standard', 'exit'].includes(req.body?.offer)) return res.status(400).json({ error: 'Choose a valid report offer.' });
  const now = Date.now();
  for (const [key, entry] of requests) if (entry.until < now) requests.delete(key);
  const key = createHash('sha256').update(String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'local')).digest('hex');
  const entry = requests.get(key) || { count: 0, until: now + 60000 };
  if (requests.size >= 1000 || ++entry.count > 5) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: 'Please wait a minute before trying checkout again.' }); }
  requests.set(key, entry);
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'Secure checkout is not configured yet. Please try again later.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Search is not configured yet, so purchases are temporarily paused.' });
  const environment = process.env.DODO_PAYMENTS_MODE || (apiKey.startsWith('sk_test_') ? 'test_mode' : 'live_mode');
  try {
    const client = new DodoPayments({ bearerToken: apiKey, environment, timeout: 15000, maxRetries: 0 });
    const existing = await verifyFootprintAccess(req, client);
    if (existing.active) return res.status(409).json({ error: 'Your membership is already active. Close this panel and run your search.' });
    // Verify the provider works before allowing anyone to pay. Cache only availability, never reports.
    if (searchCheckedUntil < Date.now()) {
      await anthropicProfileSearch({ name: 'Facemaxify', profile: { handle: 'facemaxify' } });
      searchCheckedUntil = Date.now() + 10 * 60000;
    }
    return res.json({ checkout_url: await createFootprintCheckout(client, req.body.offer, id => {
      if (!/^cks_[a-zA-Z0-9]+$/.test(id || '')) throw new Error('Missing checkout session.');
      saveCheckoutCookie(res, id);
    }) });
  } catch (error) {
    const safe = ['Checkout is paused', 'The recurring 50% offer'].some(prefix => error.message?.startsWith(prefix));
    return res.status(502).json({ error: safe ? error.message : 'Checkout could not be opened. No payment was taken; please try again later.' });
  }
}
