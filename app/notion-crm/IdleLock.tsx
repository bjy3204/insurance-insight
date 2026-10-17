"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {LockKeyhole,Home} from 'lucide-react';
import {useAuth} from '@/app/components/AuthProvider';
import {supabase} from '@/lib/supabase';
import styles from './IdleLock.module.css';
const IDLE=20*60*1000;
async function sessionRequest(action:string,password?:string,identity?:{email:string;userId:string}){
 let {data:{session}}=await supabase.auth.getSession();
 const send=()=>fetch('/api/my-page/session',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session?.access_token},body:JSON.stringify({action,...(password?{password}:{}),...identity})});
 let response=await send();
 if(response.status===401&&action!=='unlock'){const refreshed=await supabase.auth.refreshSession();if(!refreshed.error&&refreshed.data.session){session=refreshed.data.session;response=await send();}}
 const result=await response.json();return {ok:response.ok,status:response.status,...result};
}

export default function IdleLock({children}:{children:ReactNode}){
 const auth=useAuth();const enabled=!!auth.authUser&&(auth.authStatus==='approved'||auth.authRole==='admin');
 const [state,setState]=useState<'checking'|'open'|'locked'>('checking');const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [resetMessage,setResetMessage]=useState(''),[resetBusy,setResetBusy]=useState(false),[resetSent,setResetSent]=useState(false);
 const last=useRef(0),sent=useRef(0),heartbeat=useRef(false),generation=useRef(0);
 const key='crm-activity:'+auth.authUser?.id;
 useEffect(()=>{const run=++generation.current;if(!auth.authUser?.id)return;setState('checking');setPassword('');setError('');let locked=false;let stopped=false;
 const shared=()=>{try{return Math.max(last.current,Number(localStorage.getItem(key))||0);}catch{return last.current;}};
 const record=(time:number)=>{last.current=time;try{localStorage.setItem(key,String(time));}catch{}};
 const lock=()=>{if(locked||stopped)return;locked=true;setState('locked');setPassword('');setError('');void sessionRequest('lock');};
 const ping=async()=>{if(locked||heartbeat.current||stopped)return;heartbeat.current=true;try{const result=await sessionRequest('activity');if(stopped||run!==generation.current)return;if(!result.ok){if(result.status===423||result.status===401)lock();return;}sent.current=Date.now();}catch{/* Retry temporary connection failures without locking an active screen. */}finally{heartbeat.current=false;}};
 void(async()=>{try{const url=new URL(window.location.href);if(url.searchParams.get('lock')==='1'){await sessionRequest('lock');url.searchParams.delete('lock');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);if(!stopped){locked=true;setState('locked');}return;}const result=await sessionRequest('status');if(stopped||run!==generation.current)return;if(!result.ok){locked=true;setState('locked');if(result.status!==423&&result.status!==401)setError((result.error||'로그인 상태를 확인해 주세요').replace(/[.。]+$/,''));return;}record(result.lastActive);sent.current=result.lastActive;setState('open');}catch{if(!stopped){locked=true;setState('locked');setError('연결 상태를 확인한 뒤 다시 시도해 주세요');}}})();
 const check=()=>{if(!last.current||locked)return;if(Date.now()-shared()>=IDLE){lock();return;}if(Date.now()-sent.current>=30000)void ping();};
 const active=(event:Event)=>{if(!event.isTrusted||document.visibilityState!=='visible'||locked||!last.current)return;const previous=shared();if(Date.now()-previous>=IDLE){lock();return;}if(Date.now()-last.current>1000)record(Date.now());if(Date.now()-sent.current>30000)void ping();};
 const onStorage=(event:StorageEvent)=>{if(event.key===key&&Number(event.newValue)>last.current)last.current=Number(event.newValue);};
 const events=['pointerdown','pointermove','click','keydown','input','wheel','scroll','touchstart','touchmove'];events.forEach(name=>window.addEventListener(name,active,{passive:true,capture:true}));window.addEventListener('storage',onStorage);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);window.addEventListener('crm-session-locked',lock);const timer=setInterval(check,1000);
 return()=>{stopped=true;clearInterval(timer);events.forEach(name=>window.removeEventListener(name,active,true));window.removeEventListener('storage',onStorage);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);window.removeEventListener('crm-session-locked',lock);last.current=0;};
 },[auth.authUser?.id,key]);
 const resetPassword=async()=>{if(resetBusy||resetSent)return;if(!auth.authUser?.email){setResetMessage('로그인 이메일을 확인할 수 없습니다 로그아웃 후 비밀번호 찾기를 이용해 주세요');return;}setResetBusy(true);setResetMessage('');try{const {error}=await supabase.auth.resetPasswordForEmail(auth.authUser.email,{redirectTo:window.location.origin+'/reset-password'});if(error){setResetMessage('재설정 메일을 보내지 못했습니다 잠시 후 다시 시도해 주세요');return;}setResetSent(true);setResetMessage('가입한 이메일로 비밀번호 재설정 링크를 보냈습니다\n메일을 확인해 주세요');}catch{setResetMessage('연결 상태를 확인한 뒤 다시 시도해 주세요');}finally{setResetBusy(false);}};
 const unlock=async()=>{if(busy)return;setBusy(true);setError('');try{const result=await sessionRequest('unlock',password,{email:auth.authUser.email,userId:auth.authUser.id});setPassword('');if(!result.ok){setError(result.error||'비밀번호를 확인해 주세요');return;}if(result.session){const {error:sessionError}=await supabase.auth.setSession(result.session);if(sessionError){setError('로그인 인증을 갱신하지 못했습니다 다시 시도해 주세요');return;}}window.location.reload();}catch{setError('연결 상태를 확인한 뒤 다시 시도해 주세요');}finally{setBusy(false);}};
 if(auth.authLoading)return <main className={styles.page} aria-busy="true"/>;
 if(!enabled)return children;
 if(state==='checking')return <main className={styles.page} aria-busy="true"><p>로그인 상태를 확인하고 있습니다.</p></main>;
 if(state==='open')return children;
 return <main className={styles.page}><a className={styles.home} href="/" aria-label="홈"><Home size={24}/></a><div className={styles.content}><LockKeyhole size={40} aria-hidden="true"/><h1>고객 관리 노트가 잠겼습니다</h1><p>20분 동안 사용하지 않아 확인이 필요합니다<br/>계속 이용하려면 비밀번호를 입력해 주세요</p><form onSubmit={event=>{event.preventDefault();void unlock();}}><label htmlFor="crm-unlock-password">비밀번호</label><input id="crm-unlock-password" type="password" autoComplete="current-password" required autoFocus maxLength={512} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/>{error&&<p role="alert" className={styles.error}>{error}</p>}<button type="submit" disabled={busy||!password}>{busy?'확인 중':'확인'}</button></form><div className={styles.accountActions}><button className={styles.logout} type="button" disabled={busy||resetBusy||resetSent} onClick={()=>void resetPassword()}>{resetBusy?'메일 발송 중':'비밀번호 찾기'}</button><button className={styles.logout} disabled={busy} onClick={()=>void supabase.auth.signOut().then(()=>window.location.assign('/'))}>로그아웃</button></div>{resetMessage&&<p className={styles.resetMessage} role="status">{resetMessage}</p>}</div></main>;
}
