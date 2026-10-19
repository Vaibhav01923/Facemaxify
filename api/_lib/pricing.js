// The paid plan, in one place. api/checkout.js checks it against the product in the Dodo dashboard,
// and every price the site shows is built from it (i18n/offer.ts), so the terms next to a buy button
// and what Dodo actually charges cannot drift apart without the checkout refusing to start.
//
// The plan: a small first payment that covers the first period, then the full price every month.
// In Dodo that is ONE subscription product with a "paid trial": recurring price = recurringCents,
// Trial Period Days = firstPeriodDays, Trial Amount = firstPaymentCents (see SUBSCRIPTION_SETUP.md).
export const PLAN = Object.freeze({
  currency: 'USD',
  firstPaymentCents: 99,
  firstPeriodDays: 30,
  recurringCents: 9999,
  interval: 'Month',
});

/** 99 -> "$0.99", 9999 -> "$99.99" */
export const formatUsd = (cents) => `$${(cents / 100).toFixed(2)}`;
