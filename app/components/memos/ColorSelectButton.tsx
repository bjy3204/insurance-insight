"use client";
import { useEffect, useRef, useState } from "react";
import DesktopMemoColorPicker from "./DesktopMemoColorPicker";
import MemoColorPicker from "./MemoColorPicker";

export default function ColorSelectButton({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const wrapper = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) { setHeight(0); return; }
    const update = () => setHeight(panel.current?.offsetHeight || 0);
    update();
    const observer = new ResizeObserver(update);
    if (panel.current) observer.observe(panel.current);
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => { observer.disconnect(); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [open]);
  return <div ref={wrapper} className="relative" style={{ paddingBottom: open ? height + 8 : 0 }}><button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen(value => !value)} className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"><span className="w-7 h-7 rounded-full border border-gray-200 shadow-inner shrink-0" style={{ backgroundColor: value }} /><span className="text-xs font-bold text-gray-600">{value}</span></button>{open && <div ref={panel} style={{ width: "min(320px, calc(100vw - 64px))", ...(label.includes("서명") ? { right: 0 } : { left: 0 }) }} className="absolute top-14 z-50 rounded-2xl shadow-xl"><div className="hidden md:block"><DesktopMemoColorPicker value={value} onChange={onChange} onClose={() => setOpen(false)} /></div><div className="md:hidden"><MemoColorPicker value={value} onChange={onChange} onClose={() => setOpen(false)} /></div></div>}</div>;
}
