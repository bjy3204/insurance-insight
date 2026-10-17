import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./coverage-report-model.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { COVERAGE_GROUPS, newReportPolicy, coverageTotal, coverageStatusReport, coverageFieldLabel, paymentValues, detailPages, reportNumber, amountText, validReportDate, reportDateInput, remodelingDifference, REPORT_SECTIONS } = module.exports;
const field = id => COVERAGE_GROUPS.flatMap(group => group.fields).find(item => item.id === id);
const report = { policies: [newReportPolicy('one'), newReportPolicy('two')], overrides: {} };
test('numeric coverage totals use ten-thousand won, while liability uses hundred-million won', () => {
  report.policies[0].amounts = { 'cancer-0': '5000', liability: '2' };
  report.policies[1].amounts = { 'cancer-0': '6000', liability: '1' };
  assert.equal(coverageTotal(report, field('cancer-0')), '1억 1,000만원');
  assert.equal(coverageTotal(report, field('liability')), '3억');
  assert.equal(amountText(9999.999), '1억');
  assert.equal(reportNumber('1,500.5'), 1500.5);
  assert.equal(reportNumber('500만원'), null);
});
test('graded surgery descriptions are preserved with explicit manual totals instead of concatenating numbers', () => {
  report.policies[0].amounts['surgery-1'] = '1종 20 / 2종 40 / 3종 100';
  assert.equal(coverageTotal(report, field('surgery-1')), '');
  assert.equal(coverageTotal({ ...report, overrides: { 'surgery-1': '1종 20 / 2종 40' } }, field('surgery-1')), '1종 20 / 2종 40');
});
test('payment totals follow the source completed-month rule and clamp future and completed contracts', () => {
  const policy = { ...newReportPolicy('one'), start: '2025-12-14', years: '20', premium: '150000' };
  assert.equal(paymentValues(policy, '2026-10-15').paid, 1500000);
  assert.equal(paymentValues(policy, '2026-10-15').remaining, 34500000);
  assert.equal(paymentValues(policy, '2025-01-01').paid, 0);
  assert.equal(paymentValues(policy, '2050-01-01').remaining, 0);
  assert.equal(paymentValues({ ...policy, years: '' }, '2026-10-15').remaining, 0);
  assert.equal(paymentValues({ ...policy, start: '2026-02-30' }, '2026-10-15').remaining, 0);
  assert.equal(validReportDate('2026-02-30'), false);
  assert.equal(validReportDate('2028-02-29'), true);
  assert.equal(reportDateInput('20251214'), '2025-12-14');
});
test('all template rows are present and insurance columns paginate four at a time', () => {
  assert.equal(COVERAGE_GROUPS.flatMap(group => group.fields).length, 55);
  assert.equal(new Set(COVERAGE_GROUPS.flatMap(group => group.fields.map(item => item.id))).size, 55);
  const pages = detailPages(Array.from({ length: 9 }, (_, i) => newReportPolicy(String(i))));
  assert.equal(pages.length, 3);
  assert.equal(pages[0].length, 4);
  assert.equal(pages[2][0].id, '8');
});
test('empty numeric and manual coverage cells stay blank', () => {
  const blank={policies:[newReportPolicy('blank')],overrides:{}};
  assert.equal(amountText(0),'');
  assert.equal(coverageTotal(blank,field('cancer-0')),'');
  assert.equal(coverageTotal(blank,field('surgery-1')),'');
});
test('seven report sections share independent before and after amounts', () => {
  assert.equal(REPORT_SECTIONS.length,7);
  const before={date:'2026-10-16',policies:[{...newReportPolicy('before'),start:'2026-01-01',years:'30',premium:'150000'}],overrides:{}};
  const after={...before,policies:[{...newReportPolicy('after'),start:'2026-01-01',years:'20',premium:'100000'}]};
  const result=remodelingDifference(before,after);
  assert.equal(result.monthly,50000);
  assert.equal(result.remaining,29550000);
  assert.equal(remodelingDifference(after,before).monthly,-50000);
});
test('status totals default to analysis totals but edits never change analysis', () => {
  const analysis={policies:[{...newReportPolicy('one'),amounts:{'cancer-0':'5000'}}],overrides:{},statusOverrides:{'cancer-0':'7000'},statusLabels:{'cancer-0':'암 보장'}};
  const status=coverageStatusReport(analysis);
  assert.equal(coverageTotal(analysis,field('cancer-0')),'5,000만원');
  assert.equal(coverageTotal(status,field('cancer-0')),'7,000만원');
  assert.equal(coverageFieldLabel(analysis,field('cancer-0')),'일반암 진단');
  assert.equal(coverageFieldLabel(status,field('cancer-0')),'암 보장');
  assert.equal(coverageTotal(coverageStatusReport({...analysis,statusOverrides:{'cancer-0':''}}),field('cancer-0')),'');
});

test('radar converts units, preserves ratios above 100 and excludes unset targets',()=>{
  const r={policies:[{...newReportPolicy('chart'),amounts:{'cancer-0':'2','hospital-0':'50000'},units:{'cancer-0':'억','hospital-0':'원'}}],overrides:{},chartTargets:{'cancer-0':'10000','hospital-0':'10','surgery-0':''}};
  const rows=module.exports.reportChartValues(r);
  assert.equal(rows.find(row=>row.id==='cancer-0').percent,200);
  assert.equal(rows.find(row=>row.id==='hospital-0').percent,50);
  assert.equal(rows.find(row=>row.id==='surgery-0').percent,null);
});

test('radar includes related diagnoses and disease/injury coverage without treatment double counting',()=>{
  const r={policies:[{...newReportPolicy('all'),amounts:{'cancer-0':'100','cancer-1':'20','cancer-2':'999','brain-0':'10','brain-1':'20','brain-2':'30','heart-0':'10','heart-1':'20','heart-2':'30','disability-0':'10','disability-1':'20','disability-2':'30','disability-3':'40','surgery-0':'100','surgery-3':'100','hospital-0':'10','hospital-1':'20','custom-high':'30','custom-small':'40','custom-infarct':'50'}}],overrides:{},customFields:{'암':[{id:'custom-high',label:'고액암 진단'},{id:'custom-small',label:'소액암 진단'}],'뇌':[{id:'custom-infarct',label:'뇌경색 진단'}]}};
  const rows=module.exports.reportChartValues(r),amount=id=>rows.find(row=>row.id===id).amount;
  assert.equal(amount('cancer-0'),190);
  assert.equal(amount('brain-0'),110);
  assert.equal(amount('heart-0'),60);
  assert.equal(amount('disability-0'),100);
  assert.equal(amount('surgery-0'),200);
  assert.equal(amount('hospital-0'),30);
});
