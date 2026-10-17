"use client";

import Image from "next/image";
import {validateCoverageSet} from "@/lib/coverage-storage";
import {supabase} from '@/lib/supabase';
import {confirmAction} from '@/components/ConfirmationHost';
import type {CrmRow} from '@/lib/notion-crm/model';
import {useCrmCalendar} from '@/app/notion-crm/CrmCalendarContext';
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { Fragment, useEffect, useRef, useState } from "react";
import { X, ClipboardList, Download, Printer, ChevronDown, RotateCcw, UserRound, Search, ChevronLeft, ChevronRight } from "lucide-react";
import CoverageReportBook from "./CoverageReportBook";
import CoverageReportEditor from "./CoverageReportEditor";
import { newReportPolicy, DEFAULT_CHART_TARGETS, formatCoverageNumber, reportDateInput, reportTotals, DEFAULT_REPORT_BACKGROUND, REPORT_BACKGROUNDS, REPORT_CHART_FIELDS, REPORT_THEMES, REPORT_DESIGNS, reportDesignStyle, type ReportDesign, type ReportSection, type ReportTheme, type CoverageReport } from "./coverage-report-model";
import { printCoverageReport, REPORT_CSS } from "./coverage-report-print";
import styles from "./CoverageAnalysisTab.module.css";

