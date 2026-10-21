// Only public profile platforms are supported. We never fetch visitor-supplied URLs.
const platforms = new Map([
  ['instagram.com', /^\/[\w.]+\/?$/],
  ['linkedin.com', /^\/in\/[\w%-]+\/?$/],
  ['github.com', /^\/[\w-]+\/?$/],
  ['x.com', /^\/[\w]+\/?$/],
  ['twitter.com', /^\/[\w]+\/?$/],
  ['youtube.com', /^\/@[\w.%-]+\/?$/],
]);
const reserved = /^(accounts|explore|login|signup|reel|reels|p|stories|settings|search|home|intent|share|watch|shorts)$/i;

export function publicProfile(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const handle = url.pathname.split('/').filter(Boolean).at(-1) || '';
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !platforms.get(host)?.test(url.pathname) || reserved.test(handle)) return null;
    return { url: `https://${host}${url.pathname.replace(/\/$/, '')}`, host, handle };
  } catch { return null; }
}

export function validateInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Enter your name and a public profile you own.');
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 3 || name.length > 80 || !/^[\p{L}\p{M} .’'-]+$/u.test(name)) throw new Error('Enter your full name using letters, spaces, apostrophes or hyphens.');
  const profile = typeof body.profile === 'string' && body.profile.length < 500 ? publicProfile(body.profile) : null;
  if (!profile) throw new Error('Use an HTTPS profile link from Instagram, LinkedIn, GitHub, X or YouTube.');
  if (body.consent !== true) throw new Error('Confirm that you are checking your own digital footprint.');
  return { name, profile };
}

export function searchQueries(name, profile) {
  const sites = '(site:instagram.com OR site:linkedin.com/in OR site:github.com OR site:x.com OR site:youtube.com/@)';
  return [`"${name}" ${sites}`, `"${profile.handle}" ${sites}`];
}

export function profileResults(items, supplied) {
  const seen = new Set([supplied.url]);
  return items.flatMap(item => {
    const profile = publicProfile(item?.url);
    if (!profile || seen.has(profile.url)) return [];
    seen.add(profile.url);
    // Do not return search snippets: they can include phone numbers, addresses or other sensitive details.
    return [{ url: profile.url, platform: profile.host, handle: profile.handle, status: 'possible' }];
  }).slice(0, 12);
}
