"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import { koreaDate } from "@/app/features/home/components/dashboard/reminder-utils";
import MemoSelect from "@/app/components/memos/MemoSelect";
import styles from "./CalendarEventModal.module.css";
export type CalendarEventForm={title:string;content:string;date:string;time:string;place:string;memo:string;icon:string;color:string;category?:string};
const EMOJI_LIST=["📅","💬","💼","✈️","🎂","🎁","📝","📌","⭐","🎉","🏥","🚗","🍽️","☕","📞","🏠","🏃","🔔","❤️","✅"];
const categories=["개인","상담","업무","여행","기념일","기타"].map(label=>({value:label,label}));
export default function CalendarEventModal({formData,setFormData,editingEvent,onClose,onSave,onDelete,saving=false,error=""}:{formData:CalendarEventForm;setFormData:(value:CalendarEventForm)=>void;editingEvent:boolean;onClose:()=>void;onSave:()=>void;onDelete?:()=>void;saving?:boolean;error?:string}){
 const [emojiOpen,setEmojiOpen]=useState(false),[dateOpen,setDateOpen]=useState(false);
 const [month,setMonth]=useState(()=>new Date((formData.date||new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"})).slice(0,7)+"-01T12:00:00"));
 const [position,setPosition]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number}|null>(null),panel=useRef<HTMLDivElement>(null);
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>lockPageScroll(),[]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  panel.current?.querySelector<HTMLInputElement>('input[aria-label="일정 제목"]')?.focus();
  return()=>previous?.focus();
 },[]);
 useEffect(()=>{
  const keyboard=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){if(event.defaultPrevented||event.target instanceof Element&&event.target.closest('[role="listbox"]'))return;event.stopImmediatePropagation();if(emojiOpen||dateOpen){setEmojiOpen(false);setDateOpen(false);}else close.current();}
   if(event.key!=="Tab")return;
   const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')||[]);
   if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
   if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
  };
  document.addEventListener("keydown",keyboard);return()=>{document.removeEventListener("keydown",keyboard);};
 },[emojiOpen,dateOpen]);
 const update=(patch:Partial<CalendarEventForm>)=>setFormData({...formData,...patch});
 const year=month.getFullYear(),monthIndex=month.getMonth();
 const difference=Math.round((Date.parse(formData.date+"T00:00:00Z")-Date.parse(koreaDate()+"T00:00:00Z"))/86400000);
 const dday=Number.isFinite(difference)?difference===0?"D-Day":difference>0?`D-${difference}`:`D+${Math.abs(difference)}`:"";
 return createPortal(<div className={styles.editor} role="dialog" aria-modal="true" aria-label={editingEvent?"일정 수정":"일정 추가"} onClick={()=>{if(!saving)onClose();}}>
 <div ref={panel} className={styles.panel} style={{transform:`translate(${position.x}px,${position.y}px)`}} onClick={event=>event.stopPropagation()}>
 <header className={styles.header} onPointerDown={event=>{if(window.innerWidth<640||(event.target as HTMLElement).closest("button"))return;drag.current={x:event.clientX-position.x,y:event.clientY-position.y};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(drag.current)setPosition({x:event.clientX-drag.current.x,y:event.clientY-drag.current.y});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
 <h2>{editingEvent?"일정 수정":"일정 추가"}</h2><button type="button" className={styles.closeButton} disabled={saving} aria-label="닫기" onClick={onClose}><X size={22}/></button>
 </header>
 <div className={styles.body}>
 <div className={styles.hero}>
 <div className={styles.relative}><button type="button" className={styles.emojiButton} disabled={saving} aria-label="아이콘 선택" aria-expanded={emojiOpen} onClick={()=>{setEmojiOpen(!emojiOpen);setDateOpen(false);}}>{formData.icon}</button>
 {emojiOpen&&<><button type="button" className={styles.dismiss} aria-label="아이콘 선택 닫기" onClick={()=>setEmojiOpen(false)}/><div className={styles.emojiMenu}>{EMOJI_LIST.map(icon=><button key={icon} type="button" aria-label={icon} onClick={()=>{update({icon});setEmojiOpen(false);}}>{icon}</button>)}</div></>}
 </div>
 <div className={styles.heroText}><MemoSelect label="일정 구분" value={formData.category||"개인"} options={categories} disabled={saving} onChange={category=>update({category})}/><input className={styles.titleInput} aria-label="일정 제목" placeholder="제목 입력" disabled={saving} value={formData.title} onChange={event=>update({title:event.target.value})}/></div>
 {dday&&<span className={styles.dday}>{dday}</span>}
 </div>
 <div className={`${styles.field} ${styles.relative} ${styles.dateField}`}><div className={styles.inputWithIcon}><input aria-label="날짜" inputMode="numeric" maxLength={10} disabled={saving} value={formData.date} onChange={event=>{const digits=event.target.value.replace(/\D/g,"").slice(0,8);update({date:[digits.slice(0,4),digits.slice(4,6),digits.slice(6,8)].filter(Boolean).join("-")});}}/><button type="button" disabled={saving} aria-label="달력 열기" aria-expanded={dateOpen} onClick={()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(formData.date)&&Number.isFinite(Date.parse(formData.date)))setMonth(new Date(formData.date.slice(0,7)+"-01T12:00:00"));setDateOpen(!dateOpen);setEmojiOpen(false);}}><CalendarDays size={22}/></button></div>
 {dateOpen&&<><button type="button" className={styles.dismiss} aria-label="달력 닫기" onClick={()=>setDateOpen(false)}/><div className={styles.dateMenu}>
 <div className={styles.monthHeader}><button type="button" aria-label="이전 달" onClick={()=>setMonth(new Date(year,monthIndex-1,1))}><ChevronLeft size={20}/></button><strong>{year}년 {monthIndex+1}월</strong><button type="button" aria-label="다음 달" onClick={()=>setMonth(new Date(year,monthIndex+1,1))}><ChevronRight size={20}/></button></div>
 <div className={styles.days}>{["일","월","화","수","목","금","토"].map((day,index)=><span key={day} data-weekday={index}>{day}</span>)}{Array.from({length:new Date(year,monthIndex,1).getDay()},(_,index)=><span key={`empty-${index}`}/>)}{Array.from({length:new Date(year,monthIndex+1,0).getDate()},(_,index)=>{const date=`${year}-${String(monthIndex+1).padStart(2,"0")}-${String(index+1).padStart(2,"0")}`;return <button key={date} type="button" aria-label={date} aria-pressed={date===formData.date} onClick={()=>{update({date});setDateOpen(false);}}>{index+1}</button>;})}</div>
 </div></>}
 </div>
 <div className={styles.dateTimeRow}>
 <label className={styles.field}><span><Clock size={20}/>시간</span><div className={styles.inputWithIcon}><input aria-label="시간" disabled={saving} inputMode="numeric" maxLength={5} value={formData.time} onChange={event=>{const digits=event.target.value.replace(/\D/g,"").slice(0,4);update({time:digits.length>2?`${digits.slice(0,2)}:${digits.slice(2)}`:digits});}}/></div></label>
 <label className={styles.field}><span><MapPin size={20}/>장소</span><div className={styles.inputWithIcon}><input aria-label="장소" disabled={saving} value={formData.place} onChange={event=>update({place:event.target.value})}/></div></label>
 </div>
 <label className={styles.field}><span>메모</span><textarea aria-label="메모" spellCheck={false} disabled={saving} rows={1} value={formData.memo} onChange={event=>update({memo:event.target.value})}/></label>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 </div>
 <footer className={styles.footer}>{editingEvent&&<button type="button" disabled={saving} className={styles.delete} onClick={onDelete}>삭제</button>}{!editingEvent&&<button type="button" disabled={saving} onClick={onClose}>취소</button>}<button type="button" disabled={saving} className={styles.primary} onClick={onSave}>{saving?"저장 중":editingEvent?"저장":"추가"}</button></footer>
 </div></div>,document.body);
}
