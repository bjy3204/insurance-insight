"use client";
import MiniCalendar from "@/app/components/MiniCalendar";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";
import { customerToday, type CustomerRecord } from "./customer-lookup-model";
import { parseConsultations, parseConsultationRecords, emptyConsultationRecord, serializeConsultations, sortConsultations, type ConsultationEntry } from "./customer-consultations";
import CustomerConsultationRecords from "./CustomerConsultationRecords";
import useCustomerAutosave from "./useCustomerAutosave";
import styles from "./CustomerConsultations.module.css";

function read(value?:string){if(value){try{return parseConsultations(value);}catch{/* Existing customers may have no consultation entries. */}}return [];}
function readRecords(value?:string,initialRows=3){try{const rows=parseConsultationRecords(value);return value&&JSON.parse(value).records!==undefined?rows:Array.from({length:initialRows},emptyConsultationRecord);}catch{return Array.from({length:initialRows},emptyConsultationRecord);}}
export default function CustomerConsultations({customer,onSave,initialRows=3,matchPanelHeight=false}:{initialRows?:number;matchPanelHeight?:boolean;customer?:CustomerRecord;onSave?:(customer:CustomerRecord,value:string)=>Promise<void>}){
  const prefix=useId();
  const entries=read(customer?.consultations);
  const [records,setRecords]=useState(()=>readRecords(customer?.consultations,initialRows));
  const [recordsBaseline,setRecordsBaseline]=useState(()=>JSON.stringify(records));
  useEffect(()=>{const rows=readRecords(customer?.consultations,initialRows);setRecords(rows);setRecordsBaseline(JSON.stringify(rows));},[customer?.id,customer?.consultations,initialRows]);
  const persistBusy=useRef(false);
  const [query,setQuery]=useState("");
  const search=query.trim().toLocaleLowerCase();
  const filteredEntries=sortConsultations(entries).filter(entry=>!search||`${entry.date} ${entry.time} ${entry.place} ${entry.content}`.toLocaleLowerCase().includes(search));
  const [draft,setDraft]=useState<ConsultationEntry|null>(null),[deleting,setDeleting]=useState<ConsultationEntry|null>(null);
  const [saving,setSaving]=useState(false),[error,setError]=useState("");
  const [calendarOpen,setCalendarOpen]=useState(false),[month,setMonth]=useState(()=>customerToday().slice(0,7));
  const close=useCallback(()=>{if(!saving){setDraft(null);setDeleting(null);setError("");setCalendarOpen(false);}},[saving]);
  const open=(entry?:ConsultationEntry)=>{
    const now=new Date().toISOString(),date=customerToday();
    setDraft(entry?{...entry}:{id:crypto.randomUUID(),date,time:"",place:"",content:"",createdAt:now,updatedAt:now});
    setMonth((entry?.date||date).slice(0,7));setCalendarOpen(false);setError("");
  };
  const persist=async(next:ConsultationEntry[],closeEditor=true)=>{
    if(!customer||!onSave||persistBusy.current)return;
    persistBusy.current=true;
    setSaving(true);setError("");
    try{const raw=serializeConsultations(next,records);const value=serializeConsultations(parseConsultations(raw),parseConsultationRecords(raw));await onSave(customer,value);setRecordsBaseline(JSON.stringify(records));if(closeEditor){setDraft(null);setDeleting(null);setCalendarOpen(false);}}
    catch(error){setError(error instanceof Error?error.message:"상담일지를 저장하지 못했습니다.");}
    finally{persistBusy.current=false;setSaving(false);}
  };
  const [year,monthNumber]=month.split("-").map(Number);
  const shiftMonth=(delta:number)=>{const date=new Date(year,monthNumber-1+delta,1);setMonth(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`);};
  const save=()=>{
    if(!draft)return;
    const next={...draft,updatedAt:new Date().toISOString()};
    void persist(entries.some(entry=>entry.id===next.id)?entries.map(entry=>entry.id===next.id?next:entry):[...entries,next]);
  };
  useCustomerAutosave(JSON.stringify(records),recordsBaseline,!!customer&&!!onSave&&!saving,()=>persist(entries,false));
  return <div data-ui-card="true" className={styles.panel}>
    <div className={styles.split} data-match-height={matchPanelHeight||undefined}><CustomerConsultationRecords rows={records} onChange={setRecords} disabled={!customer||!onSave||saving}/><section data-ui-card="true" className={styles.notes} aria-label="상세 메모">
    <div className={styles.header}><div className={styles.search}><Search size={17} aria-hidden="true"/><ClearableSearchInput onClear={() => setQuery("")} aria-label="상담일지 검색" placeholder="검색" autoComplete="off" value={query} onChange={event=>setQuery(event.target.value)}/></div><button data-action-height="44" type="button" disabled={!customer||!onSave||saving} className={styles.primary} onClick={()=>open()}>등록</button></div>
    <div className={styles.list}>{filteredEntries.map(entry=><article className={styles.entry} key={entry.id}>
      <div className={styles.entryHeader}><div className={styles.meta}><span><CalendarDays size={14} aria-hidden="true"/><time dateTime={entry.date}>{entry.date}</time></span>{entry.time&&<span><Clock size={14}/>{entry.time}</span>}{entry.place&&<span><MapPin size={14}/>{entry.place}</span>}</div><div className={styles.tools}><button data-icon-only="true" type="button" aria-label={`${entry.date} 상담일지 수정`} title="수정" onClick={()=>open(entry)}><Pencil size={17}/></button><button data-icon-only="true" type="button" aria-label={`${entry.date} 상담일지 삭제`} title="삭제" onClick={()=>{setDeleting(entry);setError("");}}><Trash2 size={17}/></button></div></div>
      <p className={styles.content}>{entry.content}</p>
    </article>)}</div></section></div>
    {error&&!draft&&!deleting&&<p role="alert" className={styles.error}>{error}</p>}
    {draft&&<DashboardDialog title={entries.some(entry=>entry.id===draft.id)?"상담일지 수정":"상담일지 작성"} onClose={close}>
      <div className={styles.form}><fieldset disabled={saving}>
        <div className={styles.field}><label>날짜</label><button type="button" aria-label="상담 날짜 선택" aria-expanded={calendarOpen} className={styles.dateButton} onClick={()=>setCalendarOpen(value=>!value)}><CalendarDays size={17}/>{draft.date}</button>
        {calendarOpen&&<MiniCalendar value={draft.date} disabled={saving} onChange={date=>setDraft({...draft,date})} onClose={()=>setCalendarOpen(false)} />}
        </div>
        <div className={styles.grid}><div className={styles.field}><label htmlFor={`${prefix}-time`}>시간</label><ClearableSearchInput onClear={() => {const digits="".replace(/\D/g,"").slice(0,4);setDraft({...draft,time:digits.length>2?`${digits.slice(0,2)}:${digits.slice(2)}`:digits});}} id={`${prefix}-time`} inputMode="numeric" maxLength={5} value={draft.time} onChange={event=>{const digits=event.target.value.replace(/\D/g,"").slice(0,4);setDraft({...draft,time:digits.length>2?`${digits.slice(0,2)}:${digits.slice(2)}`:digits});}}/></div><div className={styles.field}><label htmlFor={`${prefix}-place`}>장소</label><ClearableSearchInput onClear={() => setDraft({...draft,place:""})} id={`${prefix}-place`} maxLength={300} value={draft.place} onChange={event=>setDraft({...draft,place:event.target.value})}/></div></div>
        <div className={styles.field}><label htmlFor={`${prefix}-content`}>상담 내용</label><textarea id={`${prefix}-content`} rows={6} maxLength={12000} value={draft.content} onChange={event=>setDraft({...draft,content:event.target.value})}/></div>
      </fieldset>{error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><button data-popup-action="true" data-action-height="44" type="button" disabled={saving} onClick={close}>취소</button><button data-popup-action="true" data-action-height="44" type="button" disabled={saving||!draft.content.trim()} className={styles.primary} onClick={save}>{saving?"저장 중":"저장"}</button></div></div>
    </DashboardDialog>}
    {deleting&&<DashboardDialog confirmation title="상담일지를 삭제할까요?" onClose={close}><p>선택한 상담일지를 삭제하시겠습니까?</p>{error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><button data-popup-action="true" data-action-height="44" type="button" disabled={saving} onClick={close}>취소</button><button data-action-height="44" type="button" className={styles.delete} disabled={saving} onClick={()=>void persist(entries.filter(entry=>entry.id!==deleting.id))}>{saving?"삭제 중":"삭제"}</button></div></DashboardDialog>}
  </div>;
}
