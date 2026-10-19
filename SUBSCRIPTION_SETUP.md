# Subscription plan: setup and test checklist

The paid plan is now **$0.99 for the first month, then $99.99 per month, cancel anytime** (one Dodo
subscription product with a "paid trial"). The numbers live in one file, `api/_lib/pricing.js`; every
price on the site is built from it, and `/api/checkout` refuses to start if the Dodo product does not
match it (so nobody is charged something other than what the page showed them).

## Status

Done already (via the connectors, 2026-10-19):
- Supabase (`aesthetix-ai`, production): `supabase_subscriptions.sql` applied; the 23 existing paid users are marked `legacy_access`.
- Dodo (live mode): product **`pdt_0Nq57UqramILeQLRbzWb7`** "Facemaxify Pro" created ($99.99/month, 30-day paid trial of $0.99, 10-year term) and read back.

Still to do by hand: set `DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID` in Vercel Production (this is the switch that turns the new checkout on; until then it answers "not available"), check `DODO_PAYMENTS_WEBHOOK_KEY`, add the webhook endpoint and events, deactivate/restrict the unrestricted coupons (`EARLY40`, `FREE100`, `9090`, `TESTONGEO`), then make one real $0.99 purchase and refund it.

The sections below were written for a test-mode run; the product and database steps above are already done in live mode.

## What is in the code

| Piece | File |
| --- | --- |
| Checkout starts the subscription (fixed product, no discount code, checks the Dodo product first) | `api/checkout.js` |
| Webhook: signature check, access on/off from the subscription lifecycle | `api/webhooks/dodo.js`, `api/_lib/subscriptionAccess.js` |
| "Manage subscription" opens Dodo's customer portal (verified Clerk token) | `api/manage-subscription.js`, `api/_lib/clerkAuth.js` |
| Database changes (new SQL, not run) | `supabase_subscriptions.sql` |
| Prices and terms shown to visitors | `i18n/offer.ts`, `hooks/useRegionalDiscount.ts`, landing page, dashboard, FAQ, Spanish/Japanese pages (`i18n/strings.tsx`) |
| Access rule in the browser (a cancelled plan ends when its paid period ends) | `services/subscription.ts`, `App.tsx` |

Access rules for subscribers: first payment turns access on; renewals keep it on; a failed renewal
that Dodo puts on hold turns it off (it comes back if they fix their card); a cancellation keeps
access until the end of the period already paid for; an expired subscription turns it off.

People who bought before are untouched: their row has `isPaid = true` and `subscription_status`
empty, and only events for a subscription id saved in `user_billing` can switch anything off. The SQL
also marks everyone paid today as `legacy_access = true`, which no subscription event can undo.

## 1. Dodo dashboard (test mode first, then repeat in live mode)

You create these yourself; the code never creates products or reads secrets.

1. **Product**: Products > Create > **Subscription**.
   - Price **$99.99 USD**, billed every **1 month**.
   - **Subscription period (term)**: a long one, for example **10 years**. If it is 1 month the
     subscription *expires* after the first month instead of renewing.
   - **Trial Period Days: 30** and **Trial Amount: $0.99** (99 cents). This is the "paid trial": the
     customer pays $0.99 at checkout and the full price is charged at the first renewal, 30 days later.
   - Product discount **0%**. Leave "apply discounts to the trial" off.
   - Tax: Dodo adds sales tax/VAT where it applies; unless you mark the price tax-inclusive, the
     amount the customer pays today can be slightly above $0.99 in some countries.
   - Copy the product id (`pdt_...`).
2. **Webhook**: Developer > Webhooks > add endpoint `https://facemaxify.com/api/webhooks/dodo`
   (for testing, your Vercel preview URL + `/api/webhooks/dodo`). Subscribe to:
   `payment.succeeded`, `subscription.active`, `subscription.renewed`, `subscription.updated`,
   `subscription.plan_changed`, `subscription.past_due`, `subscription.on_hold`,
   `subscription.paused`, `subscription.cancelled`, `subscription.expired`.
   Copy the endpoint's signing secret.
3. **Customer portal**: open a test customer's portal once (step 4 below) and confirm it offers
   *cancel subscription*; if cancellation is off, turn it on in Dodo's settings.
4. **Coupon `EARLY40`**: the old checkout applied it automatically. Deactivate it, or restrict it to
   the old product. The code no longer sends any discount code, and a 40% coupon with no cycle limit
   would cut every monthly renewal.
5. **Old product**: leave it alone for now (see "Things to check" about existing subscribers).
   Do not archive it before you have looked at what that does to anyone still billed on it.

## 2. Environment variables (Vercel > Project Settings > Environment Variables)

