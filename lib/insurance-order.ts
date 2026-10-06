/** Reorder only the selected membership group, preserving the other group's order. */
export function reorderWithinFavoriteGroup<T extends { id: string }>(
  items: T[], favorites: string[], activeId: string, overId: string,
): T[] {
  if (activeId === overId) return items;
  const activeIsFavorite = favorites.includes(activeId);
  if (activeIsFavorite !== favorites.includes(overId)) return items;
  const group = items.filter((item) => favorites.includes(item.id) === activeIsFavorite);
  const from = group.findIndex((item) => item.id === activeId);
  const to = group.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0) return items;
  const moved = [...group];
  moved.splice(to, 0, moved.splice(from, 1)[0]);
  let index = 0;
  return items.map((item) => favorites.includes(item.id) === activeIsFavorite ? moved[index++] : item);
}
