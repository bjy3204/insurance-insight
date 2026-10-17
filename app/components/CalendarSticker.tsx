"use client";
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {createPortal} from 'react-dom';
import dynamic from 'next/dynamic';
import {X,SlidersHorizontal,Check} from 'lucide-react';
import {useWidgetSessionState} from './useWidgetSessionState';
import {CALENDAR_STICKER_OPEN,fitCalendarSticker,type StickerGeometry} from '@/lib/calendar-sticker';
import styles from './CalendarSticker.module.css';
import {MEMO_BACKGROUNDS} from '@/lib/memos/model';
const Calendar=dynamic(()=>import('./calendar/Calendar'),{ssr:false,loading:()=> <p className={styles.loading}>캘린더를 불러오고 있습니다.</p>});
const palette=[['흰색',MEMO_BACKGROUNDS.white],['파랑',MEMO_BACKGROUNDS.blue],['노랑',MEMO_BACKGROUNDS.yellow],['분홍',MEMO_BACKGROUNDS.red],['투명','clear']];
type Dock='left'|'right'|null;
export default function CalendarSticker(){
 const [open,setOpen,ready]=useWidgetSessionState('calendar-sticker:open',false);
 const [geometry,setGeometry]=useWidgetSessionState<StickerGeometry>('calendar-sticker:geometry',{x:24,y:100,width:380,height:520});
 const [dock,setDock]=useWidgetSessionState<Dock>('calendar-sticker:dock',null);
 const [appearance,setAppearance]=useWidgetSessionState('calendar-sticker:appearance',{color:'#ffffff',opacity:1});
 const [settings,setSettings]=useState(false);
 useEffect(()=>{
  const previousColors:Record<string,string>={'#dceefb':MEMO_BACKGROUNDS.blue,'#fff3a6':MEMO_BACKGROUNDS.yellow,'#fce0e8':MEMO_BACKGROUNDS.red};
  setAppearance(value=>previousColors[value.color]?{...value,color:previousColors[value.color]}:value);
 },[setAppearance]);
 const latest=useRef(geometry);
 useEffect(()=>{latest.current=geometry;},[geometry]);
 const lastHeaderPress=useRef<{time:number;x:number;y:number}|null>(null);
 const gesture=useRef<{kind:'move'|'resize';startX:number;startY:number;original:StickerGeometry}|null>(null);
 const frame=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!settings)return;
  const close=(event:globalThis.PointerEvent)=>{if(!(event.target as HTMLElement).closest('[data-calendar-settings],button[aria-label="캘린더 스티커 설정"]'))setSettings(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setSettings(false);};
  document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
 },[settings]);
 const viewport=()=>({width:window.innerWidth,height:window.innerHeight});
 useEffect(()=>{
  const show=()=>{setGeometry(value=>fitCalendarSticker(value,viewport()));setDock(null);setOpen(true);};
  const resize=()=>setGeometry(value=>fitCalendarSticker(value,viewport()));
  window.addEventListener(CALENDAR_STICKER_OPEN,show);window.addEventListener('resize',resize);
  return()=>{window.removeEventListener(CALENDAR_STICKER_OPEN,show);window.removeEventListener('resize',resize);};
 },[setOpen,setGeometry,setDock]);
 useEffect(()=>{if(ready&&open)setGeometry(value=>fitCalendarSticker(value,viewport()));},[ready,open,setGeometry]);
 const begin=(event:PointerEvent<HTMLElement>,kind:'move'|'resize')=>{
  if(event.button!==0||kind==='move'&&(event.target as HTMLElement).closest('button'))return;
  if(kind==='move'){
   const previous=lastHeaderPress.current,now=Date.now();
   if(previous&&now-previous.time<400&&Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<6){
    lastHeaderPress.current=null;gesture.current=null;const value=latest.current;setDock(value.x+value.width/2<window.innerWidth/2?'left':'right');return;
   }
   lastHeaderPress.current={time:now,x:event.clientX,y:event.clientY};
  }
  event.preventDefault();gesture.current={kind,startX:event.clientX,startY:event.clientY,original:latest.current};event.currentTarget.setPointerCapture(event.pointerId);
 };
 const move=(event:PointerEvent<HTMLElement>)=>{
  const current=gesture.current;if(!current)return;
  const dx=event.clientX-current.startX,dy=event.clientY-current.startY;
  if(Math.hypot(dx,dy)>5)lastHeaderPress.current=null;
  const next=current.kind==='move'?{...current.original,x:current.original.x+dx,y:current.original.y+dy}:{...current.original,width:current.original.width+dx,height:current.original.height+dy};
  const fitted=fitCalendarSticker(next,viewport());latest.current=fitted;setGeometry(fitted);
 };
 const end=()=>{
  const current=gesture.current;gesture.current=null;if(current?.kind!=='move')return;
  const value=latest.current;if(value.x<=12)setDock('left');else if(value.x+value.width>=window.innerWidth-12)setDock('right');
 };
 const fold=()=>setDock(geometry.x+geometry.width/2<window.innerWidth/2?'left':'right');
 if(!ready||!open)return null;
 return createPortal(dock?<button type="button" className={`${styles.edge} ${dock==='left'?styles.left:styles.right}`} style={{top:Math.max(0,Math.min(window.innerHeight-36,geometry.y))}} aria-label="캘린더 스티커 펼치기" title="캘린더 펼치기" onClick={()=>{setGeometry(value=>fitCalendarSticker({...value,x:dock==='left'?16:window.innerWidth-value.width-16},viewport()));setDock(null);}}>{new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'})}</button>:<section ref={frame} onPointerDown={event=>{if((event.target as HTMLElement).closest('[data-calendar-month-row="true"]')&&!(event.target as HTMLElement).closest('button'))begin(event,'move');}} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;}} onDoubleClick={event=>{if((event.target as HTMLElement).closest('[data-calendar-month-row="true"]')&&!(event.target as HTMLElement).closest('button'))fold();}} className={styles.sticker} data-calendar-sticker="true" aria-label="캘린더 스티커" style={{left:geometry.x,top:geometry.y,width:geometry.width,height:'auto',maxHeight:`calc(100dvh - ${geometry.y+12}px)`,'--sticker-color':appearance.color,'--sticker-opacity':appearance.opacity,'--sticker-today':appearance.color===MEMO_BACKGROUNDS.yellow?'#fff4be':appearance.color===MEMO_BACKGROUNDS.red?'#ffe0ed':appearance.color===MEMO_BACKGROUNDS.blue?'#dceaff':'#edf5ff'} as CSSProperties}>
  <header className={styles.header} onPointerDown={event=>begin(event,'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;}} onDoubleClick={event=>{if(!(event.target as HTMLElement).closest('button'))fold();}}><button type="button" aria-label="캘린더 스티커 설정" title="설정" aria-expanded={settings} aria-haspopup="dialog" onClick={()=>setSettings(value=>!value)}><SlidersHorizontal size={17}/></button><span className={styles.headerSpacer} aria-hidden="true"/><button type="button" aria-label="캘린더 스티커 닫기" title="닫기" onClick={()=>setOpen(false)}><X size={19}/></button></header>
  <div className={styles.content}>
   <Calendar mode="sticker"/>
  
  </div>
  {settings&&<div data-calendar-settings="true" className={styles.settings} role="dialog" aria-label="캘린더 색상 설정"><p>배경 색상</p><div className={styles.palette}>{palette.map(([label,color])=><button data-color-swatch="true" key={color} type="button" aria-label={label} title={label} aria-pressed={color==='clear'?appearance.opacity<1:appearance.color===color&&appearance.opacity===1} style={{background:color==='clear'?'repeating-conic-gradient(#e5e7eb 0% 25%,white 0% 50%) 0 / 8px 8px':color}} onClick={()=>setAppearance(()=>color==='clear'?{color:MEMO_BACKGROUNDS.clear,opacity:0.4}:{color,opacity:1})}>{(color==='clear'?appearance.opacity<1:appearance.color===color&&appearance.opacity===1)&&<Check size={14}/>}</button>)}</div></div>}
  <button type="button" className={styles.resize} title="드래그하여 크기 조절" aria-label="캘린더 스티커 크기 조절" onPointerDown={event=>begin(event,'resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;}}></button>
 </section>,document.body);
}
