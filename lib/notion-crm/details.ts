import type { CustomerRecord } from "@/app/my-page/customer-lookup-model";
import { CUSTOMER_CHECKLIST_ITEMS, emptyCustomerChecklist, parseCustomerChecklist, parseCustomerSchedules, serializeCustomerChecklist } from "@/app/my-page/customer-checklist";
import { emptyDisclosure, parseDisclosure, parseMedicalHistories, serializeDisclosure } from "@/app/my-page/customer-disclosure";
import { parseConsultations, parseConsultationRecords } from "@/app/my-page/customer-consultations";
import type { CrmRow, CrmValue } from "./model";
export const detailProperties={checklist:"체크리스트 데이터",disclosure:"알릴의무 데이터",consultations:"상담일지 데이터"} as const;
const text=(row:CrmRow,name:string)=>typeof row.values[name]==="string"?row.values[name] as string:"";
export function detailCustomer(row?:CrmRow):{customer?:CustomerRecord;error?:string}{
 if(!row)return {};
 try{
  const checked=text(row,detailProperties.checklist)?parseCustomerChecklist(text(row,detailProperties.checklist)):emptyCustomerChecklist();
  for(const item of CUSTOMER_CHECKLIST_ITEMS)if(typeof row.values[item.label]==="boolean")checked[item.id]=row.values[item.label] as boolean;
  const checklist=serializeCustomerChecklist(checked,parseCustomerSchedules(text(row,detailProperties.checklist)||undefined));
  const disclosure=text(row,detailProperties.disclosure)||serializeDisclosure(emptyDisclosure(),text(row,"알릴의무"));
  parseDisclosure(disclosure);parseMedicalHistories(disclosure);
  const consultations=text(row,detailProperties.consultations);
  if(consultations){parseConsultations(consultations);parseConsultationRecords(consultations);}
  return{customer:{id:row.id,name:text(row,"이름"),birth:text(row,"주민번호").replace(/\D/g,"").slice(0,7),updatedAt:row.edited,checklist,disclosure,consultations}};
 }catch{return{error:"저장된 고객 상세정보를 읽지 못했습니다 노션 원본을 확인해 주세요"};}
}
export function detailValues(field:keyof typeof detailProperties,value:string):Record<string,CrmValue>{
 const result:Record<string,CrmValue>={[detailProperties[field]]:value};
 if(field==="checklist"){const checked=parseCustomerChecklist(value);parseCustomerSchedules(value);for(const item of CUSTOMER_CHECKLIST_ITEMS)result[item.label]=checked[item.id];}
 if(field==="disclosure"){parseDisclosure(value);parseMedicalHistories(value);}
 if(field==="consultations"){parseConsultations(value);parseConsultationRecords(value);}
 return result;
}
