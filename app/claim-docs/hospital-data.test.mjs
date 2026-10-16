import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(fetch) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL('./hospital-data.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, fetch });
  return module.exports.loadHospitalData;
}
test('hospital records are loaded on demand and concurrent searches share one download', async () => {
  let calls = 0;
  const records = [{ name: '샘플병원' }];
  const get = load(async path => { calls++; assert.equal(path, '/data/hospitals.json'); return { ok: true, json: async () => records }; });
  assert.equal(calls, 0);
  const [first, second] = await Promise.all([get(), get()]);
  assert.equal(calls, 1);
  assert.equal(first, records);
  assert.equal(second, records);
  await get();
  assert.equal(calls, 1);
});
test('a failed hospital download can be retried without reloading the site', async () => {
  let calls = 0;
  const get = load(async () => { calls++; return { ok: calls > 1, json: async () => [] }; });
  await assert.rejects(get(), /병원정보/);
  assert.equal((await get()).length, 0);
  assert.equal(calls, 2);
});
