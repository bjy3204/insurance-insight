"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

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
  const [memos, setMemos] = useState<MemoItem[]>([]);

  const loadProfile = async (userId: string) => {
       const { data: profile, error } = await supabase
      .from("profiles")
            .select("nickname, instagram_id, status, role, created_at")

      .eq("id", userId)
      .maybeSingle();

    


    setAuthNickname(profile?.nickname || null);
    setAuthInstagram(profile?.instagram_id || null);
    setAuthStatus(profile?.status || null);
    setAuthRole(profile?.role || null);
    setAuthCreatedAt(profile?.created_at || null);

        if (profile?.status === "approved") {
      const { data: dbMemos } = await supabase
        .from("user_memos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      setMemos((dbMemos as MemoItem[]) || []);
    } else {
      const savedMemos = localStorage.getItem("personalMemos");
      setMemos(savedMemos ? JSON.parse(savedMemos) : []);
    }

  };


  
    const saveMemos = (nextMemos: MemoItem[]) => {
    setMemos(nextMemos);
    if (authUser && authStatus === "approved") {
      const prev = nextMemos;
      // 삭제된 메모 처리
      supabase.from("user_memos").select("id").eq("user_id", authUser.id).then(({ data: existing }) => {
        const existingIds = (existing || []).map((r: any) => r.id);
        const nextIds = prev.map(m => m.id);
        const toDelete = existingIds.filter((id: string) => !nextIds.includes(id));
        if (toDelete.length > 0) {
          supabase.from("user_memos").delete().in("id", toDelete).then();
        }
      });
      // upsert
      prev.forEach(memo => {
        supabase.from("user_memos").upsert({
          id: memo.id,
          user_id: authUser.id,
          title: memo.title,
          content: memo.content,
          pinned: memo.pinned,
          visible: memo.visible,
          color: memo.color,
          x: memo.x,
          y: memo.y,
          updated_at: new Date().toISOString(),
        }).then();
      });
    } else {
      localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
      window.dispatchEvent(new Event("memo-storage-updated"));
    }
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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setAuthUser(user);
      if (user) {
        await loadProfile(user.id);
      }
      setAuthLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "USER_UPDATED" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
        const user = session?.user || null;
        setAuthUser(user);
        if (user) {
          loadProfile(user.id);
        } else {
          setAuthNickname(null);
          setAuthInstagram(null);
          setAuthStatus(null);
          setAuthRole(null);
          setAuthCreatedAt(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, authNickname, authInstagram, authStatus, authRole, authCreatedAt, authLoading, refreshAuth, memos, saveMemos }}>
      {children}
    </AuthContext.Provider>
  );
}
