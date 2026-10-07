"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { lockPageScroll } from "./dashboard/DashboardDialog";
import type { HomeController } from "../hooks/useHomeController";

export default function MobileHeaderMenu({ controller }: { controller: HomeController }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const unlock = lockPageScroll();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const resize = () => { if (window.innerWidth >= 768) setOpen(false); };
    document.addEventListener("keydown", key); window.addEventListener("resize", resize);
    return () => { unlock(); document.removeEventListener("keydown", key); window.removeEventListener("resize", resize); };
  }, [open]);
  const install = async () => {
    if (controller.deferredPrompt) {
      controller.deferredPrompt.prompt();
      const result = await controller.deferredPrompt.userChoice;
      if (result.outcome === "accepted") { controller.setShowInstall(false); controller.setDeferredPrompt(null); }
      return;
    }
    window.alert("홈 화면에 추가 후 앱처럼 사용하세요!\n\n아이폰: 사파리 공유 버튼 → 홈 화면에 추가\n안드로이드: 크롬 메뉴 → 앱 설치 또는 홈 화면에 추가");
  };
  const quick = (key: string) => () => controller.quickMenuOptions.find(item => item.key === key)?.action();
  const groups = [
    { title: "일정·기록", items: [{ label: "메모장", action: () => window.dispatchEvent(new CustomEvent("open-memo-manager")) }, { label: "캘린더", action: () => { window.location.href = "/calendar"; } }] },
    { title: "업무 자료", items: [...(controller.authStatus === "approved" ? [{ label: "구독자료", action: () => controller.setResourceOpen(true) }] : []), { label: "병원정보검색", action: quick("hospital") }, { label: "상병코드검색", action: quick("disease") }, { label: "국민연금표", action: quick("nps") }, { label: "보도자료", action: quick("press") }] },
    { title: "계산·금융", items: [{ label: "계산기", action: quick("calculator") }, { label: "환율변환기", action: quick("currencyConverter") }, { label: "예금금리비교", action: quick("bankRate") }, { label: "기대수명 계산기", action: quick("life") }] },
    { title: "뉴스", items: [{ label: "오늘의 뉴스", action: () => { window.location.href = "/today-news"; } }] },
  ];
  return <><button type="button" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 cursor-pointer md:hidden"><Menu className="w-6 h-6" /></button>{open && createPortal(<div className="fixed inset-0 z-[5000] md:hidden"><button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" /><aside role="dialog" aria-modal="true" aria-label="모바일 메뉴" className="absolute inset-y-0 right-0 w-[74vw] max-w-[340px] bg-white overflow-y-auto shadow-xl flex flex-col pb-[env(safe-area-inset-bottom)]"><div className="flex justify-end px-6 pt-5"><button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="p-2 text-gray-700 cursor-pointer"><X className="w-6 h-6" /></button></div><nav className="px-6 pt-5 pb-6 flex-1">{groups.map(group => <section key={group.title} className="mb-7 last:mb-0"><h2 className="text-base font-semibold text-gray-700 mb-3">{group.title}</h2><div className="border-l border-gray-200 pl-6">{group.items.map(item => <button type="button" key={item.label} onClick={() => { setOpen(false); item.action(); }} className="block w-full text-left py-2.5 text-sm text-gray-500 hover:text-blue-600 cursor-pointer">{item.label}</button>)}</div></section>)}</nav><div className="mx-6 border-t border-gray-100 py-5 flex justify-around text-center"><div><p className="text-[10px] font-bold text-gray-400">TODAY</p><p className="text-sm font-black text-blue-600 mt-1">{controller.today.toLocaleString()}</p></div><div><p className="text-[10px] font-bold text-gray-400">TOTAL</p><p className="text-sm font-black text-gray-900 mt-1">{controller.total.toLocaleString()}</p></div></div><div className="px-6 pb-6"><button type="button" onClick={install} className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">앱처럼 사용하기</button></div></aside></div>, document.body)}</>;
}
