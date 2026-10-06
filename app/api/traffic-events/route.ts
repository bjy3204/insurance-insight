import { NextResponse } from 'next/server';
import { parseTrafficEvents } from '@/lib/traffic-events';

export async function GET() {
  const key = process.env.ITS_API_KEY;
  if (!key) return NextResponse.json({ error: '교통정보 서버 설정이 필요합니다.' }, { status: 503 });
  const url = new URL('https://openapi.its.go.kr:9443/eventInfo');
  url.search = new URLSearchParams({ apiKey: key, type: 'ex', eventType: 'all', getType: 'json' }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 120 }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('ITS unavailable');
    const events = parseTrafficEvents(await response.json());
    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
  } catch {
    // Do not log the upstream URL: it contains the server API key.
    return NextResponse.json({ error: '교통정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
  }
}
