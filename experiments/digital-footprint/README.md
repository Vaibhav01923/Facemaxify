# Digital-footprint experiment

Direct URL: `/digital-footprint`. It is an independent Vite entry, without Clerk, third-party pixels, navigation links or a sitemap entry. It has `noindex` and `no-referrer` metadata and response headers.

The search endpoint uses the server-only **ANTHROPIC_API_KEY** and Claude web search. Never prefix this secret with VITE_. Each submission makes no more than two searches, restricted to the supported public profile platforms. Without a key the page explicitly offers manual Google searches instead of pretending it found profiles.

The visitor must enter a full name, an HTTPS profile URL from a supported platform, and confirm self-check consent. Ownership is self-attested, not independently verified. Names can include Indian scripts. The API does not visit the profile URL, retain reports, or return result snippets. Supported profile links are classified as possible matches only. The client can dismiss unrelated matches and clear its report.

Run `node --test tests/digital-footprint.test.mjs` and `npm run build`. The local Express backend exposes the same handler on `/api/digital-footprint`.

Before paid traffic: configure a Vercel firewall rate-limit rule on POST `/api/digital-footprint` (the handler only has per-instance burst protection), set the provider's spending limit, and test with your own profile. The endpoint is publicly accessible; consent is an attestation, not identity verification. Source coverage is limited to supported public profile platforms; this is not an exhaustive internet report.

Optional Meta integration: `FootprintSearchStarted` and `FootprintReportViewed` custom events are sent only if an `fbq` instance is supplied later. No name, profile link or result is attached. No advertising pixel is installed on this separate page by default.

## Mobile experience and offer

The standalone page includes a CSS-animated platform orbit, a real indeterminate request state, and a native modal pricing/exit flow. No percentage, fake finding, private/dating account or photo analysis is simulated. Reduced-motion preferences disable decorative motion. Native dialog provides focus containment; close/Escape on the pricing panel asks the exit question, while close/Escape on that question dismisses it. Skip and backdrop dismiss immediately.

Pricing is ₹99/day. SEARCH50 reduces this to ₹49.50/day on every renewal. POST /api/footprint-checkout uses the existing server-only DODO_PAYMENTS_API_KEY and DODO_PAYMENTS_MODE. The fixed product is pdt_0NqF4XmJ4WdvmWyEQJSaY. Client-supplied products, prices and coupons are ignored. Both offers verify the product price and daily cadence; the exit offer additionally verifies SEARCH50 is 50%, applies to this product, and is indefinite. The installed SDK uses the supported discount_code field. A static payment-link discount_code query was tested and ignored by Dodo, so it is not used.

The server writes a signed, HttpOnly, Secure, SameSite cookie when it creates the Dodo checkout session. After Dodo returns to the page, each search verifies the paid checkout session and the live subscription status from Dodo. The correct product with an active subscription, or an unexpired paid cancelled period, grants access. Redirect query parameters alone never unlock anything. The Dodo billing portal lets the buyer manage or cancel their subscription. The existing facial-analysis webhook excludes this product so it cannot grant the unrelated app plan. No database migration is needed for report access.

If Anthropic cannot complete a paid search, the report returns an empty supported-profile list. It never invents profiles or claims that a match was found.
