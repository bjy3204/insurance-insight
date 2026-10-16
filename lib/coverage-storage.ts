import { COVERAGE_GROUPS, REPORT_THEMES, type CoverageReport, type ReportTheme } from "@/app/my-page/coverage-report-model";
export type CoverageSet = { before: CoverageReport; after: CoverageReport; theme: ReportTheme };
const fields = new Set(COVERAGE_GROUPS.flatMap(group=>group.fields.map(field=>field.id)));
const text=(value:unknown,max:number)=>{if(typeof value!=="string"||value.length>max)throw new Error("입력 내용을 확인해 주세요.");return value;};
export function validateCoverageSet(value:unknown):CoverageSet {
  if(!value||typeof value!=="object")throw new Error("보고서 내용을 확인해 주세요.");
  const source=value as Record<string,unknown>;
  function report(value:unknown):CoverageReport {
    if(!value||typeof value!=="object")throw new Error("보고서 내용을 확인해 주세요.");
    const r=value as Record<string,unknown>;
    function map(value:unknown,max:number){const result:Record<string,string>={};if(value===undefined)return result;if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("담보를 확인해 주세요.");for(const [id,v]of Object.entries(value)){if(fields.has(id))result[id]=text(v,max);}return result;}
    if(!Array.isArray(r.policies)||!r.policies.length||r.policies.length>200)throw new Error("보험 목록을 확인해 주세요.");
    return {name:text(r.name,60),birth:text(r.birth,20),date:text(r.date,10),advisor:text(r.advisor,60),organization:text(r.organization??"",60),phone:text(r.phone??"",60),fax:text(r.fax??"",60),email:text(r.email??"",100),memo:"",fieldLabels:map(r.fieldLabels,40),statusLabels:map(r.statusLabels,40),statusOverrides:map(r.statusOverrides,100),chartTargets:map(r.chartTargets,20),overrides:map(r.overrides,100),policies:r.policies.map(p=>{
      if(!p||typeof p!=="object")throw new Error("보험을 확인해 주세요.");return {id:text(p.id,100),insurer:text(p.insurer,60),product:text(p.product,120),years:text(p.years,10),start:text(p.start,10),end:text(p.end,10),premium:text(p.premium,20),amounts:map(p.amounts,100)};
    })};
  }
  if(!REPORT_THEMES.some(theme=>theme.id===source.theme))throw new Error("색상을 확인해 주세요.");
  return {before:report(source.before),after:report(source.after),theme:source.theme as ReportTheme};
}
