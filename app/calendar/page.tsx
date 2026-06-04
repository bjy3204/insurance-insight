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
} from "lucide-react";
import { Newspaper, MessageCircle } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

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

const EMOJI_LIST = [
  "📅", "🎉", "🎊", "🎈", "🎁", "🎯", "📝", "📌", "⭐", "🌟",
  "💼", "📊", "📈", "🔔", "📢", "💡", "🎓", "🏆", "🎂", "🎬",
  "🎵", "🎸", "🎹", "🎤", "📱", "💻", "⚙️", "❤️", "🛒", "🚗","🚨","⏰","ℹ️","✔️","☠️","🎁","📖","🗂️","✏️","✈️",
];

export default function CalendarPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
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

  // 모바일 날짜 일정 팝업
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

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayValue = formatDate(today);

  // 인증 확인
  useEffect(() => {
        const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setAuthUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        setAuthStatus(profile?.status || "pending");
      } else {
        setAuthStatus("none");
      }
    };


    checkAuth();
  }, []);

  // 미승인 사용자 리다이렉트
  useEffect(() => {
    if (authStatus && authStatus !== "approved") {
      window.location.href = "/";
    }
  }, [authStatus]);

  // 공휴일 데이터 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = calendarDate.getFullYear();
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`
        );
        const data = await response.json();

        const HOLIDAY_TRANSLATIONS: Record<string, string> = {
          "New Year's Day": "신정",
          "Lunar New Year": "설날",
          "Independence Movement Day": "3.1절",
          "Arbor Day": "식목일",
          "Buddha's Birthday": "부처님오신날",
          "Memorial Day": "현충일",
          "Local Election Day": "지방선거",
"Local Election": "지방선거",
          "Liberation Day": "광복절",
          "Chuseok": "추석",
          "National Foundation Day": "개천절",
          "Hangul Day": "한글날",
          "Constitution Day": "제헌절",
          "Christmas Day": "크리스마스",
          "Labour Day": "근로자의날",
          "Children's Day": "어린이날",
        };

        const holidayList = data.map((item: any) => ({
          date: item.date.replace(/-/g, ""),
          name: HOLIDAY_TRANSLATIONS[item.name] || item.name,
        }));

        setHolidays(holidayList);
      } catch (error) {
        console.error("공휴일 로드 실패:", error);
      }
    };

    loadHolidays();
  }, [calendarDate]);

  // 일정 데이터 로드
  useEffect(() => {
    if (!authUser) return;

    const loadData = async () => {
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", authUser.id)
          .order("date", { ascending: true });

        if (eventsError) {
          console.error("Events load error:", eventsError);
        } else {
          setEvents(eventsData || []);
        }

        const { data: checklistsData, error: checklistsError } = await supabase
          .from("calendar_checklists")
          .select("*")
          .eq("user_id", authUser.id)
          .limit(10);

        if (checklistsError) {
          console.error("Checklists load error:", checklistsError);
        } else {
          setChecklists(checklistsData || []);
        }
      } catch (error) {
        console.error("Data load failed:", error);
      }
    };

    loadData();
  }, [authUser]);

  // 달력 데이터 생성
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const nextMonthDays = 42 - (startDay + daysInMonth);

  const calendarDays = [
    ...Array.from({ length: startDay }, (_, i) => ({
      day: prevMonthLastDay - startDay + i + 1,
      type: "prev",
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      type: "current",
    })),
    ...Array.from({ length: nextMonthDays }, (_, i) => ({
      day: i + 1,
      type: "next",
    })),
  ];

  // 날짜별 일정 조회
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  // 공휴일 조회
  const getHolidayForDate = (dateStr: string) => {
    const dateNum = dateStr.replace(/-/g, "");
    return holidays.find((h) => h.date === dateNum);
  };

  // 일정 추가
  const handleAddEvent = async () => {
    if (!authUser || !formData.title || !formData.date) {
      alert("제목과 날짜를 입력해주세요");
      return;
    }

    try {
      const eventData = {
        user_id: authUser.id,
        title: formData.title,
        content: formData.content,
        date: formData.date,
        time: formData.time || null,
        place: formData.place || null,
        memo: formData.memo || null,
        icon: formData.icon,
        color: formData.color,
      };

      const { data, error } = await supabase
        .from("calendar_events")
        .insert([eventData])
        .select();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      const { data: eventsData } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", authUser.id)
        .order("date", { ascending: true });

      setEvents(eventsData || []);
      resetForm();
      setShowEventModal(false);
    } catch (error: any) {
      console.error("일정 추가 실패:", error);
      alert(`일정 추가에 실패했습니다: ${error.message}`);
    }
  };

  // 일정 수정
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: formData.title,
          content: formData.content,
          date: formData.date,
          time: formData.time || null,
          place: formData.place || null,
          memo: formData.memo || null,
          icon: formData.icon,
          color: formData.color,
        })
        .eq("id", editingEvent.id);

      if (error) throw error;

      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", authUser.id)
        .order("date", { ascending: true });

      setEvents(data || []);
      resetForm();
      setShowEventModal(false);
    } catch (error: any) {
      console.error("일정 수정 실패:", error);
      alert(`일정 수정에 실패했습니다: ${error.message}`);
    }
  };

  // 일정 삭제
  const handleDeleteEvent = async (id: string) => {
    try {
      await supabase.from("calendar_events").delete().eq("id", id);

      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", authUser.id)
        .order("date", { ascending: true });

      setEvents(data || []);
    } catch (error: any) {
      console.error("일정 삭제 실패:", error);
      alert(`일정 삭제에 실패했습니다: ${error.message}`);
    }
  };

  // 체크리스트 추가
  const handleAddChecklist = async () => {
    if (!authUser) return;
    if (checklists.length >= 10) {
      alert("체크리스트는 최대 10개까지만 추가할 수 있습니다");
      return;
    }

    try {
      const { error } = await supabase.from("calendar_checklists").insert([{
        user_id: authUser.id,
        text: checklistText,
        completed: false,
      }]);

      if (error) throw error;

      const { data } = await supabase
        .from("calendar_checklists")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(10);

      setChecklists(data || []);
      setChecklistText("");
    } catch (error: any) {
      console.error("체크리스트 추가 실패:", error);
    }
  };

  // 체크리스트 토글
  const handleToggleChecklist = async (id: string, completed: boolean) => {
    try {
      await supabase
        .from("calendar_checklists")
        .update({ completed: !completed })
        .eq("id", id);

      const { data } = await supabase
        .from("calendar_checklists")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(10);

      setChecklists(data || []);
    } catch (error: any) {
      console.error("체크리스트 토글 실패:", error);
    }
  };

  // 체크리스트 삭제
  const handleDeleteChecklist = async (id: string) => {
    try {
      await supabase.from("calendar_checklists").delete().eq("id", id);

      const { data } = await supabase
        .from("calendar_checklists")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(10);

      setChecklists(data || []);
    } catch (error: any) {
      console.error("체크리스트 삭제 실패:", error);
    }
  };

  const handleUpdateChecklist = async (id: string, text: string) => {
    if (!text.trim()) return;
    try {
      await supabase.from("calendar_checklists").update({ text }).eq("id", id);
      const { data } = await supabase
        .from("calendar_checklists")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(10);
      setChecklists(data || []);
      setEditingChecklistId(null);
    } catch (error: any) {
      console.error("체크리스트 수정 실패:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      date: "",
      time: "",
      place: "",
      memo: "",
      icon: "📅",
      color: "blue",
    });
    setEditingEvent(null);
  };

  const openEventModal = (dateStr: string) => {
    setFormData({ ...formData, date: dateStr });
    setShowEventModal(true);
  };

  // 필터링된 일정 목록
  const filteredEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= today;
    })
    .filter((e) =>
      `${e.title} ${e.content}`.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (authStatus === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authStatus !== "approved") {
    return null;
  }


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
              <p className="text-sm text-gray-500 mt-1">
                일정과 체크리스트를 관리하세요
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:grid sm:gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 3fr)" }}>
        {/* 달력 */}
          <div className="order-1 sm:order-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
          {/* 월 네비게이션 */}
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() =>
                setCalendarDate(new Date(currentYear, currentMonth - 1, 1))
              }
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900">
                {currentYear}년 {currentMonth + 1}월
              </h2>
              <button
                onClick={() => {
                  const now = new Date();
                  setCalendarDate(now);
                  setSelectedDate("");
                }}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 cursor-pointer hover:bg-blue-100 transition"
              >
                오늘
              </button>
            </div>

            <button
              onClick={() =>
                setCalendarDate(new Date(currentYear, currentMonth + 1, 1))
              }
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
                style={{
                  color:
                    index === 0
                      ? "#ef4444"
                      : index === 6
                      ? "#3b82f6"
                      : "#374151",
                }}
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
                dateItem.type === "prev"
                  ? currentMonth === 0 ? currentYear - 1 : currentYear
                  : dateItem.type === "next"
                  ? currentMonth === 11 ? currentYear + 1 : currentYear
                  : currentYear;

              const dateMonth =
                dateItem.type === "prev"
                  ? currentMonth === 0 ? 11 : currentMonth - 1
                  : dateItem.type === "next"
                  ? currentMonth === 11 ? 0 : currentMonth + 1
                  : currentMonth;

              const fullDate = `${dateYear}-${String(dateMonth + 1).padStart(2, "0")}-${String(displayDay).padStart(2, "0")}`;

              const dayEvents = getEventsForDate(fullDate);
              const holiday = getHolidayForDate(fullDate);
              const isToday = fullDate === todayValue;
              const isOtherMonth = dateItem.type !== "current";
              const realDay = new Date(fullDate).getDay();
              const hasEvents = dayEvents.length > 0;

              const numberColor =
                realDay === 0
                  ? isOtherMonth ? "#fecaca" : "#ef4444"
                  : realDay === 6
                  ? isOtherMonth ? "#bfdbfe" : "#3b82f6"
                  : isOtherMonth ? "#d1d5db" : "#374151";

              return (
                <div
                  key={`${dateItem.type}-${displayDay}-${index}`}
                  onClick={() => {
                    setSelectedDate(fullDate);
                    // 모바일: 날짜 클릭 시 팝업 표시
                    if (window.innerWidth < 640) {
                      setMobileDayDate(fullDate);
                      setShowMobileDayPopup(true);
                    }
                  }}
                  className={`
                    aspect-square
                    rounded-xl
                    border
                    border-gray-200
                    
                    ${
                      selectedDate === fullDate
                        ? "bg-gray-50"
                        : isToday
                        ? "bg-blue-50"
                        : "bg-white"
                    }
                    hover:-translate-y-1
                    hover:shadow-md
                    transition
                    relative
                    group
                  `}
                >
                  {/* 모바일: 날짜 숫자만 중앙 표시 */}
                  <div className="sm:hidden flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-semibold" style={{ color: numberColor }}>
                      {displayDay}
                    </span>
                    {/* 일정 있으면 파란 점 */}
                    {hasEvents && (
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                    )}
                    {/* 공휴일 점 (일정 없을 때) */}
                    {!hasEvents && holiday && (
                      <div className="w-1 h-1 rounded-full bg-red-300 mt-0.5" />
                    )}
                  </div>

                  {/* PC: 기존 레이아웃 */}
                  <div className="hidden sm:block p-3 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-0.5">
                        <span className="text-base font-semibold" style={{ color: numberColor }}>
                          {displayDay}
                        </span>
                        {holiday && (
                          <span className="text-[12px] text-gray-400 truncate max-w-24 ml-2">
                            {holiday.name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventModal(fullDate);
                        }}
                        className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setFormData(event);
                            setShowEventModal(true);
                          }}
                          className={`
                            block w-full text-left text-[12px] leading-tight truncate whitespace-nowrap
                            rounded-md px-2 py-1 cursor-pointer transition
                            ${
                              event.color === "green"
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : event.color === "red"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : event.color === "yellow"
                                ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                : event.color === "white"
                                ? "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }
                          `}
                        >
                          <span className="mr-1">{event.icon}</span>
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[11px] text-gray-400">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* 왼쪽: 체크리스트 + 일정목록 */}
          <div className="order-2 sm:order-1 flex flex-col gap-6">

          {/* 체크리스트 — 모바일: order-2(아래), PC: order-1(왼쪽) */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 mt-6 sm:mt-0">
            <h2 className="text-lg font-black text-gray-900 mb-4">
              체크리스트
            </h2>

            <div className="space-y-2 mb-4">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() =>
                      handleToggleChecklist(item.id, item.completed)
                    }
                    className="w-4 h-4 cursor-pointer mt-0.5"
                  />
                  {editingChecklistId === item.id ? (
                    <input
                      type="text"
                      value={editingChecklistText}
                      onChange={(e) => setEditingChecklistText(e.target.value)}
                      onBlur={() => handleUpdateChecklist(item.id, editingChecklistText)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleUpdateChecklist(item.id, editingChecklistText);
                      }}
                      autoFocus
                      className="flex-1 pl-4 pr-4 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingChecklistId(item.id);
                        setEditingChecklistText(item.text);
                      }}
                      className={`flex-1 text-sm cursor-pointer ${
                        item.completed ? "line-through text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {item.text}
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
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
                  className="flex-1 pl-4 pr-4 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddChecklist();
                  }}
                />
                <button
                  onClick={handleAddChecklist}
                  className="px-3 py-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition flex items-center"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {checklists.length >= 10 && (
              <div className="text-xs text-gray-500 text-center py-2">
                최대 10개까지만 추가 가능
              </div>
            )}
          </div>

          {/* 일정 목록 — 모바일: order-1(위), PC: order-2(오른쪽) */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <h2 className="text-lg font-black text-gray-900 mb-4">일정</h2>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="일정 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  예정된 일정이 없습니다
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setEditingEvent(event);
                      setFormData(event);
                      setShowEventModal(true);
                    }}
                    className={`p-3 border border-gray-200 rounded-2xl hover:bg-gray-50  transition flex items-center justify-between ${
                      event.color === "green"
                        ? "bg-green-50"
                        : event.color === "red"
                        ? "bg-red-50"
                        : event.color === "yellow"
                        ? "bg-yellow-50"
                        : event.color === "white"
                        ? "bg-white"
                        : "bg-blue-50"
                    }`}
                  >
                    {/* 일정 정보 */}
