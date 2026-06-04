import { NextResponse } from "next/server";

type Direction = "up" | "down" | "same";

const toNumber = (value: any) => {
  if (value === null || value === undefined) return 0;

  return (
    Number(
      String(value)
        .replaceAll(",", "")
        .replaceAll("+", "")
        .replaceAll("%", "")
        .trim()
    ) || 0
  );
};

const getDirection = (change: number): Direction => {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "same";
};

const fetchText = async (url: string) => {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://m.stock.naver.com/",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`조회 실패: ${url}`);
  }

  return text;
};

const fetchIndex = async (
  label: "코스피" | "코스닥",
  symbol: "KOSPI" | "KOSDAQ"
) => {
  const text = await fetchText(
    `https://polling.finance.naver.com/api/realtime/domestic/index/${symbol}`
  );

  const data = JSON.parse(text);
  const item = data?.datas?.[0];

  const value = toNumber(item?.closePrice);
  const change = toNumber(item?.compareToPreviousClosePrice);

  return {
    label,
    value,
    change,
    direction: getDirection(change),
  };
};



const fetchMetal = async (
  label: "국내 금 (원/g)" | "은 (USD/OZS)",
  code: string
) => {
  const html = await fetchText(
    `https://m.stock.naver.com/marketindex/metals/${code}`
  );

  const closePrice =
    html.match(/"closePrice":"([^"]+)"/)?.[1] || "0";

  const fluctuations =
    html.match(/"fluctuations":"([^"]+)"/)?.[1] || "0";

  const fluctuationType =
    html.match(/"fluctuationsType":\{"code":"([^"]+)"/)?.[1] || "3";

  const value = toNumber(closePrice);
  const change = toNumber(fluctuations);

  return {
    label,
    value,
    change,
    direction:
      fluctuationType === "2"
        ? "up"
        : fluctuationType === "5"
        ? "down"
        : "same",
  };
};

export async function GET() {
  try {
const [kospi, kosdaq, gold, silver] = await Promise.all([
  fetchIndex("코스피", "KOSPI"),
  fetchIndex("코스닥", "KOSDAQ"),
  fetchMetal("국내 금 (원/g)", "M04020000"),
  fetchMetal("은 (USD/OZS)", "SIcv1"),
]);

    return NextResponse.json({
      date: new Date().toISOString(),
      items: [kospi, kosdaq, gold, silver],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "시장지표를 불러오지 못했습니다.",
        items: [],
      },
      { status: 500 }
    );
  }
}