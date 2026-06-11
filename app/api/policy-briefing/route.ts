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
    .replace(/\s*\d{4}\.\d{2}\.\d{2}\s*.*$/, "")
    .trim();
}

function pickDate(title: string) {
  const match = title.match(/\d{4}\.\d{2}\.\d{2}/);
  return match?.[0] ?? "";
}

export async function GET() {
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
    const img = $(el).find("img").first();

    if (!href.includes("visualNewsView.do")) return;
    if (!img.length) return;

    const title =
      img.attr("alt")?.trim() ||
      $(el).text().replace(/\s+/g, " ").trim();

    const image =
      img.attr("src") ||
      img.attr("data-src") ||
      "";

    if (!title || !image) return;

const text = $(el).text().replace(/\s+/g, " ").trim();

const departmentMatch = text.match(
  /(외교부|소방청|보건복지부|질병관리청|금융위원회|금융감독원|고용노동부|행정안전부|국토교통부|기획재정부|국세청|식품의약품안전처|환경부|교육부|문화체육관광부|방송미디어통신위원회)/
);

function cleanTitle(title: string) {
  return title
    .replace(/\s*\d{4}\.\d{2}\.\d{2}\s*.*$/, "")
    .trim();
}


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

  return NextResponse.json({
    items: uniqueItems.slice(0, 12),
  });
}