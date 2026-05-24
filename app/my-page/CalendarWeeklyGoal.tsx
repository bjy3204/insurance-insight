"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Search,
  Users,
} from "lucide-react";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type Event = {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  place: string;
  memo: string;
  icon: string;
  color: string;
};

type Checklist = {
  id: string;
  text: string;
  completed: boolean;
};

type Holiday = {
  date: string;
  name: string;
};

// 고객 D-day 이벤트 (읽기 전용, 캘린더에 오버레이)
type CustomerEvent = {
  date: string;       // YYYY-MM-DD
  label: string;      // 표시 텍스트 (예: "홍길동 생일")
  type: "birthday" | "myeonchek" | "gamek" | "car";
};

const EMOJI_LIST = [
  "📅", "🎉", "🎊", "🎈", "🎁", "🎯", "📝", "📌", "⭐", "🌟",
  "💼", "📊", "📈", "🔔", "📢", "💡", "🎓", "🏆", "🎭", "🎬",
  "🎵", "🎸", "🎹", "🎤", "📱", "💻", "⚙️", "❤️", "🛒", "🚗","🚨","⏰",
];

// 고객 이벤트 유형별 스타일
const CUSTOMER_EVENT_STYLE: Record<CustomerEvent["type"], { bg: string; text: string; icon: string }> = {
  birthday: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "🎂" },
  myeonchek: { bg: "bg-green-50", text: "text-green-700", icon: "🛡️" },
  gamek: { bg: "bg-blue-50", text: "text-blue-700", icon: "📉" },
  car: { bg: "bg-orange-50", text: "text-orange-700", icon: "🚗" },
};

