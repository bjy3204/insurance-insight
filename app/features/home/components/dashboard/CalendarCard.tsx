"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, ArrowLeft, Bell, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardDialog from "./DashboardDialog";
import CalendarEventModal from "@/app/components/calendar/CalendarEventModal";
import ReminderSettings from "./ReminderSettings";
import { CALENDAR_UPDATED, LOCAL_EVENTS_KEY, koreaDate, type CalendarEvent as Event } from "./reminder-utils";
import { readLocalEvents, saveLocalEvents, calendarUpdated } from "./calendar-storage";
import styles from "./DashboardCards.module.css";

const colors: Record<string, string> = { white: "#a1aec1", blue: "#176bff", red: "#fa4268", green: "#13ad88", yellow: "#e9ad18" };
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const emptyEvent = (date: string): Event => ({ id: "", title: "", content: "", date, time: "", place: "", memo: "", icon: "📅", color: "blue" });

export default function CalendarCard({ userId, approved, loading }: { userId: string | null; approved: boolean; loading: boolean }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => koreaDate());
  const [listDate, setListDate] = useState<string | null>(null);
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadedOwner, setLoadedOwner] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Event | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const cloud = Boolean(userId && approved);
  const owner = loading ? "loading" : cloud ? `cloud:${userId}` : `local:${userId ?? "visitor"}`;
  const currentOwner = useRef(owner);
  useEffect(() => { currentOwner.current = owner; }, [owner]);
  const ready = !loading && loadedOwner === owner;

  useEffect(() => {
    let active = true;
    if (loading) return () => { active = false; };
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      setError("");
      try {
        let records: Event[];
        if (cloud) {
          const { data, error: loadError } = await supabase.from("calendar_events").select("*").eq("user_id", userId!).order("date", { ascending: true });
          if (loadError) throw loadError;
          records = data || [];
        } else records = readLocalEvents();
        if (active) { setEvents(records); setLoadedOwner(owner); }
      } catch { if (active) setError(cloud ? "계정 일정을 불러오지 못했습니다. 다시 시도해 주세요." : "로컬 일정을 읽지 못했습니다. 브라우저 저장 설정을 확인해 주세요."); }
    };
    void load();
    const reload = () => void load();
    const onStorage = (e: StorageEvent) => { if (e.key === LOCAL_EVENTS_KEY) reload(); };
    window.addEventListener("focus", reload);
    window.addEventListener(CALENDAR_UPDATED, reload);
    if (!cloud) window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("focus", reload); window.removeEventListener("storage", onStorage); window.removeEventListener(CALENDAR_UPDATED, reload); };
  }, [owner, cloud, userId, loading, refresh]);
  useEffect(() => {
    if (!draft) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) setDraft(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [draft, saving]);
  const visibleEvents = ready ? events : [];
  const save = async (remove = false) => {
    if (!draft || saving || !ready) return;
    if (!remove && (!draft.title.trim() || !draft.date)) { setFormError("일정 제목과 날짜를 입력해 주세요."); return; }
    if (!remove && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || dateKey(new Date(`${draft.date}T12:00:00`)) !== draft.date)) { setFormError("날짜를 YYYY-MM-DD 형식으로 정확히 입력해 주세요."); return; }
    const operationOwner = owner;
    setSaving(true); setFormError("");
    try {
      let next: Event[];
      const { id, ...fields } = draft;
      const payload = { title: fields.title.trim(), date: fields.date, content: fields.content || "", icon: fields.icon, color: fields.color, time: fields.time || null, place: fields.place || null, memo: fields.memo || null };
      if (cloud) {
        const request = remove
          ? supabase.from("calendar_events").delete().eq("id", id).eq("user_id", userId!).select("id")
          : id
            ? supabase.from("calendar_events").update(payload).eq("id", id).eq("user_id", userId!).select("*")
            : supabase.from("calendar_events").insert({ ...payload, user_id: userId! }).select("*");
        const { data, error: saveError } = await request;
        if (saveError || !data?.length) throw saveError || new Error("No saved record");
        next = remove ? events.filter(e => e.id !== id) : [...events.filter(e => e.id !== id), data[0] as Event];
      } else {
        const existing = readLocalEvents();
        next = remove ? existing.filter(e => e.id !== id) : [...existing.filter(e => e.id !== id), { ...payload, id: id || crypto.randomUUID() }];
        saveLocalEvents(next);
      }
      if (currentOwner.current === operationOwner) { setEvents(next); setDraft(null); setConfirmDelete(false); if (!remove) { setSelected(draft.date); setListDate(draft.date); const date = new Date(`${draft.date}T12:00:00`); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); } calendarUpdated(); }
    } catch {
      if (currentOwner.current === operationOwner) setFormError(cloud ? "계정에 저장하지 못했습니다. 로컬에는 저장하지 않았습니다. 다시 시도해 주세요." : "브라우저에 저장하지 못했습니다. 저장 공간과 설정을 확인해 주세요.");
    } finally { setSaving(false); }
  };
  const offset = month.getDay();
  // Reserve six weeks consistently so the schedule list never changes the card height.
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const dayEvents = visibleEvents.filter(e => e.date === selected).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const open = (event: Event) => { setDraft({ ...event }); setFormError(""); setConfirmDelete(false); };
  const closeDraft = useCallback(() => { if (!saving) setDraft(null); }, [saving]);
  const closeReminder = useCallback(() => setReminderEvent(null), []);
  const today = koreaDate();
  return <article className={`${styles.card} ${styles.calendarCard}`} aria-label="내 일정 캘린더" data-calendar-card>
    {listDate ? <>
      <div className={styles.heading}><button className={styles.iconButton} aria-label="달력으로 돌아가기" onClick={() => setListDate(null)}><ArrowLeft /></button><h2>{Number(listDate.slice(5, 7))}월 {Number(listDate.slice(8))}일</h2><button className={styles.iconButton} aria-label="일정 추가" title="일정 추가" disabled={!ready || saving} onClick={() => open(emptyEvent(listDate))}><Plus /></button></div>
      <div className={`${styles.scheduleList} ${styles.scroll}`}>
        {dayEvents.length ? dayEvents.map(event => <div key={event.id} className={styles.event} onDoubleClick={e => { if (!saving && !(e.target as HTMLElement).closest("button")) open(event); }}>
          <div className={styles.eventSummary}><span>{event.icon || "📅"}</span><span className={styles.eventTitle} title={event.title}>{event.title}</span><span className={styles.eventTime}>{event.time || "종일"}</span>{event.place && <span className={styles.eventPlace} title={event.place}>{event.place}</span>}</div>
          <div className={styles.eventActions}><button onClick={() => setReminderEvent(event)} disabled={saving} aria-label={`${event.title} 알림`} title="알림 설정"><Bell /></button><button onClick={() => open(event)} disabled={saving} aria-label={`${event.title} 수정`} title="수정"><Pencil /></button><button onClick={() => { open(event); setConfirmDelete(true); }} disabled={saving} aria-label={`${event.title} 삭제`} title="삭제"><Trash2 /></button></div>
        </div>) : <p className={styles.empty}>일정이 없습니다.</p>}
      </div>
    </> : <>
    <div className={styles.heading}><h2><CalendarDays />{month.getFullYear()}년 {month.getMonth() + 1}월</h2><div className={styles.actions}>
      <button className={styles.iconButton} aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
      <button className={styles.iconButton} aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
      <button className={styles.smallButton} onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelected(today); }}>오늘</button>
    </div></div>
    <div className={styles.calendarBody}><div className={styles.week}>{["일", "월", "화", "수", "목", "금", "토"].map((name, i) => <span key={name} className={i === 0 ? styles.sunday : i === 6 ? styles.saturday : ""}>{name}</span>)}</div>
    <div className={styles.days}>{days.map((date, i) => {
      const key = dateKey(date);
      const entries = visibleEvents.filter(e => e.date === key);
      return <button key={key} disabled={!ready} aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${entries.length ? `, 일정 ${entries.length}개` : ""}`} aria-pressed={selected === key} className={[styles.day, i % 7 === 0 ? styles.sunday : i % 7 === 6 ? styles.saturday : "", date.getMonth() !== month.getMonth() ? styles.outside : "", selected === key ? styles.selected : "", today === key ? styles.today : ""].join(" ")} onClick={() => { setSelected(key); setListDate(key); }}>{date.getDate()}<span className={styles.dots}>{Array.from(new Set(entries.map(e => e.color))).slice(0, 3).map(color => <span key={color} className={styles.dot} style={{ background: colors[color] || colors.blue }} />)}</span></button>;
    })}</div>
    </div>{error && <div className={styles.status} role="status">{error} <button onClick={() => setRefresh(v => v + 1)}>다시 시도</button></div>}
    </>}
    {reminderEvent && ready && <ReminderSettings event={reminderEvent} userId={cloud ? userId : null} onClose={closeReminder} />}
    {draft && ready && !confirmDelete && <CalendarEventModal editingEvent={Boolean(draft.id)} formData={{ title:draft.title, content:draft.content || "", date:draft.date, time:draft.time || "", place:draft.place || "", memo:draft.memo || "", icon:draft.icon, color:draft.color }} setFormData={value => setDraft({...draft,...value})} onClose={closeDraft} onSave={() => void save()} onDelete={() => setConfirmDelete(true)} saving={saving} error={formError} />}
    {draft && ready && confirmDelete && <DashboardDialog title="일정 삭제" onClose={closeDraft}><p>이 일정을 삭제할까요?</p>{formError && <p className={styles.error} role="alert">{formError}</p>}<div className={styles.formActions}><button className={styles.secondary} disabled={saving} onClick={closeDraft}>취소</button><button className={styles.primary} disabled={saving} onClick={() => void save(true)}>삭제</button></div></DashboardDialog>}
  </article>;
}
