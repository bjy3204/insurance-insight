import {reportNumber,type ReportPolicy} from './coverage-report-model';
const factors:Record<string,number>={'억':10000,'만원':1,'천원':.1,'원':.0001};
export function changePolicyUnit(policy:ReportPolicy,field:{id:string;unit?:string},unit:string):ReportPolicy{
 const nextUnit=unit.trim()||field.unit||'만원',oldUnit=policy.units?.[field.id]||field.unit||'만원';
 const amount=reportNumber(policy.amounts[field.id]||'');
 const converted=amount!==null&&factors[oldUnit]!==undefined&&factors[nextUnit]!==undefined?String(Number((amount*factors[oldUnit]/factors[nextUnit]).toFixed(8))):policy.amounts[field.id]||'';
 return {...policy,amounts:{...policy.amounts,[field.id]:converted},units:{...policy.units,[field.id]:nextUnit}};
}
