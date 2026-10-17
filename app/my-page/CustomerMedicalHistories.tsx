"use client";
import { Plus, Trash2 } from "lucide-react";
import { emptyMedicalHistoryRow, type MedicalHistories, type MedicalHistoryRow } from "./customer-disclosure";
import styles from "./CustomerDisclosure.module.css";
export default function CustomerMedicalHistories({value,onChange}:{value:MedicalHistories;onChange:(value:MedicalHistories)=>void}){
 return <div className={styles.histories}>{(["hospitalizations","surgeries"] as const).map(kind=>{
 const inpatient=kind==="hospitalizations",title=inpatient?"입원 이력":"수술 이력";
 const headings=inpatient?["입원일","병명 / 진단명","입원기간","병원명"]:["수술일","수술명","수술 사유","병원명"];
 const fields:(keyof MedicalHistoryRow)[]=["date","name","detail","hospital"];
 return <section data-ui-card="true" className={styles.historyCard} key={kind}>
 <div className={styles.scroll}><table data-crm-inline="true" className={styles.historyTable}><colgroup><col style={{width:"19%"}}/><col style={{width:"25%"}}/><col/><col/><col style={{width:"54px"}}/></colgroup><thead><tr>{headings.map(label=><th key={label} scope="col">{label}</th>)}<th scope="col" className={styles.historyActionHeader}><button data-icon-only="true" className={styles.historyAdd} type="button" aria-label={`${title} 추가`} title="추가" disabled={value[kind].length>=100} onClick={()=>onChange({...value,[kind]:[...value[kind],emptyMedicalHistoryRow()]})}><Plus size={20}/></button></th></tr></thead><tbody>{value[kind].map((row,index)=><tr key={index}>{fields.map((field,column)=><td key={field}><textarea data-borderless-field="true" spellCheck={false} wrap="off" rows={1} maxLength={1000} aria-label={`${title} ${index+1} ${headings[column]}`} value={row[field]} onChange={event=>onChange({...value,[kind]:value[kind].map((entry,i)=>i===index?{...entry,[field]:event.target.value}:entry)})}/></td>)}<td><button data-icon-only="true" type="button" className={styles.historyDelete} aria-label={`${title} ${index+1} 삭제`} title="삭제" onClick={()=>onChange({...value,[kind]:value[kind].filter((_,i)=>i!==index)})}><Trash2 size={20}/></button></td></tr>)}</tbody></table></div></section>;
 })}</div>;
}
