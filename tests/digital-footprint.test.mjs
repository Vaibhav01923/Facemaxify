import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/digital-footprint.js';
import { validateInput, publicProfile, profileResults } from '../api/_lib/footprint.js';

const input = { name: 'Aanya Sharma', profile: 'https://www.linkedin.com/in/aanya-sharma?trk=tracking', consent: true };
function response() {
  return { headers: {}, code: 200, body: null, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(body) { this.body=body; return this; } };
}
test('requires self-check consent and supports Indian-script names', () => {
  assert.throws(() => validateInput({ ...input, consent: false }));
  assert.equal(validateInput({ ...input, name: 'आन्या शर्मा' }).name, 'आन्या शर्मा');
  assert.equal(validateInput(input).profile.url, 'https://linkedin.com/in/aanya-sharma');
});
test('rejects unsafe URLs, lookalike domains, non-profile URLs and query injection', () => {
  for (const url of ['https://127.0.0.1/private','http://github.com/aanya','https://github.com.evil.com/aanya','https://user:pass@github.com/aanya','https://github.com:444/aanya','https://instagram.com/accounts','https://instagram.com/p/abc','javascript:alert(1)']) assert.equal(publicProfile(url), null, url);
  assert.throws(() => validateInput({ ...input, name: 'Aanya " OR phone:' }));
});
test('results are supported profile links only, deduplicated, with no provider snippets', () => {
  const profile = validateInput(input).profile;
  const result = profileResults([
    { url: profile.url }, { url: 'https://github.com/aanya', description: 'private phone 12345' },
    { url: 'https://www.github.com/aanya?tracking=1' }, { url: 'https://people-search.example/address' },
    { url: 'https://instagram.com/p/post' }, { url: 'javascript:alert(1)' },
  ], profile);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'possible');
  assert.equal(JSON.stringify(result).includes('12345'), false);
});
test('missing credentials do not fabricate results before access is verified', async () => {
  const method = response(); await handler({ method:'GET', headers:{} }, method); assert.equal(method.code,405);
  const invalid = response(); await handler({ method:'POST', headers:{}, body:{ ...input, consent:false } },invalid); assert.equal(invalid.code,400);
  const key = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  try {
    const res = response(); await handler({ method:'POST', headers:{}, body:input },res);
    assert.equal(res.code,402); assert.equal(res.headers['Cache-Control'],'private, no-store'); assert.equal(res.body.code,'MEMBERSHIP_REQUIRED');
  } finally { if (key) process.env.ANTHROPIC_API_KEY=key; }
});
test('unpaid requests cannot run provider search', async () => {
  const original = globalThis.fetch; const key = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY='unit-test-key';
  globalThis.fetch = async (url, options) => {
    assert.fail('An unpaid request must not call Anthropic.');
  };
  try {
    const res=response(); await handler({method:'POST',headers:{},body:input},res);
    assert.equal(res.code,402); assert.equal(res.body.code,'MEMBERSHIP_REQUIRED');
  } finally { globalThis.fetch=original; if(key) process.env.ANTHROPIC_API_KEY=key; else delete process.env.ANTHROPIC_API_KEY; }
});
