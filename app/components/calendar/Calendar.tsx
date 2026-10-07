"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Bell,
  Pencil,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import CalendarEventModal from "./CalendarEventModal";
import { formatCalendarTime } from "@/lib/calendar-time";
import DdayWidget from "./DdayWidget";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";
import ReminderSettings from "@/app/features/home/components/dashboard/ReminderSettings";
import {
  CALENDAR_UPDATED,
  LOCAL_EVENTS_KEY,
  koreaDate,
  type CalendarEvent,
} from "@/app/features/home/components/dashboard/reminder-utils";
import {
  readLocalEvents,
  saveLocalEvents,
  calendarUpdated,
} from "@/app/features/home/components/dashboard/calendar-storage";
import styles from "@/app/features/home/components/dashboard/DashboardCards.module.css";

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
type Checklist = { id: string; text: string; completed: boolean };
type Holiday = { date: string; name: string };
type Identity = {
  userId: string | null;
  approved: boolean;
  loading: boolean;
  error?: string;
};
const CHECKLIST_KEY = "insurance-calendar-local-checklists-v1";
const colors: Record<string, string> = {
  white: "#a1aec1",
  blue: "#176bff",
  red: "#fa4268",
  green: "#13ad88",
  yellow: "#e9ad18",
};
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const emptyEvent = (date: string): Event => ({
  id: "",
  title: "",
  content: "",
  date,
  time: "",
  place: "",
  memo: "",
  icon: "📅",
  color: "blue",
});
const normalizeEvent = (event: CalendarEvent): Event => ({
  ...event,
  content: event.content || "",
  time: event.time || "",
  place: event.place || "",
  memo: event.memo || "",
});
function readChecklists(): Checklist[] {
  const data = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]");
  if (!Array.isArray(data)) throw Error("Invalid checklist");
  return data;
}

export default function Calendar({
  mode = "full",
  identity: provided,
  beforeChecklist,
}: {
  mode?: "compact" | "full";
  beforeChecklist?: ReactNode;
  identity?: Identity;
}) {
  const [identity, setIdentity] = useState<Identity>({
    userId: null,
    approved: false,
    loading: true,
  });
  useEffect(() => {
    if (provided) return;
    let active = true,
      version = 0;
    const load = async () => {
      const token = ++version;
      setIdentity((previous) => ({
        ...previous,
        loading: true,
        error: undefined,
      }));
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        let approved = false;
        if (user) {
          const result = await supabase
            .from("profiles")
            .select("status")
            .eq("id", user.id)
            .maybeSingle();
          if (result.error) throw result.error;
          approved = result.data?.status === "approved";
        }
        if (active && token === version)
          setIdentity({ userId: user?.id || null, approved, loading: false });
      } catch {
        if (active && token === version)
          setIdentity({
            userId: null,
            approved: false,
            loading: false,
            error: "회원 상태를 확인하지 못했습니다. 새로고침해 주세요.",
          });
      }
    };
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      active = false;
      version++;
      data.subscription.unsubscribe();
    };
  }, [provided]);
  const account = provided || identity;
  const owner = account.loading
    ? "loading"
    : account.error
      ? "error"
      : account.approved
        ? `cloud:${account.userId}`
        : "local";
  if (account.loading)
    return (
      <div
        className={
          mode === "compact"
            ? `${styles.card} ${styles.calendarCard}`
            : "p-6 text-center"
        }
      >
        캘린더를 불러오는 중입니다.
      </div>
    );
  if (account.error || (account.approved && !account.userId))
    return (
      <div role="alert" className="p-6 text-center">
        {account.error || "회원 정보를 확인하지 못했습니다."}
      </div>
    );
  return mode === "compact" ? (
    <CompactCalendar key={owner} identity={account} />
  ) : (
    <FullCalendar key={owner} identity={account} beforeChecklist={beforeChecklist ?? <DdayWidget />} />
  );
}

