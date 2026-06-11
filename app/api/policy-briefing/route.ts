import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://www.korea.kr/rss/visualNews.do", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    } );

    if (!res.ok) {
      return NextResponse.json({ items: [], error: `HTTP ${res.status}` });
    }

    const xml = await res.text();

    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    const items: any[] = [];

    for (const match of itemMatches) {
      const block = match[1];

      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]?.trim() ||
                    block.match(/<title>(.*?)<\/title>/)?.[1]?.trim() || "";

      const link = block.match(/<link>(.*?)<\/link>/)?.[1]?.trim() ||
                   block.match(/<guid>(.*?)<\/guid>/)?.[1]?.trim() || "";

      const image = block.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ||
                    block.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ||
                    block.match(/<media:content[^>]+url="([^"]+)"/)?.[1] || "";

      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || "";
      const dept = block.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>/)?.[1]?.trim() ||
                   block.match(/<category>(.*?)<\/category>/)?.[1]?.trim() || "대한민국 정책브리핑";

      if (!title || !link) continue;

      items.push({
        id: link,
        title,
        subtitle: "",
        date: pubDate ? new Date(pubDate).toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "") : "",
        department: dept,
        image,
        link,
      });
    }

    return NextResponse.json({ items: items.slice(0, 12) });

  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message });
  }
}
