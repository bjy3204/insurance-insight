"use client";
import { CalendarDays, Clock, MapPin, AlignLeft } from "lucide-react";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";
import { koreaDate } from "@/app/features/home/components/dashboard/reminder-utils";
import { formatCalendarTime } from "@/lib/calendar-time";
import styles from "./CalendarEventDetails.module.css";
export type CalendarDetails={id?:string;title:string;date:string;icon:string;category?:string;time?:string|null;place?:string|null;memo?:string|null;content?:string|null};
export default function CalendarEventDetails({event,onClose,onEdit,onDelete}:{event:CalendarDetails;onClose:()=>void;onEdit?:()=>void;onDelete?:()=>void}){
 const date=new Date(`${event.date}T00:00:00Z`);
 const remaining=Math.round((date.getTime()-Date.parse(`${koreaDate()}T00:00:00Z`))/86400000);
 const dday=remaining===0?"D-Day":remaining>0?`D-${remaining}`:`D+${Math.abs(remaining)}`;
 const weekday=date.toLocaleDateString("ko-KR",{weekday:"long",timeZone:"UTC"});
 const memo=[event.content,event.memo].filter((value,index,all)=>value&&all.indexOf(value)===index).join("\n\n");
 return <DashboardDialog title="일정 확인" onClose={onClose}><div className={styles.content}>
  <div className={styles.hero}><div className={styles.icon} aria-hidden="true">{event.icon||"📅"}</div><div className={styles.title}><span className={styles.category}>{event.category||"개인"}</span><h2>{event.title}</h2></div><span className={styles.dday} data-today={remaining===0}>{dday}</span></div>
  <div className={styles.date}><CalendarDays size={21}/><div><strong>{date.getUTCFullYear()}년 {date.getUTCMonth()+1}월 {date.getUTCDate()}일</strong><span>{weekday}</span></div></div>
  <div className={styles.metadata}><div><Clock size={20}/><span><small>시간</small><strong>{formatCalendarTime(event.time)||"종일"}</strong></span></div>{event.place&&<div><MapPin size={20}/><span><small>장소</small><strong>{event.place}</strong></span></div>}</div>
  {memo&&<div className={styles.memo}><div><AlignLeft size={18}/>메모</div><p>{memo}</p></div>}
  <div className={styles.actions}>{onEdit&&<button data-action-height="48" className={styles.edit} type="button" onClick={onEdit}>수정</button>}{onDelete&&<button data-action-height="48" className={styles.delete} type="button" onClick={onDelete}>삭제</button>}</div>
 </div></DashboardDialog>;
}
