export type ConsultationEntry = {id:string;date:string;time:string;place:string;content:string;createdAt:string;updatedAt:string};
export function validConsultationDate(value:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function parseConsultations(value:string):ConsultationEntry[] {
  const parsed=JSON.parse(value);
  if(parsed?.version!==1||!Array.isArray(parsed.entries)||parsed.entries.length>500)throw new Error("상담일지를 확인해 주세요.");
  const ids=new Set<string>();
  return parsed.entries.map((entry:unknown)=>{
    if(!entry||typeof entry!=="object"||Array.isArray(entry))throw new Error("상담일지를 확인해 주세요.");
    const source=entry as Record<string,unknown>,result={} as ConsultationEntry;
    for(const field of ["id","date","time","place","content","createdAt","updatedAt"] as const){
      if(typeof source[field]!=="string"||source[field].length>(field==="content"?12000:field==="place"?300:60))throw new Error("상담일지를 확인해 주세요.");
      result[field]=source[field].trim();
    }
    if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(result.id)||ids.has(result.id)||!validConsultationDate(result.date)||result.time!==""&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(result.time)||!result.content||!Number.isFinite(Date.parse(result.createdAt))||!Number.isFinite(Date.parse(result.updatedAt)))throw new Error("날짜·시간·상담 내용을 확인해 주세요.");
    ids.add(result.id);return result;
  });
}
export const CONSULTATION_STATUSES=["연락 예정","상담 중","검토 중","완료","보류"] as const;
export type ConsultationRecord={id:string;date:string;content:string;memo:string;nextContact:string;status:string;eventId?:string};
export const emptyConsultationRecord=():ConsultationRecord=>({id:crypto.randomUUID(),date:"",content:"",memo:"",nextContact:"",status:""});
export function parseConsultationRecords(value?:string):ConsultationRecord[]{
 if(!value)return [];
 const parsed=JSON.parse(value);
 if(parsed.records===undefined)return [];
 if(!Array.isArray(parsed.records)||parsed.records.length>200)throw new Error("상담 관리 기록을 확인해 주세요.");
 const ids=new Set<string>();
 return parsed.records.map((row:ConsultationRecord)=>{
  if(!row||typeof row!=="object"||typeof row.id!=="string"||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(row.id)||ids.has(row.id))throw new Error("상담 관리 기록을 확인해 주세요.");
  const legacy=row as ConsultationRecord&{reaction?:string};row={...row,memo:typeof row.memo==='string'?row.memo:legacy.reaction??''};
  for(const field of ["date","content","memo","nextContact","status"] as const)if(typeof row[field]!=="string"||row[field].length>(field==="content"||field==="memo"?2000:30))throw new Error("상담 관리 기록을 확인해 주세요.");
  if(row.date&&!validConsultationDate(row.date)||row.nextContact&&!validConsultationDate(row.nextContact)||row.status!==""&&!(CONSULTATION_STATUSES as readonly string[]).includes(row.status))throw new Error("상담일·다음 연락일·진행 상태를 확인해 주세요.");
  ids.add(row.id);if(row.eventId!==undefined&&(typeof row.eventId!=="string"||row.eventId.length>100))throw Error("연결된 일정을 확인해 주세요.");
  return {id:row.id,date:row.date,content:row.content,memo:row.memo,nextContact:row.nextContact,status:row.status,...(row.eventId?{eventId:row.eventId}:{})};
 });
}
export const serializeConsultations=(entries:readonly ConsultationEntry[],records?:readonly ConsultationRecord[])=>JSON.stringify({version:1,entries,...(records?{records}:{})});
export const sortConsultations=(entries:readonly ConsultationEntry[])=>[...entries].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)||b.createdAt.localeCompare(a.createdAt));
