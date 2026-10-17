"use client";
import {useCrmCalendar} from "@/app/notion-crm/CrmCalendarContext";
import {eventCalendarFields} from "@/lib/notion-crm/account-calendar";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Bell,
  BellOff,
  Pencil,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import CalendarEventModal, { type CalendarEventForm } from "./CalendarEventModal";
import CalendarEventDetails, { type CalendarDetails } from "./CalendarEventDetails";
import layoutStyles from "./CalendarLayout.module.css";
import { formatCalendarTime, compareCalendarTimes } from "@/lib/calendar-time";
import useCalendarExtras from "./useCalendarExtras";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";
import useCalendarReminderToggle from "./useCalendarReminderToggle";
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
  category?: string;
  customerId?: string;
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
  blue: "#195DFF",
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
  category: "개인",
});
const normalizeEvent = (event: CalendarEvent): Event => ({
  ...event,
  content: event.content || "",
  time: event.time || "",
  place: event.place || "",
  memo: event.memo || "",
  category: event.category || "개인",
});
function readChecklists(): Checklist[] {
  const data = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]");
  if (!Array.isArray(data)) throw Error("Invalid checklist");
  return data;
}

export default function Calendar({
  mode = "full",
  active = true,
  identity: provided,
  beforeChecklist,
}: {
  mode?: "compact" | "full" | "sticker";
  active?: boolean;
  beforeChecklist?: ReactNode;
  identity?: Identity;
}) {
  const { authUser, authStatus, authLoading } = useAuth();
  const account: Identity = provided || {
    userId: authUser?.id || null,
    approved: authStatus === "approved",
    loading: authLoading,
    error: !authLoading && authUser && !authStatus ? "회원 상태를 확인하지 못했습니다. 새로고침해 주세요." : undefined,
  };
  const owner = account.loading
    ? "loading"
    : account.error
      ? "error"
      : account.approved
        ? `cloud:${account.userId}`
        : "local";
  if (account.loading)
    return (
      <div data-ui-card="true"
        className={
          mode === "compact"
            ? `${styles.card} ${styles.calendarCard} flex items-center justify-center text-sm text-slate-400`
            : "flex min-h-[calc(100dvh-210px)] items-center justify-center p-6 text-center text-sm text-slate-400"
        }
      >

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
    <FullCalendar sticker={mode==="sticker"} active={active} key={owner} identity={account} beforeChecklist={beforeChecklist} />
  );
}

