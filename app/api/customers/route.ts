import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasCompletedMembership } from "@/lib/auth/membership";
import { openCustomerData, sealCustomerData, validateCustomerValues } from "@/lib/customer-records";
import { withContractDefaults, withCustomerClaimDefaults, shortCustomerBirth } from "@/app/my-page/customer-form-fields";
import { customerBirthDate, medicalMaturity } from "@/app/my-page/customer-lookup-model";
import { emptyCustomerChecklist, parseCustomerChecklist, serializeCustomerChecklist, customerBirthdaySchedules } from "@/app/my-page/customer-checklist";
import { buildCustomerCalendar } from "@/lib/customer-calendar";
import { createHmac } from "node:crypto";
import type { StoredCustomer, StoredContract } from "@/lib/customer-records";

export const runtime = "nodejs";
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, private" } });
async function authenticate(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { error: json({ error: "다시 로그인해 주세요" }, 401) };
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return { error: json({ error: "다시 로그인해 주세요" }, 401) };
  const { data: profile, error: profileError } = await db.from("profiles").select("nickname,instagram_id,role,status").eq("id", user.id).maybeSingle();
  if (profileError || !hasCompletedMembership(profile) || profile?.status !== "approved" && profile?.role !== "admin") return { error: json({ error: "승인된 회원만 사용할 수 있습니다" }, 403) };
  return { db, user };
}
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request); if (auth.error) return auth.error;
    const { db, user } = auth;
    if(request.nextUrl.searchParams.get("view")==="selection"){
      const {data,error}=await db.from("customer_view_preferences").select("customer_id").eq("user_id",user.id).maybeSingle();
      if(error)throw new Error("selection_unavailable");
      return json({customerId:data?.customer_id||null});
    }
    // Paginate rather than silently truncating the directory at Supabase's row limit.
    async function read(table: string, kind: string) {
      const result: Record<string,string>[] = [];
      for (let start = 0; ; start += 500) {
        const { data, error } = await db.from(table).select("*").eq("user_id", user.id).eq("payload_version",1).order("created_at").order("id").range(start, start + 499);
        if (error) throw new Error("storage_unavailable");
        for (const row of data || []) {
          if (row.encryption_key_id !== "v1") throw new Error("unsupported_key");
          result.push({ ...openCustomerData(row.encrypted_payload, user.id, kind, row.id), id: row.id, customerId: row.customer_id, createdAt: row.created_at, updatedAt: row.updated_at || row.created_at, revision: String(row.revision), ...(row.sort_order !== null && row.sort_order !== undefined ? { sortOrder: String(row.sort_order) } : {}) });
        }
        if (!data || data.length < 500) return result;
      }
    }
    if(request.nextUrl.searchParams.get("view")==="reminders"){
      const customers=await read("customer_records","customer");
      const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
      const reminders=customers.flatMap(customer=>customerBirthdaySchedules(customer.checklist,customer.birth,today).filter(row=>row.date===today&&!row.done).map(row=>({id:`${customer.id}:${row.id}`,customerId:customer.id,scheduleId:row.id,name:customer.name,label:row.label,date:row.date})));
      reminders.sort((a,b)=>a.date.localeCompare(b.date));
      return json({reminders});
    }
    const [customers, contracts] = await Promise.all([read("customer_records", "customer"), read("customer_contracts", "contract")]);
    if(request.nextUrl.searchParams.get("view")==="calendar"){
      const from=request.nextUrl.searchParams.get("from")||"",to=request.nextUrl.searchParams.get("to")||"";
      if(![from,to].every(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date)||to<from||Date.parse(to)-Date.parse(from)>62*86400000)return json({error:"날짜 범위를 확인해 주세요"},400);
      return json({events:buildCustomerCalendar(customers as StoredCustomer[],contracts as StoredContract[],from,to,value=>createHmac("sha256",process.env.CUSTOMER_DATA_ENCRYPTION_KEY!).update(`${user.id}:${value}`).digest("hex"))});
    }
    return json({ customers, contracts });
  } catch { return json({ error: "고객정보를 불러오지 못했습니다 잠시 후 다시 시도해 주세요" }, 503); }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ error: "잘못된 요청입니다" }, 403);
  try {
    const auth = await authenticate(request); if (auth.error) return auth.error;
    const { db, user } = auth;
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 1048576) return json({ error: "입력 내용이 너무 깁니다" }, 413);
    let body; try { body = JSON.parse(raw); } catch { return json({ error: "잘못된 요청입니다" }, 400); }
    if(body.action==="complete-schedule"){
      if(typeof body.customerId!=="string"||!/^[a-f0-9-]{36}$/i.test(body.customerId)||typeof body.scheduleId!=="string"||body.scheduleId.length>100||typeof body.date!=="string")return json({error:"알림을 확인해 주세요"},400);
      const {data:record,error}=await db.from("customer_records").select("*").eq("user_id",user.id).eq("id",body.customerId).maybeSingle();
      if(error||!record)return json({error:"등록된 고객을 찾지 못했습니다"},404);
      const values=openCustomerData(record.encrypted_payload,user.id,"customer",record.id);
      const schedules=customerBirthdaySchedules(values.checklist,values.birth);
      const item=schedules.find(row=>row.id===body.scheduleId&&row.date===body.date);
      if(!item)return json({error:"일정이 변경되었습니다 다시 확인해 주세요"},409);
      values.checklist=serializeCustomerChecklist(values.checklist?parseCustomerChecklist(values.checklist):emptyCustomerChecklist(),schedules.map(row=>row.id===item.id?{...row,done:true}:row));
      const {data:updated,error:saveError}=await db.from("customer_records").update({encrypted_payload:sealCustomerData(values,user.id,"customer",record.id),revision:Number(record.revision)+1,updated_at:new Date().toISOString()}).eq("user_id",user.id).eq("id",record.id).eq("revision",record.revision).select("id").maybeSingle();
      if(saveError||!updated)return json({error:"저장하지 못했습니다 다시 시도해 주세요"},409);
      return json({saved:true});
    }
    if(body.action==="select"){
      if(typeof body.customerId!=="string"||!/^[a-f0-9-]{36}$/i.test(body.customerId))return json({error:"고객을 확인해 주세요"},400);
      const {data:customer,error:customerError}=await db.from("customer_records").select("id").eq("user_id",user.id).eq("id",body.customerId).maybeSingle();
      if(customerError||!customer)return json({error:"등록된 고객을 찾지 못했습니다"},404);
      const {error}=await db.from("customer_view_preferences").upsert({user_id:user.id,customer_id:body.customerId,updated_at:new Date().toISOString()},{onConflict:"user_id"});
      if(error)throw new Error("selection_unavailable");
      return json({saved:true});
    }
    if (body.action === "delete") {
      if(body.kind!==undefined&&body.kind!=="customer"&&body.kind!=="contract")return json({error:"잘못된 요청입니다"},400);
      if (typeof body.recordId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.recordId) || !Number.isSafeInteger(body.revision)) return json({ error: "잘못된 요청입니다" }, 400);
      const { data, error } = await db.from(body.kind==="contract"?"customer_contracts":"customer_records").delete().eq("user_id", user.id).eq("id", body.recordId).eq("revision", body.revision).select("id").maybeSingle();
      if (error || !data) return json({ error: "삭제하지 못했습니다 목록을 다시 불러온 뒤 시도해 주세요" }, 409);
      return json({ deleted: true });
    }
    if (body.action === "reorder") {
      if (!Array.isArray(body.ids) || body.ids.length > 20000 || body.ids.some((id: unknown) => typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) || new Set(body.ids).size !== body.ids.length) return json({ error: "잘못된 순서입니다" }, 400);
      const { error } = await db.rpc("reorder_customer_records", { p_user_id: user.id, p_ids: body.ids });
      if (error) return json({ error: "목록 순서를 저장하지 못했습니다 다시 시도해 주세요" }, 409);
      return json({ saved: true });
    }
    if (body.action !== undefined && body.action !== "update") return json({ error: "잘못된 요청입니다" }, 400);
    if (body.kind !== "customer" && body.kind !== "contract") return json({ error: "잘못된 요청입니다" }, 400);
    if (typeof body.recordId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.recordId)) return json({ error: "잘못된 요청입니다" }, 400);
    let values;
    try {
      values = validateCustomerValues(body.values, body.kind);
      for (const field of ["birth", "accountBirth", "ownerBirth", "insuredBirth"]) if (values[field] && !customerBirthDate(values[field])) throw new Error("생년월일을 확인해 주세요");
    } catch (error) { return json({ error: error instanceof Error ? error.message : "입력 내용을 확인해 주세요" }, 400); }
    const table = body.kind === "customer" ? "customer_records" : "customer_contracts";
    const { data: existing, error: existingError } = await db.from(table).select("*").eq("user_id", user.id).eq("id", body.recordId).maybeSingle();
    if (existingError) throw new Error("storage_unavailable");
    if (existing && body.action !== "update") return json({ record: { ...openCustomerData(existing.encrypted_payload, user.id, body.kind, existing.id), id: existing.id, ...(existing.customer_id ? { customerId: existing.customer_id } : {}), createdAt: existing.created_at, updatedAt: existing.updated_at || existing.created_at, revision: String(existing.revision), ...(existing.sort_order !== null && existing.sort_order !== undefined ? { sortOrder: String(existing.sort_order) } : {}) } });
    if (body.action === "update" && (!existing || !Number.isSafeInteger(body.revision) || body.revision !== Number(existing.revision))) return json({ error: "고객정보가 변경되었습니다 목록을 다시 불러온 뒤 수정해 주세요" }, 409);
    const now = new Date().toISOString();
    values = body.kind === "customer" ? withCustomerClaimDefaults(values) : withContractDefaults(values, new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }));
    values.consentConfirmedAt = now;
    values.consentVersion = "confirmation-v1";
    if (body.kind === "customer" && values.medicalMaturity === undefined) values.medicalMaturity = medicalMaturity(values.medicalJoined || "")?.text || "";
    let customerId: string | undefined;
    if (body.kind === "contract") {
      if (typeof body.customerId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.customerId)) return json({ error: "계약자와 생년월일이 일치하는 등록 고객을 선택해 주세요" }, 400);
      const { data: customer, error } = await db.from("customer_records").select("id,encrypted_payload").eq("user_id", user.id).eq("id", body.customerId).maybeSingle();
      if (error || !customer) return json({ error: "등록된 계약자를 찾지 못했습니다" }, 400);
      const record = openCustomerData(customer.encrypted_payload, user.id, "customer", customer.id);
      if (record.name !== values.owner || shortCustomerBirth(record.birth) !== values.ownerBirth) return json({ error: "계약자 이름과 생년월일을 확인해 주세요" }, 400);
      customerId = customer.id;
    }
    const id = body.recordId;
    if (body.action === "update") {
      const previous = openCustomerData(existing.encrypted_payload, user.id, body.kind, id);
      values.consentConfirmedAt = previous.consentConfirmedAt || now;
      values.consentVersion = previous.consentVersion || "confirmation-v1";
      const revision = Number(existing.revision) + 1;
      const { data: updated, error } = await db.from(table).update({ encrypted_payload: sealCustomerData(values, user.id, body.kind, id), encryption_key_id: "v1", revision, updated_at: now }).eq("user_id", user.id).eq("id", id).eq("revision", body.revision).select("id").maybeSingle();
      if (error || !updated) return json({ error: "수정하지 못했습니다 목록을 다시 불러온 뒤 시도해 주세요" }, 409);
      return json({ record: { ...values, id, ...(customerId ? { customerId } : {}), createdAt: existing.created_at, updatedAt: now, revision: String(revision), ...(existing.sort_order !== null && existing.sort_order !== undefined ? { sortOrder: String(existing.sort_order) } : {}) } });
    }
    const { error } = await db.from(table).insert({ id, user_id: user.id, ...(customerId ? { customer_id: customerId } : {}), encrypted_payload: sealCustomerData(values, user.id, body.kind, id), encryption_key_id: "v1", revision: 1, created_at: now, updated_at: now });
    if (error) throw new Error("storage_unavailable");
    return json({ record: { ...values, id, ...(customerId ? { customerId } : {}), createdAt: now, updatedAt: now, revision: "1" } }, 201);
  } catch { return json({ error: "저장하지 못했습니다 잠시 후 다시 시도해 주세요" }, 503); }
}
