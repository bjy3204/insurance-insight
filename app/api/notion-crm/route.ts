import { requireMember } from '@/lib/notion-crm/member';
import { NextRequest, NextResponse } from "next/server";
import { CrmError, cookieOptions, notion, oauthConfig, seal, unseal, SESSION_COOKIE, type Connection } from "@/lib/notion-crm/server";
import { emptyData, fields, isSource, notionId, sourceNames, titleNames, type Source } from "@/lib/notion-crm/model";
import { readPage, writeProperties, type NotionPage, type Schema } from "@/lib/notion-crm/records";
export const runtime="nodejs";
const keys=Object.keys(sourceNames) as Source[];
function json(body:unknown,status=200,connection?:Connection){const r=NextResponse.json(body,{status,headers:{"Cache-Control":"no-store, private"}});if(connection)r.cookies.set(SESSION_COOKIE,seal(connection),{...cookieOptions,maxAge:Math.max(0,Math.floor((connection.expires-Date.now())/1000))});return r;}
function connection(request:NextRequest){return unseal<Connection>(request.cookies.get(SESSION_COOKIE)?.value||"");}
const same=(a:string,b:string)=>a.replace(/-/g,"")===b.replace(/-/g,"");
async function schema(c:Connection,source:Source){if(!c.sources)throw new CrmError("먼저 고객관리 양식을 연결해 주세요.",409);return (await notion<{properties:Schema}>(c,"data_sources/"+c.sources[source])).properties;}
async function pages(c:Connection,source:Source,filter?:unknown){if(!c.sources)throw new CrmError("양식을 연결해 주세요.",409);const rows:NotionPage[]=[];let cursor:string|undefined;do{const result=await notion<{results:NotionPage[];has_more:boolean;next_cursor:string}>(c,"data_sources/"+c.sources[source]+"/query","POST",{page_size:100,...(cursor?{start_cursor:cursor}:{}),...(filter?{filter}:{})});rows.push(...result.results.filter(r=>!r.archived&&!r.in_trash));cursor=result.has_more?result.next_cursor:undefined;if(rows.length>10000)throw new CrmError("고객관리 항목이 너무 많습니다. 조회 범위를 나눠 주세요.",413);}while(cursor);return rows;}
async function ownPage(c:Connection,id:string,source:Source){const page=await notion<NotionPage>(c,"pages/"+notionId(id));if(!c.sources||!page.parent?.data_source_id||!same(page.parent.data_source_id,c.sources[source])||page.in_trash||page.archived)throw new CrmError("이 양식의 항목이 아닙니다.",403);return page;}
async function configure(c:Connection,root:string){
 const pageId=notionId(root);await notion(c,"pages/"+pageId);
 const found:Partial<Record<Source,string>>={};let cursor:string|undefined;
 do{const list=await notion<{results:{id:string;type:string;child_database?:{title:string}}[];has_more:boolean;next_cursor:string}>(c,"blocks/"+pageId+"/children?page_size=100"+(cursor?"&start_cursor="+cursor:""));for(const block of list.results){if(block.type!=="child_database")continue;const key=keys.find(k=>sourceNames[k]===block.child_database?.title);if(!key)continue;if(found[key])throw new CrmError("같은 이름의 관리표가 여러 개 있습니다. 복사한 고객관리 페이지를 선택해 주세요.");const db=await notion<{data_sources:{id:string}[]}>(c,"databases/"+block.id);if(db.data_sources.length!==1)throw new CrmError("관리표마다 데이터 소스가 하나여야 합니다.");found[key]=db.data_sources[0].id;}cursor=list.has_more?list.next_cursor:undefined;}while(cursor);
 if(keys.some(k=>!found[k]))throw new CrmError("고객관리 노트 템플릿 전체를 복사한 페이지를 선택해 주세요.");
 const candidate={...c,root:pageId,sources:found as Record<Source,string>};
 // Validate the copied relation targets before adding any web-only fields.
 const schemas={} as Record<Source,Schema>;
 for(const source of keys){const current=await schema(candidate,source);schemas[source]=current;if(current[titleNames[source]]?.type!=="title")throw new CrmError("관리표의 이름·제목 항목이 변경되었습니다.");if(source!=="customers"&&(!current["고객"]?.relation?.data_source_id||!same(current["고객"].relation!.data_source_id!,candidate.sources.customers)))throw new CrmError("관리표의 고객 연결이 복사본 고객 목록을 가리키는지 확인해 주세요.");}
 for(const source of keys){const additions:Record<string,unknown>={};for(const field of fields[source]){if(schemas[source][field.name])continue;const type=field.type==="checkbox"?"checkbox":field.type==="date"?"date":field.type==="number"?"number":field.type==="email"?"email":field.type==="tel"?"phone_number":"rich_text";additions[field.name]={[type]:{}};}if(Object.keys(additions).length)await notion(candidate,"data_sources/"+candidate.sources[source],"PATCH",{properties:additions});}
 c.root=pageId;c.sources=candidate.sources;
}
function failure(error:unknown,c?:Connection){return json({error:error instanceof CrmError?error.message:"노션 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."},error instanceof CrmError?error.status:503,c);}
export async function GET(request:NextRequest){let c:Connection|undefined;try{const member=await requireMember(request); if(request.nextUrl.searchParams.get("status")==="1"){let configured=true;try{oauthConfig();}catch{configured=false;}try{c=connection(request);if(c.owner!==member.id)throw new CrmError("저장소에 다시 연결해 주세요.",401);}catch{return json({configured,connected:false});}return json({configured,connected:true,ready:!!c.sources,workspace:c.workspace,root:c.root});}
 c=connection(request);if(c.owner!==member.id)throw new CrmError('저장소에 다시 연결해 주세요.',401);const data=emptyData();for(const source of keys)data[source]=(await pages(c,source)).map(readPage);return json({data},200,c);
 }catch(error){return failure(error,c);}}
