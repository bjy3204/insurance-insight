import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(file, overrides = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, Date, require: name => overrides[name] || require(name) });
  return module.exports;
}
const fields = load('./customer-form-fields.ts');
const { customerRenewalDays, customerTiming, customerBirthDate, findCustomers, medicalMaturity, customerDirectory } = load('./customer-lookup-model.ts', { './customer-form-fields': fields });
test('age, next insurance-age date and D-Day follow the supplied reference including the boundary day', () => {
  const before = customerTiming('870901-1', '2022-10-01');
  assert.equal(before.age, 35);
  assert.equal(before.insuranceAge, 35);
  assert.equal(before.upperDate, '2023-03-01');
  assert.equal(customerTiming('870901-1', '2023-03-01').insuranceAge, 36);
  assert.equal(customerTiming('870901-1', '2023-03-01').days, 0);
  assert.equal(customerTiming('870901-1', '2023-03-02').upperDate, '2024-03-01');
});
test('reference month-end corrections use March 1st beyond February 28th and June 30th for December 31st', () => {
  assert.equal(customerTiming('960830-2', '2026-10-15').upperDate, '2027-03-01');
  assert.equal(customerTiming('960831-2', '2027-10-15').upperDate, '2028-03-01');
  assert.equal(customerTiming('961231-2', '2027-01-01').upperDate, '2027-06-30');
  assert.equal(customerTiming('960828-2', '2026-10-15').upperDate, '2027-02-28');
});
test('invalid or future birth dates are rejected, and six/seven digits resolve the birth century', () => {
  assert.equal(customerBirthDate('961332-2', '2026-10-15'), null);
  assert.equal(customerBirthDate('271001-3', '2026-10-15'), null);
  assert.equal(customerBirthDate('001010', '2026-10-15').year, 2000);
  assert.equal(customerBirthDate('960901-2', '2026-10-15').year, 1996);
});
test('search accepts either field and separates namesakes by their birth dates', () => {
  const rows = [{id:'a',name:'배지연',birth:'960901-2'},{id:'b',name:'배지연',birth:'001010-4'}];
  assert.equal(findCustomers(rows, '배지연', '').length, 2);
  assert.equal(findCustomers(rows, '', '001010')[0].id, 'b');
  assert.equal(findCustomers(rows, '배지연', '960901')[0].id, 'a');
  assert.equal(findCustomers(rows, '', '').length, 0);
});
test('medical maturity follows the supplied joining-month rule and includes the three-month warning boundary', () => {
  assert.equal(medicalMaturity('2012-12-01', '2026-10-15'), null);
  assert.equal(medicalMaturity('2013-01-01', '2026-10-15').text, '2028-01');
  assert.equal(medicalMaturity('2021-06-01', '2026-10-15').text, '2036-06');
  assert.equal(medicalMaturity('2021-07-01', '2026-10-15').text, '2026-07');
  assert.equal(medicalMaturity('2022-01-01', '2026-10-15').soon, true);
  assert.equal(medicalMaturity('2022-02-01', '2026-10-15').soon, false);
});

test('directory defaults to newest registration first, preserves undated source order and searches names, births and phones', () => {
 const rows=[{id:'new',name:'배지연',birth:'960901-2',phone:'01012345678',createdAt:'2026-10-15'},{id:'old',name:'김고객',birth:'001010-3',phone:'01087654321',createdAt:'2026-10-01'},{id:'row-a',name:'다른고객',birth:'950101-2'},{id:'row-b',name:'다음고객',birth:'930101-2'}];
 assert.deepEqual(Array.from(customerDirectory(rows,'').map(row=>row.id)),['new','old','row-a','row-b']);
 assert.equal(customerDirectory(rows,'ㅂ')[0].id,'new');
 assert.equal(customerDirectory(rows,'960901')[0].id,'new');
 assert.equal(customerDirectory(rows,'8765')[0].id,'old');
});

test('saved custom order wins and newly added customers appear above it', () => {
 const rows=[{id:'a',name:'가',birth:'960901-2',createdAt:'2026-10-15',sortOrder:'1'},{id:'b',name:'나',birth:'960901-2',createdAt:'2026-10-01',sortOrder:'0'},{id:'c',name:'다',birth:'960901-2',createdAt:'2026-10-16'}];
 assert.deepEqual(Array.from(customerDirectory(rows,'').map(row=>row.id)),['c','b','a']);
});

test('renewal dates distinguish 30-day boundary, today and next annual renewal',()=>{
 assert.equal(customerRenewalDays('2026-11-14','2026-10-15'),30);
 assert.equal(customerRenewalDays('2026-11-15','2026-10-15'),31);
 assert.equal(customerRenewalDays('2026-10-15','2026-10-15'),0);
 assert.ok(customerRenewalDays('2026-10-14','2026-10-15')>30);
 assert.equal(customerRenewalDays('2026-02-30','2026-10-15'),null);
});
