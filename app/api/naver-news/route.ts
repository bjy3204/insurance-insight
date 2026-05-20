import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || "보험사 OR 실손보험 OR 손해보험 OR 생명보험";
    const display = searchParams.get("display") || "10";

    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
        query
      )}&display=${display}&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();

      return NextResponse.json(
        {
          error: "네이버 API 응답 오류",
          status: res.status,
          detail: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      query,
      items: data.items || [],
    });
  } catch {
    return NextResponse.json(
      { error: "뉴스 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}