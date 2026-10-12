"use client";

import { useEffect } from "react";

// Popup geometry is kept only on the current DOM elements, never in storage.
export default function PopupInteractions() {
  useEffect(() => {
    let cleanupDrag: (() => void) | undefined;
    let resizingPopup = false;
    let ignoreResizeClickUntil = 0;
    let releaseResizeScroll: (() => void) | undefined;
    const finishResize = () => {
      if (!resizingPopup) return;
      releaseResizeScroll?.();
      releaseResizeScroll = undefined;
      resizingPopup = false;
      ignoreResizeClickUntil = performance.now() + 400;
    };
    const ignoreResizeClick = (event: MouseEvent) => {
      if (resizingPopup || performance.now() < ignoreResizeClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    let unlockScroll: (() => void) | undefined;
    const syncScroll = () => {
      const open = window.innerWidth < 768 && !!document.querySelector('[data-popup-frame]:not([data-mobile-movable]), [data-popup-small]');
      if (open && !unlockScroll) {
        const y = window.scrollY;
        const body = document.body;
        const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
        body.style.position = "fixed";
        body.style.top = `${-y}px`;
        body.style.width = "100%";
        body.style.overflow = "hidden";
        unlockScroll = () => {
          Object.assign(body.style, previous);
          window.scrollTo({ top: y, behavior: "instant" });
        };
      } else if (!open && unlockScroll) {
        unlockScroll();
        unlockScroll = undefined;
      }
    };
    const identify = () => {
      document.querySelectorAll<HTMLElement>("[data-popup-header]").forEach(header => {
        if (!header.closest("[data-popup-frame]")) header.parentElement?.setAttribute("data-popup-frame", "true");
      });
      document.querySelectorAll<HTMLElement>('.fixed.inset-0').forEach(overlay => {
        if (!overlay.className.includes("bg-black/") || overlay.querySelector('[data-popup-frame]')) return;
        const panel = overlay.firstElementChild;
        if (panel instanceof HTMLElement && panel.className.includes("bg-white")) {
          if (panel.querySelector('[data-popup-header], [data-popup-drag-handle]') || /\bh-\[/.test(panel.className)) {
            panel.setAttribute("data-popup-frame", "true");
          } else {
            panel.setAttribute("data-popup-small", "true");
          }
        }
      });
      syncScroll();
    };
    identify();
    const observer = new MutationObserver(identify);
    observer.observe(document.body, { childList: true, subtree: true });

    const down = (event: PointerEvent | MouseEvent) => {
      const target = event.target as HTMLElement;
      const frame = target.closest<HTMLElement>("[data-popup-frame], [data-mobile-movable]");
      if (!frame || event.button !== 0) return;
      const mobile = window.innerWidth < 768;
      const movable = frame.hasAttribute("data-mobile-movable");
      const header = target.closest("[data-popup-header], [data-popup-drag-handle]");
      const control = target.closest("button, input, textarea, select, a, [contenteditable], .calc-btn, .calc-resize");
      if (mobile && !movable) {
        if (!control && (header || event.type === "mousedown")) event.stopPropagation();
        return;
      }
      if (event.type !== "pointerdown") return;
      const rect = frame.getBoundingClientRect();
      if (!mobile && frame.dataset.popupResize !== "false" && frame.dataset.popupResize !== "custom" && event.clientX > rect.right - 18 && event.clientY > rect.bottom - 18) {
        resizingPopup = true;
        if (frame.hasAttribute("data-resource-explorer")) {
          const scrollers = Array.from(frame.querySelectorAll<HTMLElement>(".overflow-y-auto, .overflow-auto")).map(element => ({
            element, top: element.scrollTop, left: element.scrollLeft,
            overflow: element.style.overflow, behavior: element.style.scrollBehavior,
          }));
          const keepScroll = () => scrollers.forEach(({ element, top, left }) => {
            element.scrollTop = top;
            element.scrollLeft = left;
          });
          scrollers.forEach(({ element }) => {
            element.style.overflow = "hidden";
            element.style.scrollBehavior = "auto";
            element.addEventListener("scroll", keepScroll);
          });
          releaseResizeScroll = () => {
            scrollers.forEach(({ element, overflow, behavior }) => {
              element.style.overflow = overflow;
              element.removeEventListener("scroll", keepScroll);
              element.style.scrollBehavior = behavior;
            });
            keepScroll();
          };
        }
        frame.style.width = `${rect.width}px`;
        frame.style.height = `${rect.height}px`;
        frame.style.maxWidth = "calc(100vw - 16px)";
        frame.style.maxHeight = "calc(100dvh - 16px)";
        return;
      }
      if ((!header && !movable) || control) return;
      event.preventDefault();
      event.stopPropagation();
      cleanupDrag?.();
      const startX = event.clientX, startY = event.clientY;
      const [x = 0, y = 0] = frame.style.translate.split(" ").map(value => parseFloat(value) || 0);
      const move = (next: PointerEvent) => {
        const dx = Math.max(40 - rect.right, Math.min(window.innerWidth - 40 - rect.left, next.clientX - startX));
        const dy = Math.max(-rect.top, Math.min(window.innerHeight - 40 - rect.top, next.clientY - startY));
        frame.style.translate = `${x + dx}px ${y + dy}px`;
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        cleanupDrag = undefined;
      };
      cleanupDrag = stop;
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      window.addEventListener("pointercancel", stop, { once: true });
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("mousedown", down, true);
    document.addEventListener("click", ignoreResizeClick, true);
    window.addEventListener("pointerup", finishResize, true);
    window.addEventListener("mouseup", finishResize, true);
    window.addEventListener("pointercancel", finishResize, true);
    window.addEventListener("resize", syncScroll);
    return () => {
      observer.disconnect();
      cleanupDrag?.();
      unlockScroll?.();
      releaseResizeScroll?.();
      window.removeEventListener("resize", syncScroll);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("mousedown", down, true);
      document.removeEventListener("click", ignoreResizeClick, true);
      window.removeEventListener("pointerup", finishResize, true);
      window.removeEventListener("mouseup", finishResize, true);
      window.removeEventListener("pointercancel", finishResize, true);
    };
  }, []);
  return null;
}
