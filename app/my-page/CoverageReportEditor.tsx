"use client";
import { confirmAction } from "@/components/ConfirmationHost";
import CustomerFormSelect from "./CustomerFormSelect";
import CoverageProductInput from "./CoverageProductInput";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { useState } from "react";
import type { ReactNode, Dispatch, SetStateAction, KeyboardEvent, CSSProperties } from "react";
import { Plus, X, Eye, Printer } from "lucide-react";
import { reportCoverageGroups, coverageGroupLabel, coverageFieldLabel, coverageCategoryLabel, formatCoverageNumber, newReportPolicy, paymentValues, reportDateInput, type CoverageReport, type ReportPolicy } from "./coverage-report-model";
import styles from "./CoverageReportEditor.module.css";
import useCoverageCellSelection from "./useCoverageCellSelection";
import {changePolicyUnit} from "./coverage-unit";

type Props = { onPrint?: () => void; previewContent?: ReactNode; previewOnly?: boolean; onPreview?: () => void; pagination?: ReactNode; report: CoverageReport; setReport: Dispatch<SetStateAction<CoverageReport>>; page: number; onPageChange: (page: number) => void; onFieldLabelChange: (id: string, value: string) => void };
const metadata = [
  { key: "insurer", label: "보험사" }, { key: "product", label: "보험명" },
  { key: "years", label: "납입기간", suffix: "년납" },
  { key: "start", label: "보장시작" }, { key: "end", label: "보장종료" },
  { key: "remaining", label: "납입예정" },
  { key: "premium", label: "월 보험료", suffix: "원" },
] as const;
export default function CoverageReportEditor({ onPrint, previewContent, previewOnly=false, onPreview, pagination, report, setReport, page, onPageChange, onFieldLabelChange }: Props) {
  const [editingUnit,setEditingUnit]=useState<string|null>(null);
  const [unitDraft,setUnitDraft]=useState('');
  function commitUnit(policyId:string,field:{id:string;unit?:string}){setReport(current=>({...current,policies:current.policies.map(policy=>policy.id===policyId?changePolicyUnit(policy,field,unitDraft):policy)}));setEditingUnit(null); }
  function amountParts(policy:ReportPolicy,field:{id:string;unit?:string;manual?:boolean}){
    return {value:field.manual?policy.amounts[field.id]||'':formatCoverageNumber(policy.amounts[field.id]||''),unit:policy.units?.[field.id]||field.unit||'만원'};
  }
  function normalizeAmount(policyId:string,field:{id:string;unit?:string;manual?:boolean}){
    if(field.manual)return;
    setReport(current=>{let changed=false;const policies=current.policies.map(policy=>{
      const value=Number(policy.amounts[field.id]);
      if(policy.id!==policyId||(policy.units?.[field.id]||field.unit||'만원')!=='만원'||Object.prototype.hasOwnProperty.call(policy.units||{},field.id)||!Number.isFinite(value)||value<10000)return policy;
      changed=true;return {...policy,amounts:{...policy.amounts,[field.id]:String(Number((value/10000).toFixed(8)))},units:{...policy.units,[field.id]:'억'}};
    });return changed?{...current,policies}:current;});
  }
  const [fieldNotice,setFieldNotice]=useState("");
  const [editingCategory,setEditingCategory]=useState<string|null>(null);
  const [newCategory,setNewCategory]=useState("");
  const [addGroup,setAddGroup]=useState("사망");
  const groups=reportCoverageGroups(report);
  const selection=useCoverageCellSelection(report,setReport,page);
  const fieldRows=new Map(groups.flatMap(group=>group.fields).map((field,index)=>[field.id,index+metadata.length]));
  const fieldCount=groups.reduce((sum,group)=>sum+group.fields.length,0);
  function createCategory(){
    const title=newCategory.trim();
    if(!title||groups.length>=53||groups.some(group=>coverageGroupLabel(report,group.title)===title)||['__proto__','constructor','prototype'].includes(title))return;
    setReport(current=>({...current,removedGroups:(current.removedGroups||[]).filter(item=>item!==title),customFields:{...current.customFields,[title]:[]}}));setAddGroup(title);
  }
  const removeCategory = async (value:string)=>{const group=groups.find(group=>coverageGroupLabel(report,group.title)===value);if(!group)return false;if(group.fields.length&&!await confirmAction('이 분류와 포함된 보장 항목을 표에서 삭제할까요?'))return false;setReport(current=>({...current,removedGroups:[...(current.removedGroups||[]),group.title]}));if(addGroup===group.title){setAddGroup('');setNewCategory('');}return true;};
  function addField(title:string){if(fieldCount>=53){setFieldNotice("보장분석표 항목이 가득 찼습니다");return;}setFieldNotice("");setReport(current=>({...current,customFields:{...current.customFields,[title]:[...(current.customFields?.[title]||[]),{id:'custom-'+crypto.randomUUID(),label:''}]}}));}
  function removeField(title:string,id:string){setFieldNotice("");setReport(current=>({...current,removedFields:[...(current.removedFields||[]),id],customFields:{...current.customFields,[title]:(current.customFields?.[title]||[]).filter(field=>field.id!==id)}}));}
  const policies = report.policies.slice(page*6,page*6+6);
  const won = (value: number) => value ? `${value.toLocaleString("ko-KR")}\u202f원` : "";
  function updatePolicy(id: string, key: keyof Omit<ReportPolicy, "id" | "amounts">, value: string) {
    setReport(current => ({ ...current, policies: current.policies.map(policy => policy.id === id ? { ...policy, [key]: value } : policy) }));
  }
  function nextRow(event: KeyboardEvent<HTMLInputElement|HTMLTextAreaElement>) {
    if(event.key==='Tab'&&!event.nativeEvent.isComposing){
      const fields=Array.from(event.currentTarget.closest('table')?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input[data-column]:not([data-column="field-label"]):not(:disabled),textarea[data-column]:not(:disabled)')||[]);
      const index=fields.indexOf(event.currentTarget),next=fields[index+(event.shiftKey?-1:1)];
      if(index>=0&&next){event.preventDefault();next.focus();}
      return;
    }
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const input = event.currentTarget;
    const inputs = Array.from(input.closest("table")!.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input,textarea"));
    inputs.slice(inputs.indexOf(input) + 1).find(item => item.dataset.column === input.dataset.column)?.focus();
  }
  return <section data-ui-card="true" className={styles.editor}>
    <div className={styles.controls} style={{justifyContent:'flex-end'}}><div className={styles.addFieldControls}><div className={styles.categoryField}><CustomerFormSelect label="담보 분류" placeholder="분류 입력" value={newCategory} options={groups.map(group=>coverageGroupLabel(report,group.title))} disabled={false} allowRemove={false} showCheck={false} onChange={value=>{setNewCategory(value);const group=groups.find(group=>coverageGroupLabel(report,group.title)===value);if(group)setAddGroup(group.title);}} onAdd={async value=>{const title=value.trim();if(!title||groups.length>=53||groups.some(group=>group.title===title)||['__proto__','constructor','prototype'].includes(title))return false;setReport(current=>({...current,removedGroups:(current.removedGroups||[]).filter(item=>item!==title),customFields:{...current.customFields,[title]:[]}}));setAddGroup(title);setNewCategory(title);return true;}} onRemove={async()=>false}/>{fieldNotice&&<p role="status" className={styles.fieldNotice}>{fieldNotice.replace(/[.。]+$/, "")}</p>}</div><button type="button" disabled={!newCategory.trim()||groups.length>=53||groups.some(group=>coverageGroupLabel(report,group.title)===newCategory.trim())} onClick={createCategory}><Plus size={18}/><span>분류<span className={styles.addSuffix}> 추가</span></span></button><button type="button" disabled={!groups.some(group=>coverageGroupLabel(report,group.title)===newCategory.trim())} title={`보장 추가 (${fieldCount}/53)`} onClick={()=>{const group=groups.find(group=>coverageGroupLabel(report,group.title)===newCategory.trim());if(group)addField(group.title);}}><Plus size={18}/><span>보장<span className={styles.addSuffix}> 추가</span></span></button></div>{pagination}<div className={styles.insuranceActions}>{onPrint&&<button type="button" data-icon-only="true" aria-label="개별 인쇄" title="개별 인쇄" onClick={onPrint}><Printer size={20}/></button>}{onPreview&&<button type="button" data-icon-only="true" aria-label="미리보기" title="미리보기" onClick={onPreview}><Eye size={20}/></button>}<button type="button" onClick={() => { setReport(current => ({ ...current, policies: [...current.policies, newReportPolicy(crypto.randomUUID())] })); onPageChange(Math.floor(report.policies.length / 6)); }}><Plus size={18}/><span>보험<span className={styles.addSuffix}> 추가</span></span></button></div></div>

    {previewContent}
    {!previewOnly&&<div className={styles.scroll} onPointerDownCapture={selection.pointerDown} onKeyDownCapture={selection.keyDown} onCopy={selection.copy} onPaste={selection.paste} tabIndex={0} aria-label="보험별 보장금액 입력표 좌우로 스크롤할 수 있습니다">
      <table data-coverage-input-table="true" className={styles.table} style={{ width: 272 + policies.length * 180, minWidth: 272 + policies.length * 180 }}>
        <colgroup><col style={{ width: 72 }} /><col style={{ width: 200 }} />{policies.map(policy => <col key={policy.id} style={{width:180}}/>)}</colgroup>

        <tbody>{metadata.map((row,i) => <tr key={row.key} className={row.key === "premium" ? styles.premium : row.key === "product" ? styles.productRow : undefined}>
          {i===0&&<td rowSpan={7} className={styles.ornament} aria-hidden="true"><div className={styles.ornamentMark}>✦</div></td>}
          <th scope="row" className={styles.metadataLabel}>{row.label}</th>
          {policies.map((policy, policyIndex) => <td data-grid-row={i} data-grid-column={page*6+policyIndex} data-grid-selected={selection.selected(i,page*6+policyIndex)||undefined} className={row.key === "product" ? styles.productCell : undefined} key={policy.id}>
            {row.key === "product" ? <CoverageProductInput onKeyDown={event=>{if(event.key==='Tab')nextRow(event);}} aria-label={`보험 ${page*6+policyIndex + 1} 보험명`} data-column={policy.id} maxLength={60} value={policy.product} onChange={event=>updatePolicy(policy.id,"product",event.target.value)} /> : row.key === "remaining" ? <output className={styles.payment}>{won(paymentValues(policy, report.date)[row.key])}</output> : <div className={styles.cellInput} data-number-text={row.key==='premium'?formatCoverageNumber(policy[row.key]):policy[row.key]} data-has-unit={'suffix' in row&&!!policy[row.key]?'true':undefined} style={{'--cell-char-count':(row.key==='premium'?formatCoverageNumber(policy[row.key]):policy[row.key]).length} as CSSProperties}><div className={styles.numberBox}><span className={styles.numberMirror} aria-hidden="true">{row.key==='premium'?formatCoverageNumber(policy[row.key]):policy[row.key]}</span>
              <ClearableSearchInput showClearButton={false} onClear={() => { let value = ""; if (row.key === "years" || row.key === "premium") value = value.replace(/\D/g, ""); if (row.key === "start" || row.key === "end") value = reportDateInput(value); updatePolicy(policy.id, row.key, value); }} aria-label={`보험 ${page*6+policyIndex + 1} ${row.label}`} data-column={policy.id} onKeyDown={nextRow} value={row.key==='premium'?formatCoverageNumber(policy[row.key]):policy[row.key]} maxLength={row.key === "insurer" ? 20 : row.key === "years" ? 2 : row.key==='premium'?20:10} inputMode={["years", "premium", "start", "end"].includes(row.key) ? "numeric" : "text"} onChange={event => { let value = event.target.value; if (row.key === "years" || row.key === "premium") value = value.replace(/\D/g, ""); if (row.key === "start" || row.key === "end") value = reportDateInput(value); updatePolicy(policy.id, row.key, value); }} />
              </div>{"suffix" in row && policy[row.key] && <span>{row.suffix}</span>}{row.key==="insurer"&&report.policies.length>1&&<button data-coverage-delete="true" className={styles.delete} type="button" aria-label={`보험 ${page*6+policyIndex+1} 제외`} onClick={()=>setReport(current=>({...current,policies:current.policies.filter(p=>p.id!==policy.id)}))}><X size={12}/></button>}
            </div>}
          </td>)}
        </tr>)}</tbody>

        {groups.map(group => <tbody key={group.title}>{!group.fields.length&&<tr><th className={styles.category} onClick={()=>setAddGroup(group.title)} data-category-selected={addGroup===group.title||undefined}>{coverageCategoryLabel(coverageGroupLabel(report,group.title))}<button type="button" data-coverage-delete="true" className={styles.removeCategory} aria-label={`${coverageGroupLabel(report,group.title)} 분류 삭제`} title="분류 삭제" onClick={event=>{event.stopPropagation();void removeCategory(coverageGroupLabel(report,group.title));}}><X size={12}/></button></th><td colSpan={policies.length+1}/></tr>}{group.fields.map((field, fieldIndex) => <tr key={field.id}>
          {fieldIndex === 0 && <th scope="rowgroup" rowSpan={group.fields.length} data-category-selected={addGroup===group.title||undefined} onClick={()=>setAddGroup(group.title)} className={`${styles.category} ${styles.first}`}><button type="button" data-coverage-delete="true" className={styles.removeCategory} aria-label={`${coverageGroupLabel(report,group.title)} 분류 삭제`} title="분류 삭제" onClick={event=>{event.stopPropagation();void removeCategory(coverageGroupLabel(report,group.title));}}><X size={12}/></button><textarea className={styles.categoryInput} aria-label={`${group.title} 분류명`} value={editingCategory===group.title?coverageGroupLabel(report,group.title):coverageCategoryLabel(coverageGroupLabel(report,group.title))} onFocus={()=>{setEditingCategory(group.title);setAddGroup(group.title);setNewCategory(coverageGroupLabel(report,group.title));}} onBlur={()=>setEditingCategory(null)} maxLength={60} rows={3} style={{height:`${Math.max(1,coverageCategoryLabel(coverageGroupLabel(report,group.title)).split('\n').length)*1.4}em`}} onChange={event=>{const value=event.target.value;setReport(current=>({...current,categoryLabels:{...current.categoryLabels,[group.title]:value}}));}}/></th>}
          <th scope="row" className={`${styles.label} ${styles.second}`}><ClearableSearchInput showClearButton={false} onClear={() => onFieldLabelChange(field.id,"")} aria-label={`담보명 ${field.label}`} data-column="field-label" onKeyDown={nextRow} maxLength={40} value={coverageFieldLabel(report,field)} onChange={event=>onFieldLabelChange(field.id,event.target.value)}/><button data-coverage-delete="true" className={styles.removeField} type="button" aria-label={`${coverageFieldLabel(report,field)} 항목 삭제`} onClick={()=>removeField(group.title,field.id)}><X size={12}/></button></th>

          {policies.map((policy, policyIndex) => <td key={policy.id} data-grid-row={fieldRows.get(field.id)} data-grid-column={page*6+policyIndex} data-grid-selected={selection.selected(fieldRows.get(field.id)!,page*6+policyIndex)||undefined}><div className={styles.cellInput} data-number-text={amountParts(policy,field).value} data-has-unit={!field.manual&&!!policy.amounts[field.id]?'true':undefined} style={{'--cell-char-count':Math.max(2,formatCoverageNumber(policy.amounts[field.id]||'').length+2)} as CSSProperties}><div className={styles.numberBox}><span className={styles.numberMirror} aria-hidden="true">{amountParts(policy,field).value}</span><ClearableSearchInput showClearButton={false} onClear={() => { const value = field.manual ? "" : "".replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); setReport(current => ({ ...current, policies: current.policies.map(item => {if(item.id!==policy.id)return item;const units={...item.units};if(!value&&!field.manual)delete units[field.id];return {...item,units,amounts:{...item.amounts,[field.id]:value}};}) })); }} aria-label={`보험 ${page*6+policyIndex + 1} ${field.label} 가입금액`} data-column={policy.id} onKeyDown={nextRow} onBlur={()=>normalizeAmount(policy.id,field)} inputMode={field.manual ? "text" : "decimal"} maxLength={field.manual ? 35 : 16} value={amountParts(policy,field).value} onChange={event => { const value = field.manual ? event.target.value : event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"); setReport(current => ({ ...current, policies: current.policies.map(item => {if(item.id!==policy.id)return item;const units={...item.units};if(!value&&!field.manual)delete units[field.id];return {...item,units,amounts:{...item.amounts,[field.id]:value}};}) })); }} /></div>{!field.manual&&!!policy.amounts[field.id]&&(editingUnit===policy.id+':'+field.id?<input className={styles.unitEdit} aria-label={`${field.label} 단위 수정`} autoFocus maxLength={10} value={unitDraft} onChange={event=>setUnitDraft(event.target.value)} onBlur={()=>commitUnit(policy.id,field)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();commitUnit(policy.id,field);}else if(event.key==='Escape'){event.preventDefault();setEditingUnit(null);}}}/>:<button className={styles.unitButton} type="button" tabIndex={-1} title="단위 수정" aria-label={`${field.label} 단위 수정`} onClick={()=>{setUnitDraft(policy.units?.[field.id]||field.unit||'만원');setEditingUnit(policy.id+':'+field.id);}}>{amountParts(policy,field).unit}</button>)}</div></td>)}
        </tr>)}</tbody>)}
      </table>
    </div>}
  </section>;
}



