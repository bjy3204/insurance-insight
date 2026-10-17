"use client";
import { useEffect } from "react";

export default function MobileFooterSpacing() {
  useEffect(() => {
    let frame = 0;
    const watched = new Set<Element>();
    const resize = new ResizeObserver(() => schedule());
    const measure = () => {
      frame = 0;
      let height = 0;
      const footers = document.querySelectorAll<HTMLElement>('[data-page-fixed-footer="true"],[data-site-footer="true"]');
      const present = new Set<Element>(footers);
      for (const element of watched) if (!present.has(element)) { resize.unobserve(element); watched.delete(element); }
      for (const footer of footers) {
        if (!watched.has(footer)) { resize.observe(footer); watched.add(footer); }
        if (window.innerWidth >= 768 || !footer.getClientRects().length || getComputedStyle(footer).position !== "fixed") continue;
        const rect = footer.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) height = Math.max(height, window.innerHeight - rect.top);
      }
      const value = `${Math.ceil(height)}px`;
      if (document.documentElement.style.getPropertyValue("--mobile-fixed-footer-height") !== value) document.documentElement.style.setProperty("--mobile-fixed-footer-height", value);
    };
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
    window.addEventListener("resize", schedule);
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); window.removeEventListener("resize", schedule); document.documentElement.style.removeProperty("--mobile-fixed-footer-height"); };
  }, []);
  return null;
}
