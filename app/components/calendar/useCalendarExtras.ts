"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calendarUpdated } from "@/app/features/home/components/dashboard/calendar-storage";
import { CALENDAR_UPDATED } from "@/app/features/home/components/dashboard/reminder-utils";
import type { SheetCalendarEvent } from "@/lib/google/sheet-calendar-model";

import {useCrmCalendar} from "@/app/notion-crm/CrmCalendarContext";
import {buildCrmCalendar} from "@/lib/notion-crm/calendar";
type Identity = { userId: string | null; approved: boolean };
type CompletionMap = Record<string, boolean>;
const localKey = "insurance-calendar-completed-v1";
const normalize = (value: unknown): CompletionMap => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([key, completed]) => /^(event:|sheet:)[\w-]{1,128}$/.test(key) && completed === true)) : {};

export default function useCalendarExtras(identity: Identity, month: Date, active: boolean) {
  const { userId, approved } = identity;
  const crm=useCrmCalendar();
  const usingCrm=!!crm;
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const first = new Date(Date.UTC(year, monthIndex, 1 - new Date(year, monthIndex, 1).getDay()));
  const from = first.toISOString().slice(0, 10), to = new Date(first.getTime() + 41 * 86400000).toISOString().slice(0, 10);
  const [sheetEvents, setSheetEvents] = useState<SheetCalendarEvent[]>([]);
  const [customerEvents,setCustomerEvents]=useState<SheetCalendarEvent[]>([]);
  const [customerError,setCustomerError]=useState("");
  const [sheetError, setSheetError] = useState("");
  const [needsConnection, setNeedsConnection] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [completed, setCompleted] = useState<CompletionMap>({});
  const [completionReady, setCompletionReady] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [completionBusy, setCompletionBusy] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const owner = `${approved}:${userId || "local"}`;
  const ownerRef = useRef(owner); ownerRef.current = owner;
  const [refresh, setRefresh] = useState(0);
  useEffect(()=>{
    setCustomerEvents([]);setCustomerError("");
    if(usingCrm||!active||!approved||!userId)return;
    let stopped=false;
    const controller=new AbortController();
    const load=async()=>{
      try{
        const {data:{session}}=await supabase.auth.getSession();
        if(!session||session.user.id!==userId)return;
        const response=await fetch(`/api/customers?${new URLSearchParams({view:"calendar",from,to})}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store",signal:controller.signal});
        const result=await response.json();
        if(!response.ok)throw new Error("고객 일정을 불러오지 못했습니다");
        if(!stopped){setCustomerEvents(result.events||[]);setCustomerError("");}
      }catch{if(!stopped)setCustomerError("고객 일정을 불러오지 못했습니다");}
    };
    void load();window.addEventListener("focus",load);window.addEventListener("customer-schedules-updated",load);
    return()=>{stopped=true;controller.abort();window.removeEventListener("focus",load);window.removeEventListener("customer-schedules-updated",load);};
  },[active,approved,userId,from,to,refresh,usingCrm]);
  useEffect(() => {
    const report = (event: Event) => { const message = (event as CustomEvent<string>).detail; setSheetError(message); if (message) setNeedsConnection(true); };
    window.addEventListener("insurance-sheet-calendar-error", report);
    return () => window.removeEventListener("insurance-sheet-calendar-error", report);
  }, []);

  useEffect(() => {
    if (usingCrm || !active || !approved || !userId) { setSheetEvents([]); setSheetError(""); setNeedsConnection(false); return; }
    let stopped = false;
    let controller: AbortController | undefined;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      setSheetLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw Error("자동 일정을 확인하려면 다시 로그인해 주세요");
        const response = await fetch(`/api/google/calendar?${new URLSearchParams({ from, to })}`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal });
        const result = await response.json();
        if (stopped || signal.aborted) return;
        setSheetEvents(response.ok ? result.events || [] : []);
        setNeedsConnection(!!result.needsConnection);
        setSheetError(result.error || "");
      } catch (error) {
        if (!stopped && !signal.aborted) { setSheetEvents([]); setSheetError(error instanceof Error ? error.message : "자동 일정을 불러오지 못했습니다"); }
      } finally { if (!stopped && !signal.aborted) setSheetLoading(false); }
    };
    void load();
    window.addEventListener("focus", load);
    window.addEventListener("insurance-sheet-calendar-updated", load);
    return () => { stopped = true; controller?.abort(); window.removeEventListener("focus", load); window.removeEventListener("insurance-sheet-calendar-updated", load); };
  }, [active, approved, userId, from, to, refresh,usingCrm]);

  useEffect(() => {
    let stopped = false;
    ++generation.current;
    setCompletionReady(false); setCompleted({}); setCompletionError("");
    const load = async () => {
      if (busy.current) return;
      const version = ++generation.current;
      try {
        let value: unknown;
        if (approved && userId) {
          const { data, error } = await supabase.from("customer_settings").select("calendar_completed").eq("user_id", userId).maybeSingle();
          if (error) throw error;
          value = data?.calendar_completed;
        } else value = JSON.parse(localStorage.getItem(localKey) || "{}");
        if (!stopped && version === generation.current) { setCompleted(normalize(value)); setCompletionReady(true); setCompletionError(""); }
      } catch { if (!stopped) setCompletionError("확인 상태를 불러오지 못했습니다"); }
    };
    void load();
    window.addEventListener(CALENDAR_UPDATED, load);
    window.addEventListener("focus", load);
    const storage = (event: StorageEvent) => { if (event.key === localKey) void load(); };
    if (!approved) window.addEventListener("storage", storage);
    return () => { stopped = true; window.removeEventListener(CALENDAR_UPDATED, load); window.removeEventListener("focus", load); window.removeEventListener("storage", storage); };
  }, [approved, userId,refresh]);

  const toggleCompleted = useCallback(async (key: string) => {
    if (busy.current || !completionReady) return;
    const before = completed, next = { ...completed };
    if (next[key]) delete next[key]; else next[key] = true;
    const requestOwner = ownerRef.current;
    busy.current = true; ++generation.current; setCompletionBusy(true); setCompleted(next); setCompletionError("");
    try {
      if (approved && userId) {
        const { error } = await supabase.rpc("set_calendar_event_completed", { p_key: key, p_completed: !!next[key] });
        if (error) throw error;
      } else localStorage.setItem(localKey, JSON.stringify(next));
      if (ownerRef.current === requestOwner) calendarUpdated();
    } catch { if (ownerRef.current === requestOwner) { setCompleted(before); setCompletionError("확인 상태를 저장하지 못했습니다 다시 시도해 주세요"); } }
    finally { busy.current = false; if (ownerRef.current === requestOwner) setCompletionBusy(false); }
  }, [approved, userId, completed, completionReady]);
  const connect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw Error("로그인이 필요합니다");
      const response = await fetch("/api/google/customer-sheet", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "calendar-connect" }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "일정 연결을 시작하지 못했습니다");
      window.location.assign(result.url);
    } catch (error) { setSheetError(error instanceof Error ? error.message : "일정 연결을 시작하지 못했습니다"); setConnecting(false); }
  };
  const crmEvents=useMemo(()=>crm&&approved?buildCrmCalendar(crm.data,from,to):[],[crm,approved,from,to]);
  return { sheetEvents:usingCrm?crmEvents:[...customerEvents,...sheetEvents], sheetError:usingCrm?"":sheetError||customerError, needsConnection:usingCrm?false:needsConnection, connect, connecting, sheetLoading, reloadSheet: () => crm?crm.reload():setRefresh(value => value + 1), completed, completionReady, completionBusy, completionError, toggleCompleted };
}
