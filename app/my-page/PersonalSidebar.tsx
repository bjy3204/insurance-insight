"use client";

import { useEffect } from "react";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import PlantSVG, { type PlantStage } from "./PlantSVG";
import { X, Menu, Home, SlidersHorizontal, ChevronDown, type LucideIcon } from "lucide-react";

type Item = { id: string; label: string; icon: LucideIcon };
type Shortcut = { id: string; label: string; icon: LucideIcon; onClick: () => void };

export default function PersonalSidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileClose, activeTab, tabs, onSelect, shortcuts, onSettings, nickname, plantStage, onPlantOpen }: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onPlantOpen: () => void;
  nickname: string;
  plantStage: PlantStage;
  mobileOpen: boolean;
  onMobileClose: () => void;
  activeTab: string;
  tabs: Item[];
  onSelect: (id: string) => void;
  shortcuts: Shortcut[];
  onSettings: () => void;
}) {
  useEffect(() => { if (!mobileOpen) return; const unlock = lockPageScroll(); const key = (event: KeyboardEvent) => { if (event.key === "Escape") onMobileClose(); }; document.addEventListener("keydown", key); return () => { unlock(); document.removeEventListener("keydown", key); }; }, [mobileOpen, onMobileClose]);
  const nav = (expanded: boolean, mobile = false) => {
    const itemClass = (selected = false) => `flex min-h-11 w-full items-center rounded-xl text-sm font-semibold transition cursor-pointer ${expanded ? "gap-3 px-3" : "justify-center"} ${selected ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`;
    return <nav className="py-3">
      <div className="px-2 pb-3">
        <div className="flex items-center gap-1">
          <button aria-label={expanded ? "메뉴 접기" : "메뉴 펼치기"} aria-expanded={expanded} onClick={() => mobile ? onMobileClose() : onCollapsedChange(!collapsed)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 cursor-pointer"><Menu className="h-5 w-5" /></button>
          {expanded && <div className="flex min-w-0 items-center gap-2" title={nickname}><button type="button" onClick={onPlantOpen} title="내 식물 물주기" aria-label="내 식물 물주기 열기" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-amber-50 transition cursor-pointer"><PlantSVG stage={plantStage} size={32} compact /></button><span className="truncate text-sm font-bold text-gray-800 cursor-default">{nickname}</span></div>}
        </div>
        <div className="mt-3"><button title="홈" aria-label="홈" onClick={() => onSelect("home")} className={itemClass(activeTab === "home")}><Home className="h-5 w-5 shrink-0" />{expanded && "홈"}</button></div>
      </div>
      {[{ title: "일정·기록", ids: ["calendar", "memo", "diary"] }, { title: "고객·소통", ids: ["customer", "ai", "notice"] }].map(group => {
        const items = group.ids.map(id => tabs.find(tab => tab.id === id)).filter((tab): tab is Item => !!tab);
        const buttons = items.map(tab => <button key={tab.id} title={tab.label} aria-label={tab.label} onClick={() => onSelect(tab.id)} className={itemClass(activeTab === tab.id)}><tab.icon className="h-5 w-5 shrink-0" />{expanded && tab.label}</button>);
        return expanded ? <details open key={group.title} className="group border-t border-gray-100 px-2 py-3"><summary className="flex w-full list-none items-center justify-between px-1 pb-2 text-xs font-semibold text-gray-500 cursor-pointer [&::-webkit-details-marker]:hidden">{group.title}<ChevronDown className="h-4 w-4 shrink-0 -rotate-90 group-open:rotate-0 transition-transform" /></summary>{buttons}</details> : <section key={group.title} className="border-t border-gray-100 px-2 py-3">{buttons}</section>;
      })}
      {expanded ? <details open className="group border-t border-gray-100 px-2 py-3"><summary className="flex list-none items-center justify-between px-1 pb-2 text-xs font-semibold text-gray-500 cursor-pointer [&::-webkit-details-marker]:hidden">바로가기<ChevronDown className="h-4 w-4 -rotate-90 group-open:rotate-0 transition-transform" /></summary>{shortcuts.map(link => <button key={link.id} title={link.label} aria-label={link.label} onClick={link.onClick} className={itemClass()}><link.icon className="h-5 w-5 shrink-0" />{link.label !== "바로가기 추가" && <span className="truncate">{link.label}</span>}</button>)}</details> : <section className="border-t border-gray-100 px-2 py-3">{shortcuts.map(link => <button key={link.id} title={link.label} aria-label={link.label} onClick={link.onClick} className={itemClass()}><link.icon className="h-5 w-5" /></button>)}</section>}
      <section className="border-t border-gray-100 px-2 py-3">
        {expanded && <h2 className="px-1 pb-2 text-xs font-semibold text-gray-500">설정</h2>}
        <button title="개인설정" aria-label="개인설정" onClick={onSettings} className={itemClass(activeTab === "settings")}><SlidersHorizontal className="h-5 w-5 shrink-0" />{expanded && "개인설정"}</button>
      </section>
    </nav>;
  };
  return <>
    <aside aria-label="개인공간 메뉴" className={`fixed top-[79px] bottom-0 left-0 z-40 hidden overflow-y-auto border-r border-gray-200 bg-white md:block ${collapsed ? "w-16" : "w-60 shadow-xl"}`}>{nav(!collapsed)}</aside>
    {mobileOpen && <>
      <button aria-label="메뉴 닫기" onClick={onMobileClose} className="fixed inset-0 z-[5000] bg-black/40 md:hidden" />
      <aside role="dialog" aria-modal="true" aria-label="개인공간 모바일 메뉴" className="fixed inset-y-0 right-0 z-[5001] w-[84vw] max-w-[360px] overflow-y-auto bg-slate-50 shadow-xl md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 px-5 py-5 bg-white border-b border-gray-100"><div className="min-w-0"><p className="text-xs text-slate-500 mb-1 truncate">{nickname}님의 공간</p><h2 className="text-lg font-bold text-gray-900">개인공간 메뉴</h2></div><button type="button" aria-label="메뉴 닫기" onClick={onMobileClose} className="p-2 text-gray-700 cursor-pointer"><X className="w-6 h-6" /></button></div>
        <nav className="px-5 pt-5 pb-8 space-y-6">
          <button type="button" onClick={() => { onSelect("home"); onMobileClose(); }} className={`flex items-center gap-3 w-full p-4 rounded-2xl border text-sm font-semibold cursor-pointer ${activeTab === "home" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}><Home className="w-5 h-5" />개인공간 홈</button>
          {[{ title: "일정·기록", ids: ["calendar", "memo", "diary"] }, { title: "고객·소통", ids: ["customer", "ai", "notice"] }].map(group => <section key={group.title}><h3 className="text-xs font-semibold text-slate-500 mb-3">{group.title}</h3><div className="grid grid-cols-2 gap-2.5">{group.ids.map(id => { const tab = tabs.find(item => item.id === id); return tab && <button type="button" key={id} aria-current={activeTab === id ? "page" : undefined} onClick={() => { onSelect(id); onMobileClose(); }} className={`flex flex-col items-start gap-3 min-h-[92px] p-4 rounded-2xl border text-sm font-semibold cursor-pointer ${activeTab === id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}><tab.icon className="w-5 h-5" />{tab.label}</button>; })}</div></section>)}
          <section><h3 className="text-xs font-semibold text-slate-500 mb-3">바로가기</h3><div className="grid grid-cols-2 gap-2.5">{shortcuts.map(link => <button type="button" key={link.id} onClick={() => { link.onClick(); onMobileClose(); }} className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-white border border-gray-200 text-xs text-gray-600 cursor-pointer"><link.icon className="w-4 h-4 shrink-0" /><span className="break-words">{link.label}</span></button>)}</div></section>
          <button type="button" onClick={() => { onSettings(); onMobileClose(); }} className={`flex items-center gap-3 w-full p-4 rounded-2xl border text-sm font-semibold cursor-pointer ${activeTab === "settings" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}><SlidersHorizontal className="w-5 h-5" />개인설정</button>
        </nav>
      </aside>
    </>}
  </>;
}
