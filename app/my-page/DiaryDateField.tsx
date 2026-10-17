"use client";
import MiniCalendar from "@/app/components/MiniCalendar";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "@/app/components/calendar/CalendarEventModal.module.css";

export default function DiaryDateField({ value, onChange, label = "일기 날짜 선택", disabled = false }: { value: string; onChange: (value: string) => void; label?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(value + "T12:00:00") : new Date());
  const year = month.getFullYear(), index = month.getMonth();
  const first = new Date(year, index, 1).getDay(), count = new Date(year, index + 1, 0).getDate();
  return <div className={styles.relative} onKeyDown={event => { if(event.key === "Escape") { event.stopPropagation(); setOpen(false); } }}>
    <button type="button" disabled={disabled} onClick={() => { setMonth(value ? new Date(value + "T12:00:00") : new Date()); setOpen(!open); }} className="h-11 w-full border border-gray-200 rounded-xl px-4 text-sm flex items-center gap-2 cursor-pointer" aria-expanded={open} aria-label={label}><CalendarDays size={16} className="text-gray-400" />{value || "날짜 선택"}</button>
    {open && <><button type="button" className={styles.dismiss} aria-label="날짜 선택 닫기" onClick={() => setOpen(false)} /><MiniCalendar value={value} disabled={disabled} onChange={onChange} onClose={()=>setOpen(false)} /></>}
  </div>;
}
