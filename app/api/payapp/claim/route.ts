import { NextRequest, NextResponse } from "next/server";
import { CLAIM_COOKIE, digest, paymentDb } from "@/lib/payapp/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ state: "invalid" }, { status: 403 });
  const claim = request.cookies.get(CLAIM_COOKIE)?.value;
  if (!claim) return NextResponse.json({ state: "missing" });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ state: "signup" });
  try {
    const db = paymentDb();
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return NextResponse.json({ state: "signup" }, { status: 401 });
    const { data, error: failed } = await db.rpc("claim_payapp_order", { p_claim_hash: digest(claim), p_user_id: user.id });
    if (failed) throw failed;
    const response = NextResponse.json({ state: data });
    if (data === "linked") response.cookies.delete(CLAIM_COOKIE);
    return response;
  } catch { return NextResponse.json({ state: "unavailable" }, { status: 503 }); }
}
