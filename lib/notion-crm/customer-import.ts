import {residentBirth} from './records';
import type {CrmData,CrmRow} from './model';
export const importHeaders=['유입경로','이름','주민번호','연락처','주소','회사','직업','메모','E-Mail','결제일','명의자','수납 보험사','카드사','카드번호','유효기간','예금주','예금주 생년월일','은행','계좌번호','실손 보험사','실손 가입일','실손 세대','실손 만기일','차량번호','차종','갱신일','자동차 보험사','운전자지정','할인'];
export type ImportRow={line:number;values:Record<string,string>;error:string;status?:'saved'|'uncertain'};
const identity=(name:unknown,resident:unknown)=>String(name||'').trim().replace(/\s/g,'')+'|'+String(resident||'').replace(/\D/g,'').slice(0,7);
export function parseCustomerImport(matrix:unknown[][],customers:CrmRow[]):ImportRow[]{
 const headers=(matrix[0]||[]).map(v=>String(v??'').trim());
 for(const key of ['이름','주민번호'])if(!headers.includes(key))throw Error(key+' 열이 없습니다. 제공된 양식을 사용해 주세요.');
 if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error('중복된 열 제목이 있습니다.');
 const nonempty=matrix.slice(1).map((cells,index)=>({cells,line:index+2})).filter(({cells})=>cells.some(v=>String(v??'').trim()));
 if(nonempty.length>200)throw Error('한 번에 최대 200명까지 등록할 수 있습니다.');
 if(!nonempty.length)throw Error('작성된 고객 정보가 없습니다.');
 const seen=new Set(customers.map(row=>identity(row.values['이름'],row.values['주민번호'])));
 return nonempty.map(({cells,line})=>{
  const values:Record<string,string>={};for(const [i,key]of headers.entries())if(key==='고객번호'||importHeaders.includes(key))values[key]=String(cells[i]??'').trim();
  let error='';try{
   if(!values['이름'])throw Error('이름을 입력해 주세요.');
   values['주민번호']=values['주민번호'].replace(/[\s.·-]/g,'');values['생년월일']=residentBirth(values['주민번호']);
   for(const [key,value] of Object.entries(values)){
    if(value.length>2000)throw Error(key+'은 2,000자 이내로 입력해 주세요.');
    if(['실손 가입일','실손 만기일'].includes(key)&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw Error(key+'은 YYYY-MM-DD 형식으로 입력해 주세요.');
   }
   if(values['E-Mail']&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values['E-Mail']))throw Error('이메일을 확인해 주세요.');
   if(values['연락처'])values['연락처']=values['연락처'].replace(/[\s.·()-]/g,'');
   if(values['연락처']&&!/^\+?[\d\s()-]{7,20}$/.test(values['연락처']))throw Error('연락처를 확인해 주세요.');
   const key=identity(values['이름'],values['주민번호']);if(seen.has(key))throw Error('동일한 이름·주민번호의 고객이 이미 있거나 파일에 중복되어 있습니다.');seen.add(key);
  }catch(e){error=e instanceof Error?e.message:'입력값을 확인해 주세요.';}
  return {line,values,error};
 });
}

