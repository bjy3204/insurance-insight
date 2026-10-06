export type TrafficEvent = {
  id: string;
  road: string;
  roadNo: string;
  kind: string;
  detail: string;
  message: string;
  lanes: string;
  start: string;
  latitude: number | null;
  longitude: number | null;
};

export function parseTrafficEvents(value: unknown): TrafficEvent[] {
  if (!value || typeof value !== 'object') throw new Error('Invalid response');
  const root = value as { header?: { resultCode?: unknown }; body?: { items?: unknown } };
  if (String(root.header?.resultCode) !== '0' || !Array.isArray(root.body?.items)) throw new Error('ITS request failed');
  const text = (value: unknown) => typeof value === 'string' ? value : '';
  const coordinate = (value: unknown, min: number, max: number) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : null;
  };
  return root.body.items.filter(item => item && typeof item === 'object').map((item, index) => ({
    id: `${text(item.linkId)}-${text(item.startDate)}-${index}`,
    road: text(item.roadName) || '도로명 미제공', roadNo: text(item.roadNo),
    kind: text(item.eventType), detail: text(item.eventDetailType),
    message: text(item.message), lanes: text(item.lanesBlocked), start: text(item.startDate),
    latitude: coordinate(item.coordY, 32, 40), longitude: coordinate(item.coordX, 124, 132),
  })).sort((a, b) => b.start.localeCompare(a.start));
}
