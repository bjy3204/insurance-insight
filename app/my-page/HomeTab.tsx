"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  if (totalDays >= 600) return "bloom";
  if (totalDays >= 300) return "bigtree";
  if (totalDays >= 180) return "tree";
  if (totalDays >= 90) return "sapling";
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
export default function HomeTab({
  settings,
  hiddenHomeMenus,
}: {
  settings: CustomerSettings | null;
  hiddenHomeMenus: string[];
}) {

  const isHidden = (id: string) =>
  hiddenHomeMenus.includes(id);

  const [showDdayDatePicker, setShowDdayDatePicker] = useState(false);
const [ddayPickerYear, setDdayPickerYear] = useState(new Date().getFullYear());
const [ddayPickerMonth, setDdayPickerMonth] = useState(new Date().getMonth());
  
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


const WEATHER_REGIONS = ["서울","부산","대구","인천","광주","대전","울산","세종","제주"];
const [weatherRegion, setWeatherRegion] = useState(() => localStorage.getItem("hometab-weather-region") || "서울");
const [weather, setWeather] = useState<{
  region: string; temp: number; description: string; icon: string;
  daily?: { date: string; temp: number; description: string; icon: string; }[];
} | null>(null);
const [weatherContextMenu, setWeatherContextMenu] = useState<{ x: number; y: number } | null>(null);

// ── D-Day 위젯 ──
const [ddayWidgetLabel, setDdayWidgetLabel] = useState("");
const [ddayWidgetDate, setDdayWidgetDate] = useState("");
const [ddayWidgetEditOpen, setDdayWidgetEditOpen] = useState(false);
const [ddayWidgetTempLabel, setDdayWidgetTempLabel] = useState("");
const [ddayWidgetTempDate, setDdayWidgetTempDate] = useState("");

// ── BGM 플레이어 ──
const BGM_LIST = [
  // 🔥 노동요 - K-POP
  { title: "감다살 케이팝 노동요", vid: "uf9TNPYiwk4", category: "노동요" },
  { title: "최고급 K-POP 노동요 오마카세", vid: "R9wSCx4tA6I", category: "노동요" },
  { title: "2010년대 댄스곡 노동요", vid: "JPg4E4w_ZyE", category: "노동요" },
  { title: "따라해 느좋 케이팝 노동요", vid: "9dDJq-Imtb0", category: "노동요" },
  { title: "전투력 MAX 케이팝 노동요", vid: "12m0Jf-Ma3E", category: "노동요" },
  { title: "최신 케이팝 노동요 플리", vid: "JkHzGy4w53M", category: "노동요" },
  { title: "2010년대 레전드 K-POP", vid: "iWKx4DCSHv8", category: "노동요" },
  { title: "콘서트 떼창 노래 모음", vid: "v9nwiR2QIYk", category: "노동요" },
  { title: "ㄹㅇ 감다살 케이팝 노동요", vid: "uHnKOOXVXkU", category: "노동요" },
  { title: "핵심 찌르는 케이팝 노동요", vid: "oU9w0RsvJlU", category: "노동요" },
  { title: "여돌 걸그룹 노래모음 노동요", vid: "Jb2gPPijqTk", category: "노동요" },
  { title: "끊김없는 Kpop MIXSET 노동요", vid: "WnrIX9Ak1wA", category: "노동요" },
  { title: "일할 때 꺼내 듣는 케이팝", vid: "yiI3pKD2Nok", category: "노동요" },
  { title: "2010년대 케이팝 노동요 뮤비", vid: "dc9qnKClYxA", category: "노동요" },
  { title: "도파민 충전 둠칫 노동요", vid: "RDypwcB7ONY", category: "노동요" },
  { title: "최신 K-POP 텐션 UP 노동요", vid: "wBVKaIutSFE", category: "노동요" },
  { title: "최신 여돌 걸그룹 노동요", vid: "Jb2gPPijqTk", category: "노동요" },
  { title: "9n년생 2010년대 레전드 K-POP", vid: "To8sXZwfk4Q", category: "노동요" },
  { title: "K-POP 걸그룹 업비트 플리", vid: "laMC6qKiW9A", category: "노동요" },
  { title: "전투력 상승 Kpop 믹스셋", vid: "WnrIX9Ak1wA", category: "노동요" },
  { title: "2026 핫한 걸그룹 노동요", vid: "0hp8rzHpwEs", category: "노동요" },
  { title: "쌈뽕 신나는 여돌 노동요", vid: "e7pBXF-HJrQ", category: "노동요" },
  { title: "4월 핫한 케이팝 노동요", vid: "NBxhf0a36_E", category: "노동요" },
  { title: "텐션 올라가는 케이팝 플리 ②", vid: "E3CawH2SkKM", category: "노동요" },
  { title: "텐션업 케이팝 노동요 🌈🔥", vid: "Dc_QllCAAtY", category: "노동요" },
  // 🎵 싸이월드 감성
  { title: "도토리 쓰던 싸이월드 BGM", vid: "ShxagKy3CHQ", category: "싸이월드" },
  { title: "추억의 싸이월드 BGM 100곡", vid: "gw3ltsoYBtI", category: "싸이월드" },
  { title: "싸이월드 BGM 레전드 2000년대", vid: "I-AYt3CNIkQ", category: "싸이월드" },
  { title: "그때 그 시절 싸이월드 노래", vid: "SNVOsxpSb08", category: "싸이월드" },
  { title: "미니홈피 BGM 도토리 명곡", vid: "n3RDIxK8lvU", category: "싸이월드" },
  { title: "싸이월드 BGM 미디움 발라드", vid: "WrdFbfzs2fE", category: "싸이월드" },
  { title: "싸이월드 MIXSET 플레이리스트", vid: "73xztR-dR-A", category: "싸이월드" },
  { title: "도토리 5개 싸이월드 BGM 60곡", vid: "QlMaKvWVLos", category: "싸이월드" },
  { title: "싸이월드 BGM 팝송 100곡 6시간", vid: "ChzpfH1bUqM", category: "싸이월드" },
  { title: "내가 깔았던 힙한 팝송 BGM", vid: "z_M20taxvx8", category: "싸이월드" },
  { title: "싸이월드 좀 열심히 한 사람 BGM", vid: "d8DHMAWcK6U", category: "싸이월드" },
  { title: "미니홈피 BGM 2000년대 플리", vid: "1Mo084qW5mY", category: "싸이월드" },
  { title: "우리의 BGM 싸이월드 배경음악", vid: "Wb15QyFFK88", category: "싸이월드" },
  { title: "싸이월드 BGM 피아노 커버", vid: "P__T4vOuFNg", category: "싸이월드" },
  { title: "싸이월드 미니홈피 배경음악 #4", vid: "g459AmFYdpc", category: "싸이월드" },
  { title: "Cyworld 미니홈피 BGM 감성", vid: "e_Viwt30r4U", category: "싸이월드" },
  { title: "추억의 싸이월드 명곡 모음", vid: "xkDoq68-ACs", category: "싸이월드" },
  { title: "일촌신청을 수락하시겠습니까?", vid: "1fsJrOaZDEM", category: "싸이월드" },
];

const [bgmIndex, setBgmIndex] = useState(() => Number(localStorage.getItem("bgm-index") || 0));
const [bgmPlaying, setBgmPlaying] = useState(false);
const [bgmEditOpen, setBgmEditOpen] = useState(false);
const [bgmCategory, setBgmCategory] = useState<"전체" | "노동요" | "싸이월드">(() => (localStorage.getItem("bgm-category") as "전체" | "노동요" | "싸이월드") || "전체");

const bgmRef = useRef<HTMLIFrameElement | null>(null);
const [bgmTimer, setBgmTimer] = useState(0);
const bgmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [bgmColor, setBgmColor] = useState<"pink" | "yellow" | "blue" | "green" | "gray">(() =>
  (localStorage.getItem("bgm-color") as "pink" | "yellow" | "blue" | "green" | "gray") || "pink"
);
const [bgmColorMenuOpen, setBgmColorMenuOpen] = useState(false);


const filteredBgm = bgmCategory === "전체" ? BGM_LIST : BGM_LIST.filter(b => b.category === bgmCategory);
const currentBgm = filteredBgm[bgmIndex % filteredBgm.length];
const BGM_COLOR_MAP = {
  pink:   { bg: "bg-pink-500",   light: "bg-pink-200",   text: "text-pink-400",   label: "분홍" },
  yellow: { bg: "bg-yellow-400", light: "bg-yellow-100", text: "text-yellow-500", label: "노랑" },
  blue:   { bg: "bg-blue-400",   light: "bg-blue-100",   text: "text-blue-500",   label: "파랑" },
  green:  { bg: "bg-green-400",  light: "bg-green-100",  text: "text-green-500",  label: "초록" },
  gray:   { bg: "bg-gray-400",   light: "bg-gray-100",   text: "text-gray-400",   label: "회색" },
};
const currentColor = BGM_COLOR_MAP[bgmColor];

useEffect(() => {
  if (bgmPlaying) {
    bgmTimerRef.current = setInterval(() => {
      setBgmTimer((t) => t + 1);
    }, 1000);
  } else {
    if (bgmTimerRef.current) clearInterval(bgmTimerRef.current);
  }
  return () => { if (bgmTimerRef.current) clearInterval(bgmTimerRef.current); };
}, [bgmPlaying]);

useEffect(() => {
  localStorage.setItem("bgm-index", String(bgmIndex));
}, [bgmIndex]);

useEffect(() => {
  localStorage.setItem("bgm-category", bgmCategory);
}, [bgmCategory]);

useEffect(() => {
  localStorage.setItem("bgm-color", bgmColor);
}, [bgmColor]);

useEffect(() => {
  if (!authUser) return;
  supabase.from("customer_settings").upsert(
    { user_id: authUser.id, bgm_color: bgmColor },
    { onConflict: "user_id" }
  );
}, [bgmColor]);





useEffect(() => {
  setBgmTimer(0);
}, [bgmIndex]);


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
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayStr = new Date(today.getTime() + kstOffset).toISOString().split("T")[0];

// 날씨 fetch
useEffect(() => {
  const fetchWeather = async () => {
    try {
      const res = await fetch(`/api/weather?region=${weatherRegion}`);
      const data = await res.json();
      setWeather(data);
    } catch {}
  };
  fetchWeather();
  localStorage.setItem("hometab-weather-region", weatherRegion);
}, [weatherRegion]);

// D-Day Supabase 불러오기
useEffect(() => {
  if (!authUser) return;
  const loadWidgets = async () => {
    const { data } = await supabase
      .from("customer_settings")
      .select("dday_label, dday_date, bgm_color")

      .eq("user_id", authUser.id)
      .maybeSingle();
    if (data) {
  setDdayWidgetLabel(data.dday_label || "");
  setDdayWidgetDate(data.dday_date || "");
  const localColor = localStorage.getItem("bgm-color");
  if (!localColor && data.bgm_color) setBgmColor(data.bgm_color as "pink" | "yellow" | "blue" | "green" | "gray");

}

  };
  loadWidgets();
}, [authUser]);

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
    loadPrivateMemos();
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
{!isHidden("plant") && (
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
</div>
)}

{/* ── 날씨 / D-Day / BGM 위젯 ── */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">


  {/* 날씨 */}
  {!isHidden("weather") && (
<div
    className={`bg-white rounded-3xl border border-gray-200 shadow p-4 relative select-none transition-all duration-200 ${weatherContextMenu ? "" : "hover:-translate-y-1 hover:shadow-md"}`}
   onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setWeatherContextMenu({ x: e.clientX, y: e.clientY }); }}

  >
    {weather ? (
  <>
    <div className="flex items-center gap-4 mb-3">
      

      <div className="flex items-center gap-2">
        <span className="text-[25px] leading-none">
          {(weather.description || "").includes("비") ? "🌧️"
            : (weather.description || "").includes("눈") ? "❄️"
            : (weather.description || "").includes("구름") ? "☁️"
            : (weather.description || "").includes("맑") ? "☀️"
            : "☁️"}
        </span>

        <span className="text-[15px] font-bold text-gray-700">
          {weather.region}
        </span>

        <span className="text-[16px] font-black text-gray-700">
          {weather.temp}°C
        </span>
      </div>
    </div>

    {weather.daily && weather.daily.length > 0 && (
      <div className="flex items-center justify-between gap-2 px-4">
        {weather.daily.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-[13px] font-bold text-gray-400">
                           {new Date(`2000-${day.date}T00:00:00`).toLocaleDateString("ko-KR", { weekday: "short" })}

            </span>

            <span className="text-[18px] leading-none">
              {(day.description || "").includes("비") ? "🌧️"
                : (day.description || "").includes("눈") ? "❄️"
                : (day.description || "").includes("구름") ? "☁️"
                : (day.description || "").includes("맑") ? "☀️"
                : "☁️"}
            </span>

            <span className="text-[12px] font-black text-gray-800">
              {day.temp}°
            </span>
          </div>
        ))}
      </div>
    )}
  </>
) : (
  <p className="text-xs text-gray-300 text-center py-3">불러오는 중...</p>
)}
  {weatherContextMenu && (
  <>
   <div 
  className="fixed inset-0 z-[9998]" 
  onClick={() => setWeatherContextMenu(null)}
  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setWeatherContextMenu(null); }}
