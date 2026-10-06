"use client";

export default function HeaderUtilityItems({ onClose }: { onClose: () => void }) {
  return <>
    {[
      { title: "계산기", event: "open-calculator" },
      { title: "환율변환기", event: "open-currency-converter" },
    ].map((item) => <button
      key={item.event}
      onClick={() => { onClose(); window.dispatchEvent(new CustomEvent(item.event)); }}
      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default"
    >{item.title}</button>)}
  </>;
}
