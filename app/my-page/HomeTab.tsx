"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  BookOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  StickyNote,
  Calendar,
  Smile,
  Frown,
  Meh,
  NotebookPen,
  Heart,
  Star,
} from "lucide-react";
import type { CustomerSettings } from "./page";
import PlantSVG, { getPlantStage, type PlantStage } from "./PlantSVG";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type DiaryEntry = {
  id: string;
  date: string;
  content: string;
  mood: "great" | "good" | "neutral" | "bad" | "awful";
  created_at: string;
};

type DdayItem = {
  name: string;
  date: string;
  type: "birthday" | "myeonchek" | "gamek" | "silson";
  dday: number;
};

function calcDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDdayLabel(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

function getDdayColor(dday: number): string {
  if (dday <= 0) return "text-red-600 bg-red-50 border-red-200";
  if (dday <= 7) return "text-orange-600 bg-orange-50 border-orange-200";
  if (dday <= 30) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-blue-600 bg-blue-50 border-blue-200";
}

function calcSilsonRenewalDate(startDateStr: string): string | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;
  const cutoff2013 = new Date("2013-01-01");
  const cutoff4gen = new Date("2021-07-01");
  if (start < cutoff2013) return null;
  const years = start >= cutoff4gen ? 5 : 15;
  const renewal = new Date(start);
  renewal.setFullYear(renewal.getFullYear() + years);
  return renewal.toISOString().split("T")[0];
}

type AttendanceRecord = {
  date: string;
  watered: boolean;
};



const MOOD_OPTIONS = [
  { value: "great", label: "최고", icon: Star, color: "text-yellow-500" },
  { value: "good", label: "좋음", icon: Smile, color: "text-green-500" },
  { value: "neutral", label: "보통", icon: Meh, color: "text-gray-400" },
  { value: "bad", label: "나쁨", icon: Frown, color: "text-orange-400" },
  { value: "awful", label: "최악", icon: Heart, color: "text-red-400" },
] as const;

const moodEmoji: Record<string, string> = {
  great: "⭐",
  good: "😊",
  neutral: "😐",
  bad: "😞",
  awful: "😢",
};

