export const VIDEO_BUCKET='subscriber-videos';
export const VIDEO_LIMIT=5;
export const VIDEO_MAX_BYTES=50*1024*1024;
export const VIDEO_TYPES:Record<string,string>={'video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'};
export type SubscriberVideo={id:string;title:string;source:string;path:string;size:number;createdAt:string};
export type SubscriberVideoView=SubscriberVideo&{previewUrl:string;downloadUrl:string};
export function validateVideoUpload(value:unknown){
 const body=value as {title?:unknown;source?:unknown;type?:unknown;size?:unknown};
 if(!body||typeof body.title!=='string'||!body.title.trim()||body.title.trim().length>100)throw Error('영상 제목을 100자 이내로 입력해 주세요');
 if(typeof body.source!=='string'||body.source.trim().length>300)throw Error('출처를 300자 이내로 입력해 주세요');
 if(typeof body.type!=='string'||!VIDEO_TYPES[body.type])throw Error('MP4, WebM, MOV 영상을 선택해 주세요');
 if(!Number.isSafeInteger(body.size)||Number(body.size)<=0||Number(body.size)>VIDEO_MAX_BYTES)throw Error('영상은 최대 50MB까지 올릴 수 있습니다');
 return {title:body.title.trim(),source:body.source.trim(),type:body.type,size:Number(body.size)};
}
// Publishing and trimming share one atomic operation, including concurrent administrators.
export const PUBLISH_VIDEO_LUA=`
if redis.call('EXISTS',KEYS[2])==1 then return 0 end
redis.call('LPUSH',KEYS[1],ARGV[1])
local old=redis.call('LRANGE',KEYS[1],5,-1)
for _,entry in ipairs(old) do redis.call('SADD',KEYS[3],cjson.decode(entry).path) end
redis.call('LTRIM',KEYS[1],0,4)
redis.call('SET',KEYS[2],'1','EX',86400)
return 1`;
export const DELETE_VIDEO_LUA=`
local entries=redis.call('LRANGE',KEYS[1],0,-1)
for _,entry in ipairs(entries) do
 local video=cjson.decode(entry)
 if video.id==ARGV[1] then
  redis.call('LREM',KEYS[1],1,entry)
  redis.call('SADD',KEYS[2],video.path)
  return 1
 end
end
return 0`;
