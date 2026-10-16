import { COVERAGE_GROUPS, filledPolicyCount, coverageFieldLabel, coverageCategoryLabel, coverageTotal, detailPages, paymentValues, policyAmount, reportTotals, type CoverageReport } from "./coverage-report-model";

const won = (value: number) => value ? `${value.toLocaleString("ko-KR")}원` : "";
export default function CoverageReportDocument({ report, kind = "all", remodeled = false, currentPage }: { report: CoverageReport; kind?: "all" | "analysis" | "status"; remodeled?: boolean; currentPage?: number }) {
  const totals = reportTotals(report), pages = detailPages(report.policies);
  const heading = (detail = false) => <header className="cr-heading"><div><div className="cr-eyebrow">INSURANCE COVERAGE REPORT</div><h1>{remodeled && <small className="cr-remodel-label">리모델링 후</small>}<span>{report.name || "고객"}</span>님의 {detail ? "보장분석표" : "보장현황표"}</h1><p>{detail ? "보험별 가입금액과 보장 내역" : "담보별 가입금액 한눈에 보기"}</p></div><div className="cr-meta">{report.birth && <>생년월일 {report.birth}<br /></>}분석 기준일 {report.date}{report.advisor && <><br />담당자 {report.advisor}</>}</div></header>;
  const footer = (page: number) => <footer className="cr-footer"><span>보장 내용과 지급 기준은 각 보험계약의 증권·약관을 확인해 주세요.</span><span>{page} / {kind === "status" ? 1 : pages.length + (kind === "all" ? 1 : 0)}</span></footer>;
  return <><div className={remodeled ? "cr-remodeled" : "cr-original"}>
    {kind !== "analysis" && <article className="coverage-report-page" aria-label="보장현황표">
      {heading()}
      <div className="cr-summary"><div><small>월 납입 보험료</small><strong>{totals.monthly.toLocaleString("ko-KR")}<em> 원</em></strong></div><div><small>납입 예정 보험료</small><strong>{totals.remaining.toLocaleString("ko-KR")}<em> 원</em></strong></div><div><small>보험 계약</small><strong>{filledPolicyCount(report)}<em> 건</em></strong></div></div>
      <div className="cr-section-label">담보별 보장 현황<span>가입금액 기준</span></div>
      <div className="cr-cards">{COVERAGE_GROUPS.map(group => <section className="cr-card" key={group.title}><h2>{group.title}</h2><dl>{group.fields.map(field => <div key={field.id}><dt>{coverageFieldLabel(report,field)}</dt><dd>{coverageTotal(report, field)}</dd></div>)}</dl></section>)}</div>
      {report.memo && <div className="cr-note"><strong>분석 메모</strong>{report.memo}</div>}{footer(1)}
    </article>}
    {kind !== "status" && pages.map((policies, pageIndex) => (currentPage===undefined||currentPage===pageIndex)&&<article className="coverage-report-page cr-detail" key={pageIndex} aria-label={`보험별 보장 상세표 ${pageIndex + 1}`}>
      {heading(true)}
      <table style={{width:185+policies.length*133}}><colgroup><col style={{ width: 48 }} /><col style={{ width: 137 }} />{policies.map(policy => <col key={policy.id} style={{width:133}}/>)}</colgroup>
        <tbody className="cr-policy-meta">
          <tr><td rowSpan={7} className="cr-ornament" aria-hidden="true"><div>✦</div></td><th>보험사</th>{policies.map(policy=><td key={policy.id}>{policy.insurer}</td>)}</tr>
          <tr><th>보험명</th>{policies.map(policy=><td className="cr-product" key={policy.id}>{policy.product}</td>)}</tr>
          <tr><th>납입기간</th>{policies.map(policy=><td key={policy.id}>{policy.years ? `${policy.years}년납` : ""}</td>)}</tr>
          {([['보장시작','start'],['보장종료','end']] as const).map(([label,field])=><tr key={field}><th>{label}</th>{policies.map(policy=><td key={policy.id}>{policy[field]}</td>)}</tr>)}
          <tr><th>납입예정</th>{policies.map(policy=><td key={policy.id}>{won(paymentValues(policy,report.date).remaining)}</td>)}</tr>
          <tr><th>월 보험료</th>{policies.map(policy=><td key={policy.id}>{won(Number(policy.premium.replace(/,/g,""))||0)}</td>)}</tr>
        </tbody>
        <tbody className="cr-group-heading"><tr><th>구분</th><th>보장 항목</th>{policies.map((policy,i)=><th key={policy.id}>{policy.insurer||`보험 ${pageIndex*4+i+1}`}</th>)}</tr></tbody>
        {COVERAGE_GROUPS.map(group => <tbody key={group.title}>{group.fields.map((field, i) => <tr key={field.id}>{i === 0 && <th className="cr-category" rowSpan={group.fields.length}>{coverageCategoryLabel(group.title)}</th>}<th>{coverageFieldLabel(report,field)}</th>{policies.map(policy => <td key={policy.id}>{policyAmount(policy, field)}</td>)}</tr>)}</tbody>)}
      </table>{footer(pageIndex + (kind === "all" ? 2 : 1))}
    </article>)}
  </div></>;
}






