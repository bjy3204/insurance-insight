import { supabase } from "@/lib/supabase";
import { CALENDAR_UPDATED, LOCAL_EVENTS_KEY, LOCAL_REMINDERS_KEY, activeReminder, reminderDate, type CalendarEvent, type CalendarReminder } from "./reminder-utils";

export function readLocalEvents(): CalendarEvent[] {
  const saved = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || "[]");
  if (!Array.isArray(saved)) throw new Error("Invalid local calendar");
  return saved.filter((event): event is CalendarEvent => event && typeof event.id === "string" && typeof event.title === "string" && typeof event.date === "string");
}
export function readLocalReminders(): CalendarReminder[] {
  const saved = JSON.parse(localStorage.getItem(LOCAL_REMINDERS_KEY) || "[]");
  if (!Array.isArray(saved)) throw new Error("Invalid local reminders");
  return saved.filter((reminder): reminder is CalendarReminder => reminder && typeof reminder.event_id === "string" && [0, 1, 3, 7].includes(reminder.lead_days) && typeof reminder.notification_date === "string");
}
export function calendarUpdated() { window.dispatchEvent(new Event(CALENDAR_UPDATED)); }
export function saveLocalEvents(events: CalendarEvent[]) {
  const previousEvents = localStorage.getItem(LOCAL_EVENTS_KEY);
  const previousReminders = localStorage.getItem(LOCAL_REMINDERS_KEY);
  const reminders = readLocalReminders().flatMap(reminder => {
    const event = events.find(e => e.id === reminder.event_id);
    if (!event) return [];
    const notificationDate = reminderDate(event.date, reminder.lead_days);
    if (notificationDate !== reminder.notification_date && !activeReminder(reminder)) return [];
    return [{ ...reminder, notification_date: notificationDate, acknowledged_at: notificationDate === reminder.notification_date ? reminder.acknowledged_at : null }];
  });
  try {
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    if (previousEvents === null) localStorage.removeItem(LOCAL_EVENTS_KEY); else localStorage.setItem(LOCAL_EVENTS_KEY, previousEvents);
    if (previousReminders === null) localStorage.removeItem(LOCAL_REMINDERS_KEY); else localStorage.setItem(LOCAL_REMINDERS_KEY, previousReminders);
    throw error;
  }
  calendarUpdated();
}
export async function loadReminders(userId: string | null): Promise<CalendarReminder[]> {
  if (!userId) return readLocalReminders();
  const { data, error } = await supabase.from("calendar_reminders").select("event_id,user_id,lead_days,notification_date,acknowledged_at").eq("user_id", userId);
  if (error) throw new Error("계정 알림을 불러오지 못했습니다. 알림 SQL 적용 여부와 연결 상태를 확인해 주세요.");
  return data || [];
}
export async function saveReminder(reminder: CalendarReminder, userId: string | null) {
  if (userId) {
    const { error } = await supabase.from("calendar_reminders").upsert({ ...reminder, user_id: userId }, { onConflict: "event_id" });
    if (error) throw new Error("계정에 알림을 저장하지 못했습니다. 알림 SQL 적용 여부를 확인해 주세요. 로컬에는 저장하지 않았습니다.");
  } else localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify([...readLocalReminders().filter(r => r.event_id !== reminder.event_id), reminder]));
  calendarUpdated();
}
export async function removeReminder(eventId: string, userId: string | null) {
  if (userId) {
    const { error } = await supabase.from("calendar_reminders").delete().eq("event_id", eventId).eq("user_id", userId);
    if (error) throw new Error("계정의 알림을 해제하지 못했습니다.");
  } else localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(readLocalReminders().filter(r => r.event_id !== eventId)));
  calendarUpdated();
}
export async function acknowledgeReminders(reminders: CalendarReminder[], userId: string | null) {
  const acknowledgedAt = new Date().toISOString();
  if (userId) {
    // Match each exact configuration; acknowledging an old popup must not dismiss a rescheduled reminder.
    for (const reminder of reminders) {
      const { error, data } = await supabase.from("calendar_reminders").update({ acknowledged_at: acknowledgedAt }).eq("event_id", reminder.event_id).eq("user_id", userId).eq("notification_date", reminder.notification_date).eq("lead_days", reminder.lead_days).select("event_id");
      if (error || !data?.length) throw new Error("알림 확인 상태를 계정에 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  } else {
    const records = readLocalReminders().map(record => reminders.some(r => r.event_id === record.event_id && r.notification_date === record.notification_date && r.lead_days === record.lead_days) ? { ...record, acknowledged_at: acknowledgedAt } : record);
    localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(records));
  }
  calendarUpdated();
}
