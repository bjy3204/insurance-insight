"use client";
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {CircleHelp,X} from 'lucide-react';
import connectionStyles from '@/app/notion-crm/ConnectionGuide.module.css';
import styles from './CoverageReportGuide.module.css';

const sections=[
 ['고객명 · 생년월일 입력',<><p>고객명과 생년월일 6자리를 입력해 주세요<br/>예시: 홍길동 / 900101</p><p>같은 계정에서 <strong>고객명과 생년월일이 같은 리포트는 작업 내용이 자동 저장·동기화</strong>됩니다<br/>고객관리 연결이나 고객저장을 하지 않은 고객도 동일하게 적용됩니다</p><p>고객명과 생년월일 입력란은 창마다 독립적으로 유지됩니다<br/>따라서 창을 여러 개 열어 서로 다른 고객의 리포트를 동시에 작업할 수 있습니다</p><ul><li>같은 고객명 + 생년월일 → 해당 고객의 작업 내용 동기화</li><li>다른 고객명 또는 생년월일 → 서로 다른 문서로 관리</li><li>다른 계정 → 저장 내용이 공유되거나 섞이지 않음</li></ul></>],
 ['설계사 정보 입력',<><p>설계사명, 소속, 연락처, 팩스, 이메일, 분석 기준일을 입력해 주세요</p><p><strong>설계사 정보는 고객별 리포트와 별도로 관리되는 계정 공통 정보</strong>입니다<br/>같은 계정으로 다른 창을 열어도 동기화되며, 고객을 바꾸거나 리포트를 초기화해도 유지됩니다</p></>],
 ['리모델링 전 · 후 입력',<><p>리모델링 전에는 현재 가입한 보험을, 리모델링 후에는 변경할 보험 내용을 입력해 주세요</p><p>두 표를 입력하면 <strong>리모델링 비교와 요약보고서가 자동으로 작성</strong>됩니다<br/>보장금액, 보험료 등은 입력한 내용을 기준으로 계산됩니다</p></>],
 ['셀 복사 · 여러 셀 한 번에 지우기',<><p>마우스로 셀 여러 개를 드래그해 선택할 수 있습니다</p><ul><li><kbd>Ctrl + C</kbd> → 선택한 내용 복사</li><li><kbd>Ctrl + V</kbd> → 복사한 내용 붙여넣기</li><li><kbd>Delete</kbd> 또는 <kbd>Backspace</kbd> → 선택한 셀의 내용 한 번에 지우기</li></ul></>],
 ['보장금액 · 단위 수정',<><p>금액 입력 부분과 단위 부분을 각각 눌러 수정할 수 있습니다</p><p>만원 단위에서 <strong>20,000을 입력하면 2억으로 자동 표시</strong>됩니다<br/>단위를 다시 만원으로 변경하면 <strong>금액은 유지되고 20,000만원으로 표시</strong>됩니다</p></>],
 ['분류 · 보장 항목 편집',<p>분류와 보장 항목은 필요한 내용에 맞게 추가하거나 삭제할 수 있습니다<br/>분류명과 보장 항목명을 눌러 이름을 수정하고, 추가 기능으로 필요한 항목을 입력해 주세요</p>],
 ['자동 저장 · 고객저장',<><p><strong>자동 저장</strong>은 입력 중인 리포트 내용을 같은 계정의 고객명 + 생년월일별로 보관하는 기능입니다<br/>같은 고객을 다른 창에서 작업하면 변경 내용이 잠시 후 반영됩니다</p><p><strong>고객저장</strong>은 고객별 리포트를 저장하고 고객 목록에서 다시 불러오기 위한 기능입니다</p><ul><li>노션·스프레드시트 연결 상태 → 등록되지 않은 고객은 고객관리에도 자동 등록</li><li>연결하지 않은 상태 → 계정에 리포트 저장 가능, 고객관리에는 등록되지 않음</li></ul></>],
 ['이미지 저장 · 인쇄',<><p>상단 버튼으로 리포트를 이미지로 저장하거나 전체 인쇄할 수 있습니다<br/>각 페이지의 인쇄 버튼을 누르면 해당 페이지만 개별 인쇄할 수 있습니다</p><p>표지와 보고서 색상을 선택한 뒤 미리보기에서 확인해 주세요</p></>],
 ['초기화',<><p><strong>초기화는 현재 창의 고객 정보와 분석 내용을 비우고 새 작업을 시작하는 기능</strong>입니다</p><ul><li>설계사 정보는 유지</li><li>저장된 리포트는 삭제되지 않음</li><li>이전 고객의 동기화 연결은 해제</li><li>다른 창에서 열어 둔 고객의 리포트는 초기화되지 않음</li></ul></>],
] as const;

