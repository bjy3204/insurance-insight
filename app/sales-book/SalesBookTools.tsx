"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import HeaderUtilityItems from "@/app/components/HeaderUtilityItems";

export default function SalesBookTools() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return <div ref={root} className="absolute right-0 z-50">
    <button type="button" data-header-control="true" aria-label="도구" aria-expanded={open}
      onClick={() => setOpen(value => !value)} className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center">
      <LayoutGrid className="w-5 h-5 text-slate-700" />
    </button>
    {open && <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-blue-100 bg-white shadow-lg overflow-hidden">
      <HeaderUtilityItems onClose={() => setOpen(false)} />
    </div>}
  </div>;
}
