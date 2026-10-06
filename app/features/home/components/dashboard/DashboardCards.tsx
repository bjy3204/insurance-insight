"use client";

import { useEffect, useState } from "react";
import type { HomeController } from "../../hooks/useHomeController";
import WeatherCard from "./WeatherCard";
import MarketCard from "./MarketCard";
import CalendarCard from "./CalendarCard";
import styles from "./DashboardCards.module.css";

export default function DashboardCards({ controller }: { controller: HomeController }) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (!desktop || controller.mainMenuManageMode !== "normal") return null;
  return <section className={styles.row} aria-label="날씨, 주요 지표와 내 일정">
    <WeatherCard onFortune={() => controller.setFortuneOpen(true)} />
    <MarketCard />
    <CalendarCard key={`${controller.authUser?.id ?? "visitor"}:${controller.authStatus}:${controller.authLoading}`} userId={controller.authUser?.id ?? null} approved={controller.authStatus === "approved"} loading={controller.authLoading || Boolean(controller.authUser && !controller.authStatus)} />
  </section>;
}
