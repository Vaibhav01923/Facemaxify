# Digital-footprint experiment

Direct URL: `/digital-footprint`. It is an independent Vite entry, without Clerk, third-party pixels, navigation links or a sitemap entry. It has `noindex` and `no-referrer` metadata and response headers.

Set **BRAVE_SEARCH_API_KEY** in Vercel and `.env.local` to enable the search endpoint. Never prefix this secret with VITE_. Each submission makes one Brave Web Search API request, focused on Indian results. Without a key the page explicitly offers manual Google searches instead of pretending it found profiles.

The visitor must enter a full name, an HTTPS profile URL from a supported platform, and confirm self-check consent. Ownership is self-attested, not independently verified. Names can include Indian scripts. The API does not visit the profile URL, retain reports, or return result snippets. Supported profile links are classified as possible matches only. The client can dismiss unrelated matches and clear its report.

Run `node --test tests/digital-footprint.test.mjs` and `npm run build`. The local Express backend exposes the same handler on `/api/digital-footprint`.

Before paid traffic: configure a Vercel firewall rate-limit rule on POST `/api/digital-footprint` (the handler only has per-instance burst protection), set the provider's spending limit, and test with your own profile. The endpoint is publicly accessible; consent is an attestation, not identity verification. Source coverage is limited to supported public profile platforms; this is not an exhaustive internet report.

Optional Meta integration: `FootprintSearchStarted` and `FootprintReportViewed` custom events are sent only if an `fbq` instance is supplied later. No name, profile link or result is attached. No advertising pixel is installed on this separate page by default.

## Mobile experience and offer

The standalone page includes a CSS-animated platform orbit, a real indeterminate request state, and a native modal pricing/exit flow. No percentage, fake finding, private/dating account or photo analysis is simulated. Reduced-motion preferences disable decorative motion. Native dialog provides focus containment; close/Escape on the pricing panel asks the exit question, while close/Escape on that question dismisses it. Skip and backdrop dismiss immediately.

Pricing is ₹99/day as confirmed by the owner and live checkout. SEARCH50 reduces this to ₹49.50/day on every renewal. POST /api/footprint-checkout uses the existing server-only DODO_PAYMENTS_API_KEY and DODO_PAYMENTS_MODE. The fixed product is pdt_0NqF4XmJ4WdvmWyEQJSaY. Client-supplied products, prices and coupons are ignored. Both offers verify the product billing interval and price; exit checkout additionally verifies SEARCH50 is 50%, valid for this product and indefinite. The installed SDK uses the supported discount_code field. A static payment-link discount_code query was tested and ignored by Dodo, so it is not used.

The local environment currently has no Dodo API key. Set it privately in .env.local and in Vercel, never in VITE_ variables or chat. Old VITE_FOOTPRINT_* checkout settings are no longer used. No API key or searched identity is sent from the browser to checkout. Anonymous per-instance rate limits apply; use Vercel firewall protection for deployment-wide limits.

Checkout integration is separate from fulfilment. Search membership authentication, payment-verified entitlement storage, cancellation/revocation handling and a post-payment report delivery flow still need implementing before selling. The existing facial-analysis webhook now explicitly excludes this product so a Search Tool payment does not grant the wrong app access. A return URL never unlocks a report. No payment was completed during verification.

## Checkout is currently disabled

The plans button, report CTA and pricing dialog are hidden (`CHECKOUT_ENABLED` in experience.tsx) and POST /api/footprint-checkout returns 503 unless `FOOTPRINT_CHECKOUT_ENABLED=true`. Re-enable both only after fulfilment is built.

Note: the checkout handler lives in api/_lib/footprint-checkout-handler.js (not api/) because Vercel Hobby allows 12 functions. Re-expose it as api/footprint-checkout.js when checkout is re-enabled and there is room.
