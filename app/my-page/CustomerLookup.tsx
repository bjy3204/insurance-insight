"use client";

import { createPortal } from "react-dom";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Car, HeartPulse, Landmark, Pencil, Search, Trash2, UserRound } from "lucide-react";
import { customerGender, customerVehicles, shortCustomerBirth, formatCustomerPhone, withCustomerClaimDefaults } from "./customer-form-fields";
import { customerTiming, customerToday, customerRenewalDays, findCustomers, medicalMaturity, type CustomerRecord } from "./customer-lookup-model";
import styles from "./CustomerLookup.module.css";
import type { StoredContract } from "@/lib/customer-records";
import CustomerDirectory from "./CustomerDirectory";
import CustomerDisclosure from "./CustomerDisclosure";
import CustomerConsultations from "./CustomerConsultations";
import CustomerChecklist from "./CustomerChecklist";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

const customerTabs = [{ id: "checklist", label: "체크리스트" }, { id: "contracts", label: "계약 현황" }, { id: "disclosure", label: "알릴의무" }, { id: "consultation", label: "상담일지" }];
function recordDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-GB", {timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

export default function CustomerLookup({ customers = [], contracts = [], mobileActionsHost, onEdit, onDelete, onReorder, onSaveDisclosure, onSaveConsultations, onSaveChecklist, onEditContract, onDeleteContract, reorderDisabled = false }: { mobileActionsHost?: HTMLElement | null; customers?: readonly CustomerRecord[]; contracts?: readonly StoredContract[]; onEditContract?:(contract:StoredContract)=>void; onDeleteContract?:(contract:StoredContract)=>void; onEdit?: (customer: CustomerRecord) => void; onDelete?: (customer: CustomerRecord) => void; onReorder?: (ids: string[]) => void; onSaveDisclosure?: (customer:CustomerRecord,value:string)=>Promise<void>; onSaveConsultations?: (customer:CustomerRecord,value:string)=>Promise<void>; onSaveChecklist?: (customer:CustomerRecord,value:string)=>Promise<void>; reorderDisabled?: boolean }) {
  const prefix = useId();
  const { authUser, authLoading } = useAuth();
  const [activeDetailTab, setActiveDetailTab] = useState("contracts");
  const tabStorageKey = authLoading ? null : `customer-detail-tab:${authUser?.id || "local"}`;
  useEffect(() => {
    if (!tabStorageKey) return;
    try { const saved=localStorage.getItem(tabStorageKey);setActiveDetailTab(customerTabs.some(tab=>tab.id===saved)?saved!:"contracts"); } catch { setActiveDetailTab("contracts"); }
  }, [tabStorageKey]);
  const selectDetailTab = (id:string) => {
    setActiveDetailTab(id);
    if(tabStorageKey) { try { localStorage.setItem(tabStorageKey,id); } catch { /* Tabs remain usable when local storage is blocked. */ } }
  };
  const [name, setName] = useState(""), [birth, setBirth] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectionKey=!authLoading&&authUser?`customer-last-selected:${authUser.id}`:null;
  const [selectionOwner,setSelectionOwner]=useState<string|null>(null);
  const pendingSelection=useRef<string|null>(null);
  const selectionTouched=useRef(false);
  const [selectionLoaded,setSelectionLoaded]=useState(false);
  const savedSelection=useRef<string|null>(null);
  useEffect(()=>{
    let stopped=false;
    setName("");setBirth("");setSelectedId(null);selectionTouched.current=false;
    pendingSelection.current=null;savedSelection.current=null;setSelectionLoaded(false);setSelectionOwner(selectionKey);
    if(!selectionKey||!authUser)return;
    const load=async()=>{try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session||session.user.id!==authUser.id)return;
      const response=await fetch("/api/customers?view=selection",{cache:"no-store",headers:{Authorization:`Bearer ${session.access_token}`}});
      const result=await response.json();if(!response.ok)throw Error();
      if(!stopped){pendingSelection.current=result.customerId;savedSelection.current=result.customerId;setSelectionLoaded(true);}
    }catch{if(!stopped){setSelectionLoaded(true);}}};
    void load();return()=>{stopped=true;};
  },[selectionKey,authUser?.id]);
  useEffect(()=>{
    if(!selectionKey||selectionOwner!==selectionKey||selectionTouched.current||!pendingSelection.current)return;
    const customer=customers.find(record=>record.id===pendingSelection.current);
    if(customer){selectionTouched.current=true;setSelectedId(customer.id);setName(customer.name);setBirth(shortCustomerBirth(customer.birth));}
  },[customers,selectionKey,selectionOwner,selectionLoaded]);
  useEffect(() => {
    if (!selectedId) return;
    const customer = customers.find(record => record.id === selectedId);
    if (customer) { setName(customer.name); setBirth(shortCustomerBirth(customer.birth)); } else { setSelectedId(null); setName(""); setBirth(""); }
  }, [customers, selectedId]);
  const [today, setToday] = useState(customerToday);
  useEffect(() => {
    const update = () => setToday(customerToday());
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  const matches = findCustomers(customers, name, birth);
  const selected = matches.length === 1 ? matches[0] : matches.find(customer => customer.id === selectedId);
  useEffect(()=>{
    if(!selectionKey||selectionOwner!==selectionKey||!selectionLoaded||!selected||savedSelection.current===selected.id||!authUser)return;
    let stopped=false;const customerId=selected.id;
    const timer=window.setTimeout(async()=>{try{
      const {data:{session}}=await supabase.auth.getSession();if(!session||session.user.id!==authUser.id)return;
      const response=await fetch("/api/customers",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({action:"select",customerId})});
      if(!response.ok)throw Error();if(!stopped){savedSelection.current=customerId;}
    }catch{/* Remembering the selection must not interrupt customer management. */}},250);
    return()=>{stopped=true;clearTimeout(timer);};
  },[selectionKey,selectionOwner,selectionLoaded,selected?.id,authUser?.id]);
  const values = withCustomerClaimDefaults(selected || {});
  const vehicles = customerVehicles(values);
  const [activeVehicle, setActiveVehicle] = useState(0);
  useEffect(() => setActiveVehicle(0), [selected?.id]);
  const vehicle = vehicles[Math.min(activeVehicle, vehicles.length - 1)];
  const timing = selected ? customerTiming(selected.birth, today) : null;
  const renewalDays=customerRenewalDays(vehicle.renewal,today);
  const maturity = medicalMaturity(values.medicalJoined || "", today);
  const gender = selected ? customerGender(selected.birth) : "";
  const customerContracts = selected ? contracts.filter(contract => contract.customerId === selected.id) : [];
  const value = (field: string) => values[field] || "";
  const cell = (label: string, content: ReactNode, wide = false, mobileWide = false) => <div className={`${styles.entry} ${wide ? styles.full : ""} ${mobileWide ? styles.mobileFull : ""}`}><dt>{label}</dt><dd>{content || ""}</dd></div>;
  const card = (title: string, icon: ReactNode, tone: string, children: ReactNode, meta?: ReactNode) => <section data-ui-card="true" className={styles.card}><div className={`${styles.cardHeader} ${tone}`}><h3 data-personal-card-title="true" className={styles.cardTitle}>{icon}{title}</h3>{meta}</div><dl className={styles.details}>{children}</dl></section>;
  return <div className={styles.lookup}><div className={styles.workspace}><div className={styles.customerArea}>
    <div className={styles.top}>
      <div data-personal-grouped-search="true" className={styles.searchFields}>
        <div className={styles.searchField}><label htmlFor={`${prefix}-name`}><Search size={16} aria-hidden="true"/><span className={styles.searchLabelText}>이름</span></label><div className={styles.searchInput}><ClearableSearchInput onClear={() => { selectionTouched.current=true; setName(""); setSelectedId(null); }} id={`${prefix}-name`} aria-label="이름 검색" placeholder="이름" autoComplete="off" value={name} onChange={event => { selectionTouched.current=true; setName(event.target.value); setSelectedId(null); }} /></div></div>
        <div className={styles.searchField}><label htmlFor={`${prefix}-birth`}><Search size={16} aria-hidden="true"/><span className={styles.searchLabelText}>생년월일</span></label><div className={styles.searchInput}><ClearableSearchInput onClear={() => { selectionTouched.current=true; setBirth(shortCustomerBirth("")); setSelectedId(null); }} id={`${prefix}-birth`} aria-label="생년월일 검색" placeholder="생년월일" inputMode="numeric" maxLength={6} autoComplete="off" value={birth} onChange={event => { selectionTouched.current=true; setBirth(shortCustomerBirth(event.target.value)); setSelectedId(null); }} /></div></div>
      </div>
      <div data-mobile-actions-moved={mobileActionsHost ? "true" : undefined} className={styles.summary}>
        <div className={styles.ageChange}><div className={styles.ageBadge}><span className={styles.upperInfo}><span>상령일</span><span className={styles.upperDate}>{timing?.upperDate || ""}</span></span><strong className={timing ? `${styles.dday} ${timing.days<=30?styles.due:""}` : undefined}>{timing ? timing.days === 0 ? "D-Day" : `D-${timing.days}` : ""}</strong></div>{selected && <><span className={mobileActionsHost ? "hidden md:contents" : "contents"}><span className={styles.recordActions}>{onEdit && <button data-icon-only="true" type="button" aria-label="고객정보 수정" title="수정" className={styles.editCustomer} onClick={() => { setSelectedId(selected.id); onEdit(selected); }}><Pencil size={16} /></button>}{onDelete && <button data-icon-only="true" type="button" aria-label="고객 삭제" title="삭제" className={`${styles.editCustomer} ${styles.deleteCustomer}`} onClick={() => onDelete(selected)}><Trash2 size={16} /></button>}</span></span>{mobileActionsHost && createPortal(<span className={styles.recordActions}>{onEdit && <button data-icon-only="true" type="button" aria-label="고객정보 수정" title="수정" className={styles.editCustomer} onClick={() => { setSelectedId(selected.id); onEdit(selected); }}><Pencil size={16} /></button>}{onDelete && <button data-icon-only="true" type="button" aria-label="고객 삭제" title="삭제" className={`${styles.editCustomer} ${styles.deleteCustomer}`} onClick={() => onDelete(selected)}><Trash2 size={16} /></button>}</span>, mobileActionsHost)}</>}</div>
      </div>
    </div>
    {matches.length > 1 && <div className={styles.matches} aria-label="검색된 고객">{matches.map(customer => <button type="button" key={customer.id} aria-pressed={customer.id === selected?.id} onClick={() => {selectionTouched.current=true;setSelectedId(customer.id);}}><strong>{customer.name}</strong><span>{shortCustomerBirth(customer.birth)}</span>{customer.phone && <span>{formatCustomerPhone(customer.phone)}</span>}</button>)}</div>}
    <div className={styles.cards}>
      {card("고객정보", <UserRound size={19} />, styles.customerTone, <>
        {cell("유입경로", value("category"))}{cell("전화번호", <span className={styles.phoneLine}><span>{values.phone ? formatCustomerPhone(values.phone) : ""}</span>{values.carrier && <span className={styles.carrier} data-carrier={values.carrier}>{values.carrier}</span>}</span>)}
        {cell("직업", value("job"))}{cell("이메일", value("email"))}
        {cell("주소", value("address"), true)}{cell("메모", value("memo"), true)}
      </>, selected && <span className={styles.identityMeta}>{timing && <span aria-label="나이">만 {timing.age}세</span>}{timing && gender && <span className={styles.metaDot}>·</span>}{gender && <span aria-label="성별" className={gender === "여" ? styles.female : styles.male}>{gender}</span>}</span>)}
      {card("보험금 청구", <Landmark size={19} />, styles.accountTone, <>
        {cell("예금주", value("accountOwner"))}{cell("생년월일", values.accountBirth ? shortCustomerBirth(values.accountBirth) : "")}
        {cell("은행", value("bank"), true)}{cell("계좌번호", value("accountNumber"), true)}
      </>)}
      {card("차량정보", <Car size={19} />, styles.vehicleTone, <>
        {cell("차량번호", vehicle.vehicleNumber)}{cell("차종", vehicle.vehicleType)}
        {cell("보험사", vehicle.insurer)}{cell("갱신일", <span className={renewalDays!==null&&renewalDays<=30?styles.due:undefined}>{vehicle.renewal}</span>)}
        {cell("운전자지정", vehicle.driver)}{cell("할인", vehicle.discount)}
      </>, vehicles.length > 1 && <div className={styles.vehicleTabs} aria-label="차량 선택">{vehicles.map((_, index) => <button data-action-height="44" type="button" key={index} aria-pressed={activeVehicle === index} onClick={() => setActiveVehicle(index)}>차량{index + 1}</button>)}</div>)}
      <div className={styles.medicalBlock}>{card("실손의료비", <HeartPulse size={19} />, styles.medicalTone, <>
        {cell("보험사", value("medicalInsurer"))}{cell("가입일", value("medicalJoined"))}
        {cell("세대", values.medicalGeneration ? `${values.medicalGeneration}세대` : "")}{cell("만기일", values.medicalMaturity !== undefined ? values.medicalMaturity : maturity ? <span className={maturity.soon ? styles.due : undefined}>{maturity.text}</span> : "")}
      </>)}
        {selected && <div className={styles.recordDates}><span>등록일 <time dateTime={selected.createdAt}>{recordDate(selected.createdAt || "")}</time></span><span>수정일 <time dateTime={selected.updatedAt || selected.createdAt}>{recordDate(selected.updatedAt || selected.createdAt || "")}</time></span></div>}
      </div>
    </div>
    </div>
    <aside className={styles.directory} aria-label="고객 목록">
      <div className={styles.directoryInner}>
      <h3 data-personal-card-title="true">고객 목록</h3>
      <div className={styles.directorySearch}><Search size={17} aria-hidden="true" /><ClearableSearchInput onClear={() => setDirectoryQuery("")} aria-label="고객 목록 검색" autoComplete="off" value={directoryQuery} onChange={event => setDirectoryQuery(event.target.value)} placeholder="검색" /></div>
      <div className={styles.directoryList}>
        <CustomerDirectory customers={customers} query={directoryQuery} selectedId={selected?.id} disabled={reorderDisabled} onReorder={onReorder} onSelect={customer => { selectionTouched.current=true; setName(customer.name); setBirth(shortCustomerBirth(customer.birth)); setSelectedId(customer.id); }} />
      </div>
      </div>
    </aside>
    </div>
    <div className={styles.detailArea}>
    <div className={styles.detailTabs} role="tablist" aria-label="고객 상세정보">
      {customerTabs.map((tab, index) => <button data-action-height="44" key={tab.id} id={`${prefix}-tab-${tab.id}`} type="button" role="tab" aria-selected={activeDetailTab === tab.id} aria-controls={`${prefix}-panel-${tab.id}`} tabIndex={activeDetailTab === tab.id ? 0 : -1} onClick={() => selectDetailTab(tab.id)} onKeyDown={event => {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % customerTabs.length;
        else if (event.key === "ArrowLeft") next = (index + customerTabs.length - 1) % customerTabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = customerTabs.length - 1;
        else return;
        event.preventDefault(); selectDetailTab(customerTabs[next].id);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
      }}>{tab.label}</button>)}
    </div>
    <section data-ui-card="true" id={`${prefix}-panel-contracts`} role="tabpanel" aria-labelledby={`${prefix}-tab-contracts`} tabIndex={0} hidden={activeDetailTab !== "contracts"} className={`${styles.card} ${styles.contracts}`}>
      <div className={styles.contractScroll}>
        <table className={styles.contractTable}>
          <thead><tr>{["계약일", "피보험자", "보험사", "상품명", "보험료", "면책만료", "감액만료", "메모"].map(label => <th key={label} scope="col">{label}</th>)}<th scope="col" aria-label="계약 관리"/></tr></thead>
          <tbody>{customerContracts.map(contract => <tr key={contract.id}>
            <td>{contract.date}</td><td>{contract.insured}</td><td>{contract.insurer}</td><td>{contract.product}</td><td>{contract.premium ? `${Number(contract.premium).toLocaleString("ko-KR")}원` : ""}</td><td>{contract.immunityEnd || ""}</td><td>{contract.reductionEnd || ""}</td><td>{contract.memo}</td><td><div className={styles.contractActions}>{onEditContract&&<button data-icon-only="true" type="button" aria-label="계약 수정" title="수정" disabled={reorderDisabled} onClick={()=>onEditContract(contract)}><Pencil size={16}/></button>}{onDeleteContract&&<button data-icon-only="true" type="button" aria-label="계약 삭제" title="삭제" disabled={reorderDisabled} onClick={()=>onDeleteContract(contract)}><Trash2 size={16}/></button>}</div></td>
          </tr>)}{customerContracts.length === 0 && <tr><td colSpan={9} className={styles.contractEmpty} /></tr>}</tbody>
        </table>
      </div>
    </section>
    <section id={`${prefix}-panel-disclosure`} role="tabpanel" aria-labelledby={`${prefix}-tab-disclosure`} hidden={activeDetailTab!=="disclosure"}><CustomerDisclosure key={selected?.id||"empty"} customer={selected} onSave={onSaveDisclosure}/></section>
    <section id={`${prefix}-panel-consultation`} role="tabpanel" aria-labelledby={`${prefix}-tab-consultation`} hidden={activeDetailTab!=="consultation"}><CustomerConsultations key={selected?.id||"empty"} customer={selected} onSave={onSaveConsultations}/></section>
    <section id={`${prefix}-panel-checklist`} role="tabpanel" aria-labelledby={`${prefix}-tab-checklist`} tabIndex={0} hidden={activeDetailTab!=="checklist"}><CustomerChecklist key={selected?.id||"empty"} customer={selected} onSave={onSaveChecklist}/></section>
    </div>

  </div>;
}
