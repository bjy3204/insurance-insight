"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./DashboardCards.module.css";

let scrollLocks = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
export function lockPageScroll() {
  if (scrollLocks++ === 0) { originalBodyOverflow = document.body.style.overflow; originalHtmlOverflow = document.documentElement.style.overflow; document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden"; }
  return () => { if (--scrollLocks === 0) { document.body.style.overflow = originalBodyOverflow; document.documentElement.style.overflow = originalHtmlOverflow; } };
}
export default function DashboardDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
    (panel.current?.querySelector<HTMLElement>("input, textarea, select") || focusable()[0])?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus(); }
      if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0].focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); unlock(); previous?.focus(); };
  }, [onClose]);
  return createPortal(<div className={styles.overlay} onClick={onClose}><div ref={panel} className={styles.dialog} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}><div className={styles.dialogHeader}>{title}<button data-popup-close="true" type="button" className={styles.iconButton} onClick={onClose} aria-label="닫기"><X /></button></div>{children}</div></div>, document.body);
}
