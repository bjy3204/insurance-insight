"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, Trash2, X, Plus } from "lucide-react";
import { readDdays, writeDdays, validDdayDate, ddayDifference, type DdayItem } from "@/lib/calendar-dday";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

function getDdayLabel(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}


export default function DdayWidget() {
  const { authUser, authStatus, authLoading } = useAuth();
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [saving, setSaving] = useState(false);
  const approved = authStatus === "approved" && !!authUser;
  const localKey = `calendar-dday:${authUser?.id || "guest"}`;
  const [showDdayDatePicker, setShowDdayDatePicker] = useState(false);
const [ddayPickerYear, setDdayPickerYear] = useState(new Date().getFullYear());
const [ddayPickerMonth, setDdayPickerMonth] = useState(new Date().getMonth());
  
// ── D-Day 위젯 ──
const [items, setItems] = useState<DdayItem[]>([]);
const [editingId, setEditingId] = useState<string | null>(null);
const [tempIcon, setTempIcon] = useState("📅");
const [ddayWidgetEditOpen, setDdayWidgetEditOpen] = useState(false);
const [ddayWidgetTempLabel, setDdayWidgetTempLabel] = useState("");
const [ddayWidgetTempDate, setDdayWidgetTempDate] = useState("");

// Approved members retain the existing cloud record; other visitors use local storage.
useEffect(() => {
  if (authLoading) return;
  let active = true;
  const load = async () => {
    setStorageReady(false); setStorageError(""); setItems([]);
    try {
      let record;
      if (approved) {
        const { data, error } = await supabase.from("customer_settings").select("dday_label, dday_date").eq("user_id", authUser.id).maybeSingle();
        if (error) throw error;
        record = data;
      } else {
        const raw = localStorage.getItem(localKey);
        record = raw ? JSON.parse(raw) : null;
      }
      if (active) {
        setItems(readDdays(record));
        setStorageReady(true);
      }
    } catch { if (active) setStorageError("디데이를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요."); }
  };
  void load();
  const reload = () => { void load(); };
  window.addEventListener("calendar-dday-changed", reload);
  window.addEventListener("storage", reload);
  return () => { active = false; window.removeEventListener("calendar-dday-changed", reload); window.removeEventListener("storage", reload); };
}, [authUser?.id, approved, authLoading, localKey]);

useEffect(() => { if (ddayWidgetEditOpen) return lockPageScroll(); }, [ddayWidgetEditOpen]);
const openEditor = (item?: DdayItem) => {
  setEditingId(item?.id || null); setDdayWidgetTempLabel(item?.label || ""); setDdayWidgetTempDate(item?.date || ""); setTempIcon(item?.icon || "📅"); setShowDdayDatePicker(false); setDdayWidgetEditOpen(true);
};
const persist = async (label: string, date: string, remove = false) => {
  if (!storageReady || saving) return false;
  if (!remove && (!label.trim() || !validDdayDate(date))) { setStorageError("제목과 날짜를 입력해 주세요."); return false; }
  setSaving(true); setStorageError("");
  try {
    // Re-read the owner's record so another calendar's additions are not overwritten.
    let current: DdayItem[];
    if (approved) {
      const {data,error}=await supabase.from("customer_settings").select("dday_label, dday_date").eq("user_id",authUser.id).maybeSingle();
      if(error) throw error; current=readDdays(data);
    } else current=readDdays(JSON.parse(localStorage.getItem(localKey)||"null"));
    const entry: DdayItem = {id:editingId || crypto.randomUUID(),label:label.trim(),date,icon:tempIcon};
    if (!remove && editingId && !current.some(item=>item.id===editingId)) throw new Error("이미 삭제된 디데이입니다.");
    const next=remove?current.filter(item=>item.id!==editingId):editingId?current.map(item=>item.id===editingId?entry:item):[...current,entry];
    const record=writeDdays(next);
    if (approved) {
      const {error}=await supabase.from("customer_settings").upsert({user_id:authUser.id,...record},{onConflict:"user_id"});
      if(error) throw error;
    } else localStorage.setItem(localKey,JSON.stringify(record));
    setItems(next); window.dispatchEvent(new Event("calendar-dday-changed")); return true;
  } catch { setStorageError("디데이를 저장하지 못했습니다. 다시 시도해 주세요."); return false; }
  finally { setSaving(false); }
};

  return (
<div className="grid grid-cols-1 gap-3">


  {/* D-Day */}

<div
   className="personal-grid bg-white rounded-3xl border border-gray-200 shadow p-2 relative transition-shadow duration-200 hover:shadow-md"

>

    <div className="p-2.5">
      <div className="flex items-center justify-between gap-2 mb-2"><h2 className="text-base font-bold text-gray-900">D-Day</h2><button type="button" disabled={!storageReady || saving} onClick={() => openEditor()} className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-xs text-slate-500 cursor-pointer disabled:opacity-40"><Plus className="w-3 h-3"/>추가</button></div>
      {items.length ? <div className="divide-y divide-gray-100">{[...items].sort((a,b)=>a.date.localeCompare(b.date)).map(item => <button key={item.id} type="button" disabled={!storageReady || saving} onClick={()=>openEditor(item)} className="w-full flex items-center gap-2 py-2.5 text-left cursor-pointer hover:bg-gray-50 rounded-lg"><span className="text-sm shrink-0">{item.icon}</span><span className="text-xs font-semibold min-w-0 flex-1 truncate" title={item.label}>{item.label}</span><span className="text-[11px] text-slate-400 shrink-0">{item.date.replaceAll("-", ". ")}</span><span className="text-xs font-bold text-rose-500 shrink-0 min-w-9 text-right">{getDdayLabel(ddayDifference(item.date))}</span></button>)}</div> : <p className="text-sm text-gray-400 py-3">{storageReady ? "소중한 날짜를 기록해보세요" : "디데이를 불러오는 중입니다"}</p>}
      {storageError && !ddayWidgetEditOpen && <p role="status" className="text-xs text-red-500 mt-2">{storageError}</p>}
    </div>
    {ddayWidgetEditOpen && createPortal(
      <>
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center" onClick={event => { event.stopPropagation(); if (!saving) setDdayWidgetEditOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label="D-Day 설정" className="bg-white rounded-3xl shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-black text-gray-900">
    D-Day 설정
  </h3>

  <div className="flex items-center gap-1">
    {editingId && <button
      aria-label="디데이 삭제" disabled={!storageReady || saving}
      onClick={async () => {
        if (await persist("", "", true)) setDdayWidgetEditOpen(false);
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition cursor-pointer"
    >
      <Trash2 className="w-4 h-4 text-red-400" />
    </button>}

    <button data-popup-close="true"
      disabled={saving} aria-label="디데이 설정 닫기" onClick={() => setDdayWidgetEditOpen(false)}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
    >
      <X className="w-4 h-4 text-gray-500" />
    </button>
  </div>
</div>
            <div className="flex flex-wrap gap-2 mb-3">{["📅","🔔","💻","✏️","✈️","❤️"].map(icon=><button key={icon} type="button" disabled={saving} aria-label={icon} aria-pressed={tempIcon===icon} onClick={()=>setTempIcon(icon)} className={`w-9 h-9 rounded-lg text-lg cursor-pointer ${tempIcon===icon?"bg-blue-50 ring-1 ring-blue-200":"hover:bg-gray-50"}`}>{icon}</button>)}</div>
            <input
              disabled={saving}
              type="text"
              value={ddayWidgetTempLabel}
              onChange={(e) => setDdayWidgetTempLabel(e.target.value)}
              placeholder="제목"
              className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm mb-3 outline-none focus:border-blue-400"
            />
            <div className="relative mb-4">
  <button
    type="button"
    onClick={() => {
      if (ddayWidgetTempDate) {
        const [y, m] = ddayWidgetTempDate.split("-").map(Number);
        setDdayPickerYear(y);
        setDdayPickerMonth(m - 1);
      }
      setShowDdayDatePicker(!showDdayDatePicker);
    }}
    className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm text-left flex items-center justify-between hover:bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
  >
    <span>{ddayWidgetTempDate || "날짜 선택"}</span>
    <Calendar className="w-4 h-4 text-gray-500" />
  </button>

  {showDdayDatePicker && (
    <>
      <div
        className="fixed inset-0 z-[70]"
        onClick={() => setShowDdayDatePicker(false)}
      />

      <div className="absolute top-13 left-0 bg-white border border-gray-200 rounded-3xl p-5 z-[80] shadow-xl w-[320px]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (ddayPickerMonth === 0) {
                setDdayPickerMonth(11);
                setDdayPickerYear(ddayPickerYear - 1);
              } else {
                setDdayPickerMonth(ddayPickerMonth - 1);
              }
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-base font-black text-gray-900">
            {ddayPickerYear}년 {ddayPickerMonth + 1}월
          </span>

          <button
            type="button"
            onClick={() => {
              if (ddayPickerMonth === 11) {
                setDdayPickerMonth(0);
                setDdayPickerYear(ddayPickerYear + 1);
              } else {
                setDdayPickerMonth(ddayPickerMonth + 1);
              }
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-bold py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const firstDow = new Date(ddayPickerYear, ddayPickerMonth, 1).getDay();
            const daysInMonth = new Date(ddayPickerYear, ddayPickerMonth + 1, 0).getDate();
            const cells = [];

            for (let i = 0; i < firstDow; i++) {
              cells.push(<div key={`empty-${i}`} />);
            }

            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${ddayPickerYear}-${String(ddayPickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = ddayWidgetTempDate === dateStr;
              const dow = new Date(ddayPickerYear, ddayPickerMonth, d).getDay();

              cells.push(
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDdayWidgetTempDate(dateStr);
                    setShowDdayDatePicker(false);
                  }}
                  className={`h-9 rounded-xl text-sm font-bold transition ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : dow === 0
                      ? "text-red-400 hover:bg-gray-100"
                      : dow === 6
                      ? "text-blue-400 hover:bg-gray-100"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              );
            }

            return cells;
          })()}
        </div>
      </div>
    </>
  )}
</div>
            {storageError && <p role="status" className="mb-2 text-sm text-red-500">{storageError}</p>}
            <button
              disabled={!storageReady || saving}
              onClick={async () => {
                if (await persist(ddayWidgetTempLabel, ddayWidgetTempDate)) setDdayWidgetEditOpen(false);
              }}
              className="w-full h-11 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-400 transition"
            >
              저장
            </button>
          </div>
        </div>
      </>, document.body
    )}
  </div>
</div>
  );
}
