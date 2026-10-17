"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";

export default function FloatingDatePanel({ width, gap = 3, children, style, ...props }: HTMLAttributes<HTMLDivElement> & { width?: number; gap?: number }) {
  const marker = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, width: width ?? 240, ready: false });
  useLayoutEffect(() => {
    const parent = marker.current?.parentElement;
    const anchor = parent?.querySelector<HTMLElement>('input,button');
    if (!anchor) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const panelWidth = Math.min(width ?? Math.max(240, rect.width), window.innerWidth - 16);
      const height = panel.current?.getBoundingClientRect().height ?? 0;
      const below = rect.bottom + gap;
      const top = below + height <= window.innerHeight - 8 ? below : rect.top - height - gap >= 8 ? rect.top - height - gap : Math.max(8, window.innerHeight - height - 8);
      const next = { left: Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8)), top, width: panelWidth, ready: true };
      setPosition(old => Object.keys(next).every(key => old[key as keyof typeof old] === next[key as keyof typeof next]) ? old : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('pointermove', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); window.removeEventListener('pointermove', update); };
  }, [width, gap]);
  return <><span ref={marker} hidden />{createPortal(<div {...props} ref={panel} style={{ ...style, position: 'fixed', left: position.left, top: position.top, width: position.width, margin: 0, zIndex: 10050, visibility: position.ready ? 'visible' : 'hidden', maxHeight: 'calc(100dvh - 16px)', overflowY: 'auto', boxSizing: 'border-box' }}>{children}</div>, document.body)}</>;
}
