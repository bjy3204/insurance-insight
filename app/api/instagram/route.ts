import { NextResponse } from "next/server";
import { getInstagramToken } from "@/lib/instagram-token";

export async function GET() {
  try {
    const token = await getInstagramToken();

    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${token}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await res.json();
    if (!res.ok || data.error) {
      return NextResponse.json({ error: "instagram fetch failed" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "instagram fetch failed" },
      { status: 500 }
    );
  }
}
