import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function absoluteUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.korea.kr${url}`;
  return `https://www.korea.kr/${url}`;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const res = await fetch("https://www.korea.kr/multi/visualNewsList.do", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: any[] = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href") ?? "";

      if (!href.includes("newsId=")) return;

      const box = $(el).closest("li");
      const img = box.find("img").first();

      const title =
        cleanText(img.attr("alt") ?? "") ||
        cleanText($(el).text()) ||
        cleanText(box.text());

      const image =
        img.attr("src") ||
        img.attr("data-src") ||
        "";

      if (!title) return;

      items.push({
        id: href,
        title,
        subtitle: "",
        date: "",
        department: "대한민국 정책브리핑",
        image: absoluteUrl(image),
        link: absoluteUrl(href),
      });
    });

    const uniqueItems = items.filter(
      (item, index, self) =>
        index === self.findIndex((target) => target.link === item.link)
    );

    return NextResponse.json({
      items: uniqueItems.slice(0, 12),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ items: [] });
  }
}