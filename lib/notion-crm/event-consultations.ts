import type {CrmRow,CrmValue} from './model';
import {eventCalendarFields} from './account-calendar';
import {parseConsultations,parseConsultationRecords,serializeConsultations,emptyConsultationRecord} from '@/app/my-page/customer-consultations';
export function consultationEventId(row:CrmRow){return row.id.startsWith('calendar:')?row.id:'crm:'+row.id;}
export function calendarCompletionKey(row:CrmRow){return 'event:'+(row.id.startsWith('calendar:')?row.id.slice(9):'crm:'+row.id);}
export function linkedAccountRows(rows:CrmRow[],customers:CrmRow[]):CrmRow[]{const links=new Map<string,CrmRow>();for(const customer of customers){try{for(const record of parseConsultationRecords(String(customer.values['상담일지 데이터']||'')))if(record.eventId?.startsWith('calendar:'))links.set(record.eventId,customer);}catch{/* Invalid notes remain untouched. */}}return rows.map(row=>({...row,values:{...row.values,고객:links.has(row.id)?[links.get(row.id)!.id]:[]}}));}
export function consultationEventNotes(customer:CrmRow,event:CrmRow,remove=false){
 const raw=String(customer.values['상담일지 데이터']||''),entries=raw?parseConsultations(raw):[],records=parseConsultationRecords(raw||undefined),eventId=consultationEventId(event);
 const others=records.filter(record=>record.eventId!==eventId),owner=event.values['고객'];
 const selected=Array.isArray(owner)&&owner.some(id=>id.replace(/-/g,'')===customer.id.replace(/-/g,''));
 if(remove||!selected||event.values['분류']!=='상담')return serializeConsultations(entries,others);
 const fields=eventCalendarFields(event.values),existing=records.find(record=>record.eventId===eventId);
 const record={...(existing||emptyConsultationRecord()),eventId,date:fields.date,content:fields.content,memo:fields.memo,nextContact:String(event.values['다음 연락일']||''),status:event.values['완료']?'완료':existing?.status||'상담 중'};
 if(record.content.length>2000||record.memo.length>2000)throw Error('상담내용과 메모는 각각 2,000자 이내로 입력해 주세요.');
 if(others.length>=200)throw Error('고객 상담일지 표는 최대 200행입니다.');
 return serializeConsultations(entries,[...others,record]);
}
