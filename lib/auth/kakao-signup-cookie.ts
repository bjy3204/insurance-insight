import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type KakaoSignupTicket = {
  expires: number;
  state?: string;
  idToken?: string;
  accessToken?: string;
};

function key() {
  const secret = process.env.KAKAO_SIGNUP_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("카카오 임시 인증 설정이 필요합니다");
  return createHash("sha256").update(secret).digest();
}

export function sealKakaoTicket(ticket: KakaoSignupTicket) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(ticket), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function readKakaoTicket(value?: string): KakaoSignupTicket | null {
  if (!value || value.length > 12000) return null;
  try {
    const data = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const ticket = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8"));
    return typeof ticket.expires === "number" && ticket.expires > Date.now() ? ticket : null;
  } catch { return null; }
}
