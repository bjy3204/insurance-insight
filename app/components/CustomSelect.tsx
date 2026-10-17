"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import styles from "./CustomSelect.module.css";

export default function CustomSelect({ value, options, onChange, label, displayLabel, disabled = false, matchTriggerWidth = false, placement = "auto" }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; label: string; displayLabel?: string; disabled?: boolean; matchTriggerWidth?: boolean; placement?: "auto" | "up" }) {
  const id = useId(), trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [active, setActive] = useState(0);
  const close = (focus = true) => { setPosition(null); if (focus) trigger.current?.focus(); };
  const open = () => {
    if (!options.length) return;
    const rect = trigger.current!.getBoundingClientRect(), below = window.innerHeight - rect.bottom - 12;
    const height = Math.min(280, options.length * 40 + 4, Math.max(44, placement === "up" ? rect.top - 12 : below >= 150 ? below : rect.top - 12));
    const context = document.createElement("canvas").getContext("2d");
    if (context) context.font = `600 14px ${getComputedStyle(trigger.current!).fontFamily}`;
    const textWidth = Math.max(...options.map(option => context?.measureText(option.label).width || option.label.length * 14));
    const width = Math.min(matchTriggerWidth ? rect.width : Math.ceil(textWidth) + 36, window.innerWidth - 16);
    setPosition({ top: placement !== "up" && below >= height ? rect.bottom + 4 : Math.max(8, rect.top - height - 4), left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width, maxHeight: height });
    setActive(Math.max(0, options.findIndex(option => option.value === value)));
  };
  useEffect(() => {
    if (!position) return;
    menu.current?.focus();
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null); };
    const layout = (event: Event) => { if (!menu.current?.contains(event.target as Node)) setPosition(null); };
    document.addEventListener("pointerdown", outside); window.addEventListener("resize", layout); window.addEventListener("scroll", layout, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", layout); window.removeEventListener("scroll", layout, true); };
  }, [position]);
  useEffect(() => { menu.current?.querySelector(`[data-active="true"]`)?.scrollIntoView({ block: "nearest" }); }, [active, position]);
  const choose = (index: number) => { if (options[index]) onChange(options[index].value); close(); };
  return <><button ref={trigger} type="button" className={styles.trigger} disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={!!position} aria-controls={position ? id : undefined} onClick={() => position ? close() : open()} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); open(); } }}><span>{displayLabel ?? options.find(option => option.value === value)?.label ?? "선택"}</span><ChevronDown size={15} style={placement === "up" ? {transform:"rotate(180deg)"} : undefined}/></button>{position && createPortal(<div ref={menu} data-mini-dropdown="true" id={id} role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${id}-${active}`} className={styles.menu} style={position} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "Tab") close(false);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive(index => (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); setActive(event.key === "Home" ? 0 : options.length - 1); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(active); }
  }}>{options.map((option, index) => <button key={option.value} id={`${id}-${index}`} type="button" role="option" aria-selected={option.value === value} data-active={index === active} tabIndex={-1} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span></button>)}</div>, document.body)}</>;
}
