import type { CoverageReport } from "./coverage-report-model";

export function CoverageReportHeader({ report, title, description, remodeled = false }: { report: CoverageReport; title: string; description: string; remodeled?: boolean }) {
  return <header className="cr-heading cr-set-heading"><div><h1><span>{report.name || "고객"}</span>님의 {remodeled ? "리모델링 후 " : ""}{title}</h1><p>{description}</p></div></header>;
}

export function CoverageReportFooter({ report }: { report: CoverageReport }) {
  return <footer className="cr-footer cr-set-footer"><span>보장 내용과 지급 기준은 각 보험계약의 증권·약관을 확인해 주세요</span><span>분석 기준일 {report.date}</span></footer>;
}
