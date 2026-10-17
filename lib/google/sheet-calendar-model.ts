export type SheetCalendarEvent = {
  id: string; date: string; kind: "birthday" | "immunity" | "reduction" | "renewal" | "payment";
  category: string; name: string; birth: string; content: string; icon: string; memoContent?:string;
};
type Cell = string | number | boolean | null;
export type SheetCalendarRows = { customers: Cell[][]; vehicles: Cell[][]; contracts: Cell[][]; products: Cell[][]; terms: Cell[][] };
const day = 86400000;
const epoch = Date.UTC(1899, 11, 30);
const text = (value: Cell | undefined) => String(value ?? "").trim();
const key = (date: Date) => date.toISOString().slice(0, 10);
function validDate(year: number, month: number, date: number) {
  const result = new Date(Date.UTC(year, month - 1, date));
  return year >= 1800 && year <= 2199 && result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === date ? result : null;
}
function parsedDate(value: Cell | undefined) {
  if (typeof value === "number" && value > 0 && value < 110000) return new Date(epoch + Math.floor(value) * day);
  const digits = text(value).replace(/\D/g, "");
  if (digits.length === 8) return validDate(Number(digits.slice(0, 4)), Number(digits.slice(4, 6)), Number(digits.slice(6)));
  return null;
}
function birth(value: Cell | undefined, currentYear: number) {
  let digits = text(value).replace(/\D/g, "");
  if (digits && digits.length < 6) digits = digits.padStart(6, "0");
  if (digits.length < 6) return null;
  const year = Number(digits.slice(0, 2));
  const century = digits.length >= 7 ? "3478".includes(digits[6]) ? 2000 : "1256".includes(digits[6]) ? 1900 : 1800 : year <= currentYear % 100 ? 2000 : 1900;
  const date = validDate(century + year, Number(digits.slice(2, 4)), Number(digits.slice(4, 6)));
  return date ? { date, display: digits.length >= 7 ? `${digits.slice(0, 6)}-${digits[6]}` : digits.slice(0, 6) } : null;
}
function shifted(date: Date, months: number) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  target.setUTCDate(Math.min(date.getUTCDate(), new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()));
  return target;
}
function annual(date: Date, year: number) {
  return new Date(Date.UTC(year, date.getUTCMonth(), Math.min(date.getUTCDate(), new Date(Date.UTC(year, date.getUTCMonth() + 1, 0)).getUTCDate())));
}
export function buildSheetCalendar(rows: SheetCalendarRows, from: string, to: string, identify: (value: string) => string, currentYear = new Date().getFullYear()) {
  const events: SheetCalendarEvent[] = [];
  const add = (date: Date, event: Omit<SheetCalendarEvent, "id" | "date">, source: string) => {
    const value = key(date);
    if (value < from || value > to) return;
    events.push({ ...event, category: { birthday: "생일", immunity: "면책", reduction: "감액", renewal: "자동차갱신", payment: "카드수납" }[event.kind], date: value, id: `sheet:${identify(JSON.stringify([source, value, event.kind, event.name, event.birth, event.content]))}` });
  };
  const firstYear = Number(from.slice(0, 4)), lastYear = Number(to.slice(0, 4));
  rows.customers.forEach((row, index) => {
    const name = text(row[1]);
    if (!name) return;
    const customerBirth = birth(row[2], currentYear);
    const base = { category: text(row[0]), name, birth: customerBirth?.display || "" };
    for (let year = firstYear; year <= lastYear; year++) {
      if (customerBirth && year >= customerBirth.date.getUTCFullYear()) add(annual(customerBirth.date, year), { ...base, kind: "birthday", content: "생일", icon: "🎂" }, "customer");
      const vehicle = rows.vehicles[index] || [];
      const renewal = parsedDate(vehicle[2]);
      if (renewal) add(annual(renewal, year), { ...base, kind: "renewal", content: [text(vehicle[3]), text(vehicle[1]), text(vehicle[0])].filter(Boolean).join(" · ") || "자동차갱신", memoContent:[text(vehicle[3]),text(vehicle[0])].filter(Boolean).join(" · "), icon: "🚗" }, "vehicle");
    }
  });
  rows.contracts.forEach((row, index) => {
    const date = parsedDate(row[1]), name = text(row[2]);
    if (!date || !name) return;
    const customerBirth = birth(row[3], currentYear);
    const months = rows.terms[index] || [];
    (["immunity", "reduction"] as const).forEach((kind, column) => {
      const value = text(months[column]).replace(/\s*개월$/, "");
      const count = Number(value);
      if (!/^\d+$/.test(value) || count <= 0 || count > 1200) return;
      add(shifted(date, count), { category: text(row[0]), name, birth: customerBirth?.display || "", kind, content: [kind === "immunity" ? "면책 종료" : "감액 종료", text(rows.products[index]?.[0])].filter(Boolean).join(" · "), icon: "🔒" }, "contract");
    });
  });
  return [...new Map(events.map(event => [event.id, event])).values()].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, "ko"));
}
