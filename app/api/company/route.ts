import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET() {
  try {
    const response = await notion.dataSources.query({
      data_source_id:
        process.env.NOTION_COMPANY_DATABASE_ID as string,
    });

    const companies = response.results
      .filter(
        (page: any) =>
          page.properties["승인"]?.checkbox === true
      )
      .map((page: any) => ({
        id: page.id,

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
          page.properties["소개 이미지"]?.files?.[0]
            ?.file?.url ||
          page.properties["소개 이미지"]?.files?.[0]
            ?.external?.url ||
          "",
      }));

    return NextResponse.json(companies);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "조직 데이터를 불러오지 못했습니다.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}