import { NextRequest } from "next/server";
import { equalsSecret, paymentDb } from "@/lib/payapp/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length")) > 32768) return new Response("INVALID", { status: 413 });
    const form = new URLSearchParams(await request.text());
    if (![ ["userid", "PAYAPP_USER_ID"], ["linkkey", "PAYAPP_LINK_KEY"], ["linkval", "PAYAPP_LINK_VALUE"] ].every(([field, env]) => equalsSecret(form.get(field) || "", process.env[env]))) return new Response("INVALID", { status: 403 });
    const db = paymentDb();
    const { error } = await db.rpc("apply_payapp_event", {
      p_order_id: form.get("var1"), p_rebill_no: form.get("rebill_no"), p_mul_no: form.get("mul_no"),
      p_price: Number(form.get("price")), p_state: form.get("pay_state"), p_message: (form.get("ResultMsg") || "").slice(0, 500),
    });
    if (error) return new Response("RETRY", { status: 503 });
    return new Response("SUCCESS");
  } catch { return new Response("RETRY", { status: 503 }); }
}
