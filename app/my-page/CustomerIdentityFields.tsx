"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { customerNameStartsWith, shortCustomerBirth, type CustomerIdentity } from "./customer-form-fields";
import styles from "./CustomerEntryDialog.module.css";

// Suggestions are supplied by the customer-list connection. Typing never replaces an input.
export default function CustomerIdentityFields({ customers, name, birth, onNameChange, onBirthChange }: {
  customers: readonly CustomerIdentity[]; name: string; birth: string;
  onNameChange: (value: string) => void; onBirthChange: (value: string) => void;
}) {
  const id = useId();
  const nameInput = useRef<HTMLInputElement>(null), birthInput = useRef<HTMLInputElement>(null), menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [target, setTarget] = useState<"name" | "birth">("name");
  const [index, setIndex] = useState(-1);
  const matches = customers.filter(customer => target === "name" ? customerNameStartsWith(customer.name, name) : !!name.trim() && customer.name.trim() === name.trim());
  const visible = !!position && matches.length > 0;
  const close = () => { setPosition(null); setIndex(-1); };
  const open = (field: "name" | "birth") => {
    const input = field === "name" ? nameInput.current : birthInput.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const height = Math.min(240, Math.max(80, below >= 160 ? below : rect.top - 12));
    setTarget(field); setIndex(-1);
    setPosition({ top: below >= 160 ? rect.bottom + 4 : Math.max(8, rect.top - height - 4), left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width, maxHeight: height });
  };
  const choose = (customer: CustomerIdentity) => {
    (target === "name" ? nameInput.current : birthInput.current)?.blur();
    onNameChange(customer.name); onBirthChange(shortCustomerBirth(customer.birth)); close();
  };
  useEffect(() => {
    if (!position) return;
    const outside = (event: PointerEvent) => { if (![nameInput.current, birthInput.current, menu.current].some(element => element?.contains(event.target as Node))) close(); };
    const layout = (event: Event) => { if (!menu.current?.contains(event.target as Node)) close(); };
    document.addEventListener("pointerdown", outside); window.addEventListener("resize", layout); window.addEventListener("scroll", layout, true);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", layout); window.removeEventListener("scroll", layout, true); };
  }, [position]);
  useEffect(() => { menu.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" }); }, [index]);
  const input = (field: "name" | "birth", label: string) => <div className={styles.field}>
    <label htmlFor={`${id}-${field}`} className={styles.label}>{label}</label>
    <input ref={field === "name" ? nameInput : birthInput} id={`${id}-${field}`} className={styles.identityInput} role="combobox" aria-autocomplete="list" aria-expanded={visible && target === field} aria-controls={visible && target === field ? `${id}-options` : undefined} aria-activedescendant={visible && target === field && matches[index] ? `${id}-option-${index}` : undefined}
      value={field === "name" ? name : birth} autoComplete="off" inputMode={field === "birth" ? "numeric" : undefined} maxLength={field === "birth" ? 6 : 80}
      onFocus={() => open(field)} onBlur={() => close()} onChange={event => { if (field === "name") onNameChange(event.target.value); else onBirthChange(shortCustomerBirth(event.target.value)); open(field); }}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape" && visible) { event.stopPropagation(); close(); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (!visible) open(field); else setIndex(current => current < 0 ? event.key === "ArrowDown" ? 0 : matches.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length); }
        if (event.key === "Enter" && visible) { event.preventDefault(); if (matches[index]) choose(matches[index]); }
        if (event.key === "Tab") close();
      }} />
  </div>;
  return <>
    {input("name", "계약자")}{input("birth", "생년월일")}
    {visible && createPortal(<div ref={menu} id={`${id}-options`} role="listbox" aria-label={target === "name" ? "계약자 후보" : "생년월일 후보"} className={styles.options} style={position!}>
      {matches.map((customer, optionIndex) => <button key={`${customer.name}:${customer.birth}:${optionIndex}`} id={`${id}-option-${optionIndex}`} type="button" role="option" tabIndex={-1} aria-selected={optionIndex === index} data-active={optionIndex === index} onPointerDown={event => event.preventDefault()} onMouseEnter={() => setIndex(optionIndex)} onClick={() => choose(customer)}>
        <span className={styles.identityOption}><span>{customer.name}</span><small>{shortCustomerBirth(customer.birth)}</small></span>
      </button>)}
    </div>, document.body)}
  </>;
}
