import { NextResponse } from 'next/server';
import { normalizeRoad } from '@/lib/traffic-cctv';
type FlowData = { roads:{road:string;clear:number;slow:number;congested:number}[]; fetchedAt:string };
let saved: { key:string; time:number; data:FlowData } | undefined;
let pending: { key:string; promise:Promise<FlowData> } | undefined;

export async function GET() {
  const key = process.env.ITS_API_KEY;
  if (!key) return NextResponse.json({ error: '소통정보 서버 설정이 필요합니다.' }, { status: 503 });
  if(saved?.key===key && Date.now()-saved.time<120000)return NextResponse.json(saved.data);
  const url = new URL('https://openapi.its.go.kr:9443/trafficInfo');
  url.search = new URLSearchParams({ apiKey: key, type: 'all', minX:'124', maxX:'132', minY:'33', maxY:'39', getType:'json' }).toString();
  try {
    if(pending?.key===key)return NextResponse.json(await pending.promise);
    const promise=(async()=>{
    const response = await fetch(url, { cache:'no-store', signal: AbortSignal.timeout(40000) });
    if (!response.ok) throw new Error('Flow unavailable');
    const data = await response.json();
    if (String(data.header?.resultCode) !== '0' || !Array.isArray(data.body?.items)) throw new Error('Invalid flow response');
    const roads: Record<string, { road:string; clear:number; slow:number; congested:number }> = {};
    for (const item of data.body.items) {
      if (typeof item.roadName !== 'string' || !item.roadName.endsWith('고속도로') || item.speed === '' || item.speed === null) continue;
      const speed = Number(item.speed);
      if (!Number.isFinite(speed) || speed < 0) continue;
      const row = roads[normalizeRoad(item.roadName)] ||= { road: item.roadName, clear: 0, slow: 0, congested: 0 };
      // ITS highway speed thresholds: >=80 clear, >=40 slow, <40 congested (km/h).
      row[speed >= 80 ? 'clear' : speed >= 40 ? 'slow' : 'congested']++;
    }
    const result={ roads:Object.values(roads), fetchedAt:new Date().toISOString() };
    saved={key,time:Date.now(),data:result};
    return result;
    })();
    pending={key,promise};
    return NextResponse.json(await promise);
  } catch {
    return NextResponse.json({ error:'소통정보를 불러오지 못했습니다.' }, { status:502 });
  } finally {
    pending=undefined;
  }
}
