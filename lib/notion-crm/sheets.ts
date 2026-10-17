import {contractExpiry} from "./contract-dates";
import { customerTiming } from "@/app/my-page/customer-lookup-model";
import { createHash } from "node:crypto";
import { CrmError, seal, unseal, cookieOptions } from "./server";
import { fields, sourceNames, type Source, type CrmRow, type CrmValue } from "./model";
import { writeProperties, type Schema } from "./records";
export const GOOGLE_COOKIE="crm_google_session",GOOGLE_STATE="crm_google_state";
export type GoogleConnection={owner?:string;provider:"sheets";access:string;refresh?:string;tokenExpires:number;expires:number;spreadsheet?:string;title?:string};
export {seal,unseal,cookieOptions};
export function googleConfig(){const {GOOGLE_CRM_CLIENT_ID:id,GOOGLE_CRM_CLIENT_SECRET:secret,GOOGLE_CRM_REDIRECT_URI:redirect}=process.env;seal({expires:Date.now()+1});if(!id||!secret||!redirect)throw new CrmError("구글 연결 설정이 준비되지 않았습니다",503);if(process.env.NODE_ENV==="production"&&new URL(redirect).protocol!=="https:")throw new CrmError("구글 연결 주소를 확인해 주세요",503);return{id,secret,redirect};}
export function sheetId(url:string){const id=url.match(/\/spreadsheets\/d\/([\w-]{20,100})/)?.[1]||(/^[\w-]{20,100}$/.test(url)?url:"");if(!id)throw new CrmError("스프레드시트 링크를 확인해 주세요");return id;}
export async function google<T=Record<string,unknown>>(c:GoogleConnection,path:string,method="GET",body?:unknown):Promise<T>{
 if(c.provider!=="sheets")throw new CrmError("구글에 다시 연결해 주세요",401);
 if(c.tokenExpires<Date.now()+60000){if(!c.refresh)throw new CrmError("구글에 다시 연결해 주세요",401);const config=googleConfig(),response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:config.id,client_secret:config.secret,grant_type:"refresh_token",refresh_token:c.refresh}),cache:"no-store",signal:AbortSignal.timeout(20000)});const token=await response.json();if(!response.ok||!token.access_token)throw new CrmError("구글에 다시 연결해 주세요",401);c.access=token.access_token;c.tokenExpires=Date.now()+(token.expires_in||3600)*1000;}
 const response=await fetch("https://sheets.googleapis.com/v4/spreadsheets"+(path?"/"+path:""),{method,headers:{Authorization:"Bearer "+c.access,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store",signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new CrmError(response.status===401?"구글에 다시 연결해 주세요":response.status===403?"이 시트의 편집 권한과 Google Sheets API 설정을 확인해 주세요":response.status===429?"요청이 많습니다 잠시 후 다시 시도해 주세요":"스프레드시트 요청을 처리하지 못했습니다",response.status===401?401:response.status===403?403:response.status===429?429:502);return response.json();
}
export const headers=(source:Source)=>["_id","_updated","_deleted",...fields[source].map(f=>f.name),"_created"];
export const column=(index:number)=>{let result="";for(let n=index+1;n>0;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;return result;};
export const sheetRange=(source:Source)=>"'"+sourceNames[source]+"'!A:"+column(headers(source).length-1);
export function dateCell(value:string,datetime=false){if(!value)return "";const time=Date.parse(value);if(!Number.isFinite(time))throw new CrmError("날짜를 확인해 주세요");return (time+(datetime&&value.length>10?9*3600000:0))/86400000+25569;}
function readDate(value:unknown,datetime=false){if(typeof value!=="number")return String(value??"");const text=new Date(Math.round((value-25569)*86400000)).toISOString();return datetime?text.slice(0,19)+"+09:00":text.slice(0,10);}
export function sheetRow(source:Source,cells:unknown[]):CrmRow{
 const values:Record<string,CrmValue>={};for(let i=0;i<fields[source].length;i++){const f=fields[source][i],v=cells[i+3];if(f.type==="relation"){try{const ids=JSON.parse(String(v||"[]"));if(!Array.isArray(ids)||ids.some(id=>typeof id!=="string"))throw Error();values[f.name]=ids;}catch{throw new CrmError("시트의 고객 연결 값을 확인해 주세요");}}else if(f.type==="date")values[f.name]=readDate(v,source==="events"&&f.name==="일정");else if(f.type==="checkbox")values[f.name]=v===true||String(v).toLowerCase()==="true";else if(f.type==="number")values[f.name]=v===""||v===undefined?"":Number(v);else values[f.name]=String(v??"");}
 if(source==='customers'){const birth=String(values['주민번호']||'').replace(/\D/g,'').slice(0,7);values['상령일']=customerTiming(birth)?.upperDate||'';}
 if(source==='contracts'){for(const [period,endName] of [['면책기간(개월)','면책만료'],['감액기간(개월)','감액만료']])values[endName]=contractExpiry(String(values['계약일']||''),values[period]);}
 return{id:String(cells[0]),created:String(cells[3+fields[source].length]||''),updated:String(cells[1]||''),edited:createHash("sha256").update(JSON.stringify(headers(source).map((_,i)=>cells[i]??""))).digest("hex"),values};
}
export function rowCells(source:Source,old:unknown[],input:Record<string,unknown>,id:string){
 const schema:Schema=Object.fromEntries(fields[source].map(f=>[f.name,{type:f.name===fields[source][0].name?"title":f.type==="text"?"rich_text":f.type==="tel"?"phone_number":f.type==="email"?"email":f.type}]));
 let normalized:Record<string,unknown>;try{normalized=writeProperties(source,input,schema);}catch(e){throw new CrmError(e instanceof Error?e.message:"입력 내용을 확인해 주세요");}
 const cells=[...old];cells[0]=id;cells[1]=new Date().toISOString();cells[2]=false;cells[3+fields[source].length]=old[3+fields[source].length]||(old.length?'':cells[1]);
 for(let i=0;i<fields[source].length;i++){const f=fields[source][i];if(!Object.hasOwn(input,f.name)&&!Object.hasOwn(normalized,f.name))continue;let v:unknown=input[f.name];if(f.type==="date"){const d=(normalized[f.name] as {date?:{start:string}}|undefined)?.date?.start||"";v=dateCell(d,source==="events"&&f.name==="일정");}else if(f.type==="number")v=String(v??"").trim()?Number(v):"";else if(f.type==="checkbox")v=!!v;else if(f.type==="relation")v=JSON.stringify(v);else v=String(v??"");if(typeof v==="string"&&v.length>45000)throw new CrmError("시트의 한 항목은 45,000자 이내로 저장해 주세요");cells[i+3]=v;}
 return headers(source).map((_,i)=>cells[i]??"");
}
export async function readSheet(c:GoogleConnection,source:Source){
 if(!c.spreadsheet)throw new CrmError("저장할 시트를 선택해 주세요",409);
 const ensureColumns=async()=>{
  const metadata=await google<{sheets:{properties:{sheetId:number;title:string;gridProperties:{columnCount:number}}}[]}>(c,c.spreadsheet+'?fields=sheets(properties(sheetId,title,gridProperties(columnCount)))');
  const sheet=metadata.sheets.find(sheet=>sheet.properties.title===sourceNames[source]);
  if(!sheet)throw new CrmError('고객관리 시트를 찾지 못했습니다',409);
  if(sheet.properties.gridProperties.columnCount<headers(source).length)await google(c,c.spreadsheet+':batchUpdate','POST',{requests:[{appendDimension:{sheetId:sheet.properties.sheetId,dimension:'COLUMNS',length:headers(source).length-sheet.properties.gridProperties.columnCount}}]});
 };
 const fetchRows=()=>google<{values:unknown[][]}>(c,c.spreadsheet+"/values/"+encodeURIComponent(sheetRange(source))+"?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER");
 let result:{values:unknown[][]};try{result=await fetchRows();}catch(error){if(!(error instanceof CrmError)||error.status!==502)throw error;await ensureColumns();result=await fetchRows();}

 const rows=result.values||[],expected=headers(source);let actual=rows[0];
 const plain=expected.slice(0,-1);
 const legacy=source==='cards'?plain.map(name=>name==='보험사'?'생년월일':name):source==='customers'?plain.slice(0,-1):null;
 const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
 if(legacy&&(same(actual,legacy)||same(actual,[...legacy,'_created']))){
  const start=source==='cards'?plain.indexOf('보험사'):plain.length-1;
  if(source==='customers'&&same(actual,[...legacy,'_created']))throw new CrmError("고객관리 시트의 열 제목·순서가 변경되었습니다 원래 양식을 확인해 주세요",409);
  await google(c,c.spreadsheet+'/values/'+encodeURIComponent("'"+sourceNames[source]+"'!"+column(start)+'1')+'?valueInputOption=RAW','PUT',{values:[[plain[start]]]});
  actual=[...actual];actual[start]=plain[start];rows[0]=actual;
 }
 if(same(actual,plain)){
  await ensureColumns();
  const values=[['_created'],...rows.slice(1).map(row=>[/^\d{4}-\d{2}-\d{2}T/.test(String(row[1]||''))?String(row[1]):''])];
  await google(c,c.spreadsheet+'/values/'+encodeURIComponent("'"+sourceNames[source]+"'!"+column(expected.length-1)+'1')+'?valueInputOption=RAW','PUT',{values});
  rows[0]=expected;rows.slice(1).forEach((row,i)=>{row[expected.length-1]=values[i+1][0];});actual=expected;
 }
 if(!same(actual,expected))throw new CrmError("고객관리 시트의 열 제목·순서가 변경되었습니다 원래 양식을 확인해 주세요",409);
 if(rows.length>10000)throw new CrmError("관리 항목이 10,000개를 초과했습니다",413);return rows;
}
