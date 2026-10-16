"use client";

import { usePathname } from "next/navigation";
import { GlobalMemoManager } from "./MemoManager";
import MemoStickers from "./MemoStickers";
import Calculator from "./Calculator";
import CurrencyConverter from "./CurrencyConverter";

export default function GlobalWidgets() {
  const pathname = usePathname();
  const isSalesBook = pathname.startsWith("/sales-book");

  return (
    <>
      {!isSalesBook && <MemoStickers />}
      <GlobalMemoManager />
      <Calculator />
      <CurrencyConverter />

    </>
  );
}
