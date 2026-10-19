import { createPublicKey, createVerify } from 'node:crypto';

// Verifies a Clerk session token (the JWT Clerk's browser SDK hands out) properly: RS256 signature
// against Clerk's published keys, issuer, and expiry. Needed by routes that act on someone's billing
// (api/manage-subscription.js): the older generate-* routes only look at the token's shape, which is
// not enough when a forged token would open another person's billing portal.
//
// The Clerk "frontend API" host is encoded in the publishable key the site already has
// (VITE_CLERK_PUBLISHABLE_KEY: pk_live_<base64 of "clerk.example.com$">), and its public keys are at
// https://<host>/.well-known/jwks.json, so no extra secret or dependency is needed.

const JWKS_TTL_MS = 60 * 60 * 1000;
const CLOCK_TOLERANCE_S = 10;
let jwks = { host: '', at: 0, keys: [] };

export class ClerkAuthError extends Error {}

function frontendApiHost() {
  const key = process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || '';
  const encoded = key.split('_').slice(2).join('_');
  if (!encoded) throw new Error('VITE_CLERK_PUBLISHABLE_KEY is missing or malformed on the server');
  const host = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '');
  if (!/^[a-z0-9.-]+$/i.test(host)) throw new Error('could not read the Clerk frontend host from the publishable key');
  return host;
}

async function loadKeys(host, force) {
  if (!force && jwks.host === host && Date.now() - jwks.at < JWKS_TTL_MS) return jwks.keys;
  const res = await fetch(`https://${host}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`Clerk keys request failed (${res.status})`);
  const body = await res.json();
  jwks = { host, at: Date.now(), keys: Array.isArray(body.keys) ? body.keys : [] };
  return jwks.keys;
}

const decodePart = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

/** Checks an "Authorization: Bearer <session token>" header. Returns { userId } or throws ClerkAuthError. */
export async function verifyClerkSession(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new ClerkAuthError('missing token');
  }
  const parts = authorizationHeader.slice(7).trim().split('.');
  if (parts.length !== 3) throw new ClerkAuthError('malformed token');

  let header;
  let payload;
  try {
    header = decodePart(parts[0]);
    payload = decodePart(parts[1]);
  } catch {
    throw new ClerkAuthError('malformed token');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new ClerkAuthError('unsupported token');

  const host = frontendApiHost();
  let jwk = (await loadKeys(host, false)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await loadKeys(host, true)).find((k) => k.kid === header.kid); // keys rotate
  if (!jwk) throw new ClerkAuthError('unknown signing key');

  const verifier = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`);
  const valid = verifier.verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  if (!valid) throw new ClerkAuthError('bad signature');

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_TOLERANCE_S < now) throw new ClerkAuthError('expired token');
  if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_TOLERANCE_S > now) throw new ClerkAuthError('token not valid yet');
  if (payload.iss !== `https://${host}`) throw new ClerkAuthError('wrong issuer');
  if (!payload.sub) throw new ClerkAuthError('no subject');

  return { userId: payload.sub };
}
