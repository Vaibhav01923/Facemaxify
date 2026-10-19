import { PLAN, formatUsd } from "../api/_lib/pricing.js";

// The offer as the site states it. The numbers come from api/_lib/pricing.js, the same file the
// checkout (api/checkout.js) verifies against the product in Dodo, so every price on the site, the
// translated pages included, stays in step with what is charged. Wherever there is a buy button the
// full terms go next to it: never the first price on its own.
export const FIRST_PRICE = formatUsd(PLAN.firstPaymentCents);
export const MONTHLY_PRICE = formatUsd(PLAN.recurringCents);

/** Short price shown inside a buy button. The terms line below it carries the rest. */
export const FIRST_PRICE_LABEL = `${FIRST_PRICE} first month`;

/** The full terms, English: shown under every buy button on the English pages. */
export const PLAN_TERMS = `${FIRST_PRICE} for the first month, then ${MONTHLY_PRICE} per month. Renews monthly. Cancel anytime.`;
