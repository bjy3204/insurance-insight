import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(name,deps={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,crypto:webcrypto,require:key=>deps[key]});return module.exports;}
const model=load('./coverage-report-model.ts');
const {copyReportCells,pasteReportCells,clipboardRows,clearReportCells}=load('./coverage-cell-clipboard.ts',{'./coverage-report-model':model});
const base=()=>({name:'',policies:[model.newReportPolicy('one')],overrides:{}});
test('range copies raw amounts and individual units without modifying the source',()=>{
  const source=base();source.policies.push(model.newReportPolicy('two'));
  source.policies[0].amounts['cancer-0']='3.5';source.policies[0].units={'cancer-0':'억'};
  source.policies[1].amounts['cancer-0']='500';
  const row=clipboardRows(source).indexOf('cancer-0');
  const copied=copyReportCells(source,{row,column:0,endRow:row,endColumn:1});
  const result=pasteReportCells(base(),row,0,copied);
  assert.equal(result.policies.length,2);
  assert.equal(result.policies[0].amounts['cancer-0'],'3.5');
  assert.equal(result.policies[0].units['cancer-0'],'억');
  assert.equal(result.policies[1].amounts['cancer-0'],'500');
  assert.equal(result.policies[1].units['cancer-0'],'만원');
  result.policies[0].amounts['cancer-0']='9';
  assert.equal(source.policies[0].amounts['cancer-0'],'3.5');
});
test('metadata paste preserves positions and skips computed remaining premium',()=>{
  const r=base();
  const result=pasteReportCells(r,0,0,['보험사','보험명','30','2026-01-01','2056-01-01','99999','150,000'].map(value=>[{value}]));
  assert.equal(result.policies[0].insurer,'보험사');
  assert.equal(result.policies[0].start,'2026-01-01');
  assert.equal(result.policies[0].years,'30');
  assert.equal(result.policies[0].premium,'150000');
  assert.equal('remaining' in result.policies[0],false);
  assert.equal(r.policies[0].premium,'');
});
test('reverse selections include blanks and manual surgery descriptions',()=>{
  const r=base(),row=clipboardRows(r).indexOf('surgery-1');
  r.policies[0].amounts['surgery-1']='1종 20 / 2종 50';
  const copied=copyReportCells(r,{row:row+1,column:0,endRow:row,endColumn:0});
  const result=pasteReportCells(base(),row,0,copied);
  assert.equal(result.policies[0].amounts['surgery-1'],'1종 20 / 2종 50');
  assert.equal(result.policies[0].amounts['surgery-2'],'');
});

test('clear reversed range preserves units, neighboring cells and source data',()=>{
 const source=base();source.policies.push(model.newReportPolicy('two'));
 source.policies[0].amounts['cancer-0']='3';source.policies[0].units={'cancer-0':'억'};source.policies[1].amounts['cancer-0']='500';
 const row=clipboardRows(source).indexOf('cancer-0');
 const result=clearReportCells(source,{row,endRow:0,column:0,endColumn:0});
 assert.equal(result.policies[0].amounts['cancer-0'],'');assert.equal(result.policies[0].units['cancer-0'],'억');assert.equal(result.policies[1].amounts['cancer-0'],'500');assert.equal(source.policies[0].amounts['cancer-0'],'3');assert.equal('remaining' in result.policies[0],false);assert.equal(result.policies.length,2);
});
