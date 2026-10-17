"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function HomeMiniCalendar({month,value,today,eventDates,onMonthChange,onChange}:{month:string;value:string;today:string;eventDates:Set<string>;onMonthChange:(month:string)=>void;onChange:(date:string)=>void}) {
 const [year,index]=month.split("-").map(Number);
 const first=new Date(year,index-1,1).getDay(),count=new Date(year,index,0).getDate();
 const move=(step:number)=>{const date=new Date(year,index-1+step,1);onMonthChange(date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0"));};
 return <div className="aspect-square flex flex-col">
  <div className="flex items-center justify-between mb-1"><button type="button" aria-label="이전 달" className="p-2 rounded-lg hover:bg-slate-50" onClick={()=>move(-1)}><ChevronLeft size={18}/></button><strong className="text-base">{year}년 {index}월</strong><button type="button" aria-label="다음 달" className="p-2 rounded-lg hover:bg-slate-50" onClick={()=>move(1)}><ChevronRight size={18}/></button></div>
  <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1 min-h-0" style={{gridTemplateRows:"24px repeat("+Math.ceil((first+count)/7)+",minmax(0,1fr))"}}>
   {["일","월","화","수","목","금","토"].map((day,i)=><span key={day} className={"flex items-center justify-center "+(i===0?"text-red-400":i===6?"text-blue-500":"text-slate-400")}>{day}</span>)}
   {Array.from({length:first},(_,i)=><span key={"empty"+i}/>)}
   {Array.from({length:count},(_,i)=>{const date=month+"-"+String(i+1).padStart(2,"0");return <button type="button" key={date} aria-label={date} aria-pressed={date===value} aria-current={date===today?"date":undefined} onClick={()=>onChange(date)} className="relative flex min-h-0 items-center justify-center bg-transparent"><span className="relative flex h-full w-full items-center justify-center"><span className={"flex h-7 w-7 items-center justify-center rounded-lg leading-none "+(date===value?"bg-blue-600 text-white":date===today?"bg-blue-50 text-blue-600":"hover:bg-slate-50")}>{i+1}</span>{eventDates.has(date)&&<span aria-label="일정 있음" className={"pointer-events-none absolute left-1/2 top-[calc(50%+9px)] h-[3px] w-[3px] -translate-x-1/2 rounded-full "+(date===value?"bg-white":"bg-blue-500")}/>}</span></button>})}
  </div>
 </div>;
}
