import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(file, overrides = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, process, Buffer, Date, require: name => overrides[name] || require(name) });
  return module.exports;
}
process.env.CUSTOMER_DATA_ENCRYPTION_KEY = 'a1'.repeat(32); // Disposable test key, never production credentials.
const fields = load('../app/my-page/customer-form-fields.ts');
const disclosure = load('../app/my-page/customer-disclosure.ts');
const consultations = load('../app/my-page/customer-consultations.ts');
const checklist=load('../app/my-page/customer-checklist.ts');
const crypto = load('./customer-records.ts', { '@/app/my-page/customer-form-fields': fields, '@/app/my-page/customer-disclosure': disclosure, '@/app/my-page/customer-consultations': consultations, '@/app/my-page/customer-checklist': checklist });
const model = load('../app/my-page/customer-lookup-model.ts', { './customer-form-fields': fields });
const sheetCalendar=load('./google/sheet-calendar-model.ts');
const customerCalendar=load('./customer-calendar.ts',{'./google/sheet-calendar-model':sheetCalendar,'@/app/my-page/customer-form-fields':fields});
test('customer payload encrypts every personal field and authenticates owner, record, kind and ciphertext', () => {
  const data = { name:'암호화테스트', birth:'960901-2', phone:'010-0000-0000', accountNumber:'test-account', memo:'test memo' };
  const encrypted = crypto.sealCustomerData(data, 'owner-a', 'customer', 'record-a');
  assert.deepEqual(JSON.parse(JSON.stringify(crypto.openCustomerData(encrypted,'owner-a','customer','record-a'))), data);
  assert.ok(!Buffer.from(encrypted,'base64url').toString().includes(data.name));
  assert.notEqual(encrypted, crypto.sealCustomerData(data,'owner-a','customer','record-a'));
  for (const args of [['owner-b','customer','record-a'],['owner-a','contract','record-a'],['owner-a','customer','record-b']]) assert.throws(()=>crypto.openCustomerData(encrypted,...args));
  const altered = Buffer.from(encrypted,'base64url'); altered[28] ^= 1;
  assert.throws(()=>crypto.openCustomerData(altered.toString('base64url'),'owner-a','customer','record-a'));
  delete process.env.CUSTOMER_DATA_ENCRYPTION_KEY;
  assert.throws(()=>crypto.sealCustomerData(data,'owner-a','customer','record-a'));
  process.env.CUSTOMER_DATA_ENCRYPTION_KEY = 'a1'.repeat(32);
});

