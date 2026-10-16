"use client";
import type { Dispatch, SetStateAction, KeyboardEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { COVERAGE_GROUPS, coverageFieldLabel, coverageCategoryLabel, newReportPolicy, paymentValues, reportDateInput, type CoverageReport, type ReportPolicy } from "./coverage-report-model";
import styles from "./CoverageReportEditor.module.css";

type Props = { report: CoverageReport; setReport: Dispatch<SetStateAction<CoverageReport>>; page: number; onPageChange: (page: number) => void; onFieldLabelChange: (id: string, value: string) => void };
const metadata = [
  { key: "insurer", label: "보험사" }, { key: "product", label: "보험명" },
  { key: "years", label: "납입기간", suffix: "년납" },
  { key: "start", label: "보장시작" }, { key: "end", label: "보장종료" },
  { key: "remaining", label: "납입예정" },
  { key: "premium", label: "월 보험료", suffix: "원" },
] as const;
export default function CoverageReportEditor({ report, setReport, page, onPageChange, onFieldLabelChange }: Props) {
  const policies = report.policies.slice(page*4,page*4+4);
  const won = (value: number) => value ? `${value.toLocaleString("ko-KR")}원` : "";
  function updatePolicy(id: string, key: keyof Omit<ReportPolicy, "id" | "amounts">, value: string) {
    setReport(current => ({ ...current, policies: current.policies.map(policy => policy.id === id ? { ...policy, [key]: value } : policy) }));
  }
  function nextRow(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const input = event.currentTarget;
    const inputs = Array.from(input.closest("table")!.querySelectorAll<HTMLInputElement>("input"));
    inputs.slice(inputs.indexOf(input) + 1).find(item => item.dataset.column === input.dataset.column)?.focus();
  }
  return <section className={styles.editor}>
    <header className={styles.reportHeading}><div><small>INSURANCE COVERAGE REPORT</small><h3><span>{report.name || "고객"}</span>님의 보장분석표</h3><p>보험별 가입금액과 보장 내역</p></div><span>분석 기준일 {report.date}</span></header>
    <div className={styles.controls}><span>가입금액: 만원 · 일상생활배상책임: 억</span><button type="button" onClick={() => { setReport(current => ({ ...current, policies: [...current.policies, newReportPolicy(crypto.randomUUID())] })); onPageChange(Math.floor(report.policies.length / 4)); }}><Plus size={15} />보험 추가</button></div>
    <div className={styles.scroll} tabIndex={0} aria-label="보험별 보장금액 입력표. 좌우로 스크롤할 수 있습니다.">
      <table className={styles.table} style={{ width: 244 + policies.length * 174 }}>
        <colgroup><col style={{ width: 64 }} /><col style={{ width: 180 }} />{policies.map(policy => <col key={policy.id} />)}</colgroup>
        <tbody>{metadata.map((row,i) => <tr key={row.key} className={row.key === "premium" ? styles.premium : undefined}>
          {i===0&&<td rowSpan={7} className={styles.ornament} aria-hidden="true"><div className={styles.ornamentMark}>✦</div></td>}
          <th scope="row" className={styles.metadataLabel}>{row.label}</th>
          {policies.map((policy, policyIndex) => <td className={row.key === "product" ? styles.productCell : undefined} key={policy.id}>
            {row.key === "remaining" ? <output className={styles.payment}>{won(paymentValues(policy, report.date)[row.key])}</output> : <div className={styles.cellInput}>
              <input aria-label={`보험 ${page*4+policyIndex + 1} ${row.label}`} data-column={policy.id} onKeyDown={nextRow} value={policy[row.key]} maxLength={row.key === "product" ? 60 : row.key === "insurer" ? 20 : row.key === "years" ? 2 : 10} inputMode={["years", "premium", "start", "end"].includes(row.key) ? "numeric" : "text"} onChange={event => { let value = event.target.value; if (row.key === "years" || row.key === "premium") value = value.replace(/\D/g, ""); if (row.key === "start" || row.key === "end") value = reportDateInput(value); updatePolicy(policy.id, row.key, value); }} />
              {"suffix" in row && policy[row.key] && <span>{row.suffix}</span>}{row.key==="insurer"&&report.policies.length>1&&<button className={styles.delete} type="button" aria-label={`보험 ${page*4+policyIndex+1} 제외`} onClick={()=>setReport(current=>({...current,policies:current.policies.filter(p=>p.id!==policy.id)}))}><Trash2 size={12}/></button>}
            </div>}
          </td>)}
        </tr>)}</tbody>
        <tbody className={styles.groupHeader}><tr><th>구분</th><th>보장 항목</th>{policies.map((policy,i)=><th key={policy.id}>{policy.insurer||`보험 ${page*4+i+1}`}</th>)}</tr></tbody>
        {COVERAGE_GROUPS.map(group => <tbody key={group.title}>{group.fields.map((field, fieldIndex) => <tr key={field.id}>
          {fieldIndex === 0 && <th scope="rowgroup" rowSpan={group.fields.length} className={`${styles.category} ${styles.first}`}>{coverageCategoryLabel(group.title)}</th>}
          <th scope="row" className={`${styles.label} ${styles.second}`}><input aria-label={`담보명 ${field.label}`} data-column="field-label" onKeyDown={nextRow} maxLength={40} value={coverageFieldLabel(report,field)} onChange={event=>onFieldLabelChange(field.id,event.target.value)}/></th>

          {policies.map((policy, policyIndex) => <td key={policy.id}><input aria-label={`보험 ${page*4+policyIndex + 1} ${field.label} 가입금액`} data-column={policy.id} onKeyDown={nextRow} inputMode={field.manual ? "text" : "decimal"} maxLength={field.manual ? 35 : 10} value={policy.amounts[field.id] || ""} onChange={event => { const value = field.manual ? event.target.value : event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); setReport(current => ({ ...current, policies: current.policies.map(item => item.id === policy.id ? { ...item, amounts: { ...item.amounts, [field.id]: value } } : item) })); }} /></td>)}
        </tr>)}</tbody>)}
      </table>
    </div>
  </section>;
}