/>


        <div
      className="absolute left-0 top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden w-28"
    >



          {WEATHER_REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => { setWeatherRegion(r); setWeatherContextMenu(null); }}
              className={`w-full px-4 py-2.5 text-sm font-bold text-left hover:bg-gray-50 transition ${r === weatherRegion ? "text-blue-600" : "text-gray-700"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
)}
  {/* D-Day */}
 {!isHidden("dday") && (
<div
   className={`bg-white rounded-3xl border border-gray-200 shadow p-4 relative transition-all duration-200  ${ddayWidgetEditOpen ? "" : "hover:-translate-y-1 hover:shadow-md"}`}
  onClick={() => { setDdayWidgetTempLabel(ddayWidgetLabel); setDdayWidgetTempDate(ddayWidgetDate); setDdayWidgetEditOpen(true); }}

>

    {ddayWidgetDate ? (
      <>
       <div className="flex items-center gap-3 mb-4.5">
  <p className="text-sm font-bold text-gray-700 truncate">
    {ddayWidgetLabel || ""}
  </p>

  <span className="text-[13px] text-gray-400">
    {ddayWidgetDate}
  </span>
</div>
        <p className={`text-[30px] leading-none font-black text-center mt-1 ${calcDday(ddayWidgetDate) <= 0 ? "text-red-500" : "text-blue-600"}`}>
          {getDdayLabel(calcDday(ddayWidgetDate))}
        </p>
        
      </>
    ) : (
      <div className="flex items-center justify-center h-full min-h-[90px]">
        <p className="text-sm text-gray-300 cursor-default">D-Day 설정</p>
      </div>
    )}
    {ddayWidgetEditOpen && (
      <>
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center" onClick={() => setDdayWidgetEditOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-black text-gray-900">
    D-Day 설정
  </h3>

  <div className="flex items-center gap-1">
    <button
      onClick={async () => {
        setDdayWidgetLabel("");
        setDdayWidgetDate("");
        setDdayWidgetTempLabel("");
        setDdayWidgetTempDate("");

        if (authUser) {
          await supabase.from("customer_settings").upsert(
            {
              user_id: authUser.id,
              dday_label: "",
              dday_date: "",
            },
            { onConflict: "user_id" }
          );
        }
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition cursor-pointer"
    >
      <Trash2 className="w-4 h-4 text-red-400" />
    </button>

    <button
      onClick={() => setDdayWidgetEditOpen(false)}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
    >
      <X className="w-4 h-4 text-gray-500" />
    </button>
  </div>
</div>
            <input
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
            ‹
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
            <button
              onClick={async () => {
                setDdayWidgetLabel(ddayWidgetTempLabel);
                setDdayWidgetDate(ddayWidgetTempDate);
                setDdayWidgetEditOpen(false);
                if (authUser) {
                  await supabase.from("customer_settings").upsert(
                    { user_id: authUser.id, dday_label: ddayWidgetTempLabel, dday_date: ddayWidgetTempDate },
                    { onConflict: "user_id" }
                  );
                }
              }}
              className="w-full h-11 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-400 transition"
            >
              저장
            </button>
          </div>
        </div>
      </>
    )}
  </div>
)}

{/* BGM 플레이어 */}
{!isHidden("bgm") && (
<div
  className={`hidden md:block bg-white rounded-3xl border border-gray-200 shadow p-4 relative transition-all duration-200 ${bgmEditOpen || bgmColorMenuOpen ? "" : "hover:-translate-y-1 hover:shadow-md"}`}
  onContextMenu={(e) => { e.preventDefault(); setBgmColorMenuOpen(true); }}
>


  {bgmColorMenuOpen && (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setBgmColorMenuOpen(false)} />
<div className="absolute right-2 top-2 z-[9999] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden w-24">

        {(Object.entries(BGM_COLOR_MAP) as [keyof typeof BGM_COLOR_MAP, typeof BGM_COLOR_MAP[keyof typeof BGM_COLOR_MAP]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setBgmColor(key); setBgmColorMenuOpen(false); }}
            className={`w-full px-3 py-2 text-xs font-bold text-left flex items-center gap-2 hover:bg-gray-50 transition ${bgmColor === key ? "font-black" : "opacity-60"}`}
          >
            <span className={`w-3 h-3 rounded-full ${val.bg}`} />
            {val.label}
          </button>
        ))}
      </div>
    </>
  )}

  <div className="flex items-center justify-between mb-2">
    
    
  </div>

  <div className="flex items-center gap-3 mb-2 relative -top-[6px]">
  {bgmPlaying && (
    <div className="flex items-end gap-[2px] h-3 shrink-0">
    <span className={`w-[3px] rounded-full animate-bounce ${currentColor.bg}`} style={{ height: "60%", animationDelay: "0s", animationDuration: "0.6s" }} />
<span className={`w-[3px] rounded-full animate-bounce ${currentColor.bg}`} style={{ height: "100%", animationDelay: "0.15s", animationDuration: "0.6s" }} />
<span className={`w-[3px] rounded-full animate-bounce ${currentColor.bg}`} style={{ height: "40%", animationDelay: "0.3s", animationDuration: "0.6s" }} />
<span className={`w-[3px] rounded-full animate-bounce ${currentColor.bg}`} style={{ height: "80%", animationDelay: "0.1s", animationDuration: "0.6s" }} />

    </div>
  )}
  <p className="flex-1 min-w-0 text-[14px] font-bold text-gray-700 truncate relative ">
    {currentBgm.title}
  </p>


  <button
    onClick={() => setBgmEditOpen(true)}
    className="text-[13px] text-gray-400 hover:text-gray-600 transition flex-shrink-0 "
  >
    목록
  </button>
</div>

  <div className="flex items-center justify-center gap-1.5 mb-2">
  {/* 경과 시간 */}
  <span className={`text-[9px] font-bold tabular-nums w-7 text-center ${currentColor.text}`}>
    {String(Math.floor(bgmTimer / 60)).padStart(2, "0")}:{String(bgmTimer % 60).padStart(2, "0")}
  </span>
  {/* 이전 버튼 */}
  <button
    onClick={() => { setBgmIndex((i) => (i - 1 + filteredBgm.length) % filteredBgm.length); setBgmPlaying(true); }}
    className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 text-xs font-black hover:bg-gray-200 active:scale-90 transition cursor-pointer"
  >
    ⏮
  </button>



  {/* 재생/정지 버튼 - 프로그레스 효과 */}
  <button
    onClick={() => {
      const iframe = bgmRef.current;
      if (iframe) {
        if (bgmPlaying) {
          iframe.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo" }), "*");
        } else {
          iframe.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo" }), "*");
        }
      }
      setBgmPlaying((p) => !p);
    }}
    className={`relative w-[250px] h-7 rounded-2xl text-white text-xs font-black overflow-hidden cursor-pointer ${currentColor.light}`}
  >
    {bgmPlaying ? (
  <span
    key={`${bgmIndex}-playing`}
    className={`absolute inset-y-0 left-0 rounded-2xl ${currentColor.bg}`}
    style={{ width: "0%", transition: "width 180s linear" }}
    ref={(el) => {
      if (el) requestAnimationFrame(() => { el.style.width = "100%"; });
    }}
  />
) : (
  <span className={`absolute inset-y-0 left-0 right-0 rounded-2xl ${currentColor.bg}`} />
)}

    <span className="relative z-10">{bgmPlaying ? "⏸" : "▶"}</span>
  </button>
  {/* 다음 버튼 */}
  <button
    onClick={() => { setBgmIndex((i) => (i + 1) % filteredBgm.length); setBgmPlaying(true); }}
    className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 text-xs font-black hover:bg-gray-200 active:scale-90 transition cursor-pointer"
  >
    ⏭
  </button>
  {/* 남은 시간 */}
  <span className="text-[9px] font-bold text-gray-300 tabular-nums w-7 text-center">
    -{String(Math.floor(Math.max(0, 180 - bgmTimer) / 60)).padStart(2, "0")}:{String(Math.max(0, 180 - bgmTimer) % 60).padStart(2, "0")}
  </span>
</div>



  <div className="flex gap-1 px-13">
    {(["전체", "노동요", "싸이월드"] as const).map((cat) => (
      <button
        key={cat}
        onClick={() => { setBgmCategory(cat); setBgmIndex(0); }}
        className={`flex-1 h-6 rounded-xl text-[11px] font-bold transition cursor-pointer ${bgmCategory === cat ? `${currentColor.bg} text-white` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
      >
        {cat}
      </button>
    ))}
  </div>

  <iframe
  ref={bgmRef}
  id="bgm-iframe"
  src={`https://www.youtube.com/embed/${currentBgm.vid}?enablejsapi=1&autoplay=${bgmPlaying ? 1 : 0}`}
  className="hidden"
  allow="autoplay"
  onLoad={( ) => {
    if (bgmRef.current && bgmPlaying) {
      bgmRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo" }),
        "*"
      );
    }
  }}
