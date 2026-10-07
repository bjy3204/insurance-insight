"use client";
export type Company = {id:string;company:string;organization:string;description:string;region:string;manager:string;phone:string;website:string;memo:string;image:string[]};
const KEY = "job-companies-v2";
const TTL = 60_000;
let cached: {data:Company[];at:number}|null = null;
let pending: Promise<Company[]>|null = null;
export function cachedCompanies():Company[]|null {
 if (!cached && typeof window !== "undefined") {try {const value=JSON.parse(localStorage.getItem(KEY)||"null");if(value && Array.isArray(value.data) && typeof value.at==="number")cached=value;}catch {}}
 return cached && Date.now()-cached.at<24*60*60_000 ? cached.data : null;
}
export function loadCompanies():Promise<Company[]> {
 const data=cachedCompanies();if(data && cached && Date.now()-cached.at<TTL)return Promise.resolve(data);
 if(pending)return pending;
 pending=fetch("/api/company").then(async response=>{if(!response.ok)throw new Error("공고를 불러오지 못했습니다");const data=await response.json();if(!Array.isArray(data))throw new Error("잘못된 공고 응답");cached={data,at:Date.now()};try{localStorage.setItem(KEY,JSON.stringify(cached));}catch{}return data as Company[];}).finally(()=>{pending=null;});
 return pending;
}
const warmed=new Set<string>();
export function warmCompanyImages(company:Company) {
 for(const src of company.image.slice(0,2)){if(warmed.has(src))continue;warmed.add(src);const image=new window.Image();image.src=src;}
}
