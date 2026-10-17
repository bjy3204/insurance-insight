import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { sheetAccessToken, sheetAdmin, SheetConnectionError, spreadsheetIdFromUrl } from "@/lib/google/sheet-connection";
import { buildSheetCalendar, type SheetCalendarRows } from "@/lib/google/sheet-calendar-model";

export const runtime = "nodejs";
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
type Sheet = { properties: { title: string; hidden?: boolean; gridProperties?: { rowCount: number } } };
const normalized = (value: string) => value.replace(/\s/g, "").toLowerCase();
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return json({ error: "로그인이 필요합니다" }, 401);
    const db = sheetAdmin();
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return json({ error: "로그인이 필요합니다" }, 401);
    const { data: profile } = await db.from("profiles").select("status,role").eq("id", user.id).maybeSingle();
    if (profile?.status !== "approved" && profile?.role !== "admin") return json({ error: "승인된 회원만 이용할 수 있습니다" }, 403);
    const from = request.nextUrl.searchParams.get("from") || "", to = request.nextUrl.searchParams.get("to") || "";
    if (![from, to].every(value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value) || to < from || Date.parse(to) - Date.parse(from) > 62 * 86400000) return json({ error: "날짜 범위를 확인해 주세요" }, 400);
    const { data: settings, error: settingsError } = await db.from("customer_settings").select("customer_url").eq("user_id", user.id).maybeSingle();
    if (settingsError) throw new SheetConnectionError("setup");
    const spreadsheetId = spreadsheetIdFromUrl(settings?.customer_url);
    if (!spreadsheetId) return json({ events: [], hasSheet: false });
    const accessToken = await sheetAccessToken(user.id, spreadsheetId);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const metadataResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title,hidden,gridProperties(rowCount)))`, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!metadataResponse.ok) {
      const response = await metadataResponse.json().catch(() => null);
      const reason = response?.error?.errors?.[0]?.reason;
      if (reason === "accessNotConfigured" || response?.error?.details?.some((item: { reason?: string }) => item.reason === "SERVICE_DISABLED")) throw new SheetConnectionError("api");
      throw new SheetConnectionError(metadataResponse.status === 401 || metadataResponse.status === 403 || metadataResponse.status === 404 ? "connect" : "access");
    }
    const metadata = await metadataResponse.json();
    const sheets: Sheet[] = metadata.sheets || [];
    const find = (names: string[]) => sheets.find(sheet => !sheet.properties.hidden && names.some(name => normalized(name) === normalized(sheet.properties.title)));
    const customers = find(["고객 관리 LIST", "고객 LIST", "고객관리LIST"]);
    const contracts = find(["계약 관리 LIST", "계약 목록", "계약관리"]);
    if (!customers) return json({ events: [], hasSheet: true, error: "고객 목록을 찾지 못했습니다 연결한 시트를 확인해 주세요" });
    if ([customers, contracts].some(sheet => (sheet?.properties.gridProperties?.rowCount || 0) > 10000)) return json({ events: [], hasSheet: true, error: "시트의 행이 많아 자동 일정을 불러오지 못했습니다 관리자에게 문의해 주세요" });
    const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
    const customerName = quote(customers.properties.title), customerLast = Math.max(6, customers.properties.gridProperties?.rowCount || 1000);
    const contractName = contracts ? quote(contracts.properties.title) : "", contractLast = Math.max(5, contracts?.properties.gridProperties?.rowCount || 1000);
    // Only read fields needed for calendar events; never read card/account/payment data.
    const ranges = [`${customerName}!B6:D${customerLast}`, `${customerName}!V6:Y${customerLast}`];
    if (contracts) ranges.push(`${contractName}!B5:E${contractLast}`, `${contractName}!J5:J${contractLast}`, `${contractName}!L5:M${contractLast}`);
    const query = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" });
    ranges.forEach(range => query.append("ranges", range));
    const rowsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${query}`, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!rowsResponse.ok) throw new SheetConnectionError("access");
    const rows = (await rowsResponse.json()).valueRanges || [];
    const model: SheetCalendarRows = { customers: rows[0]?.values || [], vehicles: rows[1]?.values || [], contracts: rows[2]?.values || [], products: rows[3]?.values || [], terms: rows[4]?.values || [] };
    const secret = process.env.GOOGLE_SHEETS_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const events = buildSheetCalendar(model, from, to, value => createHmac("sha256", secret).update(`${user.id}:${spreadsheetId}:${value}`).digest("hex"));
    return json({ events, hasSheet: true, ...(contracts ? {} : { error: "계약 목록을 찾지 못해 생일과 자동차갱신만 표시합니다" }) });
  } catch (error) {
    if (error instanceof SheetConnectionError) {
      const messages = { setup: "일정 연결 설정이 필요합니다 관리자에게 문의해 주세요", connect: "자동 일정을 보려면 일정 연결을 진행해 주세요", access: "자동 일정을 불러오지 못했습니다 다시 시도해 주세요", api: "일정 연동 API 설정이 필요합니다 관리자에게 문의해 주세요" };
      return json({ events: [], hasSheet: true, needsConnection: error.code === "connect", setupRequired: error.code === "setup" || error.code === "api", error: messages[error.code] }, error.code === "connect" ? 200 : 503);
    }
    return json({ events: [], error: "자동 일정을 불러오지 못했습니다 다시 시도해 주세요" }, 500);
  }
}
