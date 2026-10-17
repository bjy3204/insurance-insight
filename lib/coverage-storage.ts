import { COVERAGE_GROUPS, REPORT_COVERAGE_GROUPS, REPORT_THEMES, REPORT_DESIGNS, type ReportDesign, type CoverageReport, type ReportTheme } from "@/app/my-page/coverage-report-model";
export type CoverageSet = { before: CoverageReport; after: CoverageReport; theme: ReportTheme;design?:ReportDesign };
const fields = new Set(COVERAGE_GROUPS.flatMap(group=>group.fields.map(field=>field.id)));
const text=(value:unknown,max:number)=>{if(typeof value!=="string"||value.length>max)throw new Error("입력 내용을 확인해 주세요");return value;};
export function validateCoverageSet(value:unknown):CoverageSet {
  if(!value||typeof value!=="object")throw new Error("보고서 내용을 확인해 주세요");
  const source=value as Record<string,unknown>;
  function report(value:unknown):CoverageReport {
    if(!value||typeof value!=="object")throw new Error("보고서 내용을 확인해 주세요");
    const r=value as Record<string,unknown>;
    function map(value:unknown,max:number){const result:Record<string,string>={};if(value===undefined)return result;if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("담보를 확인해 주세요");for(const [id,v]of Object.entries(value)){if(fields.has(id)||/^custom-[a-zA-Z0-9-]{1,80}$/.test(id))result[id]=text(v,max);}return result;}
    if(!Array.isArray(r.policies)||!r.policies.length||r.policies.length>200)throw new Error("보험 목록을 확인해 주세요");
    const removedGroups:string[]=r.removedGroups===undefined?[]:Array.isArray(r.removedGroups)&&r.removedGroups.length<=53?r.removedGroups.map(title=>text(title,60)):(()=>{throw new Error("분류를 확인해 주세요");})();
    const removedFields:string[]=r.removedFields===undefined?[]:Array.isArray(r.removedFields)&&r.removedFields.length<=253?r.removedFields.map(id=>text(id,100)):(()=>{throw new Error("삭제 항목을 확인해 주세요");})();
    const customFields:NonNullable<CoverageReport['customFields']>={};
    if(r.customFields!==undefined){
      if(!r.customFields||typeof r.customFields!=="object"||Array.isArray(r.customFields))throw new Error("추가 항목을 확인해 주세요");
      const ids=new Set<string>();
      const entries=Object.entries(r.customFields);
      if(entries.length>53)throw new Error("분류가 너무 많습니다");
      for(const [title,list] of entries){
        text(title,60);if(!title.trim()||["__proto__","constructor","prototype"].includes(title))throw new Error("분류명을 확인해 주세요");
        if(!Array.isArray(list)||list.length>53)throw new Error("보장 항목은 최대 53개입니다");
        customFields[title]=list.map(field=>{if(!field||typeof field!=="object")throw new Error("보장 항목을 확인해 주세요");const id=text(field.id,100);if(!/^custom-[a-zA-Z0-9-]{1,80}$/.test(id)||ids.has(id))throw new Error("보장 항목을 확인해 주세요");ids.add(id);return {id,label:text(field.label,40)};});
      }
    }
    if(REPORT_COVERAGE_GROUPS.filter(group=>!removedGroups.includes(group.title)).reduce((sum,group)=>sum+group.fields.filter(field=>!removedFields.includes(field.id)).length,0)+Object.entries(customFields).filter(([title])=>!removedGroups.includes(title)).reduce((sum,[,list])=>sum+list.length,0)>53)throw new Error("보장 항목은 최대 53개입니다");
    const categoryLabels:Record<string,string>={};
    if(r.categoryLabels!==undefined){
      if(!r.categoryLabels||typeof r.categoryLabels!=="object"||Array.isArray(r.categoryLabels))throw new Error("분류명을 확인해 주세요");
      for(const [key,value] of Object.entries(r.categoryLabels)){if(key.length<=60)categoryLabels[key]=text(value,60);}
    }
    return {name:text(r.name,60),birth:text(r.birth,20),date:text(r.date,10),advisor:text(r.advisor,60),organization:text(r.organization??"",60),phone:text(r.phone??"",60),fax:text(r.fax??"",60),email:text(r.email??"",100),memo:"",fieldUnits:map(r.fieldUnits,10),removedGroups,removedFields,customFields,categoryLabels,fieldLabels:map(r.fieldLabels,40),statusLabels:map(r.statusLabels,40),statusOverrides:map(r.statusOverrides,100),chartTargets:map(r.chartTargets,20),overrides:map(r.overrides,100),policies:r.policies.map(p=>{
      if(!p||typeof p!=="object")throw new Error("보험을 확인해 주세요");return {id:text(p.id,100),insurer:text(p.insurer,60),product:text(p.product,120),years:text(p.years,10),start:text(p.start,10),end:text(p.end,10),premium:text(p.premium,20),units:map(p.units,10),amounts:map(p.amounts,100)};
    })};
  }
  if(!REPORT_THEMES.some(theme=>theme.id===source.theme))throw new Error("색상을 확인해 주세요");
  if(source.design!==undefined&&!REPORT_DESIGNS.some(design=>design.id===source.design))throw new Error('디자인을 확인해 주세요');
  return {before:report(source.before),after:report(source.after),theme:source.theme as ReportTheme,design:(source.design||'simple') as ReportDesign};
}
