import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import type { TrafficCamera } from '@/lib/traffic-cctv';
import { logTrafficFailure } from '@/lib/traffic-server-log';

export async function GET() {
  const key = process.env.ITS_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: 'CCTV 서버 설정이 필요합니다.' }, { status: 503 });
  const url = new URL('https://openapi.its.go.kr:9443/cctvInfo');
  url.search = new URLSearchParams({ apiKey: key, type: 'ex', cctvType: '1', minX: '124', maxX: '132', minY: '33', maxY: '39', getType: 'json' }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('CCTV unavailable');
    const data = await response.json();
    if (!Array.isArray(data.response?.data)) throw new Error('Invalid CCTV response');
    const cameras: TrafficCamera[] = [];
    for (const item of data.response.data) {
      const latitude = Number(item.coordy), longitude = Number(item.coordx);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 32 || latitude > 40 || longitude < 124 || longitude > 132) continue;
      try {
        const stream = new URL(item.cctvurl);
        if (stream.hostname !== 'cctvsec.ktict.co.kr' || !['http:', 'https:'].includes(stream.protocol)) continue;
        stream.protocol = 'https:';
        const name = String(item.cctvname || '고속도로 CCTV');
        cameras.push({ id: createHash('sha256').update(`${name}:${latitude}:${longitude}`).digest('hex').slice(0,16), name, latitude, longitude, url: stream.toString() });
      } catch { /* Invalid provider URL. */ }
    }
    return NextResponse.json({ cameras });
  } catch (failure) {
    logTrafficFailure('cctv', failure);
    return NextResponse.json({ error: 'CCTV 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
