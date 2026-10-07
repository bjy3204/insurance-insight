"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Phone, ExternalLink, ChevronRight } from "lucide-react";
import { cachedCompanies, loadCompanies, warmCompanyImages } from "../companyCache";
import { JobHeaderTools, JobDetailFooter } from "../JobDetailControls";
import styles from "../Job.module.css";
type Company = {id:string;company:string;organization:string;description:string;region:string;manager:string;phone:string;website:string;memo:string;image:string[]};
export default function JobDetail() {
 const {id}=useParams<{id:string}>();const [company,setCompany]=useState<Company|null>(null);const [others,setOthers]=useState<Company[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 useEffect(()=>{let active=true;const cached=cachedCompanies()?.find(c=>c.id===id)||null;setCompany(cached);setOthers((cachedCompanies()||[]).filter(c=>c.id!==id));setLoading(!cached);setError(false);loadCompanies().then(data=>{if(active){setCompany(data.find(c=>c.id===id)||null);setOthers(data.filter(c=>c.id!==id));setLoading(false)}}).catch(()=>{if(active){setError(true);setLoading(false)}});return()=>{active=false}},[id]);
 const website=company?.website && /^https?:\/\//i.test(company.website)?company.website:null;
 const phone=company?.phone && /^[+\d\s()-]+$/.test(company.phone)?company.phone:null;
 return <main className={styles.detailPage}><header data-page-header="true" className="bg-white border-b border-gray-200"><div className="max-w-7xl mx-auto px-6 py-6"><div className="relative flex items-center justify-center"><Link data-header-control="true" href="/job" aria-label="채용공고 목록으로" className="absolute left-0 w-11 h-11 flex items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50"><ArrowLeft size={20}/></Link><div className="flex items-center justify-center gap-2"><Briefcase size={28} className="text-blue-600"/><h1 className="font-black text-2xl text-gray-900">채용공고</h1></div><JobHeaderTools /></div></div></header>
 {loading?<p className={styles.loading} role="status">공고를 불러오는 중입니다</p>:!company?<div className="text-center py-24"><p>{error?"공고를 불러오지 못했습니다":"게시 중인 공고를 찾을 수 없습니다"}</p><Link href="/job" className="inline-block mt-5 text-blue-600">목록으로 돌아가기</Link></div>:<><div data-page-content="true" className={styles.detail}>
 {others.length>0&&<aside className={styles.related} aria-label="다른 채용공고"><div className={styles.relatedHeading}><h2>다른 공고 보기</h2><Link href="/job">전체 공고 <ChevronRight size={15}/></Link></div><div className={styles.relatedGrid}>{others.map(item=><Link key={item.id} href={`/job/${item.id}`} className={styles.relatedCard} onPointerEnter={()=>warmCompanyImages(item)} onFocus={()=>warmCompanyImages(item)}><div className={styles.relatedImage}>{item.image[0]?<img src={item.image[0]} alt="" loading="lazy" decoding="async"/>:<Briefcase size={28}/>}</div><div className={styles.relatedBody}>{item.region&&<p className={styles.relatedRegion}>{item.region}</p>}<span>{item.company}</span><h3>{item.organization}</h3></div></Link>)}</div></aside>}
 <div className={`${styles.photoFrame} ${!company.image.length ? styles.emptyPhotoFrame : ""}`}><section className={styles.photos} aria-label="조직 소개 사진" tabIndex={0}>{company.image.length?company.image.map((src,i)=><img key={i} src={src} alt={`${company.organization} 소개 사진 ${i+1}`} loading={i<2?"eager":"lazy"} fetchPriority={i===0?"high":"auto"} decoding="async"/>):<div className={styles.emptyPhoto}><Briefcase size={56} strokeWidth={1}/><span>{company.company}</span></div>}</section></div>
 <article className={styles.story} tabIndex={0} aria-label="채용공고 상세">
 <div className={styles.storyContent}><div className={styles.storyHeading}><p className={styles.company}>{company.company}</p><h1>{company.organization}</h1>{company.region&&<span className={styles.detailRegion}>{company.region}</span>}</div>
 <section className={styles.storySection}><h2>조직 소개</h2><p>{company.description}</p></section>
 {company.memo&&<section className={styles.storySection}><h2>보험나무 메모</h2><p>{company.memo}</p></section>}
 {company.manager&&<section className={styles.storySection}><h2>채용 문의</h2><p className={styles.manager}>담당자 · {company.manager}</p></section>}
 </div>
 {(phone||website)&&<div className={styles.contactActions}>
 {phone&&<a href={`tel:${phone.replace(/[^+0-9]/g,"")}`} className={styles.contactPrimary}><Phone size={17}/>전화 문의</a>}
 {website&&<a href={website} target="_blank" rel="noopener noreferrer" className={styles.contactSecondary}>홈페이지 보기 <ExternalLink size={16}/></a>}
 </div>}
 </article></div>

 </>}

 <JobDetailFooter />
 </main>
}