export const contractImportHeaders=['계약일','계약자','계약자 생년월일','피보험자','피보험자 생년월일','보험사','보험료','상품명','메모','만기','면책기간(개월)','감액기간(개월)'];
export type LinkedImportRow=ImportRow&{source:'customers'|'contracts'|'cars'|'cards';customerKey:string;existingId?:string};
export function restrictNativeImport(rows:LinkedImportRow[]){
 for(const row of rows){
  if(row.source==='customers')row.values['주민번호']=String(row.values['주민번호']||'').replace(/\D/g,'').slice(0,7);
  if(row.source==='customers'&&!/^\d{6}[1-8]$/.test(String(row.values['주민번호']||'')))row.error='연결 없이 사용하기에서는 생년월일 7자리만 입력할 수 있습니다. 전체 주민번호는 등록할 수 없습니다.';
  if(row.source==='cards')row.error='연결 없이 사용하기에서는 카드수납을 등록할 수 없습니다.';
 }
 const invalid=new Set(rows.filter(row=>row.source==='customers'&&row.error).map(row=>row.customerKey));
 for(const row of rows)if(row.source!=='customers'&&invalid.has(row.customerKey))row.error||='연결할 고객의 생년월일을 확인해 주세요.';
 return rows;
}
export function parseLinkedImport(customerMatrix:unknown[][],contractMatrix:unknown[][],customers:CrmRow[],existingContracts:CrmRow[]=[],existingChildren:Pick<CrmData,'cars'|'cards'>={cars:[],cards:[]}):LinkedImportRow[]{
 const parsed=parseCustomerImport(customerMatrix,customers);
 const keys=new Map<string,LinkedImportRow>();
 const reserved=new Set(parsed.map(row=>row.values['고객번호']).filter(Boolean));let nextNumber=1;
 const autoKey=()=>{let key='';do{key='C'+String(nextNumber++).padStart(3,'0');}while(reserved.has(key)||keys.has(key));return key;};
 const result:LinkedImportRow[]=parsed.map(row=>{
  const customerKey=row.values['고객번호']||autoKey();delete row.values['고객번호'];
  const existing=customers.find(c=>identity(c.values['이름'],c.values['주민번호'])===identity(row.values['이름'],row.values['주민번호']));
  const item:LinkedImportRow={...row,source:'customers',customerKey,...(existing?{existingId:existing.id}:{})};
  if(existing){const checked=parseCustomerImport([customerMatrix[0],customerMatrix[row.line-1]],[])[0];item.error=checked.error;}
  if(customers.filter(c=>identity(c.values['이름'],c.values['주민번호'])===identity(row.values['이름'],row.values['주민번호'])).length>1)item.error='동일한 고객이 여러 명 등록되어 있습니다. 기존 고객 중복을 먼저 정리해 주세요.';
  if(!customerKey)item.error='고객번호를 입력해 주세요.';
  if(keys.has(customerKey)){item.error='고객번호가 중복되었습니다.';keys.get(customerKey)!.error=item.error;}
  keys.set(customerKey,item);return item;
 });
 const childMappings=[{source:'cards' as const,map:{'결제일':'결제일','명의자':'명의자','수납 보험사':'보험사','카드사':'카드사','카드번호':'카드번호','유효기간':'유효기간'}},{source:'cars' as const,map:{'차량번호':'차량번호','차종':'차종','갱신일':'갱신일','자동차 보험사':'보험사','운전자지정':'운전자지정','할인':'할인'}}];
 const seenChildren=new Set<string>();
 for(const customer of [...result])for(const {source,map}of childMappings){
  const values:Record<string,string>={};for(const [from,to]of Object.entries(map)){values[to]=customer.values[from]||'';delete customer.values[from];}
  if(!Object.values(values).some(Boolean))continue;
  let error=customer.error;
  if(source==='cards'){
   values['수납명']=customer.values['이름']+' 카드수납';
   if(values['결제일']&&(!/^\d{1,2}$/.test(values['결제일'])||Number(values['결제일'])<1||Number(values['결제일'])>31))error='결제일은 1~31로 입력해 주세요.';
   if(values['유효기간']&&!/^\d{2}\/(?:0[1-9]|1[0-2])$/.test(values['유효기간']))error='유효기간은 YY/MM 형식으로 입력해 주세요.';
  }else{
   if(!values['차량번호'])error='차량번호를 입력해 주세요.';
   const day=values['갱신일'];if(day&&(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day))error='갱신일은 YYYY-MM-DD 형식으로 입력해 주세요.';
  }
  const owner=customer.existingId||customer.customerKey,signature=source+'|'+owner+'|'+JSON.stringify(values);
  if(seenChildren.has(signature))error='파일 안에 동일한 차량·수납이 중복되었습니다.';seenChildren.add(signature);
  if(customer.existingId&&existingChildren[source].some(row=>Array.isArray(row.values['고객'])&&row.values['고객'].some(id=>id.replace(/-/g,'')===customer.existingId!.replace(/-/g,''))&&Object.entries(values).every(([key,value])=>String(row.values[key]??'')===value)))error='이미 등록된 동일 차량·수납입니다.';
  result.push({line:customer.line,values,error,source,customerKey:customer.customerKey});
 }
 if(!contractMatrix.length)return result;
 const headers=contractMatrix[0].map(v=>String(v??'').trim());
 for(const key of ['상품명','계약일'])if(!headers.includes(key))throw Error('계약정보 시트에 '+key+' 열이 없습니다.');
 if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error('계약정보 시트의 열 제목이 중복되었습니다.');
 const contracts=contractMatrix.slice(1).map((cells,index)=>({cells,line:index+2})).filter(({cells})=>cells.some(v=>String(v??'').trim()));
 if(contracts.length>500)throw Error('계약은 한 번에 최대 500건까지 등록할 수 있습니다.');
 const seen=new Set<string>();
 for(const {cells,line}of contracts){
  const values:Record<string,string>={};headers.forEach((key,index)=>{if(key==='고객번호'||contractImportHeaders.includes(key))values[key]=String(cells[index]??'').trim();});
  let customerKey=values['고객번호']||'';delete values['고객번호'];let error='';
  try{
   if(!customerKey){const name=String(values['계약자']||'').replace(/\s/g,''),birth=String(values['계약자 생년월일']||'').replace(/\D/g,'').slice(0,6);const candidates=[...keys.values()].filter(row=>!row.error&&String(row.values['이름']||'').replace(/\s/g,'')===name&&String(row.values['주민번호']||'').slice(0,6)===birth);if(!name||birth.length!==6||!candidates.length)throw Error('계약자 이름·생년월일에 맞는 고객을 고객정보 시트에서 찾지 못했습니다.');if(candidates.length!==1)throw Error('이름·생년월일이 같은 고객이 여러 명이라 자동 연결할 수 없습니다. 고객 조회에서 해당 고객을 선택해 계약을 추가해 주세요.');customerKey=candidates[0].customerKey;}
   const customer=keys.get(customerKey);if(!customer||customer.error)throw Error('고객정보 시트의 정상 고객번호와 연결해 주세요.');
   if(!values['상품명'])throw Error('상품명을 입력해 주세요.');
   if(!values['계약일'])throw Error('계약일을 입력해 주세요.');
   for(const [key,value]of Object.entries(values)){
    if(value.length>2000)throw Error(key+'은 2,000자 이내로 입력해 주세요.');
    if(['계약일','만기'].includes(key)&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw Error(key+'은 YYYY-MM-DD 형식으로 입력해 주세요.');
    if(['보험료','면책기간(개월)','감액기간(개월)'].includes(key)&&value){const number=Number(value.replace(/,/g,''));if(!Number.isSafeInteger(number)||number<0||(['면책기간(개월)','감액기간(개월)'].includes(key)&&number>1200))throw Error(key+' 숫자를 확인해 주세요.');values[key]=String(number);}
   }
   values['계약자'] ||= customer.values['이름'];values['피보험자'] ||= customer.values['이름'];values['계약자 생년월일'] ||= customer.values['주민번호'].slice(0,6);values['피보험자 생년월일'] ||= customer.values['주민번호'].slice(0,6);
   if(customer.existingId&&existingContracts.some(contract=>Array.isArray(contract.values['고객'])&&contract.values['고객'].includes(customer.existingId!)&&Object.entries(values).every(([key,value])=>String(contract.values[key]??'')===value)))throw Error('이미 등록된 동일 계약입니다.');
   const signature=customerKey+'|'+JSON.stringify(values);if(seen.has(signature))throw Error('파일 내 동일 계약이 중복되었습니다.');seen.add(signature);
  }catch(e){error=e instanceof Error?e.message:'계약 정보를 확인해 주세요.';}
  result.push({line,values,error,source:'contracts',customerKey});
 }
 return result;
}
