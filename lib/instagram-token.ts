import { Redis } from "@upstash/redis";
import { createHash, randomUUID } from "node:crypto";

type TokenRecord = { accessToken: string; refreshedAt: number; expiresAt: number };
const REFRESH_INTERVAL = 30 * 24 * 60 * 60 * 1000;

function configuration() {
  const seed = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!seed) throw new Error("Instagram token is not configured");
  // Manual environment token replacement starts a separate record.
  const fingerprint = createHash("sha256").update(seed).digest("hex");
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { seed, key: `instagram:token:${fingerprint}`, redis: url && token ? new Redis({ url, token }) : null };
}

export async function getInstagramToken(): Promise<string> {
  const { seed, key, redis } = configuration();
  if (!redis) return seed;
  // Storage failures must not silently revert to a possibly expired seed.
  const record = await redis.get<TokenRecord>(key);
  return record?.accessToken ?? seed;
}

export async function refreshInstagramToken() {
  const { seed, key, redis } = configuration();
  if (!redis) throw new Error("Instagram token storage is not configured");
  const lockKey = `${key}:lock`;
  const lockId = randomUUID();
  if (!await redis.set(lockKey, lockId, { nx: true, ex: 60 })) return { status: "busy" };
  try {
    const record = await redis.get<TokenRecord>(key);
    const now = Date.now();
    if (record && now - record.refreshedAt < REFRESH_INTERVAL && record.expiresAt > now + 7 * 86400000) {
      return { status: "not_due", expiresAt: new Date(record.expiresAt).toISOString() };
    }
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", record?.accessToken ?? seed);
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    if (!res.ok || typeof data.access_token !== "string" || !data.access_token || typeof data.expires_in !== "number" || data.expires_in <= 0) {
      // Never include Meta response bodies or request URLs in logs/errors.
      throw new Error("Instagram token refresh failed");
    }
    const expiresAt = Date.now() + data.expires_in * 1000;
    await redis.set<TokenRecord>(key, { accessToken: data.access_token, refreshedAt: Date.now(), expiresAt });
    return { status: "refreshed", expiresAt: new Date(expiresAt).toISOString() };
  } finally {
    await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", [lockKey], [lockId]);
  }
}
