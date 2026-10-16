"use client";
import { useEffect, useId, useState } from "react";
import { disclosureMemo, emptyDisclosure, parseDisclosure, serializeDisclosure, parseMedicalHistories, emptyMedicalHistories, type DisclosureRow } from "./customer-disclosure";
import CustomerMedicalHistories from "./CustomerMedicalHistories";
import type { CustomerRecord } from "./customer-lookup-model";
import useCustomerAutosave from "./useCustomerAutosave";
import styles from "./CustomerDisclosure.module.css";

function read(value?: string) { if (value) { try { return parseDisclosure(value); } catch { /* Display the supplied questions when no valid saved form exists. */ } } return emptyDisclosure(); }
function readMemo(value?:string){try{return disclosureMemo(value);}catch{return "";}}
function readHistories(value?:string){try{return parseMedicalHistories(value);}catch{return emptyMedicalHistories();}}
export default function CustomerDisclosure({ customer, onSave }: { customer?:CustomerRecord; onSave?:(customer:CustomerRecord, value:string)=>Promise<void> }) {
  const prefix=useId();
  const [rows,setRows]=useState(()=>read(customer?.disclosure));
  const [memo,setMemo]=useState(()=>readMemo(customer?.disclosure));
  const [histories,setHistories]=useState(()=>readHistories(customer?.disclosure));
  const [saving,setSaving]=useState(false), [error,setError]=useState("");
  const [baseline,setBaseline]=useState(()=>serializeDisclosure(read(customer?.disclosure),readMemo(customer?.disclosure),readHistories(customer?.disclosure)));
  useEffect(()=>{const next=read(customer?.disclosure),memo=readMemo(customer?.disclosure),histories=readHistories(customer?.disclosure);setRows(next);setMemo(memo);setHistories(histories);setBaseline(serializeDisclosure(next,memo,histories));setError("");},[customer?.id,customer?.disclosure]);
  const update=(id:string, change:Partial<DisclosureRow>)=>{setRows(previous=>previous.map(row=>row.id===id?{...row,...change}:row));setError("");};
  const save=async()=>{
    if(!customer||!onSave||saving)return;
    setSaving(true);setError("");
    try {const raw=serializeDisclosure(rows,memo,histories);const value=serializeDisclosure(parseDisclosure(raw),memo,parseMedicalHistories(raw));await onSave(customer,value);setBaseline(value);}
    catch(error){setError(error instanceof Error?error.message:"저장하지 못했습니다.");}
    finally{setSaving(false);}
  };
  useCustomerAutosave(serializeDisclosure(rows,memo,histories),baseline,!!customer&&!!onSave&&!saving,save);
  return <div className={styles.form}>
    <fieldset disabled={!customer||saving} className={styles.fields}>
      <div className={styles.scroll}><table className={styles.table}>
        <colgroup><col className={styles.questionColumn}/><col className={styles.answerColumn}/><col/></colgroup>
        <thead><tr><th scope="col">고지 항목</th><th scope="col">해당 여부</th><th scope="col">상세 내용</th></tr></thead>
        <tbody>{rows.map((row,index)=><tr key={row.id}>
          <td><textarea className={styles.questionInput} spellCheck={false} aria-label={`고지 항목 ${index+1}`} value={row.question} maxLength={2000} rows={2} onChange={event=>update(row.id,{question:event.target.value})}/></td>
          <td><div className={styles.answers}>{([['yes','예'],['no','아니오']] as const).map(([value,label])=><label key={value} htmlFor={`${prefix}-${row.id}-${value}`}><input id={`${prefix}-${row.id}-${value}`} type="checkbox" checked={row.answer===value} onChange={()=>update(row.id,{answer:row.answer===value?"":value,selected:[]})}/>{label}</label>)}</div></td>
          <td><textarea spellCheck={false} aria-label={`상세 내용 ${index+1}`} placeholder="" value={row.details} maxLength={6000} rows={2} onChange={event=>update(row.id,{details:event.target.value})}/></td>
        </tr>)}</tbody>
      </table></div>
      <CustomerMedicalHistories value={histories} onChange={value=>{setHistories(value);setError("");}}/>
    </fieldset>
    {error&&<p role="alert" className={styles.error}>{error}</p>}

  </div>;
}
