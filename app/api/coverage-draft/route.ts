import {NextRequest,NextResponse} from 'next/server';
import {coverageDraftId} from '@/lib/coverage-draft-id';
import {createClient} from '@supabase/supabase-js';
import {requireMember} from '@/lib/notion-crm/member';
import {openCustomerData,sealCustomerData} from '@/lib/customer-records';
import {validateCoverageDraft} from '@/lib/coverage-draft';
export const runtime='nodejs';
const VERSION=6;
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store, private'}});
async function access(request:NextRequest){
 const member=await requireMember(request),name=request.nextUrl.searchParams.get('name'),birth=request.nextUrl.searchParams.get('birth');
 if(name!==null&&(!name.trim()||name.length>60||!/^\d{6}$/.test(birth||'')))throw Error('동기화할 고객명과 생년월일을 확인해 주세요');
 const documentId=request.nextUrl.searchParams.get('documentId');if(documentId&&documentId.length>180)throw Error('문서 정보를 확인해 주세요');
 const scope=documentId?':document:'+documentId:request.nextUrl.searchParams.get('area')==='advisor'?':advisor':name===null?'':':'+JSON.stringify([name.trim().normalize('NFC').replace(/\s/g,''),birth]);
 const id=coverageDraftId(member.id,scope);
 return {owner:member.id,id,db:createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})};
}
const fail=(error:unknown)=>json({error:error instanceof Error?error.message:'작성 내용을 저장하지 못했습니다'},Number((error as {status?:number})?.status)||400);
export async function GET(request:NextRequest){try{
 const {owner,id,db}=await access(request);
 const {data,error}=await db.from('customer_records').select('encrypted_payload,encryption_key_id,revision').eq('user_id',owner).eq('id',id).eq('payload_version',VERSION).maybeSingle();
 if(error)throw Error('자동 저장 내용을 불러오지 못했습니다');
 if(data&&data.encryption_key_id!=='v1')throw Error('저장 암호화 버전을 확인해 주세요');
 return json({revision:data?.revision||0,draft:data?validateCoverageDraft(JSON.parse(openCustomerData(data.encrypted_payload,owner,'coverage-draft',id).draft)):null});
 }catch(error){return fail(error);}}
export async function PUT(request:NextRequest){try{
 if(Number(request.headers.get('content-length')||0)>4000000)return json({error:'작성 내용이 너무 큽니다'},413);
 const raw=await request.text();if(Buffer.byteLength(raw)>4000000)return json({error:'작성 내용이 너무 큽니다'},413);
 const body=JSON.parse(raw),draft=validateCoverageDraft(body.draft);
 const scopeName=request.nextUrl.searchParams.get('name'),scopeBirth=request.nextUrl.searchParams.get('birth');
 if(scopeName!==null&&(scopeName.trim().normalize('NFC').replace(/\s/g,'')!==draft.before.name.trim().normalize('NFC').replace(/\s/g,'')||scopeBirth!==draft.before.birth))throw Error('고객 정보가 바뀌었습니다 해당 고객을 다시 불러와 주세요');
 if(!Number.isSafeInteger(body.revision)||body.revision<0)throw Error('자동 저장 버전을 확인해 주세요');
 const {owner,id,db}=await access(request),values={encrypted_payload:sealCustomerData({draft:JSON.stringify(draft)},owner,'coverage-draft',id),revision:body.revision+1,updated_at:new Date().toISOString()};
 const result=body.revision===0?await db.from('customer_records').insert({...values,id,user_id:owner,payload_version:VERSION,encryption_key_id:'v1'}).select('revision').single():await db.from('customer_records').update(values).eq('user_id',owner).eq('id',id).eq('payload_version',VERSION).eq('revision',body.revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||!result.error&&!result.data)return json({error:'다른 화면에서 작성 내용이 변경됐습니다'},409);
 if(result.error||!result.data)throw Error('자동 저장하지 못했습니다');
 return json({revision:result.data.revision});
 }catch(error){return fail(error);}}
