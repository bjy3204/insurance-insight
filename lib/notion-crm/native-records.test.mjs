import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {randomBytes,randomUUID} from 'node:crypto';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map(),records=new Map();
process.env.CUSTOMER_DATA_ENCRYPTION_KEY=randomBytes(32).toString('hex');
process.env.CRM_SESSION_SECRET=randomBytes(32).toString('hex');
const calls=[];
const mock={createClient(){return {from(table){
 const filters={},query={operation:'select',payload:null,select(){return query;},eq(key,value){filters[key]=value;return query;},order(){return query;},range(){return query;},update(payload){query.operation='update';query.payload=payload;return query;},insert(payload){query.operation='insert';query.payload=payload;return query;},delete(){query.operation='delete';return query;},async maybeSingle(){const result=await query;return {...result,data:result.data?.[0]||null};},single(){return query.maybeSingle();},then(resolve,reject){return Promise.resolve().then(()=>{
  calls.push({table,operation:query.operation,filters:{...filters}});
  let rows=[...records.values()].filter(row=>Object.entries(filters).every(([key,value])=>row[key]===value));
  if(query.operation==='insert'){if(records.has(query.payload.id))return {data:null,error:{code:'23505'}};records.set(query.payload.id,{...query.payload});rows=[query.payload];}
  if(query.operation==='update')for(const row of rows)Object.assign(row,query.payload);
  if(query.operation==='delete')for(const row of rows)records.delete(row.id);
  return {data:structuredClone(rows),error:null};
 }).then(resolve,reject);}};return query;
 }};}};
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const local=name=>['@/app/api/notion-crm/route','@/app/api/notion-crm/sheets/route','@/app/api/notion-crm/native/route'].includes(name)?{async GET(){return new Response(JSON.stringify({data:{customers:[{id:'linked-customer',values:{이름:'연결고객',주민번호:'0001013'}}]}}),{headers:{'Content-Type':'application/json'}});}}:name==='@supabase/supabase-js'?mock:name==='@/lib/notion-crm/member'?{async requireMember(request){const owner=request.headers.get('authorization')?.replace('Bearer ','');if(!['owner-a','owner-b'].includes(owner))throw new (load('lib/notion-crm/server.ts').CrmError)('로그인 후 이용해 주세요.',401);return {id:owner};}}:name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):name.startsWith('@/')?load(path.resolve(name.slice(2)+'.ts')):require(name);vm.runInThisContext('(function(require,module,exports){'+compiled+'\n})',{filename:file})(local,module,module.exports);return module.exports;}
const {nativeValues,sealNative,openNative}=load('lib/notion-crm/native-records.ts');
const {NextRequest}=require('next/server'),route=load('app/api/notion-crm/native/route.ts');
const request=(owner='owner-a',body,origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/my-page/native',{method:body?'POST':'GET',headers:{authorization:'Bearer '+owner,origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('native mode accepts only seven birth digits and rejects card data in every source',()=>{
 assert.equal(nativeValues('customers',{이름:'가상고객',주민번호:'000101-3'})['생년월일'],'2000-01-01');
 assert.throws(()=>nativeValues('customers',{이름:'가상고객',주민번호:'0001013123456'}),/7자리/);
 assert.throws(()=>nativeValues('customers',{이름:'가상고객',주민번호:'0001013',카드번호:'0000000000000000'}),/허용되지/);
 assert.throws(()=>nativeValues('cards',{수납명:'금지'}),/카드수납/);
 assert.throws(()=>nativeValues('customers',{이름:'가상고객',주민번호:'0002303'}),/생년월일/);
});
test('native records are encrypted and authenticated to the owner and ID',()=>{
 const values=nativeValues('customers',{이름:'가상고객',주민번호:'0001013'}),id=randomUUID(),payload=sealNative('customers',values,'owner-a',id);
 assert.ok(!payload.includes('가상고객'));const stored={id,user_id:'owner-a',encrypted_payload:payload,encryption_key_id:'v1',payload_version:2,revision:1,created_at:'2026-10-18',updated_at:'2026-10-18'};
 assert.equal(openNative(stored).record.values['주민번호'],'0001013');assert.throws(()=>openNative({...stored,user_id:'owner-b'}));
});
test('native API scopes records by member, blocks restricted writes and preserves creation/revision',async()=>{
 records.clear();calls.length=0;
 assert.equal((await route.GET(request('anonymous'))).status,401);
 assert.equal((await route.POST(request('owner-a',{action:'save',source:'cards',values:{수납명:'금지'}}))).status,400);
 assert.equal((await route.POST(request('owner-a',{action:'save',source:'customers',values:{이름:'가상고객',주민번호:'0001013123456'}}))).status,400);
 const id=randomUUID(),body={action:'save',source:'customers',requestId:id,values:{이름:'가상고객',주민번호:'0001013'}};
 assert.equal((await route.POST(request('owner-a',body,'https://another.example'))).status,403);
 let response=await route.POST(request('owner-a',body));assert.equal(response.status,200);const first=(await response.json()).record;
 assert.equal(first.edited,'1');assert.ok(first.created);assert.ok(!records.get(id).encrypted_payload.includes('0001013'));
 response=await route.GET(request('owner-b'));assert.equal((await response.json()).data.customers.length,0);
 assert.equal((await route.POST(request('owner-b',{action:'delete',source:'customers',id,edited:'1'}))).status,404);
 assert.equal((await route.POST(request('owner-a',{action:'save',source:'customers',id,edited:'0',values:{메모:'stale'}}))).status,409);
 response=await route.POST(request('owner-a',{action:'save',source:'customers',id,edited:'1',values:{메모:'수정'}}));assert.equal(response.status,200);const edited=(await response.json()).record;assert.equal(edited.created,first.created);assert.equal(edited.edited,'2');
 assert.equal((await route.POST(request('owner-a',body))).status,409);
 const vehicle=await route.POST(request('owner-a',{action:'save',source:'cars',values:{차량번호:'00가0000',고객:[id]}}));assert.equal(vehicle.status,200);
 assert.equal((await route.POST(request('owner-a',{action:'delete',source:'customers',id,edited:'2'}))).status,409);
 for(const call of calls.filter(call=>call.operation!=='insert')){assert.ok(['owner-a','owner-b'].includes(call.filters.user_id));assert.equal(call.filters.payload_version,2);}
});
test('native import truncates full residents and rejects cards, but normal providers remain unrestricted',()=>{
 const {parseLinkedImport,restrictNativeImport}=load('lib/notion-crm/customer-import.ts');
 const rows=parseLinkedImport([['이름','주민번호','결제일'],['가상고객','0001013123456','10']],[],[]);assert.ok(rows.every(row=>!row.error));restrictNativeImport(rows);assert.equal(rows[0].error,'');assert.equal(rows[0].values['주민번호'],'0001013');assert.match(rows[1].error,/카드수납/);
 const safe=restrictNativeImport(parseLinkedImport([['이름','주민번호'],['가상고객','0001013']],[],[]));assert.equal(safe[0].error,'');
});
test('native template contains birth field and no card payment columns',()=>{
 const XLSX=require('xlsx'),book=XLSX.readFile('public/templates/고객 일괄 등록_연결없이.xlsx',{cellNF:true,sheetStubs:true});const headers=XLSX.utils.sheet_to_json(book.Sheets['고객정보'],{header:1})[0];assert.ok(headers.includes('생년월일'));assert.ok(!headers.includes('주민번호'));assert.ok(!headers.includes('카드번호'));assert.equal(book.Sheets['고객정보'].C2.z,'@');
 const ui=fs.readFileSync('app/notion-crm/NotionCrm.tsx','utf8');assert.ok(ui.includes("tabOrder.filter(id=>!limited||id!=='cards')"));assert.ok(ui.includes("!limited&&card('카드수납'"));
});

