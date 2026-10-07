"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  ArrowLeft,
  CalendarDays,
  Newspaper,
  MessageCircle,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import SiteFooter from "@/app/components/SiteFooter";
import Calendar from "@/app/components/calendar/Calendar";
export default function CalendarPage() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!toolsOpen) return; const outside = (event: PointerEvent) => { if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false); }; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setToolsOpen(false); }; document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key); return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); }; }, [toolsOpen]);
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* 헤더 */}
      <header
        data-page-header="true"
        className="bg-white border-b border-black shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              data-header-control="true"
              href="/"
              className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CalendarDays className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">캘린더</h1>
              </div>
            </div>

            <div ref={toolsRef} className="relative">
              <button type="button" data-header-control="true" aria-label="도구 메뉴" aria-expanded={toolsOpen} onClick={() => setToolsOpen(open => !open)} className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer"><LayoutGrid className="w-5 h-5 text-gray-600" /></button>
              {toolsOpen && <div className="absolute right-0 top-full mt-2 z-[100] w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">{[{ label: "메모장", event: "open-memo-manager" }, { label: "계산기", event: "open-calculator" }, { label: "환율변환기", event: "open-currency-converter" }].map(item => <button key={item.event} type="button" onClick={() => { setToolsOpen(false); window.dispatchEvent(new CustomEvent(item.event)); }} className="block w-full px-4 py-3 text-sm font-bold text-gray-700 text-center hover:bg-gray-50 cursor-pointer">{item.label}</button>)}</div>}
            </div>
          </div>
        </div>
      </header>

      <div data-page-content="true" className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <Calendar />
      </div>
      {/* 하단 고정 메뉴 */}
      <>
        <SiteFooter desktopOnly />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
            <a
              href="https://naver.me/xsZ8mk7H"
              className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
            >
              <Newspaper className="w-5 h-5" />
              <span className="text-sm">보험사별 소식지</span>
            </a>

            <a
              href="https://open.kakao.com/o/gD7ej63h"
              className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">보험인사이트 카카오톡</span>
            </a>

            <a
              href="https://www.instagram.com/g__tree_/"
              className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
            >
              <FaInstagram className="w-5 h-5" />
              <span className="text-sm">보험나무 인스타그램</span>
            </a>
          </div>
        </div>
      </>
    </main>
  );
}
