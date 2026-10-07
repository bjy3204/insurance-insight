export function formatCalendarTime(value: string | null | undefined): string {
  const time = value?.trim() || "";
  const match = time.match(/^(\d{2}):?(\d{2})$/);
  return match ? `${match[1]}:${match[2]}` : time;
}
