"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function DiaryDateField({ value, onChange, label = "일기 날짜 선택", disabled = false }: { value: string; onChange: (value: string) => void; label?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(value + "T12:00:00") : new Date());
  const year = month.getFullYear(), index = month.getMonth();
  const first = new Date(year, index, 1).getDay(), count = new Date(year, index + 1, 0).getDate();
  return <><button type="button" disabled={disabled} onClick={() => { setMonth(value ? new Date(value + "T12:00:00") : new Date()); setOpen(true); }} className="h-11 w-full border border-gray-200 rounded-xl px-4 text-sm flex items-center gap-2 cursor-pointer" aria-label={label}><CalendarDays size={16} className="text-gray-400" />{value || "날짜 선택"}</button>
    {open && createPortal(<div className="fixed inset-0 z-[7200] bg-black/10 flex items-center justify-center p-4" onClick={() => setOpen(false)} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } }}><div role="dialog" aria-modal="true" aria-label={label} className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 w-full max-w-[340px]" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between mb-4"><button type="button" onClick={() => setMonth(new Date(year, index - 1, 1))} aria-label="이전 달" className="p-2 cursor-pointer"><ChevronLeft size={16} /></button><strong>{year}년 {index + 1}월</strong><button type="button" onClick={() => setMonth(new Date(year, index + 1, 1))} aria-label="다음 달" className="p-2 cursor-pointer"><ChevronRight size={16} /></button><button type="button" autoFocus onClick={() => setOpen(false)} aria-label="날짜 선택 닫기" className="p-1 cursor-pointer text-gray-400"><X size={16} /></button></div><div className="grid grid-cols-7 gap-y-1 text-center text-sm">{["일", "월", "화", "수", "목", "금", "토"].map((day, i) => <span key={day} className={`py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-400"}`}>{day}</span>)}{Array.from({ length: first }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => { const day = i + 1, date = `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return <button type="button" key={day} onClick={() => { onChange(date); setOpen(false); }} className={`h-9 w-9 mx-auto rounded-xl cursor-pointer ${date === value ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}>{day}</button>; })}</div></div></div>, document.body)}
  </>;
}
