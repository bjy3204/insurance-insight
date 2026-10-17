"use client";
import { useEffect, useState } from "react";
import { Target, Plus } from "lucide-react";
import { parseConsultations } from "./customer-consultations";
import type { CustomerRecord } from "./customer-lookup-model";

export function consultationWeek(today:string){
 const monday=new Date(today+"T00:00:00Z");monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
 const sunday=new Date(monday);sunday.setUTCDate(sunday.getUTCDate()+6);
 return {start:monday.toISOString().slice(0,10),end:sunday.toISOString().slice(0,10)};
}
type Goals={contracts:number;amount:number;consultations:number};
const defaults:Goals={contracts:10,amount:1000000,consultations:10};
export default function HomeWeeklyGoal({customers,contracts,events,today,owner,ready,error,onAddSchedule}:{customers:CustomerRecord[];contracts:import('@/lib/customer-records').StoredContract[];events:import('@/app/features/home/components/dashboard/reminder-utils').CalendarEvent[];today:string;owner?:string;ready:boolean;error:string;onAddSchedule:()=>void}){
 const {start,end}=consultationWeek(today);
 const key=owner?'personal-weekly-goals:'+owner+':'+start:null;
 const [goals,setGoals]=useState<Goals>(defaults),[storageError,setStorageError]=useState('');
 useEffect(()=>{let next={...defaults};try{const stored=key?localStorage.getItem(key):null;if(stored){const parsed=JSON.parse(stored);for(const name of Object.keys(next) as (keyof Goals)[])if(Number.isSafeInteger(parsed[name])&&parsed[name]>0)next[name]=parsed[name];}setStorageError('');}catch{setStorageError('목표를 불러오지 못했습니다');}setGoals(next);},[key]);
 const save=(name:keyof Goals,value:string)=>{const number=Number(value);if(!Number.isSafeInteger(number)||number<1)return;const next={...goals,[name]:number};setGoals(next);try{if(key)localStorage.setItem(key,JSON.stringify(next));setStorageError('');}catch{setStorageError('목표를 저장하지 못했습니다');}};
 let count=0,invalid=false;
 for(const customer of customers){if(!customer.consultations)continue;try{count+=parseConsultations(customer.consultations).filter(entry=>entry.date>=start&&entry.date<=end&&entry.date<=today).length;}catch{invalid=true;}}
 const weeklyContracts=contracts.filter(contract=>contract.date>=start&&contract.date<=end&&contract.date<=today);
 const amount=weeklyContracts.reduce((sum,contract)=>sum+(Number((contract.premium||'').replace(/,/g,''))||0),0);
 const scheduled=events.filter(event=>event.category==='상담'&&event.date>=start&&event.date<=end).length;
 const rows:{key:keyof Goals;label:string;unit:string;value:number}[]=[{key:'contracts',label:'계약 건수',unit:'건',value:weeklyContracts.length},{key:'amount',label:'계약 금액',unit:'원',value:amount},{key:'consultations',label:'상담',unit:'건',value:count}];
 return <section data-ui-card="true" className="personal-grid min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
 <h2 data-personal-card-title="true" className="mb-3 flex items-center gap-2"><Target size={19}/>이번주 목표</h2>
 <p className="text-xs text-slate-400">{start} ~ {end} · 월~일</p>
 <div className="divide-y divide-slate-100">{rows.map(row=>{const percent=Math.round(row.value/goals[row.key]*100);return <div key={row.key} className="py-4">
 <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{row.label}</span><label className="flex items-center gap-2 text-xs text-slate-500"><span data-field-caption="true">목표</span><input key={key+row.key+goals[row.key]} aria-label={row.label+' 목표'} type="text" inputMode="numeric" defaultValue={goals[row.key].toLocaleString()} onChange={event=>{event.target.value=event.target.value.replace(/[^0-9]/g,'');}} onBlur={event=>{save(row.key,event.target.value.replace(/,/g,''));event.target.value=String(Number(event.target.value.replace(/,/g,''))>0?Number(event.target.value.replace(/,/g,'')):goals[row.key]);}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}} className="h-9 w-24 rounded-[10px] border border-gray-200 px-2 text-right text-sm"/>{row.unit}</label></div>
 {ready&&!error&&<><div className="mt-3 flex items-baseline justify-between gap-2"><strong className="text-lg text-blue-600">{row.value.toLocaleString()}<span className="ml-1 text-sm font-medium text-slate-400">/ {goals[row.key].toLocaleString()}{row.unit}</span></strong><span className="text-xs font-semibold text-blue-600">{percent}%</span></div><div role="progressbar" aria-label={row.label+' 진행률'} aria-valuemin={0} aria-valuemax={goals[row.key]} aria-valuenow={Math.min(row.value,goals[row.key])} className="mt-2 h-2 overflow-hidden rounded-full bg-blue-50"><div className="h-full rounded-full bg-blue-600" style={{width:Math.min(percent,100)+'%'}}/></div></>}
 </div>})}</div>
 <div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold">상담 일정 {ready&&!error?scheduled+'건':''}</span><button type="button" data-icon-only="true" aria-label="상담 일정 추가" onClick={onAddSchedule} className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600"><Plus size={18}/></button></div>
 {(error||invalid||storageError)&&<p role="alert" className="mt-3 text-xs text-red-500">{error||storageError||'일부 상담일지를 확인하지 못해 집계에서 제외했습니다'}</p>}
 <button type="button" onClick={()=>window.dispatchEvent(new Event('personal-home-add-contract'))} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2a65ab] text-sm font-semibold text-white"><Plus size={18}/>계약 추가</button>
 </section>;
}
