"use client";
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {Search,Star,ArrowLeft,ArrowUpRight,Calculator,FileText,QrCode,BookOpen,Newspaper,LayoutGrid,ImageIcon,type LucideIcon} from 'lucide-react';
import ClearableSearchInput from '@/app/components/ClearableSearchInput';
import {useAuth} from '@/app/components/AuthProvider';
import {useSharedHomeController} from '@/app/features/home/HomeControllerProvider';
import {insuranceLinks} from './InsuranceLinks';
import {cardNewsLinks} from './CardNewsLinks';
import styles from './WorkTools.module.css';
import type {Kind as PdfKind} from './PdfTools';
import type {Kind as ImageKind} from './ImageTools';
import SimpleMetrics from './SimpleMetrics';
import CardStudio from './CardStudio';
import PdfTools from './PdfTools';
import ImageTools from './ImageTools';
import NoticeMaker from './NoticeMaker';
const QrGenerator=dynamic(()=>import('./QrGenerator'),{loading:()=> <p>QR 도구를 불러오고 있습니다</p>});
const PdfUnlock=dynamic(()=>import('./PdfUnlock'));
const Disease=dynamic(()=>import('@/app/claim-docs/disease-code-popup'));
const Hospital=dynamic(()=>import('@/app/claim-docs/hospital-info'));
const Nps=dynamic(()=>import('@/app/components/NpsTableModal'));
const Life=dynamic(()=>import('@/app/features/home/components/LifeExpectancyDialog'));
const Bank=dynamic(()=>import('@/app/features/home/components/BankRatesDialog'));
const Press=dynamic(()=>import('@/app/features/home/components/PressDialog'));
const Basic=dynamic(()=>import('@/app/components/Calculator'));
const Currency=dynamic(()=>import('@/app/components/CurrencyConverter'));
type Category='계산기'|'의료·금융 조회'|'PDF 도구'|'QR·디자인'|'이미지·문서'|'보험 참고 사이트'|'카드뉴스';
type Tool={id:string;title:string;description:string;category:Category;href?:string;external?:boolean;keywords?:string};
const categories:{title:Category;icon:LucideIcon}[]=[{title:'계산기',icon:Calculator},{title:'의료·금융 조회',icon:Search},{title:'PDF 도구',icon:FileText},{title:'QR·디자인',icon:QrCode},{title:'이미지·문서',icon:ImageIcon},{title:'보험 참고 사이트',icon:BookOpen},{title:'카드뉴스',icon:Newspaper}];
const tools:Tool[]=[
{id:'bmi',title:'BMI 계산기',description:'키와 체중으로 BMI 계산',category:'계산기'},
{id:'care-cost',title:'간병비 누적 계산기',description:'하루 비용과 일수로 총 간병비 계산',category:'계산기'},
{id:'qr-card',title:'QR 명함 만들기',description:'사이트 링크와 QR을 넣은 모바일 명함',category:'QR·디자인'},
{id:'business-card',title:'명함 만들기',description:'세 가지 디자인으로 PNG·인쇄용 PDF 저장',category:'QR·디자인'},
{id:'profile-card',title:'프로필 카드 만들기',description:'사진·소개·연락처를 한 장으로 공유',category:'QR·디자인'},
{id:'pdf-encrypt',title:'PDF 암호 설정',description:'PDF 열기 비밀번호 설정',category:'PDF 도구'},
{id:'pdf-extract',title:'PDF 페이지 추출',description:'필요한 페이지만 골라 새 PDF 저장',category:'PDF 도구'},
{id:'pdf-delete',title:'PDF 페이지 삭제',description:'선택한 페이지를 제외한 PDF 저장',category:'PDF 도구'},
{id:'pdf-images',title:'PDF → JPG·PNG',description:'각 페이지를 이미지 ZIP으로 변환',category:'PDF 도구'},
{id:'images-pdf',title:'여러 이미지 PDF 합치기',description:'선택 순서대로 A4 PDF 만들기',category:'PDF 도구'},
{id:'image-merge',title:'여러 이미지 합치기',description:'이미지를 순서대로 세로로 연결',category:'이미지·문서'},
{id:'image-crop',title:'이미지 자르기',description:'드래그한 영역만 잘라 PNG 저장',category:'이미지·문서'},
{id:'image-mosaic',title:'이미지 모자이크',description:'선택 영역에 모자이크 적용',category:'이미지·문서'},
{id:'image-blur',title:'이미지 블러',description:'선택 영역을 흐리게 처리',category:'이미지·문서'},
{id:'image-watermark',title:'이미지 워터마크',description:'문구·위치·불투명도 설정',category:'이미지·문서'},
{id:'privacy-mask',title:'개인정보 마스킹',description:'이미지에서 직접 고른 영역을 검정 처리',category:'이미지·문서'},
{id:'notice-maker',title:'고객 안내문 생성',description:'직접 쓴 문구를 A4 안내문으로 저장',category:'이미지·문서'},

{id:'qr',title:'QR코드 생성기',description:'색상·점 모양·하트를 꾸미고 PNG·SVG 저장',category:'QR·디자인',keywords:'큐알 링크 명함 하트'},
...(process.env.NODE_ENV==='development'?[{id:'pdf-unlock',title:'PDF 암호 해제',description:'비밀번호를 입력해 암호 없는 사본 저장',category:'PDF 도구' as Category,keywords:'비밀번호 잠금 해제'}]:[]),
{id:'medical-calculator',title:'실비 계산기',description:'가입 세대별 실손보험금 계산',category:'계산기',href:'/calculator'},
{id:'money-value',title:'화폐가치 계산기',description:'시간에 따른 화폐가치 비교',category:'계산기',href:'/money-value'},
{id:'saving',title:'예금·적금 계산기',description:'예상 이자와 만기 수령액 계산',category:'계산기',href:'/saving-calculator'},
{id:'pension',title:'연금 계산기',description:'노후 연금과 준비 금액 확인',category:'계산기',href:'/pension-calculator'},
{id:'basic',title:'계산기',description:'사칙연산과 계산 기록',category:'계산기'},
{id:'currency',title:'환율 변환기',description:'통화별 환율을 적용해 금액 변환',category:'계산기'},
{id:'life',title:'기대수명 계산기',description:'기존 기대수명 자료로 확인',category:'계산기'},
{id:'disease',title:'질병코드 조회',description:'상병코드 또는 질병명으로 검색',category:'의료·금융 조회',keywords:'KCD 상병 분류'},
{id:'hospital',title:'병원정보 검색',description:'지역·진료과별 병원 정보 조회',category:'의료·금융 조회'},
{id:'nps',title:'국민연금표',description:'노령·장애·유족연금 예상월액표',category:'의료·금융 조회'},
{id:'bank',title:'예금 금리 비교',description:'주요 은행의 예금 금리 비교',category:'의료·금융 조회'},
{id:'press',title:'보도자료',description:'기존 금융·보험 보도자료 모아보기',category:'의료·금융 조회'},
...insuranceLinks.map((item,index)=>({id:'insurance-'+index,title:item.title,description:item.desc,category:'보험 참고 사이트' as Category,href:item.url,external:true})),
...cardNewsLinks.map((item,index)=>({id:'cardnews-'+index,title:item.title,description:item.desc,category:'카드뉴스' as Category,href:item.url,external:true})),
];
export default function WorkTools(){
 const {authUser,authLoading}=useAuth(),controller=useSharedHomeController();
 const [query,setQuery]=useState(''),[category,setCategory]=useState<Category|'전체'>('전체'),[selected,setSelected]=useState(''),[favorites,setFavorites]=useState<string[]>([]),[loadedKey,setLoadedKey]=useState('');
 const key='work-tool-favorites:v1:'+(authUser?.id||'guest');
 useEffect(()=>{if(authLoading)return;setFavorites([]);try{const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))setFavorites([...new Set(stored.filter((id:unknown)=>typeof id==='string'&&tools.some(tool=>tool.id===id)))].slice(0,40) as string[]);}catch{}setLoadedKey(key);},[key,authLoading]);
 useEffect(()=>{if(loadedKey!==key||authLoading)return;try{localStorage.setItem(key,JSON.stringify(favorites));}catch{}},[favorites,key,loadedKey,authLoading]);
 useEffect(()=>{const sync=()=>{const id=new URL(window.location.href).searchParams.get('tool')||'';setSelected(tools.some(tool=>tool.id===id&&!tool.href)?id:'');};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 function open(id:string){setSelected(id);const url=new URL(window.location.href);if(id)url.searchParams.set('tool',id);else url.searchParams.delete('tool');window.history.pushState({},'',url.pathname+url.search);window.scrollTo({top:0,behavior:'smooth'});}
 function toggle(id:string){setFavorites(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);}
 const active=tools.find(tool=>tool.id===selected),term=query.trim().toLocaleLowerCase();
 const filtered=tools.filter(tool=>(category==='전체'||tool.category===category)&&(!term||`${tool.title} ${tool.description} ${tool.keywords||''} ${tool.category}`.toLocaleLowerCase().includes(term)));
 function card(tool:Tool,compact=false){const Icon=categories.find(item=>item.title===tool.category)!.icon;const body=<><Icon size={21} aria-hidden="true"/><span><strong>{tool.title}</strong>{!compact&&<small>{tool.description}</small>}</span>{tool.external&&<ArrowUpRight size={15} className={styles.external} aria-hidden="true"/>}</>;
 return <article key={tool.id} className={`${styles.card} ${compact?styles.compact:''}`}>{tool.href?(tool.external?<a href={tool.href} target="_blank" rel="noopener noreferrer">{body}</a>:<Link href={tool.href}>{body}</Link>):<button type="button" className={styles.open} onClick={()=>open(tool.id)}>{body}</button>}<button type="button" className={styles.favorite} aria-label={`${tool.title} 즐겨찾기 ${favorites.includes(tool.id)?'해제':'등록'}`} title={favorites.includes(tool.id)?'즐겨찾기 해제':'즐겨찾기 등록'} aria-pressed={favorites.includes(tool.id)} onClick={()=>toggle(tool.id)}><Star size={17} fill={favorites.includes(tool.id)?'currentColor':'none'}/></button></article>;}
 const content=active&&(active.id==='bmi'||active.id==='care-cost')?<SimpleMetrics key={active.id} kind={active.id}/>:active&&['qr-card','business-card','profile-card'].includes(active.id)?<CardStudio key={active.id} kind={active.id as 'qr-card'|'business-card'|'profile-card'}/>:active&&['pdf-encrypt','pdf-extract','pdf-delete','pdf-images','images-pdf'].includes(active.id)?<PdfTools key={active.id} kind={active.id as PdfKind}/>:active&&['image-merge','image-crop','image-mosaic','image-blur','image-watermark','privacy-mask'].includes(active.id)?<ImageTools key={active.id} kind={active.id as ImageKind}/>:active?.id==='notice-maker'?<NoticeMaker/>:active?.id==='qr'?<QrGenerator/>:active?.id==='pdf-unlock'?<PdfUnlock/>:active?.id==='disease'?<Disease open embedded onClose={()=>open('')}/>:active?.id==='hospital'?<Hospital open embedded onClose={()=>open('')}/>:active?.id==='nps'?<Nps embedded onClose={()=>open('')}/>:active?.id==='life'?<Life embedded controller={{...controller,lifeOpen:true}}/>:active?.id==='bank'?<Bank embedded controller={{...controller,bankRateOpen:true}}/>:active?.id==='press'?<Press embedded controller={{...controller,pressOpen:true}}/>:active?.id==='basic'?<div className={styles.calculator}><Basic embedded/></div>:active?.id==='currency'?<div className={styles.calculator}><Currency embedded/></div>:null;
 return <div className={styles.workspace}><div className={styles.search}><Search size={20}/><ClearableSearchInput aria-label="업무도구 검색" placeholder="필요한 도구나 사이트를 검색하세요" value={query} onChange={event=>{setQuery(event.target.value);if(selected)open('');}} onClear={()=>setQuery('')} data-borderless-field="true"/></div>
 {active?<><div className={styles.detailHeading}><button type="button" onClick={()=>open('')}><ArrowLeft size={18}/>도구 목록</button><h1>{active.title}</h1><button className={styles.favorite} type="button" aria-label="현재 도구 즐겨찾기" title="즐겨찾기" aria-pressed={favorites.includes(active.id)} onClick={()=>toggle(active.id)}><Star size={19} fill={favorites.includes(active.id)?'currentColor':'none'}/></button></div><div className={styles.detail}>{content}</div></>:<><section className={styles.favorites}><div className={styles.sectionHeading}><h2>자주 사용하는 도구</h2><span>별 아이콘으로 등록 · 이 브라우저에 저장</span></div>{favorites.length?<div className={styles.favoriteGrid}>{favorites.map(id=>tools.find(tool=>tool.id===id)).filter((tool):tool is Tool=>!!tool).map(tool=>card(tool,true))}</div>:<div className={styles.emptyFavorites}><Star size={18}/><span>자주 쓰는 도구의 별 아이콘을 눌러 여기에 모아두세요</span></div>}</section>
 <div className={styles.directory}><nav className={styles.categories} aria-label="업무도구 분류"><button type="button" aria-pressed={category==='전체'} onClick={()=>setCategory('전체')}><LayoutGrid size={18}/>전체 도구<span>{tools.length}</span></button>{categories.filter(item=>tools.some(tool=>tool.category===item.title)).map(item=><button type="button" key={item.title} aria-pressed={category===item.title} onClick={()=>setCategory(item.title)}><item.icon size={18}/>{item.title}<span>{tools.filter(tool=>tool.category===item.title).length}</span></button>)}</nav><section className={styles.results}><div className={styles.sectionHeading}><h2>{term?'검색 결과':category==='전체'?'전체 도구':category}</h2><span>{filtered.length}개</span></div>{filtered.length?<div className={styles.grid}>{filtered.map(tool=>card(tool))}</div>:<p className={styles.empty}>검색 결과가 없습니다 다른 검색어를 입력해 주세요</p>}</section></div></>}
 </div>;
}
