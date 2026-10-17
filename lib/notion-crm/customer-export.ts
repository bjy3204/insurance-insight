import {fields,type CrmData,type CrmRow,type CrmValue} from './model';
import {customerTiming,customerRenewalDays} from '@/app/my-page/customer-lookup-model';
import {importHeaders,contractImportHeaders} from './customer-import';
export type ExportSource='customers'|'contracts'|'cars'|'cards'|'events';
export const exportNames:Record<ExportSource,string>={customers:'고객목록',contracts:'계약목록',cars:'자동차보험',cards:'카드수납',events:'일정상담'};
export function exportMatrix(source:ExportSource,data:CrmData,options:{limited?:boolean}={}):(string|number|boolean)[][]{
 if(options.limited&&source==='cards')throw Error('연결 없이 사용하기에서는 카드수납을 사용할 수 없습니다');
 let headers=source==='events'?['분류','제목','일정','장소','고객명','생년월일','연락처','완료','상담내용','메모']:source==='customers'?[...new Set(['유입경로','이름','생년월일','연락처','직업','주소','계약건수','상령일',...importHeaders.filter(name=>fields.customers.some(field=>field.name===name))])]:source==='contracts'?['고객명',...contractImportHeaders]:source==='cars'?['고객명','생년월일','연락처','보험사','차량번호','차종','갱신일','디데이','운전자지정','할인','메모']:['결제일','고객명','보험사','명의자','카드사','카드번호','유효기간','메모'];
 if(options.limited)headers=headers.filter(name=>name!=='주민번호');
 const value=(v:CrmValue|undefined)=>Array.isArray(v)?v.join(', '):v??'';
 const relatedCustomer=(row:CrmRow)=>data.customers.find(customer=>Array.isArray(row.values['고객'])&&row.values['고객'].some(id=>id.replace(/-/g,'')===customer.id.replace(/-/g,'')));
 return [[...headers],...data[source].map(row=>headers.map(key=>{
  const customer=source==='customers'?row:relatedCustomer(row);
  if(key==='고객명')return value(customer?.values['이름']);
  if(key==='생년월일'&&options.limited&&source==='customers')return String(customer?.values['주민번호']||'').replace(/\D/g,'').slice(0,7);
  if(key==='생년월일')return value(customer?.values['생년월일'])||String(customer?.values['주민번호']||'').replace(/\D/g,'').slice(0,6);
  if(key==='연락처'&&(source==='cars'||source==='events'))return value(customer?.values['연락처']);
  if(key==='계약건수')return data.contracts.filter(contract=>Array.isArray(contract.values['고객'])&&contract.values['고객'].some(id=>id.replace(/-/g,'')===row.id.replace(/-/g,''))).length;
  if(key==='상령일')return customerTiming(String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,7))?.upperDate||value(row.values['상령일']);
  if(key==='디데이'){const days=customerRenewalDays(String(row.values['갱신일']||''));return days===null?'':days===0?'D-Day':'D-'+days;}
  return value(row.values[key]);
 }))];
}
export async function downloadCustomerExcel(source:ExportSource,data:CrmData,options:{limited?:boolean}={}){
 const XLSX=await import('xlsx');
 const matrix=exportMatrix(source,data,options),sheet=XLSX.utils.aoa_to_sheet(matrix),book=XLSX.utils.book_new();
 sheet['!cols']=matrix[0].map((heading,index)=>({wch:Math.min(50,Math.max(14,...matrix.slice(0,201).map(row=>String(row[index]??'').length+(heading==='주소'?10:4))))}));
 for(const [address,cell]of Object.entries(sheet))if(!address.startsWith('!')&&cell&&typeof cell==='object'&&cell.t==='s')cell.z='@';
 XLSX.utils.book_append_sheet(book,sheet,source==='customers'?'고객정보':source==='contracts'?'계약정보':exportNames[source]);
 const {formatExportWorkbook}=await import('./excel-format');
 const bytes=await formatExportWorkbook(XLSX.write(book,{type:'array',bookType:'xlsx'}));
 const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const anchor=document.createElement('a');anchor.href=url;anchor.download=exportNames[source]+'_'+new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})+'.xlsx';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
