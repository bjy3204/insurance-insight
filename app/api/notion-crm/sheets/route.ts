import {prepareSpreadsheet} from '@/lib/notion-crm/provision-sheets';
import {loadConnection,saveConnection,deleteConnection} from '@/lib/notion-crm/connections';
import { requireMember } from '@/lib/notion-crm/member';
import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {CrmError} from '@/lib/notion-crm/server';
import {google,googleConfig,seal,unseal,cookieOptions,GOOGLE_COOKIE,sheetId,readSheet,rowCells,sheetRow,headers,column,type GoogleConnection} from '@/lib/notion-crm/sheets';
import {fields,emptyData,isSource,sourceNames,titleNames,type Source} from '@/lib/notion-crm/model';
export const runtime='nodejs';
const keys=Object.keys(sourceNames) as Source[];
const active=(row:unknown[])=>typeof row[0]==='string'&&!!row[0]&&row[2]!==true&&String(row[2]).toLowerCase()!=='true';
function session(request:NextRequest){const c=unseal<GoogleConnection>(request.cookies.get(GOOGLE_COOKIE)?.value||'');if(c.provider!=='sheets')throw new CrmError('구글에 다시 연결해 주세요',401);return c;}
async function json(body:unknown,status=200,c?:GoogleConnection){if(c&&status<400)await saveConnection('sheets',c);const r=NextResponse.json(body,{status,headers:{'Cache-Control':'no-store, private'}});if(c)r.cookies.set(GOOGLE_COOKIE,seal(c),{...cookieOptions,maxAge:Math.min(7*86400,Math.max(0,Math.floor((c.expires-Date.now())/1000)))});return r;}
async function failure(e:unknown,c?:GoogleConnection){return await json({error:e instanceof CrmError?e.message:'스프레드시트 요청을 처리하지 못했습니다'},e instanceof CrmError?e.status:503,c);}
export async function GET(request:NextRequest){let c:GoogleConnection|undefined;try{const member=await requireMember(request);if(request.nextUrl.searchParams.get('status')==='1'){let configured=true;try{googleConfig();}catch{configured=false;}try{c=await loadConnection<GoogleConnection>('sheets',member.id,request,GOOGLE_COOKIE);if(c.owner!==member.id)throw new CrmError('저장소에 다시 연결해 주세요',401);}catch(error){if(!(error instanceof CrmError)||error.status!==401)throw error;return await json({configured,connected:false});}return await json({configured,connected:true,ready:!!c.spreadsheet,workspace:c.title||'구글 스프레드시트',root:c.spreadsheet});}c=await loadConnection<GoogleConnection>('sheets',member.id,request,GOOGLE_COOKIE);if(c.owner!==member.id)throw new CrmError('저장소에 다시 연결해 주세요',401);const data=emptyData();for(const key of (["events","customers"].includes(request.nextUrl.searchParams.get("source")||"")?[request.nextUrl.searchParams.get("source") as "events"|"customers"]:keys))data[key]=(await readSheet(c,key)).slice(1).filter(active).map(row=>sheetRow(key,row));return await json({data},200,c);}catch(e){return failure(e,c);}}
export async function POST(request:NextRequest){let c:GoogleConnection|undefined;try{
 if(request.headers.get('origin')!==request.nextUrl.origin)throw new CrmError('잘못된 요청입니다',403);const member=await requireMember(request);const raw=await request.text();if(Buffer.byteLength(raw)>1048576)throw new CrmError('입력 내용이 너무 깁니다',413);let body;try{body=JSON.parse(raw);}catch{throw new CrmError('잘못된 요청입니다');}if(!body||typeof body!=='object'||Array.isArray(body))throw new CrmError('잘못된 요청입니다');
 if(body.action==='disconnect'){await deleteConnection('sheets',member.id);const r=await json({disconnected:true});r.cookies.set(GOOGLE_COOKIE,'',{...cookieOptions,maxAge:0});return r;}c=await loadConnection<GoogleConnection>('sheets',member.id,request,GOOGLE_COOKIE);if(c.owner!==member.id)throw new CrmError('저장소에 다시 연결해 주세요',401);
 if(body.action==='prepare'){await prepareSpreadsheet(c);return await json({ready:true,workspace:c.title},200,c);}
 if(body.action==='configure'){
  if(typeof body.root!=='string')throw new CrmError('시트 링크를 입력해 주세요');const id=sheetId(body.root),candidate={...c,spreadsheet:id};const metadata=await google<{properties:{title:string;timeZone:string}}>(candidate,id+'?fields=properties(title,timeZone)');if(metadata.properties.timeZone!=='Asia/Seoul')throw new CrmError('고객관리 시트의 시간대를 Asia/Seoul로 설정해 주세요');for(const source of keys)await readSheet(candidate,source);c.spreadsheet=id;c.title=metadata.properties.title;return await json({ready:true,workspace:c.title},200,c);
 }
 if(!isSource(body.source)||!c.spreadsheet)throw new CrmError('저장할 시트와 관리 항목을 확인해 주세요');const source:Source=body.source,rows=await readSheet(c,source);const index=body.id?rows.findIndex((row,i)=>i>0&&row[0]===body.id&&active(row)):-1;
 if(body.id&&index<1)throw new CrmError('이 시트의 항목이 아닙니다',404);if(index>0&&sheetRow(source,rows[index]).edited!==body.edited)throw new CrmError('시트 내용이 변경되었습니다 새로고침 후 수정해 주세요',409);
 if(body.action==='delete'){
  if(index<1)throw new CrmError('삭제할 항목을 확인해 주세요');if(source==='customers')for(const other of keys.filter(k=>k!=='customers'))if((await readSheet(c,other)).slice(1).filter(active).some(row=>(sheetRow(other,row).values['고객'] as string[]).includes(body.id)))throw new CrmError('연결된 계약·차량·수납·일정을 먼저 정리해 주세요',409);
  await google(c,c.spreadsheet+'/values/'+encodeURIComponent("'"+sourceNames[source]+"'!C"+(index+1))+'?valueInputOption=RAW','PUT',{values:[[true]]});return await json({deleted:true},200,c);
 }
 if(body.action!=='save'||!body.values||typeof body.values!=='object'||Array.isArray(body.values))throw new CrmError('입력 내용을 확인해 주세요');
 if(index<1&&!String(body.values[titleNames[source]]||'').trim())throw new CrmError('이름 또는 제목을 입력해 주세요');if(index<1&&source==='customers'&&!body.values['주민번호'])throw new CrmError('주민번호를 입력해 주세요');
 if(source!=='customers'&&(index<1||Object.hasOwn(body.values,'고객'))){const ids=body.values['고객'];if(!Array.isArray(ids)||(source!=='events'&&ids.length!==1)||ids.length>1||ids.length===1&&typeof ids[0]!=='string')throw new CrmError('고객을 선택해 주세요');const customers=await readSheet(c,'customers');if(ids.length&&!customers.some(row=>active(row)&&row[0]===ids[0]))throw new CrmError('등록된 고객을 선택해 주세요');}
 if(index<1&&body.requestId!==undefined){if(typeof body.requestId!=='string'||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(body.requestId))throw new CrmError('추가 요청을 확인해 주세요');if(rows.some(row=>row[0]===body.requestId))throw new CrmError('이미 저장된 추가 요청입니다 창을 닫고 새로고침해 주세요',409);}
 const id=index>0?String(rows[index][0]):body.requestId||randomUUID(),cells=rowCells(source,index>0?rows[index]:[],body.values,id);
 if(index>0)await google(c,c.spreadsheet+'/values/'+encodeURIComponent("'"+sourceNames[source]+"'!A"+(index+1)+':'+column(cells.length-1)+(index+1))+'?valueInputOption=RAW','PUT',{values:[cells]});
 else{
  const result=await google<{updates:{updatedRange:string}}>(c,c.spreadsheet+'/values/'+encodeURIComponent("'"+sourceNames[source]+"'!A:"+column(cells.length-1))+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:[cells]});
  try{const end=Number(result.updates.updatedRange.match(/(\d+)$/)?.[1]);if(end){const metadata=await google<{sheets:{properties:{sheetId:number;title:string};tables?:{tableId:string;range:{endRowIndex?:number}}[]}[]}>(c,c.spreadsheet+'?fields=sheets(properties(sheetId,title),tables(tableId,range))');const sheet=metadata.sheets.find(s=>s.properties.title===sourceNames[source]),table=sheet?.tables?.[0];if(sheet&&table&&end>(table.range.endRowIndex||0))await google(c,c.spreadsheet+':batchUpdate','POST',{requests:[{updateTable:{table:{tableId:table.tableId,range:{sheetId:sheet.properties.sheetId,startRowIndex:0,endRowIndex:end,startColumnIndex:0,endColumnIndex:headers(source).length}},fields:'range'}}]});}}catch{return await json({record:sheetRow(source,cells),warning:'내용은 저장됐지만 시트 표 범위를 확장하지 못했습니다 새로고침해 확인해 주세요'},200,c);}
 }
 return await json({record:sheetRow(source,cells)},200,c);
 }catch(e){return failure(e,c);}}