export async function POST(request:NextRequest){let c:Connection|undefined;try{
 if(request.headers.get("origin")!==request.nextUrl.origin)throw new CrmError("잘못된 요청입니다.",403);const member=await requireMember(request);
 const raw=await request.text();if(Buffer.byteLength(raw)>1048576)throw new CrmError("입력 내용이 너무 깁니다.",413);let body;try{body=JSON.parse(raw);}catch{throw new CrmError("잘못된 요청입니다.");}
 if(!body||typeof body!=="object"||Array.isArray(body))throw new CrmError("잘못된 요청입니다.");
 if(body.action==="disconnect"){const r=json({disconnected:true});r.cookies.set(SESSION_COOKIE,"",{...cookieOptions,maxAge:0});return r;}
 c=connection(request);if(c.owner!==member.id)throw new CrmError('저장소에 다시 연결해 주세요.',401);
 if(body.action==="configure"){if(typeof body.root!=="string")throw new CrmError("페이지 링크를 입력해 주세요.");await configure(c,body.root);return json({ready:true,workspace:c.workspace},200,c);}
 if(!isSource(body.source)||!c.sources)throw new CrmError("관리 항목을 확인해 주세요.");const source:Source=body.source;
 if(body.action==="save"){
  if(!body.values||typeof body.values!=="object"||Array.isArray(body.values))throw new CrmError("입력 내용을 확인해 주세요.");
  const current=body.id?await ownPage(c,body.id,source):null;
  if(current&&current.last_edited_time!==body.edited)throw new CrmError("노션에서 내용이 변경되었습니다. 새로고침 후 수정해 주세요.",409);
  if(!current&&!String(body.values[titleNames[source]]||"").trim())throw new CrmError("이름 또는 제목을 입력해 주세요.");
  if(!current&&source==="customers"&&!String(body.values["주민번호"]||"").trim())throw new CrmError("주민번호를 입력해 주세요.");
  let schemasafe=await schema(c,source);
  const missing=fields[source].filter(f=>(f.internal||f.name==="회사")&&Object.hasOwn(body.values,f.name)&&!schemasafe[f.name]);
  if(missing.length){await notion(c,"data_sources/"+c.sources[source],"PATCH",{properties:Object.fromEntries(missing.map(f=>[f.name,{rich_text:{}}]))});schemasafe=await schema(c,source);}
  const properties=(()=>{try{return writeProperties(source,body.values,schemasafe);}catch(e){throw new CrmError(e instanceof Error?e.message:"입력 내용을 확인해 주세요.");}});
  const relations=body.values["고객"];if(source!=="customers"&&!current&&relations===undefined)throw new CrmError("고객을 선택해 주세요.");if(relations!==undefined){if(!Array.isArray(relations)||relations.length!==1||typeof relations[0]!=="string")throw new CrmError("고객을 선택해 주세요.");await ownPage(c,relations[0],"customers");}
  const page=await notion<NotionPage>(c,current?"pages/"+current.id:"pages",current?"PATCH":"POST",{...(current?{}:{parent:{type:"data_source_id",data_source_id:c.sources[source]}}),properties:properties()});return json({record:readPage(page)},200,c);
 }
 if(body.action==="delete"){
  if(typeof body.id!=="string")throw new CrmError("항목을 확인해 주세요.");const page=await ownPage(c,body.id,source);if(page.last_edited_time!==body.edited)throw new CrmError("내용이 변경되었습니다. 새로고침해 주세요.",409);
  if(source==="customers"){for(const child of keys.filter(k=>k!=="customers")){if((await pages(c,child,{property:"고객",relation:{contains:page.id}})).length)throw new CrmError("연결된 계약·차량·수납·일정을 먼저 정리해 주세요.",409);}}
  await notion(c,"pages/"+page.id,"PATCH",{in_trash:true});return json({deleted:true},200,c);
 }
 throw new CrmError("지원하지 않는 요청입니다.");
 }catch(error){return failure(error,c);}}
