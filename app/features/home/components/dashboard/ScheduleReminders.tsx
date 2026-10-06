"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { acknowledgeReminders, loadReminders, readLocalEvents } from "./calendar-storage";
import { CALENDAR_UPDATED, LOCAL_EVENTS_KEY, LOCAL_REMINDERS_KEY, dueReminders, koreaDate, type CalendarEvent } from "./reminder-utils";
import { lockPageScroll } from "./DashboardDialog";
import styles from "./DashboardCards.module.css";

// In-memory only: internal navigation does not repeat a popup; a full reload starts a new visit.
const shownThisVisit = new Set<string>();
type Due = ReturnType<typeof dueReminders>;

function ReminderPopup({ items, desktop, onConfirm, busy, error }: { items: Due; desktop: boolean; onConfirm: () => void; busy: boolean; error: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | undefined>();
  useEffect(() => {
    const update = () => {
      const anchor = desktop ? document.querySelector("[data-calendar-card]") : null;
      const rect = anchor?.getBoundingClientRect();
      setPosition(rect ? { top: rect.top + rect.height / 2, left: rect.left + rect.width / 2, width: Math.min(380, rect.width - 64), maxHeight: Math.min(rect.height - 36, window.innerHeight - 32), transform: "translate(-50%, -50%)" } : undefined);
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update); window.addEventListener("scroll", update, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", update); window.removeEventListener("scroll", update); };
  }, [desktop]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const unlock = !desktop ? lockPageScroll() : () => {};
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const trap = (event: KeyboardEvent) => { if (event.key === "Tab") { event.preventDefault(); panel.current?.querySelector<HTMLButtonElement>("button")?.focus(); } };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); unlock(); previous?.focus(); };
  }, [desktop]);
  return createPortal(<div className={styles.reminderOverlay}><div ref={panel} className={styles.reminderPanel} style={position} role="dialog" aria-modal="true" aria-label="일정 알림">
    <h2 className={styles.reminderHeader}><Bell />일정 알림</h2>
    <div className={`${styles.reminderList} ${styles.scroll}`}>{items.map(({ event, reminder, key }) => <div key={key} className={styles.reminderItem}><strong>{event.icon} {event.title}</strong><p>{event.date} {event.time || "종일"}</p><p className={styles.muted}>{reminder.lead_days === 0 ? "오늘 일정이에요." : `${reminder.lead_days}일 후 일정이에요.`}</p></div>)}</div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button className={`${styles.primary} ${styles.confirmReminder}`} disabled={busy} onClick={onConfirm}>{busy ? "확인 중" : "확인"}</button>
  </div></div>, document.body);
}

function ReminderSession({ userId, desktop }: { userId: string | null; desktop: boolean }) {
  const owner = userId || "local";
  const [pending, setPending] = useState<Due>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [today, setToday] = useState(() => koreaDate());
  useEffect(() => { const timer = setInterval(() => setToday(koreaDate()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    let sequence = 0;
    const load = async () => {
      const request = ++sequence;
      try {
        const [events, reminders] = await Promise.all([
          userId ? supabase.from("calendar_events").select("*").eq("user_id", userId).then(({ data, error: queryError }) => { if (queryError) throw queryError; return (data || []) as CalendarEvent[]; }) : Promise.resolve(readLocalEvents()),
          loadReminders(userId),
        ]);
        if (!active || request !== sequence) return;
        const due = dueReminders(events, reminders, koreaDate());
        const fresh = due.filter(item => !shownThisVisit.has(`${owner}:${item.key}`));
        fresh.forEach(item => shownThisVisit.add(`${owner}:${item.key}`));
        setPending(current => {
          const kept = current.flatMap(item => { const next = due.find(candidate => candidate.key === item.key); return next ? [next] : []; });
          return [...kept, ...fresh.filter(item => !kept.some(existing => existing.key === item.key))];
        });
      } catch { /* Missing setup or an offline connection must never fall back to local for an account. */ }
    };
    void load();
    const onStorage = (event: StorageEvent) => { if (event.key === LOCAL_EVENTS_KEY || event.key === LOCAL_REMINDERS_KEY) void load(); };
    const reload = () => void load();
    window.addEventListener(CALENDAR_UPDATED, reload); window.addEventListener("focus", reload);
    if (!userId) window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener(CALENDAR_UPDATED, reload); window.removeEventListener("focus", reload); window.removeEventListener("storage", onStorage); };
  }, [userId, owner, today]);
  // Even offline, the previous day's popup expires at the next Korean date boundary.
  const visible = pending.filter(item => item.reminder.notification_date === today);
  const confirm = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await acknowledgeReminders(visible.map(item => item.reminder), userId); setPending([]); }
    catch (e) { setError(e instanceof Error ? e.message : "알림을 확인하지 못했습니다."); }
    finally { setBusy(false); }
  };
  return visible.length ? <ReminderPopup items={visible} desktop={desktop} onConfirm={() => void confirm()} busy={busy} error={error} /> : null;
}

export default function ScheduleReminders() {
  const { authUser, authStatus, authLoading } = useAuth();
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (desktop === null || authLoading || (authUser && !authStatus)) return null;
  const approved = Boolean(authUser && authStatus === "approved");
  if (!desktop && !approved) return null;
  const userId = approved ? authUser!.id : null;
  return <ReminderSession key={userId || "local"} userId={userId} desktop={desktop} />;
}
