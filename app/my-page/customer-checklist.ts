export const CUSTOMER_CHECKLIST_ITEMS = [
  {id:"ta",label:"TA진행"},
  {id:"consultation",label:"상담완료"},
  {id:"analysis",label:"보장분석"},
  {id:"policy",label:"증권전달"},
  {id:"referral",label:"소개요청"},
  {id:"contact",label:"안부연락"},
] as const;
export type CustomerChecklist = Record<(typeof CUSTOMER_CHECKLIST_ITEMS)[number]["id"],boolean>;
export const emptyCustomerChecklist = ():CustomerChecklist=>({ta:false,consultation:false,analysis:false,policy:false,referral:false,contact:false});
export function parseCustomerChecklist(serialized:string):CustomerChecklist {
  const value=JSON.parse(serialized),checked=emptyCustomerChecklist();
  if(value?.version!==1||!value.checked||typeof value.checked!=="object"||Array.isArray(value.checked))throw new Error("체크리스트를 확인해 주세요");
  for(const [id,state] of Object.entries(value.checked)){
    if((id==="renewal"||id==="anniversary")&&typeof state==="boolean")continue;
    if(!CUSTOMER_CHECKLIST_ITEMS.some(item=>item.id===id)||typeof state!=="boolean")throw new Error("체크리스트를 확인해 주세요");
    checked[id as keyof CustomerChecklist]=state;
  }
  return checked;
}
export type CustomerSchedule={id:string;label:string;date:string;memo:string;done:boolean;annualMonthDay?:string};
export const emptyCustomerSchedules=():CustomerSchedule[]=>[{id:"schedule-0",label:"생일"},{id:"schedule-1",label:"자동차갱신"},{id:"schedule-2",label:"상담예정"},{id:"schedule-3",label:"보장점검"},{id:"schedule-5",label:"건강검진"},{id:"schedule-6",label:"감사인사/선물"}].map(item=>({...item,date:"",memo:"",done:false}));
export function parseCustomerSchedules(serialized?:string):CustomerSchedule[]{
  if(!serialized)return emptyCustomerSchedules();
  const value=JSON.parse(serialized);
  if(value.schedules===undefined)return emptyCustomerSchedules();
  if(!Array.isArray(value.schedules)||value.schedules.length>100)throw new Error("관리 일정을 확인해 주세요");
  const ids=new Set<string>();
  return value.schedules.map((row:CustomerSchedule)=>{
    if(!row||typeof row.id!=="string"||!row.id||row.id.length>100||ids.has(row.id)||typeof row.label!=="string"||row.label.length>300||typeof row.memo!=="string"||row.memo.length>2000||typeof row.done!=="boolean"||typeof row.date!=="string")throw new Error("관리 일정을 확인해 주세요");
    if(row.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date))||new Date(row.date).toISOString().slice(0,10)!==row.date))throw new Error("예정일을 확인해 주세요");
    if(row.annualMonthDay!==undefined&&(typeof row.annualMonthDay!=="string"||row.annualMonthDay!==""&&(!/^\d{2}-\d{2}$/.test(row.annualMonthDay)||!Number.isFinite(Date.parse(`2000-${row.annualMonthDay}`))||new Date(`2000-${row.annualMonthDay}`).toISOString().slice(5,10)!==row.annualMonthDay)))throw new Error("생일을 확인해 주세요");
    ids.add(row.id);return {id:row.id,label:emptyCustomerSchedules().find(item=>item.id===row.id)?.label||row.label,date:row.date,memo:row.memo,done:row.done,...(row.annualMonthDay!==undefined?{annualMonthDay:row.annualMonthDay}:{})};
  });
}
export const serializeCustomerChecklist=(checked:CustomerChecklist,schedules?:CustomerSchedule[])=>JSON.stringify({version:1,checked,...(schedules?{schedules}:{})});
export function customerBirthdaySchedules(serialized:string|undefined,birth:string,today=new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"})):CustomerSchedule[]{
 const rows=parseCustomerSchedules(serialized),digits=birth.replace(/\D/g,"");
 const source=rows.find(row=>row.id==="schedule-0")||emptyCustomerSchedules()[0];
 const monthDay=source.annualMonthDay||source.date.slice(5)|| (digits.length>=6?`${digits.slice(2,4)}-${digits.slice(4,6)}`:"");
 if(!/^\d{2}-\d{2}$/.test(monthDay))return rows;
 const month=Number(monthDay.slice(0,2)),day=Number(monthDay.slice(3));
 if(month<1||month>12||day<1||day>new Date(Date.UTC(2000,month,0)).getUTCDate())return rows;
 const annual=(year:number)=>`${year}-${monthDay.slice(0,2)}-${String(Math.min(day,new Date(Date.UTC(year,month,0)).getUTCDate())).padStart(2,"0")}`;
 let date=annual(Number(today.slice(0,4)));if(date<today)date=annual(Number(today.slice(0,4))+1);
 const birthday={...source,date,annualMonthDay:monthDay,done:source.date===date?source.done:false};
 return rows.some(row=>row.id==="schedule-0")?rows.map(row=>row.id==="schedule-0"?birthday:row):[birthday,...rows];
}
