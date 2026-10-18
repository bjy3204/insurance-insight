const VERSION='1';
const pending=new Map<string,Promise<Blob>>();
export async function policyInsertImage(owner:string,category:string,page:string,token:string):Promise<Blob>{
 const key=new URL(`/__policy-insert-cache/${VERSION}/${encodeURIComponent(owner)}/${category}/${page}`,window.location.origin).href;
 const existing=pending.get(key);if(existing)return existing;
 const task=(async()=>{
  let cache:Cache|undefined;
  try{cache=await caches.open('policy-insert-images-v'+VERSION);const saved=await cache.match(key);if(saved)return saved.blob();}catch{/* Storage limits must not prevent displaying an image. */}
  const response=await fetch(`/api/policy-inserts/${page}?category=${category}&v=${VERSION}`,{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok)throw Error(response.status===403?'승인된 회원만 사용할 수 있습니다':'이미지를 불러오지 못했습니다 다시 시도해 주세요');
  const blob=await response.blob();
  if(!blob.size||!blob.type.startsWith('image/'))throw Error('이미지 파일을 확인하지 못했습니다');
  try{await cache?.put(key,new Response(blob,{headers:{'Content-Type':blob.type}}));}catch{/* Continue with the downloaded image when browser storage is full. */}
  return blob;
 })();
 pending.set(key,task);
 void task.finally(()=>pending.delete(key)).catch(()=>{});
 return task;
}
