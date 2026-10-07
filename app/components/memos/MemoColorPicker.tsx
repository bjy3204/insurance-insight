"use client";
import { useEffect, useState } from "react";
import { Pipette, X } from "lucide-react";

function hslHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
export default function MemoColorPicker({ value, onChange, onClose }: { value: string; onChange: (color: string) => void; onClose: () => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const [tab, setTab] = useState("grid");
  const [hue, setHue] = useState(210);
  const [notice, setNotice] = useState("");
  const colors = [Array.from({ length: 12 }, (_, i) => hslHex(0, 0, 100 - i * 100 / 11)), ...Array.from({ length: 9 }, (_, row) => Array.from({ length: 12 }, (_, col) => hslHex((210 + col * 30) % 360, row < 5 ? 72 : 82, 12 + row * 10)))];
  const rgb = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const eyedrop = async () => {
    const EyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropper) { setNotice("이 브라우저는 스포이트를 지원하지 않습니다."); return; }
    try { const result = await new EyeDropper().open(); onChange(result.sRGBHex); } catch { /* A cancelled selection leaves the current color intact. */ }
  };
  return <div className="memo-color-picker rounded-2xl border border-gray-200 bg-white p-3 shadow-xl w-full max-w-[360px]" role="group" aria-label="색상 선택">
    <div className="flex items-center justify-between mb-3"><button type="button" title="스포이트" aria-label="스포이트" onClick={eyedrop} className="p-1 cursor-pointer"><Pipette className="w-5 h-5" /></button><span className="font-bold text-sm">색상</span><button type="button" onClick={onClose} aria-label="색상 선택 닫기" className="p-1 cursor-pointer"><X className="w-5 h-5" /></button></div>
    <div className="grid md:hidden grid-cols-3 bg-gray-100 p-1 rounded-xl mb-3">{[{ id: "grid", label: "격자" }, { id: "spectrum", label: "스펙트럼" }, { id: "slider", label: "슬라이더" }].map(item => <button type="button" key={item.id} onClick={() => setTab(item.id)} className={`text-xs py-1.5 rounded-lg cursor-pointer ${tab === item.id ? "bg-white shadow-sm font-bold" : "text-gray-500"}`}>{item.label}</button>)}</div>
    {<div className={`overflow-hidden rounded-lg ${tab === "grid" ? "block" : "hidden md:block"}`}>{colors.map((row, i) => <div key={i} className="grid grid-cols-12">{row.map(color => <button type="button" key={color} aria-label={color} title={color} onClick={() => onChange(color)} style={{ background: color }} className={`aspect-square cursor-pointer ${value.toLowerCase() === color ? "ring-2 ring-inset ring-blue-500" : ""}`} />)}</div>)}</div>}
    {tab === "spectrum" && <div className="space-y-3 md:hidden"><div role="slider" tabIndex={0} aria-label="색상 스펙트럼" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rgb[0] * 100 / 255} className="h-44 rounded-xl touch-none cursor-crosshair" style={{background:`linear-gradient(to top,black,transparent),linear-gradient(to right,white,hsl(${hue},100%,50%))`}} onPointerDown={e=>{const area=e.currentTarget, rect=area.getBoundingClientRect();area.setPointerCapture(e.pointerId);const choose=(x:number,y:number)=>{const sat=Math.max(0,Math.min(1,(x-rect.left)/rect.width)),v=1-Math.max(0,Math.min(1,(y-rect.top)/rect.height)),l=v*(1-sat/2);onChange(hslHex(hue,l===0||l===1?0:(v-l)/Math.min(l,1-l)*100,l*100));};choose(e.clientX,e.clientY);area.onpointermove=v=>choose(v.clientX,v.clientY);area.onpointerup=()=>{area.onpointermove=null;area.onpointerup=null;};}} onKeyDown={e=>{if(e.key.startsWith("Arrow")){e.preventDefault();const next=(hue+(e.key==="ArrowLeft"||e.key==="ArrowDown"?-5:5)+360)%360;setHue(next);onChange(hslHex(next,80,50));}}}/><label className="flex gap-2 items-center text-xs">색조<input aria-label="색조" type="range" min={0} max={360} value={hue} onChange={e=>{setHue(Number(e.target.value));onChange(hslHex(Number(e.target.value),80,50));}} className="flex-1"/></label></div>}
    {tab === "slider" && <div className="space-y-3 md:hidden">{["R", "G", "B"].map((channel, i) => <label key={channel} className="flex items-center gap-2 text-xs"><span className="w-4">{channel}</span><input type="range" min={0} max={255} value={rgb[i]} onChange={e => { const next = [...rgb]; next[i] = Number(e.target.value); onChange("#" + next.map(n => n.toString(16).padStart(2, "0")).join("")); }} className="flex-1" /><span className="w-7 text-right">{rgb[i]}</span></label>)}</div>}
    <div className="flex items-center gap-2 mt-3"><span className="w-6 h-6 rounded border border-gray-200" style={{ background: value }} /><input data-ui-field="true" aria-label="색상 코드" value={hex} onChange={e => { setHex(e.target.value); if (/^#[\da-f]{6}$/i.test(e.target.value)) onChange(e.target.value); }} onBlur={() => setHex(value)} className="h-8 flex-1 min-w-0 rounded-lg border border-gray-200 px-2 text-xs" /></div>
    {notice && <p role="status" className="mt-2 text-xs text-gray-500">{notice}</p>}
  </div>;
}
