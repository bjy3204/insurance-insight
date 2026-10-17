"use client";
import {useEffect,useRef,useState} from 'react';
import {Download,Printer,Palette} from 'lucide-react';
import {useAuth} from '@/app/components/AuthProvider';
import {printCoverageReport} from './coverage-report-print';
import styles from './ConsultationForms.module.css';
import {CONSULTATION_FORM_CSS} from './consultation-form-style';

type Labels=Record<string,string>;
const FORM_COLORS=[{name:'쨍한 주황',value:'#FF941F'},{name:'현재 색상',value:'#7696b4'},{name:'검정',value:'#222222'},{name:'진한 초록',value:'#24513D'},{name:'진한 보라',value:'#50386F'}];
export function Pages({labels,editing=false,onEdit}:{labels:Labels;editing?:boolean;onEdit?:(id:string,text:string)=>void}){
  const text=(id:string,fallback:string)=><span contentEditable={editing} suppressContentEditableWarning role={editing?'textbox':undefined} aria-label={editing?`${fallback} 문구 수정`:undefined} onBlur={event=>onEdit?.(id,(event.currentTarget.textContent||'').trim().slice(0,400))}>{(labels[id]??fallback).replace(id.endsWith("title")&&id!=="journal-title"&&id!=="survey-title"||id==="survey-section"?/^★\s*/:/^$/,"")}</span>;
  const heading=(id:string,title:string)=><h2><span className="cf-section-star" aria-hidden="true">★ </span>{text(id,title.replace(/^★\s*/,""))}</h2>;
  const pairTable=(id:string,rows:string[][])=><table className="cf-details"><colgroup><col style={{width:'15%'}}/><col style={{width:'35%'}}/><col style={{width:'15%'}}/><col style={{width:'35%'}}/></colgroup><tbody>{rows.map((row,i)=><tr key={i}>{row.map((label,j)=><th key={j}>{text(`${id}-${i}-${j}`,label)}</th>).flatMap((label,j)=>[label,<td key={`blank-${j}`}/>])}</tr>)}</tbody></table>;
  const questions=[
    '최근 3개월 이내에 의사로부터 진찰 또는 검사(건강검진포함)를 통하여 다음과 같은 의료행위를 받은 사실이 있습니까?',
    '최근 3개월 이내에 마약을 사용하거나 혈압강하제, 신경안정제, 수면제, 각성제 (흥분제), 진통제 등 약물을 상시 복용한 사실이 있습니까?',
    '최근 1년 이내에 의사로부터 진찰 또는 검사를 받고 이를 통하여 추가검사(재검사)를 받은 사실이 있습니까?',
    '최근 5년 이내에 의사로부터 진찰 또는 검사를 통하여 다음과 같은 의료행위를 받은 사실이 있습니까?',
  ];
  const survey=['1. 상담내용은 이해하기 쉬웠나요?','2. 현재 보장상태를 파악하는데 도움이 되었나요?','3. 나의 상황에 맞는 맞춤 보장설계가 이루어졌나요?','3. 제안 내용에 대해 신뢰가 가셨나요?','5. 주변에 소개하고 싶은 상담이라고 느끼셨나요?'];
  return <>
    <article className="coverage-report-page cf-page cf-journal" aria-label="고객 상담 일지">
      <header className="cf-heading"><div className="cf-mark"/><h1>{text('journal-title','고객 상담 일지')}</h1></header>
      <section>{heading('personal-title','★ 개인정보동의 정보')}{pairTable('personal',[['이름','주민번호'],['전화번호','통신사'],['직업','운전여부']])}<table className="cf-details cf-address"><tbody><tr><th>{text('address','주소')}</th><td/></tr></tbody></table></section>
      <section>{heading('disclosure-title','★ 계약전 알릴의무')}{pairTable('disclosure',[['근무처','업종'],['키','몸무게'],['이륜차','레저활동']])}
      <div className="cf-questions">{questions.map((question,i)=><div key={i} className="cf-question"><div className="cf-question-number">{String(i+1).padStart(2,'0')}</div><div><p>{text(`disclosure-question-${i}`,question)}</p>{i===0&&<div className="cf-options">{['질병확정진단','질병의심소견','치료','입원','수술(제왕절개포함)','투약'].map((label,j)=><span key={label}><i/>{text(`medical-option-${j}`,label)}</span>)}</div>}{i===3&&<div className="cf-options">{['입원','수술(제왕절개포함)','계속하여 7일 이상 치료','계속하여 30일 이상 투약'].map((label,j)=><span key={label}><i/>{text(`history-option-${j}`,label)}</span>)}</div>}</div></div>)}</div>
      <table className="cf-history"><colgroup><col style={{width:'13%'}}/><col style={{width:'28%'}}/><col style={{width:'32%'}}/><col style={{width:'27%'}}/></colgroup><thead><tr>{['구분','진단명','치료내용','치료기간'].map((label,i)=><th key={label}>{text(`history-head-${i}`,label)}</th>)}</tr></thead><tbody>{['3개월','1년','5년'].map((label,i)=><tr key={label}><th>{text(`history-period-${i}`,label)}</th><td/><td/><td/></tr>)}</tbody></table>
      </section>
      <section className="cf-vehicle">{heading('vehicle-title','★ 차량정보')}{pairTable('vehicle',[['차량번호','차종']])}</section>
    </article>
    <article className="coverage-report-page cf-page cf-survey" aria-label="상담 만족도 조사">
      <header className="cf-heading"><div className="cf-mark"/><h1>{text('survey-title','상담 만족도 조사')}</h1></header>
      <section>{heading('survey-section','★ 상담 만족도 평가')}<table className="cf-rating"><colgroup><col style={{width:'61%'}}/><col style={{width:'13%'}}/><col style={{width:'13%'}}/><col style={{width:'13%'}}/></colgroup><thead><tr>{['질문','만족','보통','불만족'].map((label,i)=><th key={label}>{text(`rating-head-${i}`,label)}</th>)}</tr></thead><tbody>{survey.map((question,i)=><tr key={i}><th>{text(`rating-question-${i}`,question)}</th><td/><td/><td/></tr>)}</tbody></table></section>
      <section className="cf-feedback">{heading('feedback-title','★ 자유로운 의견을 남겨 주세요 !')}{['상담 중 가장 도움이 되었던 부분은 무엇인가요?','추가로 궁금하신 점이나 필요한 보장이 있나요?'].map((question,i)=><div key={i} className="cf-answer"><p>{text(`feedback-question-${i}`,`- ${question}`)}</p><div/><div/><div/></div>)}</section>
      <section>{heading('referral-title','★ 소중한 지인 추천')}<p className="cf-referral-description">{text('referral-description','상담에 만족하셨다면 주변의 소중한 분께도 보험 점검의 기회를 선물해 주세요 !')}</p><table className="cf-referral"><colgroup><col style={{width:'14%'}}/><col style={{width:'18%'}}/><col style={{width:'30%'}}/><col style={{width:'38%'}}/></colgroup><thead><tr>{['관계','성함','연락처','메모'].map((label,i)=><th key={label}>{text(`referral-head-${i}`,label)}</th>)}</tr></thead><tbody>{Array.from({length:5},(_,i)=><tr key={i}><td/><td/><td/><td/></tr>)}</tbody></table></section>
    </article>
  </>;
}
export default function ConsultationForms(){
  const {authUser}=useAuth();
  const [labels,setLabels]=useState<Labels>({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState('');
  const key=authUser?`consultation-form-labels:v1:${authUser.id}`:'';
  const capture=useRef<HTMLDivElement>(null),preview=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(.5);
  const [color,setColor]=useState('#7696b4'),[colorsOpen,setColorsOpen]=useState(false);
  useEffect(()=>{if(!key)return;try{const saved=localStorage.getItem(key+':color');setColor(FORM_COLORS.some(item=>item.value===saved)?saved!:'#7696b4');}catch{}},[key]);
  function chooseColor(value:string){setColor(value);setColorsOpen(false);if(key)try{localStorage.setItem(key+':color',value);}catch{}}
  useEffect(()=>{if(!key)return;let value:Labels={};try{const data=JSON.parse(localStorage.getItem(key)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))value=Object.fromEntries(Object.entries(data).filter(([id,value])=>id.length<80&&typeof value==='string'&&value.length<=400)) as Labels;}catch{}setLabels(value);setLoaded(key);},[key]);
  useEffect(()=>{if(loaded!==key||!key)return;try{localStorage.setItem(key,JSON.stringify(labels));}catch{}},[labels,key,loaded]);
  useEffect(()=>{const node=preview.current;if(!node)return;const update=()=>{const css=getComputedStyle(node),columns=css.gridTemplateColumns.split(' ').length,gap=parseFloat(css.columnGap)||0;setScale(Math.min(1,((node.clientWidth-gap*(columns-1))/columns-32)/794));};const observer=new ResizeObserver(update);observer.observe(node);update();return()=>observer.disconnect();},[]);
  async function output(kind:'image'|'print',pageIndex?:number){
    if(!capture.current||busy)return;setBusy(true);setError('');
    try{
      await document.fonts.ready;
      const allPages=Array.from(capture.current.querySelectorAll<HTMLElement>('.cf-page'));
      const pages=pageIndex===undefined?allPages:[allPages[pageIndex]];
      if(pages.some(page=>page.scrollHeight>1125))throw new Error('문구가 한 장의 공간을 초과했습니다 문구를 조금 줄여 주세요');
      if(kind==='print'){await printCoverageReport(`<style>${CONSULTATION_FORM_CSS}</style><div style="--cf-color:${color};--cf-soft:${color}18;--cf-line:${color}45">${pages.map(page=>page.outerHTML).join('')}</div>`,'상담 서식');}
      else{
        const [{default:html2canvas},{default:JSZip}]=await Promise.all([import('html2canvas'),import('jszip')]);const zip=new JSZip();
        for(let i=0;i<pages.length;i++){const canvas=await html2canvas(pages[i],{scale:2,backgroundColor:'#fff',windowWidth:1700,onclone:doc=>{const node=doc.querySelector<HTMLElement>('[data-consultation-capture]');if(node)node.style.cssText='position:absolute;left:0;top:0;width:794px;visibility:visible';}});const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('이미지를 만들지 못했습니다')),'image/png'));zip.file(i===0?'고객 상담 일지.png':'상담 만족도 조사.png',blob);}
        const url=URL.createObjectURL(await zip.generateAsync({type:'blob'}));const a=document.createElement('a');a.href=url;a.download='상담 서식.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      }
    }catch(e){setError(e instanceof Error?e.message:'출력하지 못했습니다 다시 시도해 주세요');}finally{setBusy(false);}
  }
  return <section className={styles.root}><style>{CONSULTATION_FORM_CSS+`.cf-page{--cf-color:${color};--cf-soft:${color}18;--cf-line:${color}45}`}</style><header className={styles.toolbar}><div className={styles.colorControl}><button type="button" aria-expanded={colorsOpen} onClick={()=>setColorsOpen(value=>!value)}><Palette size={18}/><span>색상 선택</span></button>{colorsOpen&&<div className={styles.colorMenu} role="group" aria-label="서식 색상">{FORM_COLORS.map(item=><button type="button" key={item.value} aria-label={item.name} title={item.name} aria-pressed={color===item.value} onClick={()=>chooseColor(item.value)} style={{backgroundColor:item.value}}/>)}</div>}</div><div><button type="button" disabled={busy} onClick={()=>void output('image')}><Download size={18}/><span>이미지</span></button><button type="button" disabled={busy} onClick={()=>void output('print')}><Printer size={18}/><span>전체인쇄</span></button></div></header>{error&&<p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.previews} ref={preview}>{[0,1].map(index=><div key={index} className={styles.preview} style={{height:1123*scale+2}}><button className={styles.pagePrint} type="button" disabled={busy} aria-label={index===0?"고객 상담 일지 인쇄":"상담 만족도 조사 인쇄"} title="인쇄" onClick={()=>void output('print',index)}><Printer size={20}/></button><div style={{transform:`scale(${scale})`,transformOrigin:'top left'}}><div className={styles.pageSelection} data-page-index={index}><Pages labels={labels} editing onEdit={(id,text)=>setLabels(current=>({...current,[id]:text}))}/></div></div></div>)}</div>
    <div className={styles.capture} ref={capture} data-consultation-capture aria-hidden="true"><Pages labels={labels}/></div>
  </section>;
}
