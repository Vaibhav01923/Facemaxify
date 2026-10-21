import { createHmac, timingSafeEqual } from 'node:crypto';
import DodoPayments from 'dodopayments';
import { resolveDodoMode } from './dodoClient.js';

export const PRODUCT = 'pdt_0NqF4XmJ4WdvmWyEQJSaY';
const COOKIE = '__Host-footprint';
export function clientForFootprint() {
  const key = process.env.DODO_PAYMENTS_API_KEY?.trim();
  return key ? new DodoPayments({ bearerToken: key, environment: resolveDodoMode(key), timeout: 12000, maxRetries: 0 }) : null;
}
function signature(payload, secret) { return createHmac('sha256', secret).update('footprint-access:v1:' + payload).digest('base64url'); }
export function sessionToken(sessionId, secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sessionId, expires: now + 365 * 86400000 })).toString('base64url');
  return payload + '.' + signature(payload, secret);
}
export function sessionFromToken(token, secret, now = Date.now()) {
  try {
    const [payload, sig, extra] = token.split('.');
    if (extra || !payload || !sig || !secret || token.length > 2000) return null;
    const expected = Buffer.from(signature(payload, secret)); const actual = Buffer.from(sig);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.expires > now && /^cks_[a-zA-Z0-9]+$/.test(data.sessionId) ? data.sessionId : null;
  } catch { return null; }
}
export function saveCheckoutCookie(res, sessionId) {
  res.setHeader('Set-Cookie', `${COOKIE}=${sessionToken(sessionId, process.env.DODO_PAYMENTS_API_KEY.trim())}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`);
}
export async function verifyFootprintAccess(req, client = clientForFootprint()) {
  const token = String(req.headers?.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  const id = sessionFromToken(token || '', process.env.DODO_PAYMENTS_API_KEY?.trim());
  if (!id || !client) return { active: false };
  const session = await client.checkoutSessions.retrieve(id);
  if (session.payment_status !== 'succeeded' || !session.payment_id) return { active: false, pending: true };
  const payment = await client.payments.retrieve(session.payment_id);
  if (payment.status !== 'succeeded' || !payment.subscription_id) return { active: false };
  const subscription = await client.subscriptions.retrieve(payment.subscription_id);
  if (subscription.product_id !== PRODUCT || subscription.customer?.customer_id !== payment.customer?.customer_id) return { active: false };
  const paidPeriodRemaining = Date.parse(subscription.next_billing_date) > Date.now();
  const active = subscription.status === 'active' || (subscription.status === 'cancelled' && paidPeriodRemaining);
  return { active, customerId: subscription.customer.customer_id, status: subscription.status };
}
