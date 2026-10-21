export const FOOTPRINT_PRODUCT = 'pdt_0NqF4XmJ4WdvmWyEQJSaY';
export const FOOTPRINT_DISCOUNT = 'SEARCH50';

export async function createFootprintCheckout(client, offer, onSession) {
  if (!['standard', 'exit'].includes(offer)) throw new Error('Choose a valid report offer.');
  const product = await client.products.retrieve(FOOTPRINT_PRODUCT);
  const p = product.price;
  if (product.is_archived || p?.type !== 'recurring_price' || p.currency !== 'INR' || p.price !== 9900 ||
      p.payment_frequency_count !== 1 || p.payment_frequency_interval !== 'Day' && p.payment_frequency_interval !== 'day' ||
      p.discount || p.trial_period_days) {
    throw new Error('Checkout is paused while the product price and daily billing settings are checked.');
  }
  if (offer === 'exit') {
    const coupon = await client.discounts.retrieveByCode(FOOTPRINT_DISCOUNT);
    if (coupon.type !== 'percentage' || coupon.amount !== 5000 || coupon.subscription_cycles != null ||
        (coupon.restricted_to?.length && !coupon.restricted_to.includes(FOOTPRINT_PRODUCT)) ||
        (coupon.expires_at && Date.parse(coupon.expires_at) <= Date.now()) ||
        (coupon.usage_limit != null && coupon.times_used >= coupon.usage_limit)) {
      throw new Error('The recurring 50% offer is unavailable. You have not been charged.');
    }
  }
  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: FOOTPRINT_PRODUCT, quantity: 1 }],
    ...(offer === 'exit' ? { discount_code: FOOTPRINT_DISCOUNT } : {}),
    billing_currency: 'INR',
    feature_flags: { allow_currency_selection: false },
    metadata: { source: 'digital-footprint', offer },
    return_url: 'https://facemaxify.com/digital-footprint?checkout=returned',
  });
  const url = new URL(session.checkout_url);
  if (url.protocol !== 'https:' || !['checkout.dodopayments.com', 'test.checkout.dodopayments.com'].includes(url.hostname)) {
    throw new Error('Checkout returned an invalid destination.');
  }
  if (onSession) onSession(session.session_id);
  return url.href;
}
