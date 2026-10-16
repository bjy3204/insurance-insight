"use client";
import { Plus, Trash2 } from "lucide-react";
import MemoSelect from "@/app/components/memos/MemoSelect";
import { CONSULTATION_STATUSES, emptyConsultationRecord, type ConsultationRecord } from "./customer-consultations";
import styles from "./CustomerConsultations.module.css";
const dateInput=(value:string)=>{const digits=value.replace(/\D/g,"").slice(0,8);return [digits.slice(0,4),digits.slice(4,6),digits.slice(6,8)].filter(Boolean).join("-");};
export default function CustomerConsultationRecords({rows,onChange,disabled}:{rows:ConsultationRecord[];onChange:(rows:ConsultationRecord[])=>void;disabled:boolean}){
 const update=(id:string,change:Partial<ConsultationRecord>)=>onChange(rows.map(row=>row.id===id?{...row,...change}:row));
 return <section className={styles.records}><div className={styles.recordsHeader}><h3>상담 관리 기록</h3><button type="button" aria-label="상담 관리 기록 추가" title="추가" disabled={disabled||rows.length>=200} onClick={()=>onChange([...rows,emptyConsultationRecord()])}><Plus size={18}/></button></div>
 <fieldset disabled={disabled} className={styles.recordsFields}><div className={styles.tableScroll}><table className={styles.recordsTable}><colgroup><col style={{width:"110px"}}/><col/><col/><col style={{width:"110px"}}/><col style={{width:"126px"}}/></colgroup><thead><tr>{["상담일","상담 내용","고객 반응","다음 연락일","진행 상태"].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}>
 <td><input aria-label={`상담일 ${index+1}`} inputMode="numeric" maxLength={10} value={row.date} onChange={event=>update(row.id,{date:dateInput(event.target.value)})}/></td>
 <td><textarea aria-label={`상담 내용 ${index+1}`} spellCheck={false} wrap="off" rows={1} maxLength={2000} value={row.content} onChange={event=>update(row.id,{content:event.target.value})}/></td>
 <td><textarea aria-label={`고객 반응 ${index+1}`} spellCheck={false} wrap="off" rows={1} maxLength={2000} value={row.reaction} onChange={event=>update(row.id,{reaction:event.target.value})}/></td>
 <td><input aria-label={`다음 연락일 ${index+1}`} inputMode="numeric" maxLength={10} value={row.nextContact} onChange={event=>update(row.id,{nextContact:dateInput(event.target.value)})}/></td>
 <td><div className={styles.statusCell}><MemoSelect label={`진행 상태 ${index+1}`} placeholder="선택" value={row.status} disabled={disabled} options={[{value:"",label:"선택"},...CONSULTATION_STATUSES.map(label=>({value:label,label}))]} onChange={status=>update(row.id,{status})}/><button type="button" aria-label={`상담 관리 기록 ${index+1} 삭제`} onClick={()=>onChange(rows.filter(item=>item.id!==row.id))}><Trash2 size={15}/></button></div></td>
 </tr>)}</tbody></table></div></fieldset></section>;
}
