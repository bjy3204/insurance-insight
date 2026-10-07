"use client";
import DiaryTab from "./DiaryTab";
import MemoBoard from "@/app/components/memos/MemoBoard";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { Menu,
  LayoutGrid,
  ArrowLeft,
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
import PersonalSidebar from "./PersonalSidebar";
import ProfileSettingsTab from "./ProfileSettingsTab";
import type { PlantStage } from "./PlantSVG";
import CalendarTab from "./CalendarTab";

import AiMessageTab from "./AiMessageTab";
import NoticeTab from "./NoticeTab";



// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────
type ActiveTab =
  | "memo"
  | "diary"
  | "home"
  | "calendar"
  | "ai"
  | "customer"
  | "notice"
  | "settings";

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
  { id: "memo" as ActiveTab, label: "메모", icon: NotebookPen },
  { id: "diary" as ActiveTab, label: "일기", icon: BookOpen },
  { id: "calendar" as ActiveTab, label: "캘린더", icon: CalendarDays },
  { id: "ai" as ActiveTab, label: "AI메시지", icon: MessageSquare },
];

const HOME_MENU_ITEMS = [
  { id: "dday", label: "D-Day", desc: "중요한 날짜 표시", icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "schedule", label: "오늘 일정", desc: "오늘 등록된 일정", icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "checklist", label: "체크리스트", desc: "오늘 할 일 관리", icon: CheckSquare, color: "text-green-500", bg: "bg-green-50" },
  { id: "memo", label: "메모", desc: "개인 메모 확인", icon: NotebookPen, color: "text-yellow-500", bg: "bg-yellow-50" },
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
  const [plantPopupOpen, setPlantPopupOpen] = useState(false);
  const [sidebarPlantStage, setSidebarPlantStage] = useState<PlantStage>("seed");
  const [tabs, setTabs] = useState(TABS);

  // 설정 드롭다운
  const [settingOpen, setSettingOpen] = useState(false);
const [sidebarOpen, setSidebarOpen] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [homeMenuSettingOpen, setHomeMenuSettingOpen] = useState(false);
const [hiddenHomeMenus, setHiddenHomeMenus] = useState<string[]>([]);
const settingRef = useRef<HTMLDivElement>(null);


  // 개인설정 탭
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
    <div data-personal-space="true" className="min-h-screen bg-gray-100">

      {/* ── 헤더 ── */}
      <header data-page-header="true" className="sticky top-0 z-50 bg-white border-b border-black shadow-sm overflow-visible">
  <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">

            {/* 메인으로 이동 */}
            <button data-header-control="true"
              onClick={() => router.push("/")}
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
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

  
</div>

<button data-header-control="true" aria-label="개인공간 메뉴" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(v => !v)} className="absolute right-0 w-10 h-10 rounded-full md:!hidden border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Menu className="w-5 h-5 text-gray-500" /></button>
<div ref={settingRef} className="absolute right-0 hidden md:block" onKeyDown={event => { if (event.key === "Escape") setSettingOpen(false); }}>
  <button type="button" data-header-control="true" aria-label="도구 메뉴" aria-expanded={settingOpen} aria-controls="personal-header-tools" onClick={() => setSettingOpen(open => !open)}><LayoutGrid /></button>
  {settingOpen && <div id="personal-header-tools" className="absolute right-0 top-12 z-[1000] w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
    <button type="button" onClick={() => { window.dispatchEvent(new Event("open-memo-manager")); setSettingOpen(false); }} className="block w-full px-4 py-3 text-sm font-bold text-gray-700 text-center hover:bg-gray-50 cursor-pointer">메모장</button>
    {[{ label: "계산기", event: "open-calculator" }, { label: "환율변환기", event: "open-currency-converter" }].map(item => <button key={item.event} type="button" onClick={() => { setSettingOpen(false); window.dispatchEvent(new CustomEvent(item.event)); }} className="block w-full border-t border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 text-center hover:bg-gray-50 cursor-pointer">{item.label}</button>)}
  </div>}
</div>
          </div>
        </div>
      </header>

<PersonalSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} onPlantOpen={() => { setPlantPopupOpen(open => !open); }} nickname={settings?.nickname || "회원"} plantStage={sidebarPlantStage} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} activeTab={activeTab} tabs={tabs} onSelect={id => setActiveTab(id as ActiveTab)}
 shortcuts={([{type:"kakao",name:settings?.kakao_name,icon:settings?.kakao_icon},{type:"mysite",name:settings?.my_site_name,icon:settings?.my_site_icon},{type:"spreadsheet",name:settings?.spreadsheet_name,icon:settings?.spreadsheet_icon}] as const).map(link => ({id:link.type,label:link.name || "바로가기 추가",icon:LINK_ICONS.find(item => item.id === (link.icon || "CirclePlus"))?.icon || CirclePlus,onClick:() => handleUrlButtonClick(link.type)}))}
 onSettings={() => { setActiveTab("settings"); setSidebarOpen(false); }} />
