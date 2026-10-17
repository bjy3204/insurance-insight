"use client";

import { hasCompletedMembership } from "@/lib/auth/membership";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [signupRequired, setSignupRequired] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.replace("#", ""));
      const query = new URLSearchParams(window.location.search);
      if (hash.get("error") || query.get("error")) {
        await supabase.auth.signOut();
        if ((hash.get("error_description") || query.get("error_description") || "").includes("email_signup_required")) setSignupRequired(true);
        else setMessage("카카오 인증에 실패했습니다 다시 시도해 주세요");
        return;
      }
      const access_token = hash.get("access_token"), refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) { setMessage("인증에 실패했습니다 다시 로그인해 주세요"); return; }
      }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.replace("/"); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles")
        .select("id, nickname, instagram_id, role, kakao_connected").eq("id", user.id).maybeSingle();
      if (profileError) { setMessage("회원정보를 확인하지 못했습니다 잠시 후 다시 시도해 주세요"); return; }
      // Authentication alone is not a completed site membership.
      if (!hasCompletedMembership(profile)) { setSignupRequired(true); return; }
      const kakao = user.identities?.filter(identity => identity.provider === "kakao") || [];
      if (kakao.length === 0 && user.identities?.some(identity => identity.provider === "email")) { router.replace("/"); return; }
      if (kakao.length !== 1) {
        await supabase.auth.signOut();
        setMessage("연결된 카카오 계정을 확인할 수 없습니다 이메일로 로그인해 주세요");
        return;
      }
      if (!profile?.kakao_connected) {
        const { error: saveError } = await supabase.from("profiles").update({ kakao_connected: true }).eq("id", user.id);
        if (saveError) { setMessage("카카오 연결 상태를 저장하지 못했습니다 다시 시도해 주세요"); return; }
      }
      router.replace("/");
    };
    void run().catch(() => setMessage("로그인 처리에 실패했습니다 다시 시도해 주세요"));
  }, [router]);
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    {signupRequired ? <div data-popup-small="true" role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h1 data-popup-heading="true" className="text-lg font-bold text-gray-900">회원가입 안내</h1>
      <p className="mt-3 text-sm text-gray-600">회원가입을 진행해 주세요</p>
      <button data-popup-action="true" className="mt-5 h-11 w-full rounded-xl bg-blue-600 text-white font-bold cursor-pointer" onClick={() => router.replace("/?complete_signup=1")}>확인</button>
    </div> : message ? <div className="text-center"><p className="text-sm text-gray-600">{message}</p><button className="mt-4 text-blue-600 cursor-pointer" onClick={() => router.replace("/")}>돌아가기</button></div> : <p className="text-sm text-gray-500">로그인 처리중...</p>}
  </div>;
}
