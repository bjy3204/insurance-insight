import { NextResponse } from "next/server";

const REGION_MAP: Record<string, { lat: number; lon: number }> = {
  서울: { lat: 37.5665, lon: 126.978 },
  부산: { lat: 35.1796, lon: 129.0756 },
  대구: { lat: 35.8714, lon: 128.6014 },
  인천: { lat: 37.4563, lon: 126.7052 },
  광주: { lat: 35.1595, lon: 126.8526 },
  대전: { lat: 36.3504, lon: 127.3845 },
  울산: { lat: 35.5384, lon: 129.3114 },
  세종: { lat: 36.4801, lon: 127.289 },
  제주: { lat: 33.4996, lon: 126.5312 },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || "서울";
  const location = REGION_MAP[region] || REGION_MAP["서울"];

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY가 없습니다." },
      { status: 500 }
    );
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=kr`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "날씨 정보를 불러오지 못했습니다.",
          status: res.status,
          message: data?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      region,
      temp: Math.round(data.main.temp),
      description: data.weather?.[0]?.description || "",
      icon: data.weather?.[0]?.icon || "",
    });
  } catch {
    return NextResponse.json(
      { error: "날씨 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}