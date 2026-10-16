import { NextRequest } from "next/server";
import { equalsSecret, paymentDb } from "@/lib/payapp/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length")) > 32768) return new Response("INVALID", { status: 413 });
    const form = new URLSearchParams(await request.text());
    const credentials = [["userid", "PAYAPP_USER_ID"], ["linkkey", "PAYAPP_LINK_KEY"], ["linkval", "PAYAPP_LINK_VALUE"]] as const;
    const mismatched = credentials.filter(([field, env]) => !equalsSecret(form.get(field) || "", process.env[env]));
    if (mismatched.length) {
      // Log field names only. Never log provider credentials or the request body.
      console.error("payapp_feedback_rejected", { fields: mismatched.map(([field]) => field) });
      return new Response("INVALID", { status: 403 });
    }
    const db = paymentDb();
    const { error } = await db.rpc("apply_payapp_event", {
      p_order_id: form.get("var1"), p_rebill_no: form.get("rebill_no"), p_mul_no: form.get("mul_no"),
      p_price: Number(form.get("price")), p_state: form.get("pay_state"), p_message: (form.get("ResultMsg") || "").slice(0, 500),
    });
    if (error) {
      console.error("payapp_feedback_storage_failed", { code: error.code });
      return new Response("RETRY", { status: 503 });
    }
    return new Response("SUCCESS");
  } catch {
    console.error("payapp_feedback_unavailable");
    return new Response("RETRY", { status: 503 });
  }
}
