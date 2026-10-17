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

test('money inputs format thousands without changing decimal entry or stored amounts',()=>{
 assert.equal(model.formatCoverageNumber('3000'),'3,000');
 assert.equal(model.formatCoverageNumber('1234567.5'),'1,234,567.5');
 assert.equal(model.formatCoverageNumber('3000.'),'3,000.');
 assert.equal(model.formatCoverageNumber(''),'');
 assert.equal(model.reportNumber(model.formatCoverageNumber('1234567.5')),1234567.5);
});

test('analysis pages contain four policies and retain every policy in order',()=>{
 const policies=Array.from({length:13},(_,i)=>model.newReportPolicy('policy-'+i));
 const pages=model.detailPages(policies);
 assert.equal(pages.map(page=>page.length).join(","),"4,4,4,1");
 assert.equal(pages.flat().map(item=>item.id).join(','),policies.map(item=>item.id).join(','));
});

test('cover designs preserve selection and older reports use the simple design',()=>{
 const input={before:base(),after:base(),theme:'sky'};
 assert.equal(validateCoverageSet(input).design,'simple');
 for(const design of ['simple','diagonal','grid','dots','frame'])assert.equal(validateCoverageSet({...input,design}).design,design);
 assert.throws(()=>validateCoverageSet({...input,design:'unknown'}));
 assert.equal(model.REPORT_THEMES.find(theme=>theme.id==='gray').label,'블랙');
});

test("custom rows preserve values and enforce 53 visible items",()=>{
 const before={...base(),removedFields:["death-0"],customFields:{"사망":[{id:"custom-test",label:"추가 보장"}]}};
 before.policies[0].amounts["custom-test"]="500";
 const saved=validateCoverageSet({before,after:base(),theme:"sky"}).before;
 assert.equal(model.reportCoverageGroups(saved).reduce((sum,g)=>sum+g.fields.length,0),53);
 assert.equal(saved.policies[0].amounts["custom-test"],"500");
 assert.equal(saved.customFields["사망"][0].label,"추가 보장");
 assert.throws(()=>validateCoverageSet({before:{...before,removedFields:[]},after:base(),theme:"sky"}),/53/);
});
