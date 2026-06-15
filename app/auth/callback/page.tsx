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

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();

        alert(
          "가입된 계정이 없습니다.\n먼저 이메일로 회원가입 후 로그인한 뒤 카카오를 연결해 주세요."
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