"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readLocalEvents } from "./dashboard/calendar-storage";
import { CALENDAR_UPDATED, todayBannerEvents, type CalendarEvent } from "./dashboard/reminder-utils";
import { formatCalendarTime } from "@/lib/calendar-time";
import {eventCalendarFields} from '@/lib/notion-crm/account-calendar';
import type {CrmRow} from '@/lib/notion-crm/model';
import CalendarEventDetails from "@/app/components/calendar/CalendarEventDetails";
import CustomerScheduleReminderDialog, {type CustomerScheduleReminder} from "./CustomerScheduleReminderDialog";
import styles from "./CustomerReminderNotice.module.css";
import { useSharedHomeController } from "../HomeControllerProvider";
import { NOTIFICATION_BANNER_ID } from "../notification-banner";
type Reminder={id:string;name:string;label:string;date:string;event?:CalendarEvent;customerId?:string;scheduleId?:string;memo?:string};
export default function CustomerReminderNotice(){
 const {hiddenMenuIds}=useSharedHomeController();
 const [rows,setRows]=useState<Reminder[]>([]);
 const [customerViewing,setCustomerViewing]=useState<CustomerScheduleReminder|null>(null);
 const [viewing,setViewing]=useState<CalendarEvent|null>(null);
 useEffect(()=>{
  let active=true,run=0;
  const load=async()=>{
   const current=++run;
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!active||current!==run)return;
    const userId=session?.user.id||null;
    const results=await Promise.allSettled([
      session?fetch("/api/customers?view=reminders",{cache:"no-store",headers:{Authorization:`Bearer ${session.access_token}`}}).then(async response=>response.ok?(await response.json()).reminders||[]:[]):Promise.resolve([]),
      (async()=>{
       const stored=userId?await supabase.from("calendar_events").select("*").eq("user_id",userId):{data:readLocalEvents(),error:null};
       if(stored.error)throw stored.error;
       const completion=userId?await supabase.from('customer_settings').select('calendar_completed').eq('user_id',userId).maybeSingle():{data:{calendar_completed:JSON.parse(localStorage.getItem('insurance-calendar-completed-v1')||'{}')},error:null};
       if(completion.error)throw completion.error;
       const completed=completion.data?.calendar_completed||{};
       let linked:CalendarEvent[]=[];
       if(session){
        const provider=localStorage.getItem('crm-storage-provider');
        if(['notion','sheets','native'].includes(provider||'')){
         const response=await fetch('/api/my-page'+(provider==='notion'?'':'/'+provider)+'?source=events',{cache:'no-store',headers:{Authorization:'Bearer '+session.access_token}});
         if(response.ok){const result=await response.json();linked=(result.data?.events||[]).flatMap((row:CrmRow)=>{try{const fields=eventCalendarFields(row.values);if(row.values['완료'])return [];return [{...fields,id:'crm:'+row.id,icon:'📅',color:'blue'}];}catch{return [];}});}
        }
       }
       return todayBannerEvents([...(stored.data||[]) as CalendarEvent[],...linked],completed).map(event=>({id:`calendar:${event.id}`,date:event.date,name:"",label:event.title,event}));
      })()
    ]);
    const all=results.flatMap(result=>result.status==="fulfilled"?result.value:[]);
    if(active&&current===run){setRows(all);setViewing(current=>current&&all.some(row=>row.event?.id===current.id)?all.find(row=>row.event?.id===current?.id).event:null);}
   }catch{if(active&&current===run)setRows([]);}
  };
  const refresh=()=>{if(document.visibilityState==="visible")void load();};
  void load();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{++run;setRows([]);setViewing(null);setCustomerViewing(null);setTimeout(()=>{if(active)void load();},0);});
  const timer=window.setInterval(refresh,60000);
  window.addEventListener(CALENDAR_UPDATED,refresh);window.addEventListener("storage",refresh);window.addEventListener("focus",refresh);window.addEventListener("customer-schedules-updated",refresh);document.addEventListener("visibilitychange",refresh);
  return ()=>{active=false;++run;subscription.unsubscribe();clearInterval(timer);window.removeEventListener(CALENDAR_UPDATED,refresh);window.removeEventListener("storage",refresh);window.removeEventListener("focus",refresh);window.removeEventListener("customer-schedules-updated",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[]);
 if(!rows.length||hiddenMenuIds.includes(NOTIFICATION_BANNER_ID))return null;
 return <><section className={styles.notice} aria-label="알림 배너"><div className={styles.viewport}><div className={styles.track}>{[0,1].map(copy=><div key={copy} className={styles.group} aria-hidden={copy===1?true:undefined}>{rows.map(row=>row.event?<button type="button" tabIndex={copy===1?-1:0} className={styles.item} key={row.id} onClick={()=>setViewing(row.event!)}><span className={styles.label}><Bell size={16} aria-hidden="true"/>[ 일정 ]</span><strong>{row.label}</strong>{row.event.time&&<span>{formatCalendarTime(row.event.time)}</span>}</button>:<button type="button" tabIndex={copy===1?-1:0} className={styles.item} key={row.id} onClick={()=>{if(row.customerId&&row.scheduleId)setCustomerViewing(row as CustomerScheduleReminder);}}><span className={styles.label}><Bell size={16} aria-hidden="true"/>[ 고객 ]</span><strong>{row.name}</strong><span>{row.label}</span></button>)}</div>)}</div></div></section>{customerViewing&&<CustomerScheduleReminderDialog item={customerViewing} onClose={()=>setCustomerViewing(null)} onComplete={()=>{setRows(current=>current.filter(row=>row.id!==customerViewing.id));setCustomerViewing(null);}}/>}{viewing&&<CalendarEventDetails event={viewing} onClose={()=>setViewing(null)}/>}</>;
}
