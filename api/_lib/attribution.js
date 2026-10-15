// First-party attribution for the paid product, shared by the browser (services/attribution.ts) and
// the serverless functions (api/checkout.js): which page a visitor started on, which page they
// clicked "full report" on, and which language they use. It lives in one cookie, so the checkout
// request carries it and can stamp it onto the payment.
//
// The cookie is controlled by the visitor, so everything read from it is validated here before
// it goes anywhere (payment metadata, prompts, logs).
export const COOKIE_NAME = "fmx_attr";
export const SITE_LANGS = ["en", "es", "ja"];

const PATH_PATTERN = /^\/[A-Za-z0-9\-_.~/]{0,119}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

// A site path without query string, hash or trailing slash; undefined when it isn't a plain path.
export function cleanPath(value) {
  if (typeof value !== "string") return undefined;
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  // Plain site paths only: no "..", and no "//" (which could read as another host).
  if (path.includes("..") || path.includes("//")) return undefined;
  return PATH_PATTERN.test(path) ? path : undefined;
}

export function cleanAttribution(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const clean = {};
  const landing = cleanPath(input.landing);
  if (landing) clean.landing = landing;
  const source = cleanPath(input.source);
  if (source) clean.source = source;
  if (SITE_LANGS.includes(input.lang)) clean.lang = input.lang;
  if (typeof input.at === "string" && ISO_PATTERN.test(input.at)) clean.at = input.at;
  return clean;
}

export function serializeAttribution(attribution) {
  return encodeURIComponent(JSON.stringify(cleanAttribution(attribution)));
}

export function parseAttribution(value) {
  try {
    return cleanAttribution(JSON.parse(decodeURIComponent(value)));
  } catch {
    return {};
  }
}

// Reads the attribution out of a Cookie request header ("a=1; fmx_attr=...; b=2").
export function attributionFromCookieHeader(header) {
  if (typeof header !== "string") return {};
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return parseAttribution(rest.join("="));
  }
  return {};
}

// Payment metadata (Dodo wants string values) so each sale shows where its buyer came from.
export function attributionMetadata(attribution) {
  const metadata = {};
  if (attribution.landing) metadata.landing_page = attribution.landing;
  if (attribution.source) metadata.source_page = attribution.source;
  if (attribution.lang) metadata.language = attribution.lang;
  if (attribution.at) metadata.first_seen = attribution.at;
  return metadata;
}