| Name | Value | Scope |
| --- | --- | --- |
| `DODO_PAYMENTS_API_KEY` | `sk_test_...` for testing, `sk_live_...` for live (test/live is detected from the prefix) | Preview = test key, Production = live key |
| `DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID` | **new**: the `pdt_...` id from step 1 (test and live products have different ids) | same split |
| `DODO_PAYMENTS_WEBHOOK_KEY` | the signing secret of that environment's webhook endpoint | same split |
| `DODO_PAYMENTS_SUCCESS_URL` | unchanged (defaults to `https://facemaxify.com/dashboard`) | |
| `DODO_PAYMENTS_PRODUCT_ID` | the old product; no longer used, can stay or go | |
| `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | already set; the new routes read them | |

Until `DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID` is set, checkout answers "not available right now".
That is deliberate: it never falls back to the old product while the page promises $0.99.

## 3. Supabase

Run `supabase_subscriptions.sql` in the SQL editor of a **test project or branch first**, then in
production **before** the new code goes live. It only adds columns, a table (`user_billing`, service
role only) and an optional function; it never turns anyone's access off. Optionally schedule
`select public.expire_lapsed_subscriptions()` daily with pg_cron (the comment in the file has the line).

## 4. End-to-end test in test mode

Use a Vercel **Preview** deployment of this branch with the Preview-scope variables above, ideally
against a test Supabase project (a test purchase writes to whichever `users` table the deployment uses).

1. Sign in with a brand-new test email. The dashboard locked cards show "$0.99 first month" plus
   "$0.99 for the first month, then $99.99 per month. Renews monthly. Cancel anytime." under every Unlock button.
2. Click Unlock. The Dodo page must show **$0.99 due today** and **$99.99 per month after 30 days**.
   If it shows anything else, stop: the product setup is wrong (checkout also refuses to start for a
   wrong price/trial it can read).
3. Pay with Dodo's test card `4242 4242 4242 4242`. You land on the dashboard; it should unlock
   (Pro, "Renews <date ~30 days out>").
4. Check: Dodo > Webhooks > the endpoint shows 200 for every delivery. In Supabase, the `users` row has
   `isPaid = true`, `subscription_status = 'active'`, a period end; `user_billing` has the ids.
5. **Manage subscription** (left rail on desktop, "Billing" on phones) opens the Dodo portal. Cancel
   there. The dashboard should say "Cancelled · access until <date>" and stay unlocked until then.
   Note the time `subscription.cancelled` arrived (Dodo's docs do not say whether it fires when the
   cancellation is scheduled or when the period ends; both are handled).
6. Renewal and failure paths: Dodo test mode runs on real time (30 days). To see them sooner, send
   test events from the webhook page, or create a second *test* product with a 1-day trial and watch
   the renewal; a declined card on renewal should end in `subscription.on_hold` and turn access off.
7. Old buyers: in Supabase, pick an existing paid user; confirm `isPaid` is still true and
   `legacy_access = true` after the SQL, and that none of the test events changed them.
8. Forged webhook: `curl -X POST https://<preview>/api/webhooks/dodo -d '{"type":"payment.succeeded"}'`
   must answer **400**.

Go live: set the Production variables to the live key/product/webhook, run the SQL on production,
deploy, make one real $0.99 purchase with your own card, cancel it in the portal, refund it in Dodo.

## Things to check or decide (found while reading the flow)

- **The webhook did not verify signatures before this change.** The old code passed the headers to
  `webhooks.unwrap(...)` in a way that skipped the check, so anyone who knew the URL could post a
  fake `payment.succeeded` and unlock any email. It is fixed here. That also means a wrong
  `DODO_PAYMENTS_WEBHOOK_KEY` in Production, which used to be harmless, would now make every webhook
  fail with 400 and nobody would be unlocked. Confirm the Production secret matches the live
  endpoint (step 4.4 on a test deployment proves the code path).
- **Existing customers may already be on a recurring product.** The code and the old landing page
  said "one-time payment, lifetime access", but you describe $5.99 recurring monthly, and the old
  code used the `EARLY40` coupon on what looks like a $9.99/month product. Open the old product in
  Dodo and check. If it is recurring, those customers keep being billed $5.99 and keep access (this
  change does not touch them), and the site has never turned their access off when they cancel.
  That is unchanged here; say if you want it handled.
- **$99.99/month** is far above the usual price for this kind of product and the $0.99 hook makes the
  renewal a large surprise. Expect disputes and refund requests; the terms are shown at every buy
  button and on the checkout page, which is what protects you in a dispute. You confirmed this amount.
- Refunds and disputes still do not switch access off (same as before).
- The Spanish and Japanese "full report" lists still mention "improvement guides", which were removed
  from the dashboard earlier; I left that copy alone.
