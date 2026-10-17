"use client";
import Link from 'next/link';
import {LockKeyhole,Home} from 'lucide-react';
import styles from '@/app/notion-crm/IdleLock.module.css';
export default function AccessRestrictedPage({paymentError=false}:{paymentError?:boolean}){
 return <main className={styles.page}><Link className={styles.home} href="/" aria-label="홈"><Home size={24}/></Link><div className={styles.content}><LockKeyhole size={40} aria-hidden="true"/><h1>{paymentError?'결제오류':'접근 제한'}</h1><p>{paymentError?<>정기결제에 오류가 발생했습니다<br/>결제 상태를 확인하거나 관리자에게 문의해 주세요</>:<>선택한 메뉴는 승인된 회원만<br/>이용 가능합니다</>}</p><Link className={styles.primaryLink} href="/">메인으로 돌아가기</Link></div></main>;
}
