export type CoverageField = { id: string; label: string; manual?: boolean; unit?: "억" };
export const COVERAGE_GROUPS: { title: string; fields: CoverageField[] }[] = [
  { title: "사망", fields: ["일반사망", "질병사망", "상해사망"].map((label, i) => ({ id: `death-${i}`, label })) },
  { title: "후유장해", fields: ["질병후유장해(3%)", "질병후유장해(80%)", "상해후유장해(3%)", "상해후유장해(80%)"].map((label, i) => ({ id: `disability-${i}`, label })) },
  { title: "치매 / 간병", fields: ["경증 치매 진단", "시설급여", "재가급여", "질병 간병인 일당", "상해 간병인 일당"].map((label, i) => ({ id: `care-${i}`, label })) },
  { title: "암", fields: ["일반암 진단", "유사암 진단", "암 주요 치료비", "중입자 치료비", "항암 방사선 치료비", "항암 약물 치료비"].map((label, i) => ({ id: `cancer-${i}`, label })) },
  { title: "뇌", fields: ["뇌혈관질환 진단", "뇌졸중 진단", "뇌출혈 진단", "혈전용해치료비", "뇌혈관 수술비", "2대 주요 치료비"].map((label, i) => ({ id: `brain-${i}`, label })) },
  { title: "심장", fields: ["심혈관질환 진단", "허혈성심장 진단", "급성심근경색 진단", "혈전용해치료비", "허혈성심장 수술비", "2대 주요 치료비"].map((label, i) => ({ id: `heart-${i}`, label })) },
  { title: "수술", fields: ["질병 수술비", "질병 종 수술비", "N대 수술비", "상해 수술비", "상해 종 수술비"].map((label, i) => ({ id: `surgery-${i}`, label, manual: [1, 2, 4].includes(i) })) },
  { title: "입원 / 1인실", fields: ["질병 입원", "상해 입원", "질병 간호간병통합", "상해 간호간병통합", "상급종합병원 1인실", "종합병원 1인실"].map((label, i) => ({ id: `hospital-${i}`, label })) },
  { title: "골절 / 화상", fields: ["깁스", "골절진단", "5대골절진단", "화상진단"].map((label, i) => ({ id: `fracture-${i}`, label })) },
  { title: "운전자", fields: ["벌금(대인)", "벌금(대물)", "교통사고처리지원금", "변호사선임비용", "자동차사고부상치료비"].map((label, i) => ({ id: `driver-${i}`, label })) },
  { title: "실손의료비", fields: ["질병입원 의료비", "질병통원 의료비", "상해입원 의료비", "상해통원 의료비"].map((label, i) => ({ id: `medical-${i}`, label })) },
  { title: "배상", fields: [{ id: "liability", label: "일상생활배상책임", unit: "억" }] },
];
export type ReportPolicy = { id: string; insurer: string; product: string; years: string; start: string; end: string; premium: string; amounts: Record<string, string> };
export type CoverageReport = { name: string; birth: string; date: string; advisor: string; organization?: string; phone?: string; fax?: string; email?: string; fieldLabels?: Record<string,string>; chartTargets?: Record<string,string>; statusOverrides?:Record<string,string>; statusLabels?:Record<string,string>; memo: string; policies: ReportPolicy[]; overrides: Record<string, string> };
export const coverageStatusReport=(report:CoverageReport):CoverageReport=>({...report,overrides:{...report.overrides,...report.statusOverrides},fieldLabels:{...report.fieldLabels,...report.statusLabels}});
export const coverageFieldLabel = (report: CoverageReport, field: CoverageField) => report.fieldLabels?.[field.id] ?? field.label;
export const filledPolicyCount = (report:CoverageReport) => report.policies.filter(policy=>policy.insurer.trim()||policy.product.trim()||policy.premium.trim()||Object.values(policy.amounts).some(value=>value.trim())).length;
export const REPORT_CHART_FIELDS = [
  {id:"disability-0",label:"후유장해"},{id:"cancer-0",label:"암"},{id:"heart-0",label:"심장"},
  {id:"brain-0",label:"뇌"},{id:"surgery-0",label:"수술"},{id:"hospital-0",label:"입원"},
] as const;
export const REPORT_SECTIONS = [
  { id: "cover", title: "표지" }, { id: "analysis", title: "보장분석표" },
  { id: "after-analysis", title: "리모델링 후 보장분석표" }, { id: "status", title: "보장현황표" },
  { id: "after-status", title: "리모델링 후 보장현황표" }, { id: "comparison", title: "전후 비교제안서" },
  { id: "summary", title: "리모델링 요약보고서" },
] as const;
export type ReportSection = typeof REPORT_SECTIONS[number]["id"] | "all";
export const REPORT_THEMES = [
  { id: "yellow", label: "노랑", primary: "#e4bd48", secondary: "#9b7d2b", soft: "#fffbed", tint: "#fff8df", line: "#ece2bc" },
  { id: "orange", label: "주황", primary: "#eea468", secondary: "#b47b4b", soft: "#fff7ef", tint: "#fff1e5", line: "#efdbc9" },
  { id: "sky", label: "하늘", primary: "#6a9bc6", secondary: "#426588", soft: "#eff5fc", tint: "#edf4fb", line: "#dce5f0" },
  { id: "green", label: "초록", primary: "#7fa18a", secondary: "#587963", soft: "#f1f7f2", tint: "#eaf3ed", line: "#dbe7de" },
  { id: "gray", label: "회색", primary: "#8a949f", secondary: "#626e7b", soft: "#f4f5f7", tint: "#eef0f3", line: "#dfe2e6" },
] as const;
export type ReportTheme = typeof REPORT_THEMES[number]["id"];
export function coverageCategoryLabel(title: string) {
  return ({ "후유장해":"후유\n장해", "치매 / 간병":"치매\n간병", "입원 / 1인실":"입원\n1인실", "골절 / 화상":"골절\n화상", "실손의료비":"실손\n의료비", "배상책임":"배상\n책임" } as Record<string,string>)[title] || title;
}
export function remodelingDifference(before: CoverageReport, after: CoverageReport) {
  const current = reportTotals(before), proposed = reportTotals(after);
  return { monthly: current.monthly - proposed.monthly, remaining: current.remaining - proposed.remaining };
}
export const newReportPolicy = (id: string): ReportPolicy => ({ id, insurer: "", product: "", years: "", start: "", end: "", premium: "", amounts: {} });
export function reportNumber(value: string): number | null {
  const text = value.replace(/,/g, "").trim();
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}
export function amountText(value: number): string {
  if (!value) return "";
  const rounded = Math.round(value * 100) / 100;
  const billions = Math.floor(rounded / 10000), rest = Math.round((rounded % 10000) * 100) / 100;
  return billions ? `${billions}억${rest ? ` ${rest.toLocaleString("ko-KR")}만원` : ""}` : `${rounded.toLocaleString("ko-KR")}만원`;
}
export function coverageTotal(report: CoverageReport, field: CoverageField): string {
  if (Object.prototype.hasOwnProperty.call(report.overrides,field.id)) {
    const value=report.overrides[field.id].trim(),number=reportNumber(value);
    return number!==null&&!field.manual?amountText(number*(field.unit==="억"?10000:1)):value;
  }
  if (field.manual) return "";
  const total = report.policies.reduce((sum, policy) => sum + (reportNumber(policy.amounts[field.id] || "") || 0), 0);
  return amountText(total * (field.unit === "억" ? 10000 : 1));
}
export function policyAmount(policy: ReportPolicy, field: CoverageField): string {
  const value = policy.amounts[field.id] || "";
  if (field.manual) return value || "";
  return amountText((reportNumber(value) || 0) * (field.unit === "억" ? 10000 : 1));
}
export function paymentValues(policy: ReportPolicy, today: string) {
  const years = reportNumber(policy.years), premium = reportNumber(policy.premium) || 0;
  if (years === null || !validReportDate(policy.start) || !validReportDate(today)) return { remaining: 0, paid: 0 };
  const [y, m, d] = today.split("-").map(Number), [sy, sm, sd] = policy.start.split("-").map(Number);
  const elapsed = Math.max(0, (y - sy) * 12 + m - sm - (d < sd ? 1 : 0));
  const months = Math.round(years * 12), completed = Math.min(months, elapsed);
  return { remaining: (months - completed) * premium, paid: completed * premium };
}
export function validReportDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function reportDateInput(value: string): string {
  const text = value.replace(/\D/g, "").slice(0, 8);
  return text.length > 6 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6)}` : text.length > 4 ? `${text.slice(0, 4)}-${text.slice(4)}` : text;
}
export function reportTotals(report: CoverageReport) {
  return report.policies.reduce((total, policy) => {
    const payment = paymentValues(policy, report.date);
    return { monthly: total.monthly + (reportNumber(policy.premium) || 0), remaining: total.remaining + payment.remaining, paid: total.paid + payment.paid };
  }, { monthly: 0, remaining: 0, paid: 0 });
}
export function detailPages(policies: ReportPolicy[]) {
  return Array.from({ length: Math.ceil(policies.length / 4) }, (_, i) => policies.slice(i * 4, i * 4 + 4));
}
