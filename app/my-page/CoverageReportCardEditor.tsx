"use client";
import type { Dispatch, SetStateAction } from "react";
import { COVERAGE_GROUPS, coverageFieldLabel, coverageStatusReport, coverageTotal, reportNumber, type CoverageReport } from "./coverage-report-model";
import styles from "./CoverageAnalysisTab.module.css";
export default function CoverageReportCardEditor({ report, setReport }: { report:CoverageReport;setReport:Dispatch<SetStateAction<CoverageReport>> }) {
 const status=coverageStatusReport(report);
 return <div className={styles.cardEditor}><div className={styles.coverageGrid}>{COVERAGE_GROUPS.map(group=><section className={styles.coverageCard} key={group.title}><h4>{group.title}</h4>{group.fields.map(field=>{
  const total=report.policies.reduce((sum,p)=>sum+(reportNumber(p.amounts[field.id]||"")||0),0);
  const initial=report.overrides[field.id]??(field.manual?"":total?String(total):"");
  return <div className={styles.aggregateRow} key={field.id}><input className={styles.fieldName} aria-label={`현황표 담보명 ${field.label}`} maxLength={40} value={coverageFieldLabel(status,field)} onChange={e=>{const value=e.target.value;setReport(current=>({...current,statusLabels:{...current.statusLabels,[field.id]:value}}));}}/><div className={styles.aggregateAmount}><input aria-label={`${field.label} 현황표 합계`} value={report.statusOverrides?.[field.id]??initial} placeholder="" inputMode={field.manual?"text":"decimal"} maxLength={100} onChange={e=>{const value=e.target.value;setReport(current=>({...current,statusOverrides:{...current.statusOverrides,[field.id]:value}}));}}/>{!field.manual&&(report.statusOverrides?.[field.id]??initial)!==""&&<span>{field.unit||"만원"}</span>}</div><span className={styles.srOnly}>{coverageTotal(status,field)}</span></div>;
 })}</section>)}</div></div>;
}
