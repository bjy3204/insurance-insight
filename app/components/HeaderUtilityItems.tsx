"use client";

import { usePathname } from "next/navigation";

export default function HeaderUtilityItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return <>
    {[
      { title: "계산기", event: "open-calculator" },
      { title: "환율변환기", event: "open-currency-converter" },
      { title: "물가 장바구니", event: "open-purchasing-basket" },
    ].filter(item => item.event !== "open-purchasing-basket" || pathname === "/money-value").map((item) => <button
      key={item.event}
      onClick={() => { onClose(); window.dispatchEvent(new CustomEvent(item.event)); }}
      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition border-t border-gray-100 cursor-pointer"
    >{item.title}</button>)}
  </>;
}
