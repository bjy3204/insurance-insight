"use client";
import {useRef,useState} from 'react';
import {Upload} from 'lucide-react';
import styles from './FileDropZone.module.css';

export default function FileDropZone({accept,multiple=false,disabled=false,label,hint,onFiles}:{accept:string;multiple?:boolean;disabled?:boolean;label:string;hint:string;onFiles:(files:FileList)=>void}){
 const input=useRef<HTMLInputElement>(null),depth=useRef(0);
 const [dragging,setDragging]=useState(false),[error,setError]=useState('');
 function select(files:FileList){
  if(disabled||!files.length)return;
  setError('');
  if(!multiple&&files.length>1){setError('파일을 한 개만 선택해 주세요');return;}
  const types=accept.split(',').map(value=>value.trim().toLowerCase());
  if(Array.from(files).some(file=>!types.some(type=>type.startsWith('.')?file.name.toLowerCase().endsWith(type):type.endsWith('/*')?file.type.toLowerCase().startsWith(type.slice(0,-1)):file.type.toLowerCase()===type))){setError('지원하는 파일 형식을 확인해 주세요');return;}
  onFiles(files);
 }
 return <div className={styles.wrapper}>
  <div className={styles.drop} data-dragging={dragging&&!disabled} aria-disabled={disabled} onDragEnter={event=>{event.preventDefault();if(disabled)return;depth.current++;setDragging(true);}} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect=disabled?'none':'copy';}} onDragLeave={event=>{event.preventDefault();depth.current=Math.max(0,depth.current-1);if(!depth.current)setDragging(false);}} onDrop={event=>{event.preventDefault();depth.current=0;setDragging(false);select(event.dataTransfer.files);}}>
   <Upload size={25} aria-hidden="true"/>
   <strong>{label}</strong><span>{hint}</span>
   <input ref={input} type="file" accept={accept} multiple={multiple} disabled={disabled} aria-label={label} hidden onChange={event=>{if(event.target.files)select(event.target.files);event.target.value='';}}/>
   <button type="button" disabled={disabled} onClick={()=>input.current?.click()}>파일 선택</button>
  </div>
  {error&&<p className={styles.error} role="alert">{error}</p>}
 </div>;
}
