import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionToken, sessionFromToken, verifyFootprintAccess, PRODUCT } from '../api/_lib/footprint-access.js';
import { sourceUrls, anthropicProfileSearch } from '../api/_lib/footprint-search.js';

test('checkout ownership cannot be forged, tampered with or reused after expiry', () => {
  const token = sessionToken('cks_test', 'secret', 1000);
  assert.equal(sessionFromToken(token, 'secret', 2000), 'cks_test');
  assert.equal(sessionFromToken(token, 'different', 2000), null);
  assert.equal(sessionFromToken(token + 'x', 'secret', 2000), null);
  assert.equal(sessionFromToken(token, 'secret', 1000 + 366 * 86400000), null);
});
test('only the paid, correct-product active subscription grants report access', async () => {
  const previous = process.env.DODO_PAYMENTS_API_KEY;
  process.env.DODO_PAYMENTS_API_KEY = 'test-secret';
  let status = 'active'; let product = PRODUCT;
  const client = {
    checkoutSessions: { retrieve: async () => ({ payment_status: 'succeeded', payment_id: 'pay_test' }) },
    payments: { retrieve: async () => ({ status: 'succeeded', subscription_id: 'sub_test', customer: {customer_id:'cus_test'} }) },
    subscriptions: { retrieve: async () => ({ status, product_id: product, customer:{customer_id:'cus_test'}, next_billing_date: new Date(Date.now()+3600000).toISOString() }) },
  };
  const req = { headers:{cookie:'__Host-footprint='+sessionToken('cks_test','test-secret')} };
  try {
    assert.equal((await verifyFootprintAccess(req,client)).active,true);
    status='on_hold'; assert.equal((await verifyFootprintAccess(req,client)).active,false);
    status='active'; product='other'; assert.equal((await verifyFootprintAccess(req,client)).active,false);
    assert.equal((await verifyFootprintAccess({headers:{}},client)).active,false);
  } finally { if(previous===undefined) delete process.env.DODO_PAYMENTS_API_KEY; else process.env.DODO_PAYMENTS_API_KEY=previous; }
});
test('Anthropic search returns provider source URLs, never fabricated model text', async () => {
  const original = globalThis.fetch;
  const body = {content:[{type:'text',text:'https://github.com/fabricated'}, {type:'web_search_tool_result',content:[{type:'web_search_result',url:'https://github.com/example'}]}]};
  assert.deepEqual(sourceUrls(body), [{url:'https://github.com/example'}]);
  globalThis.fetch = async (url, options) => {
    assert.equal(url,'https://api.anthropic.com/v1/messages');
    const request=JSON.parse(options.body);
    assert.equal(request.tools[0].max_uses,2);
    assert.equal(request.model,'claude-haiku-4-5-20251001');
    return {ok:true,json:async()=>body};
  };
  try { assert.deepEqual(await anthropicProfileSearch({name:'Example Person',profile:{handle:'example'}}), [{url:'https://github.com/example'}]); }
  finally { globalThis.fetch=original; }
});
