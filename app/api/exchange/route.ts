import { NextResponse } from "next/server";

// 메인 페이지 ExchangeIndexBar에 표시할 통화
const DISPLAY_LABELS = ["USD", "JPY", "EUR", "CNY"];

// 환율 변환기에서 지원할 전체 통화
const ALL_CURRENCIES = [
  "KRW", "PHP", "USD", "JPY", "VND", "EUR", "THB", "CNY",
  "RUB", "TWD", "HKD", "GBP", "AUD", "CAD", "CHF", "SGD",
  "MYR", "IDR", "INR", "NZD",
];

// open.er-api.com: 무료, API 키 불필요, 전 세계 모든 통화 지원
// KRW 기준으로 직접 조회 가능
const API_URL = "https://open.er-api.com/v6/latest/KRW";

// KRW 기준 환율 계산
// data.rates는 KRW 기준: { USD: 0.00066, JPY: 0.105, ... }
// 1 CODE = 1/rates[CODE] KRW
const toKrwRate = (rates: Record<string, number>, code: string): number => {
  if (code === "KRW") return 1;
  const r = rates[code];
  if (!r) return 0;
  let rate = 1 / r;
  // JPY는 100엔 기준으로 표시
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
    const change = value - prevValue;

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
    const res = await fetch(API_URL, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("exchange api error");

    const data = await res.json();
    const rates: Record<string, number> = data.rates;

    // 전날 데이터 (변동 계산용)
    let prevRates: Record<string, number> | null = null;
    try {
      const prevRes = await fetch(
        "https://open.er-api.com/v6/latest/KRW",
        { next: { revalidate: 86400 } }
      );
      // open.er-api 무료 플랜은 과거 날짜 조회 불가 → 변동값 0으로 처리
      if (prevRes.ok) {
        // 동일 API라 변동값은 0이 됨 (과거 데이터 없음)
        prevRates = null;
      }
    } catch {
      prevRates = null;
    }

    return NextResponse.json({
      date: data.time_last_update_utc ?? "",
      // 메인 페이지 ExchangeIndexBar용
      items: makeItems(rates, prevRates, DISPLAY_LABELS),
      // 환율 변환기용 전체 통화
      allItems: makeItems(rates, prevRates),
    });
  } catch {
    return NextResponse.json(
      { error: "환율 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}