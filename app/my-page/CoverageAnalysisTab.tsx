"use client";

import {useAuth} from '@/app/components/AuthProvider';
import Image from "next/image";
import useCoverageDraftSync from "./useCoverageDraftSync";
import useCoverageWorkspace from "./useCoverageWorkspace";
import CoverageReportGuide from "./CoverageReportGuide";
import CoverageCustomerList from "./CoverageCustomerList";
import {ensureCoverageCustomer} from "./coverage-customer-registration";
import {coverageSearchRows,coverageCustomerBirth} from "./coverage-customer-search";
import {supabase} from '@/lib/supabase';
import {confirmAction} from '@/components/ConfirmationHost';
import type {CrmRow} from '@/lib/notion-crm/model';
import {useCrmCalendar} from '@/app/notion-crm/CrmCalendarContext';
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, ClipboardList, Download, Printer, ChevronDown, RotateCcw, UserRound, Search, ChevronLeft, ChevronRight } from "lucide-react";
import CoverageReportBook from "./CoverageReportBook";
import CoverageReportEditor from "./CoverageReportEditor";
import { newReportPolicy, DEFAULT_CHART_TARGETS, formatCoverageNumber, reportDateInput, reportTotals, DEFAULT_REPORT_BACKGROUND, REPORT_BACKGROUNDS, REPORT_CHART_FIELDS, REPORT_THEMES, REPORT_DESIGNS, reportDesignStyle, type ReportDesign, type ReportSection, type ReportTheme, type CoverageReport } from "./coverage-report-model";
import { printCoverageReport, REPORT_CSS } from "./coverage-report-print";
import {renderReportImage} from "./report-image";
import styles from "./CoverageAnalysisTab.module.css";

