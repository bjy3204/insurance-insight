import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hit = searchParams.get("hit");

    const today = new Date().toISOString().slice(0, 10);

    const todayKey = `visitor:today:${today}`;
    const totalKey = "visitor:total";

    let todayCount = 0;
    let total = 0;

    if (hit === "1") {
      total = await redis.incr(totalKey);
      todayCount = await redis.incr(todayKey);
    } else {
      total = (await redis.get<number>(totalKey)) || 0;
      todayCount = (await redis.get<number>(todayKey)) || 0;
    }

    return NextResponse.json({
      today: todayCount,
      total,
    });
  } catch (error) {
    console.error("visitor api error:", error);

    return NextResponse.json({
      today: 0,
      total: 0,
    });
  }
}