"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MembershipStatus from "@/components/MembershipStatus";
import AuthButton from "@/components/AuthButton";
import { Menu, X, NotebookPen, CalendarDays, Newspaper, Settings, Bell, LibraryBig, Hospital, Search, FileSpreadsheet, FileText, Calculator, ArrowLeftRight, Landmark, HeartPulse, type LucideIcon } from "lucide-react";
import { lockPageScroll } from "./dashboard/DashboardDialog";
import { noticeVersion } from "@/app/notice/notices";
import type { HomeController } from "../hooks/useHomeController";

export default function MobileHeaderMenu({ controller }: { controller: HomeController }) {
  const [open, setOpen] = useState(false);
  const [behindPopup,setBehindPopup]=useState(false);
  useEffect(() => {
    if (!open) return;
    const unlock = lockPageScroll();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { const popupVisible = Array.from(document.querySelectorAll<HTMLElement>('[data-popup-frame="true"],[data-popup-small="true"],[role="dialog"]')).some(panel => !panel.closest('[data-mobile-menu-panel="true"]') && panel.getClientRects().length > 0); if (!popupVisible) setOpen(false); } };
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
    { title: "일정·기록", items: [{ label: "메모장", action: () => window.dispatchEvent(new CustomEvent("open-memo-manager")) }, { label: "캘린더", action: () => { window.location.assign("/calendar"); } }] },
    { title: "업무 자료", items: [...(controller.authStatus === "approved" ? [{ label: "구독자료", action: () => controller.setResourceOpen(true) }] : []), { label: "병원정보검색", action: quick("hospital") }, { label: "상병코드검색", action: quick("disease") }, { label: "국민연금표", action: quick("nps") }, { label: "보도자료", action: quick("press") }] },
    { title: "계산·금융", items: [{ label: "계산기", action: quick("calculator") }, { label: "환율변환기", action: quick("currencyConverter") }, { label: "예금금리비교", action: quick("bankRate") }, { label: "기대수명 계산기", action: quick("life") }] },
    { title: "소식·설정", items: [
      { label: "오늘의 뉴스", action: () => { window.location.assign("/today-news"); } },
      { label: "메뉴 변경", action: () => {
        controller.setTempMenus(controller.menus);
        controller.setTempPersonalMenus(controller.personalMenus);
        controller.setTempQuickMenuKeys(controller.quickMenuKeys);
        controller.setTempHiddenMenuIds(controller.hiddenMenuIds);
        controller.setSelectedPersonalMenuId("");
        controller.setEditIconOpen(false);
        controller.setMenuManageMode("sort");
        controller.resetPopupPosition("menuSort");
        controller.setMenuSortOpen(true);
        controller.setMemoOpen(false);
        controller.setMenuAddOpen(false);
      } },
      { label: "공지사항", action: () => {
        localStorage.setItem("noticeRead", noticeVersion.toString());
        localStorage.setItem("seen_db_notice_ids", JSON.stringify(controller.dbNotices.map(item => item.id)));
        controller.setHasUpdate(false);
        controller.setSelectedNotice(null);
        controller.resetPopupPosition("notice");
        controller.setNoticeOpen(true);
      } },
    ] },
  ];
  const newsSettings = groups.find(group => group.title === "소식·설정")!;
  const mobileGroups = [groups[0], {title:"소식",items:newsSettings.items.filter(item=>item.label!=="메뉴 변경")}, groups[1], groups[2]];
  const menuIcons: Record<string,LucideIcon> = {"메모장":NotebookPen,"캘린더":CalendarDays,"오늘의 뉴스":Newspaper,"공지사항":Bell,"메뉴 변경":Settings,"구독자료":LibraryBig,"병원정보검색":Hospital,"상병코드검색":Search,"국민연금표":FileSpreadsheet,"보도자료":FileText,"계산기":Calculator,"환율변환기":ArrowLeftRight,"예금금리비교":Landmark,"기대수명 계산기":HeartPulse};
  return <><button type="button" aria-label="메뉴 열기" aria-expanded={open} onClick={() => {setBehindPopup(false);setOpen(true);}} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 cursor-pointer md:hidden"><Menu className="w-6 h-6" /></button>{open && createPortal(<div style={{zIndex:behindPopup?40:5000}} className="fixed inset-0 z-[5000] md:hidden"><button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" /><aside data-mobile-menu-panel="true" role="dialog" aria-modal="true" aria-label="모바일 메뉴" className="absolute inset-y-0 right-0 w-[calc(100vw-24px)] max-w-[340px] bg-slate-50 overflow-y-auto shadow-xl flex flex-col pb-[env(safe-area-inset-bottom)]"><div data-mobile-menu-account="true" className="grid grid-cols-3 items-center gap-2 px-4 pt-14"><AuthButton variant="compact" user={controller.authUser} onAuthChange={controller.refreshAuth} onMenuClose={() => setOpen(false)} />{controller.authUser && <button type="button" onClick={() => {controller.setEditNickname(controller.authNickname || "");controller.setEditInstagram(controller.authInstagram || "");controller.setCurrentPassword("");controller.setNewPassword("");controller.setNewPasswordConfirm("");controller.setProfileSettingOpen(true);setBehindPopup(true);}} className="px-3 h-9 border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">계정설정</button>}{controller.authUser && <MembershipStatus status={controller.authStatus} rectangular />}<div data-mobile-menu-tools="true" className="absolute right-3 flex items-center gap-1"><button type="button" aria-label="메뉴 변경" title="메뉴 변경" onClick={() => { setBehindPopup(true); newsSettings.items.find(item => item.label === "메뉴 변경")?.action(); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 cursor-pointer"><Settings size={20}/></button><button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 cursor-pointer"><X size={20}/></button></div></div><nav className="px-5 pt-2 pb-6 flex-1">{mobileGroups.map(group => <section key={group.title} className="mb-5 last:mb-0"><h2 className="text-sm font-semibold text-slate-500 mb-3">{group.title}</h2><div className="grid grid-cols-2 gap-2.5">{group.items.map(item => { const Icon = menuIcons[item.label]; return <button type="button" key={item.label} onClick={() => { if (["캘린더","오늘의 뉴스"].includes(item.label)) setOpen(false); else setBehindPopup(true); item.action(); }} className="flex min-h-[92px] min-w-0 flex-col items-start justify-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer">{Icon&&<Icon size={20} className="shrink-0"/>}<span>{item.label}</span></button>;})}</div></section>)}</nav><div className="mx-6 border-t border-gray-100 py-5 flex justify-around text-center"><div><p className="text-[10px] font-bold text-gray-400">TODAY</p><p className="text-sm font-black text-blue-600 mt-1">{controller.today.toLocaleString()}</p></div><div><p className="text-[10px] font-bold text-gray-400">TOTAL</p><p className="text-sm font-black text-gray-900 mt-1">{controller.total.toLocaleString()}</p></div></div><div className="px-6 pb-6"><button data-mobile-install="true" type="button" onClick={install} className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">앱처럼 사용하기</button></div></aside></div>, document.body)}</>;
}
