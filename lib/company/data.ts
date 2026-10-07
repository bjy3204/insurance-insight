import "server-only";
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_TOKEN });
let cache: {data:Awaited<ReturnType<typeof queryCompanies>>;at:number}|null=null;
let pending:ReturnType<typeof queryCompanies>|null=null;
async function queryCompanies() {
    const response = await notion.dataSources.query({
      data_source_id:
        process.env.NOTION_COMPANY_DATABASE_ID as string,
    });

    return response.results
      .filter(
        (page: any) =>
          page.properties["승인"]?.checkbox === true
      )
      .map((page: any) => ({
        id: page.id,
        imageVersion: page.last_edited_time,

        company:
          page.properties["회사명"]?.title?.[0]
            ?.plain_text || "",

        organization:
          page.properties["조직명"]?.rich_text?.[0]
            ?.plain_text || "",

        description:
          page.properties["조직소개"]?.rich_text?.[0]
            ?.plain_text || "",

        region:
          page.properties["지역"]?.rich_text?.[0]
            ?.plain_text || "",

        manager:
          page.properties["이름"]?.rich_text?.[0]
            ?.plain_text || "",

        phone:
  page.properties["연락처"]?.phone_number ||
  page.properties["연락처"]?.rich_text?.[0]?.plain_text ||
  page.properties["연락처"]?.url ||
  "",

        website:
  page.properties["홈페이지 URL"]?.url ||
  page.properties["홈페이지URL"]?.url ||
  page.properties["홈페이지"]?.url ||
  page.properties["홈페이지 URL"]?.rich_text?.[0]?.plain_text ||
  page.properties["홈페이지URL"]?.rich_text?.[0]?.plain_text ||
  page.properties["홈페이지"]?.rich_text?.[0]?.plain_text ||
  "",

        memo:
          page.properties["보험나무 메모"]?.rich_text?.[0]
            ?.plain_text || "",

        

       image:
  page.properties["소개 이미지"]?.files?.map((file: any) =>
    file.type === "external"
      ? file.external.url
      : file.file.url
  ) || [],
      }));

}
export async function getCompanies() {
 if(cache && Date.now()-cache.at<60_000)return cache.data;
 if(!pending)pending=queryCompanies().then(data=>{cache={data,at:Date.now()};return data;}).finally(()=>{pending=null});
 return pending;
}
