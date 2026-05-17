import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

function getText(prop: any) {
  if (!prop) return "";

  if (prop.title) return prop.title[0]?.plain_text || "";
  if (prop.rich_text) return prop.rich_text[0]?.plain_text || "";
  if (prop.select) return prop.select.name || "";
  if (prop.multi_select) {
    return prop.multi_select.map((item: any) => item.name).join(", ");
  }
  if (prop.created_time) return prop.created_time;

  return "";
}

export async function GET() {
  try {
    if (!process.env.NOTION_REVIEW_DATABASE_ID) {
      throw new Error("NOTION_REVIEW_DATABASE_ID가 없습니다.");
    }

    const response = await (notion as any).dataSources.query({
      data_source_id: process.env.NOTION_REVIEW_DATABASE_ID,
    });

    const reviews = response.results
      .map((page: any) => {
        const props = page.properties || {};

        return {
          id: page.id || "",
          lectureTitle: getText(props["어떤 강의를 수강하셨나요?"]) || "",
          writer:
            getText(props["이름"]) ||
            getText(props["성함"]) ||
            "",
          content: getText(props["후기"]) || "",
          rating: getText(props["평점"]) || "⭐️⭐️⭐️⭐️⭐️",
          date: getText(props["제출 시간"]) || page.created_time || "",
          visible: props["승인"]?.checkbox === true,
        };
      })
      .filter((item: any) => item.visible);

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("후기 API 오류:", error);

    return NextResponse.json(
      {
        error: "후기 데이터를 불러오지 못했습니다.",
        detail: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}