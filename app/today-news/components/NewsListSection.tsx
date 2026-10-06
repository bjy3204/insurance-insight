'use client';
import { useState } from 'react';
import TrafficMap from './TrafficMap';
import { PRESS } from '@/app/product-public/press';
import styles from './NewsListSection.module.css';
type Article={title:string;description:string;link:string;originallink:string;pubDate:string};
const text=(value:string)=>value.replace(/<[^>]*>/g,'').replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&#39;',"'");
function dateLabel(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
export default function NewsListSection({items,loading}:{items:Article[];loading:boolean}) {
  const [tab,setTab]=useState(0);
  const tabs=['더많은 뉴스','실시간 교통정보','최신 보도자료'];
  const press=[...PRESS.items].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  return <section className={styles.section} aria-label="뉴스와 교통정보">
    <div className={styles.tabs} role="tablist" aria-label="정보 선택">{tabs.map((label,index)=><button key={label} id={`news-info-tab-${index}`} type="button" role="tab" aria-selected={tab===index} aria-controls={`news-info-panel-${index}`} tabIndex={tab===index?0:-1} onClick={()=>setTab(index)} onKeyDown={event=>{const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;if(next!==null){event.preventDefault();setTab(next);document.getElementById(`news-info-tab-${next}`)?.focus();}}}>{label}</button>)}</div>
    <div role="tabpanel" id={`news-info-panel-${tab}`} aria-labelledby={`news-info-tab-${tab}`} tabIndex={0}>
    {tab===0&&<div className={styles.list} aria-busy={loading}>{loading?<p className={styles.empty}>뉴스를 불러오는 중입니다.</p>:!items.length?<p className={styles.empty}>표시할 뉴스가 없습니다.</p>:items.slice(0,7).map((item,index)=><a key={`${item.link}-${index}`} href={item.originallink||item.link} target="_blank" rel="noopener noreferrer"><div><h3>{text(item.title)}</h3><p>{text(item.description)}</p></div><span>{dateLabel(item.pubDate)}</span></a>)}</div>}
    {tab===1&&<TrafficMap />}
    {tab===2&&<div className={styles.list}>{press.map(item=><a key={item.id} href={item.pdfs[0]} target="_blank" rel="noopener noreferrer"><div><h3>{item.title}</h3><p>{item.source} · PDF</p></div><span>{item.date}</span></a>)}</div>}
    </div>
  </section>;
}
