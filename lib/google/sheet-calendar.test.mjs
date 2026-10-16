import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./sheet-calendar-model.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, Date, Map });
const build = (rows, from, to) => module.exports.buildSheetCalendar({ customers: [], vehicles: [], contracts: [], products: [], terms: [], ...rows }, from, to, value => createHmac('sha256', 'test-user-sheet-secret').update(value).digest('hex'), 2026);

test('birthdays repeat annually, clamp leap days and expose no full resident number', () => {
  const rows = { customers: [['DB', '테스트', '000229-3123456']] };
  const events = build(rows, '2027-02-01', '2027-02-28');
  assert.equal(events.length, 1);
  assert.equal(events[0].date, '2027-02-28');
  assert.equal(events[0].birth, '000229-3');
  assert.equal(events[0].category, '생일');
  assert.match(events[0].id, /^sheet:[a-f0-9]{64}$/);
  assert.equal(build(rows, '2028-02-01', '2028-02-29')[0].date, '2028-02-29');
});
test('contract periods follow the sheet month-end rule and stay attached to the contract owner', () => {
  const events = build({ contracts: [['소개', '2026-01-31', '계약자', '960901-2']], products: [['보험A']], terms: [[1, 12]] }, '2026-02-01', '2027-02-01');
  assert.equal(events.length, 2);
  assert.equal(events[0].date, '2026-02-28');
  assert.equal(events[0].category, '면책');
  assert.equal(events[1].date, '2027-01-31');
  assert.equal(events[1].category, '감액');
  assert.equal(events[0].name, '계약자');
  assert.match(events[0].content, /보험A/);
});
test('renewals accept numeric Sheets dates, ignore invalid periods, and retain stable IDs after row movement', () => {
  const serial = (Date.UTC(2024, 9, 15) - Date.UTC(1899, 11, 30)) / 86400000;
  const customer = ['SNS', '고객', '961001-2'];
  const rows = { customers: [customer], vehicles: [['123가4567', '차량', serial, '보험사']], contracts: [['DB', '2026-01-01', '고객', '961001-2']], terms: [['잘못된값', -1]] };
  const events = build(rows, '2026-10-01', '2026-10-31');
  assert.equal(events.length, 2);
  const renewal = events.find(event => event.kind === 'renewal');
  assert.equal(renewal.date, '2026-10-15');
  assert.equal(renewal.icon, '🚗');
  const moved = build({ ...rows, customers: [[], customer], vehicles: [[], rows.vehicles[0]] }, '2026-10-01', '2026-10-31');
  assert.equal(moved.find(event => event.kind === 'renewal').id, renewal.id);
});
