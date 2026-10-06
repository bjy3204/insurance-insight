'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TrafficCamera } from '@/lib/traffic-cctv';
import styles from './TrafficMap.module.css';

export default function TrafficCctvPlayer({ camera, onClose, onPrevious, onNext }: { camera:TrafficCamera; onClose:()=>void; onPrevious:()=>void; onNext:()=>void }) {
  const video = useRef<HTMLVideoElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [error,setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keydown = (event:KeyboardEvent) => { if(event.key==='Escape') { event.stopPropagation(); onClose(); } };
    document.addEventListener('keydown',keydown);
    return () => { document.removeEventListener('keydown',keydown); previous?.focus(); };
  }, [onClose]);
  useEffect(() => {
    let cancelled=false;
    let destroy: (()=>void) | undefined;
    const element=video.current;
    if(!element) return;
    setError('');
    if(element.canPlayType('application/vnd.apple.mpegurl')) {
      element.src=camera.url;
      void element.play().catch(()=>{});
    } else {
      import('hls.js').then(({default:Hls})=>{
        if(cancelled) return;
        if(!Hls.isSupported()) {setError('이 브라우저에서는 CCTV 영상을 재생할 수 없습니다.');return;}
        const hls=new Hls({maxBufferLength:10});
        destroy=()=>hls.destroy();
        hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal&&!cancelled)setError('영상 연결이 원활하지 않습니다. 다른 CCTV를 선택해 주세요.');});
        hls.loadSource(camera.url);
        hls.attachMedia(element);
        hls.on(Hls.Events.MANIFEST_PARSED,()=>{void element.play().catch(()=>{});});
      }).catch(()=>{if(!cancelled)setError('영상 플레이어를 불러오지 못했습니다.');});
    }
    return ()=>{cancelled=true;destroy?.();element.pause();element.removeAttribute('src');element.load();};
  },[camera.id,camera.url]);
  return <div className={styles.cctvPopup} role="dialog" aria-label={`${camera.name} CCTV`}>
    <div className={styles.cctvHeader}><strong>{camera.name}</strong><button ref={closeButton} type="button" onClick={onClose} aria-label="CCTV 닫기"><X size={18}/></button></div>
    <span className={styles.live}>● LIVE</span>
    <video ref={video} controls autoPlay muted playsInline onError={()=>setError('영상을 불러오지 못했습니다. 다른 CCTV를 선택해 주세요.')} aria-label={`${camera.name} 실시간 영상`}/>
    {error&&<p role="status">{error}</p>}
    <div className={styles.cctvFooter}><span>국가교통정보센터 제공<br/>실제 상황과 영상에 시간 차이가 있을 수 있습니다.</span><div><button type="button" onClick={onPrevious} aria-label="이전 CCTV"><ChevronLeft size={18}/></button><button type="button" onClick={onNext} aria-label="다음 CCTV"><ChevronRight size={18}/></button></div></div>
  </div>;
}
