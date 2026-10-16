import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(fetchImpl) {
  const module = { exports: {} };
  const process = { env: { PAYAPP_USER_ID:'seller', PAYAPP_LINK_KEY:'key=', PAYAPP_LINK_VALUE:'value=' } };
  const code = ts.transpileModule(readFileSync(new URL('./server.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports:module.exports, require: name => name === 'server-only' ? {} : require(name), Buffer, process, fetch:fetchImpl, URLSearchParams, AbortSignal });
  return { ...module.exports, process };
}
test('credentials alone do not enable live payment', () => {
  const api=load(); assert.equal(api.payappEnabled(),false);
  api.process.env.PAYAPP_ENABLED='true'; assert.equal(api.payappEnabled(),true);
  delete api.process.env.PAYAPP_LINK_VALUE; assert.equal(api.payappEnabled(),false);
});
test('callback credentials require exact match, including trailing equals', () => {
  const api=load(); assert.equal(api.equalsSecret('key=','key='),true);
  assert.equal(api.equalsSecret('key','key='),false);
  assert.equal(api.equalsSecret('',undefined),false);
});
test('request is encoded as form data without dropping equals characters', async () => {
  const api=load(async(url,options)=>{
    assert.equal(url,'https://api.payapp.kr/oapi/apiLoad.html');
    assert.equal(options.method,'POST'); assert.equal(options.body.get('var1'),'token=');
    return { ok:true,text:async()=> 'state=1&rebill_no=123&payurl=https%3A%2F%2Fpayapp.kr%2Ftest' };
  });
  assert.equal((await api.requestPayapp({var1:'token='})).get('rebill_no'),'123');
});
test('provider failures do not become successful payment results', async () => {
  await assert.rejects(load(async()=>({ok:true,text:async()=> 'state=0&errorMessage=secret'})).requestPayapp({}),/payment_provider_rejected/);
  await assert.rejects(load(async()=>({ok:false})).requestPayapp({}),/payment_provider_unavailable/);
});