function useCalendarData(identity: Identity) {
  const crm=useCrmCalendar();
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
        !!event.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.time) ||
        dateKey(new Date(`${event.date}T12:00:00`)) !== event.date
      )
        throw Error("Invalid event");
      if(crm){const row=id?.startsWith('crm:')?crm.data.events.find(item=>'crm:'+item.id===id):id?crm.accountEvents.find(item=>item.id==='calendar:'+id):undefined;if(id&&!row)throw Error('일정을 찾을 수 없습니다.');await crm.saveEvent(row,{'제목':event.title,'일정':event.date+(event.time?'T'+event.time+':00+09:00':''),'장소':event.place,'상담내용':event.content,'메모':event.memo,'분류':event.category||'개인','고객':event.customerId?[event.customerId]:[]});return;}
      const {customerId:_customerId,...nativeFields}=event;
      const fields = {
        ...nativeFields,
        title: event.title.trim(),
        time: event.time || null,
        place: event.place || null,
        memo: event.memo || null,
        category: event.category || "개인",
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
      if(crm){const row=id.startsWith('crm:')?crm.data.events.find(item=>'crm:'+item.id===id):crm.accountEvents.find(item=>item.id==='calendar:'+id);if(!row)throw Error('일정을 찾을 수 없습니다.');await crm.deleteEvent(row);return;}
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
    events:[...events.map(event=>{const linked=crm?.accountEvents.find(row=>row.id==='calendar:'+event.id);return {...event,category:['개인','상담','기타'].includes(event.category||'')?event.category:'기타',customerId:linked&&Array.isArray(linked.values['고객'])?linked.values['고객'][0]||'':''};}),...(crm?.data.events||[]).flatMap(row=>{try{const fields=eventCalendarFields(row.values);return [{...fields,id:'crm:'+row.id,time:fields.time||'',icon:'💬',color:'#195DFF',customerId:Array.isArray(row.values['고객'])?row.values['고객'][0]||'':''}];}catch{return [];}})],
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

function FullCalendar({ identity, beforeChecklist, active, sticker=false }: { identity: Identity; beforeChecklist?: ReactNode; active: boolean;sticker?:boolean }) {
  const store = useCalendarData(identity);
  const { events, checklists } = store;
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewingEvent,setViewingEvent]=useState<CalendarDetails|null>(null);
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
  const [selectedDate, setSelectedDate] = useState(koreaDate());
  const extras = useCalendarExtras(identity, calendarDate, active);
  const [formData, setFormData] = useState<CalendarEventForm>({
    title: "",
    content: "",
    date: "",
    time: "",
    place: "",
    memo: "",
    icon: "📅",
    color: "blue",
    category: "개인",
  });
  const previewEventColor=(event:Event)=>showEventModal && editingEvent?.id===event.id ? formData.color : event.color;
  const [checklistText, setChecklistText] = useState("");
  const [checklistInputOpen,setChecklistInputOpen]=useState(false);
  const checklistInput=useRef<HTMLInputElement>(null);
  const checklistAdding = useRef(false);
  const [checklistSaving, setChecklistSaving] = useState(false);

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
    return events.filter((e) => e.date === dateStr).sort((a, b) => compareCalendarTimes(a.time, b.time));
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
    if (!checklistText.trim() || checklistAdding.current) return;
    if (checklists.length >= 5) {
      setChecklistInputOpen(false);
      return;
    }
    const submitted = checklistText.trim();
    checklistAdding.current = true; setChecklistSaving(true);
    try {
      await store.changeChecklist(null, {
        text: submitted,
        completed: false,
      });
      setChecklistText(current => current.trim() === submitted ? "" : current);
      setChecklistInputOpen(false);
    } catch (failure) {
      report(failure);
    } finally { checklistAdding.current = false; setChecklistSaving(false); }
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
    category: "개인",
    });
    setEditingEvent(null);
  };

  const openEventModal = (dateStr: string) => {
    setFormData({ ...formData, date: dateStr });
    setShowEventModal(true);
  };

  // 필터링된 일정 목록
  const filteredEvents = events
    .filter((e) => e.date === selectedDate)
    .filter((e) =>
      `${e.title} ${e.content} ${e.memo} ${e.place}`
        .toLowerCase()
        .includes(searchText.toLowerCase()),
    )
    .sort((a, b) => compareCalendarTimes(a.time, b.time));

  const renderSchedules = (date: string, normal: Event[]) => {
    const remote = extras.sheetEvents.filter(event => event.date === date && `${event.category} ${event.name} ${event.birth} ${event.content}`.toLowerCase().includes(searchText.toLowerCase()));
    const rows = [...normal.map(event => ({ key: `event:${event.id}`, title: event.title, detail: [event.content, event.memo].filter(Boolean).join(" · "), icon: event.icon, event, category:event.category||"개인" })), ...remote.map(event => ({ key: event.id, title: [event.category,event.name,event.birth.replace(/\D/g,"").slice(0,6)].filter(Boolean).join("    "), detail: [event.name, event.birth.replace(/\D/g,"").slice(0,6), event.memoContent??event.content].filter(Boolean).join(" · "), icon: event.icon, event: null, category:event.category }))].sort((a, b) => compareCalendarTimes(a.event?.time, b.event?.time));
    return <>

      {rows.map(row => <div key={row.key} className={`${layoutStyles.scheduleRow} flex items-center gap-2 rounded-xl border p-3 ${extras.completed[row.key] ? "bg-gray-50 border-gray-100 text-gray-400" : "border-gray-200 text-gray-900"}`}>
        <input type="checkbox" aria-label={`${row.title} 확인`} checked={!!extras.completed[row.key]} disabled={!extras.completionReady || extras.completionBusy} onChange={() => void extras.toggleCompleted(row.key)} className="h-4 w-4 shrink-0 accent-blue-600" />
        <button type="button" onClick={() => {setShowMobileDayPopup(false);setViewingEvent(row.event||{title:row.title,date,icon:row.icon,memo:row.detail,category:row.category});}} className={`min-w-0 flex-1 text-left ${extras.completed[row.key] ? "line-through" : ""}`}>
          <span className={layoutStyles.scheduleLine}><span className={layoutStyles.scheduleTitle}>{row.icon} {row.title}</span>{row.event?.time && <span>{formatCalendarTime(row.event.time)}</span>}</span>
        </button>

      </div>)}
    </>;
  };

  if (!store.ready)
    return (
      <div className={(sticker?"min-h-40":"min-h-[calc(100dvh-210px)]")+" flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-400"} role="status">
        {store.error || null}
        {store.error && (
          <button data-action-height="44" onClick={() => void store.reload()}>다시 시도</button>
        )}
      </div>
    );
  return (
    <div data-calendar-layout={sticker?"sticker":"full"} className={sticker?layoutStyles.stickerView:undefined}>
      {/* 메인 콘텐츠 */}
      <div className="w-full pt-0 pb-6 mt-2">
        {/* PC: 2열 레이아웃 (왼쪽 1fr: 체크리스트+일정, 오른쪽 3fr: 달력) */}
        <div
          className={layoutStyles.layout}
        >
          {/* 달력 — PC: 오른쪽(order-2) */}
          <div className={`${layoutStyles.calendar} personal-grid bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5`}>
            {/* 월 네비게이션 */}
            <div data-calendar-month-row="true" className="relative flex items-center justify-center mb-4 min-h-9">
              <div data-calendar-month-navigation="true" className="flex items-center gap-3 sm:gap-4">
                <button data-icon-only={sticker?undefined:"true"} data-prev-next="true" aria-label="이전 달" onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"><ChevronLeft data-arrow-size="20" className="w-4 h-4" /></button>
                <h2 data-calendar-month-title="true" className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">{currentYear}년 {currentMonth + 1}월</h2>
                <button data-icon-only={sticker?undefined:"true"} data-prev-next="true" aria-label="다음 달" onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"><ChevronRight data-arrow-size="20" className="w-4 h-4" /></button>
              </div>
            </div>

            {(extras.sheetError || extras.needsConnection || extras.completionError) && <div role="status" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{extras.completionError || extras.sheetError}</span>
              {extras.needsConnection ? <button data-action-height="44" onClick={() => void extras.connect()} disabled={extras.connecting} className="rounded-lg bg-blue-50 px-3 py-2 text-blue-600">{extras.connecting ? "연결중" : "일정 연결"}</button> : (extras.sheetError || extras.completionError) && <button data-action-height="44" onClick={extras.reloadSheet} className="text-blue-600">다시 시도</button>}
            </div>}
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
                          ? "#195DFF"
                          : "#374151",
                  }}
                  data-calendar-weekday="true" className="text-[15px] font-bold py-2 border-r border-gray-100 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div data-calendar-date-grid="true" className="grid grid-cols-7 overflow-hidden rounded-b-xl border-l border-gray-100">
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
                const sheetIcons = [...new Set(extras.sheetEvents.filter(event => event.date === fullDate).map(event => event.icon))];
                const holiday = getHolidayForDate(fullDate);
                const isToday = fullDate === todayValue;
                const isOtherMonth = dateItem.type !== "current";
                const realDay = new Date(fullDate).getDay();
                const mobileDotColors = [...new Set([
                  ...extras.sheetEvents.filter(event => event.date === fullDate).map(event =>
                    event.kind === "birthday" ? "#EC4899" :
                    event.kind === "renewal" ? "#F97316" :
                    event.kind === "payment" ? "#9333EA" : "#16A34A"
                  ),
                  ...(dayEvents.length ? ["#195DFF"] : []),
                ])];

                const numberColor =
                  holiday || realDay === 0
                    ? isOtherMonth
                      ? "#fecaca"
                      : "#ef4444"
                    : realDay === 6
                      ? isOtherMonth
                        ? "#bfdbfe"
                        : "#195DFF"
                      : isOtherMonth
                        ? "#d1d5db"
                        : "#374151";

                return (
                  <div
                    data-calendar-day-cell="true" data-calendar-today={isToday?"true":undefined} key={`${dateItem.type}-${displayDay}-${index}`}
                    onClick={() => {
                      setSelectedDate(fullDate);
                      // 모바일: 선택한 날짜의 일정을 달력 안에서 펼칩니다.
                      if (sticker || window.innerWidth < 768) {
                        setMobileDayDate(fullDate);
                        setShowMobileDayPopup(previous => mobileDayDate===fullDate ? !previous : true);
                      }
                    }}
                    className={`
                    min-w-0 min-h-0 aspect-square overflow-hidden
                    border-r border-b border-gray-100
                    ${!isToday && selectedDate === fullDate ? "bg-blue-50 hover:bg-blue-50" : "bg-white hover:bg-gray-50"}
                    transition-colors relative group
                  `}
                  >
                    {/* 모바일: 날짜 숫자만 중앙 표시 */}
                    <div className={(sticker?"":"sm:hidden ")+"relative flex items-center justify-center h-full"}>
                      <span
                        data-calendar-date="true" className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday&&!sticker ? holiday ? "ring-2 ring-blue-500" : "bg-blue-600 text-white" : ""}`}
                        style={{ color: holiday ? isOtherMonth ? "#fecaca" : "#ef4444" : isToday&&!sticker ? "#ffffff" : numberColor }}
                      >
                        {displayDay}
                      </span>
                      {mobileDotColors.length > 0 && (
                        <div aria-label="일정 표시" className="absolute left-1/2 bottom-[3px] -translate-x-1/2 flex gap-0.5">
                          {mobileDotColors.map(color => <span key={color} className="w-1 h-1 rounded-full" style={{backgroundColor:color}} />)}
                        </div>
                      )}
                    </div>

                    {/* PC: 기존 레이아웃 */}
                    <div className={`${sticker?'hidden':'hidden sm:flex'} ${layoutStyles.dayContent}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-0.5">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-semibold ${isToday&&!sticker ? holiday ? "ring-2 ring-blue-500" : "bg-blue-600 text-white" : ""}`}
                            style={{ color: holiday ? isOtherMonth ? "#fecaca" : "#ef4444" : isToday&&!sticker ? "#ffffff" : numberColor }}
                          >
                            {displayDay}
                          </span>
                          {holiday && (
                            <span className="text-[12px] text-gray-400 truncate max-w-24">
                              {holiday.name}
                            </span>
                          )}
                        </div>
                        <button data-icon-only="true"
                          type="button"
                          aria-label={`${fullDate} 일정 추가`}
                          title="일정 추가"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(fullDate);
                          }}
                          className={layoutStyles.dayAdd}
                        >
                          <Plus size={17} strokeWidth={1.25} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEvent(event);
                            }}
                            className={`
                            ${layoutStyles.dayEvent}
                            ${
                              previewEventColor(event) === "green"
                                ? "bg-green-50 text-black hover:bg-green-100"
                                : previewEventColor(event) === "red"
                                  ? "bg-red-50 text-black hover:bg-red-100"
                                  : previewEventColor(event) === "yellow"
                                    ? "bg-yellow-50 text-black hover:bg-yellow-100"
                                    : previewEventColor(event) === "white"
                                      ? "bg-white text-black hover:bg-gray-50 border border-gray-200"
                                      : "bg-blue-50 text-black hover:bg-blue-100"
                            }
                          `}
                          >
                            <span aria-hidden="true">{event.icon}</span><span>{Array.from(event.title).slice(0, 6).join("")}</span>
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[11px] text-gray-400">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                      {sheetIcons.length > 0 && <div className={layoutStyles.customerIcons} aria-label="고객 일정">{sheetIcons.join(" ")}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          {showMobileDayPopup && <section className={sticker?"mt-2":"mt-2 md:hidden"} aria-label="선택한 날짜 일정">
              <div data-calendar-selected-heading="true" className="flex items-center justify-between gap-2 mb-1"><h3 data-calendar-selected-date="true" className="pl-3 text-base font-bold">{mobileDayDate}</h3><button type="button" data-icon-only="true" aria-label="일정 추가" title="일정 추가" className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-blue-600" onClick={()=>openEventModal(mobileDayDate)}><Plus size={20}/></button></div>
              <div data-calendar-selected-list="true" className="space-y-2">{renderSchedules(mobileDayDate,getEventsForDate(mobileDayDate))}</div>
            </section>}
          </div>

          {/* 왼쪽 컬럼: 체크리스트(위) + 일정목록(아래) — PC: order-1, 모바일: 아래 */}
          <div className={`${layoutStyles.sidebar} flex flex-col gap-3`}>
            {beforeChecklist}
            {/* 체크리스트 — 모바일: order-2(아래), PC: order-1(왼쪽) */}
            <div className="personal-grid bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 data-personal-card-title="true" className="text-base font-bold text-gray-900">체크리스트</h2>

              </div>

              <div className="space-y-2 mb-4">
                {checklists.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 py-1 hover:bg-gray-50 rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() =>
                        handleToggleChecklist(item.id, item.completed)
                      }
                      className="w-4 h-4 shrink-0 cursor-pointer"
                    />
                    {editingChecklistId === item.id ? (
                      <ClearableSearchInput onClear={() => setEditingChecklistText("")} data-ui-field="true"
                        type="text"
                        value={editingChecklistText}
                        onChange={(e) =>
                          setEditingChecklistText(e.target.value)
                        }
                        onBlur={() =>
                          handleUpdateChecklist(item.id, editingChecklistText)
                        }
                        onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.blur(); } }}
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

                    <button data-icon-only="true"
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {checklists.length < 5 && (
                <div className="flex items-center gap-2">
                  {checklistInputOpen&&<ClearableSearchInput onClear={() => setChecklistText("")} ref={checklistInput} autoFocus data-ui-field="true" type="text" value={checklistText}
                    aria-label="새 체크리스트" placeholder="체크리스트 입력" disabled={checklistSaving}
                    onChange={e => setChecklistText(e.target.value)}
                    onBlur={() => {if(checklistText.trim())void handleAddChecklist();else setChecklistInputOpen(false);}}
                    onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void handleAddChecklist(); } }}
                    className="flex-1 min-w-0 h-11 px-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400" />}
                  <button data-icon-only="true" data-action-height="44" type="button" aria-label="체크리스트 추가" aria-expanded={checklistInputOpen} disabled={checklistSaving}
                    onMouseDown={event=>event.preventDefault()}
                    onClick={() => {if(!checklistInputOpen)setChecklistInputOpen(true);else if(checklistText.trim())void handleAddChecklist();else checklistInput.current?.focus();}}
                    className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-0 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer disabled:opacity-60 disabled:cursor-default"><Plus className="w-5 h-5" /></button>
                </div>
              )}

            </div>

            {/* 선택 날짜 일정은 체크리스트 아래에 나열한다. */}
            <div className={`${layoutStyles.schedules} personal-grid bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-3 mb-3"><h2 data-personal-card-title="true" className="text-base font-bold text-gray-900">일정목록</h2><time className="text-sm text-gray-500">{selectedDate}</time></div>

              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <ClearableSearchInput onClear={() => setSearchText("")} data-ui-field="true" data-page-search-input="true"
                  type="text"
                  placeholder="일정 검색"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 py-0 text-[14px] border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />
              </div>

              <div className="space-y-4">
                {renderSchedules(selectedDate, filteredEvents)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewingEvent&&<CalendarEventDetails event={viewingEvent} onClose={()=>setViewingEvent(null)} onEdit={viewingEvent.id?()=>{const event=events.find(event=>event.id===viewingEvent.id);if(!event)return;setViewingEvent(null);setEditingEvent(event);setFormData(event);setShowEventModal(true);}:undefined} onDelete={viewingEvent.id?()=>{setDeleteEventId(viewingEvent.id!);setViewingEvent(null);setDeleteEventConfirmOpen(true);}:undefined}/>}
      {showEventModal && (
        <CalendarEventModal
          saving={store.saving}
          error={store.error}
          formData={formData}
          setFormData={setFormData}
          editingEvent={Boolean(editingEvent)}
          categoryOptions={['개인','상담','기타']}
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
          <div data-confirm-dialog="true" data-popup-small="true" className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 data-popup-heading="true" className="text-xl font-black text-gray-900">일정 삭제</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              선택한 일정을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 mt-6">
              <button data-popup-action="true" data-action-height="44"
                onClick={() => {
                  setDeleteEventId(null);
                  setDeleteEventConfirmOpen(false);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                취소
              </button>
              <button data-action-height="44"
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
  const reminders=useCalendarReminderToggle(cloud?userId:null);
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
    .sort((a, b) => compareCalendarTimes(a.time, b.time));
  const open = (event: Event) => {
    setDraft({ ...event });
    setFormError("");
    setConfirmDelete(false);
  };
  const closeDraft = useCallback(() => {
    if (!saving) setDraft(null);
  }, [saving]);

  const today = koreaDate();
  return (
    <article data-ui-card="true"
      className={`${styles.card} ${styles.calendarCard}`}
      aria-label="내 일정 캘린더"
      data-calendar-card
    >
      {listDate ? (
        <>
          <div className={styles.heading}>
            <button data-icon-only="true"
              className={styles.iconButton}
              aria-label="달력으로 돌아가기"
              onClick={() => setListDate(null)}
            >
              <ArrowLeft />
            </button>
            <h2>
              {Number(listDate.slice(5, 7))}월 {Number(listDate.slice(8))}일
            </h2>
            <button data-icon-only="true"
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
                    {event.date >= today && <button data-icon-only="true"
                      onClick={() => void reminders.toggle(event)}
                      disabled={saving||reminders.saving||!reminders.ready}
                      aria-label={`${event.title} 알림 ${reminders.enabled[event.id]?"끄기":"켜기"}`}
                      aria-pressed={!!reminders.enabled[event.id]}
                      title={reminders.enabled[event.id]?"알림 끄기":"알림 켜기"}
                    >
                      {reminders.enabled[event.id]?<Bell style={{color:"#195DFF"}}/>:<BellOff />}
                    </button>}
                    <button data-icon-only="true"
                      onClick={() => open(event)}
                      disabled={saving}
                      aria-label={`${event.title} 수정`}
                      title="수정"
                    >
                      <Pencil />
                    </button>
                    <button data-icon-only="true"
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
          <div className={`${styles.heading} ${styles.calendarHeading}`}>
            <Link data-icon-only="true" className={styles.calendarPageLink} href="/calendar" aria-label="캘린더 페이지로 이동" title="캘린더 페이지로 이동"><CalendarDays /></Link>
            <div className={styles.calendarMonthNavigation}>
              <button data-icon-only="true" data-prev-next="true" type="button" className={styles.iconButton} aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft data-arrow-size="20" /></button>
              <h2>{month.getFullYear()}년 {month.getMonth() + 1}월</h2>
              <button data-icon-only="true" data-prev-next="true" type="button" className={styles.iconButton} aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight data-arrow-size="20" /></button>
            </div>
            <span aria-hidden="true" />
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
                      {Array.from(new Set(entries.map((e) => draft?.id === e.id ? draft.color : e.color)))
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
              <button data-action-height="44" onClick={() => void store.reload()}>다시 시도</button>
            </div>
          )}
        </>
      )}
      {reminders.error&&<p role="alert" className="text-sm text-red-500">{reminders.error}</p>}
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
            category: draft.category,
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
        <DashboardDialog confirmation title="일정 삭제" onClose={closeDraft}>
          <p>이 일정을 삭제할까요?</p>
          {formError && (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          )}
          <div className={styles.formActions}>
            <button data-popup-action="true" data-action-height="44"
              className={styles.secondary}
              disabled={saving}
              onClick={closeDraft}
            >
              취소
            </button>
            <button data-action-height="44"
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
