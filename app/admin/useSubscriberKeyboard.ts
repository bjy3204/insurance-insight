"use client";
import { useEffect, useRef } from "react";

export function subscriberShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "altKey" | "code" | "key" | "repeat" | "isComposing">, count: number) {
  if (event.repeat || event.isComposing || !event.ctrlKey || !event.shiftKey || event.altKey) return null;
  if (event.code === "Space") return count === 1 ? "check-one" : "ignore";
  if (event.key === "+" || event.code === "Equal" || event.code === "NumpadAdd") return "new";
  return null;
}

export default function useSubscriberKeyboard(options: { open: boolean; blocked: boolean; editorOpen: boolean; editorId: string; count: number; newSubscriber: () => void; checkOnly: () => Promise<void> }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const checkedRow = useRef<HTMLElement | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const search = () => { checkedRow.current = null; searchRef.current?.focus(); searchRef.current?.select(); };
  useEffect(() => {
    if (options.editorOpen) editorRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    else if (options.open) search();
  }, [options.open, options.editorOpen, options.editorId]);
  useEffect(() => {
    if (!options.open) return;
    const handle = (event: KeyboardEvent) => {
      const current = latest.current;
      if (event.isComposing || current.blocked) return;
      if (current.editorOpen && event.ctrlKey && event.shiftKey && (event.code === "Equal" || event.code === "NumpadAdd" || event.code === "Space")) { event.preventDefault(); return; }
      if (current.editorOpen) {
        if (event.key === "Escape") { event.preventDefault(); editorRef.current?.querySelector<HTMLButtonElement>("[data-popup-close]")?.click(); }
        return;
      }
      const intent = subscriberShortcut(event, current.count);
      if (intent) {
        event.preventDefault(); event.stopPropagation();
        if (intent === "new") current.newSubscriber();
        if (intent === "check-one") void current.checkOnly().then(search);
        return;
      }
      const target = event.target instanceof HTMLElement ? event.target : null;
      const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-subscriber-row]") || []);
      if (target === searchRef.current) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (event.key === "ArrowDown") rows[0]?.querySelector<HTMLButtonElement>("[data-subscriber-action='check']")?.focus();
          else search();
        }
        return;
      }
      const row = target?.closest<HTMLElement>("[data-subscriber-row]");
      if (!row || !listRef.current?.contains(row)) return;
      const rowIndex = rows.indexOf(row);
      const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("[data-subscriber-action]"));
      const button = target?.closest<HTMLButtonElement>("[data-subscriber-action]");
      const column = Math.max(0, buttons.indexOf(button!));
      if (event.key === "Escape") { event.preventDefault(); search(); return; }
      if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowUp" && (rowIndex === 0 || checkedRow.current === row)) { search(); return; }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          checkedRow.current = null;
          const next = rows[Math.max(0, Math.min(rows.length - 1, rowIndex + (event.key === "ArrowDown" ? 1 : -1)))];
          next?.querySelectorAll<HTMLButtonElement>("[data-subscriber-action]")[column]?.focus();
        } else buttons[Math.max(0, Math.min(buttons.length - 1, column + (event.key === "ArrowRight" ? 1 : -1)))]?.focus();
      }
      if (event.code === "Space" && button) {
        event.preventDefault();
        if (event.repeat) return;
        if (button.dataset.subscriberAction === "check") checkedRow.current = row;
        if (button.dataset.subscriberAction === "status" && !window.confirm(`${row.dataset.subscriberName || "선택한 구독자"}의 ${button.textContent?.trim()} 처리를 진행할까요?`)) return;
        button.click();
      }
    };
    document.addEventListener("keydown", handle, true);
    return () => document.removeEventListener("keydown", handle, true);
  }, [options.open]);
  return { searchRef, listRef, editorRef, markChecked: (row: HTMLElement | null) => { checkedRow.current = row; } };
}
