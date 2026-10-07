"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MemoItem } from "@/lib/memos/model";
import { useMemoStorage } from "@/lib/memos/useMemoStorage";

type AuthContextType = {
  authUser: any;
  authNickname: string | null;
  authInstagram: string | null;
  authStatus: string | null;
  authRole: string | null;
  authCreatedAt: string | null;
  authLoading: boolean;
  refreshAuth: () => Promise<void>;
  memos: MemoItem[];
  saveMemos: (nextMemos: MemoItem[]) => void;
  persistMemos: (nextMemos: MemoItem[]) => Promise<void>;
  memosLoading: boolean;
  memosError: string;
  reloadMemos: () => void;
};

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  authNickname: null,
  authInstagram: null,
  authStatus: null,
  authRole: null,
  authCreatedAt: null,
  authLoading: true,
  refreshAuth: async () => {},
  memos: [],
  saveMemos: () => {},
  persistMemos: async () => {},
  memosLoading: true,
  memosError: "",
  reloadMemos: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authNickname, setAuthNickname] = useState<string | null>(null);
  const [authInstagram, setAuthInstagram] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authCreatedAt, setAuthCreatedAt] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { memos, saveMemos, persistMemos, memosLoading, memosError, reloadMemos } = useMemoStorage(authUser?.id || null, authStatus === "approved", authLoading);

const loadProfile = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname, instagram_id, status, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  console.log("profiles userId:", userId);
  console.log("profiles data:", profile);
  console.log("profiles error:", error);

  if (error) {
    console.error("profiles 조회 실패:", error);
    return;
  }

  if (!profile) {
    console.warn("profiles 데이터 없음:", userId);
    return;
  }

  setAuthNickname(profile.nickname || null);
  setAuthInstagram(profile.instagram_id || null);
  setAuthStatus(profile.status || null);
  setAuthRole(profile.role || null);
  setAuthCreatedAt(profile.created_at || null);

};

  const refreshAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    setAuthUser(user);
    if (user) {
      await loadProfile(user.id);
    } else {
      setAuthNickname(null);
      setAuthInstagram(null);
      setAuthStatus(null);
      setAuthRole(null);
      setAuthCreatedAt(null);
    }
  };

  useEffect(() => {
const initialize = async () => {
  setAuthLoading(true);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("getSession session:", session);
  console.log("getSession error:", error);

  const user = session?.user || null;
  setAuthUser(user);

  if (user) {
    await loadProfile(user.id);
  } else {
    setAuthNickname(null);
    setAuthInstagram(null);
    setAuthStatus(null);
    setAuthRole(null);
    setAuthCreatedAt(null);
  }

  setAuthLoading(false);
};

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "USER_UPDATED" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;



    // refresh token 만료 시 자동 로그아웃
if (!session) {
  setAuthUser(null);
  setAuthNickname(null);
  setAuthInstagram(null);
  setAuthStatus(null);
  setAuthRole(null);
  setAuthCreatedAt(null);
  return;
}


    const user = session.user;
    setAuthUser(user);
    loadProfile(user.id);
  }
);


    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, authNickname, authInstagram, authStatus, authRole, authCreatedAt, authLoading, refreshAuth, memos, saveMemos, persistMemos, memosLoading, memosError, reloadMemos }}>
      {children}
    </AuthContext.Provider>
  );
}
