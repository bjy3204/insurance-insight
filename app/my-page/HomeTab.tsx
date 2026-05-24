"use client";

import { useState, useEffect, useCallback } from "react";
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
  Heart,
  Star,
} from "lucide-react";
import type { CustomerSettings } from "./page";

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

type PlantStage = "seed" | "sprout" | "sapling" | "tree" | "bigtree" | "bloom";

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
function getPlantStage(totalDays: number): PlantStage {
  if (totalDays >= 365) return "bloom";
  if (totalDays >= 180) return "bigtree";
  if (totalDays >= 90) return "tree";
  if (totalDays >= 60) return "sapling";
  if (totalDays >= 30) return "sprout";
  return "seed";
}

// ─────────────────────────────────────────────
// SVG 식물 일러스트
// ─────────────────────────────────────────────
function PlantSVG({ stage, watering }: { stage: PlantStage; watering: boolean }) {
  return (
    <div className="relative flex items-end justify-center" style={{ width: 80, height: 90 }}>
      <svg viewBox="0 0 80 90" width="80" height="90" xmlns="http://www.w3.org/2000/svg">
        {/* 화분 */}
        <ellipse cx="40" cy="82" rx="22" ry="5" fill="#c8a97e" opacity="0.4" />
        <path d="M20 72 Q18 85 40 87 Q62 85 60 72 Z" fill="#d4956a" />
        <rect x="17" y="68" width="46" height="7" rx="3" fill="#e8a87c" />
        {/* 흙 */}
        <ellipse cx="40" cy="68" rx="22" ry="4" fill="#8B6340" />

        {/* 씨앗 */}
        {stage === "seed" && (
          <ellipse cx="40" cy="63" rx="5" ry="4" fill="#a0785a" />
        )}

        {/* 새싹 */}
        {stage === "sprout" && (
          <>
            <line x1="40" y1="67" x2="40" y2="50" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="33" cy="54" rx="7" ry="4" fill="#86efac" transform="rotate(-30 33 54)" />
            <ellipse cx="47" cy="56" rx="7" ry="4" fill="#4ade80" transform="rotate(30 47 56)" />
          </>
        )}

        {/* 묘목 */}
        {stage === "sapling" && (
          <>
            <line x1="40" y1="67" x2="40" y2="40" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="29" cy="48" rx="10" ry="6" fill="#86efac" transform="rotate(-25 29 48)" />
            <ellipse cx="51" cy="50" rx="10" ry="6" fill="#4ade80" transform="rotate(25 51 50)" />
            <ellipse cx="40" cy="40" rx="9" ry="7" fill="#22c55e" />
          </>
        )}

        {/* 나무 */}
        {stage === "tree" && (
          <>
            <line x1="40" y1="67" x2="40" y2="32" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="52" x2="28" y2="44" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="48" x2="52" y2="40" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="30" r="14" fill="#22c55e" />
            <circle cx="28" cy="38" r="9" fill="#4ade80" />
            <circle cx="52" cy="36" r="9" fill="#16a34a" />
          </>
        )}

        {/* 큰 나무 */}
        {stage === "bigtree" && (
          <>
            <line x1="40" y1="67" x2="40" y2="26" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
            <line x1="40" y1="50" x2="24" y2="40" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="44" x2="56" y2="34" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="24" r="17" fill="#16a34a" />
            <circle cx="24" cy="36" r="11" fill="#22c55e" />
            <circle cx="56" cy="32" r="11" fill="#15803d" />
            <circle cx="40" cy="14" r="10" fill="#4ade80" />
          </>
        )}

        {/* 꽃나무 */}
        {stage === "bloom" && (
          <>
            <line x1="40" y1="67" x2="40" y2="24" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
            <line x1="40" y1="50" x2="22" y2="38" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="44" x2="58" y2="32" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="22" r="17" fill="#16a34a" />
            <circle cx="22" cy="34" r="11" fill="#22c55e" />
            <circle cx="58" cy="30" r="11" fill="#15803d" />
            <circle cx="40" cy="12" r="10" fill="#4ade80" />
            {/* 꽃 */}
            {[
              [40, 8], [28, 18], [52, 18], [22, 30], [58, 26],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill="#fbbf24" />
                {[0, 60, 120, 180, 240, 300].map((deg, j) => (
                  <ellipse
                    key={j}
                    cx={cx + 6 * Math.cos((deg * Math.PI) / 180)}
                    cy={cy + 6 * Math.sin((deg * Math.PI) / 180)}
                    rx="3"
                    ry="2"
                    fill="#f9a8d4"
                    transform={`rotate(${deg} ${cx + 6 * Math.cos((deg * Math.PI) / 180)} ${cy + 6 * Math.sin((deg * Math.PI) / 180)})`}
                  />
                ))}
              </g>
            ))}
          </>
        )}
      </svg>

      {/* 물방울 애니메이션 */}
      {watering && (
        <div className="absolute inset-0 pointer-events-none">
          {[20, 35, 50, 65].map((x, i) => (
            <div
              key={i}
              className="absolute text-blue-400 text-xs animate-bounce"
              style={{
                left: `${x}%`,
                top: `${10 + i * 8}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.6s",
              }}
            >
              💧
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 HomeTab
// ─────────────────────────────────────────────
export default function HomeTab({ settings }: { settings: CustomerSettings | null }) {
  const { authUser } = useAuth();
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
  const todayStr = today.toISOString().split("T")[0];

  useEffect(() => {
    if (!authUser) return;
    loadDiaries();
    loadAttendance();
    loadCustomerEvents();
    loadPrivateMemos();
  }, [authUser]);

  useEffect(() => {
  if (!authUser || !settings) return;
  if (settings.plant_pos_x !== undefined && settings.plant_pos_y !== undefined) {
    setPlantPos({
  x: Math.max(8, Math.min(window.innerWidth - 180, settings.plant_pos_x)),
  y: Math.max(8, Math.min(window.innerHeight - 220, settings.plant_pos_y)),
});
  }
}, [authUser, settings]);

useEffect(() => {
  if (!authUser) return;
  const timer = setTimeout(async () => {
    await supabase
      .from("customer_settings")
      .upsert({ user_id: authUser.id, plant_pos_x: plantPos.x, plant_pos_y: plantPos.y }, { onConflict: "user_id" });
  }, 800); // 드래그 끝나고 0.8초 후 저장 (과도한 요청 방지)
  return () => clearTimeout(timer);
}, [plantPos]);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!plantDragInfo) return;
   setPlantPos({
  x: Math.max(0, Math.min(window.innerWidth - 180, plantDragInfo.originX + e.clientX - plantDragInfo.startX)),
  y: Math.max(0, Math.min(window.innerHeight - 220, plantDragInfo.originY + e.clientY - plantDragInfo.startY)),
});
  };
  const handleMouseUp = () => setPlantDragInfo(null);

  const handleTouchMove = (e: TouchEvent) => {
    if (!plantDragInfo) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPlantPos({
      x: plantDragInfo.originX + touch.clientX - plantDragInfo.startX,
      y: plantDragInfo.originY + touch.clientY - plantDragInfo.startY,
    });
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

const loadPrivateMemos = async () => {
  const { data } = await supabase
    .from("cm_private_memos")
    .select("*")
    .eq("user_id", authUser!.id)
    .order("created_at", { ascending: false });
  setPrivateMemos(data || []);
};

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

  const addPrivateMemo = async () => {
 if (!authUser) return;
  const { data } = await supabase
    .from("cm_private_memos")
    .insert({ user_id: authUser.id, title: privateMemoTitle.trim(), content: privateMemoContent.trim(), color: privateMemoColor })
    .select().single();
  if (data) setPrivateMemos((prev) => [data, ...prev]);
  setPrivateMemoTitle("");
  setPrivateMemoContent("");
  setPrivateMemoColor("white");
  setPrivateMemoAddOpen(false);
};

const deletePrivateMemo = async (id: string) => {
  await supabase.from("cm_private_memos").delete().eq("id", id);
  setPrivateMemos((prev) => prev.filter((m) => m.id !== id));
};
const updatePrivateMemo = async () => {
  if (!editingMemo) return;
  await supabase
    .from("cm_private_memos")
    .update({ title: editMemoTitle.trim(), content: editMemoContent.trim() })
    .eq("id", editingMemo.id);
  setPrivateMemos((prev) =>
    prev.map((m) => m.id === editingMemo.id ? { ...m, title: editMemoTitle.trim(), content: editMemoContent.trim() } : m)
  );
  const updated = { ...editingMemo, title: editMemoTitle.trim(), content: editMemoContent.trim() };
setEditingMemo(null);
setViewingMemo(updated);
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
          const bKey = bDate.toISOString().split("T")[0];
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
      const key = d.toISOString().split("T")[0];
      if (attendance.find((r) => r.date === key && r.watered)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  })();

  const totalWatered = attendance.filter((r) => r.watered).length;
  const plantStage = getPlantStage(totalWatered);

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
  return (
    <div className="space-y-5">

     {/* 식물 카드 - 드래그 가능 */}
<div
  style={{ left: plantPos.x, top: plantPos.y }}
  onMouseDown={(e) => {
    setPlantDragInfo({
      startX: e.clientX,
      startY: e.clientY,
      originX: plantPos.x,
      originY: plantPos.y,
    });
  }}
  onTouchStart={(e) => {
    const touch = e.touches[0];
    setPlantDragInfo({
      startX: touch.clientX,
      startY: touch.clientY,
      originX: plantPos.x,
      originY: plantPos.y,
    });
  }}
  className="fixed z-30 w-45 flex-shrink-0 space-y-2 cursor-default"
>
  <div className="bg-yellow-50/80 rounded-3xl border border-yellow-100 p-3 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md">
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
    <p className="text-[11px] text-gray-400"> {streak}일</p>
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
</div>


      {/* ── 메모 | 일기 반반 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* 메모 목록 */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
  <StickyNote className="w-5 h-5 text-yellow-500" />
              메모 목록
            </h2>
            <button
              onClick={() => setPrivateMemoAddOpen(true)}
              className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center hover:bg-yellow-300 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

        
{privateMemos.length === 0 ? (
  <div className="text-center py-6">
    <StickyNote className="w-7 h-7 mx-auto mb-1.5 text-gray-200" />
    <p className="text-sm text-gray-400">메모가 없습니다.</p>
  </div>
) : (
  <div className="space-y-2.5">
    {privateMemos.slice(
  (memoPage - 1) * ITEMS_PER_PAGE,
  memoPage * ITEMS_PER_PAGE
).map((memo) => (
     <div
  key={memo.id}
  onClick={() => setViewingMemo(memo)}
  className={`w-full text-left rounded-xl border px-3 py-5 group hover:-translate-y-0.5 hover:shadow-sm transition ${
    memo.color === "blue" ? "bg-blue-50 border-blue-100" :
    memo.color === "yellow" ? "bg-yellow-50 border-yellow-100" :
    memo.color === "red" ? "bg-red-50 border-red-100" :
    "bg-white border-gray-100"
  }`}
>
  <span className="text-sm font-bold text-gray-800 truncate block">
    {memo.title || ""}
  </span>
  <span className="text-sm text-gray-600 truncate block mt-0.5 min-h-[40px]">
  {memo.content || " "}
</span>
</div>
    ))}
    <div className="flex items-center justify-center gap-1 mt-5">
  <button
    onClick={() => setMemoPage((prev) => Math.max(1, prev - PAGE_GROUP))}
    className="px-2 h-8 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-700 text-sm font-bold hover:bg-yellow-100 transition"
  >
    이전
  </button>

  {Array.from(
    { length: Math.max(1, memoEndPage - memoStartPage + 1) },
    (_, i) => {
      const page = memoStartPage + i;

      return (
        <button
          key={page}
          onClick={() => setMemoPage(page)}
          className={`w-8 h-8 rounded-xl text-sm font-bold transition ${
            memoPage === page
              ? "bg-yellow-400 text-white shadow-sm"
              : "bg-yellow-50 border border-yellow-100 text-yellow-700 hover:bg-yellow-100"
          }`}
        >
          {page}
        </button>
      );
    }
  )}

  <button
    onClick={() =>
      setMemoPage((prev) =>
        Math.min(Math.max(1, memoTotalPages), prev + PAGE_GROUP)
      )
    }
    className="px-2 h-8 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-700 text-sm font-bold hover:bg-yellow-100 transition"
  >
    다음
  </button>
</div>
        </div>
)}
        </div>

        {/* 메모 추가 팝업 */}
{privateMemoAddOpen && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-1">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg min-h-[520px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="text-xl font-black text-gray-900">메모 추가</h3>
        <button
          onClick={() => setPrivateMemoAddOpen(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-yellow-50 transition cursor-pointer"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-7 pt-6 pb-7 space-y-6 flex-1">
        <div>
          <label className="text-sm font-bold text-gray-500 mb-1 block">
            메모 제목
          </label>
          <input
            type="text"
            value={privateMemoTitle}
            onChange={(e) => setPrivateMemoTitle(e.target.value)}
            placeholder="메모 제목"
            className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-base outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-50 transition"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-500 mb-1 block">
            메모 내용
          </label>
          <textarea
            value={privateMemoContent}
            onChange={(e) => setPrivateMemoContent(e.target.value)}
            placeholder="메모 내용을 입력하세요"
            rows={8}
            className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-base leading-relaxed outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-50 transition resize-none"
          />
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          ※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다.
        </p>

        <button
          onClick={addPrivateMemo}
          className="w-full h-12 bg-yellow-500 text-white text-base font-black rounded-2xl hover:bg-yellow-400 transition shadow-sm hover:shadow-md cursor-pointer"
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}


        {/* 일기 */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow p-5">
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
        <p className="text-sm text-gray-400">이 달의 일기가 없어요.</p>
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
</div>
      </div>
    );
  })()
)}
        </div>
      </div>

      {/* ── 일기 작성/수정 팝업 ── */}
      {diaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-1">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg min-h-[520px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">{editingDiary ? "일기 수정" : "일기 쓰기"}</h3>
              <button
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
                <textarea
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
                <button
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
{viewingMemo && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[520px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-7 pt-5 pb-4 border-b border-gray-100">
        <h3 className="text-xl font-black text-gray-900 truncate">
          {viewingMemo.title || "(제목 없음)"}
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingMemo(viewingMemo);
              setEditMemoTitle(viewingMemo.title || "");
              setEditMemoContent(viewingMemo.content || "");
              setViewingMemo(null);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-yellow-50 transition cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>

          <button
           onClick={() => setConfirmDelete({ type: "memo", id: viewingMemo.id })}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>

          <button
            onClick={() => setViewingMemo(null)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-7 py-6 flex-1 overflow-y-auto">
        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-keep">
          {viewingMemo.content}
        </p>
      </div>
    </div>
  </div>
)}

      {/* ── 메모 수정 팝업 ── */}
{editingMemo && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-1">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg min-h-[520px] flex flex-col overflow-hidden">

      <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-100">
        <h3 className="text-xl font-black text-gray-900">
          메모 수정
        </h3>

        <button
          onClick={() => setEditingMemo(null)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-yellow-50 transition cursor-pointer"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-7 pt-6 pb-7 space-y-6 flex-1">
        <div>
          <label className="text-sm font-bold text-gray-500 mb-1 block">
            메모 제목
          </label>

          <input
            type="text"
            value={editMemoTitle}
            onChange={(e) => setEditMemoTitle(e.target.value)}
            placeholder="메모 제목"
            className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-base outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-50 transition"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-500 mb-1 block">
            메모 내용
          </label>

          <textarea
            value={editMemoContent}
            onChange={(e) => setEditMemoContent(e.target.value)}
            placeholder="메모 내용을 입력하세요"
            rows={8}
            className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-base leading-relaxed outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-50 transition resize-none"
          />
        </div>

        <button
          onClick={updatePrivateMemo}
          className="w-full h-12 bg-yellow-500 text-white text-base font-black rounded-2xl hover:bg-yellow-400 transition shadow-sm hover:shadow-md cursor-pointer"
        >
          수정 완료
        </button>
        </div>
    </div>
  </div>
)}
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
            if (confirmDelete.type === "memo") {
              deletePrivateMemo(confirmDelete.id);
              setViewingMemo(null);
            } else {
              handleDeleteDiary(confirmDelete.id);
              setViewingDiary(null);
            }
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