"use client";
import AccessRestrictedPage from "@/app/components/AccessRestrictedPage";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import PolicyInsertsIcon from "@/app/components/PolicyInsertsIcon";

import CustomerTab from "./CustomerSpreadsheetTab";
import DiaryTab from "./DiaryTab";
import MemoBoard from "@/app/components/memos/MemoBoard";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { chooseCustomerTemplate } from "@/lib/google/customer-sheet-picker";
import { useAuth } from "@/app/components/AuthProvider";
import { Menu,
  LayoutGrid,
  ArrowLeft,
  SlidersHorizontal,
  X,
  Lock,
  Users,
  ClipboardList,
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
import { PERSONAL_HOME_ENABLED } from "./personal-features";
import CustomerReminderNotice from "@/app/features/home/components/CustomerReminderNotice";
import PersonalSidebar from "./PersonalSidebar";
import { useSharedHomeController } from "@/app/features/home/HomeControllerProvider";
import PersonalSettingsDialog from "./PersonalSettingsDialog";
import AccountPinCheck from "@/app/features/home/components/AccountPinCheck";
import type { PlantStage } from "./PlantSVG";
import CalendarTab from "./CalendarTab";

import AiMessageTab from "./AiMessageTab";
import NoticeTab from "./NoticeTab";
import CustomerManagementTab from "./CustomerManagementTab";
import CoverageAnalysisTab from "./CoverageAnalysisTab";
import PolicyInsertsEditor from "@/app/policy-inserts/PolicyInsertsEditor";
import SpreadsheetIcon from "./SpreadsheetIcon";
import { normalizePersonalMenuOrder, reorderPersonalMenu, SHORTCUT_ORDER } from "./personal-menu-order";



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
  | "policy-inserts"
  | "customer-management"
  | "coverage-analysis"
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
// Keep the unfinished report available locally while hiding it in production.
const COVERAGE_ANALYSIS_ENABLED = process.env.NODE_ENV !== "production";
const TABS = [
  { id: "home" as ActiveTab, label: "홈", icon: BookOpen },
  { id: "customer-management" as ActiveTab, label: "고객관리", icon: Users },
  { id: "coverage-analysis" as ActiveTab, label: "보장분석표", icon: ClipboardList },
  { id: "policy-inserts" as ActiveTab, label: "보험 증권 속지", icon: PolicyInsertsIcon },
  { id: "ai" as ActiveTab, label: "AI메시지", icon: MessageSquare },
  { id: "notice" as ActiveTab, label: "안내장", icon: FileText },
  { id: "customer" as ActiveTab, label: "스프레드시트", icon: SpreadsheetIcon },
  { id: "memo" as ActiveTab, label: "메모", icon: NotebookPen },
  { id: "diary" as ActiveTab, label: "일기", icon: BookOpen },
  { id: "calendar" as ActiveTab, label: "캘린더", icon: CalendarDays },
].filter(tab => (process.env.NODE_ENV !== "production" || tab.id !== "customer-management") && (COVERAGE_ANALYSIS_ENABLED || tab.id !== "coverage-analysis") && (PERSONAL_HOME_ENABLED || tab.id !== "home"));
const DEFAULT_MENU_ORDER = [...TABS.map(tab => tab.id), ...SHORTCUT_ORDER.map(id => `shortcut:${id}`)];

const HOME_MENU_ITEMS = [
  { id: "dday", label: "D-Day", desc: "중요한 날짜 표시", icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50" },
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
export default function PersonalSpacePage() {
  const controller = useSharedHomeController();
  const { authUser, authStatus, authRole, authLoading } = useAuth();
  const promptedUser = useRef<string | null>(null);
  const unlocked = !!authUser && (authRole === "admin" || controller.personalSpaceUserId === authUser.id);
  useEffect(() => {
    if (authLoading || !authUser || authStatus !== "approved" || unlocked || promptedUser.current === authUser.id) return;
    promptedUser.current = authUser.id;
    void controller.openCmPinPopup();
  }, [authLoading, authUser, authStatus, unlocked, controller]);
  if (authLoading) return null;
  if (authUser && authStatus === "approved" && !unlocked) return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4"><div className="text-center"><p className="mb-4 text-sm text-gray-600">개인공간 비밀번호를 입력해 주세요</p><button type="button" onClick={() => void controller.openCmPinPopup()} className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">비밀번호 입력</button></div></main>;
  return <CustomerManagePage />;
}

function CustomerManagePage() {
  const { authUser, authStatus, authLoading, memos, saveMemos } = useAuth();
  const router = useRouter();
  const accountController = useSharedHomeController();

  const [settings, setSettings] = useState<CustomerSettings | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(PERSONAL_HOME_ENABLED ? "home" : "customer-management");
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some(item => item.id === tab)) setActiveTab(tab as ActiveTab);
  }, []);
  const [plantPopupOpen, setPlantPopupOpen] = useState(false);
  const [sidebarPlantStage, setSidebarPlantStage] = useState<PlantStage>("seed");
  const [tabs, setTabs] = useState(TABS);
  const [homeContractRequested,setHomeContractRequested]=useState(false);
  const [homeCustomerRequested,setHomeCustomerRequested]=useState(false);
  useEffect(()=>{const open=()=>{setHomeCustomerRequested(true);setActiveTab("customer-management");};window.addEventListener("personal-home-add-customer",open);return()=>window.removeEventListener("personal-home-add-customer",open);},[]);
  useEffect(()=>{const open=()=>{setHomeContractRequested(true);setActiveTab("customer-management");};window.addEventListener("personal-home-add-contract",open);return()=>window.removeEventListener("personal-home-add-contract",open);},[]);
  const [shortcutOrder, setShortcutOrder] = useState(SHORTCUT_ORDER);
  const [menuSaving, setMenuSaving] = useState(false);
  const menuSavingRef = useRef(false);
  const [menuSaveError, setMenuSaveError] = useState("");

  // 설정 드롭다운
  const [settingOpen, setSettingOpen] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState<"space" | null>(null);
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

  
  const applyPersonalMenuOrder = (order: string[]) => {
    setTabs(order.map(id => TABS.find(tab => tab.id === id)).filter((tab): tab is typeof TABS[number] => !!tab));
    setShortcutOrder(order.filter(id => id.startsWith("shortcut:")).map(id => id.slice(9)));
  };
  const handlePersonalMenuReorder = async (active: string, over: string) => {
    if (!authUser || menuSavingRef.current) return;
    const previous = [...tabs.map(tab => tab.id), ...shortcutOrder.map(id => `shortcut:${id}`)];
    const next = reorderPersonalMenu(previous, active, over);
    if (next === previous) return;
    menuSavingRef.current = true;
    setMenuSaving(true);
    setMenuSaveError("");
    applyPersonalMenuOrder(next);
    try {
      const { error } = await supabase.from("customer_settings").upsert(
        { user_id: authUser.id, tab_order: next }, { onConflict: "user_id" }
      );
      if (error) throw error;
    } catch {
      applyPersonalMenuOrder(previous);
      setMenuSaveError("순서를 저장하지 못했습니다 다시 시도해 주세요");
    } finally {
      menuSavingRef.current = false;
      setMenuSaving(false);
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

applyPersonalMenuOrder(normalizePersonalMenuOrder(data?.tab_order, DEFAULT_MENU_ORDER));

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
};

    if (settingForm.new_pin) {
      if (settingForm.new_pin.length !== 4) {
        setSettingMsg("새 PIN은 4자리여야 합니다");
        setSettingSaving(false);
        return;
      }
      if (settingForm.new_pin !== settingForm.confirm_pin) {
        setSettingMsg("새 PIN이 일치하지 않습니다");
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
      setSettingMsg("저장되었습니다");
      setSettings((prev) => (prev ? { ...prev, ...updateData } : null));
      setSettingForm((f) => ({ ...f, new_pin: "", confirm_pin: "" }));
      setTimeout(() => setSettingMsg(""), 2000);
    }
    setSettingSaving(false);
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  if (!authUser || authStatus !== "approved") { return <AccessRestrictedPage paymentError={authStatus === "payment_error"}/>; }

  



  return (
    <div data-personal-space="true" data-personal-focus={activeTab === "calendar" ? "off" : activeTab === "diary" ? "diary" : "blue"} className="min-h-screen bg-gray-100">

      {/* ── 헤더 ── */}
      <header data-page-header="true" className="sticky top-0 z-50 bg-white border-b border-black shadow-sm overflow-visible">
  <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">

            {/* 메인으로 이동 */}
            <button data-icon-only="true" data-header-control="true"
              onClick={() => router.push("/")}
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* 타이틀 */}
<div className="max-w-[calc(100%-184px)] text-center md:max-w-none">
  <div className="flex min-w-0 items-center justify-center gap-2">
    <User className="w-7 h-7 shrink-0 text-blue-600" />

    <h1 className="truncate text-2xl font-black text-gray-900">
      {settings?.nickname
        ? `${settings.nickname}님의 공간`
        : "나의 공간"}
    </h1>
  </div>

  
</div>

<div ref={settingRef} className="absolute right-0 flex items-center gap-2 md:gap-[15px]" onKeyDown={event => { if (event.key === "Escape") { setSettingOpen(false); } }}>
  <div className="relative hidden md:block">
    <button data-icon-only="true" type="button" data-header-control="true" aria-label="설정" aria-haspopup="dialog" onClick={() => { setSettingsDialog("space"); setSettingOpen(false); setSettingMsg(""); }}><SlidersHorizontal /></button>
  </div>
  <div className="relative hidden md:block">
    <button data-icon-only="true" type="button" data-header-control="true" aria-label="도구 메뉴" aria-expanded={settingOpen} aria-controls="personal-header-tools" onClick={() => { setSettingOpen(open => !open); }}><LayoutGrid /></button>
  {settingOpen && <div id="personal-header-tools" className="absolute right-0 top-12 z-[1000] w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
    <button type="button" onClick={() => { window.dispatchEvent(new Event("open-memo-manager")); setSettingOpen(false); }} className="block w-full px-4 py-3 text-sm font-bold text-gray-700 text-center hover:bg-blue-50 hover:text-blue-600 cursor-pointer">메모장</button>
    {[{ label: "계산기", event: "open-calculator" }, { label: "환율변환기", event: "open-currency-converter" }].map(item => <button key={item.event} type="button" onClick={() => { setSettingOpen(false); window.dispatchEvent(new CustomEvent(item.event)); }} className="block w-full border-t border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 text-center hover:bg-gray-50 cursor-pointer">{item.label}</button>)}
  </div>}

  </div>
  <button data-icon-only="true" data-header-control="true" aria-label="개인공간 메뉴" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(v => !v)} className="flex h-10 w-10 cursor-pointer items-center justify-center md:!hidden"><Menu className="h-5 w-5"/></button>
</div>
          </div>
        </div>
      </header>

<PersonalSidebar onSettingsOpen={() => { setSettingsDialog("space"); setSettingOpen(false); setSettingMsg(""); }} collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} onPlantOpen={() => { setPlantPopupOpen(open => !open); }} nickname={settings?.nickname || "회원"} plantStage={sidebarPlantStage} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} activeTab={activeTab} tabs={tabs} onSelect={id => setActiveTab(id as ActiveTab)} onReorder={handlePersonalMenuReorder} reorderDisabled={menuSaving} reorderError={menuSaveError}
 />
