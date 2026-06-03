"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  Home,
  Settings,
  X,
  Lock,
  Users,
  BookOpen,
CalendarDays,
MessageSquare,
  Save,
  Eye,
  EyeOff,
  Car,
  User,
  CreditCard,
  Landmark,
  FileText,
  NotebookPen,
  Calculator as CalculatorIcon,
  Pin,
  Plus,
  Trash2,
  CirclePlus,
  Search,
  Pencil,
  Phone,
  Mail,
  Star,
  Link,
  Globe,
  Camera,
  CloudSun,
Music,
CheckSquare,
  Video,
  ChevronDown,
  Sprout
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import HomeTab from "./HomeTab";
import CalendarTab from "./CalendarTab";
import AiMessageTab from "./AiMessageTab";
import NoticeTab from "./NoticeTab";
import CalculatorComp from "@/app/components/Calculator";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────
type ActiveTab =
  | "home"
  | "calendar"
  | "ai"
  | "customer"
  | "notice";

type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSettings = {
  pin_hash: string | null;
  hidden_home_menus?: string[];
  pin_changed_at: string | null;
  agent_name: string | null;
  kakao_url: string | null;
  kakao_name: string | null;
  kakao_icon: string | null;
  my_site_url: string | null;
  my_site_name: string | null;
  my_site_icon: string | null;
   spreadsheet_url: string | null;
  spreadsheet_name: string | null;
  spreadsheet_icon: string | null;
  customer_url?: string | null;

   nickname?: string;
   plant_pos_x?: number;
plant_pos_y?: number;

};

const LINK_ICONS = [
  { id: "CirclePlus", label: "기본", icon: CirclePlus },
  { id: "MessageSquare", label: "카카오", icon: MessageSquare },
  { id: "Globe", label: "사이트", icon: Globe },
  { id: "FileText", label: "문서", icon: FileText },
  { id: "Phone", label: "전화", icon: Phone },
  { id: "Camera", label: "인스타", icon: Camera },
  { id: "Video", label: "유튜브", icon: Video },
  { id: "Mail", label: "메일", icon: Mail },
  { id: "Star", label: "즐겨찾기", icon: Star },
  { id: "Link", label: "링크", icon: Link },
];


// ─────────────────────────────────────────────
// SortableMemoCard
// ─────────────────────────────────────────────
function SortableMemoCard({ memo, children }: { memo: MemoItem; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: memo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 80 : "auto" as any,
    opacity: isDragging ? 0.8 : 1,
  };
  if (memo.pinned) return <>{children}</>;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? "scale-[1.01]" : ""}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────
const TABS = [
  { id: "home" as ActiveTab, label: "홈", icon: BookOpen },
  { id: "customer" as ActiveTab, label: "고객관리", icon: Users },
  { id: "notice" as ActiveTab, label: "안내장", icon: FileText },
  { id: "calendar" as ActiveTab, label: "캘린더", icon: CalendarDays },
  { id: "ai" as ActiveTab, label: "AI메시지", icon: MessageSquare },
];

