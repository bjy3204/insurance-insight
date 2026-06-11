import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function absoluteUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.korea.kr${url}`;
  return `https://www.korea.kr/${url}`;
}

function cleanTitle(title: string) {
  return title
    .replace(/\s+/g, " ")
    .replace(/\s*\d{4}\.\d{2}\.\d{2}.*$/, "")
    .trim();
}

function pickDate(text: string) {
  const match = text.match(/\d{4}\.\d{2}\.\d{2}/);
  return match?.[0] ?? "";
}

export async function GET() {
  try {
    const res = await fetch("https://www.korea.kr/multi/visualNewsList.do", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: any[] = [];

    $("a[href*='visualNewsView.do']").each((_, el) => {
      const $a = $(el);
      const href = $a.attr("href") ?? "";

      const $box = $a.closest("li, .card, .list, .item, div");
      const text = $box.text().replace(/\s+/g, " ").trim();

      const img =
        $a.find("img").first().attr("src") ||
        $a.find("img").first().attr("data-src") ||
        $box.find("img").first().attr("src") ||
        $box.find("img").first().attr("data-src") ||
        "";

      const title =
        $a.attr("title")?.trim() ||
        $a.find("img").first().attr("alt")?.trim() ||
        $box.find("img").first().attr("alt")?.trim() ||
        $a.text().replace(/\s+/g, " ").trim() ||
        text;

      if (!href || !title) return;

      items.push({
        id: href,
        title: cleanTitle(title),
        subtitle: "",
        date: pickDate(text || title),
        department: "대한민국 정책브리핑",
        image: absoluteUrl(img),
        link: absoluteUrl(href),
      });
    });

    const uniqueItems = items.filter(
      (item, index, self) =>
        item.link &&
        index === self.findIndex((target) => target.link === item.link)
    );

    return NextResponse.json({
      items: uniqueItems.slice(0, 12),
    });
  } catch (error) {
    console.error("policy-briefing api error:", error);

    return NextResponse.json({
      items: [],
    });
  }
}