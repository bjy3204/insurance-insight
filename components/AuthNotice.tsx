"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function AuthNotice({ message, onClose }: { message: string; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-5" onClick={event => event.stopPropagation()} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === "Escape") onClose();
    if (event.key === "Tab") {
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="auth-notice-title" aria-describedby="auth-notice-message" data-popup-small="true" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-4"><h2 id="auth-notice-title" className="text-xl font-black text-gray-900">안내</h2><button type="button" data-mini-close="true" aria-label="안내 닫기" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 cursor-pointer"><X size={19}/></button></div>
      <p id="auth-notice-message" className="mt-2 whitespace-pre-line break-keep text-sm leading-relaxed text-gray-500">{message}</p>
      <div className="mt-6 flex justify-center"><button ref={close} type="button" onClick={onClose} className="h-12 w-32 cursor-pointer rounded-2xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">확인</button></div>
    </section>
  </div>;
}
