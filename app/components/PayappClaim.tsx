"use client";
import { useEffect, useState } from "react";
import AuthNotice from "@/components/AuthNotice";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

export default function PayappClaim() {
  const { authUser, authInstagram, refreshAuth } = useAuth();
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!authUser || !authInstagram) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function claim(attempt: number) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || stopped) return;
        const response = await fetch("/api/payapp/claim", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
        const result = await response.json();
        if (stopped) return;
        if (result.state === "linked") await refreshAuth();
        else if (result.state === "pending" && attempt < 12) timer = setTimeout(() => void claim(attempt + 1), 5000);
        else if (result.state === "identity_mismatch") setNotice("결제할 때 입력한 인스타그램 아이디와 가입한 아이디가 다릅니다. 관리자에게 결제 연결을 요청해 주세요.");
        else if (result.state === "pending") setNotice("결제완료 확인이 지연되고 있습니다. 다시 결제하지 말고 관리자에게 확인해 주세요.");
        else if (["conflict", "review"].includes(result.state)) setNotice("결제와 회원정보 연결에 관리자 확인이 필요합니다.");
      } catch { /* A later sign-in can retry; never approve based on the redirect. */ }
    }
    void claim(0);
    return () => { stopped = true; clearTimeout(timer); };
  // Refreshing profile state must not restart a completed claim.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, authInstagram]);
  return notice ? <AuthNotice message={notice} onClose={() => setNotice("")} /> : null;
}
