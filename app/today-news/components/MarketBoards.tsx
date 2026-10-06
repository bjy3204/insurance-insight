import { TrendingUp, ChartNoAxesCombined } from 'lucide-react';
import styles from './MarketBoards.module.css';
type Item={label:string;value:number;change:number;direction:'up'|'down'|'same'};
const visuals:Record<string,{name:string;image?:string;icon?:'index'|'growth';link:string}>= {
 USD:{name:'USD',image:'/flags/USD.png',link:'https://m.stock.naver.com/marketindex/exchange/FX_USDKRW'},
 JPY:{name:'JPY',image:'/flags/JPY.png',link:'https://m.stock.naver.com/marketindex/exchange/FX_JPYKRW'},
 EUR:{name:'EUR',image:'/flags/EUR.png',link:'https://m.stock.naver.com/marketindex/exchange/FX_EURKRW'},
 CNY:{name:'CNY',image:'/flags/CNY.png',link:'https://m.stock.naver.com/marketindex/exchange/FX_CNYKRW'},
 코스피:{name:'코스피',icon:'growth',link:'https://m.stock.naver.com/domestic/index/KOSPI/total'},
 코스닥:{name:'코스닥',icon:'index',link:'https://m.stock.naver.com/domestic/index/KOSDAQ/total'},
 '국내 금 (원/g)':{name:'금 (원/g)',image:'/images/market/gold.svg',link:'https://m.stock.naver.com/marketindex/metals/M04020000'},
 '은 (USD/OZS)':{name:'은 (oz)',image:'/images/market/silver.svg',link:'https://m.stock.naver.com/marketindex/metals/SIcv1'},
};
function Tile({item,currency}:{item:Item;currency:boolean}) {
 const visual=visuals[item.label];if(!visual)return null;
 const gold=item.label==='국내 금 (원/g)';
 const valid=Number.isFinite(item.value)&&item.value>0;
 const direction=item.change===0?'same':item.direction;
 const decimals=gold?0:2;
 return <a href={visual.link} target="_blank" rel="noopener noreferrer" className={styles.tile} aria-label={`${visual.name} 상세 지표 새 탭`}>
  <div className={styles.label}>{visual.image?<img src={visual.image} alt="" className={currency?styles.flag:styles.metal}/>:visual.icon==='growth'?<TrendingUp className={styles.indexIcon}/>:<ChartNoAxesCombined className={styles.indexIcon}/>}<span title={item.label==='JPY'?'100엔 기준':undefined}>{visual.name}</span></div>
  <strong>{valid?item.value.toLocaleString('ko-KR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):'—'}{valid&&(currency||gold)&&<span className={styles.unit}>원</span>}</strong>
  <span className={`${styles.change} ${styles[direction]}`}>{valid?`${direction==='up'?'▲ ':direction==='down'?'▼ ':''}${Math.abs(item.change).toLocaleString('ko-KR',{maximumFractionDigits:2,minimumFractionDigits:gold?0:2})}`:'조회 대기'}</span>
 </a>;
}
export default function MarketBoards({exchangeItems,marketItems}:{exchangeItems:Item[];marketItems:Item[]}) {
 return <>{[{title:'오늘의 환율',items:exchangeItems,currency:true},{title:'오늘의 시장지표',items:marketItems,currency:false}].map(board=><section key={board.title} className={styles.section}><div className={styles.heading}><h2>{board.title}</h2><span>네이버 증권 기준</span></div><div className={styles.grid}>{board.items.map(item=><Tile key={item.label} item={item} currency={board.currency}/>)}{!board.items.length&&<p className={styles.empty}>정보를 불러오는 중이거나 현재 조회할 수 없습니다.</p>}</div></section>)}</>;
}
