"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MapPin, ChevronDown, Cookie, X, Search } from "lucide-react";
import WeatherIcon from "./WeatherIcon";
import WeatherBackdrop from "./WeatherBackdrop";
import { daylightWeights } from "./weather-light";

import styles from "./DashboardCards.module.css";

type Place = { id?: number; name: string; displayName?:string; lat: number; lon: number; locate?: boolean };
type Condition = "clear" | "cloudy" | "rain" | "snow";
type Weather = { region: string; temp: number; condition: Condition; sunrise: number; sunset: number; days: { date: string; min: number | null; max: number | null; condition: Condition }[] };
const names = { clear: "맑음", cloudy: "흐림", rain: "비", snow: "눈" };
const storageKey = "insurance-dashboard-weather-location";

export default function WeatherCard({ onFortune }: { onFortune: () => void }) {
  const [place, setPlace] = useState<Place>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved.name === "string" && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) return saved;
    } catch { /* Default to Seoul when no saved region is available. */ }
    return { name: "서울", lat: 37.5665, lon: 126.978 };
  });
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const forecastYears = Array.from(new Set(weather?.days.map(day => day.date.slice(0, 4)) || [])).join(",");
  useEffect(() => {
    if (!forecastYears) return;
    const controller = new AbortController();
    void Promise.all(forecastYears.split(",").map(async year => {
      const response = await fetch(`/api/dashboard-holidays?year=${year}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Holiday lookup unavailable");
      return response.json();
    })).then(results => { if (!controller.signal.aborted) setHolidays(Object.fromEntries(results.flatMap(result => result.holidays.map((holiday: { date: string; name: string }) => [holiday.date, holiday.name])))); }).catch(() => {});
    return () => controller.abort();
  }, [forecastYears]);
  const searchRequest = useRef(0);
  useEffect(() => {
    const update = () => setNow(Date.now() / 1000);
    const timer = setInterval(update, 15000);
    window.addEventListener("focus",update);
    return () => { clearInterval(timer); window.removeEventListener("focus",update); };
  }, []);
  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    const load = async () => {
      setBusy(true);
      setError("");
      try {
        const params = new URLSearchParams({ lat: String(place.lat), lon: String(place.lon), name: place.displayName || place.name });
        if (place.locate) params.set("locate", "1");
        const response = await fetch(`/api/home-weather?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "날씨 조회에 실패했습니다.");
        if (!controller.signal.aborted) {
          setWeather(data);
          try { localStorage.setItem(storageKey, JSON.stringify({ ...place, displayName: data.region, locate: false })); } catch { /* Weather is usable even when browser storage is disabled. */ }
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "날씨 조회에 실패했습니다.");
      } finally { if (!controller.signal.aborted) setBusy(false); }
    };
    void load();
    const timer = setInterval(() => void load(), 600000);
    const onFocus = () => void load();
    window.addEventListener("focus",onFocus);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus",onFocus); };
  }, [place]);
  useEffect(() => {
    if (!searchOpen) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [searchOpen]);
  const locate = () => {
    if (!navigator.geolocation) { setError("이 브라우저에서는 현재 위치를 사용할 수 없습니다."); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(position => {
      setPlace({ name: "현재 위치", lat: position.coords.latitude, lon: position.coords.longitude, locate: true });
    }, () => { setBusy(false); setError("위치를 확인하지 못했습니다. 기존 지역을 유지합니다. 지역 검색도 이용할 수 있어요."); }, { timeout: 10000, maximumAge: 600000 });
  };
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const request = ++searchRequest.current;
    setSearching(true); setSearchMessage(""); setResults([]);
    try {
      const response = await fetch(`/api/home-weather?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (request !== searchRequest.current) return;
      setResults(data.places);
      if (!data.places.length) setSearchMessage("검색 결과가 없습니다. 시·군 이름으로 다시 검색해 주세요.");
    } catch { if (request === searchRequest.current) setSearchMessage("지역을 검색하지 못했습니다. 다시 시도해 주세요."); }
    finally { if (request === searchRequest.current) setSearching(false); }
  };
  const light = daylightWeights(now,weather?.sunrise ?? 0,weather?.sunset ?? 0);
  const phase = Object.entries(light).sort((a,b) => b[1]-a[1])[0][0];
  const mix = (day:number[],night:number[],alpha=1) => `rgb(${day.map((value,i) => Math.round(value+(night[i]-value)*light.night)).join(" ")} / ${alpha})`;
  const appearance = {"--night-weight":light.night,"--day-weight":1-light.night,"--weather-text":mix([11,20,50],[255,255,255]),"--weather-secondary":mix([51,65,85],[241,245,255])} as CSSProperties;
  return <article className={styles.card} aria-label="오늘의 날씨">
    <div key={weather ? 'weather-ready' : 'weather-loading'} className={styles.weatherTop} data-phase={weather ? phase : 'loading'} style={weather ? appearance : undefined}>
      {weather && <WeatherBackdrop condition={weather.condition} weights={light} />}
      <div className={styles.heading}>
        <div className={styles.weatherTitle}><h2>오늘의 날씨</h2><div className={styles.location}>
          <button type="button" onClick={locate} title="현재 위치 날씨" aria-label="현재 위치 날씨" disabled={busy}><MapPin /></button>
          <button type="button" onClick={() => setSearchOpen(true)} title={place.name}><span className={styles.locationLabel}>{weather?.region || place?.name || "서울"}</span><ChevronDown /></button>
        </div></div>
        <button type="button" className={styles.iconButton} onClick={onFortune} title="오늘의 한마디" aria-label="오늘의 한마디"><Cookie /></button>
      </div>
      <div className={styles.weatherMain}>{weather && <WeatherIcon condition={weather.condition} night={phase === "night"} />}<div><div className={styles.temperature}>{weather ? `${weather.temp}°C` : "—"}</div><div className={styles.description}>{weather ? names[weather.condition] : "날씨 확인 중"}</div></div></div>
      {error && <p role="status" className={styles.error} style={{ padding: "0 15px", marginTop: 0 }}>{error}</p>}
    </div>
    <div className={styles.forecast}>{weather?.days.map(day => {
      const date = new Date(`${day.date}T12:00:00+09:00`);
      const weekday = date.getDay();
      const dateColor = holidays[day.date] || weekday === 0 ? styles.sunday : weekday === 6 ? styles.saturday : "";
      return <div key={day.date} className={styles.forecastDay}><div className={`${styles.forecastDate} ${dateColor}`} title={holidays[day.date]}>{`${date.getMonth() + 1}/${date.getDate()} (${["일", "월", "화", "수", "목", "금", "토"][weekday]})`}</div><WeatherIcon condition={day.condition} /><strong>{day.max ?? "—"}° / {day.min ?? "—"}°</strong></div>;
    })}</div>
    {searchOpen && createPortal(<div className={styles.overlay} onClick={() => setSearchOpen(false)}><div className={styles.dialog} role="dialog" aria-modal="true" aria-label="날씨 지역 검색" onClick={e => e.stopPropagation()}><div className={styles.dialogHeader}>지역 검색<button data-popup-close="true" className={styles.iconButton} onClick={() => setSearchOpen(false)} aria-label="닫기"><X /></button></div><form onSubmit={search}><label>전국 지역명<input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="예: 서울, 울산 삼산동" maxLength={80} /></label><div className={styles.formActions}><button className={styles.primary} disabled={searching}><Search size={14} style={{ display: "inline", marginRight: 5 }} />{searching ? "검색 중" : "검색"}</button></div></form><p className={styles.muted}>{searchMessage}</p>{results.map((result, index) => <button className={styles.searchResult} key={result.id ?? index} onClick={() => { setPlace(result); setSearchOpen(false); }}>{result.name}</button>)}</div></div>, document.body)}
  </article>;
}
