"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  arrows?: boolean;
  desktopPageCount?: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange, desktopPageCount = 10, arrows = false }: Props) {
  const total = Math.max(1, totalPages);
  const render = (count: number, className: string) => {
    const start = Math.floor((page - 1) / count) * count + 1;
    return <nav data-pagination="true" aria-label="페이지 이동" className={className}>
      <button type="button" aria-label="이전 페이지" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>{arrows ? <ChevronLeft size={18}/> : "이전"}</button>
      {Array.from({ length: Math.max(0, Math.min(count, total - start + 1)) }, (_, index) => start + index).map(number => (
        <button type="button" key={number} aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>
      ))}
      <button type="button" aria-label="다음 페이지" disabled={page >= total} onClick={() => onPageChange(Math.min(total, page + 1))}>{arrows ? <ChevronRight size={18}/> : "다음"}</button>
    </nav>;
  };
  return <>{render(5, "paginationMobile")}{render(desktopPageCount, "paginationDesktop")}</>;
}
