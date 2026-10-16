import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url), ts = require('typescript'), module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./subscriber-bulk-status.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
test('bulk cancellation excludes all checked subscribers and already canceled rows without changing input', () => {
  const rows = [{id:'keep',status:'active',is_checked:true},{id:'cancel',status:'active',is_checked:false},{id:'legacy',status:'active',is_checked:null},{id:'old',status:'canceled',is_checked:false}];
  const before = JSON.stringify(rows);
  assert.deepEqual(Array.from(module.exports.uncheckedActiveSubscriberIds(rows)), ['cancel','legacy']);
  assert.equal(JSON.stringify(rows), before);
});
