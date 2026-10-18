"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { X } from "lucide-react";
import {usePathname} from "next/navigation";

type Props = InputHTMLAttributes<HTMLInputElement> & { onClear: () => void; showClearButton?: boolean; "data-page-search-input"?: string };

const ClearableSearchInput = forwardRef<HTMLInputElement, Props>(function ClearableSearchInput({ onClear, showClearButton = true, ...props }, ref) {
  const pathname=usePathname();
  const adminPage=pathname==='/admin'||pathname?.startsWith('/admin/');
  const input = useRef<HTMLInputElement>(null);
  const wrapper = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number }>();
  useImperativeHandle(ref, () => input.current!);
  const [hasUnit, setHasUnit] = useState(false);
  const filled = String(props.value ?? props.defaultValue ?? "").length > 0;
  const isSearch = props["data-page-search-input"] === "true" || props.type === "search" || /검색/.test(`${props.placeholder ?? ""} ${props["aria-label"] ?? ""}`) || props.id === "weather-region-query";
  useLayoutEffect(() => {
    const field = input.current, container = wrapper.current;
    if (!field || !container) return;
    let unitParent: HTMLElement | null = container.parentElement;
    let unitFound = false;
    for (let depth = 0; unitParent && depth < 3; depth++, unitParent = unitParent.parentElement) {
      if (unitParent.querySelectorAll('input').length > 1) break;
      if (unitParent.hasAttribute('data-field-unit') || Array.from(unitParent.children).some(child => child !== container && !child.querySelector('input') && /^(원|개월|%)$/.test(child.textContent?.trim() || ''))) { unitFound = true; break; }
    }
    setHasUnit(unitFound);
    let boundary: HTMLElement = field;
    const borderless = parseFloat(getComputedStyle(field).borderRightWidth) === 0;
    if (borderless) field.setAttribute('data-borderless-field', 'true');
    if (borderless) {
      let ancestor = container.parentElement;
      for (let level = 0; ancestor && level < 3; level++, ancestor = ancestor.parentElement) {
        // Grouped fields share an outer border but need their own clear buttons.
        if (ancestor.querySelectorAll('input').length > 1) break;
        if (parseFloat(getComputedStyle(ancestor).borderRightWidth) > 0) { boundary = ancestor; break; }
      }
    }
    if (isSearch) boundary.setAttribute('data-search-box', 'true');
    const outlined = parseFloat(getComputedStyle(boundary).borderRightWidth) > 0;
    if (outlined) boundary.setAttribute('data-field-outline', 'true');
    let searchBox = boundary === field ? container : boundary;
    // A borderless positioning wrapper may sit between the input and its action row.
    if (searchBox.parentElement && !Array.from(searchBox.parentElement.children).some(element => element instanceof HTMLButtonElement)
      && searchBox.parentElement.querySelectorAll('input').length === 1
      && searchBox.parentElement.children.length <= 2
      && searchBox.parentElement !== document.body) {
      searchBox = searchBox.parentElement;
    }
    const adjacentButtons = isSearch && searchBox.parentElement
      ? Array.from(searchBox.parentElement.children).filter((element): element is HTMLButtonElement => element instanceof HTMLButtonElement)
      : [];
    const update = () => {
      const box = field.getBoundingClientRect(), parent = container.getBoundingClientRect();
      const edge = boundary.getBoundingClientRect();
      const height = Math.round(edge.height);
      for (const button of adjacentButtons) {
        if (height === 44 || height === 40) button.setAttribute('data-search-adjacent-size', String(height));
        else button.removeAttribute('data-search-adjacent-size');
      }
      const next = { top: box.top - parent.top + box.height / 2, right: parent.right - edge.right + 15 };
      setPosition(previous => previous?.top === next.top && previous?.right === next.right ? previous : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(field); observer.observe(container); observer.observe(boundary);
    return () => { observer.disconnect(); field.removeAttribute('data-borderless-field'); if (isSearch) boundary.removeAttribute('data-search-box'); if (outlined) boundary.removeAttribute('data-field-outline'); adjacentButtons.forEach(button => button.removeAttribute('data-search-adjacent-size')); };
  }, [props.value, props.className, isSearch]);
  return <span ref={wrapper} data-clearable-search="true" data-search-control={isSearch ? "true" : undefined}>
    <input {...props} ref={input} />
    {showClearButton && !hasUnit && filled && <button data-search-clear="true" tabIndex={adminPage?0:-1} style={position} type="button" disabled={props.disabled || props.readOnly} aria-label="입력값 지우기" onPointerDown={event => event.preventDefault()} onClick={() => { onClear(); input.current?.focus(); }}><X size={15} aria-hidden="true" /></button>}
  </span>;
});

export default ClearableSearchInput;
