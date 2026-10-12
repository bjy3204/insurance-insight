import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readKakaoTicket, sealKakaoTicket } from "@/lib/auth/kakao-signup-cookie";

export const runtime = "nodejs";
const stateCookie = "kakao-signup-state";
const ticketCookie = "kakao-signup-ticket";
const duration = 15 * 60;
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/auth/kakao/signup", maxAge: duration };
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const callbackUrl = (request: NextRequest) => `${request.nextUrl.origin}/api/auth/kakao/signup`;
function clear(response: NextResponse) {
  for (const name of [stateCookie, ticketCookie]) response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const failure = request.nextUrl.searchParams.get("error");
  if (!code && !failure) {
    const ticket = readKakaoTicket(request.cookies.get(ticketCookie)?.value);
    return json({ ready: !!ticket?.idToken });
  }
  const state = readKakaoTicket(request.cookies.get(stateCookie)?.value);
  const finish = (result: string) => clear(NextResponse.redirect(new URL(`/?kakao_signup=${result}`, request.url)));
  if (failure || !state?.state || state.state !== request.nextUrl.searchParams.get("state")) return finish("error");
  try {
    const body = new URLSearchParams({ grant_type: "authorization_code", client_id: process.env.KAKAO_REST_API_KEY!, redirect_uri: callbackUrl(request), code: code! });
    if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.id_token || !tokens.access_token) return finish("error");
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!userResponse.ok) return finish("error");
    // No Supabase auth call here: this is only a pending provider authentication.
    const response = finish("ready");
    response.cookies.set(ticketCookie, sealKakaoTicket({ idToken: tokens.id_token, accessToken: tokens.access_token, expires: Date.now() + duration * 1000 }), cookieOptions);
    return response;
  } catch { return finish("error"); }
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ error: "잘못된 요청입니다." }, 403);
  return clear(json({ ready: false }));
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return json({ error: "잘못된 요청입니다." }, 403);
  try {
    const body = await request.json();
    if (body.action === "start") {
      if (!process.env.KAKAO_REST_API_KEY) return json({ error: "가입 전 카카오 인증을 위한 서버 설정이 필요합니다. 지금은 이메일로 가입한 뒤 개인설정에서 연결해 주세요." }, 503);
      const state = randomBytes(32).toString("hex");
      const url = new URL("https://kauth.kakao.com/oauth/authorize");
      url.search = new URLSearchParams({ client_id: process.env.KAKAO_REST_API_KEY, redirect_uri: callbackUrl(request), response_type: "code", state, scope: "openid" }).toString();
      const response = clear(json({ url: url.toString() }));
      response.cookies.set(stateCookie, sealKakaoTicket({ state, expires: Date.now() + duration * 1000 }), cookieOptions);
      return response;
    }
    if (body.action !== "commit") return json({ error: "잘못된 요청입니다." }, 400);
    const ticket = readKakaoTicket(request.cookies.get(ticketCookie)?.value);
    if (!ticket?.idToken || !ticket.accessToken) return clear(json({ error: "카카오 인증이 만료되었습니다. 개인설정에서 다시 연결해 주세요." }, 400));
    if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string") return json({ error: "로그인이 필요합니다." }, 401);
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: sessionError } = await client.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
    if (sessionError) return json({ error: "로그인이 필요합니다." }, 401);
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "로그인이 필요합니다." }, 401);
    const { data: profile, error: profileError } = await client.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (profileError || !profile) return json({ error: "회원가입을 먼저 완료해 주세요." }, 403);
    if (user.identities?.some(identity => identity.provider === "kakao")) return clear(json({ error: "이미 카카오 계정이 연결되어 있습니다." }, 409));
    // This is the first operation that actually links Kakao to the site account.
    const { data, error } = await client.auth.linkIdentity({ provider: "kakao", token: ticket.idToken, access_token: ticket.accessToken });
    if (error) return clear(json({ error: "카카오 연결에 실패했습니다. 이미 다른 계정에 연결됐는지 확인하고 개인설정에서 다시 진행해 주세요." }, 409));
    const { error: saveError } = await client.from("profiles").update({ kakao_connected: true }).eq("id", user.id);
    return clear(json({ connected: true, session: data.session, warning: saveError ? "카카오는 연결됐지만 표시 상태를 저장하지 못했습니다." : undefined }));
  } catch { return json({ error: "카카오 인증 처리에 실패했습니다. 다시 시도해 주세요." }, 500); }
}
