export type DdayItem = { id: string; label: string; date: string; icon: string };
const PREFIX = "[insurance-insight:ddays:v1]";
export function readDdays(record: {dday_label?:string|null;dday_date?:string|null}|null): DdayItem[] {
 const label=record?.dday_label||"";
 if(label.startsWith(PREFIX)){
  const data=JSON.parse(label.slice(PREFIX.length));
  if(!Array.isArray(data)||data.some(item=>typeof item.id!=="string"||typeof item.label!=="string"||!validDdayDate(item.date)))throw new Error("디데이 저장 형식을 확인하지 못했습니다.");
  return data.map(item=>({...item,icon:typeof item.icon==="string"?item.icon:"📅"}));
 }
 return record?.dday_date?[{id:"legacy-dday",label:label||"D-Day",date:record.dday_date,icon:"📅"}]:[];
}
export function writeDdays(items:DdayItem[]){return {dday_label:PREFIX+JSON.stringify(items),dday_date:items[0]?.date||null};}
export function validDdayDate(value:unknown):value is string {
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split("-").map(Number);const date=new Date(y,m-1,d);
 return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;
}
export function ddayDifference(value:string,today=new Date()){
 const [y,m,d]=value.split("-").map(Number);
 return Math.round((Date.UTC(y,m-1,d)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);
}
