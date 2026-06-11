import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function absoluteUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http" )) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/" )) return `https://www.korea.kr${url}`;
  return `https://www.korea.kr/${url}`;
}

function cleanTitle(title: string ) {
  return title.replace(/\s*\d{4}\.\d{2}\.\d{2}\s*.*$/, "").trim();
}

function pickDate(title: string) {
  const match = title.match(/\d{4}\.\d{2}\.\d{2}/);
  return match?.[0] ?? "";
}

export async function GET() {
  try {
    const res = await fetch("https://www.korea.kr/multi/visualNewsList.do", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64 ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://www.korea.kr/",
      },
    } );

    if (!res.ok) {
      return NextResponse.json({ items: [], error: `HTTP ${res.status}` });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: any[] = [];

    $("a[href*='visualNewsView.do']").each((_, el) => {
      const href = $(el).attr("href") ?? "";

      // img 태그로 이미지 찾기
      let image = $(el).find("img").first().attr("src") || $(el).find("img").first().attr("data-src") || "";

      // img 없으면 style에서 background-image 추출
      if (!image) {
        const style = $(el).find("[style]").first().attr("style") ?? "";
        const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (bgMatch) image = bgMatch[1];
      }

      const title =
        $(el).find("img").first().attr("alt")?.trim() ||
        $(el).find(".tit, .title, h3, h4, p").first().text().trim() ||
        $(el).text().replace(/\s+/g, " ").trim();

      if (!title || !image) return;

      const text = $(el).text().replace(/\s+/g, " ").trim();
      const departmentMatch = text.match(
        /(외교부|소방청|보건복지부|질병관리청|금융위원회|금융감독원|고용노동부|행정안전부|국토교통부|기획재정부|국세청|식품의약품안전처|환경부|교육부|문화체육관광부|방송미디어통신위원회)/
      );

      items.push({
        id: href,
        title: cleanTitle(title),
        subtitle: "",
        date: pickDate(title),
        department: departmentMatch?.[1] ?? "대한민국 정책브리핑",
        image: absoluteUrl(image),
        link: absoluteUrl(href),
      });
    });

    const uniqueItems = items.filter(
      (item, index, self) =>
        index === self.findIndex((target) => target.link === item.link)
    );

    return NextResponse.json({ items: uniqueItems.slice(0, 12) });

  } catch (e: any) {
    return NextResponse.json({ items: [], error: e.message });
  }
}