export default function CoverageAnalysisTab({topNavigation=false}:{topNavigation?:boolean}={}) {
  const [report, setReport] = useState<CoverageReport>(() => ({ name: "", birth: "", date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }), advisor: "", memo: "", policies: [newReportPolicy("initial")], chartTargets:{...DEFAULT_CHART_TARGETS}, overrides: {} }));
  const crm=useCrmCalendar();
  const [chartSettingsOpen,setChartSettingsOpen]=useState(false);
  const [saveRevision,setSaveRevision]=useState(0),[saveMessage,setSaveMessage]=useState('');
  const coverageLoadRun=useRef(0);
  const coverageBusy=useRef(false);
  const [toolbarSearch,setToolbarSearch]=useState('');
  const [toolbarSearchOpen,setToolbarSearchOpen]=useState(false);
  const toolbarMatches=(crm?.data.customers||[]).filter(row=>{
    const query=toolbarSearch.trim();
    const name=String(row.values['이름']||'');
    const birth=String(row.values['주민번호']||row.values['생년월일']||'').replace(/\D/g,'');
    return query&&(name.includes(query)||birth.includes(query.replace(/[-.\s]/g,'')));
  });
  const [customerSearchTarget,setCustomerSearchTarget]=useState<"name"|"birth">("name");
  const [customerSearchOpen,setCustomerSearchOpen]=useState(false),[linkedCustomerId,setLinkedCustomerId]=useState('');
  const customerMatches=(crm?.data.customers||[]).filter(row=>{
    const name=String(row.values['이름']||''),birth=String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'').slice(2,10).replace(/\D/g,'');
    return (report.name.trim()||report.birth)&&name.includes(report.name.trim())&&birth.startsWith(report.birth);
  });
  const changeCustomer=(key:'name'|'birth',value:string)=>{setCustomerSearchTarget(key);setReport(current=>({...current,[key]:value}));setLinkedCustomerId('');setSaveRevision(0);setSaveMessage('');++coverageLoadRun.current;setCustomerSearchOpen(true);};
  const [previewOpen,setPreviewOpen]=useState(false);
  const [reportKind, setReportKind] = useState<ReportSection>("analysis");
  const pairPreviewRef=useRef<HTMLDivElement>(null);
  const [pairPreviewScale,setPairPreviewScale]=useState(.5);
  useEffect(()=>{
    const node=pairPreviewRef.current;if(!node)return;
    const update=()=>{const width=node.getBoundingClientRect().width;if(width<=0)return;const layout=getComputedStyle(node);const columns=layout.gridTemplateColumns.split(' ').filter(Boolean).length||1;const gap=parseFloat(layout.columnGap)||0;setPairPreviewScale(Math.min(1,((width-gap*(columns-1))/columns-32)/794));};
    const observer=new ResizeObserver(update);observer.observe(node);const frame=requestAnimationFrame(update);return()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[previewOpen,reportKind]);

  const [openGroups,setOpenGroups]=useState<string[]>(topNavigation?[]:["리모델링 전"]);
  const centerRef=useRef<HTMLDivElement>(null);
  const [previewScale,setPreviewScale]=useState(1);
  useEffect(()=>{const node=centerRef.current;if(!node)return;const observer=new ResizeObserver(()=>setPreviewScale(Math.min(1,Math.max(0.1,(node.clientWidth-32)/794))));observer.observe(node);return()=>observer.disconnect();},[]);
  const statusPreviewRef=useRef<HTMLDivElement>(null);
  const [statusPreviewScale,setStatusPreviewScale]=useState(1);
  useEffect(()=>{const node=statusPreviewRef.current;if(!node)return;const update=()=>setStatusPreviewScale(Math.min(1,Math.max(.1,(node.clientWidth-32)/794)));update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect();},[reportKind]);
  const [pagesByKind,setPagesByKind]=useState<Record<string,number>>({});
  const [after, setAfter] = useState<CoverageReport>(() => ({ name: "", birth: "", date: "", advisor: "", memo: "", policies: [newReportPolicy("after-initial")], overrides: {} }));
  const [theme, setTheme] = useState<ReportTheme>("sky");
  const [design,setDesign]=useState<ReportDesign>('simple');
  const [draftKey,setDraftKey]=useState<string|null>(null);
  useEffect(()=>{
    let cancelled=false;
    void supabase.auth.getSession().then(({data:{session}})=>{
      if(cancelled||!session)return;
      const key=`coverage-report-draft:v1:${session.user.id}:${crm?.provider||'personal'}`;
      try{
        const raw=localStorage.getItem(key);
        if(raw){
          const draft=JSON.parse(raw),saved=validateCoverageSet(draft);
          setReport({...saved.before,chartTargets:{...DEFAULT_CHART_TARGETS,...saved.before.chartTargets}});setAfter(saved.after);setTheme(saved.theme);setDesign(saved.design||'simple');
          setLinkedCustomerId(typeof draft.customerId==='string'?draft.customerId:'');
          setSaveRevision(Number.isSafeInteger(draft.revision)?draft.revision:0);
          setToolbarSearch(saved.before.name);
          setPreviewOpen(draft.previewOpen===true);
          if(['cover','analysis','after-analysis','comparison','summary'].includes(draft.reportKind))setReportKind(draft.reportKind==="summary"?"comparison":draft.reportKind);
        }
      }catch{setError('로컬 작성 내용을 복원하지 못했습니다');}
      setDraftKey(key);
    });
    return()=>{cancelled=true;};
  },[crm?.provider]);
  useEffect(()=>{
    if(!draftKey)return;
    try{localStorage.setItem(draftKey,JSON.stringify({before:report,after,theme,design,customerId:linkedCustomerId,revision:saveRevision,previewOpen,reportKind}));}
    catch{setError('기기 저장 공간을 확인해 주세요 작성 내용 자동 저장에 실패했습니다');}
  },[draftKey,report,after,theme,design,linkedCustomerId,saveRevision,previewOpen,reportKind]);
  const palette = REPORT_THEMES.find(item => item.id === theme)||REPORT_THEMES[0];
  const backgroundsForTheme=(selected:ReportTheme)=>REPORT_BACKGROUNDS.filter(item=>({sky:["protection","umbrella","review-flat"],orange:["home-photo","orange-paper","family-palm"],yellow:["family-palm","yellow-care","home-photo"],green:["forest"],gray:["insurance-photo","protection"]} as Record<ReportTheme,string[]>)[selected].includes(item.id));
  const availableBackgrounds=backgroundsForTheme(theme);
  function changeReportTheme(selected:ReportTheme){
    setTheme(selected);
    const choices=backgroundsForTheme(selected);
    setReport(current=>({...current,coverBackground:choices.some(item=>item.id===current.coverBackground)?current.coverBackground:selected==="sky"?DEFAULT_REPORT_BACKGROUND:choices[0].id}));
  }

  const isAfter = reportKind === "after-analysis" || reportKind === "after-status";
  const afterReport = { ...report, fieldUnits:after.fieldUnits??report.fieldUnits, removedGroups:after.removedGroups??report.removedGroups, removedFields:after.removedFields??report.removedFields,customFields:after.customFields??report.customFields,categoryLabels:after.categoryLabels??report.categoryLabels, policies: after.policies, overrides: after.overrides, statusOverrides:after.statusOverrides,statusLabels:after.statusLabels };
  const activeReport = isAfter ? afterReport : report;
  const pageCount = reportKind.endsWith("analysis") ? Math.max(1,Math.ceil(activeReport.policies.length/(previewOpen?4:6))) : (reportKind==="summary"||reportKind==="comparison") ? Math.max(1,Math.ceil(Math.max(report.policies.length,after.policies.length)/10)) : 1;
  const currentPage=Math.min(pagesByKind[reportKind]||0,pageCount-1);
  const changePage=(page:number)=>setPagesByKind(current=>({...current,[reportKind]:page}));
  const setActiveReport: React.Dispatch<React.SetStateAction<CoverageReport>> = update => {
    if (!isAfter) { setReport(update); return; }
    setAfter(current => typeof update === "function" ? update({ ...report, policies: current.policies, overrides: current.overrides,statusOverrides:current.statusOverrides,statusLabels:current.statusLabels }) : update);
  };
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function coverageRequest(customerId:string,body?:unknown){
    const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('로그인 후 저장해 주세요');
    const provider=crm?.provider;if(!provider)throw Error('고객 저장소에 연결해 주세요');
    const response=await fetch('/api/coverage-reports/linked'+(body?'':'?provider='+provider+'&customerId='+encodeURIComponent(customerId)),{method:body?'PUT':'GET',cache:'no-store',headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'보장분석표를 처리하지 못했습니다');return result;
  }
  async function selectReportCustomer(row:CrmRow){
    if(coverageBusy.current)return;
    if((linkedCustomerId||report.policies.some(policy=>policy.insurer||policy.product||policy.premium||Object.keys(policy.amounts).length))&&!await confirmAction('작성 중인 내용 대신 선택한 고객의 보장분석표를 불러올까요?'))return;
    const run=++coverageLoadRun.current;coverageBusy.current=true;setBusy(true);setError('');setSaveMessage('');
    try{
      const result=await coverageRequest(row.id);if(run!==coverageLoadRun.current)return;
      const name=String(row.values['이름']||''),birth=String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'').slice(2,10).replace(/\D/g,'');
      if(result.report){setReport({...result.report.before,name,birth,chartTargets:{...DEFAULT_CHART_TARGETS,...result.report.before.chartTargets}});setAfter(result.report.after);setTheme(result.report.theme);setDesign(result.report.design||'simple');setPagesByKind({});}
      else{setReport(current=>({...current,name,birth,policies:[newReportPolicy('initial')],chartTargets:{...DEFAULT_CHART_TARGETS},overrides:{},statusOverrides:{},statusLabels:{}}));setAfter(current=>({...current,policies:[newReportPolicy('after-initial')],overrides:{},statusOverrides:{},statusLabels:{}}));}
      setToolbarSearch(name);setToolbarSearchOpen(false);setLinkedCustomerId(row.id);setSaveRevision(result.revision);setCustomerSearchOpen(false);setSaveMessage(result.report?'저장된 보장분석표를 불러왔습니다':'고객 연결됨 · 작성 후 저장해 주세요');
    }catch(error){setError(error instanceof Error?error.message:'불러오지 못했습니다');}finally{coverageBusy.current=false;setBusy(false);}
  }
  async function resetReport(){
    if(coverageBusy.current||busy)return;
    if(!await confirmAction('작성 내용을 초기화할까요?\n저장된 보장분석표는 삭제되지 않습니다',{title:'초기화',confirmLabel:'확인'}))return;
    ++coverageLoadRun.current;
    setReport({name:'',birth:'',date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}),advisor:'',memo:'',policies:[newReportPolicy('initial')],chartTargets:{...DEFAULT_CHART_TARGETS},overrides:{}});
    setAfter({name:'',birth:'',date:'',advisor:'',memo:'',policies:[newReportPolicy('after-initial')],overrides:{}});
    setToolbarSearch('');setToolbarSearchOpen(false);setTheme('sky');setDesign('simple');setPreviewOpen(false);setPagesByKind({});setLinkedCustomerId('');setSaveRevision(0);setCustomerSearchOpen(false);setSaveMessage('');setError('');
  }
  async function saveLinkedReport(){
    if(coverageBusy.current)return;
    if(!report.name.trim()||!/^\d{6}$/.test(report.birth)){setError('고객명과 생년월일 6자리를 입력해 주세요');setReportKind('cover');return;}
    coverageBusy.current=true;setBusy(true);setError('');setSaveMessage('');
    try{
      let customerId=linkedCustomerId,revision=saveRevision;
      if(!customerId){
        const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('로그인 후 저장해 주세요');
        const provider=crm?.provider;if(!provider)throw Error('고객 저장소에 연결해 주세요');
        const endpoint='/api/notion-crm'+(provider==='notion'?'':'/'+provider);
        const headers={Authorization:'Bearer '+session.access_token};
        const response=await fetch(endpoint+'?source=customers',{headers,cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'고객 목록을 확인하지 못했습니다');
        const matches=(data.data?.customers as CrmRow[]||[]).filter(row=>String(row.values['이름']||'').replace(/\s/g,'')===report.name.replace(/\s/g,'')&&(String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'').slice(2,10).replace(/\D/g,''))===report.birth);
        if(matches.length>1)throw Error('동명이인의 생년월일이 같습니다 검색 결과에서 고객을 선택해 주세요');
        if(matches.length)customerId=matches[0].id;
        else{
          const created=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({action:'save',source:'customers',values:{'이름':report.name.trim(),'주민번호':report.birth}})});const result=await created.json();if(!created.ok||!result.record?.id)throw Error(result.error||'고객을 등록하지 못했습니다');customerId=result.record.id;crm?.reload();
        }
        const existing=await coverageRequest(customerId);revision=existing.revision;
        if(existing.report&&!await confirmAction('이 고객의 저장된 보장분석표를 현재 작성 내용으로 변경할까요?'))return;
        setLinkedCustomerId(customerId);setSaveRevision(revision);setCustomerSearchOpen(false);
      }
      const result=await coverageRequest(customerId,{provider:crm?.provider,customerId,revision,report:{before:report,after:afterReport,theme,design}});setSaveRevision(result.revision);setSaveMessage(`${report.name.trim()} 고객님의 보장분석표를 저장했습니다`);
    }catch(error){setError(error instanceof Error?error.message:'저장하지 못했습니다');}finally{coverageBusy.current=false;setBusy(false);}
  }
  const documentRef = useRef<HTMLDivElement>(null);
  const fullDocumentRef = useRef<HTMLDivElement>(null);
  const change = (key: keyof Omit<CoverageReport, "policies" | "overrides">, value: string) => setReport(current => ({ ...current, [key]: value }));
  const changeFieldLabel = (id:string,value:string) => setReport(current=>({...current,fieldLabels:{...current.fieldLabels,[id]:value}}));
  async function output(kind: "print" | "image", all = false) {
    const target = all ? fullDocumentRef.current : documentRef.current;
    if (!target || busy) return;
    setBusy(true); setError("");
    const filename = `${report.name.trim() || "고객"}_보장분석표`.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 80);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(target.querySelectorAll("img")).map(image=>image.decode()));
      for (const page of target.querySelectorAll<HTMLElement>(".coverage-report-page")) {
        const footer = page.querySelector(".cr-footer")!.getBoundingClientRect();
        const blocks = page.querySelectorAll(".cr-cards, .cr-note, table, .cr-savings, .cr-cover-bottom");
        if (Array.from(blocks).some(block => block.getBoundingClientRect().bottom > footer.top - 8)) throw new Error("보고서 한 장의 공간을 초과했습니다 긴 상품명이나 메모를 조금 줄여 주세요");
      }
      if (kind === "print") await printCoverageReport(target.innerHTML, filename);
      else {
        const [{ default: html2canvas }, { default: JSZip }] = await Promise.all([import("html2canvas"), import("jszip")]);
        const zip = new JSZip();
        const pages = target.querySelectorAll<HTMLElement>(".coverage-report-page");
        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", windowWidth: 1100, windowHeight: 1300, scrollX: 0, scrollY: 0,
            onclone: doc => { const capture = doc.querySelector<HTMLElement>("[data-coverage-capture]"); if (capture) capture.style.cssText = "position:absolute;top:0;left:0;width:794px;visibility:visible;"; } });
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("이미지를 생성하지 못했습니다")), "image/png"));
          zip.file(`${filename}_${String(i + 1).padStart(2, "0")}.png`, blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = `${filename}_이미지.zip`; document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "출력 중 오류가 발생했습니다 다시 시도해 주세요"); }
    finally { setBusy(false); }
  }
  const themeStyle = { ...reportDesignStyle('simple',palette.primary,palette.soft,palette.line), "--cr-name": ({yellow:"#604815",orange:"#71391f",sky:"#243f60",green:"#174b3b",gray:"#202020"} as const)[theme], "--cr-accent": palette.primary, "--cr-secondary": palette.secondary, "--cr-soft": palette.soft, "--cr-tint": palette.tint, "--cr-line":palette.line, "--cr-cover-title":palette.title, "--cr-cover-title-accent":palette.titleAccent } as React.CSSProperties;
  const pagination=pageCount>1?<nav className={styles.reportPagination} aria-label="보고서 페이지 이동"><button type="button" aria-label="이전 페이지" disabled={currentPage===0} onClick={()=>changePage(currentPage-1)}><ChevronLeft size={18}/></button><span aria-live="polite">{currentPage+1} / {pageCount}</span><button type="button" aria-label="다음 페이지" disabled={currentPage===pageCount-1} onClick={()=>changePage(currentPage+1)}><ChevronRight size={18}/></button></nav>:null;
  const splitPreview=<div ref={statusPreviewRef} className={styles.statusPreview} data-coverage-preview><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="현재 보고서 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,zoom:statusPreviewScale}}><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div>;
  const reportMenu=topNavigation?<nav className={styles.topNavigation} aria-label="보고서 종류">{([
    ['cover','표지'],['analysis','리모델링 전'],
    ['after-analysis','리모델링 후'],
    ['comparison','리모델링 보고서']
  ] as [ReportSection,string][]).map(([id,label])=><Fragment key={id}><button data-action-height="44" data-report-stage={id.startsWith('after-')?'after':id==='analysis'||id==='status'?'before':undefined} type="button" aria-pressed={reportKind===id} onClick={()=>{setPreviewOpen(false);setReportKind(id);}}>{label}</button></Fragment>)}</nav>:<nav data-unified-side-menu={topNavigation?undefined:"true"} className={topNavigation?styles.topNavigation:styles.sideMenu} aria-label="보고서 종류">{[{title:"표지",ids:["cover"]},{title:"리모델링 전",ids:["analysis"]},{title:"리모델링 후",ids:["after-analysis"]},{title:"리모델링 보고서",ids:["comparison"]}].map(group=>{const selected=group.ids.includes(reportKind),expanded=openGroups.includes(group.title);return <div key={group.title}><button data-action-height="44" type="button" aria-pressed={selected} aria-expanded={group.ids.length>1?expanded:undefined} onClick={()=>{setReportKind(group.ids[0] as ReportSection);if(group.ids.length>1)setOpenGroups(previous=>expanded?previous.filter(title=>title!==group.title):topNavigation?[group.title]:[...previous,group.title]);}}>{group.title}{group.ids.length>1&&<ChevronDown size={16} style={{transform:expanded?"rotate(180deg)":undefined}}/>}</button>{group.ids.length>1&&expanded&&<div className={styles.subMenu}>{group.ids.map(id=><button data-action-height="44" key={id} type="button" aria-current={reportKind===id?"page":undefined} onClick={()=>{setReportKind(id as ReportSection);if(topNavigation)setOpenGroups([]);}}>{id.endsWith("analysis")?"보장분석표":id.endsWith("status")?"보장현황표":id==="comparison"?"전후 비교제안서":"요약보고서"}</button>)}</div>}</div>;})}</nav>;
  return <section data-coverage-editor="true" data-top-navigation={topNavigation||undefined} data-report-cover={reportKind==="cover"} className={styles.root} style={themeStyle}>
    <style>{REPORT_CSS}</style>
    <header className={styles.toolbar}>{topNavigation?reportMenu:<h2 data-personal-tab-title="true"><ClipboardList />보장분석표</h2>}<div className={styles.actions}><div className={styles.toolbarSearch} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setToolbarSearchOpen(false);}} onKeyDown={event=>{if(event.key==='Escape')setToolbarSearchOpen(false);}}><div className={styles.toolbarSearchField}><Search size={16} aria-hidden="true"/><ClearableSearchInput data-borderless-field="true" aria-label="저장된 보장분석표 고객 검색" placeholder="고객명 · 생년월일 검색" value={toolbarSearch} disabled={busy} onClear={()=>{setToolbarSearch('');setToolbarSearchOpen(false);}} onFocus={()=>setToolbarSearchOpen(true)} onChange={event=>{setToolbarSearch(event.target.value);setToolbarSearchOpen(true);}}/></div>{toolbarSearchOpen&&toolbarSearch.trim()&&<div className={styles.toolbarSearchResults} aria-label="보장분석표 고객 검색 결과">{toolbarMatches.length?toolbarMatches.map(row=><button type="button" key={row.id} disabled={busy} onClick={()=>void selectReportCustomer(row)}><span>{String(row.values['이름']||'')}</span><span>{String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'')}</span></button>):<p>일치하는 등록 고객이 없습니다</p>}</div>}</div><button data-action-height="44" type="button" aria-label="보장분석표 초기화" title="초기화" disabled={busy} onClick={()=>void resetReport()}><RotateCcw size={20}/><span>초기화</span></button><button data-action-height="44" aria-label="고객 보장분석표 저장" title="고객 보장분석표 저장" type="button" className={`${styles.primary} ${styles.iconAction}`} disabled={busy} onClick={()=>void saveLinkedReport()}><UserRound size={20}/><span>고객저장</span></button><button data-action-height="44" aria-label="이미지 저장" title="이미지 저장" className={styles.iconAction} type="button" disabled={busy} onClick={()=>void output("image",true)}><Download size={20}/><span>이미지</span></button><button data-action-height="44" aria-label="전체 인쇄" title="전체 인쇄" className={styles.iconAction} type="button" disabled={busy} onClick={() => void output("print",true)}><Printer size={20} /><span>전체인쇄</span></button></div></header>
    {saveMessage&&<p role="status" className={styles.saveStatus}>{saveMessage}</p>}
    <div className={styles.workspace}>
      {!topNavigation&&reportMenu}
      <div className={styles.centerPanel} ref={centerRef}>

        {pageCount>1&&!reportKind.endsWith("analysis")&&pagination}
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        {reportKind.endsWith('analysis')?<CoverageReportEditor key={reportKind} onPrint={()=>void output("print")} previewOnly={previewOpen} previewContent={previewOpen?<div ref={pairPreviewRef} className={styles.previewPair}><div className={styles.previewPane} style={{height:1123*pairPreviewScale+2}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="보장분석표와 보장현황표 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div><div className={styles.previewPane} style={{height:1123*pairPreviewScale+2}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="보장분석표와 보장현황표 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={{...report,overrides:{},statusOverrides:{},statusLabels:{}}} after={{...afterReport,overrides:{},statusOverrides:{},statusLabels:{}}} kind={isAfter?'after-status':'status'}/></div></div></div>:undefined} onPreview={()=>setPreviewOpen(value=>!value)} pagination={pagination} report={activeReport} setReport={setActiveReport} page={previewOpen?Math.floor(currentPage*4/6):currentPage} onPageChange={page=>changePage(previewOpen?Math.floor(page*6/4):page)} onFieldLabelChange={changeFieldLabel}/>:reportKind==="cover"?<div className={styles.coverPreviewFrame}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="표지 인쇄" title="표지 인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className={styles.inlinePreview} data-coverage-preview><div style={{...themeStyle,zoom:previewScale}} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div></div>:<div className={styles.editor}>

      {(reportKind==="comparison"||reportKind==="summary")&&<div ref={pairPreviewRef} className={styles.previewPair}>{(["comparison","summary"] as const).map(kind=><div key={kind} className={styles.previewPane} style={{height:1123*pairPreviewScale+2,border:"1px solid #dce5f0"}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="리모델링 보고서 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={report} after={afterReport} kind={kind} currentPage={kind==="summary"?currentPage:undefined}/></div></div>)}</div>}


        </div>}
      </div>
      {reportKind==="cover"&&<aside className={styles.rightPanel} aria-label="고객 및 설계사 정보">
       <section data-ui-card="true" className={styles.identityCard}><div className={`${styles.identity} ${styles.customerIdentityPicker}`}><label><span data-field-caption="true">고객명</span><ClearableSearchInput onClear={()=>changeCustomer('name','')} aria-label="연결할 고객 이름 검색" onFocus={()=>{setCustomerSearchTarget("name");setCustomerSearchOpen(true);}} value={report.name} maxLength={30} onChange={event=>changeCustomer('name',event.target.value)}/></label><label><span data-field-caption="true">생년월일</span><ClearableSearchInput onClear={()=>changeCustomer('birth','')} aria-label="연결할 고객 생년월일 검색" onFocus={()=>{setCustomerSearchTarget("birth");setCustomerSearchOpen(true);}} inputMode="numeric" maxLength={6} value={report.birth} onChange={event=>changeCustomer('birth',event.target.value.replace(/\D/g,'').slice(0,6))}/></label>
       {customerSearchOpen&&(customerSearchTarget==="name"?!!(report.name.trim()||report.birth):!!report.name.trim())&&<div data-mini-dropdown="true" data-search-target={customerSearchTarget} className={styles.coverageCustomerResults} aria-label="고객 검색 결과">{customerMatches.length?customerMatches.map(row=>{const name=String(row.values['이름']||''),birth=String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'').slice(2,10).replace(/\D/g,'');return <button type="button" key={row.id} disabled={busy} onClick={()=>void selectReportCustomer(row)}><span>{customerSearchTarget==="name"?name:birth}</span></button>;}):<p>일치하는 등록 고객이 없습니다</p>}</div>}
       </div>{linkedCustomerId&&<p className={styles.coverageCustomerLinked}>등록된 고객을 연결했습니다</p>}</section>
       <section data-ui-card="true" className={styles.identityCard}><div className={styles.advisorFields}>{([{key:'advisor',label:'설계사'},{key:'organization',label:'소속'},{key:'phone',label:'연락처'},{key:'fax',label:'팩스'},{key:'email',label:'이메일'},{key:'date',label:'분석 기준일'}] as const).map(({key,label})=><label key={key}><span data-field-caption="true">{label}</span><ClearableSearchInput aria-label={'설계사 '+label} onClear={()=>change(key,'')} value={report[key]||''} maxLength={key==='date'?10:60} placeholder={key==='date'?'YYYY-MM-DD':undefined} onChange={event=>change(key,key==='date'?reportDateInput(event.target.value):event.target.value)}/></label>)}</div></section>
        <section data-ui-card="true" className={styles.identityCard}><h3 data-personal-card-title="true">보고서 스타일</h3><div className={styles.themePicker} aria-label="보고서 스타일">{REPORT_THEMES.map(item=><button data-color-swatch="true" key={item.id} type="button" title={item.label} aria-label={item.label} aria-pressed={theme===item.id} onClick={()=>changeReportTheme(item.id)} style={{background:item.tint}}/>)}</div></section>
        <section data-ui-card="true" className={styles.identityCard}><h3 data-personal-card-title="true">배경</h3><div className={styles.backgroundPicker}>{availableBackgrounds.map(item=><button data-report-background="true" key={item.id} type="button" aria-label={item.label} aria-pressed={(report.coverBackground||DEFAULT_REPORT_BACKGROUND)===item.id} onClick={()=>setReport(current=>({...current,coverBackground:item.id}))}><Image src={item.src} alt="" width={106} height={150} unoptimized/></button>)}</div></section>
        <section data-ui-card="true" className={`${styles.identityCard} ${styles.chartSettingsCard}`}><h3 data-personal-card-title="true">그래프 기준</h3><div className={styles.chartSettingsHeading}><button type="button" data-icon-only="true" aria-label={chartSettingsOpen?"그래프 기준 닫기":"그래프 기준 열기"} aria-expanded={chartSettingsOpen} aria-controls="coverage-chart-settings" onClick={()=>setChartSettingsOpen(open=>!open)}>{chartSettingsOpen?<X size={18}/>:<ChevronDown size={18}/>}</button></div>{chartSettingsOpen&&<div id="coverage-chart-settings" className={styles.chartTargets}>{REPORT_CHART_FIELDS.map(field=><label key={field.id}><span data-field-caption="true">{field.label}</span><ClearableSearchInput aria-label={`${field.label} 기준 금액`} inputMode="decimal" value={formatCoverageNumber(report.chartTargets?.[field.id]??DEFAULT_CHART_TARGETS[field.id])} onClear={()=>setReport(current=>({...current,chartTargets:{...current.chartTargets,[field.id]:""}}))} onChange={event=>setReport(current=>({...current,chartTargets:{...current.chartTargets,[field.id]:event.target.value.replace(/,/g,"").replace(/[^0-9.]/g,"")}}))}/></label>)}</div>}</section>

      </aside>}
    </div>
    <div className={styles.capture} data-coverage-capture ref={documentRef} aria-hidden="true"><div style={themeStyle} className="cr-book">{reportKind.endsWith("analysis")?<><CoverageReportBook before={report} after={afterReport} kind={isAfter?"after-analysis":"analysis"}/><CoverageReportBook before={{...report,overrides:{},statusOverrides:{},statusLabels:{}}} after={{...afterReport,overrides:{},statusOverrides:{},statusLabels:{}}} kind={isAfter?"after-status":"status"}/></>:(reportKind==="comparison"||reportKind==="summary")?<><CoverageReportBook before={report} after={afterReport} kind="comparison"/><CoverageReportBook before={report} after={afterReport} kind="summary"/></>:<CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/>}</div></div>
    <div className={styles.capture} aria-hidden="true" ref={fullDocumentRef}><div style={themeStyle} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind="all"/></div></div>
  </section>;
}





