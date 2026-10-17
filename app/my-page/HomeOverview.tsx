"use client";
import { useEffect, useState, useRef } from "react";
import CalendarEventDetails from "@/app/components/calendar/CalendarEventDetails";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { consultationWeek } from "./HomeWeeklyGoal";
import CalendarEventModal, { type CalendarEventForm } from "@/app/components/calendar/CalendarEventModal";
import HomeMiniCalendar from "./HomeMiniCalendar";
import { CalendarDays, Car, Users, Search, Plus } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { StoredContract } from "@/lib/customer-records";
import { emptyCustomerChecklist, parseCustomerChecklist, parseCustomerSchedules, serializeCustomerChecklist } from "./customer-checklist";
import { customerVehicles, shortCustomerBirth, formatCustomerPhone, withCustomerClaimDefaults } from "./customer-form-fields";
import { customerRenewalDays, customerTiming, customerToday, type CustomerRecord } from "./customer-lookup-model";
import { CALENDAR_UPDATED, type CalendarEvent } from "@/app/features/home/components/dashboard/reminder-utils";
import { formatCalendarTime, compareCalendarTimes } from "@/lib/calendar-time";

type Renewal = { key:string; name:string; birth:string; insurer:string; days:number; date:string };
export default function HomeOverview() {
 const { authUser, authLoading } = useAuth();
 const owner = authUser?.id;
 const [scheduleDraft,setScheduleDraft]=useState<CalendarEventForm|null>(null),[scheduleSaving,setScheduleSaving]=useState(false),[scheduleError,setScheduleError]=useState("");
 const scheduleBusy=useRef(false);
 const [customerQuery,setCustomerQuery]=useState("");
 const ownerRef=useRef(owner);ownerRef.current=owner;
 const savingRef=useRef(false);
 const [savingContact,setSavingContact]=useState<string|null>(null),[contactError,setContactError]=useState("");
 const [contracts,setContracts]=useState<StoredContract[]>([]);
 const [viewingEvent,setViewingEvent]=useState<CalendarEvent|null>(null);
 const [customers,setCustomers]=useState<CustomerRecord[]>([]);
 const [selectedDate,setSelectedDate]=useState(customerToday);
 const [month,setMonth]=useState(()=>customerToday().slice(0,7));
 const [renewals,setRenewals]=useState<Renewal[]>([]),[events,setEvents]=useState<CalendarEvent[]>([]);
 const [customerError,setCustomerError]=useState(""),[calendarError,setCalendarError]=useState("");
 useEffect(()=>{setScheduleDraft(null);setScheduleError("");},[owner]);
 const [ready,setReady]=useState(false),[today,setToday]=useState(customerToday);
 useEffect(()=>{const refresh=()=>setToday(customerToday());const timer=window.setInterval(refresh,60000);window.addEventListener("focus",refresh);return()=>{clearInterval(timer);window.removeEventListener("focus",refresh)}},[]);
 useEffect(()=>{
  let active=true,revision=0;
  setRenewals([]);setEvents([]);setCustomers([]);setContracts([]);setContactError("");setViewingEvent(null);setReady(false);setCustomerError("");setCalendarError("");
  if(authLoading||!owner)return;
  const load=async()=>{
   const run=++revision;
   const results=await Promise.allSettled([
    (async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error("다시 로그인해 주세요.");const response=await fetch("/api/customers",{cache:"no-store",headers:{Authorization:"Bearer "+session.access_token}});const body=await response.json();if(!response.ok)throw Error(body.error||"고객정보를 불러오지 못했습니다.");return {customers:body.customers as CustomerRecord[],contracts:(body.contracts||[]) as StoredContract[]};})(),
    (async()=>{const {data,error}=await supabase.from("calendar_events").select("*").eq("user_id",owner).gte("date",[month+"-01",consultationWeek(today).start].sort()[0]).lte("date",(()=>{const [y,m]=month.split("-").map(Number);const next=new Date(Date.UTC(y,m,1));next.setUTCDate(0);return [next.toISOString().slice(0,10),consultationWeek(today).end].sort().at(-1)!;})());if(error)throw error;return (data||[]) as CalendarEvent[];})()
   ]);
   if(!active||run!==revision)return;
   const customers=results[0],calendar=results[1];
   if(customers.status==="fulfilled"){
    setCustomers(customers.value.customers);setContracts(customers.value.contracts);
    setRenewals(customers.value.customers.flatMap(customer=>customerVehicles(customer).flatMap((vehicle,index)=>{const days=customerRenewalDays(vehicle.renewal,today);if(days===null||days<0||days>30)return [];const date=new Date(today+"T00:00:00Z");date.setUTCDate(date.getUTCDate()+days);return [{key:customer.id+":"+index,name:customer.name,birth:shortCustomerBirth(customer.birth),insurer:vehicle.insurer,days,date:date.toISOString().slice(0,10)}];})).sort((a,b)=>a.days-b.days||a.name.localeCompare(b.name)));
    setCustomerError("");
   }else setCustomerError(customers.reason instanceof Error?customers.reason.message:"고객정보를 불러오지 못했습니다.");
   if(calendar.status==="fulfilled"){setEvents(calendar.value.sort((a,b)=>compareCalendarTimes(a.time||"",b.time||"")));setCalendarError("");}else setCalendarError("오늘 일정을 불러오지 못했습니다.");
   setReady(true);
  };
  void load();const refresh=()=>{if(!savingRef.current)void load();};window.addEventListener(CALENDAR_UPDATED,refresh);window.addEventListener("customer-schedules-updated",refresh);window.addEventListener("focus",refresh);
  return()=>{active=false;window.removeEventListener(CALENDAR_UPDATED,refresh);window.removeEventListener("customer-schedules-updated",refresh);window.removeEventListener("focus",refresh)};
 },[owner,authLoading,today,month]);
 const saveSchedule=async()=>{
  if(!scheduleDraft||scheduleBusy.current||!owner)return;
  const draft=scheduleDraft,savingOwner=owner;
  if(!draft.title.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)||!Number.isFinite(Date.parse(draft.date+'T00:00:00Z'))||new Date(draft.date+'T00:00:00Z').toISOString().slice(0,10)!==draft.date||(draft.time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.time))){setScheduleError('제목과 날짜·시간을 확인해 주세요.');return;}
  scheduleBusy.current=true;setScheduleSaving(true);setScheduleError('');
  try{const {data:{session}}=await supabase.auth.getSession();if(!session||session.user.id!==savingOwner)throw Error('다시 로그인해 주세요.');const {error,data}=await supabase.from('calendar_events').insert({...draft,title:draft.title.trim(),time:draft.time||null,place:draft.place||null,memo:draft.memo||null,user_id:savingOwner}).select('id');if(error||!data?.length)throw error||Error('일정을 저장하지 못했습니다.');if(ownerRef.current!==savingOwner)return;setScheduleDraft(null);window.dispatchEvent(new Event(CALENDAR_UPDATED));}catch(error){if(ownerRef.current===savingOwner)setScheduleError(error instanceof Error?error.message:'일정을 저장하지 못했습니다.');}finally{scheduleBusy.current=false;setScheduleSaving(false);}
 };
 const contactChecked=(customer:CustomerRecord)=>{try{return customer.checklist?parseCustomerChecklist(customer.checklist).contact:false;}catch{return false;}};
 const toggleContact=async(customer:CustomerRecord)=>{
  if(savingRef.current||!owner)return;
  const savingOwner=owner;savingRef.current=true;setSavingContact(customer.id);setContactError("");
  try{
   const checked=customer.checklist?parseCustomerChecklist(customer.checklist):emptyCustomerChecklist();
   const checklist=serializeCustomerChecklist({...checked,contact:!checked.contact},parseCustomerSchedules(customer.checklist));
   const {data:{session}}=await supabase.auth.getSession();if(!session||session.user.id!==savingOwner)throw Error("다시 로그인해 주세요.");
   const response=await fetch("/api/customers",{method:"POST",headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({action:"update",kind:"customer",recordId:customer.id,revision:Number(customer.revision),values:withCustomerClaimDefaults({...customer,checklist})})});
   const result=await response.json();if(!response.ok)throw Error(result.error||"안부연락을 저장하지 못했습니다.");
   if(ownerRef.current!==savingOwner)return;
   setCustomers(rows=>rows.map(row=>row.id===customer.id?result.record:row));
   window.dispatchEvent(new Event("customer-schedules-updated"));
  }catch(error){if(ownerRef.current===savingOwner)setContactError(error instanceof Error?error.message:"안부연락을 저장하지 못했습니다.");}
  finally{savingRef.current=false;setSavingContact(null);}
 };
 const query=customerQuery.trim().toLocaleLowerCase(),digits=query.replace(/\D/g,"");
 const filteredCustomers=customers.filter(customer=>!query||customer.name.toLocaleLowerCase().includes(query)||Boolean(digits&&/^[\d\s().+-]+$/.test(query)&&((customer.phone||"").replace(/\D/g,"").includes(digits)||shortCustomerBirth(customer.birth).includes(digits))));
 const selectedEvents=events.filter(event=>event.date===selectedDate);
 const empty=(error:string,text:string)=>error?<p role="alert" className="text-sm text-red-500">{error}</p>:ready?<p className="text-sm text-slate-400">{text}</p>:null;
 return <div className="grid gap-3">

  <div className="grid grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)_284px] gap-3 items-start">
  <section aria-label="빈 공간" data-ui-card="true" className="personal-grid hidden md:block min-h-40 min-w-0 rounded-2xl border border-gray-200 bg-white p-4"/>
  <div className="contents">

  <section data-ui-card="true" className="personal-grid min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
   <div className="flex items-center justify-between mb-3"><h2 data-personal-card-title="true" className="flex items-center gap-2"><Users size={19}/>고객 목록</h2><button type="button" data-icon-only="true" aria-label="고객 추가" onClick={()=>window.dispatchEvent(new Event("personal-home-add-customer"))} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus size={20}/></button></div>
   <div data-search-box="true" className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3"><Search size={16} className="shrink-0 text-slate-400"/><ClearableSearchInput aria-label="고객 이름 전화번호 생년월일 검색" placeholder="이름 · 전화번호 · 생년월일 검색" value={customerQuery} onChange={event=>setCustomerQuery(event.target.value)} onClear={()=>setCustomerQuery("")} className="w-full min-w-0 border-0 bg-transparent text-sm outline-none"/></div>
   {customerError||!filteredCustomers.length?empty(customerError,customers.length?"검색 결과가 없습니다.":""):<div className="max-h-[640px] overflow-auto"><table className="w-full min-w-[520px] text-sm text-center"><thead className="sticky top-0 bg-white text-slate-500"><tr><th className="py-3">이름</th><th>생년월일</th><th>전화번호</th><th>상령일</th><th>계약 수</th><th>안부연락</th></tr></thead><tbody>{filteredCustomers.map(customer=><tr key={customer.id} className="border-t border-slate-100"><td className="py-3 font-semibold">{customer.name}</td><td>{shortCustomerBirth(customer.birth)}</td><td>{formatCustomerPhone(customer.phone || "")}</td><td>{customerTiming(customer.birth,today)?.upperDate || ""}</td><td>{contracts.filter(contract=>contract.customerId===customer.id).length}건</td><td><input type="checkbox" aria-label={customer.name+" 안부연락"} checked={contactChecked(customer)} disabled={savingContact!==null} onChange={()=>void toggleContact(customer)} className="h-4 w-4 accent-blue-600 cursor-pointer" /></td></tr>)}</tbody></table></div>}
   {contactError&&<p role="alert" className="mt-3 text-sm text-red-500">{contactError}</p>}
  </section>
  </div>
  <div className="hidden md:grid gap-3">
  <section data-ui-card="true" className="personal-grid min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
   <HomeMiniCalendar month={month} value={selectedDate} today={today} eventDates={new Set(events.map(event=>event.date))} onChange={setSelectedDate} onMonthChange={value=>{setMonth(value);setSelectedDate(value===today.slice(0,7)?today:value+"-01");}}/>
   <div className="mt-4 border-t border-gray-200 pt-4">
   <div className="flex items-center justify-between mb-3"><h2 data-personal-card-title="true" className="flex items-center gap-2"><CalendarDays size={19}/>{selectedDate===today?"오늘 일정":"일정 목록"}</h2><time className="text-sm text-slate-400">{selectedDate}</time></div>
   {calendarError||!selectedEvents.length?empty(calendarError,"등록된 일정이 없습니다."):<ul className="divide-y divide-slate-100">{selectedEvents.map(event=><li key={event.id} className="flex items-center gap-3 py-3 text-sm"><time className="w-12 shrink-0 text-slate-500">{event.time?formatCalendarTime(event.time):"종일"}</time><button type="button" className="min-w-0 flex-1 truncate text-left font-semibold hover:text-blue-600 cursor-pointer" title={event.title} onClick={()=>setViewingEvent(event)}>{event.title}</button></li>)}</ul>}
   </div>
  </section>
  <section data-ui-card="true" className="personal-grid min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
   <div className="flex items-center justify-between mb-3"><h2 data-personal-card-title="true" className="flex items-center gap-2"><Car size={19}/>자동차 갱신</h2></div>
   {customerError||!renewals.length?empty(customerError,"30일 이내 갱신 예정인 차량이 없습니다."):<div className="overflow-x-auto"><table className="w-full min-w-0 text-sm text-center"><thead className="text-slate-500"><tr><th className="pb-3 whitespace-nowrap">이름</th><th className="pb-3 whitespace-nowrap">생년월일</th><th className="pb-3 whitespace-nowrap">디데이</th></tr></thead><tbody>{renewals.map(row=><tr key={row.key} className="border-t border-slate-100"><td className="py-3 font-semibold">{row.name}</td><td>{row.birth}</td><td className="font-semibold text-blue-600 whitespace-nowrap">{row.days===0?"D-Day":"D-"+row.days}</td></tr>)}</tbody></table></div>}
  </section>
  </div>
  </div>
 {scheduleDraft&&<CalendarEventModal formData={scheduleDraft} setFormData={setScheduleDraft} editingEvent={false} saving={scheduleSaving} error={scheduleError} onClose={()=>{if(!scheduleBusy.current)setScheduleDraft(null);}} onSave={()=>void saveSchedule()}/>}
 {viewingEvent && <CalendarEventDetails event={viewingEvent} onClose={()=>setViewingEvent(null)}/>}
 </div>;
}
