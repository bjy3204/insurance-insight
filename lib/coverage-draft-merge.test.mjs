import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map(),rows=new Map();
let owner='member-a';
process.env.CUSTOMER_DATA_ENCRYPTION_KEY=randomBytes(32).toString('hex');
const db={from(table){assert.equal(table,'customer_records');const filters={};let action='select',values,first=0,last=999999;
 const query={select(){return query;},eq(k,v){filters[k]=v;return query;},order(){return query;},range(a,b){first=a;last=b;return query;},insert(v){action='insert';values=v;return query;},update(v){action='update';values=v;return query;},async single(){return run(true);},async maybeSingle(){return run(true);},then(resolve,reject){return Promise.resolve(run(false)).then(resolve,reject);}};
 function run(single){if(action==='insert'){if(rows.has(values.id))return {error:{code:'23505'}};rows.set(values.id,structuredClone(values));return {data:single?{revision:values.revision}:[values],error:null};}let data=[...rows.values()].filter(row=>Object.entries(filters).every(([k,v])=>row[k]===v));if(action==='update')for(const row of data)Object.assign(row,values);data=data.slice(first,last+1);return {data:single?data[0]||null:data,error:null};}return query;}};
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const local=name=>name==='@supabase/supabase-js'?{createClient:()=>db}:name==='@/lib/notion-crm/member'?{requireMember:async()=>{if(!owner)throw Error('승인된 회원만 사용할 수 있습니다');return {id:owner};}}:name.startsWith('@/')?load(name.slice(2)+'.ts'):name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name);vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})',{filename:file})(local,module,module.exports);return module.exports;}
const route=load('app/api/coverage-draft/route.ts'),model=load('app/my-page/coverage-report-model.ts'),{NextRequest}=require('next/server');
const report=()=>{const before={name:'테스트',birth:'900101',date:'2026-10-18',advisor:'설계사',organization:'소속',phone:'010',fax:'02',email:'test@example.com',memo:'',policies:[model.newReportPolicy('one')],overrides:{}};return {before,after:structuredClone(before),theme:'sky',design:'simple'};};
const request=(query='',body)=>new NextRequest('https://example.com/api/coverage-reports/personal'+query,body?{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
const {mergeCoverageDraft}=load('lib/coverage-draft-merge.ts');
const {changePolicyUnit}=load('app/my-page/coverage-unit.ts');
const make=()=>({...report(),customerId:'',revision:0,provider:'personal',previewOpen:false,reportKind:'cover'});
test('merge preserves unrelated cells and identity fields; latest write wins only changed paths',()=>{
 const base=make(),local=structuredClone(base),remote=structuredClone(base);
 local.before.policies[0].amounts['cancer-0']='200';remote.before.policies[0].amounts['cancer-1']='300';local.before.advisor='local advisor';remote.before.organization='remote company';
 const merged=mergeCoverageDraft(base,local,remote);assert.equal(merged.before.advisor,'local advisor');assert.equal(merged.before.organization,'remote company');assert.equal(merged.before.policies[0].amounts['cancer-0'],'200');assert.equal(merged.before.policies[0].amounts['cancer-1'],'300');
 remote.before.advisor='remote advisor';assert.equal(mergeCoverageDraft(base,local,remote).before.advisor,'local advisor');
 remote.before.policies.push(model.newReportPolicy('remote-add'));assert.equal(mergeCoverageDraft(base,local,remote).before.policies.length,2);
});
test('switching known money units preserves value in both directions',()=>{let p=model.newReportPolicy('one');p.amounts['cancer-0']='2';p.units={'cancer-0':'억'};p=changePolicyUnit(p,{id:'cancer-0'},'만원');assert.equal(p.amounts['cancer-0'],'20000');assert.equal(p.units['cancer-0'],'만원');p=changePolicyUnit(p,{id:'cancer-0'},'억');assert.equal(p.amounts['cancer-0'],'2');assert.equal(p.units['cancer-0'],'억');});