const rows = { customer_records:[], customer_contracts:[], customer_view_preferences:[] };
let currentUser = 'owner-a';
const queries = [];
const db = {
  auth: { getUser:async token=>({data:{user:token==='valid'?{id:currentUser}:null},error:null}) },
  from(table) {
    const filters = [];
    let patch, deleting = false;
    const query = {
      select(){return query;}, eq(key,value){filters.push([key,value]);return query;}, order(){return query;},
      update(value){patch=value;return query;},
      delete(){deleting=true;return query;},
      async maybeSingle(){if(table==='profiles')return {data:{nickname:'test',instagram_id:'test',status:'approved'},error:null};const row=rows[table].find(row=>filters.every(([key,value])=>row[key]===value))||null;if(row&&patch)Object.assign(row,patch);if(row&&deleting){rows[table]=rows[table].filter(record=>record.id!==row.id);if(table==='customer_records')rows.customer_contracts=rows.customer_contracts.filter(record=>record.customer_id!==row.id);}return {data:row,error:null};},
      async range(){queries.push({table,filters});return {data:rows[table].filter(row=>filters.every(([key,value])=>row[key]===value)),error:null};},
      async insert(row){rows[table].push(row);return {error:null};}
      ,async upsert(row){const existing=rows[table].find(item=>item.user_id===row.user_id);if(existing)Object.assign(existing,row);else rows[table].push(row);return {error:null};}
    };return query;
  },
  async rpc(name,{p_user_id,p_ids}) {
    assert.equal(name,'reorder_customer_records');
    const own=rows.customer_records.filter(row=>row.user_id===p_user_id);
    if(own.length!==p_ids.length||p_ids.some(id=>!own.some(row=>row.id===id)))return {error:{message:'invalid'}};
    p_ids.forEach((id,index)=>{own.find(row=>row.id===id).sort_order=index;});return {error:null};
  }
};
const route = load('../app/api/customers/route.ts', {
  '@supabase/supabase-js': {createClient:()=>db},
  '@/lib/auth/membership':{hasCompletedMembership:()=>true},
  '@/lib/customer-records':crypto,
  '@/app/my-page/customer-form-fields':fields,
  '@/app/my-page/customer-lookup-model':model,
  '@/app/my-page/customer-checklist':checklist,
  '@/lib/customer-calendar':customerCalendar,
});
const {NextRequest} = require('next/server');
const request = (body, token='valid', origin='http://localhost:3000') => new NextRequest('http://localhost:3000/api/customers',{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,origin},...(body?{body:JSON.stringify(body)}:{})});
test('API rejects unauthenticated requests, foreign origins and missing confirmation', async()=>{
  assert.equal((await route.GET(request(null,'invalid'))).status,401);
  assert.equal((await route.POST(request({},'valid','https://other.example'))).status,403);
  assert.equal((await route.POST(request({kind:'customer',recordId:randomUUID(),values:{name:'test',birth:'960901-2'}}))).status,400);
});
test('save and reload use encrypted rows, retries do not duplicate, and another member sees no records',async()=>{
  currentUser='owner-a';
  const recordId=randomUUID(), values={name:'테스트',birth:'960901-2',phone:'010-0000-0000',consentConfirmed:'true'};
  const body={kind:'customer',recordId,user_id:'owner-b',values};
  assert.equal((await route.POST(request(body))).status,201);
  assert.equal(rows.customer_records.length,1);
  assert.equal(rows.customer_records[0].user_id,'owner-a');
  assert.equal(rows.customer_records[0].name,undefined);
  assert.equal((await route.POST(request(body))).status,200);
  assert.equal(rows.customer_records.length,1);
  let response=await (await route.GET(request())).json();
  assert.equal(response.customers[0].name,values.name);
  currentUser='owner-b';
  response=await (await route.GET(request())).json();
  assert.equal(response.customers.length,0);
  assert.ok(queries.every(query=>query.filters.some(([key])=>key==='user_id')));
});
test('contracts must reference a customer belonging to the signed-in member',async()=>{
  const owner=rows.customer_records[0];
  const body={kind:'contract',recordId:randomUUID(),customerId:owner.id,values:{owner:'테스트',ownerBirth:'960901',date:'2026-10-15',premium:'100000',consentConfirmed:'true'}};
  currentUser='owner-b';assert.equal((await route.POST(request(body))).status,400);
  currentUser='owner-a';assert.equal((await route.POST(request(body))).status,201);
  const response=await (await route.GET(request())).json();
  assert.equal(response.contracts[0].customerId,owner.id);
  assert.equal(response.contracts[0].insured,'테스트');
  assert.equal(rows.customer_contracts[0].premium,undefined);
});
test('customer edits stay encrypted, reject another member and stale revisions',async()=>{
  const row=rows.customer_records[0];
  const body={kind:'customer',action:'update',recordId:row.id,revision:1,values:{name:'수정테스트',birth:'960901-2',phone:'010-0000-0001',consentConfirmed:'true'}};
  currentUser='owner-b';assert.equal((await route.POST(request(body))).status,409);
  currentUser='owner-a';let response=await route.POST(request(body));assert.equal(response.status,200);
  assert.equal((await response.json()).record.name,'수정테스트');
  assert.equal(row.name,undefined);assert.equal(row.revision,2);
  assert.equal((await route.POST(request(body))).status,409);
  response=await route.GET(request());assert.equal((await response.json()).customers[0].name,'수정테스트');
});
test('reorder accepts only the complete signed-in members list and reloads the saved order',async()=>{
  currentUser='owner-b';assert.equal((await route.POST(request({action:'reorder',ids:[rows.customer_records[0].id]}))).status,409);
  currentUser='owner-a';assert.equal((await route.POST(request({action:'reorder',ids:[rows.customer_records[0].id]}))).status,200);
  const result=await (await route.GET(request())).json();assert.equal(result.customers[0].sortOrder,'0');
});
test('deletion rejects foreign members and stale revisions, then removes the customer and related contracts',async()=>{
  const row=rows.customer_records[0],body={action:'delete',recordId:row.id,revision:row.revision};
  currentUser='owner-b';assert.equal((await route.POST(request(body))).status,409);
  currentUser='owner-a';assert.equal((await route.POST(request({...body,revision:1}))).status,409);
  assert.equal((await route.POST(request(body))).status,200);
  assert.equal(rows.customer_records.length,0);assert.equal(rows.customer_contracts.length,0);
});

