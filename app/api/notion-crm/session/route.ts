import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {requireMember} from '@/lib/notion-crm/member';
import {activity,activityCookie,IDLE_COOKIE,IDLE_MS} from '@/lib/notion-crm/idle';
import {CrmError} from '@/lib/notion-crm/server';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 if(request.headers.get('origin')!==request.nextUrl.origin)throw new CrmError('잘못된 요청입니다',403);
 const raw=await request.text();if(raw.length>2048)throw new CrmError('입력 내용을 확인해 주세요');const body=JSON.parse(raw);
 let member;let renewed: {access_token:string;refresh_token:string}|undefined;
 if(body.action==='unlock'){
  if(typeof body.password!=='string'||!body.password||body.password.length>512||typeof body.email!=='string'||body.email.length>320||typeof body.userId!=='string')throw new CrmError('비밀번호를 입력해 주세요');
  const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await auth.auth.signInWithPassword({email:body.email,password:body.password});
  if(error||data.user?.id!==body.userId||!data.session)throw new CrmError('비밀번호를 확인해 주세요',401);
  const headers=new Headers(request.headers);headers.set('authorization','Bearer '+data.session.access_token);
  try{member=await requireMember(new NextRequest(request.url,{headers}),{skipIdle:true});}catch(error){await auth.auth.signOut({scope:'local'});throw error;}
  renewed={access_token:data.session.access_token,refresh_token:data.session.refresh_token};
 }else{member=await requireMember(request,{skipIdle:true});if(body.action!=='lock'){if(body.action!=='activity'&&body.action!=='status')throw new CrmError('잘못된 요청입니다');const current=activity(request,member.activityOwner,member.lastSignIn);if(body.action==='status')return NextResponse.json({locked:false,lastActive:current.lastActive,idleMs:IDLE_MS},{headers:{'Cache-Control':'no-store, private'}});}}
 const locked=body.action==='lock';const cookie=activityCookie(member.activityOwner,locked);const response=NextResponse.json({locked,lastActive:Date.now(),idleMs:IDLE_MS,...(renewed?{session:renewed}:{})},{headers:{'Cache-Control':'no-store, private'}});response.cookies.set(IDLE_COOKIE,cookie.value,cookie.options);return response;
 }catch(error){const status=error instanceof CrmError?error.status:503;return NextResponse.json({locked:status===423,error:error instanceof CrmError?error.message:'확인하지 못했습니다 잠시 후 다시 시도해 주세요'},{status,headers:{'Cache-Control':'no-store, private'}});}}
