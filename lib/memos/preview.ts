"use client";
import {useSyncExternalStore} from "react";
type Appearance={background:string;opacity:number};
let previews:Record<string,Appearance>={};
const empty:Record<string,Appearance>={};
const listeners=new Set<()=>void>();
export function setMemoPreview(id:string,value:Appearance|null){const next={...previews};if(value)next[id]=value;else delete next[id];previews=next;listeners.forEach(fn=>fn());}
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}};
export function useMemoPreviews(){return useSyncExternalStore(subscribe,()=>previews,()=>empty);}
