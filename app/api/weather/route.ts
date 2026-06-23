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

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=kr`;

  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=kr`;

  const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}`;

  try {
    const descriptionMap: Record<string, string> = {
  맑음: "맑음",
  구름조금: "구름 조금",
  튼구름: "구름 많음",
  온흐림: "흐림",
  실비: "비",
  소낙비: "소나기",
  눈: "눈",
};
    const [currentRes, forecastRes, airRes] = await Promise.all([
      fetch(currentUrl, { next: { revalidate: 600 } }),
      fetch(forecastUrl, { next: { revalidate: 600 } }),
      fetch(airUrl, { next: { revalidate: 600 } }),
    ]);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();
    const airData = await airRes.json();

 const air = airData.list?.[0];

const pm10 = air?.components?.pm10 ?? 0;
const pm25 = air?.components?.pm2_5 ?? 0;

const pm10Status =
  pm10 <= 30
    ? "좋음"
    : pm10 <= 80
    ? "보통"
    : pm10 <= 150
    ? "나쁨"
    : "매우나쁨";

const pm25Status =
  pm25 <= 15
    ? "좋음"
    : pm25 <= 35
    ? "보통"
    : pm25 <= 75
    ? "나쁨"
    : "매우나쁨";

    const daily = forecastData.list
      .filter((item: any) => item.dt_txt.includes("12:00:00"))
      .slice(0, 5)
      .map((item: any) => ({
        date: item.dt_txt.slice(0, 10),
        temp: Math.round(item.main.temp),
        tempMin: Math.round(item.main.temp_min),
        tempMax: Math.round(item.main.temp_max),
        description: descriptionMap[item.weather?.[0]?.description || ""] || item.weather?.[0]?.description || "",
        icon: item.weather?.[0]?.icon || "",
      }));

    const todayKey = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Seoul",
});

    const todayForecasts = forecastData.list.filter((item: any) =>
      item.dt_txt.startsWith(todayKey)
    );

    const todayTemps = todayForecasts.map((item: any) => item.main.temp);

    const todayTempMin =
      todayTemps.length > 0
        ? Math.round(Math.min(...todayTemps))
        : Math.round(currentData.main.temp_min);

    const todayTempMax =
      todayTemps.length > 0
        ? Math.round(Math.max(...todayTemps))
        : Math.round(currentData.main.temp_max);

        const rawDescription = currentData.weather?.[0]?.description || "";


const description =
  descriptionMap[rawDescription] || rawDescription;

    return NextResponse.json({
      region,
      temp: Math.round(currentData.main.temp),
      description,
      icon: currentData.weather?.[0]?.icon || "",

      tempMin: todayTempMin,
      tempMax: todayTempMax,
      humidity: currentData.main.humidity,
      feelsLike: Math.round(currentData.main.feels_like),

airQuality: {
  pm10,
  pm25,
  pm10Status,
  pm25Status,
},

      daily,
    });
  } catch {
    return NextResponse.json(
      { error: "날씨 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}