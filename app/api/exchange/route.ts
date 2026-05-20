import { NextResponse } from "next/server";

const API_URL =
  "https://api.frankfurter.app/latest?from=USD&to=KRW,JPY,EUR,CNY";

const makeItems = (data: any, prevData?: any) => {
  const current = {
    USD: data.rates.KRW,
    JPY: (data.rates.KRW / data.rates.JPY) * 100,
    EUR: data.rates.KRW / data.rates.EUR,
    CNY: data.rates.KRW / data.rates.CNY,
  };

  const previous = prevData
    ? {
        USD: prevData.rates.KRW,
        JPY: (prevData.rates.KRW / prevData.rates.JPY) * 100,
        EUR: prevData.rates.KRW / prevData.rates.EUR,
        CNY: prevData.rates.KRW / prevData.rates.CNY,
      }
    : null;

  return Object.entries(current).map(([label, value]) => {
    const prevValue = previous
      ? previous[label as keyof typeof previous]
      : Number(value);

    const change = Number(value) - Number(prevValue);

    return {
      label,
      value: Number(value),
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

    if (!res.ok) {
      throw new Error("exchange api error");
    }

    const data = await res.json();

    const latestDate = new Date(data.date);
    const prevDate = new Date(latestDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const prevDateText = prevDate.toISOString().slice(0, 10);

    let prevData = null;

    try {
      const prevRes = await fetch(
        `https://api.frankfurter.app/${prevDateText}?from=USD&to=KRW,JPY,EUR,CNY`,
        { next: { revalidate: 3600 } }
      );

      if (prevRes.ok) {
        prevData = await prevRes.json();
      }
    } catch {
      prevData = null;
    }

    return NextResponse.json({
      date: data.date,
      previousDate: prevData?.date || "",
      items: makeItems(data, prevData),
    });
  } catch {
    return NextResponse.json(
      { error: "환율 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}