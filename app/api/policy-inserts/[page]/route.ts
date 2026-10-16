import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hasCompletedMembership } from "@/lib/auth/membership";
import { isTemplateId, TEMPLATES } from "@/app/policy-inserts/model";

export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ page: string }> }) {
  const { page } = await context.params;
  const category = request.nextUrl.searchParams.get("category") || "family";
  const petIcon = category === "pet" && (page === "dog" || page === "cat");
  if (!isTemplateId(category) || (!petIcon && (!/^(?:[1-9]|10)$/.test(page) || Number(page) > TEMPLATES[category].titles.length))) return new NextResponse(null, { status: 404 });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "로그인해 주세요." }, { status: 401 });
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return new NextResponse(null, { status: 401 });
    const { data: profile, error: profileError } = await db.from("profiles").select("nickname,instagram_id,role,status").eq("id", user.id).maybeSingle();
    if (profileError || !hasCompletedMembership(profile) || (profile?.status !== "approved" && profile?.role !== "admin")) return new NextResponse(null, { status: 403 });
    const bytes = await readFile(path.join(process.cwd(), "assets", "policy-inserts", category, `${page}.png`));
    return new NextResponse(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "이미지를 불러오지 못했습니다. 다시 시도해 주세요." }, { status: 503 });
  }
}
