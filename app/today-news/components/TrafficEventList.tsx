'use client';
import { useEffect, useState } from 'react';
import type { TrafficEvent } from '@/lib/traffic-events';
import { Video } from 'lucide-react';
import { nearestCamera, type TrafficCamera } from '@/lib/traffic-cctv';
import styles from './TrafficMap.module.css';

const cleanMessage = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\*+/g, '').replace(/::+/g, ' · ').replace(/\s+/g, ' ').trim();

export default function TrafficEventList({ onSelect, nearby, cameras, onCamera }: { onSelect: (event: TrafficEvent) => void; nearby: { latitude: number; longitude: number } | null; cameras:TrafficCamera[]; onCamera:(event:TrafficEvent)=>void }) {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/traffic-events', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.events)) throw new Error(data.error || '교통정보를 불러오지 못했습니다.');
        if (active) { setEvents(data.events); setUpdated(data.fetchedAt); setError(''); }
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : '교통정보를 불러오지 못했습니다.');
      } finally { if (active) setLoading(false); }
    }
    setLoading(true);
    void load();
    const interval = window.setInterval(() => { if (!document.hidden) void load(); }, 120000);
    return () => { active = false; controller.abort(); window.clearInterval(interval); };
  }, [retry]);
  const trafficEvents = events.filter(event => event.kind !== '기타' && event.detail !== '이벤트/홍보');
  const visible = nearby ? trafficEvents.filter(event => event.latitude !== null && event.longitude !== null && Math.hypot((event.latitude - nearby.latitude) * 111, (event.longitude - nearby.longitude) * 88) <= 50) : trafficEvents;
  const groups = new Map<string, TrafficEvent[]>();
  for (const event of visible) groups.set(event.road, [...(groups.get(event.road) || []), event]);
  return <aside className={styles.eventPanel} aria-label="고속도로 사고·공사 정보" aria-busy={loading}>
    <div className={styles.eventTitle}><h4>{nearby ? '내 주변 사고·공사' : '고속도로 교통정보'}</h4>{updated && <span>{new Date(updated).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })} 조회</span>}</div>
    <div className={styles.eventScroll}>
    <div className={`${styles.eventBody} ${loading && !events.length || error || !visible.length ? styles.emptyBody : ''}`}>
    {loading && !events.length ? <p className={`${styles.eventEmpty} ${styles.eventLoading}`}>교통정보를 불러오는 중입니다.</p> : error ? <div className={styles.eventEmpty} role="status">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>다시 시도</button></div> : !visible.length ? <p className={styles.eventEmpty}>{nearby ? '주변 50km 안에 제공된 고속도로 사고·공사 정보가 없습니다.' : '현재 제공된 사고·공사 정보가 없습니다.'}</p> : [...groups].map(([road, items]) => <section key={road} className={styles.eventGroup}>
      <h4>{items[0].roadNo && <span className={styles.roadNumber}>{items[0].roadNo}</span>}{road}</h4>
      {items.map(event => <div key={event.id} className={styles.eventLine}><button type="button" className={styles.eventRow} onClick={() => onSelect(event)} disabled={event.latitude === null || event.longitude === null}>
        <div className={styles.eventContent}><p title={cleanMessage(event.message || event.detail)}>{cleanMessage(event.message || event.detail)}</p>{event.lanes && <small>{event.lanes}</small>}</div>
        <span className={`${styles.eventKind} ${event.kind === '교통사고' ? styles.accident : event.kind === '공사' ? styles.construction : styles.other}`}>{event.kind === '교통사고' ? '사고' : event.kind === '기타돌발' ? '돌발' : event.kind || '돌발'}</span>
      </button><button className={styles.cameraButton} type="button" onClick={()=>onCamera(event)} disabled={event.latitude===null||event.longitude===null||!nearestCamera(cameras,event.latitude,event.longitude,event.road)} title={`${road} 가까운 CCTV 보기`} aria-label={`${road} ${event.kind} 위치 근처 CCTV 보기`}><Video size={16}/></button></div>)}
    </section>)}
    </div>
    <p className={styles.source}>국가교통정보센터 · 2분마다 갱신{nearby ? ' · 주변 50km' : ''}</p>
    </div>
  </aside>;
}
