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
    return NextResponse.json({ error: "OPENWEATHER_API_KEY가 없습니다." }, { status: 500 });
  }

  // 현재 날씨
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=kr`;
  // 5일 예보 (하루 1개씩 5개 )
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=kr`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl, { next: { revalidate: 600 } } ),
      fetch(forecastUrl, { next: { revalidate: 600 } }),
    ]);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // 하루 중 12:00 기준으로 5일치 추출
    const daily = forecastData.list
      .filter((item: any) => item.dt_txt.includes("12:00:00"))
      .slice(0, 5)
      .map((item: any) => ({
        date: item.dt_txt.slice(5, 10), // "MM-DD"
        temp: Math.round(item.main.temp),
        description: item.weather?.[0]?.description || "",
        icon: item.weather?.[0]?.icon || "",
      }));

    return NextResponse.json({
      region,
      temp: Math.round(currentData.main.temp),
      description: currentData.weather?.[0]?.description || "",
      icon: currentData.weather?.[0]?.icon || "",
      daily,
    });
  } catch {
    return NextResponse.json({ error: "날씨 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
