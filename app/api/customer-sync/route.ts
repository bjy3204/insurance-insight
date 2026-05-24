// app/api/customer-sync/route.ts
// 구글 시트 Apps Script에서 호출하는 동기화 API

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 롤 키 (서버 전용)
);

export async function POST(req: NextRequest) {
  try {
    // 인증 헤더 확인 (Apps Script에서 전달하는 API 키)
    const authHeader = req.headers.get("x-api-key");
    if (!authHeader || authHeader !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { user_id, data } = body;

    if (!user_id || !Array.isArray(data)) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    // 기존 데이터 삭제 후 재삽입 (전체 동기화)
    const { error: deleteError } = await supabaseAdmin
      .from("customer_sync")
      .delete()
      .eq("user_id", user_id);

    if (deleteError) throw deleteError;

    // 새 데이터 삽입
    if (data.length > 0) {
      const insertData = data.map((item: any) => ({
        ...item,
        user_id,
        synced_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabaseAdmin
        .from("customer_sync")
        .insert(insertData);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `${data.length}명 동기화 완료`,
      synced_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
