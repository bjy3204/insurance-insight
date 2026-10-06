export type CalendarEvent = { id: string; title: string; content: string; date: string; time: string | null; place: string | null; memo: string | null; icon: string; color: string };
export type LeadDays = 0 | 1 | 3 | 7;
export type CalendarReminder = { event_id: string; user_id?: string; lead_days: LeadDays; notification_date: string; acknowledged_at: string | null };
export const REMINDER_CHOICES: { value: LeadDays; label: string }[] = [{ value: 0, label: "당일" }, { value: 1, label: "하루 전" }, { value: 3, label: "3일 전" }, { value: 7, label: "7일 전" }];
export const LOCAL_EVENTS_KEY = "insurance-calendar-local-events-v1";
export const LOCAL_REMINDERS_KEY = "insurance-calendar-local-reminders-v1";
export const CALENDAR_UPDATED = "insurance-calendar-updated";

export function koreaDate(now = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function reminderDate(eventDate: string, days: LeadDays): string {
  const date = new Date(`${eventDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
export function activeReminder(reminder: CalendarReminder | undefined, today = koreaDate()): boolean {
  return Boolean(reminder && !reminder.acknowledged_at && reminder.notification_date >= today);
}
export function dueReminders(events: CalendarEvent[], reminders: CalendarReminder[], today = koreaDate()) {
  return reminders.flatMap(reminder => {
    const event = events.find(item => item.id === reminder.event_id);
    if (!event || reminder.acknowledged_at || reminder.notification_date !== today || reminderDate(event.date, reminder.lead_days) !== today) return [];
    return [{ event, reminder, key: `${event.id}:${reminder.notification_date}:${reminder.lead_days}` }];
  }).sort((a, b) => a.event.date.localeCompare(b.event.date) || (a.event.time || "").localeCompare(b.event.time || ""));
}
