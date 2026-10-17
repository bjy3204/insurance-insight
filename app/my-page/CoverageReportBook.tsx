import { ArrowRight } from "lucide-react";
import CoverageRadar from "./CoverageRadar";
import { CoverageReportHeader, CoverageReportFooter } from "./CoverageReportChrome";
import Image from "next/image";
import CoverageReportDocument from "./CoverageReportDocument";
import { DEFAULT_REPORT_BACKGROUND, REPORT_BACKGROUNDS, COVERAGE_GROUPS, DEFAULT_CHART_TARGETS, filledPolicyCount, amountText, coverageStatusReport, coverageFieldLabel, coverageCategoryLabel, coverageTotal, remodelingDifference, reportNumber, reportTotals, type CoverageField, type CoverageReport, type ReportSection } from "./coverage-report-model";

const won = (value: number) => value ? `${value.toLocaleString("ko-KR")}원` : "";
const heading = (report: CoverageReport, title: string) => <CoverageReportHeader report={report} title={title} description={title === "비교 보고서" ? "리모델링 전후 보장 내용과 보험료 비교" : "리모델링 전후 보험 계약 요약"}/>;

function Cover({ report }: { report: CoverageReport }) {
  const totals = reportTotals(report), total = totals.paid + totals.remaining;
  const ratio = total ? Math.round(totals.paid / total * 100) : 0;
  return <article className="coverage-report-page cr-cover cr-cover-photographic" aria-label="표지">
    <div className="cr-cover-photo" data-background={report.coverBackground} aria-hidden="true"><Image src={(REPORT_BACKGROUNDS.find(item=>item.id===(report.coverBackground||DEFAULT_REPORT_BACKGROUND))||REPORT_BACKGROUNDS[0]).src} alt="" width={1055} height={1491} unoptimized loading="eager"/></div>
    <div className="cr-cover-photo-wash" aria-hidden="true"/>
    <div className="cr-cover-name"><strong>{report.name || "고객"}</strong> 고객님을 위한</div>
    <h1 className="cr-cover-title"><span>보장분석</span> 리포트</h1>
    <p className="cr-cover-description">고객님이 가입하고 계신 보험을 종합적으로 분석하여<br />라이프스타일과 재무 상황을 반영한 최적의 맞춤 보장 설계를 제안해 드립니다</p>

    <div className="cr-cover-dashboard">
    <div className="cr-cover-panels">
      <section className="cr-cover-contracts"><h2><strong>{report.name || "고객"}</strong><small>님 보험 현황</small></h2><dl>
        <div><dt>정상계약</dt><dd>{filledPolicyCount(report)} 건</dd></div>
        <div><dt>월 보험료</dt><dd>{won(totals.monthly)}</dd></div>
        <div className="cr-paid-row"><dt>납입완료</dt><dd>{won(totals.paid)}</dd></div><div><dt>납입예정</dt><dd>{won(totals.remaining)}</dd></div><div className="cr-cover-total-row"><dt>총 보험료</dt><dd>{won(total)}</dd></div>
      </dl><svg className="cr-donut" viewBox="0 0 120 120" role="img" aria-label={`보험료 납입 완료 ${ratio}%`}><circle cx="60" cy="60" r="44" fill="none" stroke="#fff0db" strokeWidth="13" /><circle cx="60" cy="60" r="44" fill="none" stroke="#ff9828" strokeWidth="13" pathLength="100" strokeDasharray={`${ratio} 100`} transform="rotate(-90 60 60)" /><text x="60" y="65" textAnchor="middle" fontSize="21" fontWeight="700">{ratio}%</text></svg></section>

    </div>
    <CoverageRadar report={report}/>
    </div>
    <div className="cr-cover-bottom"><table><tbody>{[["담당자",report.advisor],["소속",report.organization],["연락처",report.phone],["FAX",report.fax],["E-MAIL",report.email]].map(([label,value]) => <tr key={label}><th>{label}</th><td>{value || ""}</td></tr>)}</tbody></table></div>
    {<CoverageReportFooter report={report}/>}
  </article>;
}