// ─────────────────────────────────────────────
// 날짜 포맷 헬퍼
// ─────────────────────────────────────────────
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 6자리 생년월일(YYMMDD) → 올해/내년 생일 YYYY-MM-DD
function birthDateToThisYear(birth6: string, baseYear: number): string | null {
  if (!birth6 || birth6.length < 6) return null;
  const mm = birth6.slice(2, 4);
  const dd = birth6.slice(4, 6);
  if (!mm || !dd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisYear = `${baseYear}-${mm}-${dd}`;
  const d = new Date(thisYear);
  if (isNaN(d.getTime())) return null;
  return thisYear;
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function CalendarPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [customerEvents, setCustomerEvents] = useState<CustomerEvent[]>([]);
  const [showCustomerEvents, setShowCustomerEvents] = useState(true);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEventConfirmOpen, setDeleteEventConfirmOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerHour, setPickerHour] = useState(0);
  const [pickerMinute, setPickerMinute] = useState(0);

  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState("");

  const [showMobileDayPopup, setShowMobileDayPopup] = useState(false);
  const [mobileDayDate, setMobileDayDate] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: "",
    time: "",
    place: "",
    memo: "",
    icon: "📅",
    color: "blue",
  });
  const [checklistText, setChecklistText] = useState("");
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayValue = formatDate(today);

  // ─── 인증 ───
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single();
        setAuthStatus(profile?.status || "pending");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authStatus && authStatus !== "approved") {
      window.location.href = "/";
    }
  }, [authStatus]);

  // ─── 공휴일 ───
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = calendarDate.getFullYear();
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
        const data = await response.json();
        const HOLIDAY_TRANSLATIONS: Record<string, string> = {
          "New Year's Day": "신정",
          "Lunar New Year": "설날",
          "Independence Movement Day": "3.1절",
          "Arbor Day": "식목일",
          "Buddha's Birthday": "부처님오신날",
          "Memorial Day": "현충일",
          "Liberation Day": "광복절",
          "Chuseok": "추석",
          "National Foundation Day": "개천절",
          "Hangeul Day": "한글날",
          "Constitution Day": "제헌절",
          "Christmas Day": "크리스마스",
          "Labour Day": "근로자의날",
          "Children's Day": "어린이날",
        };
        setHolidays(data.map((item: any) => ({
          date: item.date.replace(/-/g, ""),
          name: HOLIDAY_TRANSLATIONS[item.name] || item.name,
        })));
      } catch (error) {
        console.error("공휴일 로드 실패:", error);
      }
    };
    loadHolidays();
  }, [calendarDate]);

  // ─── 일정 + 체크리스트 로드 ───
  useEffect(() => {
    if (!authUser) return;
    const loadData = async () => {
      try {
        const { data: eventsData } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", authUser.id)
          .order("date", { ascending: true });
        setEvents(eventsData || []);

        const { data: checklistsData } = await supabase
          .from("calendar_checklists")
          .select("*")
          .eq("user_id", authUser.id)
          .limit(10);
        setChecklists(checklistsData || []);
      } catch (error) {
        console.error("Data load failed:", error);
      }
    };
    loadData();
  }, [authUser]);

  // ─── 고객 D-day 이벤트 로드 ───
  useEffect(() => {
    if (!authUser) return;
    const loadCustomerEvents = async () => {
      try {
        const { data: customers } = await supabase
          .from("customer_sync")
          .select("name, birth_date, myeonchek_end_date, gamek_end_date, car_renewal_date")
          .eq("user_id", authUser.id);

        if (!customers) return;

        const events: CustomerEvent[] = [];
        const thisYear = new Date().getFullYear();

        customers.forEach((c) => {
          // 생일 (올해 + 내년)
          if (c.birth_date) {
            const birth6 = c.birth_date.replace(/-/g, "").slice(0, 6);
            [thisYear, thisYear + 1].forEach((year) => {
              const dateStr = birthDateToThisYear(birth6, year);
              if (dateStr) {
                events.push({ date: dateStr, label: `${c.name} 생일`, type: "birthday" });
              }
            });
          }

          // 면책기간 종료
          if (c.myeonchek_end_date) {
            events.push({ date: c.myeonchek_end_date, label: `${c.name} 면책종료`, type: "myeonchek" });
          }

          // 감액기간 종료
          if (c.gamek_end_date) {
            events.push({ date: c.gamek_end_date, label: `${c.name} 감액종료`, type: "gamek" });
          }

          // 자동차 갱신
          if (c.car_renewal_date) {
            events.push({ date: c.car_renewal_date, label: `${c.name} 자동차갱신`, type: "car" });
          }
        });

        setCustomerEvents(events);
      } catch (error) {
        console.error("고객 이벤트 로드 실패:", error);
      }
    };
    loadCustomerEvents();
  }, [authUser]);

  // ─── 달력 데이터 ───
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const nextMonthDays = 42 - (startDay + daysInMonth);

  const calendarDays = [
    ...Array.from({ length: startDay }, (_, i) => ({ day: prevMonthLastDay - startDay + i + 1, type: "prev" })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, type: "current" })),
    ...Array.from({ length: nextMonthDays }, (_, i) => ({ day: i + 1, type: "next" })),
  ];

  // ─── 헬퍼 ───
  const getEventsForDate = (dateStr: string) => events.filter((e) => e.date === dateStr);

  const getCustomerEventsForDate = (dateStr: string) =>
    showCustomerEvents ? customerEvents.filter((e) => e.date === dateStr) : [];

  const getHolidayForDate = (dateStr: string) => {
    const dateNum = dateStr.replace(/-/g, "");
    return holidays.find((h) => h.date === dateNum);
  };

  // ─── 일정 CRUD ───
  const handleAddEvent = async () => {
    if (!authUser || !formData.title || !formData.date) {
      alert("제목과 날짜를 입력해주세요");
      return;
    }
    try {
      await supabase.from("calendar_events").insert([{
        user_id: authUser.id,
        ...formData,
        time: formData.time || null,
        place: formData.place || null,
        memo: formData.memo || null,
      }]);
      const { data } = await supabase.from("calendar_events").select("*").eq("user_id", authUser.id).order("date", { ascending: true });
      setEvents(data || []);
      resetForm();
      setShowEventModal(false);
    } catch (error: any) {
      alert(`일정 추가에 실패했습니다: ${error.message}`);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      await supabase.from("calendar_events").update({
        ...formData,
        time: formData.time || null,
        place: formData.place || null,
        memo: formData.memo || null,
      }).eq("id", editingEvent.id);
      const { data } = await supabase.from("calendar_events").select("*").eq("user_id", authUser.id).order("date", { ascending: true });
      setEvents(data || []);
      resetForm();
      setShowEventModal(false);
    } catch (error: any) {
      alert(`일정 수정에 실패했습니다: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await supabase.from("calendar_events").delete().eq("id", id);
      const { data } = await supabase.from("calendar_events").select("*").eq("user_id", authUser.id).order("date", { ascending: true });
      setEvents(data || []);
    } catch (error: any) {
      alert(`일정 삭제에 실패했습니다: ${error.message}`);
    }
  };

  // ─── 체크리스트 CRUD ───
  const handleAddChecklist = async () => {
    if (!authUser || !checklistText.trim()) return;
    if (checklists.length >= 10) return;
    try {
      await supabase.from("calendar_checklists").insert([{
        user_id: authUser.id,
        text: checklistText.trim(),
        completed: false,
      }]);
      const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
      setChecklists(data || []);
      setChecklistText("");
    } catch (error) {
      console.error("체크리스트 추가 실패:", error);
    }
  };

  const handleToggleChecklist = async (id: string, completed: boolean) => {
    try {
      await supabase.from("calendar_checklists").update({ completed: !completed }).eq("id", id);
      const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
      setChecklists(data || []);
    } catch (error) {
      console.error("체크리스트 토글 실패:", error);
    }
  };

  const handleUpdateChecklist = async (id: string, text: string) => {
    if (!text.trim()) return;
    try {
      await supabase.from("calendar_checklists").update({ text: text.trim() }).eq("id", id);
      const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
      setChecklists(data || []);
      setEditingChecklistId(null);
    } catch (error) {
      console.error("체크리스트 수정 실패:", error);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      await supabase.from("calendar_checklists").delete().eq("id", id);
      const { data } = await supabase.from("calendar_checklists").select("*").eq("user_id", authUser.id).limit(10);
      setChecklists(data || []);
    } catch (error) {
      console.error("체크리스트 삭제 실패:", error);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", date: "", time: "", place: "", memo: "", icon: "📅", color: "blue" });
    setEditingEvent(null);
  };

  const openEventModal = (dateStr: string) => {
    setFormData({ ...formData, date: dateStr });
    setShowEventModal(true);
  };

  // ─── 필터된 일정 ───
  const filteredEvents = events
    .filter((e) => new Date(e.date) >= today)
    .filter((e) => `${e.title} ${e.content}`.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 고객 D-day 이벤트도 일정 목록에 포함 (오늘 이후 30일)
  const upcomingCustomerEvents = showCustomerEvents
    ? customerEvents
        .filter((e) => {
          const d = new Date(e.date);
          const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 30;
        })
        .filter((e) => e.label.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  if (!authStatus || authStatus !== "approved") return null;

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CalendarDays className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">캘린더</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">일정과 체크리스트를 관리하세요</p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      {/* 메인 */}
      <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto">

        {/* 고객 D-day 표시 토글 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-700">고객 D-day 표시</span>
            <span className="text-xs text-gray-400">({customerEvents.length}건)</span>
          </div>
          <button
            onClick={() => setShowCustomerEvents(!showCustomerEvents)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showCustomerEvents ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                showCustomerEvents ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
          {/* 월 네비게이션 */}
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900">{currentYear}년 {currentMonth + 1}월</h2>
              <button
                onClick={() => { setCalendarDate(new Date()); setSelectedDate(""); }}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 cursor-pointer hover:bg-blue-100 transition"
              >
                오늘
              </button>
            </div>
            <button
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
              <div
                key={day}
                style={{ color: index === 0 ? "#ef4444" : index === 6 ? "#3b82f6" : "#374151" }}
                className="text-sm font-bold"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((dateItem, index) => {
              const displayDay = dateItem.day;
              const dateYear =
                dateItem.type === "prev" ? (currentMonth === 0 ? currentYear - 1 : currentYear)
                : dateItem.type === "next" ? (currentMonth === 11 ? currentYear + 1 : currentYear)
                : currentYear;
              const dateMonth =
                dateItem.type === "prev" ? (currentMonth === 0 ? 11 : currentMonth - 1)
                : dateItem.type === "next" ? (currentMonth === 11 ? 0 : currentMonth + 1)
                : currentMonth;
              const fullDate = `${dateYear}-${String(dateMonth + 1).padStart(2, "0")}-${String(displayDay).padStart(2, "0")}`;
              const dayEvents = getEventsForDate(fullDate);
              const custEvents = getCustomerEventsForDate(fullDate);
              const holiday = getHolidayForDate(fullDate);
              const isToday = fullDate === todayValue;
              const isOtherMonth = dateItem.type !== "current";
              const realDay = new Date(fullDate).getDay();
              const hasAnyEvent = dayEvents.length > 0 || custEvents.length > 0;

              const numberColor =
                realDay === 0 ? (isOtherMonth ? "#fecaca" : "#ef4444")
                : realDay === 6 ? (isOtherMonth ? "#bfdbfe" : "#3b82f6")
                : isOtherMonth ? "#d1d5db" : "#374151";

              return (
                <div
                  key={`${dateItem.type}-${displayDay}-${index}`}
                  onClick={() => {
                    setSelectedDate(fullDate);
                    if (window.innerWidth < 640) {
                      setMobileDayDate(fullDate);
                      setShowMobileDayPopup(true);
                    }
                  }}
                  className={`
                    aspect-square rounded-xl border border-gray-200 cursor-pointer
                    ${selectedDate === fullDate ? "bg-gray-50" : isToday ? "bg-blue-50" : "bg-white"}
                    hover:-translate-y-1 hover:shadow-md transition relative group
                  `}
                >
                  {/* 모바일 */}
                  <div className="sm:hidden flex flex-col items-center justify-center h-full gap-0.5">
                    <span className="text-xs font-semibold" style={{ color: numberColor }}>{displayDay}</span>
                    {hasAnyEvent && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                    {!hasAnyEvent && custEvents.length > 0 && <div className="w-1 h-1 rounded-full bg-yellow-400" />}
                    {!hasAnyEvent && holiday && <div className="w-1 h-1 rounded-full bg-red-300" />}
                  </div>

                  {/* PC */}
                  <div className="hidden sm:block p-2 h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-0.5">
                        <span className="text-sm font-semibold" style={{ color: numberColor }}>{displayDay}</span>
                        {holiday && (
                          <span className="text-[10px] text-gray-400 truncate max-w-16 ml-1">{holiday.name}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEventModal(fullDate); }}
                        className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="space-y-0.5">
                      {/* 일반 일정 */}
                      {dayEvents.slice(0, 1).map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setFormData(event);
                            setShowEventModal(true);
                          }}
                          className={`block w-full text-left text-[10px] leading-tight truncate rounded px-1 py-0.5 cursor-pointer transition ${
                            event.color === "green" ? "bg-green-50 text-green-600"
                            : event.color === "red" ? "bg-red-50 text-red-600"
                            : event.color === "yellow" ? "bg-yellow-50 text-yellow-600"
                            : event.color === "white" ? "bg-white text-gray-600 border border-gray-200"
                            : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <span className="mr-0.5">{event.icon}</span>{event.title}
                        </button>
                      ))}

                      {/* 고객 D-day */}
                      {custEvents.slice(0, 2 - Math.min(dayEvents.length, 1)).map((ce, i) => {
                        const style = CUSTOMER_EVENT_STYLE[ce.type];
                        return (
                          <div
                            key={`ce-${i}`}
                            className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${style.bg} ${style.text}`}
                          >
                            {style.icon} {ce.label}
                          </div>
                        );
                      })}

                      {/* 더 있음 표시 */}
                      {(dayEvents.length + custEvents.length) > 2 && (
                        <div className="text-[10px] text-gray-400">
                          +{dayEvents.length + custEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 체크리스트 + 일정 목록 */}
        <div className="flex flex-col sm:grid sm:gap-6" style={{ gridTemplateColumns: "1fr 2fr" }}>
          {/* 체크리스트 */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6 sm:mb-0">
            <h2 className="text-lg font-black text-gray-900 mb-4">체크리스트</h2>
            <div className="space-y-2 mb-4">
              {checklists.map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded transition">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleChecklist(item.id, item.completed)}
                    className="w-4 h-4 cursor-pointer mt-0.5"
                  />
                  {editingChecklistId === item.id ? (
                    <input
                      type="text"
                      value={editingChecklistText}
                      onChange={(e) => setEditingChecklistText(e.target.value)}
                      onBlur={() => handleUpdateChecklist(item.id, editingChecklistText)}
                      onKeyPress={(e) => { if (e.key === "Enter") handleUpdateChecklist(item.id, editingChecklistText); }}
                      autoFocus
                      className="flex-1 pl-4 pr-4 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 transition"
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingChecklistId(item.id); setEditingChecklistText(item.text); }}
                      className={`flex-1 text-sm cursor-pointer ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {item.text}
                    </span>
                  )}
                  <button onClick={() => handleDeleteChecklist(item.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {checklists.length < 10 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  placeholder="체크리스트 추가"
                  className="flex-1 pl-4 pr-4 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 transition"
                  onKeyPress={(e) => { if (e.key === "Enter") handleAddChecklist(); }}
                />
                <button onClick={handleAddChecklist} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition flex items-center">
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
            {checklists.length >= 10 && (
              <div className="text-xs text-gray-500 text-center py-2">최대 10개까지만 추가 가능</div>
            )}
          </div>

          {/* 일정 목록 */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <h2 className="text-lg font-black text-gray-900 mb-4">일정</h2>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="일정 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl outline-none focus:border-gray-400 transition"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* 일반 일정 */}
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => { setEditingEvent(event); setFormData(event); setShowEventModal(true); }}
                  className={`p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-default transition flex items-center justify-between ${
                    event.color === "green" ? "bg-green-50"
                    : event.color === "red" ? "bg-red-50"
                    : event.color === "yellow" ? "bg-yellow-50"
                    : event.color === "white" ? "bg-white"
                    : "bg-blue-50"
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{event.icon}</span>
                    <span className="font-bold text-gray-900 shrink-0">{event.title.length > 8 ? event.title.slice(0, 8) : event.title}</span>
                    {event.content && <span className="text-sm text-gray-500 shrink-0">{event.content.length > 20 ? event.content.slice(0, 19) + "…" : event.content}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString("ko-KR")}</div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} className="text-gray-400 hover:text-red-500 transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 고객 D-day 이벤트 (30일 이내) */}
              {upcomingCustomerEvents.map((ce, i) => {
                const style = CUSTOMER_EVENT_STYLE[ce.type];
                const dday = Math.ceil((new Date(ce.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={`uce-${i}`}
                    className={`p-3 border rounded-2xl flex items-center justify-between ${style.bg} border-current/20`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{style.icon}</span>
                      <span className={`font-bold text-sm ${style.text}`}>{ce.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{new Date(ce.date).toLocaleDateString("ko-KR")}</span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${style.bg} ${style.text}`}>
                        {dday === 0 ? "D-Day" : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && upcomingCustomerEvents.length === 0 && (
                <div className="text-center text-gray-500 py-8">예정된 일정이 없습니다</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 날짜 팝업 */}
      {showMobileDayPopup && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center sm:hidden"
          onClick={() => setShowMobileDayPopup(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">
                  {mobileDayDate ? new Date(mobileDayDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }) : ""}
                </p>
                {(() => {
                  const holiday = getHolidayForDate(mobileDayDate);
                  return holiday ? <p className="text-xs text-red-400 font-bold mt-0.5">{holiday.name}</p> : null;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowMobileDayPopup(false); openEventModal(mobileDayDate); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  일정 추가
                </button>
                <button
                  onClick={() => setShowMobileDayPopup(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {/* 일반 일정 */}
              {getEventsForDate(mobileDayDate).map((event) => (
                <div
                  key={event.id}
                  onClick={() => { setShowMobileDayPopup(false); setEditingEvent(event); setFormData(event); setShowEventModal(true); }}
                  className={`p-3 border border-gray-200 rounded-2xl cursor-pointer transition flex items-center justify-between ${
                    event.color === "green" ? "bg-green-50"
                    : event.color === "red" ? "bg-red-50"
                    : event.color === "yellow" ? "bg-yellow-50"
                    : event.color === "white" ? "bg-white"
                    : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-lg">{event.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{event.title}</p>
                      {event.content && <p className="text-xs text-gray-500 truncate">{event.content}</p>}
                    </div>
                  </div>
                  {event.time && <span className="text-xs text-gray-400 shrink-0">{event.time}</span>}
                </div>
              ))}

              {/* 고객 D-day */}
              {getCustomerEventsForDate(mobileDayDate).map((ce, i) => {
                const style = CUSTOMER_EVENT_STYLE[ce.type];
                return (
                  <div
                    key={`mce-${i}`}
                    className={`p-3 rounded-2xl flex items-center gap-3 ${style.bg}`}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <p className={`font-bold text-sm ${style.text}`}>{ce.label}</p>
                      <p className="text-xs text-gray-400">고객 관리 D-day</p>
                    </div>
                  </div>
                );
              })}

              {getEventsForDate(mobileDayDate).length === 0 && getCustomerEventsForDate(mobileDayDate).length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">이 날의 일정이 없습니다</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {showEventModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
          onClick={() => { setShowEventModal(false); resetForm(); }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">{editingEvent ? "일정 수정" : "일정 추가"}</h3>
              <button onClick={() => { setShowEventModal(false); resetForm(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="제목 *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition"
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition"
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition"
              />
              <input
                type="text"
                placeholder="내용"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition"
              />
              <input
                type="text"
                placeholder="장소"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                className="w-full h-11 px-4 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition"
              />
              <textarea
                placeholder="메모"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition resize-none"
              />

              {/* 색상 선택 */}
              <div className="flex gap-2">
                {["blue", "green", "red", "yellow", "white"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      formData.color === color ? "border-gray-900 scale-110" : "border-gray-200"
                    } ${
                      color === "blue" ? "bg-blue-200"
                      : color === "green" ? "bg-green-200"
                      : color === "red" ? "bg-red-200"
                      : color === "yellow" ? "bg-yellow-200"
                      : "bg-white"
                    }`}
                  />
                ))}
              </div>

              {/* 이모지 선택 */}
              <div>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-2xl text-sm hover:bg-gray-50 transition"
                >
                  <span className="text-xl">{formData.icon}</span>
                  <span className="text-gray-500">아이콘 선택</span>
                </button>
                {showEmojiPicker && (
                  <div className="mt-2 grid grid-cols-8 gap-1 p-3 bg-gray-50 rounded-2xl">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setFormData({ ...formData, icon: emoji }); setShowEmojiPicker(false); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              {editingEvent && (
                <button
                  onClick={() => { handleDeleteEvent(editingEvent.id); setShowEventModal(false); resetForm(); }}
                  className="px-4 py-2.5 border border-red-200 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-50 transition"
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => { setShowEventModal(false); resetForm(); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition"
              >
                {editingEvent ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
