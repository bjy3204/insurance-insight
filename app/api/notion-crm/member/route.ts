import { NextRequest,NextResponse } from 'next/server';
import {requireMember,MEMBER_COOKIE} from '@/lib/notion-crm/member';
import {seal,cookieOptions,CrmError} from '@/lib/notion-crm/server';
export async function POST(request:NextRequest){try{if(request.headers.get('origin')!==request.nextUrl.origin)throw new CrmError('잘못된 요청입니다',403);const member=await requireMember(request);const response=NextResponse.json({ready:true});response.cookies.set(MEMBER_COOKIE,seal({token:member.token,expires:Date.now()+600000}),{...cookieOptions,maxAge:600});return response;}catch(e){return NextResponse.json({error:e instanceof CrmError?e.message:'로그인을 확인하지 못했습니다'},{status:e instanceof CrmError?e.status:503});}}
