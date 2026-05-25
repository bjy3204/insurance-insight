import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DISPLAY_LABELS = ["USD", "JPY", "EUR", "CNY"];
const ALL_CURRENCIES = [
  "KRW","PHP","USD","JPY","VND","EUR","THB","CNY",
  "RUB","TWD","HKD","GBP","AUD","CAD","CHF","SGD",
  "MYR","IDR","INR","NZD",
];
const API_URL = "https://open.er-api.com/v6/latest/KRW";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

const toKrwRate = (rates: Record<string, number>, code: string): number => {
  if (code === "KRW") return 1;
  const r = rates[code];
  if (!r) return 0;
  let rate = 1 / r;
  if (code === "JPY") rate = rate * 100;
  return rate;
};

const makeItems = (
  rates: Record<string, number>,
  prevRates: Record<string, number> | null,
  labelFilter?: string[]
) => {
  const codes = labelFilter ?? ALL_CURRENCIES.filter((c) => c !== "KRW");
  return codes.map((code) => {
    const value = toKrwRate(rates, code);
    const prevValue = prevRates ? toKrwRate(prevRates, code) : value;
    const change = parseFloat((value - prevValue).toFixed(2));
    return {
      label: code,
      value,
      change,
      direction: change > 0 ? "up" : change < 0 ? "down" : "same",
    };
  });
};

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 오늘 데이터가 없으면 API 호출 후 저장
    const { data: todayRow } = await supabase
      .from("exchange_rates")
      .select("rates")
      .eq("date", today)
      .maybeSingle();

    let rates: Record<string, number>;

    if (todayRow) {
      rates = todayRow.rates;
    } else {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("exchange api error");
      const data = await res.json();
      rates = data.rates;

      // 오늘 데이터 저장
      await supabase.from("exchange_rates").upsert({ date: today, rates });

// 7일 이전 데이터 자동 삭제 (어제 데이터 보존 목적)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
await supabase
  .from("exchange_rates")
  .delete()
  .lt("date", sevenDaysAgo.toISOString().split("T")[0]);

    }

    // 어제 데이터 조회
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: prevRow } = await supabase
      .from("exchange_rates")
      .select("rates")
      .eq("date", yesterdayStr)
      .maybeSingle();

    const prevRates = prevRow?.rates ?? null;

    return NextResponse.json({
      date: today,
      items: makeItems(rates, prevRates, DISPLAY_LABELS),
      allItems: makeItems(rates, prevRates),
    });
  } catch {
    return NextResponse.json(
      { error: "환율 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