<div data-personal-content="true" data-sidebar-collapsed={sidebarCollapsed} className="min-w-0"><div className="min-w-0">
      {PERSONAL_HOME_ENABLED && activeTab === "home" && <div className="hidden md:block"><CustomerReminderNotice /></div>}
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
  <CalendarTab active={activeTab === "calendar"} />
</div>

<div className={activeTab === "ai" ? "block" : "hidden"}>
  <AiMessageTab active={activeTab === "ai"} />
</div>

{activeTab === "customer-management" && <CustomerManagementTab openCustomerRequested={homeCustomerRequested} onCustomerRequestHandled={()=>setHomeCustomerRequested(false)} openContractRequested={homeContractRequested} onContractRequestHandled={()=>setHomeContractRequested(false)} />}
{activeTab === "policy-inserts" && <PolicyInsertsEditor embedded />}
{COVERAGE_ANALYSIS_ENABLED && activeTab === "coverage-analysis" && <CoverageAnalysisTab />}

<div data-compact-corners="true" className={activeTab === "customer" ? "block" : "hidden"}>
  <CustomerTab
    spreadsheetUrl={settings?.customer_url || null}
    onSaveUrl={async (url: string) => {
      if (!authUser) return;
      const { error } = await supabase.from("customer_settings").upsert(
        { user_id: authUser.id, customer_url: url },
        { onConflict: "user_id" }
      );
      if (error) throw new Error("시트 연결 정보를 저장하지 못했습니다 다시 시도해 주세요");
      setSettings((prev) => prev ? { ...prev, customer_url: url } : null);
    }}
  />
