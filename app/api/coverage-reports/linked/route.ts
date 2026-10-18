import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireMember} from '@/lib/notion-crm/member';
import {GET as notionCustomers} from '@/app/api/notion-crm/route';
import {GET as sheetsCustomers} from '@/app/api/notion-crm/sheets/route';
import {GET as nativeCustomers} from '@/app/api/notion-crm/native/route';
import {coverageProvider,linkedCoverageId,LINKED_COVERAGE_VERSION,openLinkedCoverage,sealLinkedCoverage} from '@/lib/linked-coverage-storage';
import {validateCoverageSet} from '@/lib/coverage-storage';
import {validateCoverageDraft} from '@/lib/coverage-draft';
import {openCustomerData} from '@/lib/customer-records';
import {coverageDraftId} from '@/lib/coverage-draft-id';
import type {CrmRow} from '@/lib/notion-crm/model';
export const runtime='nodejs';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store, private'}});
async function access(request:NextRequest,provider:unknown,customerId:unknown){
 const member=await requireMember(request);
 if(!coverageProvider(provider)||typeof customerId!=='string'||!customerId||customerId.length>128)throw Error('연결할 고객을 선택해 주세요');
 const url=new URL(request.url);url.searchParams.set('source','customers');url.searchParams.delete('status');
 const response=await ({notion:notionCustomers,sheets:sheetsCustomers,native:nativeCustomers}[provider])(new NextRequest(url,{headers:request.headers}));
 if(!response.ok)throw Error('고객 저장소에 다시 연결해 주세요');
 const body=await response.json(),customer=(body.data?.customers as CrmRow[]||[]).find(row=>row.id===customerId);
 if(!customer)throw Error('현재 저장소에 등록된 고객을 찾지 못했습니다');
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 return {member,db,provider,customer,id:linkedCoverageId(member.id,provider,customerId)};
}
export async function GET(request:NextRequest){try{
 if(request.nextUrl.searchParams.get('list')==='1'){
  const member=await requireMember(request),provider=request.nextUrl.searchParams.get('provider');if(!coverageProvider(provider))throw Error('고객 저장소를 확인해 주세요');
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}}),ids:string[]=[];
  for(const version of [LINKED_COVERAGE_VERSION,5,6])for(let start=0;;start+=500){
   const {data,error}=await db.from('customer_records').select('id,encrypted_payload').eq('user_id',member.id).eq('payload_version',version).order('id').range(start,start+499);if(error)throw Error('저장 목록을 불러오지 못했습니다');
   for(const row of data||[]){
    const kind=version===6?'coverage-draft':version===5?'personal-coverage':'linked-coverage',value=openCustomerData(row.encrypted_payload,member.id,kind,row.id);
    if(version===6){const draft=validateCoverageDraft(JSON.parse(value.draft));if(draft.provider===provider&&draft.customerId&&!draft.customerId.startsWith('personal:'))ids.push(draft.customerId);}
    else if(version===5){if(value.linkedProvider===provider&&value.linkedCustomerId)ids.push(value.linkedCustomerId);}
    else if(value.provider===provider&&value.customerId)ids.push(value.customerId);
   }
   if(!data||data.length<500)break;
  }
  return json({ids:[...new Set(ids)]});
 }
 const {member,db,provider,customer,id}=await access(request,request.nextUrl.searchParams.get('provider'),request.nextUrl.searchParams.get('customerId'));
 const {data,error}=await db.from('customer_records').select('encrypted_payload,encryption_key_id,revision').eq('user_id',member.id).eq('payload_version',LINKED_COVERAGE_VERSION).eq('id',id).maybeSingle();
 if(error)throw Error('보장분석표 저장소를 읽지 못했습니다');
 if(!data){
  const draftId=coverageDraftId(member.id,':document:'+provider+':'+customer.id);
  const draftRow=await db.from('customer_records').select('encrypted_payload').eq('user_id',member.id).eq('payload_version',6).eq('id',draftId).maybeSingle();
  if(draftRow.error)throw Error('자동 저장 리포트를 읽지 못했습니다');
  if(draftRow.data){const value=openCustomerData(draftRow.data.encrypted_payload,member.id,'coverage-draft',draftId),draft=validateCoverageDraft(JSON.parse(value.draft));if(draft.provider===provider&&draft.customerId===customer.id)return json({report:validateCoverageSet(draft),revision:0});}
  return json({report:null,revision:0});
 }
 if(data.encryption_key_id!=='v1')throw Error('암호화 키를 확인해 주세요');
 return json({report:openLinkedCoverage(data.encrypted_payload,member.id,provider,customer.id),revision:data.revision});
 }catch(error){return json({error:error instanceof Error?error.message:'불러오지 못했습니다'},400);}}
export async function PUT(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'잘못된 요청입니다'},403);
 try{
 const raw=await request.text();if(Buffer.byteLength(raw)>1000000)return json({error:'보고서가 너무 큽니다'},413);
 const body=JSON.parse(raw);if(!Number.isSafeInteger(body.revision)||body.revision<0)return json({error:'저장 버전을 확인해 주세요'},400);
 const {member,db,provider,customer,id}=await access(request,body.provider,body.customerId);
 const report=validateCoverageSet(body.report),birth=String(customer.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(customer.values['생년월일']||'').slice(2,10).replace(/\D/g,'');
 for(const value of [report.before,report.after]){value.name=String(customer.values['이름']||'');value.birth=birth;}
 const payload={encrypted_payload:sealLinkedCoverage(member.id,provider,customer.id,report),revision:body.revision+1,updated_at:new Date().toISOString()};
 const result=body.revision===0?await db.from('customer_records').insert({...payload,id,user_id:member.id,payload_version:LINKED_COVERAGE_VERSION,encryption_key_id:'v1'}).select('revision').single():await db.from('customer_records').update(payload).eq('user_id',member.id).eq('payload_version',LINKED_COVERAGE_VERSION).eq('id',id).eq('revision',body.revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||!result.error&&!result.data)return json({error:'다른 화면에서 수정됐습니다 고객을 다시 선택해 불러온 뒤 저장해 주세요'},409);
 if(result.error||!result.data)throw Error('보장분석표를 저장하지 못했습니다');
 return json({revision:result.data.revision});
 }catch(error){return json({error:error instanceof Error?error.message:'저장하지 못했습니다'},400);}
}

export async function DELETE(request:NextRequest){try{
 const {member,db,id,provider,customer}=await access(request,request.nextUrl.searchParams.get('provider'),request.nextUrl.searchParams.get('customerId'));
 const cleared=await db.from('customer_records').delete().eq('user_id',member.id).eq('payload_version',6).eq('id',coverageDraftId(member.id,':document:'+provider+':'+customer.id));if(cleared.error)throw Error('자동 저장 내용을 삭제하지 못했습니다');
 const result=await db.from('customer_records').delete().eq('user_id',member.id).eq('payload_version',LINKED_COVERAGE_VERSION).eq('id',id);
 if(result.error)throw Error('리포트를 삭제하지 못했습니다');return json({deleted:true});
 }catch(error){return json({error:error instanceof Error?error.message:'삭제하지 못했습니다'},400);}}
