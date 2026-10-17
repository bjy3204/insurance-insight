import {contractExpiry} from "./contract-dates";
import { detailValues, detailProperties } from "./details";
import { fields, titleNames, type Source, type CrmRow, type CrmValue } from "./model";
type Property={type:string;title?:{plain_text?:string;text?:{content:string}}[];rich_text?:{plain_text?:string;text?:{content:string}}[];date?:{start:string}|null;number?:number|null;checkbox?:boolean;relation?:{id:string}[];select?:{name:string}|null;email?:string|null;phone_number?:string|null;formula?:{type:string;string?:string;number?:number;date?:{start:string}};rollup?:{number?:number}};
export type NotionPage={id:string;created_time?:string;last_edited_time:string;archived?:boolean;in_trash?:boolean;parent?:{data_source_id?:string};properties:Record<string,Property>};
export type Schema=Record<string,{type:string;relation?:{data_source_id?:string}}>;
export function readPage(page:NotionPage):CrmRow{const values:Record<string,CrmValue>={};for(const [name,p]of Object.entries(page.properties)){let v:CrmValue="";switch(p.type){case"title":case"rich_text":v=(p[p.type]||[]).map(t=>t.plain_text??t.text?.content??"").join("");break;case"date":v=p.date?.start||"";break;case"number":v=p.number??"";break;case"checkbox":v=!!p.checkbox;break;case"relation":v=(p.relation||[]).map(r=>r.id);break;case"select":v=p.select?.name||"";break;case"email":v=p.email||"";break;case"phone_number":v=p.phone_number||"";break;case"formula":v=p.formula?.number??p.formula?.string??p.formula?.date?.start??"";break;case"rollup":v=p.rollup?.number??"";}values[name]=v;}if(Object.hasOwn(values,'계약일')){for(const [period,end] of [['면책기간(개월)','면책만료'],['감액기간(개월)','감액만료']]){if(Object.hasOwn(values,period))values[end]=contractExpiry(String(values['계약일']||''),values[period]);}}return{id:page.id,...(page.created_time?{created:page.created_time}:{}),edited:page.last_edited_time,values};}
export function residentBirth(value:string){const d=value.replace(/\D/g,"");if(!/^\d{6}[1-8](?:\d{6})?$/.test(d))throw Error("주민번호는 앞 6자리와 뒷자리 첫 숫자(7자리), 또는 전체 13자리로 입력해 주세요.");const century=Number(d[6])<=2?1900:Number(d[6])<=4?2000:Number(d[6])<=6?1900:2000;const date=`${century+Number(d.slice(0,2))}-${d.slice(2,4)}-${d.slice(4,6)}`;if(!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error("주민번호의 생년월일을 확인해 주세요.");return date;}
export function writeProperties(source:Source,input:Record<string,unknown>,schema:Schema){
 if(source==="customers"&&Object.hasOwn(input,"주민번호")&&!String(input["주민번호"]||"").trim())throw Error("주민번호를 입력해 주세요.");
 const props:Record<string,unknown>={};
 for(const field of fields[source]){
  if(!Object.hasOwn(input,field.name))continue;
  const p=schema[field.name];if(!p)throw Error("연결 양식을 다시 준비해 주세요.");
  const value=input[field.name];
  if(p.type==="checkbox"){if(typeof value!=="boolean")throw Error("체크 항목을 확인해 주세요.");props[field.name]={checkbox:value};continue;}
  if(p.type==="relation"){if(!Array.isArray(value)||value.length>1||value.some(v=>typeof v!=="string"||!/^([a-f0-9]{32}|[a-f0-9-]{36})$/i.test(v)))throw Error("고객을 선택해 주세요.");props[field.name]={relation:value.map(id=>({id}))};continue;}
  if(typeof value!=="string"&&typeof value!=="number")throw Error("입력 내용을 확인해 주세요.");
  const text=String(value).trim();if(text.length>(field.internal?150000:10000))throw Error("입력 내용이 너무 깁니다.");
  if(field.internal&&text){const key=(Object.keys(detailProperties) as (keyof typeof detailProperties)[]).find(k=>detailProperties[k]===field.name);if(key)detailValues(key,text);}
  switch(p.type){case"title":case"rich_text":props[field.name]={[p.type]:text?Array.from({length:Math.ceil(text.length/1800)},(_,i)=>({text:{content:text.slice(i*1800,(i+1)*1800)}})):[]};break;
   case"date":if(text&&(!Number.isFinite(Date.parse(text))||(!/^\d{4}-\d{2}-\d{2}$/.test(text)&&!(source==="events"&&field.name==="일정"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(text)))||(text.length===10&&new Date(text).toISOString().slice(0,10)!==text)))throw Error("날짜를 확인해 주세요.");props[field.name]={date:text?{start:text}:null};break;
   case"number":{const n=text?Number(text):null;if(n!==null&&(!Number.isSafeInteger(n)||n<0))throw Error("숫자를 확인해 주세요.");if(source==="cards"&&field.name==="결제일"&&n!==null&&(n<1||n>31))throw Error("결제일은 1~31일로 입력해 주세요.");props[field.name]={number:n};break;}
   case"select":if(text&&!(source==="customers"&&field.name==="유입경로")&&!field.options?.includes(text))throw Error("분류를 확인해 주세요.");props[field.name]={select:text?{name:text}:null};break;
   case"email":props[field.name]={email:text||null};break;case"phone_number":props[field.name]={phone_number:text||null};break;default:throw Error("이 항목은 웹에서 수정할 수 없습니다.");
  }
 }
 if(Object.hasOwn(input,titleNames[source])&&!String(input[titleNames[source]]||"").trim())throw Error("이름 또는 제목을 입력해 주세요.");
 if(source==="customers"&&typeof input["주민번호"]==="string"&&input["주민번호"].trim()){const date=residentBirth(input["주민번호"]);props["생년월일"]={date:{start:date}};}
 return props;
}
