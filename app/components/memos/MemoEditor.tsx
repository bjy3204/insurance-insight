"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type ReactQuill from "react-quill-new";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { decodeMemo, encodeMemo, MEMO_BACKGROUNDS, plainMemoHtml, type MemoItem } from "@/lib/memos/model";
import { memoHtmlText, sanitizeMemoHtml } from "@/lib/memos/html";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import DesktopMemoColorPicker from "./DesktopMemoColorPicker";
import MemoColorPicker from "./MemoColorPicker";
import "react-quill-new/dist/quill.snow.css";

const RichEditor = dynamic(() => import("./MemoRichInput"), { ssr: false });
export default function MemoEditor({ memo, onClose, kind = "memo", extraFields, onSaveRecord, onDeleteRecord, inline = false }: { inline?: boolean; memo: MemoItem | null; onClose: () => void; kind?: "memo" | "diary"; extraFields?: React.ReactNode; onSaveRecord?: (record: MemoItem) => Promise<void>; onDeleteRecord?: () => Promise<void> }) {
  const { memos, persistMemos } = useAuth();
  const original = useMemo(() => memo ? decodeMemo(memo) : decodeMemo({ content: "", color: "white" }), [memo?.id]);
  const [title, setTitle] = useState(memo?.title || "");
  const [html, setHtml] = useState(() => original.html ? sanitizeMemoHtml(original.html) : plainMemoHtml(original.text));
  const [background, setBackground] = useState(original.background);
  const [opacity, setOpacity] = useState(original.opacity);
  const [category, setCategory] = useState(original.category);
  const [picker, setPicker] = useState<"background" | "text" | null>(null);
  const [textColor, setTextColor] = useState("#171717");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const editor = useRef<ReactQuill>(null);
  const selection = useRef<{ index: number; length: number } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const memosRef = useRef(memos); memosRef.current = memos;
  const toolbarId = "memo-toolbar-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const modules = useMemo(() => ({ toolbar: { container: `#${toolbarId}` } }), [toolbarId]);
  useEffect(() => { if (!inline) return lockPageScroll(); }, [inline]);
  useEffect(() => { panel.current?.querySelector<HTMLInputElement>("input")?.focus(); }, []);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    
    const keydown = (event: KeyboardEvent) => {
      if (inline && !panel.current?.contains(event.target as Node)) return;
      if (event.key === "Escape" && !busy) { if ((event.target as HTMLElement).closest('[role="listbox"]')) return; event.stopImmediatePropagation(); if (picker) setPicker(null); else onClose(); }
      if (event.key === "Tab" && !inline) {
        const fields = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[contenteditable="true"]') || []);
        if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); before?.focus(); };
  }, [busy, picker, onClose, inline]);
  const save = async () => {
    if (busy) return;
    const clean = sanitizeMemoHtml(html); const text = memoHtmlText(clean);
    if (!title.trim() && !text) { setNotice(kind === "diary" ? "제목이나 일기 내용을 입력하시기 바랍니다." : "제목이나 메모 내용을 입력해 주세요."); return; }
    setBusy(true); setNotice("");
    const now = new Date().toISOString();
    const record: MemoItem = { ...(memo || { id: crypto.randomUUID(), pinned: false, visible: false, color: "white", createdAt: now }), title: title.trim(), content: encodeMemo({ ...original, text, html: clean, background, opacity, category }), updatedAt: now };
    try {
      const current = memosRef.current;
      if (onSaveRecord) await onSaveRecord(record); else await persistMemos(memo ? current.map(item => item.id === memo.id ? record : item) : [record, ...current]);
      onClose();
    } catch (error) { setNotice(onSaveRecord && error instanceof Error ? error.message : "저장하지 못했습니다. 입력한 내용은 그대로 남아 있습니다."); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!memo || busy || !window.confirm(kind === "diary" ? "이 일기를 삭제하시겠습니까?" : "이 메모를 삭제하시겠습니까?")) return;
    setBusy(true);
    try { if (onDeleteRecord) await onDeleteRecord(); else await persistMemos(memosRef.current.filter(item => item.id !== memo.id)); onClose(); }
    catch { setNotice(kind === "diary" ? "일기를 삭제하지 못했습니다." : "메모를 삭제하지 못했습니다."); }
    finally { setBusy(false); }
  };
  const content = <div className={inline ? "w-full" : "fixed inset-0 z-[6000] bg-black/40 flex items-center justify-center p-4"} onClick={() => { if (!busy) onClose(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-label={kind === "diary" ? (memo ? "일기 수정" : "일기 쓰기") : (memo ? "메모 수정" : "메모 추가")} onClick={e => e.stopPropagation()} className={inline ? "memo-editor-panel bg-white w-full" : "memo-editor-panel bg-white w-full max-w-lg rounded-3xl shadow-xl p-5 md:p-6 max-h-[calc(100dvh-32px)] overflow-y-auto"} style={{ transform: `translate(${position.x}px,${position.y}px)` }}>
      <div className="flex items-center justify-between mb-4" onPointerDown={event => {
        if (inline || (event.target as HTMLElement).closest("button") || event.button !== 0) return;
        const startX = event.clientX, startY = event.clientY;
        const x = position.x, y = position.y;
        const move = (e: PointerEvent) => setPosition({ x: Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, x + e.clientX - startX)), y: Math.max(-window.innerHeight / 3, Math.min(window.innerHeight / 3, y + e.clientY - startY)) });
        const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop, { once: true });
      }}><h2 className="text-xl font-bold text-gray-900">{kind === "diary" ? (memo ? "일기 수정" : "일기 쓰기") : (memo ? "메모 수정" : "메모 추가")}</h2><div className="flex items-center gap-4"><div className={kind === "diary" ? "hidden" : "flex items-center gap-2"}>{([{key:"white",label:"흰색"},{key:"blue",label:"파란색"},{key:"yellow",label:"노란색"},{key:"red",label:"분홍색"},{key:"clear",label:"투명"}] as const).map(option=><button key={option.key} type="button" disabled={busy} aria-label={option.label} title={option.label} aria-pressed={background===MEMO_BACKGROUNDS[option.key] && (option.key==="clear"?opacity<1:opacity===1)} onClick={()=>{setBackground(MEMO_BACKGROUNDS[option.key]);setOpacity(option.key==="clear"?.4:1);}} className={`w-7 h-7 rounded-full border border-gray-200 cursor-pointer ${background===MEMO_BACKGROUNDS[option.key] && (option.key==="clear"?opacity<1:opacity===1)?"ring-2 ring-gray-400 ring-offset-2":""}`} style={{background:option.key==="clear"?"repeating-conic-gradient(#e5e7eb 0% 25%,white 0% 50%) 0 / 8px 8px":MEMO_BACKGROUNDS[option.key]}}/>)}</div><button type="button" disabled={busy} onClick={onClose} aria-label="메모 편집 닫기" className="p-2 rounded-full text-gray-400 hover:bg-gray-100 cursor-pointer"><X className="w-5 h-5" /></button></div></div>
      
      <input aria-label="메모 제목" value={title} disabled={busy} onChange={e => setTitle(e.target.value)} placeholder={kind === "diary" ? "일기 제목" : "메모 제목"} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mb-3 outline-none focus:border-blue-400" />
      
      {extraFields}
      <div className={`memo-rich-editor bg-white rounded-2xl overflow-hidden border border-gray-200 ${kind === "diary" && inline ? "diary-rich-editor" : ""}`}>
        <div id={toolbarId} className="memo-custom-toolbar"><span className="ql-formats"><button type="button" disabled={busy} aria-label="글자색 선택" title="글자색" onMouseDown={e=>e.preventDefault()} onClick={()=>{selection.current=editor.current?.getEditor().getSelection()||selection.current;setPicker(picker==="text"?null:"text");}} className="memo-font-color"><svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path d="M5 12L9 3L13 12M6.4 9H11.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16H15" stroke={textColor} strokeWidth="2" strokeLinecap="round"/></svg></button><button type="button" className="ql-bold" aria-label="굵게" title="굵게"/><button type="button" className="ql-underline" aria-label="밑줄" title="밑줄"/><button type="button" className="ql-italic" aria-label="기울임" title="기울임"/></span><span className="ql-formats"><button type="button" className="ql-list" value="check" aria-label="체크 목록" title="체크 목록"/><button type="button" className="ql-list" value="bullet" aria-label="점 목록" title="점 목록"/></span></div>
        <RichEditor editorRef={editor} value={html} onChange={setHtml} theme="snow" modules={modules} formats={["bold", "underline", "italic", "color", "list"]} readOnly={busy} useSemanticHTML={false} placeholder={kind === "diary" ? "일기 내용을 입력하세요" : "메모 내용을 입력하세요"} onChangeSelection={range => { if (range) selection.current = range; }} />
      </div>

      {picker && createPortal(<div className="fixed inset-0 z-[7100] flex items-center justify-center p-4 bg-black/10" onClick={e => { e.stopPropagation(); setPicker(null); }}><div className="w-full max-w-[360px] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl" onClick={e => e.stopPropagation()}><div className={picker === "text" ? "md:hidden" : ""}><MemoColorPicker value={picker === "background" ? background : textColor} onClose={() => setPicker(null)} onChange={color => {
        if (picker === "background") setBackground(color);
        else { const active=document.activeElement as HTMLElement | null; setTextColor(color); const quill = editor.current?.getEditor(); if (quill) { if (selection.current) quill.setSelection(selection.current.index, selection.current.length); quill.format("color", color, "user"); active?.focus({preventScroll:true}); } }
      }} /></div>{picker === "text" && <div className="hidden md:block"><DesktopMemoColorPicker value={textColor} onClose={()=>setPicker(null)} onChange={color=>{const active=document.activeElement as HTMLElement | null;setTextColor(color);const quill=editor.current?.getEditor();if(quill){if(selection.current)quill.setSelection(selection.current.index,selection.current.length);quill.format("color",color,"user");active?.focus({preventScroll:true});}}}/></div>}</div></div>, document.body)}
      {notice && <p role="status" className="text-sm text-red-500 mt-3">{notice}</p>}
      <div className="flex gap-3 mt-5">{memo && !inline ? <button type="button" disabled={busy} onClick={remove} className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-red-50 cursor-pointer disabled:opacity-50">삭제</button> : <button type="button" disabled={busy} onClick={onClose} className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold cursor-pointer">취소</button>}<button type="button" disabled={busy} onClick={save} className={`flex-1 h-11 rounded-xl ${kind === "diary" ? "bg-blue-600" : "bg-gray-900"} text-white text-sm font-bold cursor-pointer disabled:opacity-50`}>{busy ? "저장 중..." : inline ? "저장" : "완료"}</button></div>
    </div>
  </div>;
  return inline ? content : createPortal(content, document.body);
}
