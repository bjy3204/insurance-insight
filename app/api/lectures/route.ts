import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function GET() {
  try {
    if (!process.env.NOTION_LECTURE_DATABASE_ID) {
      throw new Error("NOTION_LECTURE_DATABASE_ID가 없습니다.");
    }

    const response = await (notion as any).dataSources.query({
      data_source_id: process.env.NOTION_LECTURE_DATABASE_ID,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lectures = response.results
      .filter((page: any) => {
        const approved = page.properties["승인"]?.checkbox === true;
        const date = page.properties["강의일"]?.date?.start;

        if (!approved || !date) return false;

        const lectureDate = new Date(date);
        lectureDate.setHours(0, 0, 0, 0);

        return lectureDate >= today;
      })
      .map((page: any) => {
        const props = page.properties;

        return {
          id: page.id,
          title: props["강의 제목"]?.title?.[0]?.plain_text || "",
          instructorName:
            props["강사명 (1)"]?.rich_text?.[0]?.plain_text || "",
          area: props["지역"]?.rich_text?.[0]?.plain_text || "",
          category:
  props["카테고리"]?.multi_select?.[0]?.name || "",

          date: props["강의일"]?.date?.start || "",
          time: props["강의 시간"]?.rich_text?.[0]?.plain_text || "",
          status:
  props["모집상태"]?.select?.name || "모집중",
          desc: props["강의 내용"]?.rich_text?.[0]?.plain_text || "",
          applyLink: props["신청링크"]?.url || "",
          images:
  props["상세 이미지"]?.files?.map((file: any) =>
    file.file?.url || file.external?.url
  ) || [],
        };
      });

    return NextResponse.json(lectures);
  } catch (error: any) {
    console.error("강의 API 오류:", error);

    return NextResponse.json(
      {
        error: "강의 데이터를 불러오지 못했습니다.",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}