</div>

<div className={activeTab === "notice" ? "block" : "hidden"}>
  <NoticeTab active={activeTab === "notice"} />
</div>

        

      </main>

</div></div>
     {settingsDialog && <PersonalSettingsDialog title="개인공간" onClose={() => { if (!settingSaving) { setSettingsDialog(null); } }}>
             <section className="space-y-4">
              <AccountPinCheck controller={accountController} divider={false}/>
              <div className="pt-3">
                <label data-field-caption="true" className="text-xs text-gray-500 font-semibold mb-1 block">개인공간 PIN 변경 (4자리)</label>
                <div className="relative">
                  <ClearableSearchInput onClear={() => setSettingForm((f) => ({ ...f, new_pin: "".replace(/\D/g, "").slice(0, 4) }))} data-ui-field="true"
                    type={showNewPin ? "text" : "password"}
                    value={settingForm.new_pin}
                    onChange={(e) => setSettingForm((f) => ({ ...f, new_pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="새 PIN 4자리"
                    className="w-full h-11 px-4 pr-9 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-600 transition"
                  />
                  <button data-icon-only="true"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {settingForm.new_pin && (
                  <ClearableSearchInput onClear={() => setSettingForm((f) => ({ ...f, confirm_pin: "".replace(/\D/g, "").slice(0, 4) }))} data-ui-field="true"
                    type="password"
                    value={settingForm.confirm_pin}
                    onChange={(e) => setSettingForm((f) => ({ ...f, confirm_pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="새 PIN 확인"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-600 transition mt-2"
                  />
                )}
              </div>
              {settingMsg && (
                <p className={`text-xs text-center font-semibold ${settingMsg.includes("실패") || settingMsg.includes("않") ? "text-red-500" : "text-green-600"}`}>
                  {settingMsg}
                </p>
              )}
              <button data-popup-action="true"
                onClick={handleSaveSettings}
                disabled={settingSaving}
                className="w-full h-12 bg-gray-800 text-white text-sm font-bold rounded-2xl hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                
                {settingSaving ? "저장 중..." : "저장"}
              </button>
            </section>
     </PersonalSettingsDialog>}
      {homeMenuSettingOpen && (
 <div className="fixed inset-0 z-[250] bg-black/40 flex items-center justify-center px-3 py-4 md:p-4">
  <div data-popup-frame="true" className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] md:max-w-2xl h-[82vh] md:h-auto overflow-hidden flex flex-col">
      <div data-popup-header="true" className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between">
        <span data-popup-title="true" className="font-bold text-sm">홈 메뉴 변경</span>

        <button data-icon-only="true" data-popup-close="true"
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
          <button data-icon-only="true"
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
          <button data-icon-only="true"
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
