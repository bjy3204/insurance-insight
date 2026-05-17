import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET() {
  try {
    if (!process.env.NOTION_INSTRUCTOR_DATABASE_ID) {
      throw new Error("NOTION_INSTRUCTOR_DATABASE_ID가 없습니다.");
    }

    const response = await (notion as any).dataSources.query({
  data_source_id: process.env.NOTION_INSTRUCTOR_DATABASE_ID as string,
});

    const instructors = response.results
      
     .map((page: any) => {
  const props = page.properties;
console.log(JSON.stringify(page.properties, null, 2));
  return {
    id: page.id,

    name:
      props["이름"]?.title?.[0]?.plain_text ||
      props["이름"]?.title?.[0]?.text?.content ||
      "",

    area:
      props["지역"]?.rich_text?.[0]?.plain_text ||
      props["지역"]?.rich_text?.[0]?.text?.content ||
      "",

    category:
      props["분야"]?.rich_text?.[0]?.plain_text ||
      props["분야"]?.rich_text?.[0]?.text?.content ||
      "",

    desc:
      props["소개"]?.rich_text?.[0]?.plain_text ||
      props["소개"]?.rich_text?.[0]?.text?.content ||
      "",

    instagram:
      props["SNS"]?.url || "",

    openchat:
      props["문의링크"]?.url || "",

    image:
      props["프로필 사진"]?.files?.[0]?.file?.url ||
      props["프로필 사진"]?.files?.[0]?.external?.url ||
      "",
  };
});

    return NextResponse.json(instructors);
  } catch (error: any) {
    console.error("강사 API 오류:", error);

    return NextResponse.json(
      {
        error: "강사 데이터를 불러오지 못했습니다.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}