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
test('draft autosave supports partial identity, encryption, owner isolation and stale revision rejection',async()=>{
 const draft={...report(),customerId:'',revision:0,provider:'personal',previewOpen:false,reportKind:'cover'};draft.before.name='';draft.before.birth='';
 let r=await route.PUT(request('',{revision:0,draft}));assert.equal(r.status,200);assert.equal((await r.json()).revision,1);
 const first=[...rows.values()][0];assert.equal(first.payload_version,6);assert.ok(!first.encrypted_payload.includes('설계사'));
 let read=await(await route.GET(request())).json();assert.equal(read.draft.before.advisor,'설계사');assert.equal(read.revision,1);
 assert.equal((await route.PUT(request('',{revision:0,draft}))).status,409);assert.equal((await route.PUT(request('',{revision:1,draft}))).status,200);
 owner='member-b';read=await(await route.GET(request())).json();assert.equal(read.draft,null);assert.equal(read.revision,0);assert.equal((await route.PUT(request('',{revision:0,draft}))).status,200);assert.equal(rows.size,2);
 owner='member-a';assert.equal((await(await route.GET(request())).json()).revision,2);owner='';assert.notEqual((await route.GET(request())).status,200);
});

test('customer scopes stay independent within one account',async()=>{owner='scoped-owner';const draft={...report(),customerId:'',revision:0,provider:'personal',previewOpen:false,reportKind:'cover'};const alice='?name='+encodeURIComponent(draft.before.name)+'&birth='+draft.before.birth;assert.equal((await route.PUT(request(alice,{revision:0,draft}))).status,200);const second=structuredClone(draft);second.before.name='다른고객';const bob='?name='+encodeURIComponent(second.before.name)+'&birth='+second.before.birth;assert.equal((await(await route.GET(request(bob))).json()).draft,null);assert.equal((await route.PUT(request(bob,{revision:0,draft:second}))).status,200);assert.equal((await(await route.GET(request(alice))).json()).draft.before.name,draft.before.name);assert.equal((await route.PUT(request(alice,{revision:1,draft:second}))).status,400);});

 test('advisor settings are account scoped and independent of customer documents',async()=>{
 owner='advisor-owner';const draft={...report(),customerId:'',revision:0,provider:'personal',previewOpen:false,reportKind:'cover'};
 assert.equal((await route.PUT(request('?area=advisor',{revision:0,draft}))).status,200);
 const customer={...structuredClone(draft),before:{...draft.before,name:'고객',birth:'900101',advisor:''}};
 assert.equal((await route.PUT(request('?name=고객&birth=900101',{revision:0,draft:customer}))).status,200);
 const read=await(await route.GET(request('?area=advisor'))).json();assert.equal(read.draft.before.advisor,'설계사');
 owner='other-advisor-owner';assert.equal((await(await route.GET(request('?area=advisor'))).json()).draft,null);
 });
