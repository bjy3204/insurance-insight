"use client";
import {useEffect,useRef,useState} from 'react';
import {FileLock2,Upload,Eye,EyeOff,Download,ShieldCheck,RotateCcw} from 'lucide-react';
import styles from './PdfUnlock.module.css';
const MAX=30*1024*1024;
export default function PdfUnlock(){
 const [file,setFile]=useState<File|null>(null),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(''),[warning,setWarning]=useState(false);
 const input=useRef<HTMLInputElement>(null),worker=useRef<Worker|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),run=useRef(0);
 const cleanup=()=>{worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;};
 useEffect(()=>()=>{run.current++;cleanup();},[]);
 useEffect(()=>()=>{if(result)URL.revokeObjectURL(result);},[result]);
 function select(value:File|undefined){if(busy||!value)return;setError('');setResult('');setWarning(false);setPassword('');if(!/\.pdf$/i.test(value.name)&&value.type!=='application/pdf'){setFile(null);setError('PDF 파일을 선택해 주세요');return;}if(value.size>MAX||!value.size){setFile(null);setError('30MB 이하의 PDF 파일을 선택해 주세요');return;}setFile(value);}
 function reset(){run.current++;cleanup();setBusy(false);setFile(null);setPassword('');setVisible(false);setError('');setResult('');setWarning(false);if(input.current)input.current.value='';}
 async function unlock(){if(!file||busy)return;const current=++run.current;setBusy(true);setError('');setResult('');try{const buffer=await file.arrayBuffer();if(current!==run.current)return;const header=new TextDecoder('latin1').decode(buffer.slice(0,1024));if(!header.includes('%PDF-'))throw Error('정상적인 PDF 파일인지 확인해 주세요');
 const task=new Worker('/workers/pdf-unlock.js');worker.current=task;
 timer.current=setTimeout(()=>{if(current!==run.current)return;cleanup();setBusy(false);setError('처리 시간이 초과됐습니다 파일 크기를 줄이거나 PC에서 다시 시도해 주세요');},90000);
 task.onerror=()=>{if(current!==run.current)return;cleanup();setBusy(false);setError('PDF 처리 도구를 실행하지 못했습니다 새로고침 후 다시 시도해 주세요');};
 task.onmessage=event=>{if(current!==run.current)return;cleanup();setBusy(false);if(!event.data.ok){setError(event.data.reason==='password'?'비밀번호가 맞지 않습니다 다시 확인해 주세요':'이 PDF를 처리하지 못했습니다 파일과 비밀번호를 확인해 주세요');return;}setPassword('');setWarning(event.data.warning===true);setResult(URL.createObjectURL(new Blob([event.data.buffer],{type:'application/pdf'})));};
 task.postMessage({buffer,password},[buffer]);
 }catch(error){if(current!==run.current)return;cleanup();setBusy(false);setError(error instanceof Error?error.message:'PDF를 처리하지 못했습니다');}}
 return <section className={styles.card} aria-label="PDF 암호 해제"><header className={styles.heading}><div className={styles.icon}><FileLock2 size={26}/></div><div><h2>PDF 암호 해제</h2><p>비밀번호를 아는 PDF의 암호를 해제하고 사본을 저장하세요</p></div></header>
 <div className={styles.privacy}><ShieldCheck size={18}/><span>파일과 비밀번호는 서버에 업로드하지 않고 이 브라우저에서만 처리합니다</span></div>
 <form onSubmit={event=>{event.preventDefault();void unlock();}}>
 <div className={styles.drop} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();select(event.dataTransfer.files[0]);}}><Upload size={28}/><strong>{file?file.name:'PDF 파일을 여기에 놓거나 선택하세요'}</strong><span>{file?`${(file.size/1024/1024).toFixed(1)}MB`:'PDF 파일 · 최대 30MB'}</span><button type="button" disabled={busy} onClick={()=>input.current?.click()}>{file?'다른 파일 선택':'파일 선택'}</button><input ref={input} className={styles.file} type="file" accept=".pdf,application/pdf" aria-label="암호 해제할 PDF 파일" disabled={busy} onChange={event=>{select(event.target.files?.[0]);event.target.value='';}}/></div>
 <label className={styles.passwordLabel} htmlFor="pdf-unlock-password">PDF 비밀번호</label><div className={styles.password}><input id="pdf-unlock-password" type={visible?'text':'password'} value={password} disabled={busy} autoComplete="off" maxLength={256} placeholder="PDF를 열 때 사용하는 비밀번호" onChange={event=>setPassword(event.target.value)}/><button type="button" aria-label={visible?'비밀번호 숨기기':'비밀번호 보기'} onClick={()=>setVisible(value=>!value)}>{visible?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>
 {error&&<p role="alert" className={styles.error}>{error}</p>}
 {result&&<p role="status" className={styles.success}>{warning?'일부 PDF 구조를 복구했습니다 내려받은 파일의 내용을 확인해 주세요':'암호 해제가 완료됐습니다 아래 버튼으로 파일을 저장하세요'}</p>}
 <div className={styles.actions}><button type="button" onClick={reset}><RotateCcw size={18}/>초기화</button>{result?<a className={styles.primary} href={result} download={(file?.name.replace(/\.pdf$/i,'')||'문서')+'_암호해제.pdf'}><Download size={18}/>PDF 다운로드</a>:<button className={styles.primary} type="submit" disabled={!file||busy}><FileLock2 size={18}/>{busy?'암호 해제 중…':'암호 해제'}</button>}</div>
 </form><p className={styles.note}>원본 파일은 변경하지 않습니다 비밀번호를 모르는 파일의 암호를 찾는 기능은 제공하지 않습니다</p></section>;
}
