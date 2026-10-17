"use client";
import {useEffect,useState} from 'react';
import {useAuth} from '@/app/components/AuthProvider';
import {supabase} from '@/lib/supabase';
import CoverageAnalysisTab from '@/app/my-page/CoverageAnalysisTab';
import PolicyInsertsEditor from '@/app/policy-inserts/PolicyInsertsEditor';
import CustomerSpreadsheetTab from '@/app/my-page/CustomerSpreadsheetTab';
import AiMessageTab from '@/app/my-page/AiMessageTab';
import NoticeTab from '@/app/my-page/NoticeTab';
import CalendarTab from '@/app/my-page/CalendarTab';
import MemoBoard from '@/app/components/memos/MemoBoard';
import DiaryTab from '@/app/my-page/DiaryTab';
export type CrmTool='crm'|'coverage-analysis'|'policy-inserts'|'customer'|'ai'|'notice'|'calendar'|'memo'|'diary';
export const isCrmTool=(value:string|null):value is CrmTool=>['crm','coverage-analysis','policy-inserts','customer','ai','notice','calendar','memo','diary'].includes(value||'');
export default function CrmTools({tool}:{tool:CrmTool}){
 const {authUser}=useAuth();const [url,setUrl]=useState<string|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;if(!authUser){setUrl(null);setLoading(false);return;}setLoading(true);void supabase.from('customer_settings').select('customer_url').eq('user_id',authUser.id).maybeSingle().then(({data,error})=>{if(alive){setUrl(data?.customer_url||null);setError(error?'스프레드시트 연결 정보를 읽지 못했습니다':'');setLoading(false);}});return()=>{alive=false;};},[authUser?.id]);
 const saveUrl=async(next:string)=>{if(!authUser)throw Error('로그인 후 이용해 주세요');const {error}=await supabase.from('customer_settings').upsert({user_id:authUser.id,customer_url:next},{onConflict:'user_id'});if(error)throw Error('시트 연결 정보를 저장하지 못했습니다');setUrl(next);};
 if(tool==='coverage-analysis')return <CoverageAnalysisTab topNavigation/>;
 return <div data-crm-tool-content="true">{error&&<p role="alert">{error}</p>}{tool==='policy-inserts'&&<PolicyInsertsEditor embedded compactNavigation/>}{tool==='customer'&&(loading?<p role="status">불러오는 중입니다</p>:<CustomerSpreadsheetTab spreadsheetUrl={url} onSaveUrl={saveUrl} basePath="/my-page"/>)}{tool==='ai'&&<AiMessageTab active/>}{tool==='notice'&&<NoticeTab active compactNavigation/>}{tool==='calendar'&&<><CalendarTab active/>{!loading&&<div hidden><CustomerSpreadsheetTab spreadsheetUrl={url} onSaveUrl={saveUrl} basePath="/my-page"/></div>}</>}{tool==='memo'&&<MemoBoard/>}{tool==='diary'&&<DiaryTab/>}</div>;
}
