"use client";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

export default function PayappClaim() {
  const { authUser, authInstagram, refreshAuth } = useAuth();
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
        else if (result.state === "pending" && attempt < 6) timer = setTimeout(() => void claim(attempt + 1), 5000);
      } catch { /* A later sign-in can retry; never approve based on the redirect. */ }
    }
    void claim(0);
    return () => { stopped = true; clearTimeout(timer); };
  // Refreshing profile state must not restart a completed claim.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, authInstagram]);
  return null;
}
