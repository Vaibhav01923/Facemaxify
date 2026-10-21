import DodoPayments from 'dodopayments';
import { createHash } from 'node:crypto';
import { createFootprintCheckout } from './_lib/footprint-checkout.js';

const requests = new Map();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  if (!['standard', 'exit'].includes(req.body?.offer)) return res.status(400).json({ error: 'Choose a valid report offer.' });
  // Disabled until post-payment fulfilment exists; set FOOTPRINT_CHECKOUT_ENABLED=true to re-open.
  if (process.env.FOOTPRINT_CHECKOUT_ENABLED !== 'true') return res.status(503).json({ error: 'Report plans are not available yet.' });
  const now = Date.now();
  for (const [key, entry] of requests) if (entry.until < now) requests.delete(key);
  const key = createHash('sha256').update(String(req.headers['x-real-ip'] || req.socket?.remoteAddress || 'local')).digest('hex');
  const entry = requests.get(key) || { count: 0, until: now + 60000 };
  if (requests.size >= 1000 || ++entry.count > 5) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: 'Please wait a minute before trying checkout again.' }); }
  requests.set(key, entry);
  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'Secure checkout is not configured yet. Please try again later.' });
  const environment = process.env.DODO_PAYMENTS_MODE || (apiKey.startsWith('sk_test_') ? 'test_mode' : 'live_mode');
  try {
    const client = new DodoPayments({ bearerToken: apiKey, environment, timeout: 15000, maxRetries: 0 });
    return res.json({ checkout_url: await createFootprintCheckout(client, req.body.offer) });
  } catch (error) {
    const safe = ['Checkout is paused', 'The recurring 50% offer'].some(prefix => error.message?.startsWith(prefix));
    return res.status(502).json({ error: safe ? error.message : 'Checkout could not be opened. No payment was taken; please try again later.' });
  }
}
