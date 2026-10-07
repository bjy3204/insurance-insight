"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Pencil, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import DiaryDateField from "./DiaryDateField";
import MemoEditor from "@/app/components/memos/MemoEditor";
import MemoBody from "@/app/components/memos/MemoBody";
import { decodeMemo, type MemoItem } from "@/lib/memos/model";

type Entry = { id: string; date: string; content: string; mood: string; created_at: string };
const prefix = "[insurance-insight:diary:v1]";
const moods = [{ value: "great", label: "최고예요" }, { value: "good", label: "좋아요" }, { value: "neutral", label: "보통이에요" }, { value: "bad", label: "아쉬워요" }, { value: "awful", label: "힘들어요" }];
function MoodFace({ mood, large = false }: { mood: string; large?: boolean }) {
  const color = ({ great: "#f4b400", good: "#ff4f9a", neutral: "#16b89a", bad: "#3985ff", awful: "#8b75da" } as Record<string, string>)[mood] || "#ff4f9a";
  const mouth = mood === "bad" || mood === "awful" ? "M8 16Q12 12 16 16" : mood === "neutral" ? "M8 15H16" : "M8 14Q12 19 16 14";
  return <span className={large ? "inline-flex items-center justify-center w-14 h-14 rounded-full shrink-0" : "inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0"} style={{ color, backgroundColor: color + "12" }} role="img" aria-label={moods.find(option => option.value === mood)?.label || "좋아요"}><svg viewBox="0 0 24 24" className={large ? "w-9 h-9" : "w-6 h-6"} fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="9.5" r="1" fill="currentColor"/><circle cx="15" cy="9.5" r="1" fill="currentColor"/><path d={mouth} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></span>;
}
function asMemo(entry: Entry): MemoItem {
  let title = "", content = entry.content;
  if (content.startsWith(prefix)) {
    try { const data = JSON.parse(content.slice(prefix.length)); if (typeof data.title === "string" && typeof data.content === "string") { title = data.title; content = data.content; } } catch { /* Keep existing text. */ }
  }
  return { id: entry.id, title, content, pinned: false, visible: false, color: "white", createdAt: entry.created_at, updatedAt: entry.created_at };
}
const dateLabel = (date: string) => new Date(date + "T12:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

export default function DiaryTab() {
  const { authUser } = useAuth();
  const owner = authUser?.id;
  const ownerRef = useRef(owner); ownerRef.current = owner;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Entry | null | undefined>(undefined);
  const [date, setDate] = useState("");
  const [mood, setMood] = useState("good");
  useEffect(() => {
    let active = true; setEntries([]); setSelected(null); setEdit(undefined); setLoading(true); setError("");
    if (!owner) { setLoading(false); return; }
    supabase.from("cm_diaries").select("id,date,content,mood,created_at").eq("user_id", owner).order("date", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) setError("일기를 불러오지 못했습니다. 잠시 후 다시 시도하시기 바랍니다.");
      else setEntries(data || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [owner]);
  const filtered = entries.filter(entry => {
    const memo = asMemo(entry);
    return entry.date.startsWith(month) && `${memo.title} ${decodeMemo(memo).text}`.toLowerCase().includes(search.toLowerCase());
  });
  const current = filtered.find(entry => entry.id === selected) || filtered[0];
  const open = (entry: Entry | null) => {
    if (edit !== undefined && !window.confirm("수정 중인 내용을 취소하시겠습니까?")) return;
    const now = new Date();
    setDate(entry?.date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    setMood(entry?.mood || "good"); setEdit(entry);
  };
  const shiftMonth = (offset: number) => { if (edit !== undefined && !window.confirm("수정 중인 내용을 취소하고 다른 달로 이동하시겠습니까?")) return; setEdit(undefined); const [y, m] = month.split("-").map(Number); const next = new Date(y, m - 1 + offset, 1); setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`); setSelected(null); };
  const save = async (memo: MemoItem) => {
    if (!owner || ownerRef.current !== owner) throw new Error("로그인이 필요합니다.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + "T12:00:00").getTime())) throw new Error("날짜를 선택하시기 바랍니다.");
    if (entries.some(entry => entry.date === date && entry.id !== edit?.id)) throw new Error("이 날짜에는 이미 일기가 있습니다. 기존 일기를 수정하시기 바랍니다.");
    const payload = { date, mood, content: prefix + JSON.stringify({ title: memo.title, content: memo.content }) };
    const query = edit ? supabase.from("cm_diaries").update(payload).eq("id", edit.id).eq("user_id", owner) : supabase.from("cm_diaries").insert({ ...payload, user_id: owner });
    const { data, error } = await query.select("id,date,content,mood,created_at").single();
    if (error) throw error;
    if (ownerRef.current !== owner) return;
    setEntries(previous => [data, ...previous.filter(entry => entry.id !== data.id)].sort((a, b) => b.date.localeCompare(a.date)));
    setMonth(date.slice(0, 7)); setSelected(data.id);
  };
  const remove = async (entry: Entry) => {
    if (!owner || ownerRef.current !== owner) throw new Error("로그인이 필요합니다.");
    const { error } = await supabase.from("cm_diaries").delete().eq("id", entry.id).eq("user_id", owner);
    if (error) throw error;
    if (ownerRef.current === owner) setEntries(previous => previous.filter(item => item.id !== entry.id));
  };
  const editor = <MemoEditor inline key={edit?.id || "new-diary"} kind="diary" memo={edit ? asMemo(edit) : null} onClose={() => setEdit(undefined)} onSaveRecord={save} onDeleteRecord={edit ? () => remove(edit) : undefined} extraFields={<div className="mb-3 space-y-3"><DiaryDateField value={date} onChange={setDate} /><div className="flex gap-2 flex-wrap">{moods.map(option => <button type="button" key={option.value} onClick={() => setMood(option.value)} aria-pressed={mood === option.value} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm cursor-pointer ${mood === option.value ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "bg-gray-50 text-gray-600"}`}><MoodFace mood={option.value} />{option.label}</button>)}</div></div>} />;
  return <section className="space-y-4 cursor-default">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-3 text-xl font-bold"><BookOpen className="w-7 h-7 text-blue-500" />일기</h2><div className="flex w-full sm:w-[520px] max-w-full items-center gap-3"><label data-page-search-wrapper="true" className="flex min-w-0 items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-11 flex-1 focus-within:border-blue-400"><Search className="w-4 h-4 shrink-0 text-slate-400" /><input data-ui-field="true" data-page-search-input="true" value={search} onChange={event => setSearch(event.target.value)} placeholder="일기 검색 (제목, 내용)" aria-label="일기 검색" className="min-w-0 w-full h-full text-sm text-gray-900 caret-gray-900 cursor-text outline-none" /></label><button type="button" disabled={!owner || loading} onClick={() => open(null)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 h-11 text-sm font-bold whitespace-nowrap text-white cursor-pointer disabled:opacity-50"><Pencil className="w-5 h-5" />일기 쓰기</button></div></div>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.8fr)] gap-3">
      <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 min-w-0 min-h-[520px] flex flex-col">
        <div className="relative flex items-center justify-center mb-4"><div className="flex items-center justify-center gap-3"><button type="button" aria-label="이전 달" onClick={() => shiftMonth(-1)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"><ChevronLeft size={18} /></button><span className="font-bold">{month.replace("-", "년 ")}월</span><button type="button" aria-label="다음 달" onClick={() => shiftMonth(1)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"><ChevronRight size={18} /></button></div></div>
        <div className={`flex-1 max-h-[640px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${!loading && filtered.length === 0 ? "flex items-center justify-center" : ""}`}>
          {loading ? <p className="p-5 text-sm text-gray-400">불러오는 중...</p> : filtered.length === 0 ? <p className="p-5 text-sm text-gray-400">이 달의 일기가 없습니다.</p> : filtered.map(entry => {
            const memo = asMemo(entry), day = new Date(entry.date + "T12:00:00");
            return <button type="button" key={entry.id} onClick={() => { if (edit !== undefined && !window.confirm("수정 중인 내용을 취소하고 다른 일기를 보시겠습니까?")) return; setEdit(undefined); setSelected(entry.id); }} className={`w-full flex gap-4 p-4 text-left rounded-xl cursor-pointer ${current?.id === entry.id ? "bg-blue-50" : "border-b border-gray-100 hover:bg-gray-50"}`}><div className={`w-8 shrink-0 text-center ${current?.id === entry.id ? "text-blue-600" : "text-gray-700"}`}><div className="text-xl font-bold">{day.getDate()}</div><div className="text-xs mt-1">{day.toLocaleDateString("ko-KR", { weekday: "short" })}</div></div><div className="min-w-0 flex-1"><h3 className="font-bold truncate">{memo.title || "제목 없는 일기"}</h3><p className="line-clamp-2 text-sm text-gray-500 mt-1 whitespace-pre-wrap">{decodeMemo(memo).text}</p></div><MoodFace mood={entry.mood} /></button>;
          })}
        </div>
      </aside>
      <article className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 md:p-8 min-w-0 min-h-[520px] flex flex-col">
        {edit !== undefined ? editor : current ? <><div className="flex justify-between gap-4"><div><p className="text-gray-500 mb-3">{dateLabel(current.date)}</p><h3 className="text-2xl font-bold">{asMemo(current).title || "제목 없는 일기"}</h3></div><div className="flex items-center gap-2 self-center"><MoodFace mood={current.mood} large /><div><p className="text-xs text-gray-500">오늘의 기분</p><p className="font-bold mt-1">{moods.find(option => option.value === current.mood)?.label || "좋아요"}</p></div></div></div><div className="border-t border-gray-100 mt-6 pt-5 flex-1"><MemoBody memo={asMemo(current)} className="!max-h-none !p-0 !text-base !leading-8" /></div><div className="flex justify-end items-center gap-4 mt-6"><button type="button" aria-label="일기 삭제" onClick={async () => { if (!window.confirm("이 일기를 삭제하시겠습니까?")) return; try { await remove(current); } catch { setError("일기를 삭제하지 못했습니다."); } }} className="text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={17} /></button><button type="button" onClick={() => open(current)} aria-label="일기 수정" title="일기 수정" className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"><Pencil size={17} /></button></div><p className="text-xs text-gray-400 text-right mt-3">{new Date(current.created_at).toLocaleString("ko-KR")}</p></> : <p className="m-auto text-sm text-gray-400">일기를 선택하거나 새로운 이야기를 기록하시기 바랍니다.</p>}
      </article>
    </div>

  </section>;
}
