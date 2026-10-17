import {createHash} from 'node:crypto';
import {sealCustomerData,openCustomerData} from './customer-records';
import {validateCoverageSet} from './coverage-storage';
export const LINKED_COVERAGE_VERSION=3;
export type CoverageProvider='notion'|'sheets'|'native';
export function coverageProvider(value:unknown):value is CoverageProvider{return value==='notion'||value==='sheets'||value==='native';}
export function linkedCoverageId(owner:string,provider:CoverageProvider,customerId:string){
 const hash=createHash('sha256').update(JSON.stringify(['linked-coverage',owner,provider,customerId])).digest('hex');
 return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
}
export function sealLinkedCoverage(owner:string,provider:CoverageProvider,customerId:string,input:unknown){
 const report=validateCoverageSet(input),id=linkedCoverageId(owner,provider,customerId);
 return sealCustomerData({provider,customerId,report:JSON.stringify(report)},owner,'linked-coverage',id);
}
export function openLinkedCoverage(payload:string,owner:string,provider:CoverageProvider,customerId:string){
 const value=openCustomerData(payload,owner,'linked-coverage',linkedCoverageId(owner,provider,customerId));
 if(value.provider!==provider||value.customerId!==customerId)throw Error('고객 연결 정보를 확인해 주세요');
 return validateCoverageSet(JSON.parse(value.report));
}
