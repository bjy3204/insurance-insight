import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./calendar-time.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
test('calendar schedules show all-day entries first, then chronological times across stored input formats', () => {
  const { compareCalendarTimes } = module.exports;
  assert.deepEqual(['18:00', '0930', '', '9:05', '09:30:00', '00:00', 'invalid'].sort(compareCalendarTimes), ['', '00:00', '9:05', '0930', '09:30:00', '18:00', 'invalid']);
  assert.equal(compareCalendarTimes(null, ''), 0);
  assert.equal(compareCalendarTimes('09:30', '0930'), 0);
});
