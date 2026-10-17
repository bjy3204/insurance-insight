import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { PAYAPP_SUBSCRIPTION } from "@/lib/payapp/plans";
import { CLAIM_COOKIE, digest, paymentDb, payappEnabled, PAYAPP_ORIGIN, requestPayapp } from "@/lib/payapp/server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const json = (error: string, status: number) => NextResponse.json({ error }, { status });
  if (request.headers.get("origin") !== request.nextUrl.origin) return json("잘못된 요청입니다", 403);
  if (!payappEnabled()) return json("결제 연동을 준비 중입니다", 503);
  // Localhost cannot receive provider notifications; never open a live agreement there.
  if (request.nextUrl.origin !== PAYAPP_ORIGIN) return json("결제는 운영 사이트에서 이용해 주세요", 400);
  try {
    const body = await request.json();
    const instagram = typeof body.instagramId === "string" ? body.instagramId.trim().replace(/^@/, "").toLowerCase() : "";
    if ((instagram && !/^[a-z0-9._]{1,30}$/.test(instagram)) || !PAYAPP_SUBSCRIPTION.amounts.some(value => value === body.amount)) return json("아이디와 결제 금액을 확인해 주세요", 400);
    const db = paymentDb();
    // Keep the browser's pending payment: retries must not create another agreement.
    const prior = request.cookies.get(CLAIM_COOKIE)?.value;
    if (prior) {
      const { data, error } = await db.from("payapp_orders").select("amount,instagram_id,pay_url,state").eq("claim_hash", digest(prior)).gt("claim_expires_at", new Date().toISOString()).maybeSingle();
      if (error) throw error;
      if (data) {
        if (data.state === "paid") return NextResponse.json({ url: `${PAYAPP_ORIGIN}/subscribe/complete` });
        if (data.amount === body.amount && (data.instagram_id || "") === instagram && data.pay_url) return NextResponse.json({ url: data.pay_url });
        return json("진행 중인 결제가 있습니다 관리자에게 확인해 주세요", 409);
      }
    }
    const id = randomUUID(), claim = randomBytes(32).toString("hex");
    const { error } = await db.from("payapp_orders").insert({ id, instagram_id: instagram || null, amount: body.amount, claim_hash: digest(claim), claim_expires_at: new Date(Date.now() + 30 * 86400000).toISOString() });
    if (error) throw error;
    const result = await requestPayapp({ cmd: "rebillRegist", userid: process.env.PAYAPP_USER_ID!, goodname: PAYAPP_SUBSCRIPTION.productName,
      goodprice: String(body.amount), recvphone: "01000000000", smsuse: "n", openpaytype: "card,phone", rebillCycleType: "Month",
      rebillCycleMonth: String(PAYAPP_SUBSCRIPTION.cycleDay), rebillExpire: PAYAPP_SUBSCRIPTION.expiresOn,
      var1: id, feedbackurl: `${PAYAPP_ORIGIN}/api/payapp/feedback`, failurl: `${PAYAPP_ORIGIN}/api/payapp/feedback`, returnurl: `${PAYAPP_ORIGIN}/subscribe/complete` });
    const number = result.get("rebill_no") || "", url = new URL(result.get("payurl") || "");
    if (!/^\d+$/.test(number) || !["http:", "https:"].includes(url.protocol) || !["payapp.kr", "www.payapp.kr"].includes(url.hostname) || url.username || url.password || url.port) throw new Error("invalid_payment_response");
    url.protocol = "https:";
    const { error: saved } = await db.from("payapp_orders").update({ rebill_no: number, pay_url: url.href }).eq("id", id);
    if (saved) throw saved;
    const response = NextResponse.json({ url: url.href });
    response.cookies.set(CLAIM_COOKIE, claim, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
    return response;
  } catch { return json("결제창을 열지 못했습니다 중복 요청하지 말고 관리자에게 확인해 주세요", 503); }
}
