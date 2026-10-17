import {saveConnection} from '@/lib/notion-crm/connections';
import {requireMember} from '@/lib/notion-crm/member';
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, oauthConfig, seal, unseal, sameState, SESSION_COOKIE, STATE_COOKIE, type Connection } from "@/lib/notion-crm/server";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 let origin=request.nextUrl.origin;
 try{const member=await requireMember(request);
  const config=oauthConfig();origin=config.origin;
  const saved=unseal<{owner:string;state:string;hint?:string;expires:number}>(request.cookies.get(STATE_COOKIE)?.value||"");
  if(saved.owner!==member.id||!sameState(saved.state,request.nextUrl.searchParams.get("state")||"")||request.nextUrl.searchParams.has("error"))throw Error();
  const code=request.nextUrl.searchParams.get("code");if(!code||code.length>2000)throw Error();
  const response=await fetch("https://api.notion.com/v1/oauth/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(config.id+":"+config.clientSecret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({grant_type:"authorization_code",code,redirect_uri:config.redirect}),cache:"no-store",signal:AbortSignal.timeout(20000)});
  const token=await response.json();if(!response.ok||!token.access_token||!token.workspace_id)throw Error();
  const connection:Connection={owner:member.id,access:token.access_token,refresh:token.refresh_token,tokenExpires:Date.now()+(token.expires_in||3600)*1000,workspace:token.workspace_name||"내 노션",workspaceId:token.workspace_id,root:saved.hint||token.duplicated_template_id||undefined,expires:Date.now()+7*86400000};
await saveConnection('notion',connection);  const result=NextResponse.redirect(new URL("/my-page?storage=notion",origin));result.cookies.set(SESSION_COOKIE,seal(connection),{...cookieOptions,maxAge:7*86400});result.cookies.set(STATE_COOKIE,"",{...cookieOptions,maxAge:0});return result;
 }catch{const result=NextResponse.redirect(new URL("/my-page?connection=failed",origin));result.cookies.set(STATE_COOKIE,"",{...cookieOptions,maxAge:0});return result;}
}
