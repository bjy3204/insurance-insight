"use client";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import PolicyInsertsIcon from "@/app/components/PolicyInsertsIcon";


import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CustomSelect from "@/app/components/CustomSelect";
import PolicyInsertsTools from "./PolicyInsertsTools";
import { Download, Plus, X, ArrowLeft, Printer, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { MAX_CUSTOMERS, TEMPLATES, templatePages, type TemplateId, type PetKind, petDecorationHtml, overlayHtml, printDocument, printJobs, type Advisor } from "./model";
import styles from "./page.module.css";
import {policyInsertImage} from "./image-cache";
import { captureNoticeImage } from "@/lib/capture-claim-notice";

const categories = [{ id: "family", label: "가정의달" }, { id: "summer", label: "여름휴가철" }, { id: "driver", label: "운전자보험" }, { id: "care", label: "재가보험" }, { id: "pet", label: "펫보험" }];


export default function PolicyInsertsEditor({ embedded = false, compactNavigation = true }: { embedded?: boolean; compactNavigation?: boolean }) {
  const { authUser, authStatus, authRole, authLoading } = useAuth();
  const allowed = !!authUser && (authStatus === "approved" || authRole === "admin");
  const [category, setCategory] = useState<TemplateId>("family");
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const nameField = useRef<HTMLInputElement>(null);
  const [namesOwner, setNamesOwner] = useState<string | null>(null);
  const [advisor, setAdvisor] = useState<Advisor>({ name: "", company: "", phone: "", fax: "" });
  const [advisorDraft, setAdvisorDraft] = useState<Advisor>({ name: "", company: "", phone: "", fax: "" });
  const [advisorError, setAdvisorError] = useState("");
  const [advisorCollapsed, setAdvisorCollapsed] = useState(false);
  const advisorSaveQueue = useRef(Promise.resolve());
  const [advisorLoaded, setAdvisorLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [customerIndex, setCustomerIndex] = useState(0);
  const [selected, setSelected] = useState(TEMPLATES.family.titles.map((_, index) => index + 1));
  const [petKind, setPetKind] = useState<PetKind>("dog");
  const [petIcons, setPetIcons] = useState<Record<PetKind, string>>({ dog: "", cat: "" });
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const printFrames = useRef(new Set<HTMLIFrameElement>());

  const currentName = names[Math.min(customerIndex, Math.max(0, names.length - 1))] || "";
  const titles = TEMPLATES[category].titles;
  const pages = templatePages(category, petKind);
  const allPages = pages.map(item => item.page);
  const pageCount = pages.length;
  const pageIndex = Math.max(0, pages.findIndex(item => item.page === page));
  const ready = !loading && allPages.every(number => !!images[number]) && (category !== "pet" || !!petIcons[petKind]);

  useEffect(() => {
    if (!authUser?.id || !allowed) return;
    let restored: string[] = [];
    try {
      const raw = localStorage.getItem(`policy-inserts:customers:${authUser.id}`);
      const saved: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(saved)) restored = saved.filter((name): name is string => typeof name === "string" && !!name.trim()).slice(0, MAX_CUSTOMERS).map(name => name.trim().slice(0, 30));
    } catch { /* Start with an empty list if browser storage is unavailable. */ }
    setNames(restored); setCustomerIndex(0); setNamesOwner(authUser.id);
  }, [authUser?.id, allowed]);

  useEffect(() => {
    if (!authUser?.id || namesOwner !== authUser.id || !allowed) return;
    try { localStorage.setItem(`policy-inserts:customers:${authUser.id}`, JSON.stringify(names)); } catch { /* Editing still works if browser storage is unavailable. */ }
  }, [names, namesOwner, authUser?.id, allowed]);

  useEffect(() => {
    if (!allowed || !authUser?.id) return;
    let active = true;
    void (async () => {
      const { data, error } = await supabase.from("policy_insert_advisors").select("name,company,phone,fax").eq("user_id", authUser.id).maybeSingle();
      if (!active) return;
      if (error) { setAdvisorError("설계사 정보를 불러오지 못했습니다 저장 설정을 확인한 뒤 다시 시도해 주세요"); return; }
      let info: Advisor = { name: "", company: "", phone: "", fax: "" };
      if (data) info = data;
      else {
        // Keep previously entered browser values available for their first cloud save.
        try {
          const raw = localStorage.getItem(`policy-inserts:advisor:${authUser.id}`);
          const saved = raw ? JSON.parse(raw) : {};
          info = Object.fromEntries(["name", "company", "phone", "fax"].map(key => [key, typeof saved?.[key] === "string" ? saved[key].slice(0, key === "company" ? 40 : 30) : ""])) as Advisor;
        } catch { /* No legacy browser values. */ }
      }
      setAdvisor(info); setAdvisorDraft(info); setAdvisorLoaded(true); setAdvisorError("");
      try { setAdvisorCollapsed(localStorage.getItem("policy-inserts:advisor-collapsed") === "true"); } catch { /* Browser storage may be unavailable. */ }
    })();
    return () => { active = false; };
  }, [allowed, authUser?.id]);

  function addCustomer() {
    const name = nameInput.trim();
    if (!name) { setNameError("고객 이름을 입력해 주세요"); nameField.current?.focus(); return; }
    if (names.length >= MAX_CUSTOMERS) { setNameError(`최대 ${MAX_CUSTOMERS}명까지 추가할 수 있습니다`); return; }
    setNames(previous => [...previous, name]); setCustomerIndex(names.length); setNameInput(""); setNameError(""); nameField.current?.focus();
  }
  function removeCustomer(index: number) {
    setNames(previous => previous.filter((_, number) => number !== index));
    setCustomerIndex(previous => index < previous ? previous - 1 : index === previous ? Math.min(previous, Math.max(0, names.length - 2)) : previous);
    setNameError("");
  }

  function updateAdvisor(info: Advisor) {
    setAdvisorDraft(info); setAdvisor(info);
    if (!authUser?.id || !advisorLoaded) return;
    const userId = authUser.id;
    advisorSaveQueue.current = advisorSaveQueue.current.then(async () => {
      try {
        const { error } = await supabase.from("policy_insert_advisors").upsert({ user_id: userId, name: info.name.trim(), company: info.company.trim(), phone: info.phone.trim(), fax: info.fax?.trim() || "" }, { onConflict: "user_id" });
        if (error) throw error;
        setAdvisorError("");
        try { localStorage.removeItem(`policy-inserts:advisor:${userId}`); } catch { /* The cloud record remains authoritative. */ }
      } catch { setAdvisorError("설계사 정보를 자동 저장하지 못했습니다 입력 내용을 다시 수정해 주세요"); }
    });
  }

  function toggleAdvisor() {
    const collapsed = !advisorCollapsed;
    setAdvisorCollapsed(collapsed);
    try { localStorage.setItem("policy-inserts:advisor-collapsed", String(collapsed)); } catch { /* Folding still works without browser storage. */ }
  }

  useEffect(() => {
    if (!allowed) return;
    const abort = new AbortController();
    const urls: string[] = [];
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (abort.signal.aborted) return;
        setLoading(true); setError(""); setImages({});
        if (!session) throw new Error("다시 로그인해 주세요");
        const entries = await Promise.all(TEMPLATES[category].titles.map(async (_, index) => { const number = index + 1;
          const blob=await policyInsertImage(session.user.id,category,String(number),session.access_token);
          if(abort.signal.aborted)return [number,''] as const;
          const url=URL.createObjectURL(blob);urls.push(url);
          setImages(previous=>({...previous,[number]:url}));
          return [number, url] as const;
        }));
        let icons: Record<PetKind, string> = { dog: "", cat: "" };
        if (category === "pet") {
          const iconEntries = await Promise.all((["dog", "cat"] as const).map(async kind => {
            const blob=await policyInsertImage(session.user.id,'pet',kind,session.access_token);
            if(abort.signal.aborted)return [kind,''];
            const url=URL.createObjectURL(blob);urls.push(url);
            return [kind, url];
          }));
          icons = Object.fromEntries(iconEntries) as Record<PetKind, string>;
        }
        if (!abort.signal.aborted) { setImages(Object.fromEntries(entries)); setPetIcons(icons); }
      } catch (failure) {
        if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : "이미지를 불러오지 못했습니다");
      } finally { if (!abort.signal.aborted) setLoading(false); }
    })();
    return () => { abort.abort(); urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [allowed, authUser?.id, retry, category]);

  useEffect(() => {
    const frames = printFrames.current;
    return () => { frames.forEach(frame => frame.remove()); frames.clear(); };
  }, []);

  async function saveImage() {
    const paper = paperRef.current;
    if (!paper || savingImage) return;
    setSavingImage(true);
    try {
      const bounds = paper.getBoundingClientRect();
      const canvas = await captureNoticeImage(paper, { width: bounds.width, height: bounds.height, outputWidth: 1414, outputHeight: 2000 });
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("이미지 저장 실패")), "image/png"));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = [currentName, TEMPLATES[category].label, titles[page - 1]].filter(Boolean).join("_").replace(/[\\/:*?"<>|]/g, "_") + ".png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setError("이미지를 저장하지 못했습니다 다시 시도해 주세요"); }
    finally { setSavingImage(false); }
  }

  async function print(mode: "single" | "set" | "customers") {
    if (printing) return;
    setError("");
    let frame: HTMLIFrameElement | undefined;
    try {
      if (!ready) throw new Error("인쇄할 이미지가 준비되지 않았습니다");
      const jobs = printJobs(mode === "customers" ? names : [currentName].filter(Boolean), mode === "single" ? [page] : selected, category, petKind);
      setPrinting(true);
      frame = document.createElement("iframe");
      frame.title = "보험 증권 속지 인쇄";
      frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0";
      printFrames.current.add(frame);
      const loaded = new Promise<void>((resolve, reject) => { frame!.onload = () => resolve(); frame!.onerror = () => reject(new Error("인쇄 화면을 열지 못했습니다")); });
      frame.srcdoc = printDocument(jobs, images, advisor, category, { kind: petKind, src: petIcons[petKind] });
      document.body.appendChild(frame);
      await loaded;
      const target = frame.contentWindow;
      if (!target) throw new Error("인쇄 화면을 열지 못했습니다");
      await Promise.all(Array.from(target.document.images).map(image => image.decode()));
      await target.document.fonts.ready;
      const printedFrame = frame;
      const clean = () => { printedFrame.remove(); printFrames.current.delete(printedFrame); };
      target.addEventListener("afterprint", clean, { once: true });
      // Keep the frame alive while the system print dialog is open.
      window.setTimeout(clean, 15 * 60 * 1000);
      target.focus(); target.print();
    } catch (failure) {
      if (frame) { frame.remove(); printFrames.current.delete(frame); }
      setError(failure instanceof Error ? failure.message : "인쇄를 준비하지 못했습니다");
    } finally { setPrinting(false); }
  }

  return <main data-compact-inserts={compactNavigation||undefined} className={`${styles.page} ${embedded ? styles.embedded : ""}`}>
    {embedded && <div className={styles.embeddedHeader}><h2 data-personal-tab-title="true"><PolicyInsertsIcon size={28} aria-hidden="true"/>보험 증권 속지</h2></div>}
    {!embedded && <header data-page-header="true" className={styles.header}><div><Link data-icon-only="true" href="/" aria-label="메인으로" data-header-control="true"><ArrowLeft size={20}/></Link><h1><PolicyInsertsIcon size={26} aria-hidden="true"/>보험 증권 속지</h1><PolicyInsertsTools className={styles.headerTools}/></div></header>}
    {authLoading ? null : !allowed ? <div className={styles.empty}><h2>승인 회원 전용</h2><p>로그인 후 이용해 주세요</p><Link href="/">메인으로</Link></div> : <div data-page-content={embedded ? undefined : "true"} className={styles.content}>

      {<div className={styles.workspace}>
      <div className={styles.topActions}><nav data-unified-side-menu={compactNavigation?undefined:"true"} className={styles.categories} aria-label="속지 주제">{categories.map(item => <button data-action-height="44" key={item.id} type="button" aria-pressed={category === item.id} className={category === item.id ? styles.activeCategory : ""} onClick={() => { if (category === item.id) return; setCategory(item.id as TemplateId); setPage(1); setSelected(templatePages(item.id as TemplateId, petKind).map(item => item.page)); setImages({}); setLoading(true); setError(""); }}>{item.label}</button>)}</nav><button data-icon-only="true" data-action-height="44" type="button" aria-label="이미지 저장" title="현재 페이지 이미지 저장" disabled={!ready || savingImage} onClick={() => void saveImage()}><Download size={20}/></button><button data-icon-only="true" data-action-height="44" type="button" aria-label="개별 인쇄" title="개별 인쇄" disabled={!ready || printing} onClick={() => void print("single")}><Printer size={20}/></button><div className={styles.mobileOutputActions}><button data-action-height="44" type="button" disabled={!ready || savingImage} onClick={() => void saveImage()}><Download size={18}/><span>저장</span></button><button data-action-height="44" type="button" disabled={!ready || printing} onClick={() => void print("single")}><Printer size={18}/><span>인쇄</span></button></div></div>
        <div className={styles.previewLayout}><div className={styles.previewToolbar}><nav className={styles.pagination} aria-label="미리볼 페이지">{pages.map((item,index)=><button type="button" data-action-height="44" key={item.page} aria-pressed={page===item.page} onClick={()=>setPage(item.page)}>{index+1}. {item.title}</button>)}</nav><div className={styles.mobilePreviewNavigation}><button data-icon-only="true" type="button" aria-label="이전 페이지" disabled={pages.findIndex(item=>item.page===page)<=0} onClick={()=>{const index=pages.findIndex(item=>item.page===page);if(index>0)setPage(pages[index-1].page);}}><ChevronLeft size={20}/></button><CustomSelect placement="up" matchTriggerWidth label="미리볼 페이지" value={String(page)} options={pages.map((item,index)=>({value:String(item.page),label:(index+1)+'. '+item.title}))} onChange={value=>setPage(Number(value))}/><button data-icon-only="true" type="button" aria-label="다음 페이지" disabled={pages.findIndex(item=>item.page===page)>=pages.length-1} onClick={()=>{const index=pages.findIndex(item=>item.page===page);if(index<pages.length-1)setPage(pages[index+1].page);}}><ChevronRight size={20}/></button></div></div>
          <section data-ui-card="true" className={styles.preview} aria-label="인쇄 미리보기">{error && <div role="alert" className={styles.error}>{error}{!ready && <button data-action-height="44" type="button" onClick={() => setRetry(value => value + 1)}>다시 시도</button>}</div>}
          <div className={styles.paperStage}>{images[page] ? <div ref={paperRef} className={styles.paper}><Image unoptimized width={1414} height={2000} src={images[page]} alt={`${TEMPLATES[category].label} ${titles[page - 1]}`}/><div className={styles.overlays} dangerouslySetInnerHTML={{ __html: overlayHtml(page, currentName, advisor, category) + petDecorationHtml(page, category, { kind: petKind, src: petIcons[petKind] }) }}/></div> : null}</div>
        </section></div>
        <aside className={styles.controls}>
          <div className={styles.identityCards}>

          {category === "pet" && <section data-ui-card="true" className={styles.card}><h2 data-personal-card-title="true">반려동물</h2><div className={styles.petChoices} role="group" aria-label="반려동물 종류">{([{kind:"dog",label:"강아지"},{kind:"cat",label:"고양이"}] as const).map(pet => <button data-action-height="44" key={pet.kind} type="button" aria-pressed={petKind === pet.kind} onClick={() => { if (pet.kind === petKind) return; const oldGrowth = petKind === "dog" ? 3 : 4; const newGrowth = pet.kind === "dog" ? 3 : 4; setPetKind(pet.kind); setSelected(previous => previous.map(number => number === oldGrowth ? newGrowth : number)); if (page === oldGrowth) setPage(newGrowth); }}>{petIcons[pet.kind] && <Image unoptimized width={400} height={400} src={petIcons[pet.kind]} alt=""/>}{pet.label}</button>)}</div></section>}
          <section data-policy-card="customer" data-ui-card="true" className={styles.card}><div className={styles.customerHeading}><h2 data-personal-card-title="true">고객 이름</h2><span>{names.length} / {MAX_CUSTOMERS}명</span></div><form className={styles.customerEntryRow} aria-label="고객 이름 추가" onSubmit={event => { event.preventDefault(); addCustomer(); }}>{names.map((name, index) => <div className={styles.customerCard} data-selected={index === Math.min(customerIndex, names.length - 1)} key={index}><button type="button" aria-pressed={index === Math.min(customerIndex, names.length - 1)} onClick={() => setCustomerIndex(index)} title={name}>{name}</button><button type="button" aria-label={`${name} 삭제`} onClick={() => removeCustomer(index)}><X size={15}/></button></div>)}<div className={styles.customerAdd}><ClearableSearchInput onClear={() => { setNameInput(""); setNameError(""); }} ref={nameField} id="insert-customer-name" aria-label="고객 이름" value={nameInput} maxLength={30} placeholder="고객 이름" autoComplete="off" onChange={event => { setNameInput(event.target.value); setNameError(""); }} onKeyDown={event => { if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault(); }}/><button data-icon-only="true" data-action-height="44" aria-label="고객 이름 추가" title="고객 이름 추가" type="submit" disabled={names.length >= MAX_CUSTOMERS}><Plus size={20}/></button></div></form>{nameError && <p role="alert" className={styles.customerError}>{nameError}</p>}</section>

          <section data-ui-card="true" className={styles.card}><div data-print-section-heading="true" className={styles.sectionHeading}><h2 data-personal-card-title="true">인쇄 페이지</h2><button data-action-height="44" type="button" onClick={() => setSelected(selected.length === pageCount ? [] : allPages)}>{selected.length === pageCount ? "선택 해제" : "전체 선택"}</button></div><div className={styles.pageChoices} role="group" aria-label="인쇄할 페이지">{pages.map(item => <button data-action-height="44" key={item.page} type="button" aria-pressed={selected.includes(item.page)} onClick={() => setSelected(previous => previous.includes(item.page) ? previous.filter(number => number !== item.page) : [...previous, item.page])} title={item.title}><span>{item.title}</span></button>)}</div><div className={styles.printActions}><button data-action-height="44" type="button" disabled={!ready || printing || !selected.length} onClick={() => void print("set")}><Printer size={17}/>현재 고객 일괄 인쇄 ({selected.length}장)</button><button data-action-height="44" type="button" disabled={!ready || printing || !selected.length || !names.length || names.length > MAX_CUSTOMERS} onClick={() => void print("customers")}>여러 고객 인쇄 ({names.length}명)</button></div></section>
          <section data-policy-card="advisor" data-ui-card="true" className={styles.card}><div className={styles.sectionHeading}><h2 data-personal-card-title="true">설계사 정보</h2></div><div id="policy-advisor-fields"><div className={styles.advisorGrid}>{([{key:"name",label:"이름"},{key:"company",label:"소속"},{key:"phone",label:"연락처"},{key:"fax",label:"팩스번호"}] as const).map(field => <label key={field.key}><span data-field-caption="true">{field.label}</span><ClearableSearchInput onClear={() => { const value = ""; updateAdvisor({ ...advisorDraft, [field.key]: value }); }} data-ui-field="true" disabled={!advisorLoaded} value={advisorDraft[field.key] || ""} maxLength={field.key === "company" ? 40 : 30} type={field.key === "phone" || field.key === "fax" ? "tel" : "text"} onChange={event => { const value = event.target.value; updateAdvisor({ ...advisorDraft, [field.key]: value }); }}/></label>)}</div></div>{advisorError && <p role="alert" className={styles.customerError}>{advisorError}</p>}</section>
          </div>

        </aside>
      </div>}
    </div>}

  </main>;
}
