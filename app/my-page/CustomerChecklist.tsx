"use client";
import { useEffect, useRef, useState } from "react";
import { FileSearch, FileCheck2, ShieldCheck, Gift, Handshake, Phone, PhoneCall, MessageSquareCheck, Cake, Car, HeartPulse } from "lucide-react";
import { CUSTOMER_CHECKLIST_ITEMS, emptyCustomerChecklist, parseCustomerChecklist, parseCustomerSchedules, customerBirthdaySchedules, emptyCustomerSchedules, serializeCustomerChecklist, type CustomerChecklist as Checklist, type CustomerSchedule } from "./customer-checklist";
import type { CustomerRecord } from "./customer-lookup-model";
import styles from "./CustomerChecklist.module.css";
const icons=[PhoneCall,MessageSquareCheck,FileSearch,FileCheck2,Handshake,Phone];
const scheduleIcons=[Cake,Car,MessageSquareCheck,ShieldCheck,HeartPulse,Gift];
function read(value?:string){try{return value?parseCustomerChecklist(value):emptyCustomerChecklist();}catch{return emptyCustomerChecklist();}}
function readSchedules(value?:string,birth="",today?:string){try{const saved=customerBirthdaySchedules(value,birth,today);return emptyCustomerSchedules().map(item=>({...item,...saved.find(row=>row.id===item.id),label:item.label}));}catch{return emptyCustomerSchedules();}}
export default function CustomerChecklist({customer,onSave}:{customer?:CustomerRecord;onSave?:(customer:CustomerRecord,value:string)=>Promise<void>}){
 const [today,setToday]=useState(()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"}));
 useEffect(()=>{const update=()=>setToday(new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"}));const timer=setInterval(update,60000);window.addEventListener("focus",update);return()=>{clearInterval(timer);window.removeEventListener("focus",update);};},[]);
 const [checked,setChecked]=useState(()=>read(customer?.checklist));
 const [rows,setRows]=useState(()=>readSchedules(customer?.checklist,customer?.birth,today));
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const busy=useRef(false);
 const savedValue=useRef(serializeCustomerChecklist(read(customer?.checklist),readSchedules(customer?.checklist,customer?.birth,today)));
 useEffect(()=>{const checked=read(customer?.checklist),rows=readSchedules(customer?.checklist,customer?.birth,today);setChecked(checked);setRows(rows);savedValue.current=serializeCustomerChecklist(checked,rows);setError("");},[customer?.id,customer?.checklist,customer?.birth,today]);
 const save=async(next:Checklist=checked,schedules:CustomerSchedule[]=rows)=>{
  if(!customer||!onSave||busy.current)return;
  const value=serializeCustomerChecklist(next,schedules);
  if(value===savedValue.current)return;
  busy.current=true;setSaving(true);setError("");
  try{parseCustomerSchedules(value);await onSave(customer,value);savedValue.current=value;setChecked(next);window.dispatchEvent(new Event("customer-schedules-updated"));}
  catch(error){setError(error instanceof Error?error.message:"체크리스트를 저장하지 못했습니다.");}
  finally{busy.current=false;setSaving(false);}
 };
 const update=(id:string,patch:Partial<CustomerSchedule>,persist=false)=>{const next=rows.map(row=>row.id===id?{...row,...patch,...(id==="schedule-0"&&patch.date!==undefined&&(patch.date.length===10||patch.date==="")?{annualMonthDay:patch.date.slice(5)}:{})}:row);setRows(next);if(persist)void save(checked,next);};
 const disabled=!customer||!onSave||saving;
 return <div className={styles.panel}>
  <section className={styles.checklistCard}><h3 className={styles.toolbar}>고객관리 체크리스트</h3><div className={styles.items}>{CUSTOMER_CHECKLIST_ITEMS.map((item,index)=>{
   const Icon=icons[index];return <div key={item.id} className={styles.item} data-checked={checked[item.id]}><span><Icon size={20} aria-hidden="true"/>{item.label}</span><input aria-label={item.label} type="checkbox" checked={checked[item.id]} disabled={disabled} onChange={()=>void save({...checked,[item.id]:!checked[item.id]})}/></div>;
  })}</div></section>
  <fieldset className={styles.schedule} disabled={disabled}>
   <h3 className={styles.toolbar}>고객 일정 체크리스트</h3>
   <div className={styles.scheduleItems}>{rows.map((row,index)=>{const Icon=scheduleIcons[index]||Gift;return <div className={styles.scheduleItem} key={row.id} data-done={row.done}>
    <div className={styles.scheduleLabel}><Icon size={20} aria-hidden="true"/><span>{row.label}</span></div>
    <input className={styles.date} aria-label={`${row.label||"관리"} 예정일`} inputMode="numeric" maxLength={10} value={row.date} onChange={event=>{const digits=event.target.value.replace(/\D/g,"").slice(0,8);update(row.id,{date:[digits.slice(0,4),digits.slice(4,6),digits.slice(6,8)].filter(Boolean).join("-")},digits.length===8||digits.length===0);}} onBlur={()=>void save()} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();event.currentTarget.blur();}}}/>
    <label className={styles.complete}><input aria-label={`${row.label||"관리"} 완료`} type="checkbox" checked={row.done} onChange={event=>update(row.id,{done:event.target.checked},true)}/></label>
   </div>;})}</div>
  </fieldset>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
 </div>;
}
