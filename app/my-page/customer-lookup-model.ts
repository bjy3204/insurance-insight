import { customerNameStartsWith } from "./customer-form-fields";

export type CustomerRecord = Record<string, string> & { id: string; name: string; birth: string };
const DAY = 86400000;
const dateKey = (value: Date) => value.toISOString().slice(0, 10);
export const customerToday = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
export function customerRenewalDays(value:string,today=customerToday()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const original=new Date(`${value}T00:00:00Z`),now=new Date(`${today}T00:00:00Z`);
  if(!Number.isFinite(original.getTime())||dateKey(original)!==value)return null;
  const annual=(year:number)=>new Date(Date.UTC(year,original.getUTCMonth(),Math.min(original.getUTCDate(),new Date(Date.UTC(year,original.getUTCMonth()+1,0)).getUTCDate())));
  let next=annual(now.getUTCFullYear());
  if(next<now)next=annual(now.getUTCFullYear()+1);
  return Math.round((next.getTime()-now.getTime())/DAY);
}

export function customerBirthDate(value: string, today = customerToday()) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 6 && digits.length !== 7) return null;
  const shortYear = Number(digits.slice(0, 2));
  const century = digits.length === 6 ? shortYear <= Number(today.slice(2, 4)) ? 2000 : 1900 : "3478".includes(digits[6]) ? 2000 : "1256".includes(digits[6]) ? 1900 : 1800;
  const year = century + shortYear, month = Number(digits.slice(2, 4)), day = Number(digits.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day || dateKey(date) > today) return null;
  return { year, month, day };
}

// The user's reference: add six calendar months, clamp missing 31st dates,
// and move February dates beyond the 28th to March 1st.
function ageChangeDate(year: number, month: number, day: number) {
  const result = new Date(Date.UTC(year, month - 1 + 6, 1));
  if (result.getUTCMonth() === 1 && day > 28) result.setUTCMonth(2, 1);
  else result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()));
  return result;
}

export function customerTiming(birth: string, today = customerToday()) {
  const parsed = customerBirthDate(birth, today);
  if (!parsed) return null;
  const now = new Date(`${today}T00:00:00Z`);
  const year = now.getUTCFullYear(), month = now.getUTCMonth() + 1, day = now.getUTCDate();
  const age = year - parsed.year - (month < parsed.month || month === parsed.month && day < parsed.day ? 1 : 0);
  const latestBirthdayYear = parsed.year + age;
  const insuranceAge = age + (now >= ageChangeDate(latestBirthdayYear, parsed.month, parsed.day) ? 1 : 0);
  const upcoming = [year - 1, year, year + 1].filter(value => value >= parsed.year).map(value => ageChangeDate(value, parsed.month, parsed.day)).filter(value => value >= now).sort((a, b) => a.getTime() - b.getTime())[0];
  return { age, insuranceAge, upperDate: dateKey(upcoming), days: Math.round((upcoming.getTime() - now.getTime()) / DAY) };
}

export function findCustomers(customers: readonly CustomerRecord[], name: string, birth: string) {
  const query = name.trim(), digits = birth.replace(/\D/g, "");
  if (!query && !digits) return [];
  return customers.filter(customer => (!query || customerNameStartsWith(customer.name, query)) && (!digits || customer.birth.replace(/\D/g, "").startsWith(digits)));
}

export function medicalMaturity(joined: string, today = customerToday()) {
  const match = /^(\d{4})[-.](\d{2})(?:[-.]\d{2})?$/.exec(joined);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return null;
  const year = Number(match[1]), month = Number(match[2]), ym = year * 100 + month;
  if (ym < 201301) return null;
  const resultYear = year + (ym >= 202107 ? 5 : 15);
  const nowYear = Number(today.slice(0, 4)), nowMonth = Number(today.slice(5, 7));
  const distance = (resultYear - nowYear) * 12 + month - nowMonth;
  return { text: `${resultYear}-${String(month).padStart(2, "0")}`, soon: distance >= 0 && distance <= 3 };
}

export function customerDirectory(customers: readonly CustomerRecord[], query: string) {
  const term = query.trim().toLocaleLowerCase(), digits = term.replace(/\D/g, "");
  return customers.map((customer, index) => ({ customer, index, created: Date.parse(customer.createdAt || "") })).filter(({ customer }) => !term || customerNameStartsWith(customer.name, term) || customer.name.toLocaleLowerCase().includes(term) || !!digits && /^[-\d\s]+$/.test(term) && (customer.birth.replace(/\D/g, "").includes(digits) || (customer.phone || "").replace(/\D/g, "").includes(digits))).sort((a, b) => {
    const leftOrder = a.customer.sortOrder === undefined ? null : Number(a.customer.sortOrder);
    const rightOrder = b.customer.sortOrder === undefined ? null : Number(b.customer.sortOrder);
    if (leftOrder !== null && rightOrder !== null && leftOrder !== rightOrder) return leftOrder - rightOrder;
    if (leftOrder !== null && rightOrder === null) return 1;
    if (leftOrder === null && rightOrder !== null) return -1;
    const left = Number.isNaN(a.created) ? -Infinity : a.created, right = Number.isNaN(b.created) ? -Infinity : b.created;
    return left === right ? a.index - b.index : left > right ? -1 : 1;
  }).map(({ customer }) => customer);
}
