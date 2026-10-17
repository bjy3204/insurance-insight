export const DISCLOSURE_ITEMS = [
  { id:"recent-care", question:"최근 3개월 이내에 의사로부터 진찰 또는 검사(건강검진 포함)를 통하여\n질병확정진단, 질병의심소견, 치료, 입원, 수술(제왕절개 포함), 투약을 받은 사실이 있습니까?", options:["질병확정진단", "질병의심소견", "치료", "입원", "수술(제왕절개 포함)", "투약"] },
  { id:"medicines", question:"최근 3개월 이내에 마약을 사용하거나\n혈압강하제, 신경안정제, 수면제, 각성제(흥분제), 진통제 등 약물을 상시 복용한 사실이 있습니까?", options:[] },
  { id:"retest", question:"최근 1년 이내에 의사로부터 진찰 또는 검사를 받고\n이를 통하여 추가검사(재검사)를 받은 사실이 있습니까?", options:[] },
  { id:"past-care", question:"최근 5년 이내에 의사로부터 진찰 또는 검사를 통하여\n입원, 수술(제왕절개 포함), 계속하여 7일 이상 치료, 계속하여 30일 이상 투약을 받은 사실이 있습니까?", options:["입원", "수술(제왕절개 포함)", "계속하여 7일 이상 치료", "계속하여 30일 이상 투약"] },
] as const;
export type DisclosureRow = { id:string; question:string; answer:"" | "yes" | "no"; selected:string[]; details:string };
export function emptyDisclosure(): DisclosureRow[] {
  return DISCLOSURE_ITEMS.map(item=>({id:item.id,question:item.question,answer:"",selected:[],details:""}));
}
export function parseDisclosure(serialized: string): DisclosureRow[] {
  const value = JSON.parse(serialized);
  if(value.memo!==undefined&&(typeof value.memo!=="string"||value.memo.length>12000))throw new Error("알릴의무 메모를 확인해 주세요.");
  if (value?.version !== 1 || !Array.isArray(value.rows) || value.rows.length !== DISCLOSURE_ITEMS.length) throw new Error("알릴의무 내용을 확인해 주세요.");
  return DISCLOSURE_ITEMS.map(item => {
    const matches = value.rows.filter((row: unknown) => row && typeof row === "object" && (row as {id?:unknown}).id === item.id);
    const row = matches[0];
    if (matches.length !== 1 || typeof row.question !== "string" || !row.question.trim() || row.question.length > 2000 || typeof row.details !== "string" || row.details.length > 6000 || !["", "yes", "no"].includes(row.answer) || !Array.isArray(row.selected) || row.selected.some((option: unknown) => typeof option !== "string" || !(item.options as readonly string[]).includes(option)) || new Set(row.selected).size !== row.selected.length || row.answer !== "yes" && row.selected.length) throw new Error("알릴의무 내용을 확인해 주세요.");
    return { id:item.id, question:row.question.trim(), answer:row.answer, selected:[...row.selected], details:row.details.trim() };
  });
}
export function disclosureMemo(serialized?:string):string {
  if(!serialized)return "";
  const value=JSON.parse(serialized);
  if(value.memo!==undefined&&(typeof value.memo!=="string"||value.memo.length>12000))throw new Error("알릴의무 메모를 확인해 주세요.");
  return value.memo||"";
}
export type MedicalHistoryRow={date:string;name:string;detail:string;hospital:string;note:string};
export type MedicalHistories={hospitalizations:MedicalHistoryRow[];surgeries:MedicalHistoryRow[]};
export const emptyMedicalHistoryRow=():MedicalHistoryRow=>({date:"",name:"",detail:"",hospital:"",note:""});
export const emptyMedicalHistories=():MedicalHistories=>({hospitalizations:Array.from({length:5},emptyMedicalHistoryRow),surgeries:Array.from({length:5},emptyMedicalHistoryRow)});
export function parseMedicalHistories(serialized?:string):MedicalHistories{
  if(!serialized)return emptyMedicalHistories();
  const value=JSON.parse(serialized),result=emptyMedicalHistories();
  for(const key of ["hospitalizations","surgeries"] as const){
    if(value[key]===undefined)continue;
    if(!Array.isArray(value[key])||value[key].length>100)throw new Error("입원·수술 이력을 확인해 주세요.");
    result[key]=value[key].map((row:MedicalHistoryRow)=>{
      if(!row||typeof row!=="object")throw new Error("입원·수술 이력을 확인해 주세요.");
      const next=emptyMedicalHistoryRow();
      for(const field of Object.keys(next) as (keyof MedicalHistoryRow)[]){
        if(typeof row[field]!=="string"||row[field].length>1000)throw new Error("입원·수술 이력을 확인해 주세요.");
        next[field]=row[field];
      }
      return next;
    });
    while(result[key].length<5)result[key].push(emptyMedicalHistoryRow());
  }
  return result;
}
export const serializeDisclosure = (rows: readonly DisclosureRow[], memo="",histories?:MedicalHistories) => JSON.stringify({version:1,rows,memo,...histories});
