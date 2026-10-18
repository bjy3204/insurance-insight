"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {validateCoverageDraft,type CoverageDraft} from '@/lib/coverage-draft';
import type {ReportSection} from './coverage-report-model';

type Workspace={draft:CoverageDraft;kind:ReportSection;preview:boolean;groups:string[];pages:Record<string,number>};
const kinds=['cover','analysis','status','after-analysis','after-status','comparison','summary','all'];
export function readCoverageWorkspace(raw:string):Workspace{
 const source=JSON.parse(raw);
 if(!kinds.includes(source.kind)||typeof source.preview!=='boolean')throw Error('Invalid report view');
 return {draft:validateCoverageDraft(source.draft),kind:source.kind,preview:source.preview,groups:Array.isArray(source.groups)?source.groups.filter((value:unknown)=>typeof value==='string'&&value.length<100):[],pages:Object.fromEntries(Object.entries(source.pages||{}).filter(([key,value])=>kinds.includes(key)&&Number.isInteger(value)&&Number(value)>=0&&Number(value)<500)) as Record<string,number>};
}

// The last open document belongs to this browser window; cloud drafts belong to customers.
export default function useCoverageWorkspace(owner:string,value:Workspace,apply:(saved:Workspace)=>void){
 const [readyOwner,setReadyOwner]=useState(''),applyRef=useRef(apply);
 applyRef.current=apply;
 const key='coverage-workspace:v1:'+owner;
 useLayoutEffect(()=>{
  try{
   const raw=sessionStorage.getItem(key)||localStorage.getItem(key);
   if(raw)applyRef.current(readCoverageWorkspace(raw));
   else{
    const legacy=sessionStorage.getItem('coverage-editor-local:v2:'+owner);
    if(legacy){const view=JSON.parse(sessionStorage.getItem('coverage-report-view:v1:'+owner)||'{}');applyRef.current({draft:validateCoverageDraft(JSON.parse(legacy)),kind:kinds.includes(view.kind)?view.kind:'analysis',preview:view.preview===true,groups:[],pages:{}});}
   }
  }catch{/* Invalid or unavailable browser storage must not prevent editing. */}
  setReadyOwner(owner);
 },[owner,key]);
 const serialized=JSON.stringify({...value,draft:validateCoverageDraft(value.draft)});
 useEffect(()=>{
  if(readyOwner!==owner)return;
  try{sessionStorage.setItem(key,serialized);localStorage.setItem(key,serialized);}catch{/* Account cloud saving remains available when browser storage is full. */}
 },[owner,key,readyOwner,serialized]);
}
