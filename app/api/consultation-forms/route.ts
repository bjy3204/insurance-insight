import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import {requireMember} from '@/lib/notion-crm/member';
import {sealCustomerData,openCustomerData} from '@/lib/customer-records';
export const runtime='nodejs';
const VERSION=4;
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store, private'}});
function validate(value:unknown){
 const body=value as {labels?:unknown;color?:unknown};
 if(!body||!body.labels||typeof body.labels!=='object'||Array.isArray(body.labels)||Object.keys(body.labels).length>200)throw Error('서식 문구를 확인해 주세요');
 const labels:Record<string,string>={};
 for(const [key,text] of Object.entries(body.labels)){if(!/^[a-z0-9-]{1,79}$/.test(key)||typeof text!=='string'||text.length>400)throw Error('서식 문구를 확인해 주세요');labels[key]=text;}
 if(typeof body.color!=='string'||!/^#[a-f0-9]{6}$/i.test(body.color))throw Error('서식 색상을 확인해 주세요');
 return {labels,color:body.color};
}
async function access(request:NextRequest){
 const member=await requireMember(request),hash=createHash('sha256').update('consultation-forms:'+member.id).digest('hex');
 const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 return {owner:member.id,id,db};
}
export async function GET(request:NextRequest){try{
 const {owner,id,db}=await access(request);
 const {data,error}=await db.from('customer_records').select('encrypted_payload,revision,encryption_key_id').eq('user_id',owner).eq('id',id).eq('payload_version',VERSION).maybeSingle();
 if(error)throw Error('상담 서식을 불러오지 못했습니다');
 if(!data)return json({form:null,revision:0});
 if(data.encryption_key_id!=='v1')throw Error('저장 암호화 버전을 확인해 주세요');
 return json({form:validate(JSON.parse(openCustomerData(data.encrypted_payload,owner,'consultation-forms',id).form)),revision:data.revision});
 }catch(error){return json({error:error instanceof Error?error.message:'불러오지 못했습니다'},400);}}
export async function PUT(request:NextRequest){try{
 if(Number(request.headers.get('content-length')||0)>400000)return json({error:'서식 내용이 너무 큽니다'},413);
 const body=await request.json(),form=validate(body.form);
 if(!Number.isSafeInteger(body.revision)||body.revision<0)return json({error:'저장 버전을 확인해 주세요'},400);
 const {owner,id,db}=await access(request);
 const values={encrypted_payload:sealCustomerData({form:JSON.stringify(form)},owner,'consultation-forms',id),revision:body.revision+1,updated_at:new Date().toISOString()};
 const result=body.revision===0?await db.from('customer_records').insert({...values,id,user_id:owner,payload_version:VERSION,encryption_key_id:'v1'}).select('revision').single():await db.from('customer_records').update(values).eq('id',id).eq('user_id',owner).eq('payload_version',VERSION).eq('revision',body.revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||!result.error&&!result.data)return json({error:'다른 화면에서 수정됐습니다 새로 불러온 뒤 저장해 주세요'},409);
 if(result.error||!result.data)throw Error('상담 서식을 저장하지 못했습니다 다시 시도해 주세요');
 return json({revision:result.data.revision});
 }catch(error){return json({error:error instanceof Error?error.message:'저장하지 못했습니다'},400);}}
