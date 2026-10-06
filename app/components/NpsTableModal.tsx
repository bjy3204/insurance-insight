"use client";

import { useRef, useState, type PointerEvent } from 'react';
import { FileText, Search, X } from 'lucide-react';
import npsTables from '@/app/pension-calculator/data/nps-tables.json';
import type { NpsTables } from '@/lib/nps-table-types';

const tabs = {
  노령연금: {key:'oldAge', columns:[['year10','10년'],['year15','15년'],['year20','20년'],['year25','25년'],['year30','30년'],['year35','35년'],['year40','40년']]},
  장애연금: {key:'disability', columns:[['grade1','장애1급'],['grade2','장애2급'],['grade3','장애3급'],['grade4Lump','장애4급']]},
  유족연금: {key:'survivor', columns:[['under10','10년 미만'],['between10And20','10~20년'],['year20','20년 이상']]},
} as const;
type Tab = keyof typeof tabs;

// Both the home page and pension calculator render this same dialog.
export default function NpsTableModal({onClose}:{onClose:()=>void}) {
  const tables = npsTables as NpsTables;
  const [tab,setTab]=useState<Tab>('노령연금');
  const [search,setSearch]=useState('');
  const [position,setPosition]=useState({x:0,y:0});
  const drag=useRef<{x:number;y:number;originX:number;originY:number}|null>(null);
  const columns=[['no','번호'],['income','기준소득월액'],['premium','보험료'],...tabs[tab].columns];
  const rows=tables[tabs[tab].key].filter(row=>!search||String(row.income).includes(search)||String(row.premium).includes(search));
  function startDrag(event:PointerEvent<HTMLDivElement>) {
    if(window.innerWidth<768 || event.button!==0) return;
    drag.current={x:event.clientX,y:event.clientY,originX:position.x,originY:position.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  return <div onClick={onClose} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div data-popup-frame="true" onClick={event=>event.stopPropagation()} style={{transform:`translate(${position.x}px, ${position.y}px)`}} className="cursor-default bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col">
      <div onPointerDown={startDrag} onPointerMove={event=>{const current=drag.current;if(current)setPosition({x:current.originX+event.clientX-current.x,y:current.originY+event.clientY-current.y});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between touch-none">
        <div className="font-bold flex items-center gap-2"><FileText className="w-5 h-5"/>국민연금표</div>
        <button type="button" data-popup-close="true" aria-label="닫기" onPointerDown={event=>event.stopPropagation()} onClick={onClose} className="cursor-pointer w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition"><X className="w-5 h-5"/></button>
      </div>
      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <div data-tab-group="true" className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-5">{(Object.keys(tabs) as Tab[]).map(item=><button key={item} type="button" onClick={()=>{setTab(item);setSearch('');}} className={`cursor-pointer rounded-xl py-3 text-sm font-bold transition ${tab===item?'bg-white text-blue-600 shadow-sm':'text-gray-600'}`}>{item}</button>)}</div>
        <div className="relative mb-4"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input aria-label="보험료 또는 기준소득월액 검색" value={search?Number(search).toLocaleString():''} onChange={event=>setSearch(event.target.value.replace(/[^0-9]/g,''))} placeholder="보험료 또는 기준소득월액 검색" className="cursor-text w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none"/></div>
        <div className="overflow-auto flex-1 border border-gray-200 rounded-2xl">
          <table className="cursor-default w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-gray-500 sticky top-0 z-10"><tr>{columns.map(([key,label])=><th key={key} className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.no} className="hover:bg-gray-50">{columns.map(([key])=><td key={key} className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">{(row as unknown as Record<string,number>)[key].toLocaleString()}</td>)}</tr>)}</tbody></table>
          {!rows.length&&<div className="text-center text-sm text-gray-400 py-10">검색 결과가 없습니다</div>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mt-4 px-1">본 표는 {tables.effectiveMonth.replace('-','년 ')}월 국민연금 예상연금월액표 기준이며, 실제 수령액은 가입이력 · 재평가율 · 연금개시연령 · 부양가족연금액 및 제도 변경 등에 따라 달라질 수 있습니다. (단위 :원) <a href={tables.sourceUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer underline">국민연금공단 원문</a></p>
      </div>
    </div>
  </div>;
}
