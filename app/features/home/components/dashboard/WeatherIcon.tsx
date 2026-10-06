import { useId } from "react";

export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow";
export default function WeatherIcon({ condition, night = false, className }: { condition: WeatherCondition; night?: boolean; className?: string }) {
  const id = useId().replaceAll(":", "");
  const label = { clear: night ? "맑은 밤" : "맑음", cloudy: "흐림", rain: "비", snow: "눈" }[condition];
  return <svg viewBox="0 0 64 64" className={className} role="img" aria-label={label}>
    <defs><linearGradient id={`${id}-sun`} x2="0" y2="1"><stop stopColor="#ffd654" /><stop offset="1" stopColor="#ffad00" /></linearGradient><linearGradient id={`${id}-cloud`} x2="0" y2="1"><stop stopColor="#d8eaff" /><stop offset="1" stopColor="#9bbfe7" /></linearGradient></defs>
    {condition === "clear" ? night ? <path d="M43 8a23 23 0 1 0 13 37A24 24 0 0 1 43 8Z" fill="#f3d977" /> : <><g stroke="#ffb313" strokeWidth="2.5" strokeLinecap="round">{Array.from({ length: 8 }, (_, i) => <path key={i} d="M32 3v6" transform={`rotate(${i * 45} 32 32)`} />)}</g><circle cx="32" cy="32" r="18" fill={`url(#${id}-sun)`} /></> : <>
      <path d="M17 46a12 12 0 0 1-1-24 17 17 0 0 1 31-1 13 13 0 0 1 1 25Z" fill={`url(#${id}-cloud)`} stroke="#a4c5e7" strokeWidth="1.2" />
      {condition === "rain" && <g stroke="#57a3e8" strokeWidth="3.5" strokeLinecap="round"><path d="m20 51-3 7m16-7-3 7m16-7-3 7" /></g>}
      {condition === "snow" && <g fill="#77bce9"><circle cx="19" cy="55" r="2.5" /><circle cx="32" cy="57" r="2.5" /><circle cx="45" cy="55" r="2.5" /></g>}
    </>}
  </svg>;
}
