"use client";
import { confirmAction } from "@/components/ConfirmationHost";
import { useRef, useState } from "react";
import { Search, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { CoverageSet } from "@/lib/coverage-storage";
import styles from "./CoverageAnalysisTab.module.css";
type Customer={id:string;name:string;birth:string};
export default function CoverageCustomerStorage({ value, onLoad }: { value: CoverageSet; onLoad:(value:CoverageSet)=>void }) {
 const [name,setName]=useState(""),[birth,setBirth]=useState("");
 const [customers,setCustomers]=useState<Customer[]>([]),[selected,setSelected]=useState<Customer|null>(null);
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const snapshot=useRef("");
 async function request(path:string,options:RequestInit={}){
  const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error("고객별 저장은 로그인 후 사용할 수 있습니다.");
  const response=await fetch(`/api/coverage-reports${path}`,{...options,headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`}});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"처리하지 못했습니다.");return data;
 }
 async function load(customer:Customer){
  if(selected&&snapshot.current!==JSON.stringify(value)&&!await confirmAction("저장하지 않은 변경사항이 있습니다. 다른 고객을 불러올까요?"))return;
  setBusy(true);setMessage("");try{
   const data=await request(`?customerId=${encodeURIComponent(customer.id)}`);
   if(data.report&& !selected && value.before.policies.some(p=>p.insurer||p.product||p.premium||Object.keys(p.amounts).length)&&!await confirmAction("작성 중인 내용 대신 저장된 보장분석을 불러올까요?"))return;
   const next:CoverageSet=data.report||{...value,before:{...value.before,name:customer.name,birth:customer.birth},after:{...value.after,name:customer.name,birth:customer.birth}};
   setSelected(customer);setRevision(data.revision);setCustomers([]);onLoad(next);snapshot.current=JSON.stringify(next);setMessage(data.report?"저장된 보장분석을 불러왔습니다.":"등록된 고객입니다. 작성 후 저장해 주세요.");
  }catch(error){setMessage(error instanceof Error?error.message:"불러오지 못했습니다.");}finally{setBusy(false);}
 }
 async function search(){
  if(busy||!name.trim()&&!birth)return;
  setBusy(true);setMessage("");let found:Customer[]=[];try{const data=await request(`?name=${encodeURIComponent(name.trim())}&birth=${encodeURIComponent(birth)}`);found=data.customers;setCustomers(found);if(!found.length)setMessage("고객관리에 등록된 고객이 없습니다.");}catch(error){setMessage(error instanceof Error?error.message:"조회하지 못했습니다.");}finally{setBusy(false);}
  if(found.length===1)await load(found[0]);
 }
 async function save(){
  if(!selected||busy)return;
  if(value.before.name!==selected.name||value.before.birth!==selected.birth){setMessage("고객명·생년월일이 변경되었습니다. 저장할 고객을 다시 조회해 주세요.");return;}
  setBusy(true);setMessage("");try{const data=await request("",{method:"PUT",body:JSON.stringify({customerId:selected.id,revision,report:value})});setRevision(data.revision);snapshot.current=JSON.stringify(value);setMessage("저장했습니다.");}catch(error){setMessage(error instanceof Error?error.message:"저장하지 못했습니다.");}finally{setBusy(false);}
 }
 return <section className={styles.customerStorage}><form onSubmit={e=>{e.preventDefault();void search();}}><label>고객명<input aria-label="저장 고객명 검색" value={name} maxLength={60} onChange={e=>setName(e.target.value)}/></label><label>생년월일<input aria-label="저장 고객 생년월일 검색" value={birth} inputMode="numeric" maxLength={6} onChange={e=>setBirth(e.target.value.replace(/\D/g,"").slice(0,6))}/></label><button type="submit" disabled={busy}><Search size={15}/>조회</button><button type="button" disabled={busy||!selected} onClick={()=>void save()}><Save size={15}/>{busy?"처리 중…":"저장"}</button>{selected&&<span>{selected.name} {selected.birth}</span>}</form>{customers.length>1&&<div className={styles.customerMatches}>{customers.map(customer=><button type="button" disabled={busy} key={customer.id} onClick={()=>void load(customer)}>{customer.name}　{customer.birth}</button>)}</div>}{message&&<p role="status">{message}</p>}</section>;
}
