import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return NextResponse.json({ error: "연도를 확인해 주세요." }, { status: 400 });
  const key = process.env.DATA_GO_KR_API_KEY;
  if (key) {
    try {
      const params = new URLSearchParams({ serviceKey: decodeURIComponent(key), solYear: String(year), numOfRows: "100", _type: "json" });
      const response = await fetch(`https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?${params}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Holiday service unavailable");
      const data = await response.json();
      if (data.response?.header?.resultCode !== "00") throw new Error("Holiday service unavailable");
      const items = data.response.body?.items?.item || [];
      return NextResponse.json({ holidays: (Array.isArray(items) ? items : [items]).filter((item: { isHoliday: string }) => item.isHoliday === "Y").map((item: { locdate: number; dateName: string }) => { const date = String(item.locdate); return { date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`, name: item.dateName }; }) });
    } catch { /* Keep the existing public holiday source as a fallback. */ }
  }
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Holiday service unavailable");
    const data = await response.json();
    return NextResponse.json({ holidays: data.map((item: { date: string; localName: string }) => ({ date: item.date, name: item.localName })) });
  } catch { return NextResponse.json({ error: "공휴일 정보를 불러오지 못했습니다.", holidays: [] }, { status: 502 }); }
}
