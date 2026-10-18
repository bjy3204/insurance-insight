"use client";
import {useLayoutEffect,useRef,useState,type TextareaHTMLAttributes} from 'react';
import styles from './CoverageReportEditor.module.css';

export default function CoverageProductInput(props:TextareaHTMLAttributes<HTMLTextAreaElement>){
 const measure=useRef<HTMLSpanElement>(null),[height,setHeight]=useState(21);
 useLayoutEffect(()=>{
  const node=measure.current;if(!node)return;
  const resize=()=>setHeight(Math.max(19,Math.min(57,node.getBoundingClientRect().height))+2);
  resize();const observer=new ResizeObserver(resize);observer.observe(node);return()=>observer.disconnect();
 },[props.value]);
 return <div className={styles.productInputWrap}><span ref={measure} className={styles.productMeasure} aria-hidden="true">{String(props.value||'')+'\u200b'}</span><textarea {...props} className={`${styles.productInput} ${styles.centeredProductInput}`} rows={1} style={{...props.style,height}}/></div>;
}
