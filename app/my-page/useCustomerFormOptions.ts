"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { CUSTOMER_BANKS, CUSTOMER_CATEGORIES, CUSTOMER_INSURERS } from "./customer-form-fields";

export type CustomerOptionKind = "category" | "bank" | "insurer";
export const DEFAULT_CUSTOMER_OPTIONS: Record<CustomerOptionKind, readonly string[]> = { category: CUSTOMER_CATEGORIES, bank: CUSTOMER_BANKS, insurer: CUSTOMER_INSURERS };
type Options = Record<CustomerOptionKind, readonly string[]>;
export default function useCustomerFormOptions(active = true) {
  const { authUser } = useAuth();
  const userId: string | null = authUser?.id || null;
  const owner = useRef(userId); owner.current = userId;
  const busy = useRef(false);
  const [options, setOptions] = useState<Options>(DEFAULT_CUSTOMER_OPTIONS);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setReady(false); setOptions(DEFAULT_CUSTOMER_OPTIONS); setError("");
    if (!active || !userId) return;
    const load = async () => {
      try {
      const { data, error } = await supabase.from("customer_form_options").select("kind,options").eq("user_id", userId);
      if (cancelled) return;
      if (error) { setError("유입경로 목록을 불러오지 못했습니다"); return; }
      const next = { ...DEFAULT_CUSTOMER_OPTIONS };
      for (const row of data || []) if (row.kind in next && Array.isArray(row.options)) next[row.kind as CustomerOptionKind] = row.options.filter((value: unknown): value is string => typeof value === "string");
      setOptions(next); setReady(true);
      } catch { if (!cancelled) setError("목록을 불러오지 못했습니다 다시 시도해 주세요"); }
    };
    void load();
    return () => { cancelled = true; };
  }, [active, userId, revision]);
  const update = useCallback(async (kind: CustomerOptionKind, value: string, action: "add" | "remove") => {
    value = value.trim();
    if (!userId || !ready || busy.current || !value || value.length > 80) return false;
    const requestOwner = userId;
    busy.current = true; setSaving(true); setError("");
    try {
      const { data, error } = await supabase.rpc("update_customer_form_option", { p_kind: kind, p_value: value, p_action: action, p_defaults: [...DEFAULT_CUSTOMER_OPTIONS[kind]] });
      if (error || !Array.isArray(data) || data.some(value => typeof value !== "string")) throw error || Error("Invalid options");
      if (owner.current !== requestOwner) return false;
      setOptions(previous => ({ ...previous, [kind]: data }));
      return true;
    } catch {
      if (owner.current === requestOwner) setError("목록을 저장하지 못했습니다 다시 시도해 주세요");
      return false;
    } finally { busy.current = false; if (owner.current === requestOwner) setSaving(false); }
  }, [userId, ready]);
  return { options, ready, saving, error, update, reload: () => setRevision(value => value + 1) };
}
