import {validateCoverageSet,type CoverageSet} from './coverage-storage';
export type CoverageDraft=CoverageSet&{customerId:string;revision:number;provider:string;previewOpen:boolean;reportKind:string};
export function validateCoverageDraft(value:unknown):CoverageDraft{
 const source=value as Partial<CoverageDraft>,report=validateCoverageSet(value);
 if(!source||typeof source.customerId!=='string'||source.customerId.length>150||!Number.isSafeInteger(source.revision)||source.revision!<0||!['personal','notion','sheets','native'].includes(source.provider||''))throw Error('작성 내용의 저장 정보를 확인해 주세요');
 return {...report,customerId:source.customerId,revision:source.revision!,provider:source.provider!,previewOpen:false,reportKind:'cover'};
}
