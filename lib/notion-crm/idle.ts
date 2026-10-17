import type {NextRequest} from 'next/server';
import {CrmError,seal,unseal,cookieOptions} from './server';
export const IDLE_MS=20*60*1000;
export const IDLE_COOKIE='crm_activity';
export type Activity={owner:string;lastActive:number;locked:boolean;expires:number};
export function activity(request:NextRequest,owner:string,lastSignIn?:string):Activity {
 const raw=request.cookies.get(IDLE_COOKIE)?.value;
 if(raw){try{const value=unseal<Activity>(raw);if(value.owner===owner){if(value.locked||!Number.isFinite(value.lastActive)||Date.now()-value.lastActive>=IDLE_MS)throw Error();return value;}}catch{throw new CrmError('20분 동안 사용하지 않아 비밀번호 확인이 필요합니다.',423);}}
 const signedIn=Date.parse(lastSignIn||'');
 if(Number.isFinite(signedIn)&&Date.now()-signedIn<IDLE_MS)return {owner,lastActive:signedIn,locked:false,expires:Date.now()+7*86400000};
 throw new CrmError('20분 동안 사용하지 않아 비밀번호 확인이 필요합니다.',423);
}
export function activityCookie(owner:string,locked=false){return {value:seal({owner,lastActive:Date.now(),locked,expires:Date.now()+7*86400000}),options:{...cookieOptions,maxAge:7*86400}};}
