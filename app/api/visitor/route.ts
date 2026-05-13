import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const total = await redis.incr("visitor:total");
  const todayCount = await redis.incr(`visitor:today:${today}`);

  return NextResponse.json({
    today: todayCount,
    total,
  });
}