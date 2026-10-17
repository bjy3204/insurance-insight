import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {requireMember} from '@/lib/notion-crm/member';
import {CrmError} from '@/lib/notion-crm/server';
import {emptyData,isSource,type CrmData,type Source} from '@/lib/notion-crm/model';
import {NATIVE_PAYLOAD_VERSION,nativeValues,openNative,sealNative,type NativeRecord} from '@/lib/notion-crm/native-records';
export const runtime='nodejs';
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store, private'}});
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
const fail=(error:unknown)=>json({error:error instanceof CrmError?error.message:'고객정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'},error instanceof CrmError?error.status:503);
async function read(owner:string){
 const database=db(),data=emptyData();
 for(let start=0;;start+=500){
  const result=await database.from('customer_records').select('*').eq('user_id',owner).eq('payload_version',NATIVE_PAYLOAD_VERSION).order('created_at').order('id').range(start,start+499);
  if(result.error)throw new CrmError('고객정보 저장소를 불러오지 못했습니다.',503);
  for(const row of result.data||[]){const item=openNative(row as NativeRecord);data[item.source].push(item.record);}
  if(!result.data||result.data.length<500)return data;
  if(start>=10000)throw new CrmError('관리 항목이 10,000개를 초과했습니다.',413);
 }
}
export async function GET(request:NextRequest){try{const member=await requireMember(request);if(request.nextUrl.searchParams.get('status')==='1')return json({configured:true,connected:true,ready:true,workspace:'연결 없이 사용하기'});const data=await read(member.id);return json({data:request.nextUrl.searchParams.get('source')==='events'?{events:data.events}:data});}catch(error){return fail(error);}}
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'잘못된 요청입니다.'},403);
 try{
  const member=await requireMember(request),text=await request.text();if(Buffer.byteLength(text)>1048576)throw new CrmError('입력 내용이 너무 깁니다.',413);
  let body;try{body=JSON.parse(text);}catch{throw new CrmError('입력 내용을 확인해 주세요.');}
  if(!isSource(body.source)||body.source==='cards'||!['save','delete'].includes(body.action))throw new CrmError('연결 없이 사용하기에서는 카드수납을 사용할 수 없습니다.');
  const source:Source=body.source,data:CrmData=await read(member.id),old=body.id?data[source].find(row=>row.id===body.id):undefined;
  if(body.id&&!old)throw new CrmError('등록된 항목을 찾지 못했습니다.',404);
  if(old&&old.edited!==body.edited)throw new CrmError('내용이 변경되었습니다. 새로고침 후 다시 수정해 주세요.',409);
  const database=db();
  if(body.action==='delete'){
   if(!old)throw new CrmError('삭제할 항목을 확인해 주세요.');
   if(source==='customers'&&Object.values(data).flat().some(row=>Array.isArray(row.values['고객'])&&row.values['고객'].includes(old.id)))throw new CrmError('연결된 계약·차량·일정을 먼저 정리해 주세요.',409);
   const result=await database.from('customer_records').delete().eq('user_id',member.id).eq('payload_version',NATIVE_PAYLOAD_VERSION).eq('id',old.id).eq('revision',Number(old.edited)).select('id').maybeSingle();
   if(result.error||!result.data)throw new CrmError('삭제하지 못했습니다. 새로고침 후 다시 시도해 주세요.',409);return json({deleted:true});
  }
  const values=nativeValues(source,body.values,old?.values);
  if(source!=='customers'){
   const ids=values['고객'];if(!Array.isArray(ids)||(source!=='events'&&ids.length!==1)||ids.length>1||ids.some(id=>!data.customers.some(row=>row.id===id)))throw new CrmError('등록된 고객을 선택해 주세요.');
  }
  const id=old?.id||body.requestId||randomUUID();if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))throw new CrmError('추가 요청을 확인해 주세요.');
  if(!old&&Object.values(data).flat().some(row=>row.id===id))throw new CrmError('이미 저장된 추가 요청입니다. 새로고침해 주세요.',409);
  if(!old&&source==='customers'&&data.customers.some(row=>String(row.values['이름']).replace(/\s/g,'')===String(values['이름']).replace(/\s/g,'')&&row.values['주민번호']===values['주민번호']))throw new CrmError('동일한 이름·생년월일의 고객이 이미 등록되어 있습니다.',409);
  const now=new Date().toISOString(),payload={encrypted_payload:sealNative(source,values,member.id,id),updated_at:now,revision:old?Number(old.edited)+1:1};
  const result=old?await database.from('customer_records').update(payload).eq('user_id',member.id).eq('payload_version',NATIVE_PAYLOAD_VERSION).eq('id',id).eq('revision',Number(old.edited)).select('*').maybeSingle():await database.from('customer_records').insert({...payload,id,user_id:member.id,encryption_key_id:'v1',payload_version:NATIVE_PAYLOAD_VERSION,created_at:now}).select('*').single();
  if(result.error||!result.data)throw new CrmError('저장하지 못했습니다. 새로고침 후 다시 시도해 주세요.',409);
  return json({record:openNative(result.data as NativeRecord).record});
 }catch(error){return fail(error);}
}
