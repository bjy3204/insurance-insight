"use client";
import {useState} from "react";
import Image from "next/image";
import {HoverGuide} from "@/app/my-page/CoverageReportGuide";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";
import styles from "./ConnectionGuide.module.css";

export default function ConnectionGuide({provider}:{provider:"notion"|"sheets"}){
  const [open,setOpen]=useState(false);
  const title=`${provider==="notion"?"노션":"스프레드시트"} 연결 방법`;
  const images=provider==="notion"?["notion.png"]:["sheets-1.png","sheets-2.png","sheets-3.png"];
  return <><HoverGuide title={title}><div className={styles.previewPages}>{images.map((name,index)=><button key={name} type="button" className={styles.previewImage} aria-label={`${title} ${index+1}페이지 확대`} onClick={()=>setOpen(true)}><Image src={`/images/connection-guides/${name}`} alt={`${title} ${index+1}페이지`} width={1920} height={1080} unoptimized/></button>)}</div></HoverGuide>{open&&<Guide provider={provider} onClose={()=>setOpen(false)}/>}</>;
}
function Guide({provider,onClose}:{provider:"notion"|"sheets";onClose:()=>void}){
  const title=`${provider==="notion"?"노션":"스프레드시트"} 연결 방법`;
  const images=provider==="notion"?["notion.png"]:["sheets-1.png","sheets-2.png","sheets-3.png"];
  return <DashboardDialog title={title} onClose={onClose}>
    <div className={styles.pages}>{images.map((name,index)=><div key={name}><Image src={`/images/connection-guides/${name}`} alt={`${title} ${index+1}페이지`} width={1920} height={1080} unoptimized/></div>)}</div>
  </DashboardDialog>;
}
