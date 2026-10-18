import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readSheetState, sealSheetState } from "@/lib/auth/google-sheet-state";
import { hasCompletedMembership } from "@/lib/auth/membership";
import { saveSheetConnection, spreadsheetIdFromUrl } from "@/lib/google/sheet-connection";

export const runtime = "nodejs";
const cookieName = "customer-sheet-state";
const pickerCookie = "customer-sheet-picker";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/google/customer-sheet", maxAge: 600 };
const template = "1CAWo0xJcwlzIA9hL2Zbd_nqdJPQ6KK_kaAN8JzUrVuw";
const scope = "https://www.googleapis.com/auth/drive.file";
const json = (value: object, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
const callbackUrl = (request: NextRequest) => `${request.nextUrl.origin}/api/google/customer-sheet`;
const configured = () => !!(process.env.GOOGLE_SHEETS_CLIENT_ID && process.env.GOOGLE_SHEETS_CLIENT_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ error: "잘못된 요청입니다" }, 403);
  if (!configured()) return json({ error: "구글 시트 자동 생성 설정이 아직 완료되지 않았습니다 관리자에게 문의해 주세요" }, 503);
  try {
    const db = admin();
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return json({ error: "보험인사이트 로그인이 필요합니다" }, 401);
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return json({ error: "로그인이 만료되었습니다 다시 로그인해 주세요" }, 401);
    const { data: profile, error: profileError } = await db.from("profiles").select("nickname,instagram_id,role").eq("id", user.id).maybeSingle();
    if (profileError || !hasCompletedMembership(profile)) return json({ error: "회원가입을 먼저 완료해 주세요" }, 403);
    const { data: settings, error: settingsError } = await db.from("customer_settings").select("customer_url").eq("user_id", user.id).maybeSingle();
    if (settingsError) return json({ error: "기존 시트 정보를 확인하지 못했습니다" }, 500);
    const body = await request.json().catch(() => ({}));
    let returnPath: "/my-page"|"/notion-crm"|"/personal-space"="/my-page";try{const path=new URL(request.headers.get("referer")||"").pathname;if(path==="/notion-crm"||path==="/personal-space")returnPath=path;}catch{}
    const pending = readSheetState(request.cookies.get(pickerCookie)?.value);
    const calendarAction = body.action === "calendar-connect" || (body.action === "picker-complete" || body.action === "picker-cancel") && pending?.purpose === "calendar";
    if (settings?.customer_url && !calendarAction) return json({ existing: true });
    if (body.action === "calendar-connect" && !spreadsheetIdFromUrl(settings?.customer_url)) return json({ error: "먼저 스프레드시트를 연결해 주세요" }, 400);
    if (body.action === "picker-complete" || body.action === "picker-cancel") {
      const ticket = readSheetState(request.cookies.get(pickerCookie)?.value);
      if (!ticket?.accessToken || !ticket.creationId || ticket.userId !== user.id || ticket.state !== "picker") return json({ error: "구글 인증 시간이 만료되었습니다 다시 시도해 주세요" }, 401);
      const clear = (response: NextResponse) => { response.cookies.set(pickerCookie, "", { ...cookieOptions, maxAge: 0 }); return response; };
      if (body.action === "picker-cancel") return clear(json({ cancelled: true }));
      const expected = ticket.purpose === "calendar" ? ticket.pickerFileId : template;
      if (!expected || body.fileId !== expected) return json({ error: "표시된 시트를 선택해 주세요" }, 400);
      if (ticket.purpose === "calendar") {
        if (expected !== spreadsheetIdFromUrl(settings?.customer_url)) return clear(json({ error: "연결할 시트가 변경되었습니다 다시 시도해 주세요" }, 409));
        const check = await fetch(`https://www.googleapis.com/drive/v3/files/${expected}?fields=id`, { headers: { Authorization: `Bearer ${ticket.accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!check.ok) return json({ error: "시트에 접근하지 못했습니다 다시 선택해 주세요" }, 400);
        const saved = await saveSheetConnection(user.id, expected, { accessToken: ticket.accessToken, refreshToken: ticket.refreshToken, accessExpires: ticket.accessExpires });
        if (!saved) return json({ error: "일정 연결을 저장하지 못했습니다 관리자 설정 확인 후 다시 연결해 주세요" }, 503);
        return clear(json({ ready: true, tab: "calendar" }));
      }
      const result = await findOrCopy(ticket.accessToken, user.id, ticket.creationId);
      if (result.status) return json({ error: result.status === "template_not_found" || result.status === "template_app_access" || result.status === "template" ? "선택한 원본에 아직 접근할 수 없습니다 원본의 공유·복사 허용 설정을 확인해 주세요" : "시트 생성에 실패했습니다 잠시 후 다시 시도해 주세요" }, 400);
      const url = `https://docs.google.com/spreadsheets/d/${result.id}/edit`;
      const { error: saveError } = await db.from("customer_settings").upsert({ user_id: user.id, customer_url: url }, { onConflict: "user_id" });
      if (saveError) return json({ error: "시트는 생성됐지만 저장하지 못했습니다 다시 시도하면 기존 사본을 연결합니다" }, 500);
      await saveSheetConnection(user.id, result.id!, { accessToken: ticket.accessToken, refreshToken: ticket.refreshToken, accessExpires: ticket.accessExpires }).catch(() => false);
      return clear(json({ ready: true }));
    }
    if (body.action && body.action !== "start" && body.action !== "calendar-connect") return json({ error: "잘못된 요청입니다" }, 400);
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: process.env.GOOGLE_SHEETS_CLIENT_ID!, redirect_uri: callbackUrl(request), response_type: "code", scope, state, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256", access_type: "offline", prompt: "consent select_account" }).toString();
    const response = json({ url: url.toString() });
    response.cookies.set(pickerCookie, "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set(cookieName, sealSheetState({ returnPath, userId: user.id, state, verifier, ...(body.action === "calendar-connect" ? { purpose: "calendar" as const } : {}), expires: Date.now() + 600000 }), cookieOptions);
    return response;
  } catch { return json({ error: "구글 연결을 시작하지 못했습니다 잠시 후 다시 시도해 주세요" }, 500); }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("action") === "picker") {
    if (!configured()) return json({ error: "구글 설정이 필요합니다" }, 503);
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return json({ error: "보험인사이트 로그인이 필요합니다" }, 401);
    const { data: { user }, error } = await admin().auth.getUser(token);
    const ticket = readSheetState(request.cookies.get(pickerCookie)?.value);
    if (error || !user || ticket?.userId !== user.id || ticket.state !== "picker" || !ticket.accessToken) return json({ error: "구글 인증 시간이 만료되었습니다 다시 시도해 주세요" }, 401);
    const key = process.env.GOOGLE_PICKER_API_KEY;
    const appId = process.env.GOOGLE_CLOUD_PROJECT_NUMBER || process.env.GOOGLE_SHEETS_CLIENT_ID?.split("-")[0];
    if (!key || !appId) return json({ error: "원본 선택창을 위한 Google Picker API 키 설정이 필요합니다 관리자에게 문의해 주세요" }, 503);
    return json({ accessToken: ticket.accessToken, developerKey: key, appId, templateId: ticket.pickerFileId || template, title: ticket.purpose === "calendar" ? "연결할 시트를 선택해 주세요" : "고객관리 원본 시트를 선택해 주세요" });
  }
  const state = readSheetState(request.cookies.get(cookieName)?.value);
  const finish = (status: string) => {
    const returnPath="/my-page";
    const tab = state?.purpose === "calendar" ? "calendar" : "customer";
    const response = NextResponse.redirect(new URL(status === "ready" ? `${returnPath}?tab=${tab}` : `${returnPath}?tab=${tab}&google_sheet=${status}`, request.url));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    return response;
  };
  if (!state || state.state !== request.nextUrl.searchParams.get("state")) return finish("expired");
  if (request.nextUrl.searchParams.has("error")) return finish("cancelled");
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !configured()) return finish("error");
  try {
    const db = admin();
    const { data: profile } = await db.from("profiles").select("nickname,instagram_id,role").eq("id", state.userId).maybeSingle();
    if (!hasCompletedMembership(profile)) return finish("expired");
    const { data: settings, error: settingsError } = await db.from("customer_settings").select("customer_url").eq("user_id", state.userId).maybeSingle();
    if (settingsError) return finish("error");
    if (settings?.customer_url && state.purpose !== "calendar") return finish("ready");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_SHEETS_CLIENT_ID!, client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET!, redirect_uri: callbackUrl(request), grant_type: "authorization_code", code, code_verifier: state.verifier }), cache: "no-store", signal: AbortSignal.timeout(15000) });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) return finish("error");
    const connection = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, accessExpires: Date.now() + Number(tokens.expires_in || 3600) * 1000 };
    if (state.purpose === "calendar") {
      const fileId = spreadsheetIdFromUrl(settings?.customer_url);
      if (!fileId) return finish("error");
      const response = finish("picker");
      response.cookies.set(pickerCookie, sealSheetState({ returnPath:state.returnPath, userId: state.userId, state: "picker", verifier: "picker", creationId: state.state, purpose: "calendar", pickerFileId: fileId, ...connection, expires: Date.now() + 300000 }), { ...cookieOptions, maxAge: 300 });
      return response;
    }
    // Picker fallback uses a five-minute encrypted cookie; completed connections are encrypted server-side.
    const result = await findOrCopy(tokens.access_token, state.userId, state.state);
    if (result.status) {
      if (["template_app_access", "template_not_found", "template"].includes(result.status)) {
        const response = finish("picker");
        response.cookies.set(pickerCookie, sealSheetState({ returnPath:state.returnPath, userId: state.userId, state: "picker", verifier: "picker", creationId: state.state, ...connection, expires: Date.now() + 300000 }), { ...cookieOptions, maxAge: 300 });
        return response;
      }
      return finish(result.status);
    }
    const id = result.id!;
    const { error } = await db.from("customer_settings").upsert({ user_id: state.userId, customer_url: `https://docs.google.com/spreadsheets/d/${id}/edit` }, { onConflict: "user_id" });
    if (!error) await saveSheetConnection(state.userId, id, connection).catch(() => false);
    return finish(error ? "save_error" : "ready");
  } catch { return finish("error"); }
}