export default function CoverageReportGuide(){
 return <HoverGuide title="보장분석 리포트 이용방법" offset>{sections.map(([title,body],index)=><section key={title}><h3>{index+1}. {title}</h3>{body}</section>)}</HoverGuide>;
}
export function HoverGuide({title,children,offset=false,compact=false,icon,onOpen,holdOpen=false,noScroll=false,height=640,width=620,avoidTrigger=false}:{title:string;children:ReactNode;offset?:boolean;compact?:boolean;icon?:ReactNode;onOpen?:()=>void;holdOpen?:boolean;noScroll?:boolean;height?:number;width?:number;avoidTrigger?:boolean}){
 const [open,setOpen]=useState(false),[position,setPosition]=useState({top:0,left:0,maxHeight:500,width});
 const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),id=useId();
 const keep=()=>{clearTimeout(timer.current);if(!open)onOpen?.();setOpen(true);};
 const leave=()=>{clearTimeout(timer.current);if(holdOpen)return;timer.current=setTimeout(()=>setOpen(false),180);};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(holdOpen)clearTimeout(timer.current);},[holdOpen]);
 useEffect(()=>{
  if(!open)return;
  const place=()=>{
   const rect=trigger.current?.getBoundingClientRect();if(!rect)return;
   const icon=trigger.current?.querySelector('svg')?.getBoundingClientRect()||rect,panelWidth=Math.min(width,window.innerWidth-32),below=window.innerHeight-icon.bottom-18;
   let left=Math.max(16,Math.min(rect.left,window.innerWidth-panelWidth-16)),top=icon.bottom+4,maxHeight=Math.max(0,Math.min(height,below));
   if(avoidTrigger&&below<Math.min(height,480)){
    const right=window.innerWidth-rect.right-12,sideLeft=rect.left-12;
    if(right>=panelWidth||sideLeft>=panelWidth){left=right>=panelWidth?rect.right+8:rect.left-panelWidth-8;top=Math.max(16,Math.min(icon.top,window.innerHeight-Math.min(height,window.innerHeight-32)-16));maxHeight=Math.min(height,window.innerHeight-32);}
   }
   setPosition({width:panelWidth,left,top,maxHeight});
  };
  const outside=(event:PointerEvent)=>{if(document.querySelector('[data-confirm-overlay=true]'))return;if(event.target instanceof Node&&!trigger.current?.contains(event.target)&&!panel.current?.contains(event.target))setOpen(false);};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Escape'){trigger.current?.focus();setOpen(false);}};
  place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);document.addEventListener('pointerdown',outside);document.addEventListener('keydown',keyboard);
  return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keyboard);};
 },[open,compact,height,width,avoidTrigger]);
 return <><button ref={trigger} type="button" data-icon-only="true" data-connection-guide="true" className={`${connectionStyles.trigger} ${offset?styles.trigger:''}`} aria-label={title} aria-expanded={open} aria-controls={open?id:undefined} aria-haspopup="dialog" onMouseEnter={keep} onMouseLeave={leave} onFocus={keep} onBlur={event=>{if(!panel.current?.contains(event.relatedTarget as Node|null))leave();}} onClick={keep}>{icon||<CircleHelp size={20}/>}</button>{open&&createPortal(<div ref={panel} id={id} role="dialog" aria-label={title} className={`${styles.panel} ${compact?styles.compact:''} ${noScroll?styles.noScroll:''}`} style={position} onMouseEnter={keep} onMouseLeave={leave} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&!trigger.current?.contains(event.relatedTarget as Node|null))leave();}}><header><h2>{title}</h2><button type="button" aria-label="이용방법 닫기" onClick={()=>setOpen(false)}><X size={18}/></button></header><div className={styles.content} tabIndex={0}>{children}</div></div>,document.body)}</>;
}