test('multiple vehicles are validated, encrypted and restored with six-digit claim birth',async()=>{
 currentUser='owner-a';
 const vehicles=JSON.stringify([{vehicleNumber:'12가3456',insurer:'차량1보험사'},{vehicleNumber:'34나5678',insurer:'차량2보험사',renewal:'2027-01-01'}]);
 const recordId=randomUUID();
 const response=await route.POST(request({kind:'customer',recordId,values:{name:'차량테스트',birth:'960901-2',vehicles,consentConfirmed:'true'}}));
 assert.equal(response.status,201);
 const record=(await response.json()).record;assert.equal(record.accountBirth,'960901');
 const stored=rows.customer_records.find(row=>row.id===recordId);assert.equal(stored.vehicles,undefined);
 const loaded=await (await route.GET(request())).json();
 const result=JSON.parse(loaded.customers.find(row=>row.id===recordId).vehicles);
 assert.equal(result.length,2);assert.equal(result[1].vehicleNumber,'34나5678');
 assert.equal((await route.POST(request({kind:'customer',recordId:randomUUID(),values:{name:'검증',birth:'960901-2',vehicles:'[{"vehicleNumber":42}]',consentConfirmed:'true'}}))).status,400);
});

test('disclosure questions, answers and details are encrypted and survive customer updates',async()=>{
 currentUser='owner-a';
 const row=rows.customer_records[0];
 const form=disclosure.emptyDisclosure();form[0].answer='yes';form[0].selected=['치료'];form[0].details='테스트 상세 내용';form[1].question='수정한 질문';
 const value=disclosure.serializeDisclosure(form,"알릴의무 추가 메모\n두 번째 줄");
 const response=await route.POST(request({action:'update',kind:'customer',recordId:row.id,revision:row.revision,values:{name:'차량테스트',birth:'960901-2',consentConfirmed:'true',disclosure:value}}));
 assert.equal(response.status,200);assert.equal(row.disclosure,undefined);
 const loaded=await(await route.GET(request())).json();const saved=disclosure.parseDisclosure(loaded.customers[0].disclosure);
 assert.equal(disclosure.disclosureMemo(loaded.customers[0].disclosure),'알릴의무 추가 메모\n두 번째 줄');assert.equal(saved[0].details,'테스트 상세 내용');assert.equal(saved[1].question,'수정한 질문');assert.equal(saved[0].answer,'yes');
 form[0].answer='no';assert.throws(()=>disclosure.parseDisclosure(disclosure.serializeDisclosure(form)));
});

test('consultation registration, edits and deletion stay in the encrypted customer record',async()=>{
 currentUser='owner-a';
 const record=rows.customer_records[0];
 let customer=(await(await route.GET(request())).json()).customers.find(row=>row.id===record.id);
 const createdAt='2026-10-15T05:00:00Z';
 const first={id:randomUUID(),date:'2026-10-15',time:'14:30',place:'상담장소',content:'테스트 상담 기록',createdAt,updatedAt:createdAt};
 const second={...first,id:randomUUID(),date:'2026-10-16',content:'두 번째 테스트 기록'};
 let value=consultations.serializeConsultations([first,second]);
 let response=await route.POST(request({action:'update',kind:'customer',recordId:record.id,revision:Number(customer.revision),values:{...customer,consultations:value}}));
 assert.equal(response.status,200);assert.equal(record.consultations,undefined);
 customer=(await response.json()).record;
 let saved=consultations.parseConsultations(customer.consultations);assert.equal(saved[0].place,'상담장소');assert.equal(saved[0].time,'14:30');
 assert.equal(consultations.sortConsultations(saved)[0].date,'2026-10-16');
 saved[0].content='수정한 상담 기록';
 response=await route.POST(request({action:'update',kind:'customer',recordId:record.id,revision:Number(customer.revision),values:{...customer,consultations:consultations.serializeConsultations(saved.slice(0,1))}}));
 assert.equal(response.status,200);
 customer=(await response.json()).record;saved=consultations.parseConsultations(customer.consultations);
 assert.equal(saved.length,1);assert.equal(saved[0].content,'수정한 상담 기록');assert.ok(customer.disclosure);
 assert.throws(()=>consultations.parseConsultations(consultations.serializeConsultations([{...first,date:'2026-02-30'}])));
 assert.throws(()=>consultations.parseConsultations(consultations.serializeConsultations([{...first,time:'24:99'}])));
 assert.throws(()=>consultations.parseConsultations(consultations.serializeConsultations([first,first])));
});

