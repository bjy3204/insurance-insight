"use client";

import PlantSVG, { type PlantStage } from "./PlantSVG";
import { Menu, Home, SlidersHorizontal, ChevronDown, type LucideIcon } from "lucide-react";

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
      <button aria-label="메뉴 닫기" onClick={onMobileClose} className="fixed inset-0 top-[81px] z-30 bg-black/20 md:hidden" />
      <aside aria-label="개인공간 모바일 메뉴" className="fixed top-[81px] bottom-0 right-0 z-40 w-60 overflow-y-auto border-l border-gray-200 bg-white shadow-xl md:hidden">{nav(true, true)}</aside>
    </>}
  </>;
}
