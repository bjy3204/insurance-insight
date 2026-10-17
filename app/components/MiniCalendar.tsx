"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FloatingDatePanel from "./FloatingDatePanel";
import styles from "./MiniCalendar.module.css";

export default function MiniCalendar({ value, onChange, onClose, disabled = false }: { value: string; onChange: (date: string) => void; onClose: () => void; disabled?: boolean }) {
  const [month, setMonth] = useState(() => {
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const content = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!content.current?.contains(event.target as Node)) close.current(); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); close.current(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard, true);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keyboard, true); };
  }, []);
  const year = month.getFullYear(), index = month.getMonth();
  const first = new Date(year, index, 1).getDay(), count = new Date(year, index + 1, 0).getDate();
  const rows = Math.ceil((first + count) / 7);
  return <FloatingDatePanel width={284} gap={5} className={styles.panel}>
    <div ref={content} className={styles.content} role="group" aria-label="날짜 선택">
      <div className={styles.header}>
        <button type="button" data-prev-next="true" aria-label="이전 달" disabled={disabled} onClick={() => setMonth(new Date(year, index - 1, 1))}><ChevronLeft size={18} data-arrow-size="18" /></button>
        <strong aria-live="polite">{year}년 {index + 1}월</strong>
        <button type="button" data-prev-next="true" aria-label="다음 달" disabled={disabled} onClick={() => setMonth(new Date(year, index + 1, 1))}><ChevronRight size={18} data-arrow-size="18" /></button>
      </div>
      <div className={styles.days} style={{ gridTemplateRows: `repeat(${rows + 1}, minmax(0, 1fr))` }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => <span key={day} data-weekday={i}>{day}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={`empty-${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const day = i + 1, date = `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return <button key={date} type="button" disabled={disabled} aria-label={date} aria-pressed={date === value} onClick={() => { onChange(date); onClose(); }}>{day}</button>;
        })}
      </div>
    </div>
  </FloatingDatePanel>;
}
