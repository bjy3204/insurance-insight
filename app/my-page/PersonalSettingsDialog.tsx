"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";

export default function PersonalSettingsDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const id = useId(), panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();
    const controls = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (document.querySelector('[role="alertdialog"]')) return;
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const list = controls();
      if (event.shiftKey && document.activeElement === list[0]) { event.preventDefault(); list.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === list.at(-1)) { event.preventDefault(); list[0]?.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => {
      unlock(); document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>('[data-header-control="true"][aria-label="설정"]')?.focus();
    };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-3 md:p-5" onClick={onClose}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} data-popup-frame="true" data-popup-resize="false" className="personal-settings-dialog flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight:"calc(100dvh - 40px)", minHeight:0 }} onClick={event => event.stopPropagation()}>
      <header data-popup-header="true" className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3"><h2 id={id} className="text-lg font-bold text-slate-900">{title}</h2><button data-popup-close="true" type="button" aria-label={`${title} 닫기`} onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"><X size={20}/></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  </div>, document.body);
}
