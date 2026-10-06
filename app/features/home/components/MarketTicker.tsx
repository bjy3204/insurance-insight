"use client";

import ExchangeIndexBar from "../components/ExchangeIndexBar";
import type { HomeController } from "../hooks/useHomeController";
export default function MarketTicker({ controller }: { controller: HomeController }) {
const { mainMenuManageMode } = controller;
return (<>{mainMenuManageMode === "normal" && <ExchangeIndexBar />}</>);
}
