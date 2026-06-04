import { NextResponse } from "next/server";

type Direction = "up" | "down" | "same";

const EXCHANGE_ITEMS = [
  { label: "USD", code: "FX_USDKRW" },
  { label: "JPY", code: "FX_JPYKRW" },
  { label: "EUR", code: "FX_EURKRW" },
  { label: "CNY", code: "FX_CNYKRW" },
];

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

const fetchExchange = async (label: string, code: string) => {
  const html = await fetchText(
    `https://m.stock.naver.com/marketindex/exchange/${code}`
  );

  const closePrice = html.match(/"closePrice":"([^"]+)"/)?.[1] || "0";
  const fluctuations = html.match(/"fluctuations":"([^"]+)"/)?.[1] || "0";

  const value = toNumber(closePrice);
  const change = toNumber(fluctuations);

return {
  label,
  value,
  change,
  direction: getDirection(change),
};
};

export async function GET() {
  try {
    const items = await Promise.all(
      EXCHANGE_ITEMS.map((item) => fetchExchange(item.label, item.code))
    );

    return NextResponse.json({
      date: new Date().toISOString(),
      items,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "네이버 환율 정보를 불러오지 못했습니다.",
        items: [],
      },
      { status: 500 }
    );
  }
}