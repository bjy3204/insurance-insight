import {newReportPolicy,reportCoverageGroups,type CoverageReport} from "./coverage-report-model";
export type ReportCell={value:string;unit?:string};
export type CellRange={row:number;column:number;endRow:number;endColumn:number};
export const REPORT_META_KEYS=["insurer","product","years","start","end","remaining","premium"] as const;
export const clipboardRows=(report:CoverageReport)=>[...REPORT_META_KEYS,...reportCoverageGroups(report).flatMap(group=>group.fields.map(field=>field.id))];
export function clearReportCells(report:CoverageReport,range:CellRange):CoverageReport{
  const rows=clipboardRows(report),firstRow=Math.max(0,Math.min(range.row,range.endRow)),lastRow=Math.max(range.row,range.endRow);
  const firstColumn=Math.min(range.column,range.endColumn),lastColumn=Math.max(range.column,range.endColumn);
  const keys=rows.slice(firstRow,lastRow+1).filter(key=>key!=='remaining');
  return {...report,policies:report.policies.map((policy,column)=>{
    if(column<firstColumn||column>lastColumn)return policy;
    const next={...policy,amounts:{...policy.amounts}};
    for(const key of keys){if(REPORT_META_KEYS.includes(key as typeof REPORT_META_KEYS[number]))Object.assign(next,{[key]:''});else next.amounts[key]='';}
    return next;
  })};
}
export function copyReportCells(report:CoverageReport,range:CellRange):ReportCell[][]{
  const rows=clipboardRows(report),fields=reportCoverageGroups(report).flatMap(group=>group.fields);
  return rows.slice(Math.min(range.row,range.endRow),Math.max(range.row,range.endRow)+1).map(key=>report.policies.slice(Math.min(range.column,range.endColumn),Math.max(range.column,range.endColumn)+1).map(policy=>{
    if(REPORT_META_KEYS.includes(key as typeof REPORT_META_KEYS[number]))return {value:key==='remaining'?'':String(policy[key as keyof typeof policy]??'')};
    return {value:policy.amounts[key]||'',unit:policy.units?.[key]||report.fieldUnits?.[key]||fields.find(field=>field.id===key)?.unit||'만원'};
  }));
}
export function pasteReportCells(report:CoverageReport,row:number,column:number,cells:ReportCell[][]):CoverageReport{
  if(row<0||column<0||column>=200||cells.length>60||cells.some(line=>line.length>200))return report;
  const rows=clipboardRows(report),fields=reportCoverageGroups(report).flatMap(group=>group.fields);
  const policies=report.policies.map(policy=>({...policy,amounts:{...policy.amounts},units:{...policy.units}}));
  const width=Math.max(0,...cells.map(line=>line.length));
  while(policies.length<Math.min(200,column+width))policies.push({...newReportPolicy(crypto.randomUUID()),units:{}});
  cells.forEach((line,r)=>line.forEach((cell,c)=>{
    const key=rows[row+r],policy=policies[column+c];if(!key||!policy||key==='remaining')return;
    const value=String(cell.value).slice(0,120);
    if(['insurer','product','start','end'].includes(key))Object.assign(policy,{[key]:value.slice(0,key==='product'?120:key==='insurer'?60:10)});
    else if(key==='years'||key==='premium')Object.assign(policy,{[key]:value.replace(/\D/g,'').slice(0,key==='years'?2:20)});
    else{
      const field=fields.find(field=>field.id===key);if(!field)return;
      policy.amounts[key]=field.manual?value:value.replace(/,/g,'').replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1');
      if(cell.unit!==undefined)policy.units[key]=cell.unit.slice(0,10);
    }
  }));
  return {...report,policies};
}