/>



  {bgmEditOpen && (
  <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center" onClick={() => setBgmEditOpen(false)}>

      <div className="bg-white rounded-3xl shadow-2xl p-5 w-80 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-black text-gray-900 mb-3">BGM 목록</h3>
        <div className="flex gap-1 mb-3">
          {(["전체", "노동요", "싸이월드"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => { setBgmCategory(cat); setBgmIndex(0); }}
              className={`flex-1 h-8 rounded-xl text-xs font-bold transition ${bgmCategory === cat ? `${currentColor.bg} text-white` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 space-y-1">
          {filteredBgm.map((bgm, i) => (
            <button
              key={`${bgm.vid}-${i}`}

              onClick={() => { setBgmIndex(i); setBgmPlaying(true); setBgmEditOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${i === bgmIndex % filteredBgm.length ? `${currentColor.light} ${currentColor.text} border ${currentColor.bg.replace("bg-", "border-")}` : "hover:bg-gray-50 text-gray-700"}`}
            >
              {i === bgmIndex % filteredBgm.length && bgmPlaying ? "▶ " : ""}{bgm.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
)}
</div>

{/* ── 오늘 일정 + 체크리스트 ── */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">

  {!isHidden("schedule") && (
  <div className="bg-white rounded-3xl border border-gray-200 shadow p-5">
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
<div className="bg-white rounded-3xl border border-gray-200 shadow p-5">
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
            <input type="text" value={editingChecklistText}
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
        <input type="text" value={checklistText} onChange={(e) => setChecklistText(e.target.value)}
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
        <button onClick={() => setTodayEventEditOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer">
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
            <input type="text" placeholder="제목" value={todayEventForm.title}
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
            <input type="text" placeholder="시간 (예: 오후 2시)" value={todayEventForm.time}
              onChange={(e) => setTodayEventForm(f => ({ ...f, time: e.target.value }))}
              className="w-full h-12 rounded-2xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          </div>
          {/* 장소 */}
          <input type="text" placeholder="장소" value={todayEventForm.place}
            onChange={(e) => setTodayEventForm(f => ({ ...f, place: e.target.value }))}
            className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition" />
          {/* 메모 */}
          <textarea placeholder="메모" value={todayEventForm.memo ?? ""}
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
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer"
        >완료</button>
      </div>
    </div>
  </div>
)}



      {/* ── 메모 | 일기 반반 ── */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">

{/* 메모 목록 */}
{!isHidden("memo") && (
<div className="bg-white rounded-3xl border border-gray-200 shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-yellow-500" />
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
    <p className="text-sm text-gray-400 cursor-default">메모가 없습니다.</p>
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
)}

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
{!isHidden("diary") && (
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
)}
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