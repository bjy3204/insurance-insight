import type { Metadata } from "next";
import IdleLock from "./IdleLock";
import NotionCrm from "./NotionCrm";
export const metadata:Metadata={title:"고객관리 노트 | 보험인사이트",robots:{index:false,follow:false}};
export default function Page(){return <IdleLock><NotionCrm/></IdleLock>;}