function Comparison({ before, after }: { before: CoverageReport; after: CoverageReport }) {
  const current=reportTotals(before), proposed=reportTotals(after);
  const groups=COVERAGE_GROUPS.filter(g=>["암","뇌","심장","수술","골절 / 화상"].includes(g.title)).flatMap(g=>[{title:g.title,fields:g.fields}]);
  groups.splice(4,0,COVERAGE_GROUPS.find(g=>g.title==="입원")!);
  const difference=remodelingDifference(before,after);
  const change=(field:CoverageField)=>{if(field.manual)return "";const sum=(r:CoverageReport)=>r.policies.reduce((total,p)=>total+(reportNumber(p.amounts[field.id]||"")||0),0);const amount=sum(after)-sum(before);return amount?`${amount>0?"+":"−"}${amountText(Math.abs(amount)*(field.unit==="억"?10000:1))}`:"";};
  return <article className="coverage-report-page cr-comparison" aria-label="전후 비교제안서">{heading(before,"비교 보고서")}
    <div className="cr-comparison-hero"><div><span>현재 월 보험료</span><strong>{won(current.monthly)}</strong></div><div><span>리모델링 후</span><strong>{won(proposed.monthly)}</strong></div><div><span>월 보험료 {difference.monthly>=0?"절감":"증가"}</span><strong>{won(Math.abs(difference.monthly))}</strong></div></div>
    <table className="cr-compare-table"><colgroup><col style={{width:"6%"}}/><col style={{width:"34%"}}/><col style={{width:"20%"}}/><col style={{width:"20%"}}/><col style={{width:"20%"}}/></colgroup>
      <thead><tr><th colSpan={2}>보장 항목</th><th>현재</th><th>리모델링 후</th><th>증감</th></tr></thead>
      {groups.map(group=><tbody key={group.title}>{group.fields.map((field,i)=><tr key={field.id}>{i===0&&<th rowSpan={group.fields.length} className="cr-compare-category">{coverageCategoryLabel(group.title)}</th>}<th>{coverageFieldLabel(before,field)}</th><td>{coverageTotal(before,field)}</td><td className="cr-proposed">{coverageTotal(after,field)}</td><td className="cr-change">{change(field)}</td></tr>)}</tbody>)}
    </table>
    <div className="cr-comparison-foot"><span>총 납입 예정 보험료</span><b>{won(current.remaining)}</b><span className="cr-comparison-arrow"><ArrowRight size={20} strokeWidth={1.8} aria-label="변경 후"/></span><b>{won(proposed.remaining)}</b><strong>{won(Math.abs(difference.remaining))} {difference.remaining>=0?"절감":"증가"}</strong></div>
    {<CoverageReportFooter report={before}/>}
  </article>;
}

function Summary({ before, after, currentPage }: { before: CoverageReport; after: CoverageReport; currentPage?: number }) {
  const current=reportTotals(before),proposed=reportTotals(after),difference=remodelingDifference(before,after);
  const pages=Math.max(1,Math.ceil(Math.max(before.policies.length,after.policies.length)/10));
  return <>{Array.from({length:pages},(_,page)=>(currentPage===undefined||currentPage===page)&&<article key={page} className="coverage-report-page cr-remodel-summary" aria-label={`요약보고서 ${page+1}`}>
    {heading(before,"요약 보고서")}
    <div className="cr-summary-columns">{[before,after].map((report,index)=><section key={index}>
      <div className="cr-contract-total"><span>{index?"리모델링 후 총 보험료":"현재 총 보험료"}</span><strong>{won(index?proposed.monthly:current.monthly)}</strong></div>
      <table><colgroup><col style={{width:"27%"}}/><col/><col style={{width:"25%"}}/></colgroup><tbody>{Array.from({length:10},(_,i)=>{const p=report.policies[page*10+i];return <tr key={i}><th><span className="cr-contract-text">{p?.insurer||""}</span></th><td><span className="cr-contract-text">{p?.product||""}</span></td><td>{p?.premium?won(reportNumber(p.premium)||0):""}</td></tr>;})}</tbody></table>
    </section>)}</div>
    <div className="cr-savings"><p>보험 리모델링 후 월 보험료 <strong>{won(Math.abs(difference.monthly))}</strong> {difference.monthly>=0?"절감":"증가"}</p><p>앞으로 납부해야 할 총 보험료 <strong>{won(Math.abs(difference.remaining))}</strong> {difference.remaining>=0?"절감":"증가"}</p></div>
    {before.memo&&<div className="cr-note">{before.memo}</div>}{<CoverageReportFooter report={before}/>}
  </article>)}</>;
}

export default function CoverageReportBook({ before, after, kind, currentPage }: { before: CoverageReport; after: CoverageReport; kind: ReportSection; currentPage?: number }) {
  const show=(section:ReportSection)=>kind==="all"||kind===section;
  return <div className="cr-reference">
    {show("cover")&&<Cover report={before}/>}
    {show("analysis")&&<CoverageReportDocument report={before} kind="analysis" currentPage={currentPage}/>}
    {show("after-analysis")&&<CoverageReportDocument report={after} kind="analysis" remodeled currentPage={currentPage}/>}
    {show("status")&&<CoverageReportDocument report={coverageStatusReport(before)} kind="status"/>}
    {show("after-status")&&<CoverageReportDocument report={coverageStatusReport(after)} kind="status" remodeled/>}
    {show("comparison")&&<Comparison before={before} after={after}/>}
    {show("summary")&&<Summary before={before} after={after} currentPage={currentPage}/>}
  </div>;
}





