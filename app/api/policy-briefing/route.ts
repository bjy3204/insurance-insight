import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const res = await fetch("https://www.korea.kr/multi/visualNewsList.do", {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const links = $("a")
      .map((_, el) => $(el).attr("href") ?? "")
      .get()
      .filter(Boolean)
      .slice(0, 100);

    return NextResponse.json({
      htmlLength: html.length,
      linkCount: links.length,
      links,
    });
  } catch {
    return NextResponse.json({
      htmlLength: 0,
      linkCount: 0,
      links: [],
    });
  }
}