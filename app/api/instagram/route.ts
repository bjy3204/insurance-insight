import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;

    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${token}`,
      {
        next: { revalidate: 3600 },
      }
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "instagram fetch failed" },
      { status: 500 }
    );
  }
}