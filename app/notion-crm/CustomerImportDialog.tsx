"use client";
import {useEffect,useRef,useState} from 'react';
import DashboardDialog from '@/app/features/home/components/dashboard/DashboardDialog';
import {parseLinkedImport,restrictNativeImport,type LinkedImportRow} from '@/lib/notion-crm/customer-import';
import type {CrmData,CrmRow,CrmValue} from '@/lib/notion-crm/model';
import styles from './CustomerImportDialog.module.css';
import CustomerImportGuide from './CustomerImportGuide';
export default function CustomerImportDialog({limited=false,customers,contracts:existingContracts,related,providerLabel,onSave,onClose}:{limited?:boolean;customers:CrmRow[];contracts:CrmRow[];related:Pick<CrmData,'cars'|'cards'>;providerLabel:string;onSave:(source:'customers'|'contracts'|'cars'|'cards',values:Record<string,CrmValue>)=>Promise<CrmRow>;onClose:()=>void}){
 const [rows,setRows]=useState<LinkedImportRow[]>([]),[error,setError]=useState(''),[running,setRunning]=useState(false),[reading,setReading]=useState(false),[consent,setConsent]=useState(false);
 const stop=useRef(false),fileInput=useRef<HTMLInputElement>(null);
 const [fileName,setFileName]=useState(''),[duplicateCount,setDuplicateCount]=useState(0);
 useEffect(()=>()=>{stop.current=true;},[]);
 const valid=rows.filter(row=>!row.error&&!row.status),saved=rows.filter(row=>row.status==='saved').length,uncertain=rows.some(row=>row.status==='uncertain');
 async function read(file?:File){if(!file)return;setFileName(file.name);setError('');setRows([]);setDuplicateCount(0);setConsent(false);setReading(true);try{
  if(!/\.xlsx$/i.test(file.name)||file.size>5*1024*1024)throw Error('5MB 이하의 .xlsx 파일을 선택해 주세요');
  const XLSX=await import('xlsx');const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false,sheetRows:503});
  const sheet=workbook.Sheets['고객정보']||workbook.Sheets['고객등록'];if(!sheet)throw Error('고객정보 시트를 찾을 수 없습니다');const contracts=workbook.Sheets['계약정보'];
  if([sheet,contracts].filter(Boolean).some(page=>Object.values(page).some(cell=>cell&&typeof cell==='object'&&'f' in cell)))throw Error('수식 대신 값만 입력해 주세요');
  const customerMatrix=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:false,defval:''});if(limited)customerMatrix[0]=customerMatrix[0].map(name=>name==='생년월일'?'주민번호':name);const parsed=parseLinkedImport(customerMatrix,contracts?XLSX.utils.sheet_to_json<unknown[]>(contracts,{header:1,raw:false,defval:''}):[],customers,existingContracts,related);if(limited)restrictNativeImport(parsed);setDuplicateCount(parsed.filter(row=>!!row.existingId||/중복|이미 등록/.test(row.error)).length);setRows(parsed);
 }catch(e){setError(e instanceof Error?e.message:'파일을 읽지 못했습니다');}finally{setReading(false);}}
 async function save(){stop.current=false;setRunning(true);setError('');try{const links=new Map(rows.filter(row=>row.existingId).map(row=>[row.customerKey,row.existingId!]));for(const row of valid){if(stop.current)break;try{if(row.source==='customers'){if(!row.existingId){const record=await onSave('customers',row.values);row.existingId=record.id;links.set(row.customerKey,record.id);}}else{const customerId=links.get(row.customerKey);if(!customerId)throw Error('연결할 고객이 저장되지 않았습니다');await onSave(row.source,{...row.values,'고객':[customerId]});}row.status='saved';setRows(previous=>[...previous]);}catch(e){row.status='uncertain';setRows(previous=>[...previous]);setError((e instanceof Error?e.message:'등록하지 못했습니다')+' 등록을 중단했습니다 창을 닫고 목록에서 저장 여부를 확인한 뒤 파일을 다시 올려 주세요');break;}}}finally{setRunning(false);}}
 return <DashboardDialog title="고객 엑셀 일괄등록" headerActions={<CustomerImportGuide/>} onClose={()=>{if(!running&&!reading)onClose();}}><div className={styles.content}>
  <p><strong>저장 위치: {providerLabel}</strong></p>
  <a className={styles.download} href={limited?"/templates/고객 일괄 등록_연결없이.xlsx":"/templates/고객 일괄 등록.xlsx"} download="고객 일괄 등록.xlsx">엑셀 양식 다운로드</a>
  <div className={styles.file}><span>작성한 엑셀 파일</span><input ref={fileInput} className={styles.fileInput} type="file" accept=".xlsx" disabled={running||reading} onChange={event=>{void read(event.target.files?.[0]);event.target.value='';}}/><button className={styles.fileButton} type="button" disabled={running||reading} onClick={()=>fileInput.current?.click()}>{reading?'파일 확인 중':'엑셀 파일 선택'}</button>{fileName&&<span className={styles.fileName}>{fileName}</span>}</div>
  {reading&&<p role="status">파일을 확인하고 있습니다</p>}
  {!!rows.length&&<><p aria-live="polite">고객 {rows.filter(row=>row.source==='customers').length}명 · 계약 {rows.filter(row=>row.source==='contracts').length}건 · 차량 {rows.filter(row=>row.source==='cars').length}건 · 수납 {rows.filter(row=>row.source==='cards').length}건<br/>확인 필요 {rows.filter(row=>row.error).length}행 · 처리 완료 {saved}행 · 중복 {duplicateCount}행</p><div className={styles.preview}><table><thead><tr><th>시트·행</th><th>이름·상품</th><th>확인 결과</th></tr></thead><tbody>{rows.map(row=><tr key={row.source+row.line}><td>{row.source==='customers'?'고객정보':row.source==='contracts'?'계약정보':row.source==='cars'?'차량정보':'카드수납'} {row.line}</td><td>{row.values['이름']||row.values['상품명']||row.values['차량번호']||row.values['수납명']}</td><td data-error={!!row.error||row.status==='uncertain'}>{row.error||(row.status==='saved'?'처리 완료':row.status==='uncertain'?'저장 여부 확인 필요':row.existingId?'기존 고객 연결 (정보 유지)':'등록 가능')}</td></tr>)}</tbody></table></div>
  <label className={styles.consent}><input type="checkbox" checked={consent} disabled={running} onChange={e=>setConsent(e.target.checked)}/><span>등록 대상 고객의 개인정보 수집·이용 동의를 확인했습니다</span></label></>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  <div className={styles.actions}>{running?<button type="button" onClick={()=>{stop.current=true;}}>현재 항목 저장 후 중단</button>:<><button type="button" disabled={reading} onClick={onClose}>닫기</button><button type="button" className={styles.primary} disabled={reading||!consent||!valid.length||uncertain} onClick={()=>void save()}>정상 {valid.length}행 등록</button></>}</div>
 </div></DashboardDialog>;
}
