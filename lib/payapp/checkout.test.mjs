import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
const { NextRequest } = require('next/server');

function checkout() {
  const writes = [], providerCalls = [], module = { exports: {} };
  const server = {
    CLAIM_COOKIE: 'payapp_claim', PAYAPP_ORIGIN: 'https://www.bohuminsight.com',
    payappEnabled: () => true, digest: value => value,
    paymentDb: () => ({ from: () => ({
      insert: async value => { writes.push(value); return { error: null }; },
      update: () => ({ eq: async () => ({ error: null }) }),
    }) }),
    requestPayapp: async value => { providerCalls.push(value); return new URLSearchParams('rebill_no=123&payurl=https%3A%2F%2Fpayapp.kr%2Ftest'); },
  };
  const code = ts.transpileModule(readFileSync(new URL('../../app/api/payapp/checkout/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name === '@/lib/payapp/server' ? server : name === '@/lib/payapp/plans' ? { PAYAPP_SUBSCRIPTION: { amounts: [9900,12000,14000], cycleDay: 10, expiresOn: '2080-08-20', productName: '보험나무구독' } } : require(name), process: { env: { PAYAPP_USER_ID: 'seller' } }, URL, URLSearchParams, Date });
  return { ...module.exports, writes, providerCalls };
}
function request(body) {
  return new NextRequest('https://www.bohuminsight.com/api/payapp/checkout', { method: 'POST', headers: { origin: 'https://www.bohuminsight.com', 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
test('blank checkout Instagram creates an unbound order with a browser claim', async () => {
  const api = checkout();
  const response = await api.POST(request({ amount: 9900, instagramId: '' }));
  assert.equal(response.status, 200);
  assert.equal(api.writes[0].instagram_id, null);
  assert.match(response.headers.get('set-cookie'), /payapp_claim=.*HttpOnly/);
  assert.equal(api.providerCalls[0].feedbackurl, 'https://www.bohuminsight.com/api/payapp/feedback');
});
test('optional IDs are normalized and malformed IDs cannot start payment', async () => {
  const api = checkout();
  assert.equal((await api.POST(request({ amount: 12000, instagramId: ' @Example_1 ' }))).status, 200);
  assert.equal(api.writes[0].instagram_id, 'example_1');
  const invalid = checkout();
  assert.equal((await invalid.POST(request({ amount: 9900, instagramId: 'not an id' }))).status, 400);
  assert.equal(invalid.providerCalls.length, 0);
});
