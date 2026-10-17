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
  return createPortal(<div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} data-popup-small="true" data-account-inputs="true" data-personal-focus="blue" data-popup-resize="false" className="personal-settings-dialog flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-xl" style={{ maxHeight:"calc(100dvh - 32px)", minHeight:0 }} onClick={event => event.stopPropagation()}>
      <header className="mb-5 flex shrink-0 items-center justify-between"><h2 data-popup-heading="true" id={id} className="text-lg font-bold text-gray-900">{title}</h2><button data-icon-only="true" data-popup-close="true" type="button" aria-label={`${title} 닫기`} onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><X size={16}/></button></header>
      <div className="min-h-0 overflow-y-auto">{children}</div>
    </div>
  </div>, document.body);
}
