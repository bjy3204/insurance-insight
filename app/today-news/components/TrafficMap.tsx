'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import TrafficEventList from './TrafficEventList';
import type { TrafficEvent } from '@/lib/traffic-events';
import { nearestCamera, type TrafficCamera } from '@/lib/traffic-cctv';
import TrafficCctvPlayer from './TrafficCctvPlayer';
import styles from './TrafficMap.module.css';

type Point = object;
type MapInstance = {
  addOverlayMapTypeId(type: unknown): void;
  addControl(control: object, position: unknown): void;
  setBounds(bounds: object): void;
  setLevel(level: number): void;
  panTo(point: Point): void;
  getBounds(): { getSouthWest(): {getLat():number;getLng():number}; getNorthEast(): {getLat():number;getLng():number} };
};
type MapsSdk = {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => Point;
  LatLngBounds: new (southwest: Point, northeast: Point) => object;
  Map: new (container: HTMLElement, options: { center: Point; level: number }) => MapInstance;
  Marker: new (options: { position: Point; map: MapInstance }) => { setMap(map: MapInstance | null): void };
  ZoomControl: new () => object;
  MapTypeId: { TRAFFIC: unknown };
  ControlPosition: { RIGHT: unknown };
  CustomOverlay: new (options:{position:Point;content:HTMLElement;map:MapInstance;zIndex:number})=>{setMap(map:MapInstance|null):void};
  event: { addListener(target:MapInstance,event:string,callback:()=>void):void; removeListener(target:MapInstance,event:string,callback:()=>void):void };
};
const getSdk = () => (window as Window & { kakao?: { maps?: MapsSdk } }).kakao?.maps;
// JavaScript SDK keys are public browser credentials, restricted by registered domains.
const mapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || '518af1512d73dd3244aedb922e2a32ed';
let sdkPromise: Promise<MapsSdk> | undefined;

