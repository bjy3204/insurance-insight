export type CoverageField = { id: string; label: string; manual?: boolean; unit?: "억" };
export const COVERAGE_GROUPS: { title: string; fields: CoverageField[] }[] = [
  { title: "사망", fields: ["일반사망", "질병사망", "상해사망"].map((label, i) => ({ id: `death-${i}`, label })) },
  { title: "후유장해", fields: ["질병후유장해(3%)", "질병후유장해(80%)", "상해후유장해(3%)", "상해후유장해(80%)"].map((label, i) => ({ id: `disability-${i}`, label })) },
  { title: "치매 / 간병", fields: ["경증 치매 진단", "시설급여", "재가급여", "질병 간병인 일당", "상해 간병인 일당"].map((label, i) => ({ id: `care-${i}`, label })) },
  { title: "암", fields: ["일반암 진단", "유사암 진단", "암 주요 치료비", "중입자 치료비", "항암 방사선 치료비", "항암 약물 치료비"].map((label, i) => ({ id: `cancer-${i}`, label })) },
  { title: "뇌", fields: ["뇌혈관질환 진단", "뇌졸중 진단", "뇌출혈 진단", "혈전용해치료비", "뇌혈관 수술비", "2대 주요 치료비"].map((label, i) => ({ id: `brain-${i}`, label })) },
  { title: "심장", fields: ["심혈관질환 진단", "허혈성심장 진단", "급성심근경색 진단", "혈전용해치료비", "허혈성심장 수술비", "2대 주요 치료비"].map((label, i) => ({ id: `heart-${i}`, label })) },
  { title: "수술", fields: ["질병 수술비", "질병 종 수술비", "N대 수술비", "상해 수술비", "상해 종 수술비"].map((label, i) => ({ id: `surgery-${i}`, label, manual: [1, 2, 4].includes(i) })) },
  { title: "입원", fields: ["질병 입원", "상해 입원", "질병 간호간병통합", "상해 간호간병통합"].map((label, i) => ({ id: `hospital-${i}`, label })) },
  { title: "1인실", fields: ["상급종합병원 1인실", "종합병원 1인실"].map((label, i) => ({ id: `hospital-${i + 4}`, label })) },
  { title: "골절 / 화상", fields: ["깁스", "골절진단", "5대골절진단", "화상진단"].map((label, i) => ({ id: `fracture-${i}`, label })) },
  { title: "운전자", fields: ["벌금(대인)", "벌금(대물)", "교통사고처리지원금", "변호사선임비용", "자동차사고부상치료비"].map((label, i) => ({ id: `driver-${i}`, label })) },
  { title: "실손의료비", fields: ["질병입원 의료비", "질병통원 의료비", "상해입원 의료비", "상해통원 의료비"].map((label, i) => ({ id: `medical-${i}`, label })) },
  { title: "배상", fields: [{ id: "liability", label: "일상생활배상책임", unit: "억" }] },
];
const careGroup = COVERAGE_GROUPS.find(group => group.title === "치매 / 간병")!;
export const REPORT_COVERAGE_GROUPS = COVERAGE_GROUPS.filter(group => group.title !== "배상").map(group => {
    if (group.title === "치매 / 간병") return { ...group, title: "치매 / 재가", fields: careGroup.fields.filter(field => ["care-0", "care-1", "care-2"].includes(field.id)) };
    if (group.title === "입원") return { ...group, fields: group.fields.filter(field => !["hospital-2", "hospital-3"].includes(field.id)) };
    if (group.title === "1인실") return { ...group, title: "간병", fields: [...careGroup.fields.filter(field => ["care-3", "care-4"].includes(field.id)), ...COVERAGE_GROUPS.find(item => item.title === "입원")!.fields.filter(field => ["hospital-2", "hospital-3"].includes(field.id))] };
    if (group.title === "골절 / 화상") return { ...group, title: "골절 / 화상 / 배상", fields: [...group.fields, ...COVERAGE_GROUPS.find(item => item.title === "배상")!.fields] };
    return group;
  });

