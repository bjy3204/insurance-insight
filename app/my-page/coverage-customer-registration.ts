import type {CrmRow} from '@/lib/notion-crm/model';
// Read the current provider status rather than treating an account draft as a CRM customer.
export async function ensureCoverageCustomer(provider:'notion'|'sheets',token:string,name:string,birth:string,registeredId?:string):Promise<CrmRow|null>{
 const endpoint='/api/my-page'+(provider==='sheets'?'/sheets':'');
 async function request(query:string,body?:unknown){
  const response=await fetch(endpoint+query,{method:body?'POST':'GET',cache:'no-store',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();
  if(!response.ok){if(response.status===423&&typeof window!=='undefined')window.dispatchEvent(new Event('crm-session-locked'));throw Error(result.error||'고객 저장소를 확인하지 못했습니다');}return result;
 }
 const status=await request('?status=1');if(!status.connected)return null;
 if(!status.ready)throw Error('고객관리 저장소 설정을 완료한 후 저장해 주세요');
 if(registeredId){const result=await request('?source=customers');const customer=(result.data?.customers as CrmRow[]||[]).find(row=>row.id===registeredId);if(!customer)throw Error('연결된 고객을 찾지 못했습니다 고객 목록에서 다시 선택해 주세요');return customer;}
 const added=await request('',{action:'save',source:'customers',requestId:crypto.randomUUID(),values:{'이름':name.trim(),'주민번호':birth}});
 const customer=added.record;
 if(!customer?.id)throw Error('고객 등록 결과를 확인하지 못했습니다 다시 저장해 주세요');
 return customer;
}
