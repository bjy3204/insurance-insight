import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";

export const PAYAPP_ORIGIN = "https://www.bohuminsight.com";
export const CLAIM_COOKIE = "payapp_claim";
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export function payappEnabled() {
  return process.env.PAYAPP_ENABLED === "true" && !!process.env.PAYAPP_USER_ID && !!process.env.PAYAPP_LINK_KEY && !!process.env.PAYAPP_LINK_VALUE;
}
export function paymentDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function equalsSecret(received: string, expected: string | undefined) {
  return !!expected && timingSafeEqual(Buffer.from(digest(received)), Buffer.from(digest(expected)));
}
export async function requestPayapp(params: Record<string, string>) {
  const response = await fetch("https://api.payapp.kr/oapi/apiLoad.html", {
    method: "POST", body: new URLSearchParams(params), cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("payment_provider_unavailable");
  const result = new URLSearchParams(await response.text());
  if (result.get("state") !== "1") throw new Error("payment_provider_rejected");
  return result;
}
