"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function QuickMenuLimitDialog({ controller }: { controller: HomeController }) {
const { quickLimitOpen, setQuickLimitOpen } = controller;
return (<>{quickLimitOpen && (
  <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        빠른메뉴 선택
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        빠른메뉴는 최대 4개까지 선택할 수 있습니다.
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setQuickLimitOpen(false)}
          className="
            w-32
            h-12
            rounded-2xl
            bg-blue-600
            text-white
            text-sm
            font-bold
            hover:bg-blue-700
            transition
            cursor-default
          "
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}</>);
}
