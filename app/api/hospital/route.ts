import { NextResponse } from "next/server";

const SERVICE_KEY = process.env.HIRA_SERVICE_KEY;

const TYPE_CODE: Record<string, string> = {
  의원: "31",
  종합병원: "11",
  상급종합병원: "01",
};

function toArray(value: any) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const sido = searchParams.get("sido") || "";
  const dong = searchParams.get("dong") || "";
  const department = searchParams.get("department") || "";
  const type = searchParams.get("type") || "전체";

  if (!SERVICE_KEY) {
    return NextResponse.json(
      { error: "HIRA_SERVICE_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const selectedTypes =
    type === "전체" ? ["의원", "종합병원", "상급종합병원"] : [type];

  const allResults: any[] = [];

  for (const selectedType of selectedTypes) {
    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: "1",
      numOfRows: "100",
      _type: "json",
      clCd: TYPE_CODE[selectedType],
    });

    const url = `https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?${params.toString()}`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const items = toArray(data?.response?.body?.items?.item);

    items.forEach((item: any) => {
      const address = item.addr || "";

      if (sido && !address.includes(sido)) return;
      if (dong && !address.includes(dong)) return;

      allResults.push({
        type: selectedType,
        name: item.yadmNm || "",
        address,
        tel: item.telno || "-",
        doctorCount: item.drTotCnt
          ? `${Number(item.drTotCnt).toLocaleString()}명`
          : "-",
        departments: "-",
        traffic: "-",
      });
    });
  }

  return NextResponse.json({
    items: allResults,
  });
}