test('customer checklist toggles persist encrypted without removing other customer sections',async()=>{
 currentUser='owner-a';let customer=(await(await route.GET(request())).json()).customers[0];
 const checked=checklist.emptyCustomerChecklist();checked.analysis=true;checked.renewal=true;
 const result=await route.POST(request({action:'update',kind:'customer',recordId:customer.id,revision:Number(customer.revision),values:{...customer,checklist:checklist.serializeCustomerChecklist(checked)}}));
 assert.equal(result.status,200);assert.equal(rows.customer_records[0].checklist,undefined);
 customer=(await(await route.GET(request())).json()).customers[0];
 assert.equal(checklist.parseCustomerChecklist(customer.checklist).analysis,true);assert.equal(checklist.parseCustomerChecklist(customer.checklist).policy,false);
 assert.ok(customer.consultations);assert.ok(customer.disclosure);
 assert.throws(()=>checklist.parseCustomerChecklist('{"version":1,"checked":{"constructor":true}}'));
});

test('management schedules persist encrypted and reminders expose only own incomplete due items',async()=>{
 currentUser='owner-a';let customer=(await(await route.GET(request())).json()).customers[0];
 const schedules=checklist.emptyCustomerSchedules();
 schedules[0]={...schedules[0],date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}),memo:'비공개 메모'};
 schedules[1]={...schedules[1],date:'2020-01-01',done:true};
 schedules[2]={...schedules[2],date:'2099-01-01'};
 const response=await route.POST(request({action:'update',kind:'customer',recordId:customer.id,revision:Number(customer.revision),values:{...customer,checklist:checklist.serializeCustomerChecklist(checklist.emptyCustomerChecklist(),schedules)}}));
 assert.equal(response.status,200);
 customer=(await response.json()).record;
 assert.equal(checklist.parseCustomerSchedules(customer.checklist)[0].memo,'비공개 메모');
 assert.ok(!Buffer.from(rows.customer_records.find(row=>row.id===customer.id).encrypted_payload,'base64url').toString().includes('비공개 메모'));
 const remindersRequest=()=>new NextRequest('http://localhost:3000/api/customers?view=reminders',{headers:{authorization:'Bearer valid'}});
 let result=await(await route.GET(remindersRequest())).json();
 assert.equal(result.reminders.length,1);assert.equal(result.reminders[0].label,'생일');assert.equal(result.reminders[0].memo,undefined);
 currentUser='different-owner';result=await(await route.GET(remindersRequest())).json();assert.equal(result.reminders.length,0);currentUser='owner-a';
 assert.throws(()=>checklist.parseCustomerSchedules(checklist.serializeCustomerChecklist(checklist.emptyCustomerChecklist(),[{...schedules[0],date:'2026-02-30'}])));
});

test('hospitalization and surgery histories persist encrypted and retain existing disclosure answers',async()=>{
 currentUser='owner-a';let customer=(await(await route.GET(request())).json()).customers[0];
 const histories=disclosure.emptyMedicalHistories();
 assert.equal(histories.hospitalizations.length,3);assert.equal(histories.surgeries.length,3);
 histories.hospitalizations.push({date:'2026-10-15',name:'진단명 테스트',detail:'3일',hospital:'병원 테스트',note:'비공개 입원 기록'});
 histories.surgeries[0]={date:'2026-01-01',name:'수술 테스트',detail:'수술 사유',hospital:'병원',note:'비공개 수술 기록'};
 const value=disclosure.serializeDisclosure(disclosure.parseDisclosure(customer.disclosure),disclosure.disclosureMemo(customer.disclosure),histories);
 const response=await route.POST(request({action:'update',kind:'customer',recordId:customer.id,revision:Number(customer.revision),values:{...customer,disclosure:value}}));
 assert.equal(response.status,200);
 customer=(await(await route.GET(request())).json()).customers[0];
 const saved=disclosure.parseMedicalHistories(customer.disclosure);
 assert.equal(saved.hospitalizations.length,4);assert.equal(saved.surgeries[0].name,'수술 테스트');
 assert.equal(disclosure.parseDisclosure(customer.disclosure).length,4);
 const raw=Buffer.from(rows.customer_records.find(row=>row.id===customer.id).encrypted_payload,'base64url').toString();
 assert.ok(!raw.includes('비공개 입원 기록'));assert.ok(!raw.includes('비공개 수술 기록'));
 assert.throws(()=>disclosure.parseMedicalHistories(JSON.stringify({hospitalizations:[{date:123}]})));
 assert.equal(disclosure.parseMedicalHistories('{"version":1}').surgeries.length,3);
});

