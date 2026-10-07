"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, LayoutGrid, Megaphone, PlusCircle } from "lucide-react";
import CompanyRegistration from "./CompanyRegistration";
import HeaderUtilityItems from "@/app/components/HeaderUtilityItems";
import { SiteFooterFrame } from "@/app/components/SiteFooter";

export function JobHeaderTools() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={ref} className="absolute right-0 top-1/2 -translate-y-1/2 z-[1000]">
    <button data-header-control="true" type="button" aria-label="도구" aria-expanded={open} onClick={() => setOpen(!open)} className="w-10 h-10 border border-gray-200 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 cursor-pointer">
      <LayoutGrid className="w-5 h-5 text-gray-400" />
    </button>
    {open && <div className="absolute right-0 top-12 w-40 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
      <button onClick={() => { setOpen(false); window.dispatchEvent(new Event("open-memo-manager")); }} className="block w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer">메모장</button>
      <HeaderUtilityItems onClose={() => setOpen(false)} />
    </div>}
  </div>;
}

export function JobDetailFooter() {
  const [service, setService] = useState<string | null>(null);
  return <>
    <CompanyRegistration />
    <SiteFooterFrame>
      <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
        <button onClick={() => setService("컨설팅 신청")} className="py-3 flex flex-col items-center gap-1 cursor-pointer"><Briefcase className="w-5 h-5" /><span className="text-sm">컨설팅신청</span></button>
        <button type="button" onClick={() => window.dispatchEvent(new Event("open-company-registration"))} className="py-3 flex flex-col items-center gap-1 cursor-pointer"><PlusCircle className="w-5 h-5" /><span className="text-sm">회사등록</span></button>
        <button onClick={() => setService("배너 신청")} className="py-3 flex flex-col items-center gap-1 cursor-pointer"><Megaphone className="w-5 h-5" /><span className="text-sm">배너신청</span></button>
      </div>
    </SiteFooterFrame>
    {service && <div className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-4" onClick={() => setService(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="job-service-title" className="w-full max-w-sm bg-white rounded-3xl p-6 text-center" onClick={event => event.stopPropagation()}>
        <h2 id="job-service-title" className="text-xl font-bold">서비스 준비중입니다</h2>
        <p className="text-sm text-slate-500 mt-3">{service} 서비스는 현재 준비중입니다.</p>
        <button autoFocus onClick={() => setService(null)} className="mt-6 w-full rounded-2xl bg-gray-900 hover:bg-gray-800 text-white h-[46px] px-4 text-sm font-bold cursor-pointer">확인</button>
      </div>
    </div>}
  </>;
}
