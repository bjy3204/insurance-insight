"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MemoItem } from "./model";
import { loadMemberMemos, persistMemberMemos } from "./storage";

export function useMemoStorage(userId: string | null, approved: boolean, authLoading: boolean) {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const snapshot = useRef<MemoItem[]>([]);
  const generation = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const reloadMemos = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const token = ++generation.current;
    setReady(false); setError(""); setMemos([]); snapshot.current = [];
    if (authLoading) return;
    const load = async () => {
      try {
        const next = approved && userId ? await loadMemberMemos(supabase, userId) : JSON.parse(localStorage.getItem("personalMemos") || "[]");
        if (!Array.isArray(next)) throw new Error("메모 형식을 확인하지 못했습니다.");
        if (generation.current === token) { snapshot.current = next; setMemos(next); setReady(true); }
      } catch { if (generation.current === token) setError("메모를 불러오지 못했습니다. 다시 시도해 주세요."); }
    };
    void load();
    return () => { generation.current++; };
  }, [userId, approved, authLoading, revision]);
  useEffect(() => {
    const storage = (event: StorageEvent) => { if (!approved && event.key === "personalMemos") reloadMemos(); };
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, [approved, reloadMemos]);
  const persistMemos = (next: MemoItem[]): Promise<void> => {
    const token = generation.current;
    if (!ready) return Promise.reject(new Error("메모를 불러온 뒤 다시 시도해 주세요."));
    const base = snapshot.current;
    const removed = new Set(base.filter(m => !next.some(n => n.id === m.id)).map(m => m.id));
    const changed = next.filter(m => JSON.stringify(base.find(b => b.id === m.id)) !== JSON.stringify(m));
    const operation = queue.current.catch(() => {}).then(async () => {
      if (generation.current !== token) throw new Error("로그인 상태가 변경되었습니다.");
      try {
        const combined = snapshot.current.filter(m => !removed.has(m.id)).map(m => changed.find(n => n.id === m.id) || m);
        combined.push(...changed.filter(m => !combined.some(n => n.id === m.id)));
        if (approved && userId) await persistMemberMemos(supabase, userId, snapshot.current, combined);
        else localStorage.setItem("personalMemos", JSON.stringify(combined));
        if (generation.current === token) { snapshot.current = combined; setMemos(combined); setError(""); }
      } catch (failure) { if (generation.current === token) setError("메모를 저장하지 못했습니다. 내용을 확인한 뒤 다시 시도해 주세요."); throw failure; }
    });
    queue.current = operation;
    return operation;
  };
  const saveMemos = (next: MemoItem[]) => { void persistMemos(next).catch(() => {}); };
  return { memos, saveMemos, persistMemos, memosLoading: !ready && !error, memosError: error, reloadMemos };
}
