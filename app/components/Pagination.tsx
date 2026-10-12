"use client";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  const total = Math.max(1, totalPages);
  const render = (count: number, className: string) => {
    const start = Math.floor((page - 1) / count) * count + 1;
    return <nav data-pagination="true" aria-label="페이지 이동" className={className}>
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>이전</button>
      {Array.from({ length: Math.max(0, Math.min(count, total - start + 1)) }, (_, index) => start + index).map(number => (
        <button type="button" key={number} aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>
      ))}
      <button type="button" disabled={page >= total} onClick={() => onPageChange(Math.min(total, page + 1))}>다음</button>
    </nav>;
  };
  return <>{render(5, "paginationMobile")}{render(10, "paginationDesktop")}</>;
}
