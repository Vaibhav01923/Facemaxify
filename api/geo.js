// Which country is this request from? Used by the /stats country tracking (services/country.ts).
//
// Privacy: the country comes from the x-vercel-ip-country header that Vercel's edge adds to every request
// (an ISO 3166-1 alpha-2 code such as "IN" or "US"; the edge overwrites it, so a visitor cannot choose it).
// The IP address itself is never read, logged or stored here, and no third-party geo service is involved.
// Locally (no Vercel in front) the header is absent and the answer is null, which /stats shows as "Unknown".

export function countryFromHeaders(headers) {
  const raw = headers?.['x-vercel-ip-country'];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase();
  // "XX" / "T1" are the "unknown" and "Tor" placeholders some edges send: not a real country.
  return value && /^[A-Z]{2}$/.test(value) && value !== 'XX' ? value : null;
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  // The answer differs per visitor, so it must never be cached by the browser or a CDN.
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ country: countryFromHeaders(req.headers) });
}
