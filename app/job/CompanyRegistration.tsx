"use client";
import { useState, useEffect, useRef } from "react";
import { X, Upload, CheckCircle2, PlusCircle } from "lucide-react";

export default function CompanyRegistration() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);
  const uploaded = useRef(new Map<File, string>());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number; left: number; top: number; width: number } | null>(null);
  useEffect(() => {
    const show = () => { setOpen(true); setSuccess(false); setError(""); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busyRef.current) setOpen(false); };
    window.addEventListener("open-company-registration", show);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("open-company-registration", show); window.removeEventListener("keydown", escape); };
  }, []);
  if (!open) return null;
  const close = () => { if (!busyRef.current) setOpen(false); };
  return <div className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-4" onClick={close}>
    <div data-popup-frame="true" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} role="dialog" aria-modal="true" aria-labelledby="company-register-title" className="bg-white w-full max-w-2xl max-h-[90dvh] rounded-3xl overflow-hidden flex flex-col shadow-xl" onClick={event => event.stopPropagation()}>
      <header data-popup-header="true" className="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0 select-none touch-none"
        onPointerDown={event => {
          if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          event.preventDefault();
          const rect = event.currentTarget.parentElement!.getBoundingClientRect();
          drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, ...position, left: rect.left, top: rect.top, width: rect.width };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          setPosition({ x: current.x + Math.max(48 - current.width - current.left, Math.min(window.innerWidth - 48 - current.left, event.clientX - current.startX)), y: current.y + Math.max(-current.top, Math.min(window.innerHeight - 48 - current.top, event.clientY - current.startY)) });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}
      >
        <h2 id="company-register-title" className="text-lg font-bold flex items-center gap-2"><PlusCircle size={21} className="text-blue-600"/>회사 등록</h2>
        <button type="button" data-popup-close="true" aria-label="닫기" onClick={close} disabled={busy} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer disabled:opacity-40"><X size={20}/></button>
      </header>
      {success ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto text-blue-600" size={40}/><h3 className="font-bold text-xl mt-4">등록 신청이 완료되었습니다</h3><p className="text-sm text-slate-500 mt-3">검토 후 승인된 조직만 채용공고에 게시됩니다.</p><button onClick={close} className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-[46px] px-4 text-sm cursor-pointer">확인</button></div> : <form ref={form} className="flex flex-col min-h-0" onSubmit={async event => {
        event.preventDefault(); if (busyRef.current) return;
        busyRef.current = true; setBusy(true); setError("");
        try {
          const values = Object.fromEntries(new FormData(event.currentTarget).entries());
          const images: string[] = [];
          for (const [index, file] of files.entries()) {
            setProgress(`이미지 업로드 ${index + 1}/${files.length}`);
            let id = uploaded.current.get(file);
            if (!id) {
              const body = new FormData(); body.append("file", file);
              const response = await fetch("/api/company/register?action=upload", { method: "POST", body });
              const result = await response.json(); if (!response.ok) throw new Error(result.error);
              id = result.id as string; uploaded.current.set(file, id);
            }
            images.push(id);
          }
          setProgress("신청 등록 중");
          const response = await fetch("/api/company/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, images }) });
          const result = await response.json(); if (!response.ok) throw new Error(result.error);
          setSuccess(true); setFiles([]); uploaded.current.clear();
        } catch (error) { setError(error instanceof Error ? error.message : "신청하지 못했습니다. 다시 시도해 주세요."); }
        finally { busyRef.current = false; setBusy(false); setProgress(""); }
      }}>
        <div className="p-6 overflow-y-auto min-h-0 space-y-5" style={{ scrollbarWidth: "none" }}>
          <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4 disabled:opacity-60">
            {[{ name: "이름", placeholder: "이름 (직급)" }, { name: "연락처", placeholder: "010-1234-5678 또는 카카오톡 링크" }, { name: "지역", placeholder: "활동 지역" }, { name: "회사명", placeholder: "회사명" }, { name: "조직명", placeholder: "지점·조직명" }].map(field => <label key={field.name} className={field.name === "조직명" ? "sm:col-span-2" : ""}><span className="block text-sm font-semibold mb-2">{field.name} <span className="text-blue-600">*</span></span><input data-ui-field="true" autoFocus={field.name === "이름"} name={field.name} required maxLength={200} placeholder={field.placeholder} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/></label>)}
            <label className="sm:col-span-2"><span className="block text-sm font-semibold mb-2">조직소개 <span className="text-blue-600">*</span></span><textarea data-ui-field="true" name="조직소개" required maxLength={10000} rows={5} placeholder="조직의 특징과 근무 환경을 소개해 주세요" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-y"/></label>
            <div className="sm:col-span-2"><span className="block text-sm font-semibold mb-2">소개 이미지</span><label className="flex items-center justify-center gap-2 p-4 border border-dashed border-gray-300 rounded-xl hover:bg-blue-50 cursor-pointer text-sm text-slate-600"><Upload size={17}/>이미지 선택<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={event => {
              const next = [...files, ...Array.from(event.target.files || [])];
              event.target.value = "";
              if (next.length > 20 || next.some(file => file.size > 5 * 1024 * 1024)) { setError("이미지는 파일당 5MB 이하, 최대 20개까지 첨부할 수 있습니다."); return; }
              setFiles(next); setError("");
            }}/></label><p className="mt-2 text-xs text-slate-400">파일당 5MB · 최대 20개</p>{files.map((file,index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between text-xs text-slate-600 mt-2 gap-2"><span className="truncate">{file.name}</span><button type="button" aria-label={`${file.name} 제거`} onClick={() => setFiles(files.filter((_, i) => i !== index))} className="p-1 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"><X size={15}/></button></div>)}</div>
            <label className="sm:col-span-2"><span className="block text-sm font-semibold mb-2">홈페이지 URL</span><input data-ui-field="true" type="url" name="website" maxLength={2000} placeholder="https://" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/></label>
          </fieldset>
          <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl">입력된 정보는 검토 후 승인된 조직만 등록됩니다.</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0"><button type="button" disabled={busy} onClick={close} className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 h-[46px] px-4 text-sm font-semibold cursor-pointer disabled:opacity-50">취소</button><button type="submit" disabled={busy} className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800 text-white h-[46px] px-4 text-sm font-semibold cursor-pointer disabled:opacity-50">{busy ? progress || "신청 중" : "등록 신청"}</button></div>
      </form>}
    </div>
  </div>;
}
