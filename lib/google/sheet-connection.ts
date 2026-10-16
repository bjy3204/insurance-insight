import { createClient } from "@supabase/supabase-js";
import { readSheetState, sealSheetState } from "@/lib/auth/google-sheet-state";

export class SheetConnectionError extends Error {
  constructor(public readonly code: "setup" | "connect" | "access" | "api") { super(code); }
}
export function sheetAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function spreadsheetIdFromUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)(?:\/|$)/.exec(value)?.[1] || null;
}
export async function saveSheetConnection(userId: string, spreadsheetId: string, token: { accessToken: string; refreshToken?: string; accessExpires?: number }) {
  // Never combine a new account's access token with a previous account's refresh token.
  if (!token.refreshToken) return false;
  const credentials = sealSheetState({ userId, state: "connection", verifier: "connection", expires: Date.now() + 10 * 365 * 86400000, ...token });
  const { error } = await sheetAdmin().from("google_sheet_connections").upsert({ user_id: userId, spreadsheet_id: spreadsheetId, credentials, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return !error;
}
export async function sheetAccessToken(userId: string, spreadsheetId: string) {
  const { data, error } = await sheetAdmin().from("google_sheet_connections").select("spreadsheet_id,credentials").eq("user_id", userId).maybeSingle();
  if (error) throw new SheetConnectionError("setup");
  if (!data || data.spreadsheet_id !== spreadsheetId) throw new SheetConnectionError("connect");
  const token = readSheetState(data.credentials);
  if (!token || token.userId !== userId || token.state !== "connection" || !token.refreshToken) throw new SheetConnectionError("connect");
  if (token.accessToken && (token.accessExpires || 0) > Date.now() + 60000) return token.accessToken;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_SHEETS_CLIENT_ID!, client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET!, grant_type: "refresh_token", refresh_token: token.refreshToken }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new SheetConnectionError("connect");
  const saved = await saveSheetConnection(userId, spreadsheetId, { accessToken: result.access_token, refreshToken: result.refresh_token || token.refreshToken, accessExpires: Date.now() + Number(result.expires_in || 3600) * 1000 });
  if (!saved) throw new SheetConnectionError("setup");
  return result.access_token as string;
}
