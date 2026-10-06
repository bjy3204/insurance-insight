export type TrafficCamera = { id: string; name: string; latitude: number; longitude: number; url: string };
export const normalizeRoad = (road: string) => road.replace(/\([^)]*\)/g, '').replace(/고속도로|선|\s/g, '').replace('서울외곽순환', '수도권제1순환');
export function nearestCamera(cameras: TrafficCamera[], latitude: number, longitude: number, road?: string) {
  const stem = road ? normalizeRoad(road) : '';
  const matching = stem ? cameras.filter(camera => normalizeRoad(camera.name).includes(stem)) : [];
  const pool = matching.length ? matching : cameras;
  return pool.map(camera => ({ camera, distance: Math.hypot((camera.latitude - latitude) * 111, (camera.longitude - longitude) * 88) })).filter(item => item.distance <= 30).sort((a, b) => a.distance - b.distance)[0]?.camera;
}
