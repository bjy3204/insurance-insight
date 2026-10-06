"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { exemptionColumns, exemptionHistoryRows, historyColumns, medicalHistoryRows } from './medicalHistoryData';
import styles from './MedicalOverview.module.css';

function Text({ text }: { text: string }) {
  return <>{text.split('\n').map((line, i) => <span key={i} className={/^\s*[(（*※]/.test(line) ? styles.fine : styles.line}>{line}</span>)}</>;
}
function OverviewTable({ exemption }: { exemption: boolean }) {
  const columns = exemption ? exemptionColumns : historyColumns;
  const rows = exemption ? exemptionHistoryRows : medicalHistoryRows;
  const shadedExemptionLabels = new Set([
    '질병구분', '선천성 뇌질환 (Q00~Q04)(급여)', '임신·출산관련', '건강검진관련비용',
    '천재지변, 핵연료, 방사능', '선천성 비신생물성 모반 (Q82.5)',
    '습관성유산, 불임, 인공수정\n합병증 (급여)', '비응급환자의응급실이용료',
    '중증도여성형유방증 (지방흡입)\n장기이식수술 기증자수술비보장',
  ]);
  return <table className={styles.table}><thead><tr><th rowSpan={2} colSpan={2} className={styles.categoryHead}>구분</th>
    {['1세대','2세대','3세대','4세대','5세대'].map((name,i) => <th key={name} colSpan={[3,4,1,1,1][i]} className={styles[`generation${i+1}`]}>{name}</th>)}{exemption && <th rowSpan={2} className={styles.categoryHead}>비고</th>}</tr>
    <tr>{columns.map((column,i) => i < 3 ? i === 0 && <th key={i} colSpan={3} className={styles.generation1}>표준화 이전</th> : <th key={i} className={styles[`generation${i<7?2:i-4}`]}><Text text={column.subtitle}/></th>)}</tr></thead>
    <tbody>{rows.map((row,index) => {
      let groupLength = 1;
      while (rows[index + groupLength]?.section === row.section && row.section) groupLength++;
      const shaded = exemption
        ? ['치과치료', '정신질환', '안과'].includes(row.section || '') || shadedExemptionLabels.has(row.label)
        : row.section === '입원' || row.label.startsWith('3대비급여');
      const noteCovered = rows.slice(0, index).some((previous, previousIndex) => previousIndex + (previous.noteRowSpan || 1) > index);
      return <tr key={index} className={shaded ? styles.highlight : undefined}>
        {row.section && rows[index-1]?.section !== row.section && <th className={styles.section} rowSpan={groupLength}>{row.section}</th>}
        <th colSpan={row.section ? 1 : 2} className={styles.label}><Text text={row.label}/></th>
        {row.cells.map((cell,i) => <td key={i} colSpan={cell.span || 1} rowSpan={cell.rowSpan || 1}><Text text={cell.text}/></td>)}
        {exemption && !noteCovered && <td rowSpan={row.noteRowSpan || 1} className={`${styles.note} ${row.section === '치과치료' ? styles.dentalNote : ''}`}><Text text={row.note || ''}/></td>}
      </tr>;
    })}</tbody>
  </table>;
}
type View = { scale:number; x:number; y:number };
export default function MedicalOverview({ exemption }: { exemption:boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null), tableRef = useRef<HTMLDivElement>(null);
  const current = useRef<View>({scale:1,x:0,y:0}), fitScale = useRef(1);
  const drag = useRef<{id:number;x:number;y:number;origin:View}|null>(null);
  const [view,setView] = useState(current.current), [ready,setReady] = useState(false);
  useLayoutEffect(() => {
    const viewport=viewportRef.current, table=tableRef.current;
    if (!viewport || !table) return;
    const fit=() => {
      const width=table.offsetWidth,height=table.offsetHeight;
      if (!width || !height) return;
      const scale=Math.max(.05,Math.min((viewport.clientWidth-16)/width,(viewport.clientHeight-16)/height,1));
      fitScale.current=scale;
      current.current={scale,x:(viewport.clientWidth-width*scale)/2,y:(viewport.clientHeight-height*scale)/2};
      setView(current.current);setReady(true);
    };
    fit();const observer=new ResizeObserver(fit);observer.observe(viewport);observer.observe(table);
    const wheel=(event:WheelEvent) => {
      event.preventDefault();if (!event.deltaY) return;
      const old=current.current,rect=viewport.getBoundingClientRect();
      const scale=Math.max(fitScale.current*.5,Math.min(3,old.scale*Math.exp(-Math.max(-100,Math.min(100,event.deltaY))*.002)));
      const x=event.clientX-rect.left,y=event.clientY-rect.top,ratio=scale/old.scale;
      current.current={scale,x:x-(x-old.x)*ratio,y:y-(y-old.y)*ratio};setView(current.current);
    };
    viewport.addEventListener('wheel',wheel,{passive:false});
    return () => {observer.disconnect();viewport.removeEventListener('wheel',wheel);};
  },[]);
  return <div ref={viewportRef} className={styles.viewer}
    onPointerDown={event => {if(event.button!==0)return;event.preventDefault();drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,origin:current.current};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event => {const start=drag.current;if(!start || start.id!==event.pointerId)return;current.current={...start.origin,x:start.origin.x+event.clientX-start.x,y:start.origin.y+event.clientY-start.y};setView(current.current);}}
    onPointerUp={event => {drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
    onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
    <div ref={tableRef} className={styles.canvas} style={{width:exemption?1700:1500,visibility:ready?'visible':'hidden',transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}><OverviewTable exemption={exemption}/></div>
  </div>;
}