// ─────────────────────────────────────────────
// 식물 단계 계산
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 메인 HomeTab
// ─────────────────────────────────────────────
export default function HomeTab({
  settings,
  view = "home",
  hiddenHomeMenus,
  onPlantStageChange,
  plantPopupOpen = false,
  onPlantPopupClose,
}: {
  settings: CustomerSettings | null;
  view?: "home" | "memo" | "diary";
  hiddenHomeMenus: string[];
  onPlantStageChange?: (stage: PlantStage) => void;
  plantPopupOpen?: boolean;
  onPlantPopupClose?: () => void;
}) {

  useEffect(() => {
    if (!plantPopupOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onPlantPopupClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [plantPopupOpen, onPlantPopupClose]);

  const isHidden = (id: string) =>
  hiddenHomeMenus.includes(id);

  const { authUser } = useAuth();

  // ── 오늘 일정 ──
  const [todayEvents, setTodayEvents] = useState<{ id: string; title: string; time: string; icon: string; color: string; place: string; date: string; memo: string; }[]>([]);
  const [todayEventEditOpen, setTodayEventEditOpen] = useState(false);
  const [editingTodayEvent, setEditingTodayEvent] = useState<{ id: string; title: string; time: string; icon: string; color: string; place: string; date: string; memo: string; } | null>(null);
  const [todayEventForm, setTodayEventForm] = useState({ title: "", time: "", place: "", memo: "", icon: "📅", color: "blue" });


   // ── 체크리스트 ──
  const [checklists, setChecklists] = useState<{ id: string; text: string; completed: boolean; }[]>([]);
  const [checklistText, setChecklistText] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState("");

  // ── 날씨 위젯 ──


const [viewingDiary, setViewingDiary] = useState<DiaryEntry | null>(null);
const [editingMemo, setEditingMemo] = useState<any | null>(null);
const [editMemoTitle, setEditMemoTitle] = useState("");
const [editMemoContent, setEditMemoContent] = useState("");
const [confirmDelete, setConfirmDelete] = useState<{ type: "memo" | "diary"; id: string } | null>(null);

const [viewingMemo, setViewingMemo] = useState<any | null>(null);
const [showDiaryDatePicker, setShowDiaryDatePicker] = useState(false);
const [diaryPickerYear, setDiaryPickerYear] = useState(new Date().getFullYear());
const [diaryPickerMonth, setDiaryPickerMonth] = useState(new Date().getMonth());
  const [diaryMonth, setDiaryMonth] = useState(() => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
});


  const [privateMemos, setPrivateMemos] = useState<any[]>([]);
const [privateMemoAddOpen, setPrivateMemoAddOpen] = useState(false);
const [privateMemoTitle, setPrivateMemoTitle] = useState("");
const [privateMemoContent, setPrivateMemoContent] = useState("");
const [privateMemoColor, setPrivateMemoColor] = useState("white");

const [memoPage, setMemoPage] = useState(1);
const [diaryPage, setDiaryPage] = useState(1);

const ITEMS_PER_PAGE = 10;
const PAGE_GROUP = 5;

  // 일기
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(true);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  const [diaryForm, setDiaryForm] = useState({ date: "", content: "", mood: "good" as DiaryEntry["mood"] });
  const [diaryError, setDiaryError] = useState("");

  // 물주기
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [todayWatered, setTodayWatered] = useState(false);
  const [wateringAnim, setWateringAnim] = useState(false);

  const [plantPos, setPlantPos] = useState({ x: 40, y: 180 });
  const plantPositionDirty = useRef(false);
  const plantCardRef = useRef<HTMLDivElement>(null);
  const clampPlantPosition = (x: number, y: number) => ({
    x: Math.max(0, Math.min(Math.max(0, window.innerWidth - (plantCardRef.current?.offsetWidth || 180)), x)),
    y: Math.max(0, Math.min(Math.max(0, window.innerHeight - (plantCardRef.current?.offsetHeight || 250)), y)),
  });

const [plantDragInfo, setPlantDragInfo] = useState<null | {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}>(null);

  // 캘린더
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [customerEvents, setCustomerEvents] = useState<Record<string, { type: string; name: string }[]>>({});
  const [ddayItems, setDdayItems] = useState<DdayItem[]>([]);
  const [ddayFilter, setDdayFilter] = useState<"all" | "birthday" | "myeonchek" | "gamek" | "silson">("all");

  const today = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayStr = new Date(today.getTime() + kstOffset).toISOString().split("T")[0];

useEffect(() => {
  if (!authUser) return;
  supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10)
    .then(({ data }) => setChecklists(data || []));
}, [authUser]);




  useEffect(() => {
    if (!authUser) return;
    loadDiaries();
    loadAttendance();
    loadCustomerEvents();

  }, [authUser]);

useEffect(() => {
  if (!authUser) return;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  supabase
    .from("calendar_events")
    .select("id, title, time, icon, color, place, date, memo")

    .eq("user_id", authUser.id)
    .eq("date", todayStr)
    .order("time", { ascending: true })
    .then(({ data }) => setTodayEvents(data || []));
}, [authUser]);


  useEffect(() => {
    if (typeof settings?.plant_pos_x !== "number" || typeof settings?.plant_pos_y !== "number") return;
    setPlantPos(clampPlantPosition(settings.plant_pos_x, settings.plant_pos_y));
    plantPositionDirty.current = false;
  }, [authUser?.id, settings?.plant_pos_x, settings?.plant_pos_y]);

  useEffect(() => {
    if (!authUser || plantDragInfo || !plantPositionDirty.current) return;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("customer_settings").upsert({
        user_id: authUser.id, plant_pos_x: plantPos.x, plant_pos_y: plantPos.y,
      }, { onConflict: "user_id" });
      if (!error) plantPositionDirty.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, [plantPos, plantDragInfo, authUser?.id]);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!plantDragInfo) return;
    plantPositionDirty.current = true;
    setPlantPos(clampPlantPosition(plantDragInfo.originX + e.clientX - plantDragInfo.startX, plantDragInfo.originY + e.clientY - plantDragInfo.startY));
  };
  const handleMouseUp = () => setPlantDragInfo(null);

  const handleTouchMove = (e: TouchEvent) => {
    if (!plantDragInfo) return;
    e.preventDefault();
    const touch = e.touches[0];
    plantPositionDirty.current = true;
    setPlantPos(clampPlantPosition(plantDragInfo.originX + touch.clientX - plantDragInfo.startX, plantDragInfo.originY + touch.clientY - plantDragInfo.startY));
  };
  const handleTouchEnd = () => setPlantDragInfo(null);

  if (plantDragInfo) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  }
  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
  };
}, [plantDragInfo]);



  const loadDiaries = async () => {
    const { data } = await supabase
      .from("cm_diaries")
      .select("*")
      .eq("user_id", authUser!.id)
      .order("date", { ascending: false })
      .limit(50);
    setDiaries(data || []);
    setDiaryLoading(false);
  };

  





  const loadAttendance = async () => {
    const { data } = await supabase
      .from("cm_attendance")
      .select("date, watered")
      .eq("user_id", authUser!.id)
      .order("date", { ascending: false })
      .limit(365);
    const records = data || [];
    setAttendance(records);
    setAttendanceLoading(false);
    const todayRecord = records.find((r) => r.date === todayStr);
    setTodayWatered(todayRecord?.watered || false);
  };

  const loadCustomerEvents = async () => {
    const { data } = await supabase
      .from("customer_sync")
      .select("name, birth_date, myeonchek_end_date, gamek_end_date, silson_start_date")
      .eq("user_id", authUser!.id);
    if (!data) return;
    const events: Record<string, { type: string; name: string }[]> = {};
    const year = new Date().getFullYear();
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    const items: DdayItem[] = [];

    data.forEach((c) => {
      if (c.birth_date) {
        const bParts = c.birth_date.split("-");
        if (bParts.length >= 2) {
          let bDate = new Date(year, parseInt(bParts[1]) - 1, parseInt(bParts[2] || "1"));
          if (bDate < todayD) bDate = new Date(year + 1, parseInt(bParts[1]) - 1, parseInt(bParts[2] || "1"));
          const bKey = new Date(bDate.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
          if (!events[bKey]) events[bKey] = [];
          events[bKey].push({ type: "birthday", name: c.name });
          const dday = calcDday(bKey);
          if (dday <= 60 && dday >= -3) items.push({ name: c.name, date: bKey, type: "birthday", dday });
        }
      }
      if (c.myeonchek_end_date) {
        if (!events[c.myeonchek_end_date]) events[c.myeonchek_end_date] = [];
        events[c.myeonchek_end_date].push({ type: "myeonchek", name: c.name });
        const dday = calcDday(c.myeonchek_end_date);
        if (dday <= 30 && dday >= -7) items.push({ name: c.name, date: c.myeonchek_end_date, type: "myeonchek", dday });
      }
      if (c.gamek_end_date) {
        if (!events[c.gamek_end_date]) events[c.gamek_end_date] = [];
        events[c.gamek_end_date].push({ type: "gamek", name: c.name });
        const dday = calcDday(c.gamek_end_date);
        if (dday <= 30 && dday >= -7) items.push({ name: c.name, date: c.gamek_end_date, type: "gamek", dday });
      }
      if (c.silson_start_date) {
        const renewalDate = calcSilsonRenewalDate(c.silson_start_date);
        if (renewalDate) {
          const dday = calcDday(renewalDate);
          if (dday <= 60 && dday >= -7) items.push({ name: c.name, date: renewalDate, type: "silson", dday });
        }
      }
    });
    items.sort((a, b) => a.dday - b.dday);
    setDdayItems(items);
    setCustomerEvents(events);
  };

  // ─── 물주기 ───
  const handleWater = async () => {
  if (wateringAnim || attendanceLoading || !authUser) return;  // todayWatered 조건 제거
  setWateringAnim(true);
  const { error } = await supabase.from("cm_attendance").upsert(
    { user_id: authUser.id, date: todayStr, watered: true },
    { onConflict: "user_id,date" }
  );
  if (!error) {
    setTodayWatered(true);
    setAttendance((prev) => {
      const exists = prev.find((r) => r.date === todayStr);
      if (exists) return prev.map((r) => (r.date === todayStr ? { ...r, watered: true } : r));
      return [{ date: todayStr, watered: true }, ...prev];
    });
  }
  setTimeout(() => setWateringAnim(false), 1200);
};

  // ─── 연속 출석 계산 ───
  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const key = new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (attendance.find((r) => r.date === key && r.watered)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  })();

  const totalWatered = attendance.filter((r) => r.watered).length;
  const plantStage = getPlantStage(totalWatered);
  useEffect(() => {
    if (!attendanceLoading) onPlantStageChange?.(plantStage);
  }, [plantStage, attendanceLoading, onPlantStageChange]);

  const stageName: Record<PlantStage, string> = {
    seed: "씨앗",
    sprout: "새싹",
    sapling: "묘목",
    tree: "나무",
    bigtree: "큰 나무",
    bloom: "꽃나무",
  };

  // ─── 일기 저장 ───
  const handleSaveDiary = async () => {
    
    if (!diaryForm.date) { setDiaryError("날짜를 선택해주세요."); return; }
    const payload = { user_id: authUser!.id, date: diaryForm.date, content: diaryForm.content, mood: diaryForm.mood };    if (editingDiary) {
      const { error } = await supabase.from("cm_diaries").update({ content: payload.content, mood: payload.mood }).eq("id", editingDiary.id);
      if (!error) setDiaries((prev) => prev.map((d) => d.id === editingDiary.id ? { ...d, ...payload } : d));
    } else {
      const { data, error } = await supabase.from("cm_diaries").upsert(payload, { onConflict: "user_id,date" }).select().single();
      if (!error && data) {
        setDiaries((prev) => {
          const filtered = prev.filter((d) => d.date !== data.date);
          return [data, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
        });
      }
    }
    setDiaryOpen(false);
    setEditingDiary(null);
    setDiaryForm({ date: "", content: "", mood: "good" });
    setDiaryError("");
  };

  const handleDeleteDiary = async (id: string) => {
    await supabase.from("cm_diaries").delete().eq("id", id);
    setDiaries((prev) => prev.filter((d) => d.id !== id));
  };

  const openNewDiary = (date?: string) => {
    setEditingDiary(null);
    setDiaryForm({ date: date || todayStr, content: "", mood: "good" });
    setDiaryError("");
    setDiaryOpen(true);
  };

  const openEditDiary = (diary: DiaryEntry) => {
    setEditingDiary(diary);
    setDiaryForm({ date: diary.date, content: diary.content, mood: diary.mood });
    setDiaryError("");
    setDiaryOpen(true);
  };

  // ─── 캘린더 ───
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calDays = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const getDayEvents = (day: number) => {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return customerEvents[key] || [];
  };

  const getDiaryForDay = (day: number) => {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return diaries.find((d) => d.date === key);
  };

  const isToday = (day: number) =>
    day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const memoTotalPages = Math.ceil(privateMemos.length / ITEMS_PER_PAGE);

const memoPageGroup = Math.floor((memoPage - 1) / PAGE_GROUP);

const memoStartPage = memoPageGroup * PAGE_GROUP + 1;

const memoEndPage = Math.min(
  memoStartPage + PAGE_GROUP - 1,
  memoTotalPages
);

const filteredDiaries = diaries.filter((d) => {
  const [y, m] = d.date.split("-").map(Number);
  return y === diaryMonth.year && m === diaryMonth.month + 1;
});

const diaryTotalPages = Math.ceil(
  filteredDiaries.length / ITEMS_PER_PAGE
);

const diaryPageGroup = Math.floor(
  (diaryPage - 1) / PAGE_GROUP
);

const diaryStartPage = diaryPageGroup * PAGE_GROUP + 1;

const diaryEndPage = Math.min(
  diaryStartPage + PAGE_GROUP - 1,
  diaryTotalPages
);
  const plantCard = (
  <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-3 text-center shadow-sm">
    <p
      className="text-[15px] font-bold text-amber-700 mb-1 truncate max-w-[140px] mx-auto"
      title={settings?.nickname ? `${settings.nickname}의 식물` : "나의 식물"}
    >
      {settings?.nickname ? `${settings.nickname}의 식물` : "나의 식물"}
    </p>
    <div className="flex justify-center">
      <PlantSVG stage={plantStage} watering={wateringAnim} />
    </div>
    <p className="text-[13px] font-black text-gray-700 mt-2">{stageName[plantStage]}</p>
    <p className="text-[11px] text-gray-400"> {totalWatered}일</p>
    <button
      onClick={handleWater}
      disabled={wateringAnim || attendanceLoading}
      className={`w-full mt-2 py-2 rounded-2xl text-[12px] font-bold transition-all duration-150 ${
        todayWatered
          ? "bg-yellow-400 text-white hover:bg-yellow-300 hover:shadow-md cursor-pointer"
          : wateringAnim
          ? "bg-amber-600 text-white scale-95 shadow-inner"
          : "bg-yellow-400 text-white hover:bg-yellow-300 hover:shadow-md active:bg-amber-500 active:scale-95 cursor-pointer"
      }`}
    >
      {wateringAnim ? "💧..." : "물주기"}
    </button>
  </div>
  );

  return (
    <div className="space-y-5">
      {plantPopupOpen && createPortal(
        <div ref={plantCardRef} role="dialog" aria-label="내 식물 물주기"
          style={{ left: plantPos.x, top: plantPos.y, touchAction: "none" }}
          className="fixed z-[300] w-45 cursor-default"
          onMouseDown={event => {
            if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
            event.preventDefault();
            setPlantDragInfo({ startX: event.clientX, startY: event.clientY, originX: plantPos.x, originY: plantPos.y });
          }}
          onTouchStart={event => {
            if ((event.target as HTMLElement).closest("button")) return;
            const touch = event.touches[0];
            setPlantDragInfo({ startX: touch.clientX, startY: touch.clientY, originX: plantPos.x, originY: plantPos.y });
          }}>
          {plantCard}
        </div>, document.body
      )}

{view === "home" && <>
{/* ── 오늘 일정 + 체크리스트 ── */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">

  {!isHidden("schedule") && (
  <div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow p-5">
      <h2 className="text-base font-black text-gray-900 mb-3">오늘 일정</h2>
{todayEvents.length === 0 ? (
  <div className="flex items-center justify-center py-10">
    <p className="text-sm text-gray-300">
      오늘 일정이 없습니다.
    </p>
  </div>
) : (
    <div className="space-y-2">
      {todayEvents.map((ev) => (
        <div
          key={ev.id}
          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-blue-50 transition"
          onClick={() => {
            setEditingTodayEvent(ev);
                        setTodayEventForm({ title: ev.title, time: ev.time || "", place: ev.place || "", memo: ev.memo || "", icon: ev.icon, color: ev.color });

            setTodayEventEditOpen(true);
          }}
        >
{/* 일정 정보 */}
<div className="flex items-center gap-5 min-w-0 flex-1 overflow-hidden">

  {/* 아이콘 */}
  <span className="shrink-0 text-base">{ev.icon}</span>

  {/* 제목 */}
  <div className="min-w-[120px] max-w-[160px] truncate">
    <p className="font-bold text-gray-900 text-sm truncate">
      {ev.title}
    </p>
  </div>

  {/* 시간 */}
  <div className="min-w-[90px] max-w-[90px] truncate">
    <p className="text-sm text-gray-500 truncate">
      {ev.time || ""}
    </p>
  </div>

  {/* 장소 */}
  <div className="min-w-[120px] max-w-[120px] truncate">
    <p className="text-sm text-gray-500 truncate">
      {ev.place || ""}
    </p>
  </div>

  {/* 메모 */}
  <div className="flex-1 min-w-[120px] truncate">
    <p className="text-sm text-gray-400 truncate">
      {ev.memo || ""}
    </p>
  </div>

  {/* 날짜 */}
  <div className="shrink-0 min-w-[90px] text-right">
    <p className="text-sm text-gray-400">
      {new Date(ev.date).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      })}
    </p>
  </div>

</div>
        </div>
      ))}
    </div>
  )}
</div>
  )}

{/* 체크리스트 카드 */}
{!isHidden("checklist") && (
<div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow p-5">
    <h2 className="text-base font-black text-gray-900 mb-3">체크리스트</h2>
    <div className="space-y-2 mb-3">
      {checklists.map((item) => (
        <div key={item.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded transition">
          <input type="checkbox" checked={item.completed} onChange={async () => {
            await supabase.from("calendar_checklists").update({ completed: !item.completed }).eq("id", item.id);
            const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser!.id).limit(10);
            setChecklists(data || []);
          }} className="w-4 h-4 cursor-pointer" />
          {editingChecklistId === item.id ? (
            <input data-ui-field="true" type="text" value={editingChecklistText}
              onChange={(e) => setEditingChecklistText(e.target.value)}
              onBlur={async () => {
                if (!editingChecklistText.trim()) return;
                await supabase.from("calendar_checklists").update({ text: editingChecklistText }).eq("id", item.id);
                const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser!.id).limit(10);
                setChecklists(data || []);
                setEditingChecklistId(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              autoFocus
              className="flex-1 px-3 py-1 border border-gray-200 rounded-xl text-sm outline-none" />
          ) : (
            <span onClick={() => { setEditingChecklistId(item.id); setEditingChecklistText(item.text); }}
              className={`flex-1 text-sm cursor-pointer ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
              {item.text}
            </span>
          )}
          <button onClick={async () => {
            await supabase.from("calendar_checklists").delete().eq("id", item.id);
            const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser!.id).limit(10);
            setChecklists(data || []);
          }} className="text-gray-300 hover:text-red-400 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
    {checklists.length < 10 && (
      <div className="flex gap-2">
        <input data-ui-field="true" type="text" value={checklistText} onChange={(e) => setChecklistText(e.target.value)}
          placeholder="항목 추가"
          onKeyDown={async (e) => {
            if (e.key === "Enter" && checklistText.trim() && authUser) {
              await supabase.from("calendar_checklists").insert([{ user_id: authUser.id, text: checklistText, completed: false }]);
              const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
              setChecklists(data || []);
              setChecklistText("");
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 transition" />
        <button onClick={async () => {
          if (!authUser) return;
          await supabase.from("calendar_checklists").insert([{ user_id: authUser.id, text: checklistText, completed: false }]);
          const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
          setChecklists(data || []);
          setChecklistText("");
        }} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    )}
</div>
)}
</div>

{/* 오늘 일정 수정 팝업 */}

{todayEventEditOpen && editingTodayEvent && (
  <div onClick={() => setTodayEventEditOpen(false)} className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
    <div onClick={(e) => e.stopPropagation()} className="bg-white w-[90%] max-w-lg rounded-3xl shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="text-xl font-black text-gray-900">일정 수정</h2>
        <button data-popup-close="true" onClick={() => setTodayEventEditOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-6 pt-2 pb-4 overflow-y-auto flex-1 min-w-0">
        <div className="space-y-3">
          {/* 이모지 + 제목 */}
          <div className="flex gap-2">
            <button className="w-12 h-12 border border-gray-200 rounded-2xl text-2xl hover:bg-gray-50 transition flex items-center justify-center outline-none">
              {todayEventForm.icon}
            </button>
            <input data-ui-field="true" type="text" placeholder="제목" value={todayEventForm.title}
              onChange={(e) => setTodayEventForm(f => ({ ...f, title: e.target.value }))}
              className="flex-1 h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          </div>
          {/* 날짜 (수정 불가, 표시만) */}
          <button type="button" disabled className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm text-left flex items-center gap-2 bg-gray-50">
            <span className="text-gray-400">📅</span>
            <span className="text-gray-800">{editingTodayEvent.date}</span>
          </button>
          {/* 시간 */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">⏰</span>
            <input data-ui-field="true" type="text" placeholder="시간 (예: 오후 2시)" value={todayEventForm.time}
              onChange={(e) => setTodayEventForm(f => ({ ...f, time: e.target.value }))}
              className="w-full h-12 rounded-2xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          </div>
          {/* 장소 */}
          <input data-ui-field="true" type="text" placeholder="장소" value={todayEventForm.place}
            onChange={(e) => setTodayEventForm(f => ({ ...f, place: e.target.value }))}
            className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          {/* 메모 */}
          <textarea data-ui-field="true" placeholder="메모" value={todayEventForm.memo ?? ""}
            onChange={(e) => setTodayEventForm(f => ({ ...f, memo: e.target.value }))}
            className="w-full h-20 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          {/* 색상 */}
          <div className="flex gap-3">
            {[
              { value: "white", color: "bg-white" },
              { value: "blue", color: "bg-blue-50" },
              { value: "green", color: "bg-green-50" },
              { value: "yellow", color: "bg-yellow-50" },
              { value: "red", color: "bg-red-50" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setTodayEventForm(f => ({ ...f, color: opt.value }))}
                className={`w-8 h-8 rounded-full border border-gray-200 transition hover:scale-105 cursor-pointer ${opt.color} ${todayEventForm.color === opt.value ? "ring-2 ring-gray-400 ring-offset-2" : ""}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 px-6 pb-6 pt-4">
        <button
          onClick={async () => {
            if (!authUser || !editingTodayEvent) return;
            await supabase.from("calendar_events").delete().eq("id", editingTodayEvent.id);
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
              const { data } = await supabase.from("calendar_events").select("id, title, time, icon, color, place, date, memo").eq("user_id", authUser.id).eq("date", todayStr).order("time", { ascending: true });
            setTodayEvents(data || []);
            setTodayEventEditOpen(false);
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
        >삭제</button>
        <button
          onClick={async () => {
            if (!authUser || !editingTodayEvent) return;
            await supabase.from("calendar_events").update({
              title: todayEventForm.title,
              time: todayEventForm.time || null,
              place: todayEventForm.place || null,
              memo: todayEventForm.memo || null,
              color: todayEventForm.color,
            }).eq("id", editingTodayEvent.id);
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
              const { data } = await supabase.from("calendar_events").select("id, title, time, icon, color, place, date, memo").eq("user_id", authUser.id).eq("date", todayStr).order("time", { ascending: true });
            setTodayEvents(data || []);
            setTodayEventEditOpen(false);
          }}
          className="flex-1 h-12 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer"
        >완료</button>
      </div>
    </div>
  </div>
)}



      </>}

      {/* ── 메모와 일기 탭 ── */}

      <div className="grid grid-cols-1 gap-3 items-start">

{/* 메모 */}


        {/* 메모 추가 팝업 */}



{/* 일기 */}
{view === "diary" && (
<div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow p-5">
          <div className="relative flex items-center justify-between mb-3">
  <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
  <BookOpen className="w-5 h-5 text-blue-500" />
    일기
  </h2>
  <div className="flex items-center gap-1">
    <button
      onClick={() => setDiaryMonth(({ year, month }) => {
        const d = new Date(year, month - 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      })}
      className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
    >
      <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
    </button>
    <span className="min-w-[50px] text-center text-[17px] font-bold text-gray-800 tracking-[-0.02em]">
  {diaryMonth.month + 1}월
</span>
    <button
      onClick={() => setDiaryMonth(({ year, month }) => {
        const d = new Date(year, month + 1, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      })}
      className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
    >
      <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
    </button>
    <button
      onClick={() => openNewDiary()}
      className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center hover:bg-blue-400 shadow-sm hover:shadow-md transition ml-1 cursor-pointer"
    >
      <Plus className="w-4 h-4 text-white" />
    </button>
  </div>
</div>

{diaryLoading ? (
  <div className="flex justify-center py-6">
    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
  </div>
) : (
  (() => {
    const filtered = diaries.filter((d) => {
      const [y, m] = d.date.split("-").map(Number);
      return y === diaryMonth.year && m === diaryMonth.month + 1;
    });
    return filtered.length === 0 ? (
      <div className="text-center py-6">
        <BookOpen className="w-7 h-7 mx-auto mb-1.5 text-gray-200" />
        <p className="text-sm text-gray-400 cursor-default">이 달의 일기가 없어요.</p>
      </div>
    ) : (
      <div className="space-y-2.5">
        {filtered.slice(
  (diaryPage - 1) * ITEMS_PER_PAGE,
  diaryPage * ITEMS_PER_PAGE
).map((diary) => (
         <div
  key={diary.id}
  onClick={() => setViewingDiary(diary)}
  className="bg-white rounded-xl border border-gray-100 px-3 py-5 hover:border-purple-200 hover:-translate-y-0.5 hover:shadow-sm transition "
>
 <div className="flex items-center gap-1.5">
  <span className="text-sm relative -top-[10px]">
    {moodEmoji[diary.mood]}
  </span>

  <span className="text-[14px] font-semibold text-gray-500 relative -top-[10px]">
    {diary.date}
  </span>
</div>

<p className="text-sm text-gray-600 leading-relaxed line-clamp-1 mt-1 min-h-[22px]">
  {diary.content || " "}
</p>
</div>
        ))}
       <div className="flex items-center justify-center gap-1 mt-3">
<nav data-pagination="true" aria-label="페이지 이동">
  <button
    onClick={() => setDiaryPage((prev) => Math.max(1, prev - PAGE_GROUP))}
    className="px-2 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold hover:bg-blue-100 transition"
  >
    이전
  </button>

  {Array.from(
    { length: Math.max(1, diaryEndPage - diaryStartPage + 1) },
    (_, i) => {
      const page = diaryStartPage + i;

      return (
        <button
          key={page}
          onClick={() => setDiaryPage(page)}
          className={`w-8 h-8 rounded-xl text-sm font-bold transition ${
            diaryPage === page
              ? "bg-blue-500 text-white shadow-sm"
              : "bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {page}
        </button>
      );
    }
  )}

  <button
    onClick={() =>
      setDiaryPage((prev) =>
        Math.min(Math.max(1, diaryTotalPages), prev + PAGE_GROUP)
      )
    }
    className="px-2 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold hover:bg-blue-100 transition"
  >
    다음
  </button>
</nav>
</div>
      </div>
    );
  })()
)}
        </div>
)}
      </div>

      {/* ── 일기 작성/수정 팝업 ── */}
      {diaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-1">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg min-h-[520px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">{editingDiary ? "일기 수정" : "일기 쓰기"}</h3>
              <button data-popup-close="true"
                onClick={() => { setDiaryOpen(false); setEditingDiary(null); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-7 pt-6 pb-7 space-y-6 flex-1">
              <div>
                <label className="text-sm font-bold text-gray-500 mb-1 block">날짜</label>
                <div className="relative">
  <button
    type="button"
    onClick={() => {
      if (diaryForm.date) {
        const [y, m] = diaryForm.date.split("-").map(Number);
        setDiaryPickerYear(y);
        setDiaryPickerMonth(m - 1);
      }
      setShowDiaryDatePicker(!showDiaryDatePicker);
    }}
    className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-base text-left flex items-center justify-between hover:bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
  >
    <span>{diaryForm.date || "날짜 선택"}</span>
    <Calendar className="w-5 h-5 text-gray-700" />
  </button>

  {showDiaryDatePicker && (
    <>
      <div
        className="fixed inset-0 z-[99]"
        onClick={() => setShowDiaryDatePicker(false)}
      />

      <div className="absolute top-14 left-0 bg-white border border-gray-200 rounded-3xl p-5 z-[100] shadow-xl w-[320px]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (diaryPickerMonth === 0) {
                setDiaryPickerMonth(11);
                setDiaryPickerYear(diaryPickerYear - 1);
              } else {
                setDiaryPickerMonth(diaryPickerMonth - 1);
              }
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
          >
            ‹
          </button>

          <span className="text-base font-black text-gray-900">
            {diaryPickerYear}년 {diaryPickerMonth + 1}월
          </span>

          <button
            type="button"
            onClick={() => {
              if (diaryPickerMonth === 11) {
                setDiaryPickerMonth(0);
                setDiaryPickerYear(diaryPickerYear + 1);
              } else {
                setDiaryPickerMonth(diaryPickerMonth + 1);
              }
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
          >
            ›
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
            const firstDow = new Date(diaryPickerYear, diaryPickerMonth, 1).getDay();
            const daysInMonth = new Date(diaryPickerYear, diaryPickerMonth + 1, 0).getDate();
            const cells = [];

            for (let i = 0; i < firstDow; i++) {
              cells.push(<div key={`empty-${i}`} />);
            }

            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${diaryPickerYear}-${String(diaryPickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = diaryForm.date === dateStr;
              const dow = new Date(diaryPickerYear, diaryPickerMonth, d).getDay();

              cells.push(
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDiaryForm((f) => ({ ...f, date: dateStr }));
                    setShowDiaryDatePicker(false);
                  }}
                  className={`h-9 rounded-xl text-sm font-bold transition ${
                    isSelected
                      ? "bg-blue-600 text-white"
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
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500 mb-2 block">오늘의 기분</label>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setDiaryForm((f) => ({ ...f, mood: mood.value }))}
                      className={`flex-1 py-2.5 rounded-2xl border text-sm font-bold transition flex flex-col items-center gap-1 ${
                        diaryForm.mood === mood.value
                          ? "border-blue-400 bg-blue-50 text-blue-600 shadow-sm"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <mood.icon className={`w-5 h-5 ${mood.color}`} />
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-500 mb-1 block">내용</label>
                <textarea data-ui-field="true"
                  value={diaryForm.content}
                  onChange={(e) => setDiaryForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="오늘 하루는 어땠나요?"
                  rows={8}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-base leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none"
                />
              </div>
              {diaryError && <p className="text-xs text-red-500">{diaryError}</p>}
              <button
                onClick={handleSaveDiary}
                className="w-full h-12 bg-blue-600 text-white text-base font-black rounded-2xl hover:bg-blue-500 transition shadow-sm hover:shadow-md cursor-pointer"
              >
                {editingDiary ? "수정 완료" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ── 일기 읽기 팝업 ── */}
      {viewingDiary && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[520px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-7 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">{moodEmoji[viewingDiary.mood]}</span>
                <span className="text-1g font-bold text-gray-700">{viewingDiary.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setViewingDiary(null); openEditDiary(viewingDiary); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button
                 onClick={() => setConfirmDelete({ type: "diary", id: viewingDiary.id })}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
                <button data-popup-close="true"
                  onClick={() => setViewingDiary(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="px-7 py-6 flex-1 overflow-y-auto">
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-keep">{viewingDiary.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 메모 읽기 팝업 ── */}


      {/* ── 메모 수정 팝업 ── */}

      {/* ── 삭제 확인 팝업 ── */}
{confirmDelete && (
  <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 space-y-4 text-center">
      <p className="font-bold text-gray-900 text-base">정말 삭제할까요?</p>
      <p className="text-sm text-gray-400">삭제하면 복구할 수 없습니다.</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmDelete(null)}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
        >
          취소
        </button>
        <button
          onClick={() => {
            
              handleDeleteDiary(confirmDelete.id);
              setViewingDiary(null);
            setConfirmDelete(null);
          }}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

  </div>
  );
}