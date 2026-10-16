"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import styles from "./CustomerEntryDialog.module.css";

export default function CustomerFormSelect({ label, value, options, onChange, onAdd, onRemove, disabled }: {
  label: string; value: string; options: readonly string[]; onChange: (value: string) => void;
  onAdd: (value: string) => Promise<boolean>; onRemove: (value: string) => Promise<boolean>; disabled: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(-1);
  const dirty = useRef(false);
  const committing = useRef(false);
  const currentValue = useRef(value); currentValue.current = value;
  const custom = value.trim();
  const canAdd = !!custom && !options.includes(custom);
  const commit = async () => {
    if (!dirty.current || !canAdd || disabled || committing.current) return;
    committing.current = true;
    try {
      if (await onAdd(custom)) {
        if (currentValue.current.trim() === custom) { dirty.current = false; onChange(custom); }
        close();
      }
    } finally { committing.current = false; }
  };
  const choose = (option: string) => { dirty.current = false; onChange(option); close(); input.current?.focus(); };
  const choices = options.filter(option => option.toLowerCase().includes(search.toLowerCase()));
  const close = () => { setPosition(null); setSearch(""); };
  const open = (query = "") => {
    const rect = root.current!.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom - 12;
    const height = Math.min(244, Math.max(96, availableBelow >= 150 ? availableBelow : rect.top - 12));
    setPosition({ top: availableBelow >= 150 ? rect.bottom + 4 : Math.max(8, rect.top - height - 4), left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width, maxHeight: height });
    setSearch(query);
    setIndex(-1);
  };
  useEffect(() => {
    if (!position) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close(); };
    const layout = (event: Event) => { if (!menu.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", layout, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", layout); window.removeEventListener("scroll", layout, true); };
  }, [position]);
  useEffect(() => { menu.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [index]);
  return <div ref={root} className={styles.select}>
    <input ref={input} role="combobox" aria-label={label} aria-expanded={!!position} aria-controls={position ? id : undefined} aria-autocomplete="list" aria-activedescendant={position && choices[index] ? `${id}-${index}` : undefined}
      readOnly={disabled} aria-disabled={disabled} maxLength={80} value={value} placeholder="선택 또는 직접 입력" autoComplete="off"
      onChange={event => { dirty.current = true; onChange(event.target.value); open(event.target.value); }}
      onBlur={event => { if (!menu.current?.contains(event.relatedTarget as Node) && !root.current?.contains(event.relatedTarget as Node)) { void commit(); close(); } }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape" && position) { event.stopPropagation(); close(); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (!position) open(); else setIndex(current => choices.length ? current < 0 ? event.key === "ArrowDown" ? 0 : choices.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length : 0); }
        if (event.key === "Enter") { event.preventDefault(); if (position && choices[index]) choose(choices[index]); else { void commit(); } }
        if (event.key === "Tab") { void commit(); close(); }
      }} />
    <button type="button" disabled={disabled} aria-label={`${label} 목록`} aria-haspopup="listbox" aria-expanded={!!position} onClick={() => { if (position) close(); else open(); input.current?.focus(); }}><ChevronDown size={16} /></button>
    {position && createPortal(<div ref={menu} id={id} role="listbox" aria-label={label} className={styles.options} style={position}>
      {choices.map((option, optionIndex) => <div className={styles.optionRow} key={option} role="presentation">
        <button type="button" tabIndex={-1} id={`${id}-${optionIndex}`} role="option" aria-selected={option === value} data-active={optionIndex === index} onPointerDown={event => event.preventDefault()} onMouseEnter={() => setIndex(optionIndex)} onClick={() => choose(option)}><span>{option}</span>{option === value && <Check size={16} />}</button>
        <button type="button" className={styles.removeOption} aria-label={`${label} ${option} 삭제`} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={async () => { if (await onRemove(option)) { if (currentValue.current === option) { dirty.current = false; onChange(""); } setIndex(-1); } }}><X size={15} /></button>
      </div>)}
      {canAdd && <button type="button" className={styles.addOption} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={() => { dirty.current = true; void commit(); }}><Plus size={15} /><span>{custom} 추가</span></button>}
      {!choices.length && !canAdd && <p>직접 입력할 수 있어요.</p>}
    </div>, document.body)}
  </div>;
}
