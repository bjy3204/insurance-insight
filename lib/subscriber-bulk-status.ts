export function uncheckedActiveSubscriberIds(rows: { id: string; status: string; is_checked?: boolean | null }[]) {
  return rows.filter(row => row.status === "active" && !row.is_checked).map(row => row.id);
}
