"use client";
import { useEffect, useRef } from "react";
export default function useCustomerAutosave(value:string,baseline:string,enabled:boolean,save:()=>void|Promise<void>){
 const callback=useRef(save);callback.current=save;
 const attempted=useRef<string|null>(null);
 useEffect(()=>{
  if(!enabled||value===baseline||attempted.current===value)return;
  const timer=setTimeout(()=>{attempted.current=value;void callback.current();},650);
  return()=>clearTimeout(timer);
 },[value,baseline,enabled]);
}
