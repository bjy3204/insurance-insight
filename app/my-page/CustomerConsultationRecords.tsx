"use client";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { Plus, Trash2 } from "lucide-react";

import { emptyConsultationRecord, type ConsultationRecord } from "./customer-consultations";
import styles from "./CustomerConsultations.module.css";
const dateInput=(value:string)=>{const digits=value.replace(/\D/g,"").slice(0,8);return [digits.slice(0,4),digits.slice(4,6),digits.slice(6,8)].filter(Boolean).join("-");};
export default function CustomerConsultationRecords({rows,onChange,disabled}:{rows:ConsultationRecord[];onChange:(rows:ConsultationRecord[])=>void;disabled:boolean}){
 const update=(id:string,change:Partial<ConsultationRecord>)=>onChange(rows.map(row=>row.id===id?{...row,...change}:row));
 return <section data-ui-card="true" className={styles.records}>
 <fieldset disabled={disabled} className={styles.recordsFields}><div className={styles.tableScroll}><table data-crm-inline="true" className={styles.recordsTable}><colgroup><col style={{width:"160px"}}/><col/><col/><col style={{width:"54px"}}/></colgroup><thead><tr>{["상담일","상담 내용","메모"].map(label=><th key={label} scope="col">{label}</th>)}<th scope="col" className={styles.recordActionHeader}><button data-icon-only="true" type="button" className={styles.recordAdd} aria-label="상담 관리 기록 추가" title="추가" disabled={disabled||rows.length>=200} onClick={()=>onChange([...rows,emptyConsultationRecord()])}><Plus size={20}/></button></th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}>
 <td><ClearableSearchInput onClear={() => update(row.id,{date:dateInput("")})} aria-label={`상담일 ${index+1}`} inputMode="numeric" maxLength={10} value={row.date} onChange={event=>update(row.id,{date:dateInput(event.target.value)})}/></td>
 <td><textarea data-borderless-field="true" aria-label={`상담 내용 ${index+1}`} spellCheck={false} wrap="off" rows={1} maxLength={2000} value={row.content} onChange={event=>update(row.id,{content:event.target.value})}/></td>
 <td><textarea data-borderless-field="true" aria-label={`메모 ${index+1}`} spellCheck={false} wrap="off" rows={1} maxLength={2000} value={row.memo} onChange={event=>update(row.id,{memo:event.target.value})}/></td>
 <td><button data-icon-only="true" type="button" aria-label={`상담 관리 기록 ${index+1} 삭제`} title="삭제" className={styles.recordDelete} onClick={()=>onChange(rows.filter(item=>item.id!==row.id))}><Trash2 size={20}/></button></td>
 </tr>)}</tbody></table></div></fieldset></section>;
}
