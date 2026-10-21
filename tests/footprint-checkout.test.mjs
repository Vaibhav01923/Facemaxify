import test from 'node:test';
import assert from 'node:assert/strict';
import { createFootprintCheckout, FOOTPRINT_PRODUCT } from '../api/_lib/footprint-checkout.js';
import handler from '../api/footprint-checkout.js';
function mock(overrides = {}) {
  let payload;
  return { get payload() { return payload; },
    products: { retrieve: async id => { assert.equal(id, FOOTPRINT_PRODUCT); return { price: { type: 'recurring_price', currency: 'INR', price: 9900, payment_frequency_count: 1, payment_frequency_interval: 'Day', ...overrides.price } }; } },
    discounts: { retrieveByCode: async code => { assert.equal(code, 'SEARCH50'); return { type: 'percentage', amount: 5000, subscription_cycles: null, restricted_to: [FOOTPRINT_PRODUCT], ...overrides.coupon }; } },
    checkoutSessions: { create: async data => { payload = data; return { checkout_url: 'https://checkout.dodopayments.com/session/test' }; } },
  };
}
test('regular checkout uses only the fixed product and no default coupon', async () => {
  const c = mock(); await createFootprintCheckout(c, 'standard');
  assert.deepEqual(c.payload.product_cart, [{product_id: FOOTPRINT_PRODUCT, quantity: 1}]);
  assert.equal(c.payload.discount_code, undefined);
  assert.equal(c.payload.metadata.source, 'digital-footprint');
});
test('exit checkout applies SEARCH50 automatically', async () => {
  const c = mock(); await createFootprintCheckout(c, 'exit'); assert.equal(c.payload.discount_code, 'SEARCH50');
});
test('billing mismatch and non-recurring discounts fail closed', async () => {
  for (const price of [{price: 99000}, {payment_frequency_interval: 'Month'}, {currency: 'USD'}]) {
    const c = mock({price}); await assert.rejects(createFootprintCheckout(c,'standard')); assert.equal(c.payload, undefined);
  }
  for (const coupon of [{amount:4000}, {subscription_cycles:1}, {restricted_to:['other']}, {expires_at:'2000-01-01'}]) {
    const c = mock({coupon}); await assert.rejects(createFootprintCheckout(c,'exit')); assert.equal(c.payload, undefined);
  }
});
test('endpoint rejects bad input and handles a missing key without leaking credentials', async () => {
  const previous = process.env.DODO_PAYMENTS_API_KEY; delete process.env.DODO_PAYMENTS_API_KEY;
  const res = { code:200, setHeader(){}, status(code){this.code=code;return this;}, json(body){this.body=body;return this;} };
  try {
    await handler({method:'DELETE'},res); assert.equal(res.code,405);
    await handler({method:'POST',body:{offer:'fake'}},res); assert.equal(res.code,400);
    await handler({method:'POST',body:{offer:'exit'},headers:{}},res); assert.equal(res.code,503);
  } finally { if(previous !== undefined) process.env.DODO_PAYMENTS_API_KEY=previous; }
});