export default function CoverageAnalysisTab({topNavigation=false}:{topNavigation?:boolean}={}) {
  const [customerReport, setReport] = useState<CoverageReport>(() => ({ name: "", birth: "", date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }), advisor: "", memo: "", policies: [newReportPolicy("initial")], chartTargets:{...DEFAULT_CHART_TARGETS}, overrides: {} }));
  const [advisorInfo,setAdvisorInfo]=useState({advisor:'',organization:'',phone:'',fax:'',email:'',date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})});
  const report={...customerReport,...advisorInfo};
  const crm=useCrmCalendar();
  const {authUser,authStatus,authRole}=useAuth();
  const [chartSettingsOpen,setChartSettingsOpen]=useState(false);
  const [saveRevision,setSaveRevision]=useState(0),[saveMessage,setSaveMessage]=useState('');
  const coverageLoadRun=useRef(0);
  const coverageBusy=useRef(false);
  const [toolbarSearch,setToolbarSearch]=useState('');
  const [toolbarSearchOpen,setToolbarSearchOpen]=useState(false);
  const [personalRows,setPersonalRows]=useState<CrmRow[]>([]);
  const searchRows=coverageSearchRows(personalRows,crm?.data.customers||[],crm?.provider);
  const toolbarMatches=searchRows.filter(row=>{
    const query=toolbarSearch.trim();
    const name=String(row.values['이름']||'');
    const birth=coverageCustomerBirth(row);
    const digits=query.replace(/[-.\s]/g,'');
    return query&&(name.includes(query)||(/^\d+$/.test(digits)&&birth.includes(digits)));
  });
  const [customerSearchTarget,setCustomerSearchTarget]=useState<"name"|"birth">("name");
  const [customerSearchOpen,setCustomerSearchOpen]=useState(false),[linkedCustomerId,setLinkedCustomerId]=useState('');
  const customerPickerRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!customerSearchOpen)return;
    const closeOutside=(event:PointerEvent)=>{if(event.target instanceof Node&&!customerPickerRef.current?.contains(event.target))setCustomerSearchOpen(false);};
    document.addEventListener('pointerdown',closeOutside,true);
    return()=>document.removeEventListener('pointerdown',closeOutside,true);
  },[customerSearchOpen]);
  const customerMatches=searchRows.filter(row=>{
    const name=String(row.values['이름']||''),birth=coverageCustomerBirth(row);
    return (report.name.trim()||report.birth)&&name.includes(report.name.trim())&&birth.startsWith(report.birth);
  });
  const [syncIdentity,setSyncIdentity]=useState<{name:string;birth:string}|null>(null);
  useEffect(()=>{
    if(!report.name.trim()||!/^\d{6}$/.test(report.birth))return;
    const timer=setTimeout(()=>setSyncIdentity(current=>current?.name===report.name.trim()&&current?.birth===report.birth?current:{name:report.name.trim(),birth:report.birth}),700);
    return()=>clearTimeout(timer);
  },[report.name,report.birth]);
  const changeCustomer=(key:'name'|'birth',value:string)=>{setSyncIdentity(null);setCustomerSearchTarget(key);setReport(current=>({...current,[key]:value}));setLinkedCustomerId('');setSaveRevision(0);setSaveMessage('');++coverageLoadRun.current;setCustomerSearchOpen(true);};
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
  const draftKey=authUser?.id||null;
  useLayoutEffect(()=>{setSyncIdentity(null);setLinkedCustomerId('');setSaveRevision(0);setSaveMessage('');setToolbarSearch('');setTheme('sky');setDesign('simple');setReport({name:'',birth:'',date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}),advisor:'',memo:'',policies:[newReportPolicy('initial')],chartTargets:{...DEFAULT_CHART_TARGETS},overrides:{}});setAfter({name:'',birth:'',date:'',advisor:'',memo:'',policies:[newReportPolicy('after-initial')],overrides:{}});},[authUser?.id]);
  const syncOwner=authUser&&(authStatus==='approved'||authRole==='admin')?authUser.id:undefined;
  useEffect(()=>{setAdvisorInfo({advisor:'',organization:'',phone:'',fax:'',email:'',date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})});},[syncOwner]);
  const advisorSync=useCoverageDraftSync(syncOwner,{before:{name:'',birth:'',memo:'',policies:[newReportPolicy('advisor-settings')],overrides:{},...advisorInfo},after:{name:'',birth:'',advisor:'',date:'',memo:'',policies:[newReportPolicy('advisor-settings-after')],overrides:{}},theme:'sky',design:'simple',customerId:'',revision:0,provider:'personal',previewOpen:false,reportKind:'cover'},draft=>setAdvisorInfo({advisor:draft.before.advisor||'',organization:draft.before.organization||'',phone:draft.before.phone||'',fax:draft.before.fax||'',email:draft.before.email||'',date:draft.before.date||''}),'advisor');
  const draftSync=useCoverageDraftSync(syncOwner,{before:{...customerReport,advisor:'',organization:'',phone:'',fax:'',email:'',date:''},after,theme,design,customerId:linkedCustomerId,revision:saveRevision,provider:crm?.provider||'personal',previewOpen,reportKind},(draft,restoreIdentity)=>{
    setReport(current=>({...draft.before,...(!restoreIdentity?{name:current.name,birth:current.birth}:{}),chartTargets:{...DEFAULT_CHART_TARGETS,...draft.before.chartTargets}}));setAfter(draft.after);setTheme(draft.theme);setDesign(draft.design||'simple');
    if(restoreIdentity){setLinkedCustomerId(draft.customerId);setSaveRevision(draft.revision);setToolbarSearch(draft.before.name);}
  },syncIdentity?{...syncIdentity,documentId:linkedCustomerId&&!linkedCustomerId.startsWith('personal:')?(crm?.provider||'')+':'+linkedCustomerId:undefined}:null);
  useCoverageWorkspace(authUser?.id||'guest',{draft:{before:{...customerReport,advisor:'',organization:'',phone:'',fax:'',email:'',date:''},after,theme,design,customerId:linkedCustomerId,revision:saveRevision,provider:crm?.provider||'personal',previewOpen,reportKind},kind:reportKind,preview:previewOpen,groups:openGroups,pages:pagesByKind},saved=>{
    setReport({...saved.draft.before,chartTargets:{...DEFAULT_CHART_TARGETS,...saved.draft.before.chartTargets}});setAfter(saved.draft.after);setTheme(saved.draft.theme);setDesign(saved.draft.design||'simple');setLinkedCustomerId(saved.draft.customerId);setSaveRevision(saved.draft.revision);setToolbarSearch(saved.draft.before.name);
    setReportKind(saved.kind);setPreviewOpen(saved.preview);setOpenGroups(saved.groups);setPagesByKind(saved.pages);
    setSyncIdentity(saved.draft.before.name.trim()&&/^\d{6}$/.test(saved.draft.before.birth)?{name:saved.draft.before.name.trim(),birth:saved.draft.before.birth}:null);
  });
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
    if(customerId.startsWith('personal:'))return personalRequest('?id='+encodeURIComponent(customerId.slice(9)),body);
    const provider=crm?.provider;if(!provider)throw Error('고객 저장소에 연결해 주세요');
    const response=await fetch('/api/coverage-reports/linked'+(body?'':'?provider='+provider+'&customerId='+encodeURIComponent(customerId)),{method:body?'PUT':'GET',cache:'no-store',headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'보장분석표를 처리하지 못했습니다');return result;
  }
  async function personalRequest(query='',body?:unknown){const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('로그인 후 저장해 주세요');const response=await fetch('/api/coverage-reports/personal'+(body?'':query),{method:body?'PUT':'GET',cache:'no-store',headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw Error(result.error||'보장분석표를 처리하지 못했습니다');return result;}
  async function refreshPersonal(){const result=await personalRequest();setPersonalRows(result.reports.map((item:{id:string;name:string;birth:string;linkedCustomerId?:string;linkedProvider?:string})=>({id:'personal:'+item.id,edited:'',values:{'이름':item.name,'주민번호':item.birth,__linkedCustomerId:item.linkedCustomerId||'',__linkedProvider:item.linkedProvider||''}} as CrmRow)));}
  useEffect(()=>{let cancelled=false;setPersonalRows([]);if(!authUser)return;void personalRequest().then(result=>{if(!cancelled)setPersonalRows(result.reports.map((item:{id:string;name:string;birth:string;linkedCustomerId?:string;linkedProvider?:string})=>({id:'personal:'+item.id,edited:'',values:{'이름':item.name,'주민번호':item.birth,__linkedCustomerId:item.linkedCustomerId||'',__linkedProvider:item.linkedProvider||''}} as CrmRow)));}).catch(()=>{});return()=>{cancelled=true;};},[draftKey,authUser?.id]);
  async function savedCustomerIds(){
    await refreshPersonal();
    const personal=await personalRequest();
    const ids=personal.reports.map((item:{id:string})=>'personal:'+item.id);
    if(crm?.provider){const {data:{session}}=await supabase.auth.getSession();const response=await fetch('/api/coverage-reports/linked?list=1&provider='+crm.provider,{headers:{Authorization:'Bearer '+session?.access_token},cache:'no-store'});const result=await response.json();if(!response.ok)throw Error(result.error);ids.push(...result.ids);}
    return ids;
  }
  async function deleteCustomerReport(row:CrmRow){
    if(!await confirmAction(`${String(row.values['이름']||'')} 고객의 저장된 보장분석 리포트를 삭제할까요?\n고객관리의 고객 정보는 유지됩니다`,{title:'삭제 확인',confirmLabel:'삭제'}))return false;
    const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('로그인 후 다시 시도해 주세요');
    const personal=row.id.startsWith('personal:');
    const urls=personal?['/api/coverage-reports/personal?id='+encodeURIComponent(row.id.slice(9))]:['/api/coverage-reports/linked?provider='+crm?.provider+'&customerId='+encodeURIComponent(row.id),...personalRows.filter(item=>item.values.__linkedCustomerId===row.id&&item.values.__linkedProvider===crm?.provider).map(item=>'/api/coverage-reports/personal?id='+encodeURIComponent(item.id.slice(9)))];
    for(const url of urls){const response=await fetch(url,{method:'DELETE',headers:{Authorization:'Bearer '+session.access_token}});if(!response.ok)throw Error((await response.json()).error||'리포트를 삭제하지 못했습니다');}
    const normalizedName=String(row.values['이름']||'').trim().normalize('NFC').replace(/\s/g,''),birth=coverageCustomerBirth(row);
    try{const scope=JSON.stringify([normalizedName,birth,personal?'':(crm?.provider||'')+':'+row.id]);localStorage.removeItem('coverage-cloud-draft:v2:'+session.user.id+':'+scope);}catch{}
    if(linkedCustomerId===row.id||(!linkedCustomerId&&report.name.trim().normalize('NFC').replace(/\s/g,'')===normalizedName&&report.birth===birth)){
      ++coverageLoadRun.current;setLinkedCustomerId('');setSaveRevision(0);setSyncIdentity(null);setToolbarSearch('');setCustomerSearchOpen(false);
      setReport({name:'',birth:'',advisor:'',date:'',memo:'',policies:[newReportPolicy('initial')],chartTargets:{...DEFAULT_CHART_TARGETS},overrides:{}});
      setAfter({name:'',birth:'',advisor:'',date:'',memo:'',policies:[newReportPolicy('after-initial')],overrides:{}});setSaveMessage('저장된 리포트를 삭제했습니다');
    }
    await refreshPersonal();window.dispatchEvent(new Event('coverage-reports-changed'));return true;
  }
  async function selectReportCustomer(row:CrmRow,fromCustomerLink=false){
    if(coverageBusy.current)return;
    if(!fromCustomerLink&&(linkedCustomerId||report.policies.some(policy=>policy.insurer||policy.product||policy.premium||Object.keys(policy.amounts).length))&&!await confirmAction('작성 중인 내용 대신 선택한 고객의 보장분석표를 불러올까요?'))return;
    const run=++coverageLoadRun.current;coverageBusy.current=true;setBusy(true);setError('');setSaveMessage('');
    try{
      const result=await coverageRequest(row.id);if(run!==coverageLoadRun.current)return;
      const name=String(row.values['이름']||''),birth=coverageCustomerBirth(row);
      if(result.report){setReport({...result.report.before,name,birth,chartTargets:{...DEFAULT_CHART_TARGETS,...result.report.before.chartTargets}});setAfter(result.report.after);setTheme(result.report.theme);setDesign(result.report.design||'simple');setPagesByKind({});}
      else{setReport(current=>({...current,name,birth,policies:[newReportPolicy('initial')],chartTargets:{...DEFAULT_CHART_TARGETS},overrides:{},statusOverrides:{},statusLabels:{}}));setAfter(current=>({...current,policies:[newReportPolicy('after-initial')],overrides:{},statusOverrides:{},statusLabels:{}}));}
      setSyncIdentity({name,birth});setToolbarSearch(name);setToolbarSearchOpen(false);setLinkedCustomerId(row.id);setSaveRevision(result.revision);setCustomerSearchOpen(false);setSaveMessage(result.report?'저장된 보장분석표를 불러왔습니다':'고객 연결됨 · 작성 후 저장해 주세요');
    }catch(error){setError(error instanceof Error?error.message:'불러오지 못했습니다');}finally{coverageBusy.current=false;setBusy(false);}
  }
  const reportLinkRun=useRef('');
  useEffect(()=>{
    if(!syncOwner||!crm?.provider)return;
    const id=new URLSearchParams(window.location.search).get('reportCustomer');if(!id)return;
    const row=crm.data.customers.find(item=>item.id===id);if(!row)return;
    const key=syncOwner+':'+crm.provider+':'+id;if(reportLinkRun.current===key)return;
    reportLinkRun.current=key;void selectReportCustomer(row,true);
  },[syncOwner,crm?.provider,crm?.data.customers]);
  async function resetReport(){
    if(coverageBusy.current||busy)return;
    if(!await confirmAction('고객 정보와 분석 내용을 초기화할까요?\n설계사 정보와 저장된 리포트는 유지됩니다',{title:'초기화',confirmLabel:'확인'}))return;
    ++coverageLoadRun.current;
    setSyncIdentity(null);
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
      const previousPersonalId=linkedCustomerId.startsWith('personal:')?linkedCustomerId.slice(9):'';
      if(crm?.provider&&crm.provider!=='native'&&(!customerId||customerId.startsWith('personal:'))){
        const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('로그인 후 저장해 주세요');
        const registered=personalRows.find(row=>row.id===linkedCustomerId&&row.values.__linkedProvider===crm.provider);
        const customer=await ensureCoverageCustomer(crm.provider,session.access_token,report.name,report.birth,registered?String(registered.values.__linkedCustomerId||'')||undefined:undefined);
        if(customer){
          customerId=customer.id;setLinkedCustomerId(customerId);crm.reload();
          const existing=await coverageRequest(customerId);revision=existing.revision;setSaveRevision(revision);
          if(existing.report&&!await confirmAction('같은 이름·생년월일로 저장된 보장분석표를 현재 내용으로 변경할까요?'))return;
        }
      }
      if(!customerId||customerId.startsWith('personal:')){
        if(!customerId){const existing=await personalRequest('?name='+encodeURIComponent(report.name.trim())+'&birth='+encodeURIComponent(report.birth));revision=existing.revision;if(existing.report&&!await confirmAction('같은 이름·생년월일로 저장된 보장분석표를 현재 내용으로 변경할까요?'))return;}
        const result=await personalRequest('',{revision,report:{before:report,after:afterReport,theme,design}});
        setLinkedCustomerId('personal:'+result.id);setSaveRevision(result.revision);setCustomerSearchOpen(false);setSaveMessage(`${report.name.trim()} 고객님의 보장분석표를 내 계정에 저장했습니다`);await refreshPersonal();
      }else{const result=await coverageRequest(customerId,{provider:crm?.provider,customerId,revision,report:{before:report,after:afterReport,theme,design}});setSaveRevision(result.revision);setSaveMessage(`${report.name.trim()} 고객님의 보장분석표를 저장했습니다`);}

      if(previousPersonalId&&customerId&&!customerId.startsWith('personal:')&&crm?.provider){
        const {data:{session}}=await supabase.auth.getSession();
        const response=await fetch('/api/coverage-reports/personal',{method:'PATCH',headers:{Authorization:'Bearer '+session?.access_token,'Content-Type':'application/json'},body:JSON.stringify({id:previousPersonalId,provider:crm.provider,customerId})});
        if(!response.ok)throw Error((await response.json()).error||'리포트는 저장했지만 기존 항목 연결을 완료하지 못했습니다');
        await refreshPersonal();
      }
      window.dispatchEvent(new Event('coverage-reports-changed'));
      setSyncIdentity({name:report.name.trim(),birth:report.birth});
    }catch(error){setError(error instanceof Error?error.message:'저장하지 못했습니다');}finally{coverageBusy.current=false;setBusy(false);}
  }
  const documentRef = useRef<HTMLDivElement>(null);
  const fullDocumentRef = useRef<HTMLDivElement>(null);
  const [imageProgress,setImageProgress]=useState('');
  const change = (key: keyof Omit<CoverageReport, "policies" | "overrides">, value: string) => {if(['advisor','organization','phone','fax','email','date'].includes(key))setAdvisorInfo(current=>({...current,[key]:value}));else setReport(current => ({ ...current, [key]: value }));};
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
        const {default:JSZip}=await import("jszip");
        const zip = new JSZip();
        const pages = target.querySelectorAll<HTMLElement>(".coverage-report-page");
        for (let i = 0; i < pages.length; i++) {
          setImageProgress(`${i+1}/${pages.length}`);
          await new Promise(resolve=>window.setTimeout(resolve,0));
          const canvas = await renderReportImage(pages[i],REPORT_CSS);
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("이미지를 생성하지 못했습니다")), "image/png"));
          canvas.width=canvas.height=0;
          zip.file(`${filename}_${String(i + 1).padStart(2, "0")}.png`, blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = `${filename}_이미지.zip`; document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "출력 중 오류가 발생했습니다 다시 시도해 주세요"); }
    finally { setBusy(false);setImageProgress(''); }
  }
  const themeStyle = { ...reportDesignStyle('simple',palette.primary,palette.soft,palette.line), "--cr-name": ({yellow:"#604815",orange:"#71391f",sky:"#243f60",green:"#174b3b",gray:"#202020"} as const)[theme], "--cr-accent": palette.primary, "--cr-secondary": palette.secondary, "--cr-soft": palette.soft, "--cr-tint": palette.tint, "--cr-line":palette.line, "--cr-cover-title":palette.title, "--cr-cover-title-accent":palette.titleAccent } as React.CSSProperties;
  const pagination=pageCount>1?<nav className={styles.reportPagination} aria-label="보고서 페이지 이동"><button type="button" aria-label="이전 페이지" disabled={currentPage===0} onClick={()=>changePage(currentPage-1)}><ChevronLeft size={18}/></button><span aria-live="polite">{currentPage+1} / {pageCount}</span><button type="button" aria-label="다음 페이지" disabled={currentPage===pageCount-1} onClick={()=>changePage(currentPage+1)}><ChevronRight size={18}/></button></nav>:null;
  const splitPreview=<div ref={statusPreviewRef} className={styles.statusPreview} data-coverage-preview><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="현재 보고서 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,zoom:statusPreviewScale}}><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div>;
  const reportMenu=topNavigation?<nav className={styles.topNavigation} aria-label="보고서 종류">{([
    ['cover','표지'],['analysis','리모델링 전'],
    ['after-analysis','리모델링 후'],
    ['comparison','리모델링 보고서']
  ] as [ReportSection,string][]).map(([id,label])=><Fragment key={id}><button data-action-height="44" data-report-stage={id.startsWith('after-')?'after':id==='analysis'||id==='status'?'before':undefined} type="button" aria-pressed={reportKind===id} onClick={()=>{setPreviewOpen(false);setReportKind(id);}}>{label}</button></Fragment>)}</nav>:<nav data-unified-side-menu={topNavigation?undefined:"true"} className={topNavigation?styles.topNavigation:styles.sideMenu} aria-label="보고서 종류">{[{title:"표지",ids:["cover"]},{title:"리모델링 전",ids:["analysis"]},{title:"리모델링 후",ids:["after-analysis"]},{title:"리모델링 보고서",ids:["comparison"]}].map(group=>{const selected=group.ids.includes(reportKind),expanded=openGroups.includes(group.title);return <div key={group.title}><button data-action-height="44" type="button" aria-pressed={selected} aria-expanded={group.ids.length>1?expanded:undefined} onClick={()=>{setReportKind(group.ids[0] as ReportSection);if(group.ids.length>1)setOpenGroups(previous=>expanded?previous.filter(title=>title!==group.title):topNavigation?[group.title]:[...previous,group.title]);}}>{group.title}{group.ids.length>1&&<ChevronDown size={16} style={{transform:expanded?"rotate(180deg)":undefined}}/>}</button>{group.ids.length>1&&expanded&&<div className={styles.subMenu}>{group.ids.map(id=><button data-action-height="44" key={id} type="button" aria-current={reportKind===id?"page":undefined} onClick={()=>{setReportKind(id as ReportSection);if(topNavigation)setOpenGroups([]);}}>{id.endsWith("analysis")?"보장분석표":id.endsWith("status")?"보장현황표":id==="comparison"?"전후 비교제안서":"요약보고서"}</button>)}</div>}</div>;})}</nav>;
  return <section onInputCapture={()=>{draftSync.onInput();advisorSync.onInput();}} data-coverage-editor="true" data-top-navigation={topNavigation||undefined} data-report-cover={reportKind==="cover"} className={styles.root} style={themeStyle}>
    <style>{REPORT_CSS}</style>
    <header className={styles.toolbar}>{topNavigation?reportMenu:<h2 data-personal-tab-title="true"><ClipboardList />보장분석 리포트</h2>}<div className={styles.actions}><div className={styles.toolbarSearchRow}><CoverageCustomerList rows={searchRows} loadSaved={savedCustomerIds} remove={deleteCustomerReport} select={selectReportCustomer}/><CoverageReportGuide/><div className={styles.toolbarSearch} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setToolbarSearchOpen(false);}} onKeyDown={event=>{if(event.key==='Escape')setToolbarSearchOpen(false);}}><div className={styles.toolbarSearchField}><Search size={16} aria-hidden="true"/><ClearableSearchInput data-borderless-field="true" aria-label="저장된 보장분석표 고객 검색" placeholder="고객명 · 생년월일 검색" value={toolbarSearch} disabled={busy} onClear={()=>{setToolbarSearch('');setToolbarSearchOpen(false);}} onFocus={()=>setToolbarSearchOpen(true)} onChange={event=>{setToolbarSearch(event.target.value);setToolbarSearchOpen(true);}}/></div>{toolbarSearchOpen&&toolbarSearch.trim()&&<div className={styles.toolbarSearchResults} aria-label="보장분석표 고객 검색 결과">{toolbarMatches.length?toolbarMatches.map(row=><button type="button" key={row.id} data-customer-registered={!row.id.startsWith('personal:')} title={row.id.startsWith('personal:')?'고객관리 미등록 · 리포트만 저장':'고객관리 등록 고객'} disabled={busy} onClick={()=>void selectReportCustomer(row)}><span>{String(row.values['이름']||'')}</span><span>{String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,6)||String(row.values['생년월일']||'')}</span></button>):<p>일치하는 고객 또는 저장된 보장분석표가 없습니다</p>}</div>}</div></div><button data-action-height="44" type="button" aria-label="보장분석표 초기화" title="초기화" disabled={busy} onClick={()=>void resetReport()}><RotateCcw size={20}/><span>초기화</span></button><button data-action-height="44" aria-label="고객 보장분석표 저장" title="고객 보장분석표 저장" type="button" className={`${styles.primary} ${styles.iconAction}`} disabled={busy} onClick={()=>void saveLinkedReport()}><UserRound size={20}/><span>고객저장</span></button><button data-action-height="44" aria-label="이미지 저장" title="이미지 저장" className={styles.iconAction} type="button" disabled={busy} onClick={()=>void output("image",true)}><Download size={20}/><span>{imageProgress||'이미지'}</span></button><button data-action-height="44" aria-label="전체 인쇄" title="전체 인쇄" className={styles.iconAction} type="button" disabled={busy} onClick={() => void output("print",true)}><Printer size={20} /><span>전체인쇄</span></button></div></header>
    {syncOwner&&advisorSync.error&&<div className={styles.draftSync} role="status" data-error="true"><span>설계사 정보: {advisorSync.message}</span><button type="button" onClick={advisorSync.retry}>다시 연결</button></div>}
    {syncOwner&&draftSync.error&&<div className={styles.draftSync} role="status" data-error={draftSync.error||undefined}><span>{draftSync.message}</span>{draftSync.conflict?<><button type="button" onClick={draftSync.useRemote}>다른 화면 내용 불러오기</button><button type="button" onClick={draftSync.keepLocal}>현재 내용으로 저장</button></>:draftSync.error&&<button type="button" onClick={draftSync.retry}>다시 연결</button>}</div>}
    {saveMessage&&<p role="status" className={styles.saveStatus}>{saveMessage}</p>}
    <div className={styles.workspace}>
      {!topNavigation&&reportMenu}
      <div className={styles.centerPanel} ref={centerRef}>

        {pageCount>1&&!reportKind.endsWith("analysis")&&pagination}
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        {reportKind.endsWith('analysis')?<CoverageReportEditor key={(authUser?.id||'guest')+':'+reportKind} onPrint={()=>void output("print")} previewOnly={previewOpen} previewContent={previewOpen?<div ref={pairPreviewRef} className={styles.previewPair}><div className={styles.previewPane} style={{height:1123*pairPreviewScale+2}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="보장분석표와 보장현황표 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div><div className={styles.previewPane} style={{height:1123*pairPreviewScale+2}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="보장분석표와 보장현황표 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={{...report,overrides:{},statusOverrides:{},statusLabels:{}}} after={{...afterReport,overrides:{},statusOverrides:{},statusLabels:{}}} kind={isAfter?'after-status':'status'}/></div></div></div>:undefined} onPreview={()=>setPreviewOpen(value=>!value)} pagination={pagination} report={activeReport} setReport={setActiveReport} page={previewOpen?Math.floor(currentPage*4/6):currentPage} onPageChange={page=>changePage(previewOpen?Math.floor(page*6/4):page)} onFieldLabelChange={changeFieldLabel}/>:reportKind==="cover"?<div className={styles.coverPreviewFrame}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="표지 인쇄" title="표지 인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className={styles.inlinePreview} data-coverage-preview><div style={{...themeStyle,zoom:previewScale}} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/></div></div></div>:<div className={styles.editor}>

      {(reportKind==="comparison"||reportKind==="summary")&&<div ref={pairPreviewRef} className={styles.previewPair}>{(["comparison","summary"] as const).map(kind=><div key={kind} className={styles.previewPane} style={{height:1123*pairPreviewScale+2,border:"1px solid #dce5f0"}}><button type="button" data-icon-only="true" className={styles.coverPrint} aria-label="리모델링 보고서 인쇄" title="인쇄" disabled={busy} onClick={()=>void output("print")}><Printer size={20}/></button><div className="cr-book" style={{...themeStyle,transform:`scale(${pairPreviewScale})`,transformOrigin:"top left"}}><CoverageReportBook before={report} after={afterReport} kind={kind} currentPage={kind==="summary"?currentPage:undefined}/></div></div>)}</div>}


        </div>}
      </div>
      {reportKind==="cover"&&<aside className={styles.rightPanel} aria-label="고객 및 설계사 정보">
       <section data-ui-card="true" className={styles.identityCard}><div ref={customerPickerRef} className={`${styles.identity} ${styles.customerIdentityPicker}`} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setCustomerSearchOpen(false);}} onKeyDown={event=>{if(event.key==="Escape")setCustomerSearchOpen(false);}}><label><span data-field-caption="true">고객명</span><ClearableSearchInput onClear={()=>changeCustomer('name','')} aria-label="연결할 고객 이름 검색" onFocus={()=>{setCustomerSearchTarget("name");setCustomerSearchOpen(true);}} value={report.name} maxLength={30} onChange={event=>changeCustomer('name',event.target.value)}/></label><label><span data-field-caption="true">생년월일</span><ClearableSearchInput onClear={()=>changeCustomer('birth','')} aria-label="연결할 고객 생년월일 검색" onFocus={()=>{setCustomerSearchTarget("birth");setCustomerSearchOpen(true);}} inputMode="numeric" maxLength={6} value={report.birth} onChange={event=>changeCustomer('birth',event.target.value.replace(/\D/g,'').slice(0,6))}/></label>
       {customerSearchOpen&&(customerSearchTarget==="name"?!!(report.name.trim()||report.birth):!!report.name.trim())&&<div data-mini-dropdown="true" data-search-target={customerSearchTarget} className={styles.coverageCustomerResults} aria-label="고객 검색 결과">{customerMatches.length?customerMatches.map(row=>{const name=String(row.values['이름']||''),birth=coverageCustomerBirth(row);return <button type="button" key={row.id} data-customer-registered={!row.id.startsWith('personal:')} title={row.id.startsWith('personal:')?'고객관리 미등록 · 리포트만 저장':'고객관리 등록 고객'} disabled={busy} onClick={()=>void selectReportCustomer(row)}><span>{customerSearchTarget==="name"?name:birth}</span></button>;}):<p>일치하는 고객 또는 저장된 보장분석표가 없습니다</p>}</div>}
       </div>{linkedCustomerId&&<p className={styles.coverageCustomerLinked}>{linkedCustomerId.startsWith('personal:')?'계정에 저장된 리포트를 선택했습니다':'고객관리에 등록된 고객을 연결했습니다'}</p>}</section>
       <section data-ui-card="true" className={styles.identityCard}><div className={styles.advisorFields}>{([{key:'advisor',label:'설계사'},{key:'organization',label:'소속'},{key:'phone',label:'연락처'},{key:'fax',label:'팩스'},{key:'email',label:'이메일'},{key:'date',label:'분석 기준일'}] as const).map(({key,label})=><label key={key}><span data-field-caption="true">{label}</span><ClearableSearchInput aria-label={'설계사 '+label} onClear={()=>change(key,'')} value={report[key]||''} maxLength={key==='date'?10:60} placeholder={key==='date'?'YYYY-MM-DD':undefined} onChange={event=>change(key,key==='date'?reportDateInput(event.target.value):event.target.value)}/></label>)}</div></section>
        <section data-ui-card="true" className={styles.identityCard}><h3 data-personal-card-title="true">보고서 스타일</h3><div className={styles.themePicker} aria-label="보고서 스타일">{REPORT_THEMES.map(item=><button data-color-swatch="true" key={item.id} type="button" title={item.label} aria-label={item.label} aria-pressed={theme===item.id} onClick={()=>changeReportTheme(item.id)} style={{background:item.tint}}/>)}</div></section>
        <section data-ui-card="true" className={styles.identityCard}><h3 data-personal-card-title="true">배경</h3><div className={styles.backgroundPicker}>{availableBackgrounds.map(item=><button data-report-background="true" key={item.id} type="button" aria-label={item.label} aria-pressed={(report.coverBackground||DEFAULT_REPORT_BACKGROUND)===item.id} onClick={()=>setReport(current=>({...current,coverBackground:item.id}))}><Image src={item.src} alt="" width={106} height={150} unoptimized/></button>)}</div></section>
        <section data-ui-card="true" className={`${styles.identityCard} ${styles.chartSettingsCard}`}><div className={styles.chartSettingsHeading}><h3 data-personal-card-title="true">그래프 기준</h3><button type="button" data-icon-only="true" aria-label={chartSettingsOpen?"그래프 기준 닫기":"그래프 기준 열기"} aria-expanded={chartSettingsOpen} aria-controls="coverage-chart-settings" onClick={()=>setChartSettingsOpen(open=>!open)}>{chartSettingsOpen?<X size={18}/>:<ChevronDown size={18}/>}</button></div>{chartSettingsOpen&&<div id="coverage-chart-settings" className={styles.chartTargets}>{REPORT_CHART_FIELDS.map(field=><label key={field.id}><span data-field-caption="true">{field.label}</span><ClearableSearchInput aria-label={`${field.label} 기준 금액`} inputMode="decimal" value={formatCoverageNumber(report.chartTargets?.[field.id]??DEFAULT_CHART_TARGETS[field.id])} onClear={()=>setReport(current=>({...current,chartTargets:{...current.chartTargets,[field.id]:""}}))} onChange={event=>setReport(current=>({...current,chartTargets:{...current.chartTargets,[field.id]:event.target.value.replace(/,/g,"").replace(/[^0-9.]/g,"")}}))}/></label>)}</div>}</section>

      </aside>}
    </div>
    <div className={styles.capture} data-coverage-capture ref={documentRef} aria-hidden="true"><div style={themeStyle} className="cr-book">{reportKind.endsWith("analysis")?<><CoverageReportBook before={report} after={afterReport} kind={isAfter?"after-analysis":"analysis"}/><CoverageReportBook before={{...report,overrides:{},statusOverrides:{},statusLabels:{}}} after={{...afterReport,overrides:{},statusOverrides:{},statusLabels:{}}} kind={isAfter?"after-status":"status"}/></>:(reportKind==="comparison"||reportKind==="summary")?<><CoverageReportBook before={report} after={afterReport} kind="comparison"/><CoverageReportBook before={report} after={afterReport} kind="summary"/></>:<CoverageReportBook before={report} after={afterReport} kind={reportKind} currentPage={currentPage}/>}</div></div>
    <div className={styles.capture} data-coverage-capture="all" aria-hidden="true" ref={fullDocumentRef}><div style={themeStyle} className="cr-book"><CoverageReportBook before={report} after={afterReport} kind="all"/></div></div>
  </section>;
}







