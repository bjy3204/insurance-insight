"use client";
import { useEffect, useRef, useState } from "react";
import { loadReminders, removeReminder, saveReminder } from "@/app/features/home/components/dashboard/calendar-storage";
import { CALENDAR_UPDATED, koreaDate, type CalendarEvent } from "@/app/features/home/components/dashboard/reminder-utils";
export default function useCalendarReminderToggle(userId:string|null){
 const [enabled,setEnabled]=useState<Record<string,boolean>>({}),[ready,setReady]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const busy=useRef(false),owner=useRef(userId);owner.current=userId;
 useEffect(()=>{
  let stopped=false;let run=0;setReady(false);setEnabled({});setError("");
  const load=async()=>{if(busy.current)return;const current=++run;try{const reminders=await loadReminders(userId);if(!stopped&&current===run){setEnabled(Object.fromEntries(reminders.filter(row=>!row.acknowledged_at).map(row=>[row.event_id,true])));setReady(true);setError("");}}catch{if(!stopped&&current===run){setReady(false);setError("알림 설정을 불러오지 못했습니다.");}}};
  void load();window.addEventListener(CALENDAR_UPDATED,load);window.addEventListener("focus",load);
  return()=>{stopped=true;++run;window.removeEventListener(CALENDAR_UPDATED,load);window.removeEventListener("focus",load);};
 },[userId]);
 const toggle=async(event:CalendarEvent)=>{
  if(!ready||busy.current)return;
  if(event.date<koreaDate()){setError("");return;}
  const requestedOwner=userId,next=!enabled[event.id];busy.current=true;setSaving(true);setError("");
  try{if(next)await saveReminder({event_id:event.id,lead_days:0,notification_date:event.date,acknowledged_at:null},userId);else await removeReminder(event.id,userId);if(owner.current===requestedOwner)setEnabled(current=>({...current,[event.id]:next}));}
  catch{if(owner.current===requestedOwner)setError("알림 설정을 저장하지 못했습니다.");}
  finally{busy.current=false;if(owner.current===requestedOwner)setSaving(false);}
 };
 return {enabled,ready,saving,error,toggle};
}