<div className={`transition-[padding] duration-200 motion-reduce:transition-none ${sidebarCollapsed ? "md:pl-0" : "md:pl-24"}`}><div className="min-w-0">
      {/* ── 탭 콘텐츠 ── */}
      <main data-page-content="true" className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8">
       {activeTab === "memo" && <MemoBoard />}
       {activeTab === "diary" && <DiaryTab />}
       <div className={activeTab === "home" ? "block" : "hidden"}>
  <HomeTab
  view="home"
  settings={settings}
  hiddenHomeMenus={hiddenHomeMenus}
  onPlantStageChange={setSidebarPlantStage}
  plantPopupOpen={plantPopupOpen}
  onPlantPopupClose={() => setPlantPopupOpen(false)}
/>
</div>

<div className={activeTab === "calendar" ? "block" : "hidden"}>
  <CalendarTab />
</div>

<div className={activeTab === "ai" ? "block" : "hidden"}>
  <AiMessageTab active={activeTab === "ai"} />
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
  <NoticeTab active={activeTab === "notice"} />
</div>

        

{activeTab === "settings" && (
  <div className="space-y-5">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <ProfileSettingsTab onSaved={loadSettings} />
      <section className="personal-grid bg-white p-5 md:p-6 space-y-4">
<h2 className="text-base font-bold text-gray-900">바로가기 · 개인공간 PIN</h2>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">바로가기 1</label>
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
  <input data-ui-field="true"
    value={settingForm.kakao_name}
    onChange={(e) => setSettingForm((f) => ({ ...f, kakao_name: e.target.value }))}
    placeholder="버튼 이름"
    className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

                <input data-ui-field="true"
                  value={settingForm.kakao_url}
                  onChange={(e) => setSettingForm((f) => ({ ...f, kakao_url: e.target.value }))}
                  placeholder="https://"
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
                />
              </div>
              <div>
  <label className="text-xs text-gray-500 font-semibold mb-1 block">바로가기 2</label>
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
    <input data-ui-field="true"
      value={settingForm.my_site_name}
      onChange={(e) => setSettingForm((f) => ({ ...f, my_site_name: e.target.value }))}
      placeholder="버튼 이름"
      className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
    />
  </div>
  <input data-ui-field="true"
    value={settingForm.my_site_url}
    onChange={(e) => setSettingForm((f) => ({ ...f, my_site_url: e.target.value }))}
    placeholder="https://"
    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

              <div>
  <label className="text-xs text-gray-500 font-semibold mb-1 block">바로가기 3</label>
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
    <input data-ui-field="true"
      value={settingForm.spreadsheet_name}
      onChange={(e) => setSettingForm((f) => ({ ...f, spreadsheet_name: e.target.value }))}
      placeholder="버튼 이름"
      className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
    />
  </div>
  <input data-ui-field="true"
    value={settingForm.spreadsheet_url}
    onChange={(e) => setSettingForm((f) => ({ ...f, spreadsheet_url: e.target.value }))}
    placeholder="https://"
    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
  />
</div>

              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">개인공간 PIN 변경 (4자리)</label>
                <div className="relative">
                  <input data-ui-field="true"
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
                  <input data-ui-field="true"
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
                
                {settingSaving ? "저장 중..." : "바로가기 · PIN 저장"}
              </button>
            </section>
    </div>
  </div>
)}
      </main>

</div></div>
     {/* ── URL 설정 팝업 ── */}
{urlPopupType && (
  <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-visible">
      <div data-popup-header="true" className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between rounded-t-3xl">
        <span className="font-bold text-sm">{urlPopupMeta[urlPopupType].label}</span>
        <button data-popup-close="true"
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

          <input data-ui-field="true"
            value={urlPopupName}
            onChange={(e) => setUrlPopupName(e.target.value)}
            placeholder="버튼 이름"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 transition"
          />
        </div>

        <input data-ui-field="true"
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
            className="flex-1 h-10 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
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
  <div data-popup-frame="true" className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] md:max-w-2xl h-[82vh] md:h-auto overflow-hidden flex flex-col">
      <div data-popup-header="true" className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between">
        <span data-popup-title="true" className="font-bold text-sm">홈 메뉴 변경</span>

        <button data-popup-close="true"
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
className={`personal-grid relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
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
className={`personal-grid relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
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
className={`personal-grid relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 ${
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

      {/* ── 메모장 팝업 ── */}
      

      

      {/* ── 메모 추가 팝업 ── */}
      

      {/* ── 메모 수정 팝업 ── */}
      

      {/* ── 메모 삭제 확인 팝업 ── */}
      

      {/* ── 계산기 컴포넌트 ── */}

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
          className="personal-grid w-full rounded-2xl border border-gray-200 shadow"
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
              <button data-popup-close="true" onClick={() => setUrlInputOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <input data-ui-field="true"
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
              <button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50">
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