test('every current native CRM field survives validation and encrypted storage',()=>{
 const {fields}=load('lib/notion-crm/model.ts');
 for(const source of ['customers','contracts','cars','events']){
  const values=Object.fromEntries(fields[source].map(field=>[field.name,field.internal?'':field.type==='checkbox'?true:field.type==='relation'?[randomUUID()]:field.type==='date'?'2026-10-18':field.type==='number'?12:field.type==='select'?field.options[0]:field.type==='email'?'test@example.com':field.type==='tel'?'01000000000':'검증값']));
  if(source==='customers'){values['주민번호']='0001013';values['생년월일']='2000-01-01';values['예금주 생년월일']='000101';}
  if(source==='contracts'){values['계약자 생년월일']='000101';values['피보험자 생년월일']='000101';}
  const checked=nativeValues(source,values),id=randomUUID(),payload=sealNative(source,checked,'owner-a',id);
  const restored=openNative({id,user_id:'owner-a',encrypted_payload:payload,encryption_key_id:'v1',payload_version:2,revision:1,created_at:'2026-10-18',updated_at:'2026-10-18'});
  assert.deepEqual(restored.record.values,checked);
  assert.deepEqual(Object.keys(checked).sort(),fields[source].map(field=>field.name).sort());
 }
});


test('linked customer report saves encrypted, loads by owner and provider, and rejects stale writes',async()=>{
 records.clear();calls.length=0;
 const linked=load('app/api/coverage-reports/linked/route.ts'),{linkedCoverageId}=load('lib/linked-coverage-storage.ts');
 const {newReportPolicy}=load('app/my-page/coverage-report-model.ts');
 const before={name:'wrong name',birth:'000101',date:'2026-10-18',advisor:'설계사',memo:'',policies:[newReportPolicy('one')],overrides:{}};
 const report={before,after:{...before},theme:'sky'};
 const req=(method,owner='owner-a',body,customerId='linked-customer',provider='sheets')=>new NextRequest('http://localhost:3000/api/coverage-reports/linked?provider='+provider+'&customerId='+customerId,{method,headers:{authorization:'Bearer '+owner,origin:'http://localhost:3000','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const body={provider:'sheets',customerId:'linked-customer',revision:0,report};
 let response=await linked.PUT(req('PUT','owner-a',body));assert.equal(response.status,200);assert.equal((await response.json()).revision,1);
 const stored=records.get(linkedCoverageId('owner-a','sheets','linked-customer'));assert.equal(stored.payload_version,3);assert.ok(!stored.encrypted_payload.includes('연결고객'));
 response=await linked.GET(req('GET'));const loaded=await response.json();assert.equal(loaded.report.before.name,'연결고객');assert.equal(loaded.report.before.birth,'000101');
 assert.equal((await (await linked.GET(req('GET','owner-b'))).json()).report,null);
 assert.equal((await (await linked.GET(req('GET','owner-a',undefined,'linked-customer','notion'))).json()).report,null);
 assert.equal((await linked.PUT(req('PUT','owner-a',body))).status,409);
 assert.equal((await linked.PUT(req('PUT','owner-a',{...body,revision:1}))).status,200);
 assert.equal((await linked.PUT(req('PUT','owner-a',{...body,customerId:'unregistered'}))).status,400);
 assert.equal((await linked.GET(req('GET','anonymous'))).status,400);
 assert.ok(calls.every(call=>call.operation==='insert'||call.filters.user_id));
});