export type ReportPolicy = { id: string; insurer: string; product: string; years: string; start: string; end: string; premium: string; units?: Record<string,string>; amounts: Record<string, string> };
export type CoverPlacement = { x: number; y: number; scale: number };
export type CoverLayout = Partial<Record<"image"|"overview",CoverPlacement>>;
export const REPORT_BACKGROUNDS = [
  {id:"protection",label:"손 위의 보장",src:"/images/coverage/report-cover-protection.png"},
  {id:"umbrella",label:"든든한 보장",src:"/images/coverage/report-cover-umbrella.png"},
  {id:"home-photo",label:"손 위의 집 · 실사",src:"/images/coverage/report-photo-background.png"},
  {id:"review-flat",label:"보장 점검",src:"/images/coverage/report-cover-review-flat.png"},
  {id:"forest",label:"나무의 여유",src:"/images/coverage/report-cover-trees-v2.png"},
  {id:"orange-paper",label:"기록과 설계",src:"/images/coverage/report-cover-orange-paper.png"},
  {id:"family-palm",label:"손 위의 가족",src:"/images/coverage/report-cover-family-palm.png"},
  {id:"insurance-photo",label:"보험 분석 · 실사",src:"/images/coverage/report-cover-insurance-photo-v2.png"},
  {id:"yellow-care",label:"노란 우산의 안심",src:"/images/coverage/report-cover-yellow-care-v2.png"},
] as const;
export const DEFAULT_REPORT_BACKGROUND = "umbrella" as const;
export type ReportBackground = typeof REPORT_BACKGROUNDS[number]["id"];
export type CoverageReport = { coverBackground?: ReportBackground; coverLayout?: CoverLayout; name: string; birth: string; date: string; advisor: string; organization?: string; phone?: string; fax?: string; email?: string; removedGroups?: string[]; removedFields?: string[]; customFields?: Record<string,CoverageField[]>; fieldUnits?: Record<string,string>; categoryLabels?: Record<string,string>; fieldLabels?: Record<string,string>; chartTargets?: Record<string,string>; statusOverrides?:Record<string,string>; statusLabels?:Record<string,string>; memo: string; policies: ReportPolicy[]; overrides: Record<string, string> };
export const coverageStatusReport=(report:CoverageReport):CoverageReport=>({...report,overrides:{...report.overrides,...report.statusOverrides},fieldLabels:{...report.fieldLabels,...report.statusLabels}});
export const reportCoverageGroups = (report: CoverageReport) => [
  ...REPORT_COVERAGE_GROUPS.map(group=>({...group,fields:[...group.fields.filter(field=>!report.removedFields?.includes(field.id)),...(report.customFields?.[group.title]||[])]})),
  ...Object.entries(report.customFields||{}).filter(([title])=>!REPORT_COVERAGE_GROUPS.some(group=>group.title===title)).map(([title,fields])=>({title,fields}))
].filter(group=>!report.removedGroups?.includes(group.title));
export const coverageGroupLabel = (report: CoverageReport, title: string) => report.categoryLabels?.[title] ?? title;
export const coverageFieldLabel = (report: CoverageReport, field: CoverageField) => report.fieldLabels?.[field.id] ?? field.label;
export const filledPolicyCount = (report:CoverageReport) => report.policies.filter(policy=>policy.insurer.trim()||policy.product.trim()||policy.premium.trim()||Object.values(policy.amounts).some(value=>value.trim())).length;
export const DEFAULT_CHART_TARGETS:Record<string,string>={"disability-0":"20000","cancer-0":"10000","heart-0":"5000","brain-0":"5000","surgery-0":"200","hospital-0":"30"};
export const REPORT_CHART_FIELDS = [
  {id:"cancer-0",label:"암 진단비",source:"일반암 진단"},
  {id:"brain-0",label:"뇌 진단비",source:"뇌혈관질환 진단"},
  {id:"heart-0",label:"심장 진단비",source:"심혈관질환 진단"},
  {id:"disability-0",label:"후유장해",source:"질병후유장해(3%)"},
  {id:"surgery-0",label:"수술비",source:"질병 수술비"},
  {id:"hospital-0",label:"입원일당",source:"질병 입원 · 1일 기준"},
] as const;
export function reportChartValues(report:CoverageReport){
  const fields=reportCoverageGroups(report).flatMap(group=>group.fields);
  const matches=(axis:string,field:CoverageField)=>{
    const label=coverageFieldLabel(report,field).replace(/\s/g,"");
    if(axis==="cancer-0")return ["cancer-0","cancer-1"].includes(field.id)||(/암/.test(label)&&/진단|일반암|고액암|소액암|유사암/.test(label)&&!/치료|수술/.test(label));
    if(axis==="brain-0")return ["brain-0","brain-1","brain-2"].includes(field.id)||(/뇌혈관|뇌출혈|뇌경색|뇌졸중/.test(label)&&!/치료|수술/.test(label));
    if(axis==="heart-0")return ["heart-0","heart-1","heart-2"].includes(field.id)||(/심혈관|허혈성심장|심근경색|심장.*진단/.test(label)&&!/치료|수술/.test(label));
    if(axis==="disability-0")return /^disability-/.test(field.id)||/후유장해/.test(label);
    if(axis==="surgery-0")return ["surgery-0","surgery-3"].includes(field.id)||(/질병수술|상해수술/.test(label)&&!/종|N대/.test(label));
    return ["hospital-0","hospital-1"].includes(field.id)||(/질병입원|상해입원/.test(label)&&!/의료비|간병|1인실/.test(label));
  };
  const conversion=(unit:string)=>unit==="억"?10000:unit==="천원"?.1:unit==="원"?.0001:unit==="만원"?1:null;
  return REPORT_CHART_FIELDS.map(axis=>{
    const target=reportNumber(report.chartTargets?.[axis.id]??DEFAULT_CHART_TARGETS[axis.id]);
    let amount:number|null=0;
    for(const field of fields.filter(field=>matches(axis.id,field))){
      if(Object.prototype.hasOwnProperty.call(report.overrides,field.id)){
        const raw=report.overrides[field.id].trim();if(!raw)continue;
        const number=reportNumber(raw);if(number===null){amount=null;break;}amount+=number;continue;
      }
      for(const policy of report.policies){
        const raw=policy.amounts[field.id]?.trim();if(!raw)continue;
        const number=reportNumber(raw),factor=conversion(policy.units?.[field.id]||report.fieldUnits?.[field.id]||"만원");
        if(number===null||factor===null){amount=null;break;}amount+=number*factor;
      }
      if(amount===null)break;
    }
    return {...axis,amount,target,percent:target&&target>0&&amount!==null?Math.round(amount/target*100):null};
  });
}
export const REPORT_SECTIONS = [
  { id: "cover", title: "표지" }, { id: "analysis", title: "보장분석표" },
  { id: "after-analysis", title: "리모델링 후 보장분석표" }, { id: "status", title: "보장현황표" },
  { id: "after-status", title: "리모델링 후 보장현황표" }, { id: "comparison", title: "전후 비교제안서" },
  { id: "summary", title: "리모델링 요약보고서" },
] as const;
export type ReportSection = typeof REPORT_SECTIONS[number]["id"] | "all";
export const REPORT_THEMES = [
  { id: "yellow", title: "#997822", titleAccent: "#c6a341", label: "노랑", primary: "#c6a341", secondary: "#34465b", soft: "#fffdf3", tint: "#fcf6df", line: "#e9dfb9" },
  { id: "orange", title: "#d97d46", titleAccent: "#f1a56f", label: "주황", primary: "#f28b45", secondary: "#34465b", soft: "#fff8f2", tint: "#ffeadb", line: "#f8d7be" },
  { id: "sky", title: "#426588", titleAccent: "#6a9bc6", label: "하늘", primary: "#6a9bc6", secondary: "#426588", soft: "#eff5fc", tint: "#edf4fb", line: "#dce5f0" },
  { id: "green", title: "#244c3b", titleAccent: "#406650", label: "초록", primary: "#365e49", secondary: "#34465b", soft: "#f5f8f4", tint: "#eaf0e7", line: "#d5dfd1" },
  { id: "gray", title: "#252525", titleAccent: "#606060", label: "블랙", primary: "#353535", secondary: "#292929", soft: "#f8f8f8", tint: "#eeeeee", line: "#dedede" },
] as const;
export type ReportTheme = typeof REPORT_THEMES[number]["id"];
export function coverageCategoryLabel(title: string) {
  return ({ "후유장해":"후유\n장해", "치매 / 간병":"치매\n간병", "입원 / 1인실":"입원\n1인실", "골절 / 화상":"골절\n화상", "실손의료비":"실손\n의료비", "배상책임":"배상\n책임" } as Record<string,string>)[title] || title.replace(/\s*\/\s*/g, "\n");
}
export function remodelingDifference(before: CoverageReport, after: CoverageReport) {
  const current = reportTotals(before), proposed = reportTotals(after);
  return { monthly: current.monthly - proposed.monthly, remaining: current.remaining - proposed.remaining };
}
export const newReportPolicy = (id: string): ReportPolicy => ({ id, insurer: "", product: "", years: "", start: "", end: "", premium: "", amounts: {} });
export function reportNumber(value: string): number | null {
  const text = value.replace(/,/g, "").trim();
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) && Number.isFinite(Number(text)) ? Number(text) : null;
}
export function amountText(value: number): string {
  if (!value) return "";
  const rounded = Math.round(value * 100) / 100;
  const billions = Math.floor(rounded / 10000), rest = Math.round((rounded % 10000) * 100) / 100;
  return billions ? `${billions}억${rest ? ` ${rest.toLocaleString("ko-KR")}만원` : ""}` : `${rounded.toLocaleString("ko-KR")}만원`;
}
export function coverageTotal(report: CoverageReport, field: CoverageField): string {
  if (Object.prototype.hasOwnProperty.call(report.overrides,field.id)) {
    const value=report.overrides[field.id].trim(),number=reportNumber(value);
    return number!==null&&!field.manual?amountText(number*(field.unit==="억"?10000:1)):value;
  }
  if (field.manual) return "";
  const fallback=report.fieldUnits?.[field.id]||field.unit||"만원";
  const total=report.policies.reduce((sum,policy)=>{const unit=policy.units?.[field.id]||fallback;return sum+(reportNumber(policy.amounts[field.id]||"")||0)*(unit==="억"?10000:unit==="천원"?.1:1);},0);
  return amountText(total);
}
export function policyAmount(policy: ReportPolicy, field: CoverageField, unitOverride?: string): string {
  unitOverride=policy.units?.[field.id]??unitOverride;
  const value = policy.amounts[field.id] || "";
  if (field.manual) return value || "";
  if(unitOverride&&unitOverride!=="만원"&&unitOverride!=="억")return value?`${formatCoverageNumber(value)}${unitOverride}`:"";
  return amountText((reportNumber(value) || 0) * ((unitOverride||field.unit) === "억" ? 10000 : 1));
}
export function paymentValues(policy: ReportPolicy, today: string) {
  const years = reportNumber(policy.years), premium = reportNumber(policy.premium) || 0;
  if (years === null || !validReportDate(policy.start) || !validReportDate(today)) return { remaining: 0, paid: 0 };
  const [y, m, d] = today.split("-").map(Number), [sy, sm, sd] = policy.start.split("-").map(Number);
  const elapsed = Math.max(0, (y - sy) * 12 + m - sm - (d < sd ? 1 : 0));
  const months = Math.round(years * 12), completed = Math.min(months, elapsed);
  return { remaining: (months - completed) * premium, paid: completed * premium };
}
export function validReportDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function reportDateInput(value: string): string {
  const text = value.replace(/\D/g, "").slice(0, 8);
  return text.length > 6 ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6)}` : text.length > 4 ? `${text.slice(0, 4)}-${text.slice(4)}` : text;
}
export function reportTotals(report: CoverageReport) {
  return report.policies.reduce((total, policy) => {
    const payment = paymentValues(policy, report.date);
    return { monthly: total.monthly + (reportNumber(policy.premium) || 0), remaining: total.remaining + payment.remaining, paid: total.paid + payment.paid };
  }, { monthly: 0, remaining: 0, paid: 0 });
}
export function detailPages(policies: ReportPolicy[]) {
  return Array.from({ length: Math.ceil(policies.length / 4) }, (_, i) => policies.slice(i * 4, i * 4 + 4));
}

export function formatCoverageNumber(value:string):string{
 const [whole,...fraction]=value.replace(/,/g,'').split('.');
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction.length?'.'+fraction.join(''):'');
}

export const REPORT_DESIGNS=[{id:'simple',label:'심플'},{id:'diagonal',label:'사선'},{id:'grid',label:'격자'},{id:'dots',label:'도트'},{id:'frame',label:'프레임'}] as const;
export type ReportDesign=typeof REPORT_DESIGNS[number]['id'];
export function reportDesignStyle(design:ReportDesign,accent:string,soft:string,line:string):Record<string,string>{
 const base=`linear-gradient(155deg,${soft},#fff 45%)`,ink=accent+'14';
 const patterns={simple:[base,'auto'],diagonal:[`repeating-linear-gradient(135deg,transparent 0 32px,${ink} 32px 33px),${base}`,'auto'],grid:[`linear-gradient(${ink} 1px,transparent 1px),linear-gradient(90deg,${ink} 1px,transparent 1px),${base}`,'28px 28px,28px 28px,auto'],dots:[`radial-gradient(${ink} 1.2px,transparent 1.2px),${base}`,'22px 22px,auto'],frame:[base,'auto']};
 return {'--cr-cover-background':patterns[design][0],'--cr-cover-background-size':patterns[design][1],'--cr-cover-frame':design==='frame'?'1px solid '+line:'0 solid transparent'};
}
