import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {requireMember} from '@/lib/notion-crm/member';
import {openCustomerData,sealCustomerData} from '@/lib/customer-records';
import {validateCoverageSet} from '@/lib/coverage-storage';
export const runtime='nodejs';
const VERSION=5;
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store, private'}});
function reportId(owner:string,name:string,birth:string){const h=createHash('sha256').update(JSON.stringify(['personal-coverage',owner,name.trim().replace(/\s/g,''),birth])).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;}
async function access(request:NextRequest){const member=await requireMember(request);const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});return {owner:member.id,db};}
function decode(payload:string,owner:string,id:string){return validateCoverageSet(JSON.parse(openCustomerData(payload,owner,'personal-coverage',id).report));}
export async function GET(request:NextRequest){try{
 const {owner,db}=await access(request),params=request.nextUrl.searchParams;
 let id=params.get('id');
 if(params.has('name')){const name=params.get('name')||'',birth=params.get('birth')||'';if(!name.trim()||name.length>60||!/^\d{6}$/.test(birth))throw Error('이름과 생년월일 6자리를 확인해 주세요');id=reportId(owner,name,birth);}
 if(id){if(!/^[a-f0-9-]{36}$/.test(id))throw Error('저장 정보를 확인해 주세요');const {data,error}=await db.from('customer_records').select('encrypted_payload,encryption_key_id,revision').eq('user_id',owner).eq('payload_version',VERSION).eq('id',id).maybeSingle();if(error)throw Error('보장분석표를 불러오지 못했습니다');return json({id,revision:data?.revision||0,report:data?decode(data.encrypted_payload,owner,id):null});}
 const reports=[];
 for(let start=0;;start+=500){const {data,error}=await db.from('customer_records').select('id,encrypted_payload,revision').eq('user_id',owner).eq('payload_version',VERSION).order('id').range(start,start+499);if(error)throw Error('저장 목록을 불러오지 못했습니다');for(const row of data||[]){const report=decode(row.encrypted_payload,owner,row.id);reports.push({id:row.id,name:report.before.name,birth:report.before.birth});}if(!data||data.length<500)break;}
 return json({reports});
 }catch(error){return json({error:error instanceof Error?error.message:'불러오지 못했습니다'},400);}}
export async function PUT(request:NextRequest){try{
 if(Number(request.headers.get('content-length')||0)>4000000)return json({error:'저장 내용이 너무 큽니다'},413);
 const {owner,db}=await access(request),body=await request.json(),report=validateCoverageSet(body.report),name=report.before.name.trim(),birth=report.before.birth;
 if(!name||!/^\d{6}$/.test(birth)||!Number.isSafeInteger(body.revision)||body.revision<0)throw Error('이름과 생년월일 6자리, 저장 버전을 확인해 주세요');
 report.before.name=name;report.after.name=name;report.after.birth=birth;
 const id=reportId(owner,name,birth),values={encrypted_payload:sealCustomerData({report:JSON.stringify(report)},owner,'personal-coverage',id),revision:body.revision+1,updated_at:new Date().toISOString()};
 if(body.id&&body.id!==id)throw Error('고객 이름이 변경됐습니다 새 이름으로 다시 저장해 주세요');
 const result=body.revision===0?await db.from('customer_records').insert({...values,id,user_id:owner,payload_version:VERSION,encryption_key_id:'v1'}).select('revision').single():await db.from('customer_records').update(values).eq('user_id',owner).eq('id',id).eq('payload_version',VERSION).eq('revision',body.revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||!result.error&&!result.data)return json({error:'다른 화면에서 수정됐습니다 다시 불러온 뒤 저장해 주세요'},409);
 if(result.error||!result.data)throw Error('보장분석표를 저장하지 못했습니다');
 return json({id,revision:result.data.revision});
 }catch(error){return json({error:error instanceof Error?error.message:'저장하지 못했습니다'},400);}}
