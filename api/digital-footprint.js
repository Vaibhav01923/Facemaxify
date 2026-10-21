import { createHash } from 'node:crypto';
import { validateInput, searchQueries, profileResults } from './_lib/footprint.js';

// Per-instance burst protection; use a Vercel firewall rate-limit rule for deployment-wide protection.
const windows = new Map();
function allowed(req) {
  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'local';
  const key = createHash('sha256').update(String(ip)).digest('hex');
  const now = Date.now();
  for (const [id, entry] of windows) if (entry.until < now) windows.delete(id);
  const entry = windows.get(key) || { count: 0, until: now + 60_000 };
  windows.set(key, entry);
  return ++entry.count <= 4 && windows.size <= 1000;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  let input;
  try { input = validateInput(req.body); }
  catch (error) { return res.status(400).json({ error: error.message }); }
  if (!allowed(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Please wait a minute before searching again.' });
  }
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    return res.status(503).json({ code: 'SEARCH_UNAVAILABLE', error: 'Automatic search is not available yet. You can still open your personalised searches below.' });
  }
  try {
    const items = [];
    // One combined query keeps each check to one provider request.
    const queries = searchQueries(input.name, input.profile);
    const q = `("${input.name}" OR "${input.profile.handle}") ${queries[0].slice(queries[0].indexOf('(site:'))}`;
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.search = new URLSearchParams({ q, count: '20', country: 'IN', search_lang: 'en', safesearch: 'strict' }).toString();
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error('Search provider unavailable');
    const data = await response.json();
    items.push(...(Array.isArray(data.web?.results) ? data.web.results : []));
    return res.status(200).json({ matches: profileResults(items, input.profile), searchedAt: new Date().toISOString() });
  } catch {
    return res.status(502).json({ code: 'SEARCH_UNAVAILABLE', error: 'Search could not finish. Try again, or open your personalised searches below.' });
  }
}
