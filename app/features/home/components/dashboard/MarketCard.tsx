"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChartNoAxesColumnIncreasing, TrendingUp, ChartNoAxesCombined } from "lucide-react";
import styles from "./DashboardCards.module.css";

type Item = { label: string; value: number; change: number; direction: "up" | "down" | "same" };
const slots = [
  { key: "USD", name: "USD", image: "/flags/USD.png", icon: null, unit: "원" },
  { key: "JPY", name: "JPY", image: "/flags/JPY.png", icon: null, unit: "원" },
  { key: "EUR", name: "EUR", image: "/flags/EUR.png", icon: null, unit: "원" },
  { key: "CNY", name: "CNY", image: "/flags/CNY.png", icon: null, unit: "원" },
  { key: "코스피", name: "코스피", image: null, icon: TrendingUp, unit: "" },
  { key: "코스닥", name: "코스닥", image: null, icon: ChartNoAxesCombined, unit: "" },
  { key: "국내 금 (원/g)", name: "금 (원/g)", image: "/images/market/gold.svg", icon: null, unit: "원" },
  { key: "은 (USD/OZS)", name: "은 (oz)", image: "/images/market/silver.svg", icon: null, unit: "" },
];
const links: Record<string, string> = {
  USD: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW",
  JPY: "https://m.stock.naver.com/marketindex/exchange/FX_JPYKRW",
  EUR: "https://m.stock.naver.com/marketindex/exchange/FX_EURKRW",
  CNY: "https://m.stock.naver.com/marketindex/exchange/FX_CNYKRW",
  코스피: "https://m.stock.naver.com/domestic/index/KOSPI/total",
  코스닥: "https://m.stock.naver.com/domestic/index/KOSDAQ/total",
  "국내 금 (원/g)": "https://m.stock.naver.com/marketindex/metals/M04020000",
  "은 (USD/OZS)": "https://m.stock.naver.com/marketindex/metals/SIcv1",
};
function MarketTile({ slot, item }: { slot: typeof slots[number]; item?: Item }) {
  const amount = Math.abs(item?.change ?? 0);
  const Icon = slot.icon;
  const valid = item && Number.isFinite(item.value) && item.value > 0;
  const direction = amount === 0 ? "same" : item?.direction || "same";
  return <a className={styles.marketItem} href={links[slot.key]} target="_blank" rel="noopener noreferrer" aria-label={`${slot.name} 상세 지표 새 창`}>
    <div className={styles.marketLabel}>{slot.image ? <Image src={slot.image} width={22} height={22} alt={slot.name} className={slot.key.length === 3 ? styles.flag : styles.metalIcon} unoptimized /> : Icon ? <Icon /> : null}<span title={slot.key === "JPY" ? "100엔 기준" : undefined}>{slot.name}</span></div>
    <strong className={styles.marketValue}>{valid ? `${item.value.toLocaleString("ko-KR", { maximumFractionDigits: slot.unit ? 0 : 2, minimumFractionDigits: slot.unit ? 0 : 2 })}${slot.unit}` : "—"}</strong>
    <span className={`${styles.change} ${styles[direction]}`}>{valid ? <>
      {direction === "same" ? null : <svg viewBox="0 0 16 16" role="img" aria-label={direction === "up" ? "상승" : "하락"}><path fill="currentColor" d={direction === "up" ? "M8 2 15 14H1Z" : "M1 2h14L8 14Z"} /></svg>}
      <span className={styles.changeNumber}>{direction === "same" ? "0.00" : amount.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</span>
    </> : "조회 대기"}</span>
  </a>;
}
export default function MarketCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [timestamp, setTimestamp] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const results = await Promise.allSettled(["/api/market", "/api/naver-exchange"].map(async url => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Market unavailable");
        return response.json();
      }));
      if (controller.signal.aborted) return;
      const successful = results.filter(r => r.status === "fulfilled");
      setItems(successful.flatMap(r => r.value.items || []));
      setFailed(results.some(r => r.status === "rejected"));
      setTimestamp(successful.map(r => r.value.date).filter(Boolean).sort()[0] || "");
    };
    void load();
    const timer = setInterval(() => void load(), 300000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  return <article className={styles.card} aria-label="주요 지표">
    <div className={styles.heading}><h2><ChartNoAxesColumnIncreasing />주요 지표</h2><div className={styles.marketTime} role="status">
      <span>{timestamp ? `${new Date(timestamp).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })} 조회 · 네이버 증권` : "지표 확인 중"}</span>
    </div></div>
    <div className={styles.marketGrid}>{slots.map(slot => { const item = items.find(i => i.label === slot.key); return <MarketTile key={`${slot.key}:${item?.change}:${item?.direction}`} slot={slot} item={item} />; })}</div>
    {failed && <span className={styles.visuallyHidden} role="status">일부 지표를 불러오지 못했습니다.</span>}
  </article>;
}