test('customer calendar shows birthdays, multiple vehicle renewals and both contract deadlines only to the owner',async()=>{
 currentUser='owner-a';
 const customer=(await(await route.GET(request())).json()).customers[0];
 const from='2026-09-01',to='2026-10-31';
 const events=customerCalendar.buildCustomerCalendar([{...customer,birth:'960901-2',vehicles:JSON.stringify([{vehicleNumber:'차량1',renewal:'2026-10-01'},{vehicleNumber:'차량2',renewal:'2026-10-02'}])}],[{id:'c1',customerId:customer.id,date:'2026-08-01',insured:customer.name,insuredBirth:'960901',immunity:'1',reduction:'2',product:'테스트 상품',createdAt:''}],from,to,value=>require('node:crypto').createHash('sha256').update(value).digest('hex'));
 assert.equal(events.filter(event=>event.kind==='birthday').length,1);assert.equal(events.filter(event=>event.kind==='renewal').length,2);
 assert.equal(events.find(event=>event.kind==='immunity').date,'2026-09-01');assert.equal(events.find(event=>event.kind==='reduction').date,'2026-10-01');
 assert.ok(events.every(event=>event.birth==='960901'));
 const calendarRequest=()=>new NextRequest('http://localhost:3000/api/customers?view=calendar&from=2026-09-01&to=2026-10-31',{headers:{authorization:'Bearer valid'}});
 assert.equal((await route.GET(calendarRequest())).status,200);
 currentUser='different-owner';assert.equal((await(await route.GET(calendarRequest())).json()).events.length,0);currentUser='owner-a';
});

test('consultation management table survives save and reload beside detailed notes',async()=>{
 currentUser='owner-a';let customer=(await(await route.GET(request())).json()).customers[0];
 const entries=consultations.parseConsultations(customer.consultations);
 const records=[{id:randomUUID(),date:'2026-10-15',content:'보장 점검 상담',reaction:'검토 후 연락',nextContact:'2026-10-20',status:'검토 중'}];
 const response=await route.POST(request({action:'update',kind:'customer',recordId:customer.id,revision:Number(customer.revision),values:{...customer,consultations:consultations.serializeConsultations(entries,records)}}));
 assert.equal(response.status,200);
 customer=(await(await route.GET(request())).json()).customers[0];
 assert.equal(consultations.parseConsultationRecords(customer.consultations)[0].reaction,'검토 후 연락');
 assert.equal(consultations.parseConsultations(customer.consultations).length,entries.length);
 const encrypted=rows.customer_records.find(row=>row.id===customer.id).encrypted_payload;
 assert.ok(!Buffer.from(encrypted,'base64url').toString().includes('검토 후 연락'));
 assert.throws(()=>consultations.parseConsultationRecords(consultations.serializeConsultations(entries,[{...records[0],nextContact:'2026-02-30'}])));
 assert.throws(()=>consultations.parseConsultationRecords(consultations.serializeConsultations(entries,[{...records[0],status:'unknown'}])));
});

test('last viewed customer is stored per member and foreign customers cannot be selected',async()=>{
 currentUser='owner-a';const customer=(await(await route.GET(request())).json()).customers[0];
 assert.equal((await route.POST(request({action:'select',customerId:customer.id}))).status,200);
 const selection=()=>new NextRequest('http://localhost:3000/api/customers?view=selection',{headers:{authorization:'Bearer valid'}});
 assert.equal((await(await route.GET(selection())).json()).customerId,customer.id);
 currentUser='different-owner';assert.equal((await(await route.GET(selection())).json()).customerId,null);
 assert.equal((await route.POST(request({action:'select',customerId:customer.id}))).status,404);
 currentUser='owner-a';
});

