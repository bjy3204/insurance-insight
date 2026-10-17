"use client";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import HeaderUtilityItems from "@/app/components/HeaderUtilityItems";

export default function PolicyInsertsTools({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={root} className={`relative z-50 ${className}`}><button data-icon-only="true" type="button" data-header-control="true" aria-label="도구 메뉴" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><LayoutGrid size={24}/></button>{open && <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg"><button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event("open-memo-manager")); }} className="block w-full cursor-pointer px-4 py-3 text-center text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-600">메모장</button><HeaderUtilityItems onClose={() => setOpen(false)}/></div>}</div>;
}
