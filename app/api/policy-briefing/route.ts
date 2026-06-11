import { NextResponse } from "next/server";

const API_KEY = process.env.POLICY_BRIEFING_API_KEY ?? "";

function formatDate(dateStr: string) {
  // "09/27/2021 17:48:00" → "2021.09.27"
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return dateStr;
  return `${match[3]}.${match[1]}.${match[2]}`;
}

export async function GET() {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10).replace(/-/g, "");
    const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10).replace(/-/g, "");

    const url = `http://apis.data.go.kr/1371000/policyNewsService/policyNewsList?serviceKey=${API_KEY}&startDate=${start}&endDate=${end}`;

    const res = await fetch(url, { cache: "no-store" } );
    if (!res.ok) {
      return NextResponse.json({ items: [], error: `HTTP ${res.status}` });
    }

    const xml = await res.text();

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const items: any[] = [];

    for (const match of itemMatches) {
      const block = match[1];

      const get = (tag: string) =>
        block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ||
        block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() || "";

      const title = get("Title");
      const image = get("ThumbnailUrl");
      const link = get("OriginalUrl");
      const dept = get("MinisterCode");
      const date = formatDate(get("ApproveDate"));
      const id = get("NewsItemId");

      if (!title) continue;

      items.push({ id, title, subtitle: "", date, department: dept || "대한민국 정책브리핑", image, link });
    }

    // 이미지 있는 것 우선, 최대 12개
    const sorted = [
      ...items.filter((i) => i.image),
      ...items.filter((i) => !i.image),
    ];

    return NextResponse.json({ items: sorted.slice(0, 12) });

  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message });
  }
}
