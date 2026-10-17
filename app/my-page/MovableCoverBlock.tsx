"use client";
import type { ReactNode, PointerEvent } from "react";
import { MoveDiagonal2, Move } from "lucide-react";
import type { CoverPlacement } from "./coverage-report-model";

export default function MovableCoverBlock({children,className,label,value={x:0,y:0,scale:1},onChange}:{children:ReactNode;className:string;label:string;value?:CoverPlacement;onChange?:(value:CoverPlacement)=>void}){
  function start(event:PointerEvent<HTMLElement>,resize=false,block?:HTMLElement){
    if(!onChange||event.button!==0)return;
    if(!resize&&!block&&(event.target as HTMLElement).closest("button"))return;
    event.preventDefault();event.stopPropagation();
    const target=block??(resize?event.currentTarget.parentElement!:event.currentTarget);
    const page=target.closest(".coverage-report-page")!,pageRect=page.getBoundingClientRect(),rect=target.getBoundingClientRect();
    const zoom=pageRect.width/794,startX=event.clientX,startY=event.clientY;
    const original={...value};target.setPointerCapture(event.pointerId);
    const move=(e:globalThis.PointerEvent)=>{
      if(resize){
        const change=Math.max((e.clientX-startX)/rect.width,(e.clientY-startY)/rect.height);
        onChange!({...original,scale:Math.max(.4,Math.min(2,original.scale*(1+change)))});
      }else{
        const dx=Math.max(pageRect.left-rect.left,Math.min(pageRect.right-rect.right,e.clientX-startX));
        const dy=Math.max(pageRect.top-rect.top,Math.min(pageRect.bottom-rect.bottom-40*zoom,e.clientY-startY));
        onChange!({...original,x:original.x+dx/zoom,y:original.y+dy/zoom});
      }
    };
    const end=()=>{window.removeEventListener("pointermove",move,true);window.removeEventListener("pointerup",end);window.removeEventListener("pointercancel",end);};
    window.addEventListener("pointermove",move,true);window.addEventListener("pointerup",end,{once:true});window.addEventListener("pointercancel",end,{once:true});
  }
  return <div className={className} data-cover-movable={onChange?"true":undefined} style={{transform:`translate(${value.x}px,${value.y}px) scale(${value.scale})`,transformOrigin:"center",...(onChange?{touchAction:"none",cursor:"move"}:{})}} onPointerDownCapture={event=>{if(!(event.target as Element).closest("button"))start(event);}} aria-label={onChange?`${label} 드래그로 이동`:undefined}>
    {children}
    {onChange&&<button type="button" className="cr-cover-move" aria-label={`${label} 이동`} title="드래그로 이동" onPointerDown={event=>start(event,false,event.currentTarget.parentElement!)}><Move size={16}/></button>}
    {onChange&&<button type="button" className="cr-cover-resize" aria-label={`${label} 크기 조절`} title="드래그로 크기 조절" onPointerDown={event=>start(event,true)}><MoveDiagonal2 size={16}/></button>}
  </div>;
}
