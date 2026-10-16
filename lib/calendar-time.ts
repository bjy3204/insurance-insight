export function formatCalendarTime(value: string | null | undefined): string {
  const time = value?.trim() || "";
  const match = time.match(/^(\d{2}):?(\d{2})$/);
  return match ? `${match[1]}:${match[2]}` : time;
}

export function compareCalendarTimes(a: string | null | undefined, b: string | null | undefined): number {
  const minutes = (value: string | null | undefined) => {
    const text = value?.trim();
    if (!text) return -1;
    const match = /^(\d{1,2}):?(\d{2})(?::\d{2})?$/.exec(text);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return Number.POSITIVE_INFINITY;
    return Number(match[1]) * 60 + Number(match[2]);
  };
  const left = minutes(a), right = minutes(b);
  return left === right ? 0 : left < right ? -1 : 1;
}
