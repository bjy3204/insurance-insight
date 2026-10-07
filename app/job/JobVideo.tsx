"use client";
import { useRef, useState } from "react";
import { Play, X } from "lucide-react";
export default function JobVideo() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"left" | "right">("left");
  const [point, setPoint] = useState({ x: 20, y: 120 });
  const drag = useRef<{ sx: number; sy: number; x: number; y: number; width: number; height: number } | null>(null);
  const collapse = () => { setOpen(false); drag.current = null; };
  if (!open) return <button type="button" aria-label="이직컨설팅 영상 열기" onClick={() => { setPoint({ x: side === "left" ? 20 : Math.max(16, window.innerWidth - 380), y: Math.min(point.y, Math.max(80, window.innerHeight - 320)) }); setOpen(true); }} className={`fixed z-[1400] bottom-28 flex items-center gap-2 bg-blue-600 text-white px-3 py-3 text-xs font-semibold shadow-md cursor-pointer ${side === "left" ? "left-0 rounded-r-xl" : "right-0 rounded-l-xl"}`}><Play size={14} fill="currentColor"/>영상</button>;
  return <section aria-label="이직컨설팅 미니 영상" className="fixed z-[1400] w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" style={{ left: point.x, top: point.y }}>
    <div className="flex items-center justify-between px-4 py-3 select-none touch-none cursor-move" onPointerDown={e => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      const rect = e.currentTarget.parentElement!.getBoundingClientRect();
      drag.current = { sx: e.clientX, sy: e.clientY, x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e => {
      const d = drag.current; if (!d) return;
      setPoint({ x: Math.max(0, Math.min(window.innerWidth - d.width, d.x + e.clientX - d.sx)), y: Math.max(0, Math.min(window.innerHeight - d.height - 72, d.y + e.clientY - d.sy)) });
    }} onPointerUp={e => {
      const d = drag.current; if (!d) return;
      const x = d.x + e.clientX - d.sx;
      if (x <= 16 || x + d.width >= window.innerWidth - 16) { setSide(x <= 16 ? "left" : "right"); collapse(); }
      drag.current = null;
    }} onPointerCancel={() => { drag.current = null; }}>
      <h2 className="text-sm font-bold text-slate-800">이직컨설팅 영상</h2><button type="button" aria-label="영상 접기" onClick={collapse} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"><X size={18}/></button>
    </div>
    <iframe src="https://www.youtube.com/embed/2264CwLZRb4" title="이직컨설팅 영상" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full aspect-video border-0"/>
  </section>;
}