function useCalendarData(identity: Identity) {
  const { userId, approved } = identity;
  const cloud = approved;
  const [events, setEvents] = useState<Event[]>([]),
    [checklists, setChecklists] = useState<Checklist[]>([]);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const active = useRef(true),
    busy = useRef(false),
    generation = useRef(0);
  const reload = useCallback(async () => {
    const token = ++generation.current;
    try {
      let records: CalendarEvent[], checks: Checklist[];
      if (cloud) {
        if (!userId) throw Error("Missing owner");
        const [eventResult, checkResult] = await Promise.all([
          supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: true }),
          supabase
            .from("calendar_checklists")
            .select("*")
            .eq("user_id", userId)
            .limit(10),
        ]);
        if (eventResult.error || checkResult.error)
          throw eventResult.error || checkResult.error;
        records = eventResult.data || [];
        checks = checkResult.data || [];
      } else {
        records = readLocalEvents();
        checks = readChecklists();
      }
      if (active.current && token === generation.current) {
        setEvents(records.map(normalizeEvent));
        setChecklists(checks);
        setReady(true);
        setError("");
      }
    } catch {
      if (active.current && token === generation.current)
        setError(
          cloud
            ? "계정 캘린더를 불러오지 못했습니다. 다시 시도해 주세요."
            : "브라우저 캘린더를 읽지 못했습니다. 저장 설정을 확인해 주세요.",
        );
    }
  }, [cloud, userId]);
  useEffect(() => {
    active.current = true;
    void reload();
    const broadcast =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(
            `insurance-calendar:${cloud ? userId : "local"}`,
          );
    if (broadcast)
      broadcast.onmessage = () => {
        void reload();
      };
    const updated = () => {
      broadcast?.postMessage("updated");
      void reload();
    };
    const storage = (event: StorageEvent) => {
      if (
        event.key === LOCAL_EVENTS_KEY ||
        event.key === CHECKLIST_KEY ||
        event.key === null
      )
        updated();
    };
    window.addEventListener(CALENDAR_UPDATED, updated);
    window.addEventListener("focus", updated);
    if (!cloud) window.addEventListener("storage", storage);
    const channel =
      cloud && userId
        ? supabase
            .channel(`calendar:${userId}:${crypto.randomUUID()}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "calendar_events",
                filter: `user_id=eq.${userId}`,
              },
              updated,
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "calendar_checklists",
                filter: `user_id=eq.${userId}`,
              },
              updated,
            )
            .subscribe()
        : null;
    return () => {
      active.current = false;
      generation.current++;
      broadcast?.close();
      window.removeEventListener(CALENDAR_UPDATED, updated);
      window.removeEventListener("focus", updated);
      window.removeEventListener("storage", storage);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [cloud, userId, reload]);
  const write = async (operation: () => Promise<void>) => {
    if (!active.current || !ready || busy.current)
      throw Error("캘린더를 불러온 후 다시 시도해 주세요.");
    busy.current = true;
    setSaving(true);
    try {
      await operation();
      if (active.current) {
        calendarUpdated();
        await reload();
      }
    } catch {
      throw Error(
        cloud
          ? "계정에 저장하지 못했습니다. 로컬에는 저장하지 않았습니다. 다시 시도해 주세요."
          : "브라우저에 저장하지 못했습니다. 저장 공간과 설정을 확인해 주세요.",
      );
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  };
  const saveEvent = (event: Omit<Event, "id">, id?: string) =>
    write(async () => {
      if (
        !event.title.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
        dateKey(new Date(`${event.date}T12:00:00`)) !== event.date
      )
        throw Error("Invalid event");
      const fields = {
        ...event,
        title: event.title.trim(),
        time: event.time || null,
        place: event.place || null,
        memo: event.memo || null,
      };
      if (cloud) {
        const query = id
          ? supabase
              .from("calendar_events")
              .update(fields)
              .eq("id", id)
              .eq("user_id", userId!)
          : supabase
              .from("calendar_events")
              .insert({ ...fields, user_id: userId! });
        const result = await query.select("id");
        if (result.error || !result.data?.length)
          throw result.error || Error("No saved record");
      } else
        saveLocalEvents([
          ...readLocalEvents().filter((item) => item.id !== id),
          { ...fields, id: id || crypto.randomUUID() },
        ]);
    });
  const deleteEvent = (id: string) =>
    write(async () => {
      if (cloud) {
        const result = await supabase
          .from("calendar_events")
          .delete()
          .eq("id", id)
          .eq("user_id", userId!)
          .select("id");
        if (result.error || !result.data?.length)
          throw result.error || Error("No deleted record");
      } else
        saveLocalEvents(readLocalEvents().filter((event) => event.id !== id));
    });
  const changeChecklist = (id: string | null, fields?: Partial<Checklist>) =>
    write(async () => {
      if (cloud) {
        const base = supabase.from("calendar_checklists");
        const query = !id
          ? base.insert({ ...fields, user_id: userId! })
          : fields
            ? base.update(fields).eq("id", id).eq("user_id", userId!)
            : base.delete().eq("id", id).eq("user_id", userId!);
        const result = await query.select("id");
        if (result.error || !result.data?.length)
          throw result.error || Error("No saved checklist");
      } else {
        const rows = readChecklists();
        const next = !id
          ? [
              ...rows,
              {
                id: crypto.randomUUID(),
                text: fields?.text || "",
                completed: false,
              },
            ]
          : fields
            ? rows.map((row) => (row.id === id ? { ...row, ...fields } : row))
            : rows.filter((row) => row.id !== id);
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      }
    });
  return {
    events,
    checklists,
    ready,
    error,
    saving,
    reload,
    saveEvent,
    deleteEvent,
    changeChecklist,
  };
}

function FullCalendar({ identity, beforeChecklist }: { identity: Identity; beforeChecklist?: ReactNode }) {
  const store = useCalendarData(identity);
  const { events, checklists } = store;
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEventConfirmOpen, setDeleteEventConfirmOpen] = useState(false);

  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(
    null,
  );
  const [editingChecklistText, setEditingChecklistText] = useState("");

  // 모바일 날짜 일정 팝업
  const [showMobileDayPopup, setShowMobileDayPopup] = useState(false);
  const [mobileDayDate, setMobileDayDate] = useState("");

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
  const [checklistInputOpen, setChecklistInputOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayValue = formatDate(today);

  // 공휴일 데이터 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = calendarDate.getFullYear();
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`,
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
          Chuseok: "추석",
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

  const report = (failure: unknown) =>
    alert(failure instanceof Error ? failure.message : "저장하지 못했습니다.");
  const handleAddEvent = async () => {
    if (!formData.title.trim() || !formData.date) {
      alert("제목과 날짜를 입력해주세요");
      return;
    }
    try {
      await store.saveEvent(formData);
      resetForm();
      setShowEventModal(false);
    } catch (failure) {
      report(failure);
    }
  };
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      await store.saveEvent(formData, editingEvent.id);
      resetForm();
      setShowEventModal(false);
    } catch (failure) {
      report(failure);
    }
  };
  const handleDeleteEvent = async (id: string) => {
    try {
      await store.deleteEvent(id);
    } catch (failure) {
      report(failure);
    }
  };
  const handleAddChecklist = async () => {
    if (!checklistText.trim()) return;
    if (checklists.length >= 10) {
      alert("체크리스트는 최대 10개까지만 추가할 수 있습니다");
      return;
    }
    try {
      await store.changeChecklist(null, {
        text: checklistText.trim(),
        completed: false,
      });
      setChecklistText("");
    } catch (failure) {
      report(failure);
    }
  };
  const handleToggleChecklist = async (id: string, completed: boolean) => {
    try {
      await store.changeChecklist(id, { completed: !completed });
    } catch (failure) {
      report(failure);
    }
  };
  const handleDeleteChecklist = async (id: string) => {
    try {
      await store.changeChecklist(id);
    } catch (failure) {
      report(failure);
    }
  };
  const handleUpdateChecklist = async (id: string, text: string) => {
    if (!text.trim()) return;
    try {
      await store.changeChecklist(id, { text: text.trim() });
      setEditingChecklistId(null);
    } catch (failure) {
      report(failure);
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
      `${e.title} ${e.content}`
        .toLowerCase()
        .includes(searchText.toLowerCase()),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!store.ready)
    return (
      <div className="p-6 text-center" role="status">
        {store.error || "캘린더를 불러오는 중입니다."}
        {store.error && (
          <button onClick={() => void store.reload()}>다시 시도</button>
        )}
      </div>
    );
  return (
    <div data-calendar-layout="full">
      {/* 메인 콘텐츠 */}
      <div className="w-full pt-0 pb-6 mt-2">
        {/* PC: 2열 레이아웃 (왼쪽 1fr: 체크리스트+일정, 오른쪽 3fr: 달력) */}
        <div
          className="flex flex-col sm:grid sm:gap-3"
          style={{ gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 4fr)" }}
        >
          {/* 달력 — PC: 오른쪽(order-2) */}
          <div className="personal-grid order-1 sm:order-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6 sm:mb-0">
            {/* 월 네비게이션 */}
            <div className="relative flex items-center justify-center mb-4 min-h-9">
              <div className="flex items-center gap-3 sm:gap-4">
                <button aria-label="이전 달" onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"><ChevronLeft className="w-4 h-4" /></button>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 whitespace-nowrap">{currentYear}년 {currentMonth + 1}월</h2>
                <button aria-label="다음 달" onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-center rounded-t-xl overflow-hidden border border-gray-100">
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
                  className="text-sm font-bold py-2 border-r border-gray-100 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 overflow-hidden rounded-b-xl border-l border-gray-100">
              {calendarDays.map((dateItem, index) => {
                const displayDay = dateItem.day;

                const dateYear =
                  dateItem.type === "prev"
                    ? currentMonth === 0
                      ? currentYear - 1
                      : currentYear
                    : dateItem.type === "next"
                      ? currentMonth === 11
                        ? currentYear + 1
                        : currentYear
                      : currentYear;

                const dateMonth =
                  dateItem.type === "prev"
                    ? currentMonth === 0
                      ? 11
                      : currentMonth - 1
                    : dateItem.type === "next"
                      ? currentMonth === 11
                        ? 0
                        : currentMonth + 1
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
                    ? isOtherMonth
                      ? "#fecaca"
                      : "#ef4444"
                    : realDay === 6
                      ? isOtherMonth
                        ? "#bfdbfe"
                        : "#3b82f6"
                      : isOtherMonth
                        ? "#d1d5db"
                        : "#374151";

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
                    min-w-0 aspect-square sm:aspect-auto sm:min-h-[120px]
                    border-r border-b border-gray-100
                    ${isToday ? "bg-blue-50" : selectedDate === fullDate ? "bg-gray-50" : holiday ? "bg-red-50/60" : "bg-white"}
                    hover:bg-gray-50 transition-colors relative group
                  `}
                  >
                    {/* 모바일: 날짜 숫자만 중앙 표시 */}
                    <div className="sm:hidden flex flex-col items-center justify-center h-full">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-blue-600 text-white" : ""}`}
                        style={{ color: isToday ? "#ffffff" : numberColor }}
                      >
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
                    <div className="hidden sm:block p-2 h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-0.5">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-blue-600 text-white" : ""}`}
                            style={{ color: isToday ? "#ffffff" : numberColor }}
                          >
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
                        {dayEvents.slice(0, 3).map((event) => (
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
                                ? "bg-green-50 text-black hover:bg-green-100"
                                : event.color === "red"
                                  ? "bg-red-50 text-black hover:bg-red-100"
                                  : event.color === "yellow"
                                    ? "bg-yellow-50 text-black hover:bg-yellow-100"
                                    : event.color === "white"
                                      ? "bg-white text-black hover:bg-gray-50 border border-gray-200"
                                      : "bg-blue-50 text-black hover:bg-blue-100"
                            }
                          `}
                          >
                            <span className="mr-1">{event.icon}</span>
                            {event.time && <span className="mr-1">{formatCalendarTime(event.time)}</span>}
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[11px] text-gray-400">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 왼쪽 컬럼: 체크리스트(위) + 일정목록(아래) — PC: order-1, 모바일: 아래 */}
          <div className="order-2 sm:order-1 flex flex-col gap-3">
            {beforeChecklist}
            {/* 체크리스트 — 모바일: order-2(아래), PC: order-1(왼쪽) */}
            <div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-bold text-gray-900">체크리스트</h2>
                <button type="button" aria-label="체크리스트 추가" title="체크리스트 추가" disabled={checklists.length >= 10} onClick={() => { if (checklistInputOpen && checklistText.trim()) void handleAddChecklist(); else setChecklistInputOpen(open => !open); }} className="h-7 w-7 shrink-0 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {checklists.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-2 py-1 hover:bg-gray-50 rounded transition"
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
                        onChange={(e) =>
                          setEditingChecklistText(e.target.value)
                        }
                        onBlur={() =>
                          handleUpdateChecklist(item.id, editingChecklistText)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter")
                            handleUpdateChecklist(
                              item.id,
                              editingChecklistText,
                            );
                        }}
                        autoFocus
                        className="flex-1 min-w-0 pl-3 pr-3 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingChecklistId(item.id);
                          setEditingChecklistText(item.text);
                        }}
                        className={`flex-1 min-w-0 break-words text-sm cursor-pointer ${
                          item.completed
                            ? "line-through text-gray-400"
                            : "text-gray-700"
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

              {checklistInputOpen && checklists.length < 10 && (
                <input
                  autoFocus type="text" value={checklistText}
                  onChange={e => setChecklistText(e.target.value)}
                  placeholder="체크리스트 입력 후 Enter"
                  className="w-full min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400"
                  onKeyDown={e => { if (e.key === "Enter") void handleAddChecklist(); if (e.key === "Escape") setChecklistInputOpen(false); }}
                />
              )}

              {checklists.length >= 10 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  최대 10개까지만 추가 가능
                </div>
              )}
            </div>

            {/* 일정 목록 — 모바일: order-1(위), PC: order-2(오른쪽) */}
            <div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <h2 className="text-base font-bold text-gray-900 mb-3">일정</h2>

              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="일정 검색"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">예정된 일정이 없습니다</p>
                ) : Array.from(new Set(filteredEvents.map(event => event.date))).map(date => (
                  <section key={date}>
                    <h3 className="text-[13px] font-bold text-gray-900 mb-2">{new Date(date + "T12:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</h3>
                    <div className="space-y-1">
                      {filteredEvents.filter(event => event.date === date).map(event => (
                        <button key={event.id} type="button" onClick={() => { setEditingEvent(event); setFormData(event); setShowEventModal(true); }} className="flex w-full min-w-0 items-center gap-2 py-1 text-left rounded hover:bg-gray-50 transition cursor-pointer" title={event.title}>
                          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-sm" style={{ background: event.color === "green" ? "#00a389" : event.color === "red" ? "#ff4589" : event.color === "yellow" ? "#eab308" : "#2563eb" }} />
                          <span className="shrink-0 text-xs text-gray-500">{formatCalendarTime(event.time) || "종일"}</span>
                          <span className="flex-1 min-w-0 truncate text-sm text-black">{event.title}</span>
                          <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
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
            data-popup-frame="true"
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
                    <p className="text-xs text-red-400 font-bold mt-0.5">
                      {holiday.name}
                    </p>
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
                  data-popup-close="true"
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
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {event.title}
                        </p>
                        {event.content && (
                          <p className="text-xs text-gray-500 truncate">
                            {event.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-2">
                      {event.time && (
                        <span className="text-xs text-gray-400">
                          {formatCalendarTime(event.time)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showEventModal && (
        <CalendarEventModal
          saving={store.saving}
          error={store.error}
          formData={formData}
          setFormData={setFormData}
          editingEvent={Boolean(editingEvent)}
          onClose={() => {
            setShowEventModal(false);
            resetForm();
          }}
          onSave={() => {
            if (editingEvent) void handleUpdateEvent();
            else void handleAddEvent();
          }}
          onDelete={() => {
            if (editingEvent) {
              setDeleteEventId(editingEvent.id);
              setDeleteEventConfirmOpen(true);
            }
          }}
        />
      )}

      {/* 삭제 확인 팝업 */}
      {deleteEventConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[4000] bg-black/40 flex items-center justify-center p-5">
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
        </div>, document.body
      )}
    </div>
  );
}

function CompactCalendar({ identity }: { identity: Identity }) {
  const { userId, approved } = identity;
  const store = useCalendarData(identity);
  const { events, ready, error } = store;
  const cloud = approved;
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => koreaDate());
  const [listDate, setListDate] = useState<string | null>(null);
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null);
  const [draft, setDraft] = useState<Event | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!draft) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setDraft(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [draft, saving]);
  const visibleEvents = ready ? events : [];
  const save = async (remove = false) => {
    if (!draft || saving || !ready) return;
    if (!remove && (!draft.title.trim() || !draft.date)) {
      setFormError("일정 제목과 날짜를 입력해 주세요.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const { id, ...fields } = draft;
      if (remove) await store.deleteEvent(id);
      else await store.saveEvent(fields, id || undefined);
      setDraft(null);
      setConfirmDelete(false);
      if (!remove) {
        setSelected(draft.date);
        setListDate(draft.date);
        const date = new Date(draft.date + "T12:00:00");
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } catch (failure) {
      setFormError(
        failure instanceof Error ? failure.message : "저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };
  const offset = month.getDay();
  // Reserve six weeks consistently so the schedule list never changes the card height.
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1),
  );
  const dayEvents = visibleEvents
    .filter((e) => e.date === selected)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const open = (event: Event) => {
    setDraft({ ...event });
    setFormError("");
    setConfirmDelete(false);
  };
  const closeDraft = useCallback(() => {
    if (!saving) setDraft(null);
  }, [saving]);
  const closeReminder = useCallback(() => setReminderEvent(null), []);
  const today = koreaDate();
  return (
    <article
      className={`${styles.card} ${styles.calendarCard}`}
      aria-label="내 일정 캘린더"
      data-calendar-card
    >
      {listDate ? (
        <>
          <div className={styles.heading}>
            <button
              className={styles.iconButton}
              aria-label="달력으로 돌아가기"
              onClick={() => setListDate(null)}
            >
              <ArrowLeft />
            </button>
            <h2>
              {Number(listDate.slice(5, 7))}월 {Number(listDate.slice(8))}일
            </h2>
            <button
              className={styles.iconButton}
              aria-label="일정 추가"
              title="일정 추가"
              disabled={!ready || saving}
              onClick={() => open(emptyEvent(listDate))}
            >
              <Plus />
            </button>
          </div>
          <div className={`${styles.scheduleList} ${styles.scroll}`}>
            {dayEvents.length ? (
              dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={styles.event}
                  onDoubleClick={(e) => {
                    if (!saving && !(e.target as HTMLElement).closest("button"))
                      open(event);
                  }}
                >
                  <div className={styles.eventSummary}>
                    <span>{event.icon || "📅"}</span>
                    <span className={styles.eventTitle} title={event.title}>
                      {event.title}
                    </span>
                    <span className={styles.eventTime}>
                      {formatCalendarTime(event.time) || "종일"}
                    </span>
                    {event.place && (
                      <span className={styles.eventPlace} title={event.place}>
                        {event.place}
                      </span>
                    )}
                  </div>
                  <div className={styles.eventActions}>
                    <button
                      onClick={() => setReminderEvent(event)}
                      disabled={saving}
                      aria-label={`${event.title} 알림`}
                      title="알림 설정"
                    >
                      <Bell />
                    </button>
                    <button
                      onClick={() => open(event)}
                      disabled={saving}
                      aria-label={`${event.title} 수정`}
                      title="수정"
                    >
                      <Pencil />
                    </button>
                    <button
                      onClick={() => {
                        open(event);
                        setConfirmDelete(true);
                      }}
                      disabled={saving}
                      aria-label={`${event.title} 삭제`}
                      title="삭제"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.empty}>일정이 없습니다.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.heading}>
            <h2>
              <Link
                className={styles.calendarPageLink}
                href="/calendar"
                aria-label="캘린더 페이지로 이동"
                title="캘린더 페이지로 이동"
              >
                <CalendarDays />
              </Link>
              {month.getFullYear()}년 {month.getMonth() + 1}월
            </h2>
            <div className={styles.actions}>
              <button
                className={styles.iconButton}
                aria-label="이전 달"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft />
              </button>
              <button
                className={styles.smallButton}
                onClick={() => {
                  setMonth(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1,
                    ),
                  );
                  setSelected(today);
                }}
              >
                오늘
              </button>
              <button
                className={styles.iconButton}
                aria-label="다음 달"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className={styles.calendarBody}>
            <div className={styles.week}>
              {["일", "월", "화", "수", "목", "금", "토"].map((name, i) => (
                <span
                  key={name}
                  className={
                    i === 0 ? styles.sunday : i === 6 ? styles.saturday : ""
                  }
                >
                  {name}
                </span>
              ))}
            </div>
            <div className={styles.days}>
              {days.map((date, i) => {
                const key = dateKey(date);
                const entries = visibleEvents.filter((e) => e.date === key);
                return (
                  <button
                    key={key}
                    disabled={!ready}
                    aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${entries.length ? `, 일정 ${entries.length}개` : ""}`}
                    aria-pressed={selected === key}
                    className={[
                      styles.day,
                      i % 7 === 0
                        ? styles.sunday
                        : i % 7 === 6
                          ? styles.saturday
                          : "",
                      date.getMonth() !== month.getMonth()
                        ? styles.outside
                        : "",
                      selected === key ? styles.selected : "",
                      today === key ? styles.today : "",
                    ].join(" ")}
                    onClick={() => {
                      setSelected(key);
                      setListDate(key);
                    }}
                  >
                    {date.getDate()}
                    <span className={styles.dots}>
                      {Array.from(new Set(entries.map((e) => e.color)))
                        .slice(0, 3)
                        .map((color) => (
                          <span
                            key={color}
                            className={styles.dot}
                            style={{ background: colors[color] || colors.blue }}
                          />
                        ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <div className={styles.status} role="status">
              {error}{" "}
              <button onClick={() => void store.reload()}>다시 시도</button>
            </div>
          )}
        </>
      )}
      {reminderEvent && ready && (
        <ReminderSettings
          event={reminderEvent}
          userId={cloud ? userId : null}
          onClose={closeReminder}
        />
      )}
      {draft && ready && !confirmDelete && (
        <CalendarEventModal
          editingEvent={Boolean(draft.id)}
          formData={{
            title: draft.title,
            content: draft.content || "",
            date: draft.date,
            time: draft.time || "",
            place: draft.place || "",
            memo: draft.memo || "",
            icon: draft.icon,
            color: draft.color,
          }}
          setFormData={(value) => setDraft({ ...draft, ...value })}
          onClose={closeDraft}
          onSave={() => void save()}
          onDelete={() => setConfirmDelete(true)}
          saving={saving}
          error={formError}
        />
      )}
      {draft && ready && confirmDelete && (
        <DashboardDialog title="일정 삭제" onClose={closeDraft}>
          <p>이 일정을 삭제할까요?</p>
          {formError && (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          )}
          <div className={styles.formActions}>
            <button
              className={styles.secondary}
              disabled={saving}
              onClick={closeDraft}
            >
              취소
            </button>
            <button
              className={styles.primary}
              disabled={saving}
              onClick={() => void save(true)}
            >
              삭제
            </button>
          </div>
        </DashboardDialog>
      )}
    </article>
  );
}
