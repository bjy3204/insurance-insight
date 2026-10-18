"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {Download,Film,RefreshCw,Trash2,Upload} from 'lucide-react';
import {useAuth} from '@/app/components/AuthProvider';
import {supabase} from '@/lib/supabase';
import {validateVideoUpload,type SubscriberVideoView} from '@/lib/subscriber-videos';
import {confirmAction} from '@/components/ConfirmationHost';
import styles from './SubscriberVideos.module.css';

export default function SubscriberVideos(){
 const {authUser,authRole}=useAuth();
 if(process.env.NODE_ENV==='production')return null;
 return <SubscriberVideosPanel admin={authRole==='admin'} userId={authUser?.id}/>;
}
export function SubscriberVideosPanel({admin,userId}:{admin:boolean;userId?:string}){
 const [videos,setVideos]=useState<SubscriberVideoView[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [title,setTitle]=useState(''),[source,setSource]=useState(''),[file,setFile]=useState<File|null>(null),input=useRef<HTMLInputElement>(null);
 const request=useCallback(async(body?:unknown,method='GET',id?:string)=>{
  const {data:{session}}=await supabase.auth.getSession();
  const response=await fetch('/api/subscriber-videos'+(id?'?id='+encodeURIComponent(id):''),{method,cache:'no-store',headers:{Authorization:'Bearer '+(session?.access_token||''),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const result=await response.json();if(!response.ok)throw Error(result.error||'영상을 불러오지 못했습니다');return result;
 },[]);
 const load=useCallback(async()=>{setLoading(true);try{const result=await request();setVideos(result.videos);setError('');}catch(error){setError(error instanceof Error?error.message:'영상을 불러오지 못했습니다');}finally{setLoading(false);}},[request]);
 useEffect(()=>{if(!userId){setLoading(false);return;}void load();const refresh=()=>{if(document.visibilityState==='visible')void load();};const timer=window.setInterval(refresh,50*60*1000);window.addEventListener('focus',refresh);return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);};},[userId,load]);
 async function upload(event:FormEvent){
  event.preventDefault();if(busy)return;setError('');setMessage('');
  let pending:string|undefined,publishing=false;
  try{
   if(!file)throw Error('업로드할 영상을 선택해 주세요');
   const type=file.type||(/\.webm$/i.test(file.name)?'video/webm':/\.mov$/i.test(file.name)?'video/quicktime':'video/mp4');
   const values=validateVideoUpload({title,source,type,size:file.size});setBusy(true);
   const prepared=await request({action:'prepare',...values},'POST');pending=prepared.id;
   const {error}=await supabase.storage.from(prepared.bucket).uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:values.type});
   if(error)throw Error('영상 업로드에 실패했습니다 잠시 후 다시 시도해 주세요');
   publishing=true;await request({action:'publish',id:prepared.id},'POST');
   setTitle('');setSource('');setFile(null);if(input.current)input.current.value='';
   await load();setMessage('영상을 등록했습니다');
  }catch(error){if(pending&&!publishing)await request({action:'cancel',id:pending},'POST').catch(()=>{});setError(error instanceof Error?error.message:'영상을 등록하지 못했습니다');}
  finally{setBusy(false);}
 }
 async function remove(video:SubscriberVideoView){
  if(!await confirmAction(`‘${video.title}’ 영상을 삭제하시겠습니까?`))return;
  setBusy(true);setError('');setMessage('');try{await request(undefined,'DELETE',video.id);await load();}catch(error){setError(error instanceof Error?error.message:'영상을 삭제하지 못했습니다');}finally{setBusy(false);}
 }
 return <section className={styles.root} aria-label="구독 영상 다운로드">
  <header className={styles.header}><button type="button" aria-label="영상 새로고침" title="새로고침" disabled={busy||loading} onClick={()=>void load()}><RefreshCw size={18}/></button></header>
  {admin&&<form className={styles.upload} onSubmit={upload}>
   <div className={styles.fields}><label>영상 제목<input value={title} maxLength={100} required disabled={busy} onChange={event=>setTitle(event.target.value)} placeholder="영상 제목을 입력해 주세요"/></label><label>출처<input value={source} maxLength={300} disabled={busy} onChange={event=>setSource(event.target.value)} placeholder="출처를 입력해 주세요"/></label></div>
   <div className={styles.uploadActions}><label className={styles.file}>영상 파일<input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" disabled={busy} onChange={event=>setFile(event.target.files?.[0]||null)}/></label><button type="submit" className={styles.primary} disabled={busy||!file}><Upload size={18}/>{busy?'업로드 중':'영상 등록'}</button></div>
   <p>MP4 · WebM · MOV, 최대 50MB · 최신 5개 보관 · 새 영상 등록 시 가장 오래된 영상은 자동 삭제됩니다</p>
  </form>}
  {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status" className={styles.message}>{message}</p>}
  {loading&&!videos.length?<p className={styles.empty} role="status">영상을 불러오는 중입니다</p>:!videos.length&&!error?<div className={styles.empty}><Film size={28}/><p>등록된 영상이 없습니다</p></div>:null}
  <div className={styles.grid}>{videos.map(video=><article key={video.id} className={styles.card}>
   <video controls playsInline preload="metadata" src={video.previewUrl} aria-label={video.title+' 미리보기'} onError={()=>setError('이 영상을 재생하지 못했습니다 새로고침하거나 파일을 다운로드해 주세요')}/>
   <div className={styles.details}><h3>{video.title}</h3>{video.source&&<p className={styles.source}>출처: {video.source}</p>}<div className={styles.meta}><time dateTime={video.createdAt}>{new Date(video.createdAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time><span>{(video.size/1024/1024).toFixed(1)}MB</span></div><div className={styles.cardActions}><a href={video.downloadUrl} download><Download size={18}/>다운로드</a>{admin&&<button type="button" aria-label={video.title+' 삭제'} title="영상 삭제" disabled={busy} onClick={()=>void remove(video)}><Trash2 size={18}/></button>}</div></div>
  </article>)}</div>
 </section>;
}
