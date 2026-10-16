export const PERSONAL_MENU_GROUPS = [
  { title: "고객관리", ids: ["customer-management", "coverage-analysis", "policy-inserts", "customer"] },
  { title: "고객 안내", ids: ["ai", "notice"] },
  { title: "일정·기록", ids: ["calendar", "memo", "diary"] },
  { title: "바로가기", ids: ["shortcut:kakao", "shortcut:mysite", "shortcut:spreadsheet"] },
];
export const SHORTCUT_ORDER = ["kakao", "mysite", "spreadsheet"];

export function normalizePersonalMenuOrder(saved: unknown, defaults: string[]) {
  const allowed = new Set(defaults);
  const order = Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string" && allowed.has(id)) : [];
  return [...new Set([...order, ...defaults])];
}

export function reorderPersonalMenu(order: string[], active: string, over: string) {
  const group = PERSONAL_MENU_GROUPS.find(item => item.ids.includes(active));
  if (active === over || !group?.ids.includes(over)) return order;
  const items = order.filter(id => group.ids.includes(id));
  const from = items.indexOf(active), to = items.indexOf(over);
  if (from < 0 || to < 0) return order;
  items.splice(to, 0, items.splice(from, 1)[0]);
  let index = 0;
  return order.map(id => group.ids.includes(id) ? items[index++] : id);
}
