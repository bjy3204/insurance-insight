import {activity} from './idle';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { hasCompletedMembership } from '@/lib/auth/membership';
import { CrmError, unseal } from './server';
export const MEMBER_COOKIE='crm_member';
export async function requireMember(request:NextRequest,options:{skipIdle?:boolean}={}){
 let token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token){try{token=unseal<{token:string;expires:number}>(request.cookies.get(MEMBER_COOKIE)?.value||'').token;}catch{}}
 if(!token)throw new CrmError('로그인 후 이용해 주세요',401);
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)throw new CrmError('다시 로그인해 주세요',401);
 const {data:profile,error:profileError}=await db.from('profiles').select('nickname,instagram_id,role,status').eq('id',user.id).maybeSingle();
 if(profileError||!hasCompletedMembership(profile)||(profile?.status!=='approved'&&profile?.role!=='admin'))throw new CrmError('승인된 회원만 사용할 수 있습니다',403);
 let sessionId='';try{sessionId=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).session_id||'';}catch{}
 const activityOwner=user.id+':'+sessionId;
 if(!options.skipIdle)activity(request,activityOwner,user.last_sign_in_at);
 return {id:user.id,activityOwner,token,email:user.email,lastSignIn:user.last_sign_in_at};
}
