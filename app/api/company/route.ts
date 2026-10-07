import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/company/data";
export async function GET() {
 try {
 const data=await getCompanies();
 const companies=data.map(company=>({...company,image:company.image.map((_:string,index:number)=>`/api/company/image/${company.id}/${index}?v=${encodeURIComponent(company.imageVersion)}`)}));
 return NextResponse.json(companies,{headers:{"Cache-Control":"public, max-age=60, s-maxage=60"}});
 }catch{return NextResponse.json({error:"조직 데이터를 불러오지 못했습니다."},{status:500});}
}
