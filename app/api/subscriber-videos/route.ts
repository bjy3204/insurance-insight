import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {Redis} from '@upstash/redis';
import {randomUUID} from 'node:crypto';
import {requireMember} from '@/lib/notion-crm/member';
import {CrmError} from '@/lib/notion-crm/server';
import {VIDEO_BUCKET,VIDEO_MAX_BYTES,VIDEO_TYPES,validateVideoUpload,PUBLISH_VIDEO_LUA,DELETE_VIDEO_LUA,type SubscriberVideo} from '@/lib/subscriber-videos';
export const runtime='nodejs';
const INDEX='subscriber-videos:v1:list',GARBAGE='subscriber-videos:v1:garbage',PENDING='subscriber-videos:v1:pending';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store, private'}});
const failure=(error:unknown)=>json({error:error instanceof Error?error.message:'영상을 처리하지 못했습니다'},error instanceof CrmError?error.status:400);
function services(){
 const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL,token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)throw Error('영상 저장소 설정을 확인해 주세요');
 return {redis:new Redis({url,token}),db:createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})};
}
async function access(request:NextRequest,admin=false){
 if(process.env.NODE_ENV==='production')throw new CrmError('사용할 수 없는 메뉴입니다',404);
 const member=await requireMember(request),servicesForRequest=services();
 if(admin){const {data,error}=await servicesForRequest.db.from('profiles').select('role').eq('id',member.id).single();if(error||data?.role!=='admin')throw new CrmError('관리자만 영상을 등록하거나 삭제할 수 있습니다',403);}
 return {...servicesForRequest,member};
}
async function cleanup({redis,db}:ReturnType<typeof services>){
 const expired=await redis.zrange<string[]>(PENDING,0,Date.now(),{byScore:true});
 if(expired.length){await redis.sadd(GARBAGE,expired[0],...expired.slice(1));await redis.zrem(PENDING,...expired);}
 const paths=await redis.smembers<string[]>(GARBAGE);
 if(!paths.length)return;
 const {error}=await db.storage.from(VIDEO_BUCKET).remove(paths);
 if(!error)await redis.srem(GARBAGE,...paths);
}
export async function GET(request:NextRequest){try{
 const ctx=await access(request);
 await cleanup(ctx);
 const videos=await ctx.redis.lrange<SubscriberVideo>(INDEX,0,4);
 const result=await Promise.all(videos.map(async video=>{
  const extension=video.path.split('.').pop()||'mp4';
  const filename=video.title.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_')+'.'+extension;
  const bucket=ctx.db.storage.from(VIDEO_BUCKET);
  const [preview,download]=await Promise.all([bucket.createSignedUrl(video.path,3600),bucket.createSignedUrl(video.path,3600,{download:filename})]);
  if(preview.error||download.error)throw Error('영상 링크를 불러오지 못했습니다 다시 시도해 주세요');
  return {...video,previewUrl:preview.data.signedUrl,downloadUrl:download.data.signedUrl};
 }));
 return json({videos:result});
 }catch(error){return failure(error);}}
export async function POST(request:NextRequest){try{
 if(Number(request.headers.get('content-length')||0)>6000)throw new CrmError('요청이 너무 큽니다',413);
 const ctx=await access(request,true),body=await request.json();
 if(body.action==='prepare'){
  const input=validateVideoUpload(body),id=randomUUID(),path=`${ctx.member.id}/${id}.${VIDEO_TYPES[input.type]}`;
  const {data:bucket,error:lookupError}=await ctx.db.storage.getBucket(VIDEO_BUCKET);
  if(bucket?.public)throw Error('영상 저장소를 비공개로 설정해 주세요');
  if(!bucket){
   if(lookupError&&lookupError.message!=='Bucket not found')throw Error('영상 저장소를 확인하지 못했습니다');
   const {error}=await ctx.db.storage.createBucket(VIDEO_BUCKET,{public:false,fileSizeLimit:VIDEO_MAX_BYTES,allowedMimeTypes:Object.keys(VIDEO_TYPES)});
   if(error&&!/already exists/i.test(error.message))throw Error('영상 저장소를 준비하지 못했습니다');
  }
  const {data,error}=await ctx.db.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path);
  if(error)throw Error('영상 업로드를 준비하지 못했습니다');
  const video:SubscriberVideo={id,title:input.title,source:input.source,path,size:input.size,createdAt:new Date().toISOString()};
  await ctx.redis.set('subscriber-videos:v1:upload:'+id,{...video,owner:ctx.member.id,type:input.type},{ex:10800});
  await ctx.redis.zadd(PENDING,{score:Date.now()+2*60*60*1000+60000,member:path});
  return json({id,path,token:data.token,bucket:VIDEO_BUCKET});
 }
 if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id))throw Error('영상을 확인해 주세요');
 const key='subscriber-videos:v1:upload:'+body.id;
 if(await ctx.redis.exists('subscriber-videos:v1:published:'+body.id))return json({ok:true});
 const upload=await ctx.redis.get<SubscriberVideo&{owner:string;type:string}>(key);
 if(!upload||upload.owner!==ctx.member.id)throw new CrmError('업로드 정보가 만료되었습니다 다시 올려 주세요',400);
 if(body.action==='cancel'){
  await ctx.redis.sadd(GARBAGE,upload.path);await cleanup(ctx);await ctx.redis.del(key);return json({ok:true});
 }
 if(body.action!=='publish')throw Error('요청을 확인해 주세요');
 const deadline=await ctx.redis.zscore(PENDING,upload.path);
 if(!deadline||Number(deadline)<Date.now()+30000)throw Error('업로드 정보가 만료되었습니다 다시 올려 주세요');
 const {data:info,error}=await ctx.db.storage.from(VIDEO_BUCKET).info(upload.path);
 if(error||!info||Number(info.size)!==upload.size||info.contentType!==upload.type)throw Error('영상 업로드가 완료되지 않았습니다 파일을 다시 선택해 주세요');
 const video:SubscriberVideo={id:upload.id,title:upload.title,source:upload.source,path:upload.path,size:upload.size,createdAt:new Date().toISOString()};
 await ctx.redis.eval(PUBLISH_VIDEO_LUA,[INDEX,'subscriber-videos:v1:published:'+video.id,GARBAGE],[JSON.stringify(video)]);
 await ctx.redis.zrem(PENDING,upload.path);
 await cleanup(ctx);
 return json({ok:true});
 }catch(error){return failure(error);}}
export async function DELETE(request:NextRequest){try{
 const ctx=await access(request,true),id=request.nextUrl.searchParams.get('id');
 if(!id||!/^[a-f0-9-]{36}$/.test(id))throw Error('영상을 확인해 주세요');
 await ctx.redis.eval(DELETE_VIDEO_LUA,[INDEX,GARBAGE],[id]);await cleanup(ctx);
 return json({ok:true});
 }catch(error){return failure(error);}}
