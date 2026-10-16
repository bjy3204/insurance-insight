import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

const SpreadsheetIcon = forwardRef<SVGSVGElement, LucideProps>(function SpreadsheetIcon(props, ref) {
  return <svg ref={ref} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="1.5" y="3.5" width="21" height="17" rx="3.5" fill="#0BBD66" />
    <path d="M17 3.5h2a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5h-2z" fill="#09A85B" />
    <path d="M19.5 4.3a2.8 2.8 0 0 1 2.2 2.8v9.8a2.8 2.8 0 0 1-2.2 2.8z" fill="#35CB8A" />
    <path d="M4 8h11M7.5 5.8v9.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17 6.3h1" stroke="#C7F7E0" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
});

export default SpreadsheetIcon;
