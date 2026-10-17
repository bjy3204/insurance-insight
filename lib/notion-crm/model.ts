export const sourceNames = { customers: "고객 관리", contracts: "계약 관리", cars: "자동차보험", cards: "카드수납", events: "일정·상담" } as const;
export type Source = keyof typeof sourceNames;
export type Field = { name:string; label?:string; type:"text"|"date"|"number"|"checkbox"|"relation"|"select"|"email"|"tel"; options?:string[]; internal?:boolean };
export const fields:Record<Source,Field[]> = {
 customers: [
  {name:"이름",type:"text"},{name:"생년월일",type:"date"},{name:"주민번호",label:"주민번호",type:"text"},
  {name:"유입경로",type:"select",options:["소개","기존고객","온라인","기타"]},{name:"연락처",type:"tel"},{name:"직업",type:"text"},{name:"E-Mail",type:"email"},{name:"주소",type:"text"},{name:"메모",type:"text"},
  {name:"예금주",type:"text"},{name:"예금주 생년월일",type:"text"},{name:"은행",type:"text"},{name:"계좌번호",type:"text"},
  {name:"실손 보험사",type:"text"},{name:"실손 가입일",type:"date"},{name:"실손 세대",type:"text"},{name:"실손 만기일",type:"date"},
  ...["TA진행","상담완료","보장분석","증권전달","소개요청","안부연락"].map(name=>({name,type:"checkbox" as const})),{name:"알릴의무",type:"text"},... ["체크리스트 데이터","알릴의무 데이터","상담일지 데이터"].map(name=>({name,type:"text" as const,internal:true})),{name:"회사",type:"text"}
 ],
 contracts:[{name:"상품명",type:"text"},{name:"고객",type:"relation"},{name:"계약일",type:"date"},{name:"계약자",type:"text"},{name:"계약자 생년월일",type:"text"},{name:"피보험자",type:"text"},{name:"피보험자 생년월일",type:"text"},{name:"보험사",type:"text"},{name:"보험료",type:"number"},{name:"만기",type:"date"},{name:"면책기간(개월)",type:"number"},{name:"감액기간(개월)",type:"number"},{name:"메모",type:"text"}],
 cars:[{name:"차량번호",type:"text"},{name:"고객",type:"relation"},{name:"차종",type:"text"},{name:"갱신일",type:"date"},{name:"보험사",type:"text"},{name:"운전자지정",type:"text"},{name:"할인",type:"text"},{name:"메모",type:"text"}],
 cards:[{name:"수납명",type:"text"},{name:"고객",type:"relation"},{name:"결제일",type:"number"},{name:"명의자",type:"text"},{name:"보험사",type:"text"},{name:"카드사",type:"text"},{name:"카드번호",type:"text"},{name:"유효기간",type:"text"},{name:"메모",type:"text"}],
 events:[{name:"제목",type:"text"},{name:"고객",type:"relation"},{name:"일정",type:"date"},{name:"분류",type:"select",options:["개인","상담","기타"]},{name:"완료",type:"checkbox"},{name:"장소",type:"text"},{name:"상담내용",type:"text"},{name:"다음 연락일",type:"date"},{name:"메모",type:"text"}]
};
export const titleNames:Record<Source,string>={customers:"이름",contracts:"상품명",cars:"차량번호",cards:"수납명",events:"제목"};
export type CrmValue=string|number|boolean|string[];
export type CrmRow={id:string;created?:string;updated?:string;edited:string;values:Record<string,CrmValue>};
export type CrmData=Record<Source,CrmRow[]>;
export const emptyData=():CrmData=>({customers:[],contracts:[],cars:[],cards:[],events:[]});
export function isSource(value:unknown):value is Source{return typeof value==="string"&&Object.hasOwn(sourceNames,value);}
export function notionId(value:string){const match=value.match(/(?:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|[a-f0-9]{32})(?=[?/#]|$)/i);if(!match)throw Error("노션 페이지 링크를 확인해 주세요.");return match[0].replace(/-/g,"");}