<div className="flex items-center gap-5 min-w-0 flex-1 overflow-hidden">

  {/* 아이콘 */}
  <span className="shrink-0 text-base">{event.icon}</span>

  {/* 제목 */}
  <div className="min-w-[120px] max-w-[160px] truncate">
    <p className="font-bold text-gray-900 text-sm truncate">
      {event.title}
    </p>
  </div>

  {/* 시간 */}
  <div className="min-w-[90px] max-w-[90px] truncate">
    <p className="text-sm text-gray-500 truncate">
      {event.time || ""}
    </p>
  </div>

  {/* 장소 */}
  <div className="min-w-[120px] max-w-[120px] truncate">
    <p className="text-sm text-gray-500 truncate">
      {event.place || ""}
    </p>
  </div>

  {/* 메모 */}
  <div className="flex-1 min-w-[120px] truncate">
    <p className="text-sm text-gray-400 truncate">
      {event.memo || ""}
    </p>
  </div>

{/* 날짜 */}
<div className="shrink-0 mr-4">
    <p className="text-sm text-gray-400">
     {new Date(event.date).toLocaleDateString("ko-KR", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
})}
    </p>
  </div>

</div>

                    {/* 오른쪽: 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="shrink-0 ml-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ===== 모바일 날짜 일정 팝업 ===== */}
      {showMobileDayPopup && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center sm:hidden"
          onClick={() => setShowMobileDayPopup(false)}
        >
          <div
            className="bg-white w-[90%] rounded-3xl shadow-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {mobileDayDate
                    ? new Date(mobileDayDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })
                    : ""}
                </p>
                {(() => {
                  const holiday = getHolidayForDate(mobileDayDate);
                  return holiday ? (
                    <p className="text-xs text-red-400 font-bold mt-0.5">{holiday.name}</p>
                  ) : null;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMobileDayPopup(false);
                    openEventModal(mobileDayDate);
                  }}
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

            {/* 일정 목록 */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {getEventsForDate(mobileDayDate).length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">
                  이 날의 일정이 없습니다
                </div>
              ) : (
                getEventsForDate(mobileDayDate).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setShowMobileDayPopup(false);
                      setEditingEvent(event);
                      setFormData(event);
                      setShowEventModal(true);
                    }}
                    className={`p-3 border border-gray-200 rounded-2xl cursor-pointer transition flex items-center justify-between ${
                      event.color === "green"
                        ? "bg-green-50"
                        : event.color === "red"
                        ? "bg-red-50"
                        : event.color === "yellow"
                        ? "bg-yellow-50"
                        : event.color === "white"
                        ? "bg-white"
                        : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 text-lg">{event.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{event.title}</p>
                        {event.content && (
                          <p className="text-xs text-gray-500 truncate">{event.content}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-2">
                      {event.time && (
                        <span className="text-xs text-gray-400">{event.time}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 일정 추가/수정 모달 ===== */}
      {showEventModal && (
        <div
          onClick={() => setShowEventModal(false)}
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
        >
                    <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              const tag = (e.target as HTMLElement).tagName;
              if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
              setIsDragging(true);
              setDragStart({ x: e.clientX - modalPos.x, y: e.clientY - modalPos.y });
            }}

            onMouseMove={(e) => {
              if (isDragging) {
                setModalPos({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className="bg-white w-[90%] max-w-lg rounded-3xl shadow-xl flex flex-col"
            style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-black text-gray-900">
                {editingEvent ? "일정 수정" : "일정 추가"}
              </h2>
              <button
                onClick={() => { setShowEventModal(false); resetForm(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-2 pb-4 overflow-y-auto flex-1 min-w-0">
              <div className="space-y-3">
                {/* 제목 + 이모지 */}
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 border border-gray-200 rounded-2xl text-2xl hover:bg-gray-50 transition flex items-center justify-center focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none"
                    >
                      {formData.icon}
                    </button>

                    {showEmojiPicker && (
                      <>
                        <div
                          className="fixed inset-0 z-[99]"
                          onClick={() => setShowEmojiPicker(false)}
                        />
                        <div
                          className="absolute top-14 left-0 bg-white border border-gray-200 rounded-2xl p-2 z-[100] shadow-lg"
                          style={{ width: "280px" }}
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  setFormData({ ...formData, icon: emoji });
                                  setShowEmojiPicker(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-xl transition"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="제목"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="flex-1 h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  />
                </div>

                {/* 날짜 커스텀 피커 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.date) {
                        const [y, m, d] = formData.date.split("-").map(Number);
                        setPickerYear(y);
                        setPickerMonth(m - 1);
                      }
                      setShowDatePicker(!showDatePicker);
                      setShowTimePicker(false);
                    }}
                    className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition"
                  >
                    <span className="text-gray-400">📅</span>
                    <span className={formData.date ? "text-gray-800" : "text-gray-400"}>
                      {formData.date || "날짜 선택"}
                    </span>
                  </button>

                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-[99]" onClick={() => setShowDatePicker(false)} />
                      <div className="absolute top-14 left-0 bg-white border border-gray-200 rounded-2xl p-4 z-[100] shadow-lg" style={{ width: "320px" }}>
                        <div className="flex items-center justify-between mb-3">
                          <button type="button" onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else setPickerMonth(pickerMonth - 1); }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">‹</button>
                          <span className="text-sm font-bold text-gray-800">{pickerYear}년 {pickerMonth + 1}월</span>
                          <button type="button" onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else setPickerMonth(pickerMonth + 1); }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">›</button>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {["일","월","화","수","목","금","토"].map((d, i) => (
                            <div key={d} className={`text-center text-xs font-bold py-1 ${i===0?"text-red-400":i===6?"text-blue-400":"text-gray-400"}`}>{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7">
                          {(() => {
                            const firstDow = new Date(pickerYear, pickerMonth, 1).getDay();
                            const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                            const cells = [];
                            for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);
                            for (let d = 1; d <= daysInMonth; d++) {
                              const dateStr = `${pickerYear}-${String(pickerMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                              const isSelected = formData.date === dateStr;
                              const dow = new Date(pickerYear, pickerMonth, d).getDay();
                              cells.push(
                                <button key={d} type="button"
                                  onClick={() => { setFormData({ ...formData, date: dateStr }); setShowDatePicker(false); }}
                                  className={`h-9 w-full rounded-xl text-sm font-medium transition
                                    ${isSelected ? "bg-gray-800 text-white" : "hover:bg-gray-100"}
                                    ${!isSelected && dow===0 ? "text-red-400" : ""}
                                    ${!isSelected && dow===6 ? "text-blue-400" : ""}
                                    ${!isSelected && dow!==0 && dow!==6 ? "text-gray-700" : ""}
                                  `}
                                >{d}</button>
                              );
                            }
                            return cells;
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 시간 */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">⏰</span>
                  <input
                    type="text"
                    placeholder="시간 (예: 오후 2시)"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full h-12 rounded-2xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  />
                </div>

                <input
                  type="text"
                  placeholder="장소"
                  value={formData.place}
                  onChange={(e) =>
                    setFormData({ ...formData, place: e.target.value })
                  }
                  className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />

                <textarea
                  placeholder="메모"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  className="w-full h-20 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />

                {/* 색상 선택 */}
                <div className="flex gap-2 items-center mb-0">
                  <div className="flex gap-3">
                    {[
                      { value: "white", color: "bg-white", border: "border-gray-200" },
                      { value: "blue", color: "bg-blue-50", border: "border-blue-100" },
                      { value: "green", color: "bg-green-50", border: "border-green-100" },
                      { value: "yellow", color: "bg-yellow-50", border: "border-yellow-100" },
                      { value: "red", color: "bg-red-50", border: "border-red-100" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFormData({ ...formData, color: option.value })
                        }
                        className={`w-8 h-8 rounded-full transition cursor-pointer hover:scale-105 border border-gray-200 ${
                          formData.color === option.value
                            ? "ring-2 ring-gray-400 ring-offset-2"
                            : ""
                        } ${option.color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-4">
              {editingEvent && (
                <button
                  onClick={() => {
                    setDeleteEventId(editingEvent.id);
                    setDeleteEventConfirmOpen(true);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => {
                  if (editingEvent) {
                    handleUpdateEvent();
                  } else {
                    handleAddEvent();
                  }
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer"
              >
                {editingEvent ? "완료" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 팝업 */}
      {deleteEventConfirmOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">일정 삭제</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              선택한 일정을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteEventId(null);
                  setDeleteEventConfirmOpen(false);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (deleteEventId) {
                    await handleDeleteEvent(deleteEventId);
                  }
                  setDeleteEventId(null);
                  setDeleteEventConfirmOpen(false);
                  setShowEventModal(false);
                  resetForm();
                }}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 고정 메뉴 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a
            href="https://naver.me/xsZ8mk7H"
            className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            className="py-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
    </main>
  );
}
