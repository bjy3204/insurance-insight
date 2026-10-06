import { NextResponse } from "next/server";
import { refreshInstagramToken } from "@/lib/instagram-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await refreshInstagramToken(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Instagram token refresh failed; check server configuration and token validity" }, { status: 503 });
  }
}
