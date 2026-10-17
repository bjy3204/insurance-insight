import {notionId} from '@/lib/notion-crm/model';
import {requireMember} from '@/lib/notion-crm/member';
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookieOptions, oauthConfig, seal, STATE_COOKIE } from "@/lib/notion-crm/server";
export const runtime="nodejs";
export async function GET(request:NextRequest){try{const member=await requireMember(request);const config=oauthConfig(),state=randomBytes(32).toString("hex"),url=new URL("https://api.notion.com/v1/oauth/authorize");url.search=new URLSearchParams({client_id:config.id,redirect_uri:config.redirect,response_type:"code",owner:"user",state}).toString();const page=request.nextUrl.searchParams.get("page"),hint=page?notionId(page):undefined;const result=NextResponse.redirect(url);result.cookies.set(STATE_COOKIE,seal({owner:member.id,state,hint,expires:Date.now()+600000}),{...cookieOptions,maxAge:600});return result;}catch{return NextResponse.redirect(new URL("/my-page?connection=not-configured",request.nextUrl.origin));}}
