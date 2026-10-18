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
 const query={select(){return query;},eq(k,v){filters[k]=v;return query;},order(){return query;},range(a,b){first=a;last=b;return query;},insert(v){action='insert';values=v;return query;},update(v){action='update';values=v;return query;},delete(){action='delete';return query;},async single(){return run(true);},async maybeSingle(){return run(true);},then(resolve,reject){return Promise.resolve(run(false)).then(resolve,reject);}};
 function run(single){if(action==='insert'){if(rows.has(values.id))return {error:{code:'23505'}};rows.set(values.id,structuredClone(values));return {data:single?{revision:values.revision}:[values],error:null};}let data=[...rows.values()].filter(row=>Object.entries(filters).every(([k,v])=>row[k]===v));if(action==='delete')for(const row of data)rows.delete(row.id);if(action==='update')for(const row of data)Object.assign(row,values);data=data.slice(first,last+1);return {data:single?data[0]||null:data,error:null};}return query;}};
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const local=name=>name.startsWith('@/app/api/notion-crm/')||name==='@/app/api/notion-crm/route'?{GET:async()=>new Response(JSON.stringify({data:{customers:[{id:'customer-a',values:{'이름':'동명이인','주민번호':'900101'}},{id:'customer-b',values:{'이름':'동명이인','주민번호':'900101'}}]}}),{status:200})}:name==='@supabase/supabase-js'?{createClient:()=>db}:name==='@/lib/notion-crm/member'?{requireMember:async()=>{if(!owner)throw Error('승인된 회원만 사용할 수 있습니다');return {id:owner};}}:name.startsWith('@/')?load(name.slice(2)+'.ts'):name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name);vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})',{filename:file})(local,module,module.exports);return module.exports;}
const route=load('app/api/coverage-reports/linked/route.ts'),model=load('app/my-page/coverage-report-model.ts'),cryptoStorage=load('lib/customer-records.ts'),draftIds=load('lib/coverage-draft-id.ts'),{NextRequest}=require('next/server');
const before={name:'동명이인',birth:'900101',date:'',advisor:'',memo:'',policies:[model.newReportPolicy('one')],overrides:{}};
const report={before,after:structuredClone(before),theme:'sky',design:'simple'};
const req=query=>new NextRequest('https://example.com/api/coverage-reports/linked'+query);
test('report icon IDs include autosaved documents and explicit links, isolated by provider and owner',async()=>{
 owner='icons-owner';const draft={...report,customerId:'customer-a',provider:'notion',revision:0,previewOpen:false,reportKind:'cover'};
 const draftId=draftIds.coverageDraftId(owner,':document:notion:customer-a');rows.set(draftId,{id:draftId,user_id:owner,payload_version:6,encrypted_payload:cryptoStorage.sealCustomerData({draft:JSON.stringify(draft)},owner,'coverage-draft',draftId)});
 const personalId='personal-archive';rows.set(personalId,{id:personalId,user_id:owner,payload_version:5,encrypted_payload:cryptoStorage.sealCustomerData({report:JSON.stringify(report),linkedProvider:'notion',linkedCustomerId:'customer-b'},owner,'personal-coverage',personalId)});
 let response=await route.GET(req('?provider=notion&list=1'));assert.equal(response.status,200);assert.deepEqual((await response.json()).ids.sort(),['customer-a','customer-b']);
 response=await route.GET(req('?provider=notion&customerId=customer-a'));assert.equal(response.status,200);const loaded=await response.json();assert.equal(loaded.report.before.name,'동명이인');assert.equal(loaded.revision,0);
 assert.deepEqual((await(await route.GET(req('?provider=sheets&list=1'))).json()).ids,[]);
 owner='other-owner';assert.deepEqual((await(await route.GET(req('?provider=notion&list=1'))).json()).ids,[]);
});