test('contracts can be edited and deleted without changing their customer or another members records',async()=>{
 currentUser='owner-a';const customer=(await(await route.GET(request())).json()).customers[0];
 const add=await route.POST(request({kind:'contract',recordId:randomUUID(),customerId:customer.id,values:{owner:customer.name,ownerBirth:customer.birth.replace(/\D/g,'').slice(0,6),date:'2026-10-15',product:'수정 전 상품',consentConfirmed:'true'}}));
 assert.equal(add.status,201);let contract=(await add.json()).record;
 const edit=await route.POST(request({kind:'contract',action:'update',recordId:contract.id,customerId:customer.id,revision:Number(contract.revision),values:{...contract,product:'수정 후 상품',premium:'150000'}}));
 assert.equal(edit.status,200);contract=(await edit.json()).record;
 assert.equal(contract.product,'수정 후 상품');assert.equal(contract.premium,'150000');
 const body={action:'delete',kind:'contract',recordId:contract.id,revision:Number(contract.revision)};
 currentUser='different-owner';assert.equal((await route.POST(request(body))).status,409);
 currentUser='owner-a';assert.equal((await route.POST(request({...body,revision:1}))).status,409);
 assert.equal((await route.POST(request(body))).status,200);
 const result=await(await route.GET(request())).json();assert.ok(result.customers.some(row=>row.id===customer.id));assert.ok(!result.contracts.some(row=>row.id===contract.id));
});

test('birthday schedules derive from birth, allow manual dates and repeat annually with reset completion',()=>{
 let rows=checklist.customerBirthdaySchedules(undefined,'960901-2','2026-08-01');
 assert.equal(rows[0].date,'2026-09-01');
 assert.equal(checklist.customerBirthdaySchedules(undefined,'960901-2','2026-10-15')[0].date,'2027-09-01');
 rows[0]={...rows[0],date:'2026-10-20',annualMonthDay:'10-20',done:true};
 const saved=checklist.serializeCustomerChecklist(checklist.emptyCustomerChecklist(),rows);
 assert.equal(checklist.customerBirthdaySchedules(saved,'960901-2','2026-10-20')[0].done,true);
 const next=checklist.customerBirthdaySchedules(saved,'960901-2','2027-01-01')[0];
 assert.equal(next.date,'2027-10-20');assert.equal(next.done,false);
 const leap=checklist.customerBirthdaySchedules(undefined,'000229-3','2027-01-01')[0];
 assert.equal(leap.date,'2027-02-28');assert.equal(leap.annualMonthDay,'02-29');
 assert.equal(checklist.customerBirthdaySchedules(checklist.serializeCustomerChecklist(checklist.emptyCustomerChecklist(),[leap]),'000229-3','2028-01-01')[0].date,'2028-02-29');
});

test('customer banner completion updates the encrypted checklist and removes only that due reminder',async()=>{
 currentUser='owner-a';let customer=(await(await route.GET(request())).json()).customers[0];
 const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const schedules=checklist.emptyCustomerSchedules();schedules[2].date=today;
 const saved=await route.POST(request({action:'update',kind:'customer',recordId:customer.id,revision:Number(customer.revision),values:{...customer,checklist:checklist.serializeCustomerChecklist(checklist.emptyCustomerChecklist(),schedules)}}));assert.equal(saved.status,200);
 const body={action:'complete-schedule',customerId:customer.id,scheduleId:schedules[2].id,date:today};
 currentUser='different-owner';assert.equal((await route.POST(request(body))).status,404);currentUser='owner-a';
 assert.equal((await route.POST(request({...body,date:'2000-01-01'}))).status,409);
 assert.equal((await route.POST(request(body))).status,200);
 customer=(await(await route.GET(request())).json()).customers[0];assert.equal(checklist.parseCustomerSchedules(customer.checklist).find(row=>row.id===schedules[2].id).done,true);
 const banner=await(await route.GET(new NextRequest('http://localhost:3000/api/customers?view=reminders',{headers:{authorization:'Bearer valid'}}))).json();
 assert.ok(!banner.reminders.some(row=>row.customerId===customer.id&&row.scheduleId===schedules[2].id));
});