async function findOrCopy(accessToken: string, userId: string, creationId: string): Promise<{ id?: string; status?: string }> {
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
    const marker = createHash("sha256").update(userId).digest("hex");
    const attempt = createHash("sha256").update(creationId).digest("hex");
    const query = new URLSearchParams({ q: `trashed = false and appProperties has { key='insuranceInsightCustomer' and value='${marker}' } and appProperties has { key='insuranceInsightCreation' and value='${attempt}' }`, fields: "files(id)", pageSize: "1" });
    const foundResponse = await fetch(`https://www.googleapis.com/drive/v3/files?${query}`, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!foundResponse.ok) return { status: "permission" };
    const found = await foundResponse.json();
    let id = found.files?.[0]?.id;
    if (!id) {
      const copied = await fetch(`https://www.googleapis.com/drive/v3/files/${template}/copy?fields=id&ignoreDefaultVisibility=true`, { method: "POST", headers, body: JSON.stringify({ name: "[보험인사이트] 내 고객관리노트", parents: ["root"], appProperties: { insuranceInsightCustomer: marker, insuranceInsightCreation: attempt } }), cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!copied.ok) {
        // Return only known error categories, never Google's raw response or tokens.
        const failure = await copied.json().catch(() => null);
        const reasons = failure?.error?.errors?.map((entry: { reason?: string }) => entry.reason) || [];
        if (reasons.includes("appNotAuthorizedToFile")) return { status: "template_app_access" };
        if (reasons.includes("storageQuotaExceeded")) return { status: "storage_full" };
        if (reasons.includes("accessNotConfigured") || reasons.includes("serviceDisabled")) return { status: "drive_disabled" };
        if (copied.status === 404 || reasons.includes("notFound")) return { status: "template_not_found" };
        return { status: copied.status === 403 ? "template" : "copy_error" };
      }
      id = (await copied.json()).id;
    }
    if (typeof id !== "string" || !/^[\w-]+$/.test(id)) return { status: "copy_error" };
    return { id };
}
