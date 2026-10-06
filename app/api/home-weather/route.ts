import { NextResponse } from "next/server";
import { addressPlaces, type AddressFeature } from "./place-label";

type WeatherEntry = { dt: number; main: { temp: number; temp_min: number; temp_max: number }; weather: { id: number }[] };
type Place = { name: string; local_names?: { ko?: string }; lat: number; lon: number; country: string; state?: string };
const dayKey = (seconds: number) => new Date(seconds * 1000).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
const condition = (id: number) => id >= 600 && id < 700 ? "snow" : id >= 200 && id < 600 ? "rain" : id === 800 ? "clear" : "cloudy";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return NextResponse.json({ error: "날씨 연결 설정을 확인해 주세요." }, { status: 503 });
  const read = async (url: string, revalidate=600) => {
    const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Weather service unavailable");
    return response.json();
  };
  try {
    const query = params.get("q")?.trim();
    if (query) {
      if (query.length > 80) return NextResponse.json({ error: "검색어가 너무 깁니다." }, { status: 400 });
      // Photon supplies parent administrative areas; existing geocoders are fallbacks.
      let places: { name: string; displayName?:string; lat: number; lon: number; id?: number }[] = [];
      const sources = await Promise.allSettled([
        read(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=30&language=ko&format=json`),
        read(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(`${query},KR`)}&limit=5&appid=${key}`),
        read(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=20&bbox=124,33,132,39`,86400),
      ]);
      if (sources[2].status === "fulfilled") places=addressPlaces((sources[2].value.features||[]) as AddressFeature[]);
      if (!places.length && sources[0].status === "fulfilled") places = (sources[0].value.results || []).filter((p: { country_code: string }) => p.country_code === "KR").map((p: { id: number; name: string; admin1?: string; admin2?: string; latitude: number; longitude: number }) => ({ id: p.id, name: [p.admin1, p.admin2, p.name].filter((v, i, a) => v && a.indexOf(v) === i).join(" "), lat: p.latitude, lon: p.longitude }));
      if (!places.length && sources[1].status === "fulfilled") places = (sources[1].value as Place[]).filter(p => p.country === "KR" && (p.state || !/(동|읍|면|리)$/.test(p.local_names?.ko || p.name))).map(p => ({ name: [p.state,p.local_names?.ko || p.name].filter(Boolean).join(" "), lat: p.lat, lon: p.lon }));
      if (sources.every(source => source.status === "rejected")) throw new Error("Location search unavailable");
      return NextResponse.json({ places });
    }
    const lat = Number(params.get("lat") ?? 37.5665);
    const lon = Number(params.get("lon") ?? 126.978);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return NextResponse.json({ error: "위치를 확인해 주세요." }, { status: 400 });
    const base = `lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=kr`;
    const [current, forecast] = await Promise.all([
      read(`https://api.openweathermap.org/data/2.5/weather?${base}`),
      read(`https://api.openweathermap.org/data/2.5/forecast?${base}`),
    ]);
    let region = params.get("name")?.slice(0, 100) || "서울";
    if (params.get("locate") !== "1" && /^[가-힣\d]+(?:동|읍|면|리)$/.test(region)) {
      // Upgrade previously saved bare neighborhood names by matching their
      // existing coordinates locally, without sending coordinates to Photon.
      try {
        const address = await read(`https://photon.komoot.io/api/?q=${encodeURIComponent(region)}&limit=20&bbox=124,33,132,39`,86400);
        const matches=addressPlaces((address.features||[]) as AddressFeature[]).map(place=>({...place,distance:(place.lat-lat)**2+(place.lon-lon)**2})).sort((a,b)=>a.distance-b.distance);
        if (matches[0] && matches[0].distance < .0001) region=matches[0].displayName;
      } catch { /* Keep the selected weather usable if address enrichment is unavailable. */ }
    }
    if (params.get("locate") === "1") {
      try {
        const places: Place[] = await read(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`);
        region = places[0]?.local_names?.ko || places[0]?.name || "현재 위치";
      } catch { region = "현재 위치"; }
    }
    const today = dayKey(Math.floor(Date.now() / 1000));
    const groups = new Map<string, WeatherEntry[]>();
    for (const entry of forecast.list as WeatherEntry[]) {
      const date = dayKey(entry.dt);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(entry);
    }
    const days = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(`${today}T12:00:00+09:00`);
      date.setUTCDate(date.getUTCDate() + index + 1);
      const dateKey = dayKey(date.getTime() / 1000);
      const entries = groups.get(dateKey) || [];
      const representative = [...entries].sort((a, b) => Math.abs(a.dt * 1000 - date.getTime()) - Math.abs(b.dt * 1000 - date.getTime()))[0];
      const mins = entries.map(e => e.main.temp_min);
      const maxes = entries.map(e => e.main.temp_max);
      return { date: dateKey, min: mins.length ? Math.round(Math.min(...mins)) : null, max: maxes.length ? Math.round(Math.max(...maxes)) : null, condition: representative ? condition(representative.weather[0].id) : condition(current.weather[0].id) };
    });
    return NextResponse.json({ region, temp: Math.round(current.main.temp), condition: condition(current.weather[0].id), sunrise: current.sys.sunrise, sunset: current.sys.sunset, days });
  } catch {
    return NextResponse.json({ error: "날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
