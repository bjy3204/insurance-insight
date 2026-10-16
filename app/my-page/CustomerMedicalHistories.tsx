"use client";
import { Hospital, Scissors, Plus } from "lucide-react";
import { emptyMedicalHistoryRow, type MedicalHistories, type MedicalHistoryRow } from "./customer-disclosure";
import styles from "./CustomerDisclosure.module.css";
export default function CustomerMedicalHistories({value,onChange}:{value:MedicalHistories;onChange:(value:MedicalHistories)=>void}){
 return <div className={styles.histories}>{(["hospitalizations","surgeries"] as const).map(kind=>{
 const inpatient=kind==="hospitalizations",title=inpatient?"입원 이력":"수술 이력",Icon=inpatient?Hospital:Scissors;
 const headings=inpatient?["입원일","병명 / 진단명","입원기간","병원명","비고"]:["수술일","수술명","수술 사유","병원명","비고"];
 const fields:(keyof MedicalHistoryRow)[]=["date","name","detail","hospital","note"];
 return <section className={styles.historyCard} key={kind}><div className={styles.historyHeader}><h3><Icon size={19}/>{title}</h3><button type="button" aria-label={`${title} 추가`} title="추가" disabled={value[kind].length>=100} onClick={()=>onChange({...value,[kind]:[...value[kind],emptyMedicalHistoryRow()]})}><Plus size={16}/></button></div>
 <div className={styles.scroll}><table className={styles.historyTable}><thead><tr>{headings.map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{value[kind].map((row,index)=><tr key={index}>{fields.map((field,column)=><td key={field}><textarea spellCheck={false} wrap="off" rows={1} maxLength={1000} aria-label={`${title} ${index+1} ${headings[column]}`} value={row[field]} onChange={event=>onChange({...value,[kind]:value[kind].map((entry,i)=>i===index?{...entry,[field]:event.target.value}:entry)})}/></td>)}</tr>)}</tbody></table></div></section>;
 })}</div>;
}
