import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type SheetState = { userId: string; state: string; verifier: string; expires: number; accessToken?: string; creationId?: string; refreshToken?: string; accessExpires?: number; purpose?: "calendar"; pickerFileId?: string };
function key() {
  const secret = process.env.GOOGLE_SHEETS_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Google Sheets state secret is missing");
  return createHash("sha256").update(secret).digest();
}
export function sealSheetState(value: SheetState) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function readSheetState(value?: string): SheetState | null {
  if (!value || value.length > 4096) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const cipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    const parsed = JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString());
    return typeof parsed.userId === "string" && typeof parsed.state === "string" && typeof parsed.verifier === "string" && parsed.expires > Date.now() ? parsed : null;
  } catch { return null; }
}
