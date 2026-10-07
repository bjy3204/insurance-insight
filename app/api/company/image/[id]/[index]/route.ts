import sharp from "sharp";
import { getCompanies } from "@/lib/company/data";
const images=new Map<string,{bytes:Uint8Array<ArrayBuffer>;at:number}>();
const headers={"Content-Type":"image/webp","Cache-Control":"public, max-age=31536000, s-maxage=31536000, immutable","X-Content-Type-Options":"nosniff"};
export async function GET(_request:Request,{params}:{params:Promise<{id:string;index:string}>}) {
 try {
 const {id,index}=await params;
 if(!/^\d+$/.test(index))return new Response(null,{status:404});
 const company=(await getCompanies()).find(item=>item.id===id);
 const src=company?.image[Number(index)];
 if(!src)return new Response(null,{status:404});
 const width=new URL(_request.url).searchParams.get("w")==="384"?384:1280;
 const key=`${id}/${index}/${company.imageVersion}/${width}`;
 const saved=images.get(key);
 if(saved && Date.now()-saved.at<60*60_000)return new Response(saved.bytes,{headers});
 const response=await fetch(src,{signal:AbortSignal.timeout(15000)});
 const type=response.headers.get("content-type")||"";
 if(!response.ok||!type.startsWith("image/"))return new Response(null,{status:502});
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength>20*1024*1024)return new Response(null,{status:413});
 const optimized=await sharp(Buffer.from(bytes)).rotate().resize(width,width===384?280:undefined,{fit:width===384?"cover":"inside",position:"top",withoutEnlargement:true}).webp({quality:82}).toBuffer();
 const output=new Uint8Array(optimized);
 if(images.size>=40)images.delete(images.keys().next().value!);
 images.set(key,{bytes:output,at:Date.now()});
 return new Response(output,{headers});
 }catch{return new Response(null,{status:502});}
}

