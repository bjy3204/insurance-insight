import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=KRW,JPY,EUR,CNY",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      throw new Error("exchange api error");
    }

    const data = await res.json();

    return NextResponse.json({
      date: data.date,
      items: [
        { label: "USD", value: data.rates.KRW },
        { label: "JPY", value: data.rates.KRW / data.rates.JPY * 100 },
        { label: "EUR", value: data.rates.KRW / data.rates.EUR },
        { label: "CNY", value: data.rates.KRW / data.rates.CNY },
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "환율 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}