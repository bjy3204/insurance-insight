"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const hashParams = new URLSearchParams(
        window.location.hash.replace("#", "")
      );
      const queryParams = new URLSearchParams(window.location.search);

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const mode = queryParams.get("mode");
      const uid = queryParams.get("uid");

      // 카카오 연결 모드
      if (mode === "connect" && uid) {
        const kakaoId = user.id;
        await supabase.auth.signOut();

        const { error } = await supabase
          .from("profiles")
          .update({ kakao_connected: true, kakao_uid: kakaoId })
          .eq("id", uid);

        if (error) {
          alert("카카오 연결에 실패했습니다.");
        } else {
          alert("카카오 연결이 완료되었습니다.");
        }

        router.replace("/");
        return;
      }

      // 카카오 로그인 모드 - kakao_connected 체크
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, kakao_connected")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.kakao_connected) {
        await supabase.auth.signOut();
        alert(
          "카카오가 연결된 계정이 없습니다.\n이메일로 회원가입 후 개인설정에서 카카오를 연결해 주세요."
        );
        router.replace("/");
        return;
      }

      router.replace("/");
    };

    run();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">로그인 처리중...</p>
    </div>
  );
}
