import { NextResponse } from "next/server";

const ECOS_API_KEY = "52JW073N9GLJ6NHH5WHQ";

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const res = await fetch(
      `https://ecos.bok.or.kr/api/StatisticSearch/${ECOS_API_KEY}/json/kr/1/70/901Y009/A/1964/${currentYear}/0`,
      { next: { revalidate: 86400 } } // 하루 1회 캐시 갱신
    );
    const json = await res.json();
    const rows: { TIME: string; DATA_VALUE: string }[] =
      json?.StatisticSearch?.row ?? [];

    if (rows.length < 2) {
      return NextResponse.json({ error: "no data" }, { status: 500 });
    }

    const result: { year: string; rate: number }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const prev = parseFloat(rows[i - 1].DATA_VALUE);
      const curr = parseFloat(rows[i].DATA_VALUE);
      if (!isNaN(prev) && !isNaN(curr) && prev > 0) {
        result.push({
          year: rows[i].TIME,
          rate: Math.round(((curr - prev) / prev) * 1000) / 10,
        });
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}