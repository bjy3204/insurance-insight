"use client";

import { usePathname } from "next/navigation";
import MemoStickers from "./MemoStickers";
import Calculator from "./Calculator";

export default function GlobalWidgets() {
  const pathname = usePathname();
  const isSalesBook = pathname.startsWith("/sales-book");

  return (
    <>
      {!isSalesBook && <MemoStickers />}
      <Calculator />
    </>
  );
}