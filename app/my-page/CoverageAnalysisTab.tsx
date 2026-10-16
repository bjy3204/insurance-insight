"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList, Download, Eye, Printer, X } from "lucide-react";
import CoverageReportBook from "./CoverageReportBook";
import CoverageReportEditor from "./CoverageReportEditor";
import CoverageReportCardEditor from "./CoverageReportCardEditor";
import CoverageCustomerStorage from "./CoverageCustomerStorage";
import { newReportPolicy, reportDateInput, reportTotals, validReportDate, REPORT_CHART_FIELDS, REPORT_THEMES, type ReportSection, type ReportTheme, type CoverageReport } from "./coverage-report-model";
import { printCoverageReport, REPORT_CSS } from "./coverage-report-print";
import styles from "./CoverageAnalysisTab.module.css";

export default function CoverageAnalysisTab() {
  const [report, setReport] = useState<CoverageReport>(() => ({ name: "", birth: "", date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }), advisor: "", memo: "", policies: [newReportPolicy("initial")], overrides: {} }));
  const [previewOpen,setPreviewOpen]=useState(false);
  useEffect(()=>{if(!previewOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setPreviewOpen(false);};document.addEventListener("keydown",close);const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.removeEventListener("keydown",close);document.body.style.overflow=previous;};},[previewOpen]);
  const [reportKind, setReportKind] = useState<ReportSection>("analysis");
  const [pagesByKind,setPagesByKind]=useState<Record<string,number>>({});
  const [after, setAfter] = useState<CoverageReport>(() => ({ name: "", birth: "", date: "", advisor: "", memo: "", policies: [newReportPolicy("after-initial")], overrides: {} }));
  const [theme, setTheme] = useState<ReportTheme>("sky");
  const palette = REPORT_THEMES.find(item => item.id === theme)!;
  const isAfter = reportKind === "after-analysis" || reportKind === "after-status";
  const afterReport = { ...report, policies: after.policies, overrides: after.overrides, statusOverrides:after.statusOverrides,statusLabels:after.statusLabels };
  const activeReport = isAfter ? afterReport : report;
  const pageCount = reportKind.endsWith("analysis") ? Math.max(1,Math.ceil(activeReport.policies.length/4)) : reportKind==="summary" ? Math.max(1,Math.ceil(Math.max(report.policies.length,after.policies.length)/5)) : 1;
  const currentPage=Math.min(pagesByKind[reportKind]||0,pageCount-1);
  const changePage=(page:number)=>setPagesByKind(current=>({...current,[reportKind]:page}));
  const setActiveReport: React.Dispatch<React.SetStateAction<CoverageReport>> = update => {
    if (!isAfter) { setReport(update); return; }
    setAfter(current => typeof update === "function" ? update({ ...report, policies: current.policies, overrides: current.overrides,statusOverrides:current.statusOverrides,statusLabels:current.statusLabels }) : update);
  };
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const documentRef = useRef<HTMLDivElement>(null);
  const fullDocumentRef = useRef<HTMLDivElement>(null);
  const totals = reportTotals(activeReport);
  const change = (key: keyof Omit<CoverageReport, "policies" | "overrides">, value: string) => setReport(current => ({ ...current, [key]: value }));
  const changeFieldLabel = (id:string,value:string) => setReport(current=>({...current,fieldLabels:{...current.fieldLabels,[id]:value}}));
  async function output(kind: "print" | "image", all = false) {
    const target = all ? fullDocumentRef.current : documentRef.current;
    if (!target || busy) return;
    setBusy(true); setError("");
    const filename = `${report.name.trim() || "고객"}_보장분석표`.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 80);
    try {
      if (!validReportDate(report.date) || [...report.policies,...after.policies].some(item => (item.start && !validReportDate(item.start)) || (item.end && !validReportDate(item.end)) || (item.start && item.end && item.end < item.start))) throw new Error("분석 기준일과 보장시작·종료 날짜를 확인해 주세요. YYYY-MM-DD 형식으로 입력해 주세요.");
      await document.fonts.ready;
      await Promise.all(Array.from(target.querySelectorAll("img")).map(image=>image.decode()));
      for (const page of target.querySelectorAll<HTMLElement>(".coverage-report-page")) {
        const footer = page.querySelector(".cr-footer")!.getBoundingClientRect();
        const blocks = page.querySelectorAll(".cr-cards, .cr-note, table, .cr-savings, .cr-cover-bottom");
        if (Array.from(blocks).some(block => block.getBoundingClientRect().bottom > footer.top - 8)) throw new Error("보고서 한 장의 공간을 초과했습니다. 긴 상품명이나 메모를 조금 줄여 주세요.");
      }
      if (kind === "print") await printCoverageReport(target.innerHTML, filename);
      else {
        const [{ default: html2canvas }, { default: JSZip }] = await Promise.all([import("html2canvas"), import("jszip")]);
        const zip = new JSZip();
        const pages = target.querySelectorAll<HTMLElement>(".coverage-report-page");
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", windowWidth: 1100, windowHeight: 1300, scrollX: 0, scrollY: 0,
            onclone: doc => { const capture = doc.querySelector<HTMLElement>("[data-coverage-capture]"); if (capture) capture.style.cssText = "position:absolute;top:0;left:0;width:794px;visibility:visible;"; } });
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("이미지를 생성하지 못했습니다.")), "image/png"));
          zip.file(`${filename}_${String(i + 1).padStart(2, "0")}.png`, blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = `${filename}_이미지.zip`; document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "출력 중 오류가 발생했습니다. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  const themeStyle = { "--cr-accent": palette.primary, "--cr-secondary": palette.secondary, "--cr-soft": palette.soft, "--cr-tint": palette.tint, "--cr-line":palette.line } as React.CSSProperties;
  return <section className={styles.root} style={themeStyle}>
    <style>{REPORT_CSS}</style>
    <header className={styles.toolbar}><h2><ClipboardList />보장분석표</h2><div className={styles.actions}><button data-action-height="44" type="button" disabled={busy} onClick={() => void output("print",true)}><Printer size={16} />전체 인쇄</button><button data-action-height="44" type="button" className={styles.primary} disabled={busy} onClick={() => void output("image")}><Download size={16} />{busy ? "준비 중…" : "이미지 저장"}</button></div></header>
    <CoverageCustomerStorage value={{before:report,after:afterReport,theme}} onLoad={value=>{setReport({...value.before,memo:""});setAfter({...value.after,memo:""});setTheme(value.theme);setPagesByKind({});}}/>
    <div className={styles.reportNavigation}><div className={styles.reportTabs} aria-label="보고서 종류">{[{title:"표지",ids:["cover"]},{title:"리모델링 전",ids:["analysis","status"]},{title:"리모델링 후",ids:["after-analysis","after-status"]},{title:"비교제안서",ids:["comparison","summary"]}].map(group=><button data-action-height="44" key={group.title} type="button" aria-pressed={group.ids.includes(reportKind)} onClick={()=>{setReportKind(group.ids[0] as ReportSection);}}>{group.title}</button>)}</div><div className={styles.themePicker} aria-label="보고서 색상">{REPORT_THEMES.map(item=><button key={item.id} type="button" title={`${item.label} 배색`} aria-label={`${item.label} 배색`} aria-pressed={theme===item.id} onClick={()=>setTheme(item.id)} style={{background:item.primary}}/>)}</div></div>
    <div className={styles.subToolbar}><div className={styles.stageTabs}>{(reportKind==="analysis"||reportKind==="status"?["analysis","status"]:reportKind.startsWith("after-")?["after-analysis","after-status"]:reportKind==="comparison"||reportKind==="summary"?["comparison","summary"]:[]).map(id=><button data-action-height="44" key={id} type="button" aria-pressed={reportKind===id} onClick={()=>setReportKind(id as ReportSection)}>{id.endsWith("analysis")?"보장분석표":id.endsWith("status")?"보장현황표":id==="comparison"?"전후 비교제안서":"요약보고서"}</button>)}</div><div className={styles.previewActions}><button data-action-height="44" type="button" onClick={()=>setPreviewOpen(true)}><Eye size={16}/>인쇄 미리보기</button><button data-action-height="44" type="button" disabled={busy} onClick={()=>void output("print")}><Printer size={15}/>개별 인쇄</button></div></div>
    {pageCount>1&&<nav className={styles.pagination} aria-label="보고서 페이지">{Array.from({length:pageCount},(_,i)=><button data-action-height="44" key={i} type="button" aria-current={currentPage===i?"page":undefined} onClick={()=>changePage(i)}>{i+1}페이지</button>)}</nav>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.editor}>
      <div className={styles.identityCard}><div className={styles.identity}><label>고객명<input aria-label="고객명" maxLength={30} value={report.name} onChange={e => change("name", e.target.value)} /></label><label>생년월일<input aria-label="생년월일" inputMode="numeric" maxLength={6} value={report.birth} onChange={e => change("birth", e.target.value.replace(/\D/g, "").slice(0, 6))} /></label><label>분석 기준일<input aria-label="분석 기준일" inputMode="numeric" placeholder="YYYY-MM-DD" maxLength={10} value={report.date} onChange={e => change("date", reportDateInput(e.target.value))} /></label><label>담당자<input aria-label="담당자" maxLength={30} value={report.advisor} onChange={e => change("advisor", e.target.value)} /></label></div><div className={styles.totals}><span>월 보험료 <strong>{totals.monthly.toLocaleString("ko-KR")}원</strong></span><span>납입 예정 <strong>{totals.remaining.toLocaleString("ko-KR")}원</strong></span></div></div>
      {reportKind==="cover"&&<div className={styles.identityCard}><div className={styles.advisorFields}>{([{key:"organization",label:"소속"},{key:"phone",label:"연락처"},{key:"fax",label:"FAX"},{key:"email",label:"E-MAIL"}] as const).map(({key,label})=><label key={key}>{label}<input value={report[key]||""} maxLength={60} onChange={e=>change(key,e.target.value)}/></label>)}</div></div>}
      {reportKind==="cover"&&<section className={styles.identityCard}><h3 className={styles.chartHeading}>그래프 기준</h3><div className={styles.chartFields}>{REPORT_CHART_FIELDS.map(field=><label key={field.id}>{field.label} 기준 (만원)<input aria-label={`${field.label} 그래프 기준`} inputMode="decimal" maxLength={10} value={report.chartTargets?.[field.id]||""} onChange={event=>{const value=event.target.value.replace(/[^\d.]/g,"").replace(/(\..*)\./g,"$1");setReport(current=>({...current,chartTargets:{...current.chartTargets,[field.id]:value}}));}}/></label>)}</div></section>}
      {(reportKind==="comparison"||reportKind==="summary")&&<div className={styles.comparisonOverview}>{[report,afterReport].map((r,i)=>{const t=reportTotals(r);return <section key={i}><h3>{i?"리모델링 후":"리모델링 전"}</h3><p>월 보험료<strong>{t.monthly.toLocaleString("ko-KR")}원</strong></p><p>납입예정<strong>{t.remaining.toLocaleString("ko-KR")}원</strong></p><button data-action-height="44" type="button" onClick={()=>setReportKind(i?"after-analysis":"analysis")}>보장분석표 수정</button></section>;})}</div>}
      {reportKind!=="cover"&&reportKind!=="comparison"&&reportKind!=="summary"&&<>
      {reportKind==="status"||reportKind==="after-status"?<CoverageReportCardEditor report={activeReport} setReport={setActiveReport}/>:<CoverageReportEditor report={activeReport} setReport={setActiveReport} page={currentPage} onPageChange={changePage} onFieldLabelChange={changeFieldLabel}/>}
      </>}
    </div>
    {previewOpen&&<div className={styles.previewOverlay} onMouseDown={event=>{if(event.target===event.currentTarget)setPreviewOpen(false);}}><section className={styles.previewDialog} role="dialog" aria-modal="true" aria-label="인쇄 미리보기"><header className={styles.previewHeader}><h3>인쇄 미리보기</h3><div>{pageCount>1&&Array.from({length:pageCount},(_,i)=><button data-action-height="44" key={i} type="button" aria-current={currentPage===i?"page":undefined} onClick={()=>changePage(i)}>{i+1}페이지</button>)}</div><button type="button" aria-label="미리보기 닫기" onClick={()=>setPreviewOpen(false)}><X size={20}/></button></header><div className={styles.preview} data-coverage-preview><div style={themeStyle} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div></section></div>}
    <div className={styles.capture} data-coverage-capture ref={documentRef} aria-hidden="true"><div style={themeStyle} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind={reportKind}/></div></div>
    <div className={styles.capture} aria-hidden="true" ref={fullDocumentRef}><div style={themeStyle} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind="all"/></div></div>
  </section>;
}