const HOME_MENU_ITEMS = [
  { id: "weather", label: "날씨", desc: "지역별 날씨 확인", icon: CloudSun, color: "text-sky-500", bg: "bg-sky-50" },
  { id: "dday", label: "D-Day", desc: "중요한 날짜 표시", icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "bgm", label: "BGM", desc: "음악 플레이어", icon: Music, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "schedule", label: "오늘 일정", desc: "오늘 등록된 일정", icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "checklist", label: "체크리스트", desc: "오늘 할 일 관리", icon: CheckSquare, color: "text-green-500", bg: "bg-green-50" },
  { id: "memo", label: "메모 목록", desc: "개인 메모 확인", icon: NotebookPen, color: "text-yellow-500", bg: "bg-yellow-50" },
  { id: "diary", label: "일기", desc: "월별 일기 기록", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
];

// ─────────────────────────────────────────────
// SortableTab
// ─────────────────────────────────────────────
function SortableTab({ tab, activeTab, setActiveTab }: { tab: any; activeTab: string; setActiveTab: (id: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 80 : ("auto" as any),
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveTab(tab.id)}
      className={`rounded-xl py-3 font-bold transition ${
        activeTab === tab.id
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600"
      }`}
    >
      <div className="flex items-center justify-center">
        {tab.label}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function CustomerManagePage() {
  const { authUser, authStatus, authLoading, memos, saveMemos } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<CustomerSettings | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [tabs, setTabs] = useState(TABS);

  // 설정 드롭다운
  const [settingOpen, setSettingOpen] = useState(false);
const [homeMenuSettingOpen, setHomeMenuSettingOpen] = useState(false);
const [hiddenHomeMenus, setHiddenHomeMenus] = useState<string[]>([]);
const settingRef = useRef<HTMLDivElement>(null);


  // 개인설정 팝업
  const [settingPanelOpen, setSettingPanelOpen] = useState(false);
  const [settingForm, setSettingForm] = useState({
  kakao_url: "",
  kakao_name: "",
  kakao_icon: "CirclePlus",
  my_site_url: "",
  my_site_name: "",
  my_site_icon: "CirclePlus",
  spreadsheet_url: "",
  spreadsheet_name: "",
  spreadsheet_icon: "CirclePlus",
  new_pin: "",
  confirm_pin: "",
});

  const [settingSaving, setSettingSaving] = useState(false);
  const [settingMsg, setSettingMsg] = useState("");
  const [showNewPin, setShowNewPin] = useState(false);
const [iconPickerOpen, setIconPickerOpen] = useState<
  null | "kakao" | "mysite" | "spreadsheet"
>(null);
const [urlPopupName, setUrlPopupName] = useState("");
const [urlPopupIcon, setUrlPopupIcon] = useState("CirclePlus");
// URL 팝업 내 아이콘 피커 열림 상태
const [urlPopupIconPickerOpen, setUrlPopupIconPickerOpen] = useState(false);


  // ─── URL 설정 팝업 (하단 + 버튼용) ───
  // type: "kakao" | "mysite" | "spreadsheet"
  const [urlPopupType, setUrlPopupType] = useState<"kakao" | "mysite" | "spreadsheet" | null>(null);
  const [urlPopupValue, setUrlPopupValue] = useState("");
  const [urlPopupSaving, setUrlPopupSaving] = useState(false);

  const urlPopupMeta = {
    kakao: { label: "내 사이트 URL 설정", placeholder: "https://" },
    mysite: { label: "내 사이트 URL 설정", placeholder: "https://" },
    spreadsheet: { label: "내 사이트 URL 설정", placeholder: "https://" },
  };

  const openUrlPopup = (type: "kakao" | "mysite" | "spreadsheet") => {
  const current =
    type === "kakao" ? settings?.kakao_url :
    type === "mysite" ? settings?.my_site_url :
    settings?.spreadsheet_url;
  const currentName =
    type === "kakao" ? settings?.kakao_name :
    type === "mysite" ? settings?.my_site_name :
    settings?.spreadsheet_name;
  const currentIcon =
    type === "kakao" ? settings?.kakao_icon :
    type === "mysite" ? settings?.my_site_icon :
    settings?.spreadsheet_icon;
  setUrlPopupValue(current || "");
  setUrlPopupName(currentName || "");
  setUrlPopupIcon(currentIcon || "CirclePlus");
  setUrlPopupIconPickerOpen(false);
  setUrlPopupType(type);
};

  const handleUrlButtonClick = (type: "kakao" | "mysite" | "spreadsheet") => {
    const url =
      type === "kakao" ? settings?.kakao_url :
      type === "mysite" ? settings?.my_site_url :
      settings?.spreadsheet_url;
    if (url) {
      window.open(url, "_blank");
    } else {
      openUrlPopup(type);
    }
  };

  const handleSaveUrlPopup = async () => {
  if (!authUser || !urlPopupType) return;
  setUrlPopupSaving(true);
  const urlField = urlPopupType === "kakao" ? "kakao_url" : urlPopupType === "mysite" ? "my_site_url" : "spreadsheet_url";
  const nameField = urlPopupType === "kakao" ? "kakao_name" : urlPopupType === "mysite" ? "my_site_name" : "spreadsheet_name";
  const iconField = urlPopupType === "kakao" ? "kakao_icon" : urlPopupType === "mysite" ? "my_site_icon" : "spreadsheet_icon";
  const updateData: any = {
    user_id: authUser.id,
    [urlField]: urlPopupValue,
    [nameField]: urlPopupName,
    [iconField]: urlPopupIcon,
  };
  const { error } = await supabase.from("customer_settings").upsert(updateData, { onConflict: "user_id" });
  if (!error) {
    setSettings((prev) => prev ? { ...prev, [urlField]: urlPopupValue, [nameField]: urlPopupName, [iconField]: urlPopupIcon } : null);
    setSettingForm((f) => ({ ...f, [urlField]: urlPopupValue, [nameField]: urlPopupName, [iconField]: urlPopupIcon }));
  }
  setUrlPopupSaving(false);
  setUrlPopupType(null);
};



  // ─── 메모 state ───
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoSearch, setMemoSearch] = useState("");
  const [memoPage, setMemoPage] = useState(1);
  const [memoAddOpen, setMemoAddOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [memoColor, setMemoColor] = useState<MemoItem["color"]>("white");
  const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
  const [memoContextMenu, setMemoContextMenu] = useState<{
  x: number;
  y: number;
  memo: MemoItem;
} | null>(null);

useEffect(() => {
  const closeMemoContextMenu = () => {
    setMemoContextMenu(null);
  };

  if (memoContextMenu) {
    window.addEventListener("pointerdown", closeMemoContextMenu);
  }

  return () => {
    window.removeEventListener("pointerdown", closeMemoContextMenu);
  };
}, [memoContextMenu]);

  const MEMOS_PER_PAGE = 6;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sortedMemos = [...memos].sort((a: MemoItem, b: MemoItem) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredMemos = sortedMemos.filter((memo: MemoItem) =>
    `${memo.title} ${memo.content}`.toLowerCase().includes(memoSearch.toLowerCase())
  );

  const totalMemoPages = Math.max(1, Math.ceil(filteredMemos.length / MEMOS_PER_PAGE));
  const pagedMemos = filteredMemos.slice((memoPage - 1) * MEMOS_PER_PAGE, memoPage * MEMOS_PER_PAGE);

  const getMemoColorClass = (color?: MemoItem["color"]) => {
    switch (color) {
      case "blue": return "bg-blue-50/80 border-blue-100";
      case "yellow": return "bg-yellow-50/80 border-yellow-100";
      case "red": return "bg-red-50/80 border-red-100";
      case "clear": return "bg-white/40 border-gray-200";
      default: return "bg-white border-gray-200";
    }
  };

  const memoColorOptions: { value: MemoItem["color"]; className: string }[] = [
    { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
    { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
    { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
    { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
    {
      value: "clear",
      className: "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
    },
  ];

  const addMemo = () => {
    const now = new Date().toISOString();
    const newMemo: MemoItem = {
      id: crypto.randomUUID(),
      title: memoTitle.trim() || "",
      content: memoContent.trim(),
      pinned: false,
      visible: false,
      color: memoColor,
      createdAt: now,
      updatedAt: now,
    };
    saveMemos([newMemo, ...(memos as MemoItem[])]);
    setMemoTitle("");
    setMemoContent("");
    setMemoColor("white");
    setMemoPage(1);
  };

  const toggleMemoVisible = (id: string) => {
    const nextMemos = (memos as MemoItem[]).map((m) => m.id === id ? { ...m, visible: !m.visible } : m);
    saveMemos(nextMemos);
  };

  const toggleMemoPinned = (id: string) => {
    const nextMemos = (memos as MemoItem[]).map((m) =>
      m.id === id ? { ...m, pinned: !m.pinned, updatedAt: new Date().toISOString() } : m
    );
    saveMemos(nextMemos);
  };

  
  const handleTabDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = tabs.findIndex((t) => t.id === active.id);
    const newIndex = tabs.findIndex((t) => t.id === over.id);
    
    const newTabs = arrayMove(tabs, oldIndex, newIndex);
    setTabs(newTabs);
    
    if (authUser) {
      await supabase.from("customer_settings").upsert(
        { user_id: authUser.id, tab_order: newTabs.map((t: typeof TABS[number]) => t.id) },
        { onConflict: "user_id" }
      );
    }
  };

  const handleMemoDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeMemo = (memos as MemoItem[]).find((m) => m.id === active.id);
    const overMemo = (memos as MemoItem[]).find((m) => m.id === over.id);
    if (!activeMemo || !overMemo) return;
    if (activeMemo.pinned || overMemo.pinned) return;
    const unpinned = sortedMemos.filter((m) => !m.pinned);
    const pinned = sortedMemos.filter((m) => m.pinned);
    const oldIndex = unpinned.findIndex((m) => m.id === active.id);
    const newIndex = unpinned.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(unpinned, oldIndex, newIndex).map((m, i) => ({
      ...m,
      updatedAt: new Date(Date.now() - i).toISOString(),
    }));
    saveMemos([...pinned, ...reordered]);
  };

  const changeMemoColor = (id: string, color: MemoItem["color"]) => {
    const nextMemos = (memos as MemoItem[]).map((m) =>
      m.id === id ? { ...m, color, updatedAt: new Date().toISOString() } : m
    );
    saveMemos(nextMemos);
  };

  const deleteMemo = (id: string) => {
    setDeleteMemoId(id);
    setDeleteMemoConfirmOpen(true);
  };

  const confirmDeleteMemo = () => {
    if (!deleteMemoId) return;
    const nextMemos = (memos as MemoItem[]).filter((m) => m.id !== deleteMemoId);
    saveMemos(nextMemos);
    if (memoPage > 1 && pagedMemos.length === 1) setMemoPage((p) => Math.max(1, p - 1));
    setSelectedMemo(null);
    setDeleteMemoId(null);
    setDeleteMemoConfirmOpen(false);
  };

  useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (settingRef.current && !settingRef.current.contains(e.target as Node)) {
      setSettingOpen(false);
    }
  };
  if (settingOpen) document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [settingOpen]);

useEffect(() => {
 const handleOpenMemoDetail = (e: Event) => {
  const id = (e as CustomEvent).detail;
  if (id === null) {
    // 새 메모 추가
    setMemoAddOpen(true);
    return;
  }
  const memo = (memos as MemoItem[]).find((m) => m.id === id);
  if (memo) setSelectedMemo(memo);
};
  window.addEventListener("open-memo-detail", handleOpenMemoDetail);
  return () => window.removeEventListener("open-memo-detail", handleOpenMemoDetail);
}, [memos]);



  // ─── 인증 상태 확인 ───
  useEffect(() => {
    if (authLoading) return;
    if (!authUser || authStatus !== "approved") return;
    loadSettings();
  }, [authUser, authStatus, authLoading]);

  const loadSettings = async () => {
  if (!authUser) return;
  const { data } = await supabase
    .from("customer_settings")
    .select("pin_hash, pin_changed_at, agent_name, kakao_url, kakao_name, kakao_icon, my_site_url, my_site_name, my_site_icon, spreadsheet_url, spreadsheet_name, spreadsheet_icon, customer_url, nickname, plant_pos_x, plant_pos_y, tab_order, hidden_home_menus")
    .eq("user_id", authUser.id)
    .maybeSingle();

  // profiles 테이블에서 닉네임 가져오기
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!data) return;
setSettings({
  ...(data || {}),
  nickname: profile?.nickname || data?.nickname || null,
} as CustomerSettings);

setHiddenHomeMenus(
  Array.isArray(data?.hidden_home_menus) ? data.hidden_home_menus : []
);

if (data?.tab_order && Array.isArray(data.tab_order)) {
  const order = data.tab_order as string[];

  const orderedTabs = order
    .map((id: string) => TABS.find((t) => t.id === id))
    .filter((t): t is typeof TABS[number] => Boolean(t));

  const missingTabs = TABS.filter((t) => !order.includes(t.id));

  setTabs([...orderedTabs, ...missingTabs]);
} else {
  setTabs(TABS);
}

if (!data) return;
  setSettingForm((f) => ({
    ...f,
    kakao_url: data.kakao_url || "",
    kakao_name: data.kakao_name || "",
    kakao_icon: data.kakao_icon || "CirclePlus",
    my_site_url: data.my_site_url || "",
    my_site_name: data.my_site_name || "",
    my_site_icon: data.my_site_icon || "CirclePlus",
    spreadsheet_url: data.spreadsheet_url || "",
    spreadsheet_name: data.spreadsheet_name || "",
    spreadsheet_icon: data.spreadsheet_icon || "CirclePlus",
  }));
};


  
  // ─── 설정 저장 ───
  const handleSaveSettings = async () => {
    if (!authUser) return;
    setSettingSaving(true);
    setSettingMsg("");
    const updateData: any = {
  user_id: authUser.id,
  kakao_url: settingForm.kakao_url,
  kakao_name: settingForm.kakao_name,
  kakao_icon: settingForm.kakao_icon,
  my_site_url: settingForm.my_site_url,
  my_site_name: settingForm.my_site_name,
  my_site_icon: settingForm.my_site_icon,
  spreadsheet_url: settingForm.spreadsheet_url,
  spreadsheet_name: settingForm.spreadsheet_name,
  spreadsheet_icon: settingForm.spreadsheet_icon,
};

    if (settingForm.new_pin) {
      if (settingForm.new_pin.length !== 4) {
        setSettingMsg("새 PIN은 4자리여야 합니다.");
        setSettingSaving(false);
        return;
      }
      if (settingForm.new_pin !== settingForm.confirm_pin) {
        setSettingMsg("새 PIN이 일치하지 않습니다.");
        setSettingSaving(false);
        return;
      }
      const encoder = new TextEncoder();
      const data2 = encoder.encode(settingForm.new_pin + "insurance-namu-salt");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data2);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      updateData.pin_hash = hashArray.map((b: number) => b.toString(16).padStart(2, "0")).join("");
updateData.pin_plain = settingForm.new_pin;
updateData.pin_changed_at = new Date().toISOString();

    }
    const { error } = await supabase.from("customer_settings").upsert(updateData, { onConflict: "user_id" });
    if (error) {
      setSettingMsg("저장 실패: " + error.message);
    } else {
      setSettingMsg("저장되었습니다.");
      setSettings((prev) => (prev ? { ...prev, ...updateData } : null));
      setSettingForm((f) => ({ ...f, new_pin: "", confirm_pin: "" }));
      setTimeout(() => setSettingMsg(""), 2000);
    }
    setSettingSaving(false);
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  if (!authUser || authStatus !== "approved") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">접근 제한</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            개인공간 기능은 승인된 회원만<br />이용 가능합니다.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  



  return (
    <div className="min-h-screen bg-gray-100 pb-24">

      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-black shadow-sm overflow-visible">
  <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">

            {/* 홈 버튼 */}
            <button
              onClick={() => router.push("/")}
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm transition cursor-pointer"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </button>

            {/* 타이틀 */}
<div className="text-center">
  <div className="flex items-center justify-center gap-2">
    <User className="w-7 h-7 text-blue-600" />

    <h1 className="text-2xl font-black text-gray-900">
      {settings?.nickname
        ? `${settings.nickname}님의 공간`
        : "나의 공간"}
    </h1>
  </div>

  <p className="text-sm text-gray-500 mt-1">
    나만의 비밀공간으로 이용하세요 !
  </p>
</div>

            {/* 설정 드롭다운 */}
            <div ref={settingRef} className={`absolute right-0 top-1/2 -translate-y-1/2 ${settingOpen ? "z-[1000]" : "z-40"}`}>

              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingOpen(!settingOpen); }}
                  className={`w-10 h-10 rounded-full border border-gray-200 shadow-sm flex items-center justify-center transition cursor-pointer ${
                    settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                </button>

                {settingOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-12 z-[999] w-40 rounded-2xl bg-white border border-gray-200 shadow-xl"
                  >
                    <button
                      onClick={() => { setSettingOpen(false); setTimeout(() => setMemoOpen(true), 50); }}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer"
                    >
                      메모장
                    </button>
                    <button
                      onClick={() => { setSettingOpen(false); setTimeout(() => window.dispatchEvent(new Event("open-calculator")), 50); }}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer"
                    >
                      계산기
                    </button>

<button
  onClick={() => {
    setSettingOpen(false);
    setTimeout(() => setHomeMenuSettingOpen(true), 50);
  }}
  className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer"
>
  홈 설정
</button>

                    <button
                      onClick={() => { setSettingOpen(false); setTimeout(() => setSettingPanelOpen(true), 50); }}
                      className="block w-full rounded-b-2xl text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                    >
                      개인설정
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 탭 ── */}
<div className="w-full px-6 pt-3 pb-0 max-w-7xl mx-auto">
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
      <SortableContext items={tabs.map(t => t.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 md:grid-cols-5 bg-gray-200 rounded-2xl p-1 mb-5">
          {tabs.map((tab) => (
            <SortableTab key={tab.id} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
</div>
      {/* ── 탭 콘텐츠 ── */}
      <main className="max-w-7xl mx-auto px-6 pb-8">
       <div className={activeTab === "home" ? "block" : "hidden"}>
  <HomeTab
  settings={settings}
  hiddenHomeMenus={hiddenHomeMenus}
/>
</div>

<div className={activeTab === "calendar" ? "block" : "hidden"}>
  <CalendarTab />
</div>

<div className={activeTab === "ai" ? "block" : "hidden"}>
  <AiMessageTab />
</div>

<div className={activeTab === "customer" ? "block" : "hidden"}>
  <CustomerTab
    spreadsheetUrl={settings?.customer_url || null}
    onSaveUrl={async (url: string) => {
      if (!authUser) return;
      const { error } = await supabase.from("customer_settings").upsert(
        { user_id: authUser.id, customer_url: url },
        { onConflict: "user_id" }
      );
      if (!error) setSettings((prev) => prev ? { ...prev, customer_url: url } : null);
    }}
  />
</div>

<div className={activeTab === "notice" ? "block" : "hidden"}>
  <NoticeTab />
</div>

        
      </main>

      {/* ── 하단 고정바 ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-around text-center">
          {/* 카카오톡 채널 */}
          <button onClick={() => handleUrlButtonClick("kakao")}
  className="flex flex-col items-center justify-center gap-1 text-gray-700 transition cursor-pointer"
  title={settings?.kakao_url ? "카카오톡 채널 열기" : "카카오톡 채널 URL 설정"}>
  {(() => { const found = LINK_ICONS.find(i => i.id === (settings?.kakao_icon || "CirclePlus")); const IconComp = found ? found.icon : CirclePlus; return <IconComp className="w-5 h-5" />; })()}
  {settings?.kakao_name && <span className="text-sm text-gray-700 max-w-[120px] truncate">{settings.kakao_name}</span>}
</button>
          {/* 내 사이트 */}
        <button onClick={() => handleUrlButtonClick("mysite")}
  className="flex flex-col items-center justify-center gap-1 text-gray-700 transition cursor-pointer"
  title={settings?.my_site_url ? "내 사이트 열기" : "내 사이트 URL 설정"}>
  {(() => { const found = LINK_ICONS.find(i => i.id === (settings?.my_site_icon || "CirclePlus")); const IconComp = found ? found.icon : CirclePlus; return <IconComp className="w-5 h-5" />; })()}
  {settings?.my_site_name && <span className="text-sm text-gray-700 max-w-[120px] truncate">{settings.my_site_name}</span>}
</button>
          {/* 구글 스프레드시트 */}
    <button onClick={() => handleUrlButtonClick("spreadsheet")}
  className="flex flex-col items-center justify-center gap-1 text-gray-700 transition cursor-pointer"
  title={settings?.spreadsheet_url ? "스프레드시트 열기" : "스프레드시트 URL 설정"}>
  {(() => { const found = LINK_ICONS.find(i => i.id === (settings?.spreadsheet_icon || "CirclePlus")); const IconComp = found ? found.icon : CirclePlus; return <IconComp className="w-5 h-5" />; })()}
  {settings?.spreadsheet_name && <span className="text-sm text-gray-700 max-w-[120px] truncate">{settings.spreadsheet_name}</span>}
</button>
        </div>
      </div>

    

     {/* ── URL 설정 팝업 ── */}
{urlPopupType && (
  <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-visible">
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between rounded-t-3xl">
        <span className="font-bold text-sm">{urlPopupMeta[urlPopupType].label}</span>
        <button
          onClick={() => setUrlPopupType(null)}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-3 overflow-visible">
        <label className="text-xs text-gray-500 font-semibold block">
          내 사이트 URL 설정
        </label>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setUrlPopupIconPickerOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              {(() => {
                const found = LINK_ICONS.find((i) => i.id === urlPopupIcon);
                const IconComp = found ? found.icon : CirclePlus;
                return <IconComp className="w-4 h-4 text-gray-700" />;
              })()}
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                  urlPopupIconPickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {urlPopupIconPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-[9999] w-[220px] grid grid-cols-5 gap-2 p-2 rounded-2xl border border-gray-200 bg-white shadow-xl">
                {LINK_ICONS.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setUrlPopupIcon(item.id);
                        setUrlPopupIconPickerOpen(false);
                      }}
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border transition cursor-pointer ${
                        urlPopupIcon === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-gray-700" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input
            value={urlPopupName}
            onChange={(e) => setUrlPopupName(e.target.value)}
            placeholder="버튼 이름"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
          />
        </div>

        <input
          value={urlPopupValue}
          onChange={(e) => setUrlPopupValue(e.target.value)}
          placeholder={urlPopupMeta[urlPopupType].placeholder}
          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
          autoFocus
        />

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setUrlPopupType(null)}
            className="flex-1 h-10 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSaveUrlPopup}
            disabled={urlPopupSaving}
            className="flex-1 h-10 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
          >
            {urlPopupSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {homeMenuSettingOpen && (
 <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center px-3 py-4 md:p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] md:max-w-2xl h-[82vh] md:h-auto overflow-hidden flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between">
        <span className="font-bold text-sm">홈 메뉴 변경</span>

        <button
          onClick={() => setHomeMenuSettingOpen(false)}
         className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5 space-y-3 md:space-y-4">

<div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-200 bg-white">
  <div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
  <Sprout className="w-5 h-5 text-green-500" />
</div>

    <span className="text-sm font-black text-gray-800">
      {settings?.nickname || "나"}의 식물
    </span>
  </div>

  <button
    onClick={async () => {
      const hidden = hiddenHomeMenus.includes("plant");

      const next = hidden
        ? hiddenHomeMenus.filter((v) => v !== "plant")
        : [...hiddenHomeMenus, "plant"];

      setHiddenHomeMenus(next);

      await supabase.from("customer_settings").upsert(
        {
          user_id: authUser?.id,
          hidden_home_menus: next,
        },
        { onConflict: "user_id" }
      );
    }}
    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
  >
    {hiddenHomeMenus.includes("plant") ? (
      <EyeOff className="w-4 h-4" />
    ) : (
      <Eye className="w-4 h-4" />
    )}
  </button>
</div>

  {/* 상단 */}
  <div className="grid md:grid-cols-3 gap-3">
    {HOME_MENU_ITEMS.filter(item =>
      ["weather", "dday", "bgm"].includes(item.id)
    ).map((item) => {
      const hidden = hiddenHomeMenus.includes(item.id);
      const Icon = item.icon;

      return (
        <div
          key={item.id}
className={`relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
  hidden
    ? "opacity-45"
    : "hover:-translate-y-1 hover:shadow-lg"
}`}
        >
          <button
            onClick={async () => {
              const next = hidden
                ? hiddenHomeMenus.filter(v => v !== item.id)
                : [...hiddenHomeMenus, item.id];

              setHiddenHomeMenus(next);

              await supabase.from("customer_settings").upsert(
                {
                  user_id: authUser?.id,
                  hidden_home_menus: next,
                },
                { onConflict: "user_id" }
              );
            }}
            className="
  absolute
  right-3
  top-3
  w-7
  h-7
  rounded-full
  flex
  items-center
  justify-center
  text-gray-400
  hover:bg-gray-100
  hover:text-gray-600
  transition
  cursor-pointer
"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${item.color}`} />
          </div>

          <p className="font-black">{item.label}</p>
          <p className="text-sm text-gray-400">{item.desc}</p>
        </div>
      );
    })}
  </div>

  {/* 중간 */}
  <div className="grid md:grid-cols-2 gap-3">
    {HOME_MENU_ITEMS.filter(item =>
      ["schedule", "checklist"].includes(item.id)
    ).map((item) => {
      const hidden = hiddenHomeMenus.includes(item.id);
      const Icon = item.icon;

      return (
        <div
          key={item.id}
className={`relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
  hidden
    ? "opacity-45"
    : "hover:-translate-y-1 hover:shadow-lg"
}`}
        >
          <button
            onClick={async () => {
              const next = hidden
                ? hiddenHomeMenus.filter(v => v !== item.id)
                : [...hiddenHomeMenus, item.id];

              setHiddenHomeMenus(next);

              await supabase.from("customer_settings").upsert(
                {
                  user_id: authUser?.id,
                  hidden_home_menus: next,
                },
                { onConflict: "user_id" }
              );
            }}
            className="
  absolute
  right-3
  top-3
  w-7
  h-7
  rounded-full
  flex
  items-center
  justify-center
  text-gray-400
  hover:bg-gray-100
  hover:text-gray-600
  transition
  cursor-pointer
"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${item.color}`} />
          </div>

          <p className="font-black">{item.label}</p>
          <p className="text-sm text-gray-400">{item.desc}</p>
        </div>
      );
    })}
  </div>

  {/* 하단 */}
  <div className="grid md:grid-cols-2 gap-3">
    {HOME_MENU_ITEMS.filter(item =>
      ["memo", "diary"].includes(item.id)
    ).map((item) => {
      const hidden = hiddenHomeMenus.includes(item.id);
      const Icon = item.icon;

      return (
        <div
          key={item.id}
className={`relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
  hidden
    ? "opacity-45"
    : "hover:-translate-y-1 hover:shadow-lg"
}`}
        >
          <button
            onClick={async () => {
              const next = hidden
                ? hiddenHomeMenus.filter(v => v !== item.id)
                : [...hiddenHomeMenus, item.id];

              setHiddenHomeMenus(next);

              await supabase.from("customer_settings").upsert(
                {
                  user_id: authUser?.id,
                  hidden_home_menus: next,
                },
                { onConflict: "user_id" }
              );
            }}
            className="
  absolute
  right-3
  top-3
  w-7
  h-7
  rounded-full
  flex
  items-center
  justify-center
  text-gray-400
  hover:bg-gray-100
  hover:text-gray-600
  transition
  cursor-pointer
"
          >
{hidden ? (
  <EyeOff className="w-3.5 h-3.5" />
) : (
  <Eye className="w-3.5 h-3.5" />
)}
          </button>

          <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${item.color}`} />
          </div>

          <p className="font-black">{item.label}</p>
          <p className="text-sm text-gray-400">{item.desc}</p>
        </div>
      );
    })}
  </div>

</div>
    </div>
  </div>
)}

      {/* ── 개인설정 팝업 ── */}
      {settingPanelOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <span className="font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> 개인 설정
              </span>
              <button
                onClick={() => setSettingPanelOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">내 사이트 URL 설정</label>
<div className="flex items-center gap-2 mb-1">
  <div className="relative shrink-0">
    <button
      type="button"
      onClick={() => setIconPickerOpen(iconPickerOpen === "kakao" ? null : "kakao")}
      className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
    >
      {(() => {
        const found = LINK_ICONS.find(i => i.id === settingForm.kakao_icon);
        const IconComp = found ? found.icon : CirclePlus;
        return <IconComp className="w-4 h-4 text-gray-700" />;
      })()}
      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${iconPickerOpen === "kakao" ? "rotate-180" : ""}`} />
    </button>
    {iconPickerOpen === "kakao" && (
      <div className="absolute top-full left-0 mt-1 z-[9999] w-[220px] grid grid-cols-5 gap-1 p-2 rounded-xl border border-gray-200 bg-white shadow-lg">
        {LINK_ICONS.map((item) => {
          const IconComp = item.icon;
          return (
            <button key={item.id} type="button"
              onClick={() => { setSettingForm((f) => ({ ...f, kakao_icon: item.id })); setIconPickerOpen(null); }}
              className={`flex items-center justify-center p-1.5 rounded-lg border transition cursor-pointer ${settingForm.kakao_icon === item.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
              <IconComp className="w-4 h-4 text-gray-700" />
            </button>
          );
        })}
      </div>
    )}
  </div>
  <input
    value={settingForm.kakao_name}
    onChange={(e) => setSettingForm((f) => ({ ...f, kakao_name: e.target.value }))}
    placeholder="버튼 이름"
    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

                <input
                  value={settingForm.kakao_url}
                  onChange={(e) => setSettingForm((f) => ({ ...f, kakao_url: e.target.value }))}
                  placeholder="https://"
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
                />
              </div>
              <div>
  <label className="text-xs text-gray-500 font-semibold mb-1 block">내 사이트 URL 설정</label>
  <div className="flex items-center gap-2 mb-1">
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIconPickerOpen(iconPickerOpen === "mysite" ? null : "mysite")}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
      >
        {(() => {
          const found = LINK_ICONS.find(i => i.id === settingForm.my_site_icon);
          const IconComp = found ? found.icon : CirclePlus;
          return <IconComp className="w-4 h-4 text-gray-700" />;
        })()}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${iconPickerOpen === "mysite" ? "rotate-180" : ""}`} />
      </button>
      {iconPickerOpen === "mysite" && (
        <div className="absolute top-full left-0 mt-1 z-[9999] w-[220px] grid grid-cols-5 gap-1 p-2 rounded-xl border border-gray-200 bg-white shadow-lg">
          {LINK_ICONS.map((item) => {
            const IconComp = item.icon;
            return (
              <button key={item.id} type="button"
                onClick={() => { setSettingForm((f) => ({ ...f, my_site_icon: item.id })); setIconPickerOpen(null); }}
                className={`flex items-center justify-center p-1.5 rounded-lg border transition cursor-pointer ${settingForm.my_site_icon === item.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <IconComp className="w-4 h-4 text-gray-700" />
              </button>
            );
          })}
        </div>
      )}
    </div>
    <input
      value={settingForm.my_site_name}
      onChange={(e) => setSettingForm((f) => ({ ...f, my_site_name: e.target.value }))}
      placeholder="버튼 이름"
      className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
    />
  </div>
  <input
    value={settingForm.my_site_url}
    onChange={(e) => setSettingForm((f) => ({ ...f, my_site_url: e.target.value }))}
    placeholder="https://"
    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

              <div>
  <label className="text-xs text-gray-500 font-semibold mb-1 block">내 사이트 URL 설정</label>
  <div className="flex items-center gap-2 mb-1">
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIconPickerOpen(iconPickerOpen === "spreadsheet" ? null : "spreadsheet")}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
      >
        {(() => {
          const found = LINK_ICONS.find(i => i.id === settingForm.spreadsheet_icon);
          const IconComp = found ? found.icon : CirclePlus;
          return <IconComp className="w-4 h-4 text-gray-700" />;
        })()}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${iconPickerOpen === "spreadsheet" ? "rotate-180" : ""}`} />
      </button>
      {iconPickerOpen === "spreadsheet" && (
        <div className="absolute top-full left-0 mt-1 z-[9999] w-[220px] grid grid-cols-5 gap-1 p-2 rounded-xl border border-gray-200 bg-white shadow-lg">
          {LINK_ICONS.map((item) => {
            const IconComp = item.icon;
            return (
              <button key={item.id} type="button"
                onClick={() => { setSettingForm((f) => ({ ...f, spreadsheet_icon: item.id })); setIconPickerOpen(null); }}
                className={`flex items-center justify-center p-1.5 rounded-lg border transition cursor-pointer ${settingForm.spreadsheet_icon === item.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <IconComp className="w-4 h-4 text-gray-700" />
              </button>
            );
          })}
        </div>
      )}
    </div>
    <input
      value={settingForm.spreadsheet_name}
      onChange={(e) => setSettingForm((f) => ({ ...f, spreadsheet_name: e.target.value }))}
      placeholder="버튼 이름"
      className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
    />
  </div>
  <input
    value={settingForm.spreadsheet_url}
    onChange={(e) => setSettingForm((f) => ({ ...f, spreadsheet_url: e.target.value }))}
    placeholder="https://"
    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">새 PIN (변경 시만 입력)</label>
                <div className="relative">
                  <input
                    type={showNewPin ? "text" : "password"}
                    value={settingForm.new_pin}
                    onChange={(e) => setSettingForm((f) => ({ ...f, new_pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="새 PIN 4자리"
                    className="w-full h-9 px-3 pr-9 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
                  />
                  <button
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {settingForm.new_pin && (
                  <input
                    type="password"
                    value={settingForm.confirm_pin}
                    onChange={(e) => setSettingForm((f) => ({ ...f, confirm_pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="새 PIN 확인"
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition mt-2"
                  />
                )}
              </div>
              {settingMsg && (
                <p className={`text-xs text-center font-semibold ${settingMsg.includes("실패") || settingMsg.includes("않") ? "text-red-500" : "text-green-600"}`}>
                  {settingMsg}
                </p>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={settingSaving}
                className="w-full h-12 bg-gray-800 text-white text-sm font-bold rounded-2xl hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                
                {settingSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메모장 팝업 ── */}
      {memoOpen && (
        <div
          onClick={() => setMemoOpen(false)}
          className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col"
          >
            {/* 헤더 */}
            <div className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div className="font-bold flex items-center gap-2">
                <NotebookPen className="w-5 h-5" />
                메모장
              </div>
              <button
                onClick={() => setMemoOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 검색 + 추가 */}
            <div className="p-4">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={memoSearch}
                    onChange={(e) => { setMemoSearch(e.target.value); setMemoPage(1); }}
                    placeholder="메모 검색"
                    className="w-full h-12 rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  />
                </div>
                <button
                  onClick={() => setMemoAddOpen(true)}
                  className="h-12 rounded-2xl bg-gray-800 text-white px-5 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-gray-700 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  추가
                </button>
              </div>
            </div>

            {/* 메모 카드 목록 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              {pagedMemos.length === 0 ? (
                <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400 min-h-[200px]">
                  저장된 메모가 없습니다.
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMemoDragEnd}>
                  <SortableContext
                    items={pagedMemos.filter((m) => !m.pinned).map((m) => m.id)}
                    strategy={rectSortingStrategy}
                  >
                    {pagedMemos.map((memo) => (
                      <SortableMemoCard key={memo.id} memo={memo}>
                        <div
  onDoubleClick={() => setSelectedMemo(memo)}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setMemoContextMenu({
      x: e.clientX,
      y: e.clientY,
      memo,
    });
  }}
  className={`rounded-2xl border shadow-sm ${getMemoColorClass(memo.color)} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default p-4`}
>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0 flex flex-col min-h-[130px]">
                              <h3 className="text-sm font-black text-gray-900 mb-2 break-keep">{memo.title}</h3>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep">{memo.content}</p>
                              <p className="text-[11px] text-gray-400 mt-auto pt-3">
                                수정일 {new Date(memo.updatedAt).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleMemoVisible(memo.id); }}
                                className={`w-10 h-10 rounded-full hidden sm:flex items-center justify-center border transition cursor-pointer ${
                                  memo.visible
                                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                }`}
                                title="메인 노출"
                              >
                                {memo.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleMemoPinned(memo.id); }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-pointer ${
                                  memo.pinned
                                    ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700"
                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                }`}
                                title="상단 고정"
                              >
                                <Pin className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedMemo(memo); }}
                                className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-pointer"
                                title="수정"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </SortableMemoCard>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100 bg-white">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
                  disabled={memoPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white cursor-pointer disabled:cursor-default"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(totalMemoPages, 10) }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setMemoPage(page)}
                      className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                        memoPage === page
                          ? "bg-slate-800 text-white hover:bg-slate-700"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setMemoPage((p) => Math.min(totalMemoPages, p + 1))}
                  disabled={memoPage === totalMemoPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white cursor-pointer disabled:cursor-default"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {memoContextMenu && (
  <div
    className="fixed z-[1600] w-32 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    style={{
      left: memoContextMenu.x,
      top: memoContextMenu.y,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      onClick={() => {
        setSelectedMemo(memoContextMenu.memo);
        setMemoContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition text-left"
    >
      수정
    </button>

    <button
      onClick={() => {
        deleteMemo(memoContextMenu.memo.id);
        setMemoContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition text-left border-t border-gray-100"
    >
      삭제
    </button>
  </div>
)}

      {/* ── 메모 추가 팝업 ── */}
      {memoAddOpen && (
        <div
          onClick={() => setMemoAddOpen(false)}
          className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">메모 추가</h2>
            </div>
            <input
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="메모 제목"
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none mb-3"
            />
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
            />
            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              {authUser && authStatus === "approved"
                ? "※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다."
                : "※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMemoAddOpen(false)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => { addMemo(); setMemoAddOpen(false); }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메모 수정 팝업 ── */}
      {selectedMemo && (
        <div className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">메모 수정</h2>
              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      changeMemoColor(selectedMemo.id, color.value);
                      setSelectedMemo({ ...selectedMemo, color: color.value, updatedAt: new Date().toISOString() });
                    }}
                    className={`w-7 h-7 rounded-full border transition hover:scale-105 cursor-pointer ${
                      selectedMemo.color === color.value ? "ring-2 ring-gray-400 ring-offset-2" : ""
                    } ${color.className}`}
                  />
                ))}
                <button
                  onClick={() => setSelectedMemo(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <input
              value={selectedMemo.title}
              onChange={(e) => setSelectedMemo({ ...selectedMemo, title: e.target.value })}
              placeholder="메모 제목"
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none mb-3"
            />
            <textarea
              value={selectedMemo.content}
              onChange={(e) => setSelectedMemo({ ...selectedMemo, content: e.target.value })}
              placeholder="메모 내용을 입력하세요"
              className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
            />
            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              {authUser && authStatus === "approved"
                ? "※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다."
                : "※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMemo(selectedMemo.id)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
              >
                삭제
              </button>
              <button
                onClick={() => {
                  const nextMemos = (memos as MemoItem[]).map((m) =>
                    m.id === selectedMemo.id
                      ? { ...selectedMemo, updatedAt: new Date().toISOString() }
                      : m
                  );
                  saveMemos(nextMemos);
                  setSelectedMemo(null);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메모 삭제 확인 팝업 ── */}
      {deleteMemoConfirmOpen && (
        <div className="fixed inset-0 z-[1500] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-black text-gray-900 mb-2">메모 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">이 메모를 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteMemoConfirmOpen(false); setDeleteMemoId(null); }}
                className="flex-1 h-11 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteMemo}
                className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 계산기 컴포넌트 ── */}
      <CalculatorComp />
    </div>
  );
}

// ─────────────────────────────────────────────
// PIN 키패드
// ─────────────────────────────────────────────
function PinKeypad({ onPress }: { onPress: (val: string) => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key, i) => {
        if (key === "") return <div key={i} />;
        return (
          <button
            key={i}
            onClick={() => onPress(key)}
            className={`h-14 rounded-2xl text-lg font-semibold transition active:scale-95 cursor-pointer ${
              key === "del"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {key === "del" ? "⌫" : key}
          </button>
        );
      })}
    </div>
  );
}
function CustomerTab({ spreadsheetUrl, onSaveUrl }: { spreadsheetUrl: string | null; onSaveUrl: (url: string) => Promise<void> }) {
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);

  const getEmbedUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/edit?rm=minimal&embedded=true`;
  };

  const embedUrl = spreadsheetUrl ? getEmbedUrl(spreadsheetUrl ) : null;

  const handleSave = async () => {
    if (!urlInput.trim()) return;
    setSaving(true);
    await onSaveUrl(urlInput.trim());
    setSaving(false);
    setUrlInputOpen(false);
    setUrlInput("");
  };

  return (
    <div className="w-full">
           {embedUrl && (
        <iframe
          src={embedUrl}
          className="w-full rounded-2xl border border-gray-200 shadow"
          style={{ height: "85vh" }}
          frameBorder="0"
          allowFullScreen
        />
      )}
           
            <div className="flex items-center gap-5 mt-5 flex-wrap">
        <a
          href="https://docs.google.com/spreadsheets/d/1AXjvjrINd5GwRRM-WuBeV2_AFKDmAWZDKlOD_uyQhzg/copy"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 h-9 bg-green-50 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition flex items-center gap-1.5"
        >
          📥 고객관리 시트 다운로드
        </a>

 <a
    href="/excel/보장분석 리포트.xlsx"
    download
    className="px-4 h-9 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5"
  >
    📊 보장분석 리포트 다운로드
  </a>


        
        <button
          onClick={( ) => { setUrlInput(spreadsheetUrl || ""); setUrlInputOpen(true); }}
          className="ml-auto px-4 h-9 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition cursor-pointer"
        >
          {embedUrl ? "URL 변경" : "스프레드시트 연결"}
        </button>
      </div>


      {!embedUrl && (
  <div className="h-[70vh] flex flex-col items-center justify-center gap-2">
    <p className="text-gray-400 text-sm">
      연결된 스프레드시트가 없습니다.
    </p>
  </div>
)}

      

      {urlInputOpen && (
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900">스프레드시트 URL 설정</span>
              <button onClick={() => setUrlInputOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition mb-4"
            />
                       <div className="flex gap-3">
              <button onClick={() => setUrlInputOpen(false)} className="flex-1 h-11 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer">취소</button>
              {spreadsheetUrl && (
                <button
                  onClick={async () => { setSaving(true); await onSaveUrl(""); setSaving(false); setUrlInputOpen(false); setUrlInput(""); }}
                  disabled={saving}
                  className="flex-1 h-11 rounded-2xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                >
                  삭제
                </button>
              )}
              <button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer disabled:opacity-50">
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

