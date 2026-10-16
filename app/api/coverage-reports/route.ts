import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasCompletedMembership } from "@/lib/auth/membership";
import { openCustomerData, sealCustomerData } from "@/lib/customer-records";
import { validateCoverageSet } from "@/lib/coverage-storage";
export const runtime="nodejs";
const json=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store, private"}});
async function authenticate(request:NextRequest){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return {error:json({error:"로그인해 주세요."},401)};
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return {error:json({error:"로그인해 주세요."},401)};
 const {data:profile}=await db.from("profiles").select("nickname,instagram_id,status,role").eq("id",user.id).maybeSingle();
 if(!hasCompletedMembership(profile)||profile?.status!=="approved"&&profile?.role!=="admin")return {error:json({error:"승인된 회원만 사용할 수 있습니다."},403)};
 return {db,user};
}
export async function GET(request:NextRequest){try{
 const auth=await authenticate(request);if(auth.error)return auth.error;const {db,user}=auth;
 const customerId=request.nextUrl.searchParams.get("customerId");
 if(!customerId){
  const name=(request.nextUrl.searchParams.get("name")||"").trim(),birth=(request.nextUrl.searchParams.get("birth")||"").replace(/\D/g,"");
  if((!name&&!birth)||name.length>60||birth.length>7)return json({customers:[]});
  const customers:{id:string;name:string;birth:string}[]=[];
  for(let from=0;;from+=500){const {data,error}=await db.from("customer_records").select("id,encrypted_payload,encryption_key_id").eq("user_id",user.id).order("id").range(from,from+499);if(error)throw error;
   for(const row of data||[]){if(row.encryption_key_id!=="v1")throw new Error("key");const c=openCustomerData(row.encrypted_payload,user.id,"customer",row.id);if((!name||c.name?.includes(name))&&(!birth||c.birth?.replace(/\D/g,"").startsWith(birth)))customers.push({id:row.id,name:c.name,birth:c.birth.slice(0,6)});}
   if(!data||data.length<500)break;
  }return json({customers:customers.slice(0,30)});
 }
 const {data:owner,error:ownerError}=await db.from("customer_records").select("id").eq("user_id",user.id).eq("id",customerId).maybeSingle();if(ownerError||!owner)return json({error:"등록된 고객을 찾지 못했습니다."},404);
 const {data,error}=await db.from("customer_coverage_reports").select("encrypted_payload,encryption_key_id,revision").eq("user_id",user.id).eq("customer_id",customerId).maybeSingle();if(error)throw error;if(!data)return json({report:null,revision:0});if(data.encryption_key_id!=="v1")throw new Error("key");
 return json({report:validateCoverageSet(JSON.parse(openCustomerData(data.encrypted_payload,user.id,"coverage-report",customerId).report)),revision:data.revision});
 }catch{return json({error:"보장분석 저장소를 확인해 주세요."},503);}}
export async function PUT(request:NextRequest){try{
 const auth=await authenticate(request);if(auth.error)return auth.error;const {db,user}=auth;
 const raw=await request.text();if(raw.length>1000000)return json({error:"보고서가 너무 큽니다."},400);const body=JSON.parse(raw);
 if(typeof body.customerId!=="string"||!Number.isInteger(body.revision)||body.revision<0)return json({error:"저장할 고객을 확인해 주세요."},400);
 const {data:customer,error:failed}=await db.from("customer_records").select("id,encrypted_payload,encryption_key_id").eq("user_id",user.id).eq("id",body.customerId).maybeSingle();if(failed||!customer)return json({error:"등록된 고객을 찾지 못했습니다."},404);if(customer.encryption_key_id!=="v1")throw new Error("key");
 const owner=openCustomerData(customer.encrypted_payload,user.id,"customer",customer.id),report=validateCoverageSet(body.report);
 for(const r of [report.before,report.after]){r.name=owner.name;r.birth=owner.birth.slice(0,6);}
 const values={encrypted_payload:sealCustomerData({report:JSON.stringify(report)},user.id,"coverage-report",customer.id),revision:body.revision+1,updated_at:new Date().toISOString()};
 const result=body.revision===0?await db.from("customer_coverage_reports").insert({...values,user_id:user.id,customer_id:customer.id}).select("revision").single():await db.from("customer_coverage_reports").update(values).eq("user_id",user.id).eq("customer_id",customer.id).eq("revision",body.revision).select("revision").maybeSingle();
 if(result.error?.code==="23505"||!result.error&&!result.data)return json({error:"다른 화면에서 수정되었습니다. 다시 불러온 뒤 저장해 주세요."},409);if(result.error)throw result.error;
 if(!result.data)return json({error:"다시 불러온 뒤 저장해 주세요."},409);
 return json({revision:result.data.revision});
 }catch{return json({error:"보장분석을 저장하지 못했습니다. 입력 내용과 저장소를 확인해 주세요."},503);}}
