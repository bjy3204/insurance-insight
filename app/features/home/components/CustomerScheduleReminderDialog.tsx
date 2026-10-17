"use client";
import { useState } from "react";
import { Bell, CalendarDays } from "lucide-react";
import DashboardDialog from "./dashboard/DashboardDialog";
import { supabase } from "@/lib/supabase";
export type CustomerScheduleReminder={id:string;customerId:string;scheduleId:string;name:string;label:string;date:string;memo?:string};
export default function CustomerScheduleReminderDialog({item,onClose,onComplete}:{item:CustomerScheduleReminder;onClose:()=>void;onComplete:()=>void}){
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const complete=async()=>{
  if(saving)return;setSaving(true);setError("");
  try{
   const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error("다시 로그인해 주세요");
   const response=await fetch("/api/customers",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({action:"complete-schedule",customerId:item.customerId,scheduleId:item.scheduleId,date:item.date})});
   if(!response.ok)throw Error("완료 체크를 저장하지 못했습니다");
   onComplete();window.dispatchEvent(new Event("customer-schedules-updated"));
  }catch(error){setError(error instanceof Error?error.message:"저장하지 못했습니다");}finally{setSaving(false);}
 };
 return <DashboardDialog title="고객 알림 확인" onClose={()=>{if(!saving)onClose();}}><div className="space-y-5"><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-blue-500"/><div><p className="text-sm text-slate-500">{item.label}</p><h3 className="text-xl font-bold text-slate-700">{item.name}</h3></div></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-slate-600"><CalendarDays size={18}/>{item.date}</div>{item.memo&&<p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{item.memo}</p>}<label className="flex items-center gap-3 text-base text-slate-600"><input type="checkbox" aria-label={`${item.name} ${item.label} 완료`} disabled={saving} checked={saving} onChange={()=>void complete()} className="h-4 w-4 cursor-pointer accent-blue-600"/>완료</label>{error&&<p role="alert" className="text-sm text-red-500">{error}</p>}</div></DashboardDialog>;
}
