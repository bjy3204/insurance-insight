"use client";
import { useCallback, useEffect, useState } from "react";
import DashboardDialog from "./DashboardDialog";
import { activeReminder, koreaDate, reminderDate, REMINDER_CHOICES, type CalendarEvent, type LeadDays } from "./reminder-utils";
import { loadReminders, removeReminder, saveReminder } from "./calendar-storage";
import styles from "./DashboardCards.module.css";

export default function ReminderSettings({ event, userId, onClose }: { event: CalendarEvent; userId: string | null; onClose: () => void }) {
  const [choice, setChoice] = useState<LeadDays | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    void loadReminders(userId).then(reminders => {
      if (!active) return;
      const existing = reminders.find(r => r.event_id === event.id);
      setChoice(activeReminder(existing) ? existing!.lead_days : null); setLoaded(true); setError("");
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "알림을 불러오지 못했습니다."); });
    return () => { active = false; };
  }, [userId, event.id, reload]);
  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  const save = async () => {
    if (busy || !loaded) return;
    if (choice !== null && reminderDate(event.date, choice) < koreaDate()) { setError("이미 지난 알림 날짜입니다. 다른 알림을 선택해 주세요."); return; }
    setBusy(true); setError("");
    try {
      if (choice === null) await removeReminder(event.id, userId);
      else await saveReminder({ event_id: event.id, lead_days: choice, notification_date: reminderDate(event.date, choice), acknowledged_at: null }, userId);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "알림을 저장하지 못했습니다."); }
    finally { setBusy(false); }
  };
  return <DashboardDialog title="일정 알림 설정" onClose={close}>
    <p className={styles.reminderEventTitle}>{event.icon} {event.title}</p><p className={styles.muted}>{event.date} {event.time?.slice(0, 5)}</p>
    <fieldset className={styles.reminderChoices} disabled={!loaded || busy}><legend>알림 받을 날</legend>{REMINDER_CHOICES.map(option => <label key={option.value} className={styles.radioLabel}><input type="radio" name="reminder" checked={choice === option.value} onChange={() => { setChoice(option.value); setError(""); }} />{option.label}</label>)}<label className={styles.radioLabel}><input type="radio" name="reminder" checked={choice === null} onChange={() => setChoice(null)} />알림 해제</label></fieldset>
    <p className={styles.muted}>{choice !== null ? `${reminderDate(event.date, choice)} 하루 동안 접속할 때 알려드려요.` : "알림을 받을 날을 하나 선택해 주세요."}</p>
    {error && <p className={styles.error} role="alert">{error}{!loaded && <button type="button" className={styles.secondary} onClick={() => setReload(value => value + 1)}>다시 시도</button>}</p>}
    <div className={styles.formActions}><button className={styles.secondary} disabled={busy} onClick={close}>취소</button><button className={styles.primary} disabled={!loaded || busy} onClick={() => void save()}>{busy ? "저장 중" : "저장"}</button></div>
  </DashboardDialog>;
}