function loadSdk(): Promise<MapsSdk> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      sdkPromise = undefined;
      reject(new Error('지도 로딩 실패'));
    }
    function ready() {
      const sdk = getSdk();
      if (!sdk) { fail(); return; }
      sdk.load(() => { window.clearTimeout(timeout); resolve(sdk); });
    }
    if (getSdk()) { ready(); return; }
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(mapKey)}&autoload=false`;
    script.async = true;
    script.onload = ready;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export default function TrafficMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marker = useRef<{ setMap(map: MapInstance | null): void } | null>(null);
  const mounted = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [nearby, setNearby] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cameras,setCameras]=useState<TrafficCamera[]>([]);
  const [selectedCamera,setSelectedCamera]=useState<TrafficCamera|null>(null);
  const cameraSequence=useRef<TrafficCamera[]>([]);
  const [cameraError,setCameraError]=useState('');
  const closeCamera=useCallback(()=>setSelectedCamera(null),[]);
  const openCamera=useCallback((camera:TrafficCamera)=>{
    cameraSequence.current=[...cameras].sort((a,b)=>Math.hypot(a.latitude-camera.latitude,a.longitude-camera.longitude)-Math.hypot(b.latitude-camera.latitude,b.longitude-camera.longitude)).slice(0,20);
    setSelectedCamera(camera);
  },[cameras]);

  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/traffic-cctv',{signal:controller.signal}).then(async response=>{
      const data=await response.json();
      if(!response.ok||!Array.isArray(data.cameras))throw new Error(data.error||'CCTV 정보를 불러오지 못했습니다.');
      setCameras(data.cameras);
    }).catch(failure=>{if(!controller.signal.aborted)setCameraError(failure instanceof Error?failure.message:'CCTV 정보를 불러오지 못했습니다.');});
    return ()=>controller.abort();
  },[]);

  useEffect(()=>{
    const sdk=getSdk(), instance=map.current;
    if(!ready||!sdk||!instance||!cameras.length)return;
    let overlays: {setMap(map:MapInstance|null):void}[]=[];
    const draw=()=>{
      overlays.forEach(overlay=>overlay.setMap(null));overlays=[];
      const bounds=instance.getBounds(), sw=bounds.getSouthWest(), ne=bounds.getNorthEast();
      const cells=new Set<string>();
      for(const camera of cameras){
        if(overlays.length>=120)break;
        if(camera.latitude<sw.getLat()||camera.latitude>ne.getLat()||camera.longitude<sw.getLng()||camera.longitude>ne.getLng())continue;
        const cell=`${Math.floor((camera.longitude-sw.getLng())/(ne.getLng()-sw.getLng())*24)}:${Math.floor((camera.latitude-sw.getLat())/(ne.getLat()-sw.getLat())*20)}`;
        if(cells.has(cell))continue;cells.add(cell);
        const button=document.createElement('button');
        button.type='button';button.className=styles.cameraMarker;button.title=camera.name;button.setAttribute('aria-label',`${camera.name} CCTV 보기`);
        button.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l5-3v10l-5-3"/><rect x="3" y="7" width="12" height="10" rx="2"/></svg>';
        button.onclick=event=>{event.stopPropagation();openCamera(camera);};
        overlays.push(new sdk.CustomOverlay({position:new sdk.LatLng(camera.latitude,camera.longitude),content:button,map:instance,zIndex:2}));
      }
    };
    draw();sdk.event.addListener(instance,'idle',draw);
    return ()=>{sdk.event.removeListener(instance,'idle',draw);overlays.forEach(overlay=>overlay.setMap(null));};
  },[ready,cameras,openCamera]);

  function showEventCamera(event:TrafficEvent){
    if(event.latitude===null||event.longitude===null)return;
    const camera=nearestCamera(cameras,event.latitude,event.longitude,event.road);
    if(camera){selectEvent(event);openCamera(camera);}
  }
  function nextCamera(offset:number){
    if(!selectedCamera)return;
    const pool=cameraSequence.current;
    if(!pool.length)return;
    const index=pool.findIndex(camera=>camera.id===selectedCamera.id);
    setSelectedCamera(pool[(index+offset+pool.length)%pool.length]||selectedCamera);
  }

  function nationwide() {
    const sdk = getSdk();
    if (!sdk || !map.current) return;
    map.current.setBounds(new sdk.LatLngBounds(new sdk.LatLng(34, 125.5), new sdk.LatLng(38.6, 130)));
    setMessage('');
    setNearby(null);
  }

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    setError('');
    setReady(false);
    loadSdk().then(sdk => {
      if (cancelled || !container.current) return;
      const instance = new sdk.Map(container.current, { center: new sdk.LatLng(36.3, 127.7), level: 12 });
      instance.addOverlayMapTypeId(sdk.MapTypeId.TRAFFIC);
      instance.addControl(new sdk.ZoomControl(), sdk.ControlPosition.RIGHT);
      instance.setBounds(new sdk.LatLngBounds(new sdk.LatLng(34, 125.5), new sdk.LatLng(38.6, 130)));
      map.current = instance;
      setReady(true);
    }).catch(() => {
      if (!cancelled) setError('지도를 불러오지 못했습니다. 카카오맵 사용 설정과 등록 도메인을 확인해 주세요.');
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      marker.current?.setMap(null);
      marker.current = null;
      map.current = null;
    };
  }, [attempt]);

  function locate() {
    if (!navigator.geolocation) { setMessage('이 브라우저에서는 위치를 확인할 수 없습니다.'); return; }
    setLocating(true);
    setMessage('내 위치를 확인하고 있습니다.');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (!mounted.current) return;
      const sdk = getSdk();
      if (sdk && map.current) {
        const point = new sdk.LatLng(coords.latitude, coords.longitude);
        map.current.setLevel(5);
        map.current.panTo(point);
        marker.current?.setMap(null);
        marker.current = new sdk.Marker({ position: point, map: map.current });
        setMessage('내 주변 교통정보를 표시하고 있습니다.');
        setNearby({ latitude: coords.latitude, longitude: coords.longitude });
      }
      setLocating(false);
    }, failure => {
      if (!mounted.current) return;
      setLocating(false);
      setMessage(failure.code === 1 ? '위치 권한을 허용한 뒤 다시 눌러 주세요.' : '현재 위치를 확인하지 못했습니다. 다시 시도해 주세요.');
    }, { timeout: 10000, maximumAge: 60000 });
  }

  function selectEvent(event: TrafficEvent) {
    const sdk = getSdk();
    if (!sdk || !map.current || event.latitude === null || event.longitude === null) return;
    const point = new sdk.LatLng(event.latitude, event.longitude);
    map.current.setLevel(5);
    map.current.panTo(point);
    marker.current?.setMap(null);
    marker.current = new sdk.Marker({ position: point, map: map.current });
    setMessage(`${event.road} · ${event.kind} · ${event.message}`);
  }

  return <div className={styles.frame}>
    <div className={styles.heading}>
      <h3>전국 교통정보</h3>
      <div className={styles.controls}>
        <button type="button" onClick={nationwide} disabled={!ready}>전국</button>
        <button type="button" onClick={locate} disabled={!ready || locating} aria-label="내 주변 정보" title="내 주변 정보"><LocateFixed size={20} /></button>
      </div>
    </div>
    <div className={styles.layout}><div className={styles.mapWrap}>
      <div ref={container} className={styles.map} aria-label="실시간 도로 교통지도" />
      {!ready && <div className={styles.status} role="status">{error || '교통지도를 불러오는 중입니다.'}{error && <button type="button" onClick={() => setAttempt(value => value + 1)}>다시 시도</button>}</div>}
      {selectedCamera&&<TrafficCctvPlayer camera={selectedCamera} onClose={closeCamera} onPrevious={()=>nextCamera(-1)} onNext={()=>nextCamera(1)}/>}
    </div><TrafficEventList onSelect={selectEvent} nearby={nearby} cameras={cameras} onCamera={showEventCamera}/></div>
    {cameraError&&<p className={styles.message} role="status">{cameraError}</p>}
    {message && <p className={styles.message} role="status">{message}</p>}
  </div>;
}
