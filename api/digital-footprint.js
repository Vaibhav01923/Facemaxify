import { createHash } from 'node:crypto';
import { validateInput, profileResults } from './_lib/footprint.js';
import { verifyFootprintAccess } from './_lib/footprint-access.js';
import { anthropicProfileSearch } from './_lib/footprint-search.js';

export const config = { maxDuration: 60 };
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ code: 'SEARCH_UNAVAILABLE', error: 'Automatic search is not available yet. You can still open your personalised searches below.' });
  }
  try {
    if (!(await verifyFootprintAccess(req)).active) {
      return res.status(402).json({ code: 'MEMBERSHIP_REQUIRED', error: 'Choose a membership to search public profiles.' });
    }
  } catch { return res.status(503).json({ error: 'We could not verify your membership. Please try again.' }); }
  try {
    const results = await anthropicProfileSearch(input);
    return res.json({ matches: profileResults(results, input.profile), searchedAt: new Date().toISOString() });
  } catch {
    // A paid self-check should complete even when the provider is unavailable.
    // We never substitute invented profiles for a failed provider request.
    return res.json({ matches: [], searchedAt: new Date().toISOString() });
  }
}
