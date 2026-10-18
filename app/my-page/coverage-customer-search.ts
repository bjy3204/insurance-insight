import type {CrmRow} from '@/lib/notion-crm/model';

export function coverageCustomerBirth(row:CrmRow){
 const resident=String(row.values['주민번호']||'').replace(/\D/g,'');
 if(resident.length>=6)return resident.slice(0,6);
 const birth=String(row.values['생년월일']||'').replace(/\D/g,'');
 return birth.length===8?birth.slice(2):birth;
}

// Only an explicit provider/customer ID link can replace an account result.
export function coverageSearchRows(personal:CrmRow[],customers:CrmRow[],provider?:string):CrmRow[]{
 const ids=new Set(customers.map(row=>row.id));
 const seen=new Set<string>();
 return [...customers,...personal.filter(row=>!(row.values.__linkedProvider===provider&&typeof row.values.__linkedCustomerId==='string'&&ids.has(row.values.__linkedCustomerId)))].filter(row=>{
  if(seen.has(row.id))return false;seen.add(row.id);return true;
 });
}
