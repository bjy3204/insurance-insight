"use client";
import {useState} from 'react';
import {CircleUserRound,X,Search} from 'lucide-react';
import type {CrmRow} from '@/lib/notion-crm/model';
import {coverageCustomerBirth} from './coverage-customer-search';
import {HoverGuide} from './CoverageReportGuide';
import ClearableSearchInput from '@/app/components/ClearableSearchInput';
import Pagination from '@/app/components/Pagination';
import styles from './CoverageCustomerList.module.css';

export default function CoverageCustomerList({rows,loadSaved,remove,select}:{rows:CrmRow[];loadSaved:()=>Promise<string[]>;remove:(row:CrmRow)=>Promise<boolean>;select:(row:CrmRow)=>Promise<void>}){
 const [saved,setSaved]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1);
 const term=query.trim().replace(/\s/g,''),matches=rows.filter(row=>!term||String(row.values['이름']||'').replace(/\s/g,'').includes(term)||coverageCustomerBirth(row).includes(term));
 const totalPages=Math.max(1,Math.ceil(matches.length/10)),currentPage=Math.min(page,totalPages),visible=matches.slice((currentPage-1)*10,currentPage*10);
 async function show(){setBusy(true);setError('');try{setSaved(await loadSaved());}catch(e){setError(e instanceof Error?e.message:'목록을 불러오지 못했습니다');}finally{setBusy(false);}}
 return <HoverGuide title="전체 고객" icon={<CircleUserRound size={20}/>} onOpen={()=>void show()} compact noScroll height={760} width={320} holdOpen={busy}><div className={styles.list}>
  <div className={styles.search} data-popup-field-wrapper="true"><Search size={16} aria-hidden="true"/><ClearableSearchInput data-borderless-field="true" aria-label="전체 고객 이름 생년월일 검색" placeholder="고객명 · 생년월일 검색" value={query} onClear={()=>{setQuery('');setPage(1);}} onChange={event=>{setQuery(event.target.value);setPage(1);}}/></div>
  <div className={styles.heading}><span>이름</span><span>생년월일</span><span className={styles.deleteCaption}>삭제</span></div>
  {error&&<p role="alert">{error}</p>}
  {visible.map(row=><div className={styles.row} key={row.id}><button className={styles.customer} data-customer-registered={!row.id.startsWith('personal:')} title={row.id.startsWith('personal:')?'고객관리 미등록 · 리포트만 저장':'고객관리 등록 고객'} disabled={busy} type="button" onClick={()=>{void select(row);}}><span>{String(row.values['이름']||'')}</span><span>{coverageCustomerBirth(row)}</span></button><button className={styles.remove} data-icon-only="true" type="button" disabled={busy||(!row.id.startsWith('personal:')&&!saved.includes(row.id))} aria-label={`${String(row.values['이름']||'')} ${coverageCustomerBirth(row)} 보장분석 리포트 삭제`} title={row.id.startsWith('personal:')||saved.includes(row.id)?'보장분석 리포트 삭제':'저장된 리포트 없음'} onClick={()=>{setBusy(true);setError('');void remove(row).then(deleted=>{if(deleted)setSaved(current=>current.filter(id=>id!==row.id));}).catch(e=>setError(e instanceof Error?e.message:'삭제하지 못했습니다')).finally(()=>setBusy(false));}}><X size={18}/></button></div>)}
  {!visible.length&&query&&<p>일치하는 고객이 없습니다</p>}
  {matches.length>=10&&<div className={styles.pagination}><Pagination page={currentPage} totalPages={totalPages} desktopPageCount={3} mobilePageCount={3} onPageChange={setPage}/></div>}
 </div></HoverGuide>;
}
