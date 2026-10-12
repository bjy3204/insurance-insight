"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { historyColumns, medicalHistoryRows, uncompensatedHistoryRows } from './medicalHistoryData';
import styles from './MedicalOverview.module.css';
import MedicalCoverageText from './MedicalCoverageText';

function Text({ text, emphasize = true, coverageOnly = false }: { text: string; emphasize?: boolean; coverageOnly?: boolean }) {
  return <>{text.split('\n').map((line, i) => <span key={i} className={/^\s*[(（*※]/.test(line) ? styles.fine : styles.line}>{emphasize ? <MedicalCoverageText text={line} coverageOnly={coverageOnly}/> : line}</span>)}</>;
}
function OverviewTable() {
  const rows = medicalHistoryRows.filter(row => row.label !== '구분');
  const renderRow = (row: typeof rows[number], index: number) => <tr key={index}>
    <th className={styles.label}><Text text={row.label}/></th>
    {row.cells.map((cell, i) => <td key={i}><Text text={cell.text} emphasize={row.label !== '담보구성'} coverageOnly={i === 6 && ['본인부담 한도', '보장비율'].includes(row.label)}/></td>)}
  </tr>;
  return <table className={styles.table}><thead>
    <tr><th rowSpan={2} className={styles.categoryHead}>구분</th>
      {['1세대','2세대','3세대','4세대','5세대'].map((name,i) => <th key={name} colSpan={historyColumns.filter(column => column.generation === name).length} className={styles[`generation${i+1}`]}>{name}</th>)}
    </tr>
    <tr>{historyColumns.map((column,i) => <th key={i} className={styles[`generation${column.generation[0]}`]}><Text text={column.subtitle}/></th>)}</tr>
    </thead><tbody>
      {rows.map(renderRow)}
      <tr className={styles.highlight}><th colSpan={historyColumns.length + 1}>보상하지 않는 손해</th></tr>
      {uncompensatedHistoryRows.map(renderRow)}
    </tbody></table>;
}

type View = { scale:number; x:number; y:number };
export default function MedicalOverview() {
  const viewportRef = useRef<HTMLDivElement>(null), tableRef = useRef<HTMLDivElement>(null);
  const current = useRef<View>({scale:1,x:0,y:0}), fitScale = useRef(1);
  const pointers = useRef(new Map<number,{x:number;y:number}>());
  const gesture = useRef<{origin:View;x:number;y:number;distance:number}|null>(null);
  function gesturePoints() {
    const points=Array.from(pointers.current.values()).slice(0,2);
    if (!points.length || !viewportRef.current) return null;
    const rect=viewportRef.current.getBoundingClientRect();
    const [a,b]=points;
    return {x:(b?(a.x+b.x)/2:a.x)-rect.left,y:(b?(a.y+b.y)/2:a.y)-rect.top,distance:b?Math.hypot(b.x-a.x,b.y-a.y):0};
  }
  function beginGesture() {
    const point=gesturePoints();
    gesture.current=point?{...point,origin:{...current.current}}:null;
  }
  function endPointer(id:number) {
    pointers.current.delete(id);
    beginGesture();
  }
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
    onPointerDown={event => {
      if(event.button!==0)return;
      event.preventDefault();
      pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
      event.currentTarget.setPointerCapture(event.pointerId);
      beginGesture();
    }}
    onPointerMove={event => {
      if(!pointers.current.has(event.pointerId))return;
      event.preventDefault();
      pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
      const start=gesture.current,point=gesturePoints();
      if(!start || !point)return;
      const scale=start.distance>0?Math.max(fitScale.current*.5,Math.min(3,start.origin.scale*point.distance/start.distance)):start.origin.scale;
      const ratio=scale/start.origin.scale;
      current.current={scale,x:point.x-(start.x-start.origin.x)*ratio,y:point.y-(start.y-start.origin.y)*ratio};
      setView(current.current);
    }}
    onPointerUp={event => {
      endPointer(event.pointerId);
      if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={event=>endPointer(event.pointerId)} onLostPointerCapture={event=>endPointer(event.pointerId)}>

    <div ref={tableRef} className={styles.canvas} style={{width:1500,visibility:ready?'visible':'hidden',transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}><OverviewTable/></div>
  </div>;
}
