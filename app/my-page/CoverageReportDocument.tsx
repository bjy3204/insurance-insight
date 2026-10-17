import { CoverageReportHeader, CoverageReportFooter } from "./CoverageReportChrome";
import { reportCoverageGroups, coverageGroupLabel, filledPolicyCount, coverageFieldLabel, coverageCategoryLabel, coverageTotal, detailPages, paymentValues, policyAmount, reportTotals, type CoverageReport } from "./coverage-report-model";

const won = (value: number) => value ? `${value.toLocaleString("ko-KR")}원` : "";
export default function CoverageReportDocument({ report, kind = "all", remodeled = false, currentPage }: { report: CoverageReport; kind?: "all" | "analysis" | "status"; remodeled?: boolean; currentPage?: number }) {
  const totals = reportTotals(report), pages = detailPages(report.policies);
  const visibleGroups=reportCoverageGroups(report).filter(group=>group.fields.length);
  const visibleFieldCount=visibleGroups.reduce((sum,group)=>sum+group.fields.length,0);
  const coverageRowHeight=Math.min(24,Math.max(14,789/Math.max(1,visibleFieldCount)));
  const heading = (detail = false) => <CoverageReportHeader report={report} title={detail ? "보장분석표" : "보장현황표"} description={detail ? "보험별 가입금액과 보장 내역" : "담보별 가입금액 한눈에 보기"} remodeled={remodeled}/>;
  const footer = () => <CoverageReportFooter report={report}/>;
  return <><div className={remodeled ? "cr-remodeled" : "cr-original"}>
    {kind !== "analysis" && <article className="coverage-report-page" aria-label="보장현황표">
      {heading()}
      <div className="cr-summary"><div><small>월 납입 보험료</small><strong>{totals.monthly.toLocaleString("ko-KR")}<em> 원</em></strong></div><div><small>총 납입예정 보험료</small><strong>{totals.remaining.toLocaleString("ko-KR")}<em> 원</em></strong></div><div><small>보험 계약</small><strong>{filledPolicyCount(report)}<em> 건</em></strong></div></div>
      <div className="cr-cards" style={{gridTemplateRows:`repeat(${Math.max(1,Math.ceil(visibleGroups.length/3))},minmax(0,1fr))`}}>{visibleGroups.map(group => <section className="cr-card" key={group.title}><h2>{coverageGroupLabel(report,group.title)}</h2><dl>{group.fields.map(field => <div key={field.id}><dt>{coverageFieldLabel(report,field)}</dt><dd>{coverageTotal(report, field)}</dd></div>)}</dl></section>)}</div>
      {report.memo && <div className="cr-note"><strong>분석 메모</strong>{report.memo}</div>}{footer()}
    </article>}
    {kind !== "status" && pages.map((policies, pageIndex) => (currentPage===undefined||currentPage===pageIndex)&&<article className="coverage-report-page cr-detail" key={pageIndex} aria-label={`보험별 보장 상세표 ${pageIndex + 1}`}>
      {heading(true)}
      <table style={{width:185+policies.length*133,height:158+visibleFieldCount*coverageRowHeight}}><colgroup><col style={{ width: 48 }} /><col style={{ width: 137 }} />{policies.map(policy => <col key={policy.id} style={{width:133}}/>)}</colgroup>
        <tbody className="cr-policy-meta">
          <tr><td rowSpan={7} className="cr-ornament" aria-hidden="true"><div>✦</div></td><th>보험사</th>{policies.map(policy=><td key={policy.id}>{policy.insurer}</td>)}</tr>
          <tr className="cr-policy-product-row"><th>보험명</th>{policies.map(policy=><td className="cr-product" key={policy.id}><span className="cr-product-name">{policy.product}</span></td>)}</tr>
          <tr><th>납입기간</th>{policies.map(policy=><td key={policy.id}>{policy.years ? `${policy.years}년납` : ""}</td>)}</tr>
          {([['보장시작','start'],['보장종료','end']] as const).map(([label,field])=><tr key={field}><th>{label}</th>{policies.map(policy=><td key={policy.id}>{policy[field]}</td>)}</tr>)}
          <tr className="cr-policy-remaining-row"><th>납입예정</th>{policies.map(policy=><td key={policy.id}>{won(paymentValues(policy,report.date).remaining)}</td>)}</tr>
          <tr className="cr-policy-premium-row"><th>월 보험료</th>{policies.map(policy=><td key={policy.id}>{won(Number(policy.premium.replace(/,/g,""))||0)}</td>)}</tr>
        </tbody>

        {visibleGroups.map(group => <tbody key={group.title}>{group.fields.map((field, i) => <tr key={field.id} className="cr-coverage-row" style={{height:coverageRowHeight}}>{i === 0 && <th className="cr-category" rowSpan={group.fields.length}>{coverageCategoryLabel(coverageGroupLabel(report,group.title))}</th>}<th>{coverageFieldLabel(report,field)}</th>{policies.map(policy => <td key={policy.id}>{policyAmount(policy, field,report.fieldUnits?.[field.id])}</td>)}</tr>)}</tbody>)}
      </table>{footer()}
    </article>)}
  </div></>;
}






