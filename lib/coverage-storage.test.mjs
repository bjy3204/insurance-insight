import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(path,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>imports[name]||require(name)});return module.exports;}
const model=load('../app/my-page/coverage-report-model.ts');
const {validateCoverageSet}=load('./coverage-storage.ts',{'@/app/my-page/coverage-report-model':model});
const base=()=>({name:'고객',birth:'960901',date:'2026-10-16',advisor:'담당자',memo:'remove',policies:[model.newReportPolicy('one')],overrides:{}});
test('saved set preserves independent status edits, custom names and chart criteria',()=>{
 const before={...base(),fieldLabels:{'cancer-0':'분석 담보'},statusLabels:{'cancer-0':'현황 담보'},statusOverrides:{'cancer-0':'7000'},chartTargets:{'cancer-0':'5000'}};
 const result=validateCoverageSet({before,after:base(),theme:'sky'});
 assert.equal(result.before.fieldLabels['cancer-0'],'분석 담보');
 assert.equal(result.before.statusLabels['cancer-0'],'현황 담보');
 assert.equal(result.before.statusOverrides['cancer-0'],'7000');
 assert.equal(result.after.statusOverrides['cancer-0'],undefined);
 assert.equal(result.before.chartTargets['cancer-0'],'5000');assert.equal(result.before.memo,'');
});
test('invalid amounts structure, missing policies and unknown themes are rejected',()=>{
 assert.throws(()=>validateCoverageSet({before:{...base(),policies:[]},after:base(),theme:'sky'}));
 assert.throws(()=>validateCoverageSet({before:{...base(),overrides:[]},after:base(),theme:'sky'}));
 assert.throws(()=>validateCoverageSet({before:base(),after:base(),theme:'unknown'}));
});
