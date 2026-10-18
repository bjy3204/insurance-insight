"use client";
import {useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {validateCoverageDraft,type CoverageDraft} from '@/lib/coverage-draft';
import {mergeCoverageDraft} from '@/lib/coverage-draft-merge';
type State={ready:boolean;message:string;conflict:boolean;error:boolean};
const serialize=(draft:CoverageDraft)=>JSON.stringify(validateCoverageDraft(draft));
export default function useCoverageDraftSync(owner:string|undefined,value:CoverageDraft,apply:(draft:CoverageDraft,restoreIdentity?:boolean)=>void,scope:{name:string;birth:string;documentId?:string}|'advisor'|null=null){
 const latest=useRef(value),applyRef=useRef(apply),runRef=useRef<(choice?:'remote'|'local')=>Promise<void>>(async()=>{});
 latest.current=value;applyRef.current=apply;
 const [state,setState]=useState<State>({ready:!owner,message:'',conflict:false,error:false});
 const [retry,setRetry]=useState(0);
 const serialized=serialize(value),changeRef=useRef(()=>{});
 const interaction=useRef(()=>{});
 const restoredOwner=useRef('');
 const scopeKey=scope==='advisor'?'advisor':scope?JSON.stringify([scope.name.trim().normalize('NFC').replace(/\s/g,''),scope.birth,scope.documentId||'']):'';
 useEffect(()=>{
  if(!owner){setState({ready:true,message:'',conflict:false,error:false});return;}
  const deviceKey='coverage-editor-local:v2:'+owner+(scopeKey==='advisor'?':advisor':'');
  if(!scopeKey){
   setState({ready:true,message:'',conflict:false,error:false});
   restoredOwner.current=owner;
   changeRef.current=()=>{try{sessionStorage.setItem(deviceKey,serialize(latest.current));}catch{}};
   interaction.current=()=>{};runRef.current=async()=>{};
   return()=>{changeRef.current=()=>{};};
  }
  restoredOwner.current=owner;
  const identity=scopeKey==='advisor'?null:JSON.parse(scopeKey) as [string,string,string],query=identity?'?name='+encodeURIComponent(identity[0])+'&birth='+encodeURIComponent(identity[1])+(identity[2]?'&documentId='+encodeURIComponent(identity[2]):''):'?area=advisor';
  let stopped=false,ready=false,busy=false,conflict=false,earlyChanges=false,revision:number|null=null,base='',working=latest.current;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const abort=new AbortController(),key='coverage-cloud-draft:v2:'+owner+':'+scopeKey;
  setState({ready:false,message:'',conflict:false,error:false});
  const snapshot=()=>serialize(working),dirty=()=>snapshot()!==base;
  const initialBase=snapshot();
  function persist(){try{localStorage.setItem(key,JSON.stringify({draft:working,revision,pending:dirty(),base}));sessionStorage.setItem(deviceKey,serialize(working));}catch{/* Server save remains available without local storage. */}}
  function status(message:string,error=false){if(!stopped)setState({ready:true,message,conflict,error});}
  async function request(body?:unknown){
   const {data:{session}}=await supabase.auth.getSession();
   if(!session||session.user.id!==owner)throw Error('로그인 상태를 확인해 주세요');
   const response=await fetch('/api/coverage-draft'+query,{method:body?'PUT':'GET',cache:'no-store',signal:abort.signal,headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const data=await response.json();if(!response.ok){const error=new Error(data.error||'자동 저장 연결을 확인해 주세요') as Error&{status:number};error.status=response.status;throw error;}return data;
  }
  function receive(draft:CoverageDraft){working=validateCoverageDraft(draft);latest.current=working;base=snapshot();applyRef.current(working);persist();}
  function rebase(remote:{draft:CoverageDraft|null;revision:number}){
   if(remote.draft){working=mergeCoverageDraft(JSON.parse(base||initialBase),working,remote.draft);latest.current=working;applyRef.current(working);base=serialize(remote.draft);}
   revision=remote.revision;conflict=false;persist();
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>void sync(),500);};
  async function sync(choice?:'remote'|'local'){
   if(stopped||!ready||busy||conflict&&!choice||document.visibilityState==='hidden'&&!dirty())return;
   busy=true;
   try{
    if(revision===null||choice||!dirty()){
     const remote=await request();if(stopped)return;
     if(choice==='remote'){conflict=false;revision=remote.revision;if(remote.draft)receive(remote.draft);status('다른 화면의 작성 내용을 불러왔습니다');return;}
     if(choice==='local'){conflict=false;revision=remote.revision;base=remote.draft?serialize(remote.draft):'';}
     else if(revision===null){revision=remote.revision;if(remote.draft&&dirty())rebase(remote);else if(remote.draft)receive(remote.draft);}
     else if(remote.revision!==revision){
      if(dirty()){rebase(remote);}
      else{
      revision=remote.revision;if(remote.draft)receive(remote.draft);status('다른 화면의 변경 내용을 반영했습니다');
      }
     }
    }
    if(!dirty()){status('자동 저장됨 · 같은 계정으로 동기화 중');return;}
    const sent=snapshot();status('자동 저장 중');
    const saved=await request({revision,draft:JSON.parse(sent)});if(stopped)return;
    revision=saved.revision;base=sent;persist();status(dirty()?'자동 저장 대기 중':'자동 저장됨 · 같은 계정으로 동기화 중');
   }catch(error){if(stopped)return;if((error as {status?:number}).status===409){try{const remote=await request();if(stopped)return;rebase(remote);status('');}catch{status('변경 내용을 동기화하지 못했습니다 다시 연결해 주세요',true);}}else status(error instanceof Error?error.message:'자동 저장하지 못했습니다 연결 후 다시 시도해 주세요',true);persist();}
   finally{busy=false;if(!stopped&&!conflict&&revision!==null&&dirty())schedule();}
  }
  runRef.current=sync;
  interaction.current=()=>{earlyChanges=true;};
  changeRef.current=()=>{if(stopped)return;if(!ready){if(earlyChanges){working=latest.current;persist();}return;}working=latest.current;persist();if(dirty()&&!conflict){status('자동 저장 대기 중');schedule();}};
  void(async()=>{
   let local:{draft:CoverageDraft;revision:number|null;pending:boolean;base?:string}|null=null;
   try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);local={draft:validateCoverageDraft(parsed.draft),revision:Number.isSafeInteger(parsed.revision)?parsed.revision:null,pending:parsed.pending===true,base:typeof parsed.base==='string'?serialize(validateCoverageDraft(JSON.parse(parsed.base))):undefined};}}catch{}
   if(local){working=local.draft;latest.current=working;applyRef.current(working);}
   try{
    const remote=await request();if(stopped)return;revision=remote.revision;
    if(earlyChanges){working=latest.current;if(remote.draft){base=local?.base||serialize(value);rebase(remote);}else base='';}
    else if(local?.pending){working=local.draft;latest.current=working;applyRef.current(working);if(remote.draft){base=local.base||serialize(remote.draft);rebase(remote);}else base='';}
    else if(remote.draft)receive(remote.draft);
    else{if(local){working=local.draft;latest.current=working;applyRef.current(working);}else working=latest.current;base='';}
    ready=true;persist();
    if(conflict)status('다른 화면의 작성 내용이 있습니다 사용할 내용을 선택해 주세요',true);else{status(dirty()?'자동 저장 대기 중':'자동 저장됨 · 같은 계정으로 동기화 중');if(dirty())schedule();}
   }catch(error){if(stopped)return;if(!earlyChanges&&local){working=local.draft;latest.current=working;applyRef.current(working);}else working=latest.current;base='';ready=true;persist();status(error instanceof Error?error.message:'자동 저장 연결을 확인해 주세요',true);}
  })();
  const interval=setInterval(()=>void sync(),2500),wake=()=>void sync();
  window.addEventListener('focus',wake);window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);
  const warn=(event:BeforeUnloadEvent)=>{if(ready&&dirty()){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);
  return()=>{stopped=true;abort.abort();clearTimeout(timer);clearInterval(interval);window.removeEventListener('focus',wake);window.removeEventListener('online',wake);window.removeEventListener('beforeunload',warn);document.removeEventListener('visibilitychange',wake);changeRef.current=()=>{};interaction.current=()=>{};};
 },[owner,retry,scopeKey]);
 useEffect(()=>{changeRef.current();},[serialized,state.ready]);
 return {...state,onInput:()=>interaction.current(),retry:()=>setRetry(value=>value+1),useRemote:()=>void runRef.current('remote'),keepLocal:()=>void runRef.current('local')};
}
