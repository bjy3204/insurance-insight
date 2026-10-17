"use client";
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {calendarUpdated} from '@/app/features/home/components/dashboard/calendar-storage';
import {CALENDAR_UPDATED} from '@/app/features/home/components/dashboard/reminder-utils';
import {accountEventRow,eventCalendarFields,type AccountEvent} from '@/lib/notion-crm/account-calendar';
import type {CrmRow,CrmValue} from '@/lib/notion-crm/model';
export default function useAccountCalendar(userId:string|undefined,approved:boolean){
 const [rows,setRows]=useState<CrmRow[]>([]),[error,setError]=useState('');
 const reload=useCallback(async()=>{if(!userId||!approved){setRows([]);return;}const result=await supabase.from('calendar_events').select('*').eq('user_id',userId).order('date',{ascending:true});if(result.error)throw Error('캘린더 일정을 불러오지 못했습니다.');return (result.data as AccountEvent[]||[]).map(accountEventRow);},[userId,approved]);
 useEffect(()=>{let active=true;setRows([]);const load=()=>void reload().then(value=>{if(active){setRows(value||[]);setError('');}}).catch(e=>{if(active)setError(e.message);});load();window.addEventListener(CALENDAR_UPDATED,load);window.addEventListener('focus',load);const channel=userId&&approved?supabase.channel('crm-events:'+userId+':'+crypto.randomUUID()).on('postgres_changes',{event:'*',schema:'public',table:'calendar_events',filter:'user_id=eq.'+userId},load).subscribe():null;return()=>{active=false;window.removeEventListener(CALENDAR_UPDATED,load);window.removeEventListener('focus',load);if(channel)void supabase.removeChannel(channel);};},[reload,userId,approved]);
 const mutate=async(id:string,values?:Record<string,CrmValue>)=>{if(!approved||!userId||!id.startsWith('calendar:'))throw Error('일정을 확인해 주세요.');const base=supabase.from('calendar_events');const result=await (values?base.update(eventCalendarFields(values)):base.delete()).eq('id',id.slice(9)).eq('user_id',userId).select('id');if(result.error||!result.data?.length)throw Error('캘린더 일정을 저장하지 못했습니다. 다시 확인해 주세요.');if(values)setRows(previous=>previous.map(row=>row.id===id?{...row,values}:row));else setRows(previous=>previous.filter(row=>row.id!==id));calendarUpdated();};
 return {rows,error,save:(id:string,values:Record<string,CrmValue>)=>mutate(id,values),remove:(id:string)=>mutate(id)};
}
