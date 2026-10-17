import {fields,isSource,titleNames,type Source,type CrmRow,type CrmValue} from './model';
import {residentBirth,writeProperties,type Schema} from './records';
import {CrmError} from './server';
import {sealCustomerData,openCustomerData} from '@/lib/customer-records';

export const NATIVE_PAYLOAD_VERSION=2;
export type NativeRecord={id:string;user_id:string;encrypted_payload:string;encryption_key_id:string;payload_version:number;revision:number;created_at:string;updated_at:string};
export function nativeValues(source:Source,input:unknown,previous:Record<string,CrmValue>={}){
 if(source==='cards')throw new CrmError('연결 없이 사용하기에서는 카드수납을 등록할 수 없습니다');
 if(!input||typeof input!=='object'||Array.isArray(input))throw new CrmError('입력 내용을 확인해 주세요');
 const values:Record<string,CrmValue>={...previous};
 for(const [name,value] of Object.entries(input)){
  if(!fields[source].some(field=>field.name===name))throw new CrmError('허용되지 않은 입력 항목입니다');
  if(!['string','number','boolean'].includes(typeof value)&&!Array.isArray(value))throw new CrmError('입력 내용을 확인해 주세요');
  values[name]=value as CrmValue;
 }
 if(source==='customers'){
  const birth=String(values['주민번호']||'').replace(/[\s.·-]/g,'');
  if(!/^\d{6}(?:[1-8])?$/.test(birth))throw new CrmError('연결 없이 사용하기에서는 생년월일 6~7자리만 입력할 수 있습니다 전체 주민번호는 저장할 수 없습니다');
  values['주민번호']=birth;try{values['생년월일']=residentBirth(birth);}catch{throw new CrmError('생년월일을 확인해 주세요');}
 }
 for(const name of ['예금주 생년월일','계약자 생년월일','피보험자 생년월일'])if(values[name]&&!/^\d{6}$/.test(String(values[name])))throw new CrmError(name+'은 6자리로 입력해 주세요');
 if(!String(values[titleNames[source]]||'').trim())throw new CrmError('이름 또는 제목을 입력해 주세요');
 const schema:Schema=Object.fromEntries(fields[source].map(field=>[field.name,{type:field.name===titleNames[source]?'title':field.type==='text'?'rich_text':field.type==='tel'?'phone_number':field.type}]));
 try{writeProperties(source,values,schema);}catch(error){throw new CrmError(error instanceof Error?error.message:'입력 내용을 확인해 주세요');}
 return values;
}
export function sealNative(source:Source,values:Record<string,CrmValue>,owner:string,id:string){
 return sealCustomerData({source,values:JSON.stringify(values)},owner,'crm-native',id);
}
export function openNative(row:NativeRecord):{source:Source;record:CrmRow}{
 if(row.payload_version!==NATIVE_PAYLOAD_VERSION||row.encryption_key_id!=='v1')throw new CrmError('저장된 데이터 형식을 확인해 주세요',503);
 const payload=openCustomerData(row.encrypted_payload,row.user_id,'crm-native',row.id);
 if(!isSource(payload.source)||payload.source==='cards')throw new CrmError('저장된 데이터 형식을 확인해 주세요',503);
 const values=JSON.parse(payload.values) as Record<string,CrmValue>;
 return {source:payload.source,record:{id:row.id,created:row.created_at,updated:row.updated_at,edited:String(row.revision),values}};
}
