import { NextResponse } from "next/server";

const insuranceRelatedKeywords = [
  // 보험 직접 키워드
  "보험",
  "보험사",
  "보험업계",
  "생명보험",
  "손해보험",
  "실손보험",
  "건강보험",
  "암보험",
  "치매보험",
  "간병보험",
  "운전자보험",
  "종신보험",
  "연금보험",
  "어린이보험",
  "태아보험",
  "유병자보험",
  "간편보험",
  "보험료",
  "보험금",
  "보험금 청구",
  "보험사기",
  "비급여",
  "자기부담금",
  "산정특례",
  "의료비",

  // 암·질병
  "암",
  "유방암",
  "대장암",
  "폐암",
  "갑상선암",
  "전립선암",
  "위암",
  "간암",
  "췌장암",
  "난소암",
  "자궁암",
  "백혈병",
  "림프종",
  "전이",
  "재발",
  "항암",
  "표적항암",
  "면역항암",
  "방사선치료",
  "중입자치료",
  "양성자치료",

  // 노후·간병
  "치매",
  "알츠하이머",
  "파킨슨",
  "간병",
  "요양",
  "요양병원",
  "요양원",
  "장기요양",
  "노인",
  "고령화",
  "시니어",

  // 주요 질환
  "백내장",
  "녹내장",
  "당뇨",
  "고혈압",
  "고지혈증",
  "심근경색",
  "협심증",
  "심장질환",
  "뇌경색",
  "뇌출혈",
  "뇌졸중",
  "희귀질환",
  "중증질환",
  "만성질환",

  // 돈·은퇴·경제
  "은퇴",
  "노후",
  "연금",
  "국민연금",
  "퇴직연금",
  "개인연금",
  "달러",
  "환율",
  "금리",
  "물가",
  "의료비",
  "치료비",
  "생활비",
  "상속",
  "세금",
  "증여",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawQuery = searchParams.get("query") || "전체";
    const display = searchParams.get("display") || "30";

    const isAll = rawQuery === "전체";

const query = isAll
  ? "보험 암 치매 간병 실손보험 연금 은퇴 의료비"
  : rawQuery;

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

    const items = data.items || [];

    const filteredItems = isAll
      ? items.filter((item: any) => {
          const text = `${item.title || ""} ${item.description || ""}`
            .replaceAll("<b>", "")
            .replaceAll("</b>", "");

          return insuranceRelatedKeywords.some((keyword) =>
            text.includes(keyword)
          );
        })
      : items;

    return NextResponse.json({
      query,
      items: filteredItems.length > 0 ? filteredItems.slice(0, 10) : items.slice(0, 10),
    });
  } catch {
    return NextResponse.json(
      { error: "뉴스 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}