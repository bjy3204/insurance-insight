"use client";
import { useEffect } from "react";
export default function NumberInputGuard(){
 useEffect(()=>{const prevent=(event:WheelEvent)=>{const input=document.activeElement;if(input instanceof HTMLInputElement&&input.type==='number'&&(event.target===input||event.target instanceof Node&&input.contains(event.target)))event.preventDefault();};document.addEventListener('wheel',prevent,{capture:true,passive:false});return()=>document.removeEventListener('wheel',prevent,true);},[]);
 return null;
}
