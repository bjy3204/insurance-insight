"use client";
import DiseaseCodePopup from "./claim-docs/disease-code-popup";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LIFE_DATA_YEAR,
  lifeExpectancyData,
} from "./pension-calculator/lifeExpectancyData";

import {
  npsOldAgeTable,
  npsDisabilityTable,
  npsSurvivorTable,
} from "./pension-calculator/npsTableData";

import {
  FileText,
  Calculator,
  Monitor,
  Phone,
  Building2,
  FolderOpen,
  Newspaper,
  MessageCircle,
  X,
  Megaphone,
  CircleDollarSign,
  CalendarDays,
  Landmark,
  PiggyBank,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Settings,
  NotebookPen,
  Pin,
  Eye,
  EyeOff,
  Trash2,
  Plus,
    Search,
    Pencil,
  User,
  Globe,
  Home as HomeIcon,
  Percent,
  Users,
  Send,
BookOpen
} from "lucide-react";

import AuthButton from "@/components/AuthButton";
import ResourceExplorer from "./components/ResourceExplorer";

import CurrencyConverter from "@/app/components/CurrencyConverter";

import { useAuth } from "@/app/components/AuthProvider";
import { FaInstagram } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import { notices, noticeVersion } from "./notice/notices";
import HospitalInfoPopup from "./claim-docs/hospital-info";
import { PRESS } from "./product-public/press";
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

const defaultMenus = [
   {
  id: "customer-manage",
  title: "개인공간",
  desc: "일정  · 고객관리 · AI 메시지",
  icon: User,
  link: "/my-page",
  isDefault: true,
},
  {
    id: "insurance-system",
    title: "보험사전산",
    desc: "보험사별 전산 바로가기",
    icon: Monitor,
    link: "/insurance-system",
  },
  {
    id: "customer-center",
    title: "고객센터",
    desc: "고객센터 · 팩스번호 · 등기주소 안내",
    icon: Phone,
    link: "/customer-center",
  },

  {
  id: "auto-claim",
  title: "보험금 청구",
  desc: "무료 청구 프로그램 (추천인코드 TREE)",
  icon: Send,
  link: "https://openarena.co.kr/autoclaim/login",
},

  {
    id: "product-public",
    title: "상품공시실",
    desc: "보험사별 상품공시실 바로가기",
    icon: Building2,
    link: "/product-public",
  },
  {
    id: "claim-docs",
    title: "청구서류",
    desc: "보험금 청구서류 안내",
    icon: FileText,
    link: "/claim-docs",
  },
  {
  id: "sales-book",
  title: "세일즈북",
  desc: "상담 세일즈북 자료",
  icon: BookOpen,
  link: "#",
},
  {
    id: "calculator",
    title: "실비계산기",
    desc: "세대별 실손보험금 계산기",
    icon: Calculator,
    link: "/calculator",
  },
  {
    id: "money-value",
    title: "화폐가치계산기",
    desc: "시간의 경과에 따른 화폐가치 계산",
    icon: CircleDollarSign,
    link: "/money-value",
  },
  {
    id: "saving-calculator",
    title: "예금·적금 계산기",
    desc: "단리 · 복리 만기금액 계산",
    icon: Landmark,
    link: "/saving-calculator",
  },
  {
    id: "pension-calculator",
    title: "연금계산기",
    desc: "은퇴자금 · 연금액 · 국민연금 계산",
    icon: PiggyBank,
    link: "/pension-calculator",
  },
  {
    id: "insurance-folder",
    title: "보험인사이트 폴더",
    desc: "보험 자료 모음",
    icon: FolderOpen,
    link: "https://naver.me/FWTmVFQz",
  },
  {
    id: "lecture",
    title: "강의일정",
    desc: "보험업계 강의 일정 공유 플랫폼",
    icon: CalendarDays,
    link: "/lecture",
  },
  {
    id: "job",
    title: "이직 컨설팅",
    desc: "보험 조직 연결 컨설팅 플랫폼",
    icon: Briefcase,
    link: "/job",
  },

];



const personalMenuIcons = {
  globe: Globe,
  folder: FolderOpen,
  file: FileText,
  calculator: Calculator,
  briefcase: Briefcase,
  user: User,
};

type NpsTableTab = "노령연금" | "장애연금" | "유족연금";

type PersonalMenuIconKey = keyof typeof personalMenuIcons;

type PersonalMenuItem = {
  id: string;
  title: string;
  desc: string;
  link: string;
  iconKey: PersonalMenuIconKey;
  isPersonal: true;
};

type MenuItem = {
  id: string;
  title: string;
  desc: string;
  link: string;
  icon: any;
  iconKey?: PersonalMenuIconKey;
  isPersonal?: boolean;
};



export default function Home() {
   const { authUser, authNickname, authInstagram, authStatus, authRole, authCreatedAt, authLoading, refreshAuth, memos, saveMemos } = useAuth();
 


    const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);
  const [hiddenMenuIds, setHiddenMenuIds] = useState<string[]>([]);
  const [tempHiddenMenuIds, setTempHiddenMenuIds] = useState<string[]>([]);


    useEffect(() => {
      const loadProfile = async (userId: string) => {

       const { data: profile } = await supabase
      .from("profiles")
      .select("personal_menus, menu_order, quick_menu_keys, read_notice_ids, read_press_ids, hidden_menu_ids")

      .eq("id", userId)
      .maybeSingle();

    if (profile?.personal_menus
 && Array.isArray(profile.personal_menus)) {
      const parsedPersonalMenus = profile.personal_menus as PersonalMenuItem[];
      setPersonalMenus(parsedPersonalMenus);

      const personalMenusWithIcon = parsedPersonalMenus.map((menu) => ({
        ...menu,
        icon: personalMenuIcons[menu.iconKey],
      }));

      const mergedMenus = [...defaultMenus, ...personalMenusWithIcon];

      if (profile?.menu_order && Array.isArray(profile.menu_order)) {
        const orderIds = profile.menu_order as string[];
        const orderedMenus = orderIds
          .map((id: string) => mergedMenus.find((menu) => menu.id === id))
          .filter(Boolean) as MenuItem[];
        const missingMenus = mergedMenus.filter((menu) => !orderIds.includes(menu.id));
        const nextMenus = [...orderedMenus, ...missingMenus];
        setMenus(nextMenus);
        setTempMenus(nextMenus);
      } else {
        setMenus(mergedMenus);
        setTempMenus(mergedMenus);
      }
    } else if (profile?.menu_order && Array.isArray(profile.menu_order)) {
      const orderIds = profile.menu_order as string[];
      const orderedMenus = orderIds
        .map((id: string) => defaultMenus.find((menu) => menu.id === id))
        .filter(Boolean) as MenuItem[];
      const missingMenus = defaultMenus.filter((menu) => !orderIds.includes(menu.id));
      const nextMenus = [...orderedMenus, ...missingMenus];
      setMenus(nextMenus);
      setTempMenus(nextMenus);
    }

    if (profile?.quick_menu_keys && Array.isArray(profile.quick_menu_keys)) {
      setQuickMenuKeys(profile.quick_menu_keys as string[]);
    }

    if (profile?.read_notice_ids && Array.isArray(profile.read_notice_ids)) {
      setReadNoticeIds(profile.read_notice_ids as number[]);
    }

           if (profile?.read_press_ids && Array.isArray(profile.read_press_ids)) {
      setReadPressIds(profile.read_press_ids as number[]);
    }

    if (authStatus === "approved") {
  if (profile?.hidden_menu_ids && Array.isArray(profile.hidden_menu_ids)) {
    setHiddenMenuIds(profile.hidden_menu_ids as string[]);
    setTempHiddenMenuIds(profile.hidden_menu_ids as string[]);
  }
} else {
  const savedHiddenMenus = localStorage.getItem("hiddenMenuIds");

  if (savedHiddenMenus) {
    const parsed = JSON.parse(savedHiddenMenus);

    setHiddenMenuIds(parsed);
    setTempHiddenMenuIds(parsed);
  }
}
  };


  if (authUser) {
    loadProfile(authUser.id);
  }
}, [authUser]);
 




  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [today, setToday] = useState(0);
  const [total, setTotal] = useState(0);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const WEATHER_REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "제주",
];

const [weatherRegion, setWeatherRegion] = useState("");
const [weatherOpen, setWeatherOpen] = useState(false);
const [weather, setWeather] = useState<{
  region: string;
  temp: number;
  description: string;
  icon: string;
} | null>(null);

  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileSettingOpen, setProfileSettingOpen] = useState(false);
const [editNickname, setEditNickname] = useState("");
const [editInstagram, setEditInstagram] = useState("");
const [pinCheckPassword, setPinCheckPassword] = useState("");
const [pinCheckResult, setPinCheckResult] = useState("");

const [newPassword, setNewPassword] = useState("");
const [currentPassword, setCurrentPassword] = useState("");
const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

const [passwordResultOpen, setPasswordResultOpen] = useState(false);
const [passwordResultSuccess, setPasswordResultSuccess] = useState(false);
const passwordResultRef = useRef(false);
const passwordResultSuccessRef = useRef(false);



  const [quickOpen, setQuickOpen] = useState(false);
  const [pcQuickOpen, setPcQuickOpen] = useState(false);
const [pcQuickDirection, setPcQuickDirection] = useState<"up" | "down">("up");
const [pcQuickPos, setPcQuickPos] = useState({ x: 0, y: 0 });

const pcQuickWrapRef = useRef<HTMLDivElement | null>(null);
const pcQuickDragRef = useRef<{
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
} | null>(null);
    const [settingOpen, setSettingOpen] = useState(false);
    const [memoOpen, setMemoOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

const memoOpenRef = useRef(false);
const [menuSortOpen, setMenuSortOpen] = useState(false);
const [tempMenus, setTempMenus] = useState<MenuItem[]>(defaultMenus);
const [menuAddOpen, setMenuAddOpen] = useState(false);
const [personalMenus, setPersonalMenus] = useState<PersonalMenuItem[]>([]);
const [tempPersonalMenus, setTempPersonalMenus] = useState<PersonalMenuItem[]>([]);
const [newMenuTitle, setNewMenuTitle] = useState("");
const [newMenuDesc, setNewMenuDesc] = useState("");
const [newMenuLink, setNewMenuLink] = useState("");
const [newMenuIcon, setNewMenuIcon] =
  useState<PersonalMenuIconKey>("globe");
  const [menuManageMode, setMenuManageMode] =
  useState<"sort" | "edit" | "delete">("sort");

const [selectedPersonalMenuId, setSelectedPersonalMenuId] = useState("");
const [selectedDeleteMenuIds, setSelectedDeleteMenuIds] = useState<string[]>([]);
const [editingOriginalMenu, setEditingOriginalMenu] =
  useState<PersonalMenuItem | null>(null);
const [editIconOpen, setEditIconOpen] = useState(false);

const [mainMenuManageMode, setMainMenuManageMode] =
  useState<"normal" | "edit" | "delete">("normal");

  type PopupKey =
  | "message"
  | "notice"
  | "memo"
  | "memoDetail"
  | "menuAdd"
  | "menuSort"
  | "press"
  | "life"
  | "nps"
| "bankRate";

const [popupPositions, setPopupPositions] = useState<
  Partial<Record<PopupKey, { x: number; y: number }>>
>({});

const [popupZIndexes, setPopupZIndexes] = useState<
  Partial<Record<PopupKey, number>>
>({});

const popupZIndexRef = useRef(1500);

const bringPopupToFront = (key: PopupKey) => {
  popupZIndexRef.current += 1;

  setPopupZIndexes((prev) => ({
    ...prev,
    [key]: popupZIndexRef.current,
  }));
};

const dragPopupRef = useRef<{
  key: PopupKey;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null>(null);

const startPopupDrag = (key: PopupKey, e: any) => {
  const target = e.target as HTMLElement;

  if (target.closest("button, input, textarea, select, a")) return;

  e.preventDefault();
  bringPopupToFront(key);

  const current = popupPositions[key] || { x: 0, y: 0 };

  dragPopupRef.current = {
    key,
    startX: e.clientX,
    startY: e.clientY,
    originX: current.x,
    originY: current.y,
  };

  const handleMove = (event: PointerEvent) => {
    if (!dragPopupRef.current) return;

    const drag = dragPopupRef.current;

    setPopupPositions((prev) => ({
      ...prev,
      [drag.key]: {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
    }));
  };

  const handleUp = () => {
    dragPopupRef.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
};

const getPopupStyle = (key: PopupKey) => {
  const pos = popupPositions[key] || { x: 0, y: 0 };

  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    zIndex: popupZIndexes[key] || 1500,
  };
};

const resetPopupPosition = (key: PopupKey) => {
  setPopupPositions((prev) => ({
    ...prev,
    [key]: { x: 0, y: 0 },
  }));
};


  const [memoTitle, setMemoTitle] = useState("");

  const [memoContent, setMemoContent] = useState("");
  const [memoColor, setMemoColor] =
  useState<MemoItem["color"]>("white");
  const [memoSearch, setMemoSearch] = useState("");
  const [memoPage, setMemoPage] = useState(1);
  const [memoAddOpen, setMemoAddOpen] = useState(false);
const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
  
  
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [diseaseOpen, setDiseaseOpen] = useState(false);
const [pressOpen, setPressOpen] = useState(false);
const [selectedPress, setSelectedPress] = useState<any>(null);
const [pressSearch, setPressSearch] = useState("");
const [pressPage, setPressPage] = useState(1);
const [lifeOpen, setLifeOpen] = useState(false);
const [npsTableOpen, setNpsTableOpen] = useState(false);
const [npsTableTab, setNpsTableTab] =
  useState<NpsTableTab>("노령연금");

const [npsSearch, setNpsSearch] = useState("");

const [bankRateOpen, setBankRateOpen] = useState(false);
const [bankRateMonth, setBankRateMonth] = useState<"12" | "24">("12");
const [bankRates, setBankRates] = useState<any[]>([]);
const [bankBaseDate, setBankBaseDate] = useState("");

// ─── 개인공간 PIN 팝업 ───
const [cmPinOpen, setCmPinOpen] = useState(false);
const [cmPinState, setCmPinState] = useState<"not-approved" | "no-pin" | "locked">("locked");
const [cmPinStep, setCmPinStep] = useState<"enter" | "confirm">("enter");
const [cmPinInput, setCmPinInput] = useState("");
const [cmPinConfirm, setCmPinConfirm] = useState("");
const [cmPinError, setCmPinError] = useState("");
const cmPinInputRef = useRef("");
const cmPinStepRef = useRef<"enter" | "confirm">("enter");

const [quickMenuKeys, setQuickMenuKeys] = useState<string[]>([
  "hospital",
  "life",
  "press",
  "disease",
]);
const [tempQuickMenuKeys, setTempQuickMenuKeys] = useState<string[]>([]);
const [contextMenu, setContextMenu] = useState<{
  x: number;
  y: number;
  type: "mainPersonal" | "quickMenu" | "menuManage" | "memo";
  id: string;
  index?: number;
} | null>(null);

const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [quickLimitOpen, setQuickLimitOpen] = useState(false);
const [quickMenuSelectOpen, setQuickMenuSelectOpen] = useState(false);
const [quickDeleteConfirmOpen, setQuickDeleteConfirmOpen] =
  useState(false);
  const [quickDeleteKey, setQuickDeleteKey] = useState<string | null>(null);
const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
const [saveConfirmType, setSaveConfirmType] =
  useState<"main" | "popup">("main");
  const [saveConfirmMessage, setSaveConfirmMessage] =
  useState("변경 내용이 저장되었습니다.");
  const [menuLinkAlertOpen, setMenuLinkAlertOpen] = useState(false);
const [salesBookAlertOpen, setSalesBookAlertOpen] = useState(false);

const [lifeGender, setLifeGender] = useState<"남성" | "여성">("남성");
const [lifeAge, setLifeAge] = useState("");
const [noticePage, setNoticePage] = useState(1);
const [selectedNotice, setSelectedNotice] = useState<any>(null);
const [noticeImageIndex, setNoticeImageIndex] = useState(0);
const [popupNoticeImageIndex, setPopupNoticeImageIndex] = useState(0);
  const [fixMessage, setFixMessage] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [contact, setContact] = useState("");
const noticesPerPage = 10;

const [hasUpdate, setHasUpdate] = useState(false);
const [readNoticeIds, setReadNoticeIds] = useState<(number | string)[]>([]);
const [dbNotices, setDbNotices] = useState<any[]>([]);
const [dbCategories, setDbCategories] = useState<any[]>([]);
const [popupNotice, setPopupNotice] = useState<any | null>(null);
const [popupNoticeClosed, setPopupNoticeClosed] = useState(false);

// DB 공지를 notices.ts 형식으로 변환해서 합치기
const dbNoticesFormatted = dbNotices.map((n: any) => {

  const cat = dbCategories.find((c: any) => c.id === n.category_id);
  return {
    id: `db_${n.id}`,
    title: n.title,
    content: n.content,
    category: cat?.name || "",
    categoryColor: cat?.color || "blue",
    date: (() => {
      const d = new Date(n.created_at);
      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    })(),
    isDb: true,
    dbId: n.id,
    image_url: n.image_url || null,
    image_urls: n.image_urls || [],
  };
});

const allNotices = [...dbNoticesFormatted, ...notices];
const totalNoticePages = Math.ceil(allNotices.length / noticesPerPage);

const pagedNotices = allNotices.slice(
  (noticePage - 1) * noticesPerPage,
  noticePage * noticesPerPage
);





const lifeAgeNumber = lifeAge === "" ? null : Number(lifeAge);

const selectedLife =
  lifeAgeNumber === null
    ? null
    : lifeExpectancyData[
        lifeGender as keyof typeof lifeExpectancyData
      ]?.[
        lifeAgeNumber as keyof (typeof lifeExpectancyData)["남성"]
      ];

const expectYears = selectedLife?.expect || 0;

const averageSickYears =
  lifeGender === "남성"
    ? 16.2
    : 20.2;

const sickYears = Math.min(
  averageSickYears,
  expectYears
);

const healthyYears = Math.max(
  expectYears - sickYears,
  0
);

const expectAge =
  Number(lifeAge || 0) + expectYears;
  const sickStartAge =
  Number(lifeAge || 0) + healthyYears;
const [readPressIds, setReadPressIds] = useState<number[]>([]);

const currentNpsTable =
  npsTableTab === "노령연금"
    ? npsOldAgeTable
    : npsTableTab === "장애연금"
    ? npsDisabilityTable
    : npsSurvivorTable;

const filteredNpsTable = currentNpsTable.filter((row: any) =>
  `${row.income} ${row.premium}`
    .replaceAll(",", "")
    .includes(npsSearch.replaceAll(",", ""))
);

useEffect(() => {
  const fetchDbNotices = async () => {
    const { data: cats } = await supabase.from("notice_categories").select("*");
    if (cats) setDbCategories(cats);
    const { data: nts } = await supabase.from("notices_db").select("*").order("created_at", { ascending: false });
    console.log("notices_db 데이터:", nts);
    if (!nts) return;
    setDbNotices(nts);


    // 팝업 공지 처리
    const now = new Date();
    const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
    const popupTarget = nts.find((n: any) => {
      if (!n.is_popup) return false;
      if (seenIds.includes(n.id)) return false;
      if (n.popup_start_date && n.popup_start_date > today) return false;
      if (n.popup_end_date && n.popup_end_date < today) return false;
      return true;
    });
    if (popupTarget) setPopupNotice(popupTarget);

    // 빨간점: 읽지 않은 DB 공지가 있으면
    const seenNoticeIds: string[] = JSON.parse(localStorage.getItem("seen_db_notice_ids") || "[]");
    const hasUnread = nts.some((n: any) => !seenNoticeIds.includes(n.id));
    if (hasUnread) setHasUpdate(true);
  };
  fetchDbNotices();
}, []);

useEffect(() => {
  const fetchBankRates = async () => {

    try {
      const res = await fetch(
        `/api/bank-rates?month=${bankRateMonth}`
      );

      const data = await res.json();

      setBankRates(data);

      if (data.length > 0) {
        const baseMonth = data[0].baseMonth;

        if (baseMonth?.length === 6) {
          setBankBaseDate(
            `${baseMonth.slice(0, 4)}.${baseMonth.slice(4, 6)}`
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  fetchBankRates();
}, [bankRateMonth]);

const quickMenuOptions = [
  {
    key: "hospital",
    title: "병원정보 검색",
    action: () => {
      setHospitalOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "life",
    title: "기대수명 계산기",
    action: () => {
      resetPopupPosition("life");
setLifeOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "press",
    title: "보도자료",
    action: () => {
      resetPopupPosition("press");
setPressOpen(true);
      setSelectedPress(null);
      setPressSearch("");
      setPressPage(1);
      setQuickOpen(false);
    },
  },
  {
    key: "disease",
    title: "상병코드 검색",
    action: () => {
      setDiseaseOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "nps",
    title: "국민연금 예상 연금월액표",
    action: () => {
      resetPopupPosition("nps");
setNpsTableOpen(true);
      setQuickOpen(false);
    },
  },
      {
    key: "bankRate",
    title: "예금금리 비교",
    action: () => {
      resetPopupPosition("bankRate");
      setBankRateOpen(true);
      setQuickOpen(false);
      setPcQuickOpen(false);
    },
  },
  // 승인 구독자 전용 - 환율 변환기
  ...(authStatus === "approved" ? [{
    key: "currencyConverter",
    title: "환율 변환기",
    action: () => {
      window.dispatchEvent(new CustomEvent("open-currency-converter"));
      setQuickOpen(false);
      setPcQuickOpen(false);
    },
  }] : []),
  ...(authStatus === "approved" ? [{
  key: "calculator",
  title: "계산기",
  action: () => {
    window.dispatchEvent(new CustomEvent("open-calculator"));
    setQuickOpen(false);
    setPcQuickOpen(false);
  },
}] : []),
...(authStatus === "approved" ? [{
  key: "insuranceCode",
  title: "보험사 코드",
  action: () => {
    window.dispatchEvent(new CustomEvent("open-insurance-code"));
    setQuickOpen(false);
    setPcQuickOpen(false);
  },
}] : []),
];



const sortedPress = [...PRESS.items].sort(
  (a, b) =>
    new Date(b.date.replace(/\./g, "-")).getTime() -
    new Date(a.date.replace(/\./g, "-")).getTime()
);

const filteredPress = sortedPress.filter((item) =>
  `${item.title} ${item.date} ${item.source} ${item.body}`
    .toLowerCase()
    .includes(pressSearch.toLowerCase())
);

const PRESS_PER_PAGE = 10;

const totalPressPages = Math.ceil(filteredPress.length / PRESS_PER_PAGE);

const paginatedPress = filteredPress.slice(
  (pressPage - 1) * PRESS_PER_PAGE,
  pressPage * PRESS_PER_PAGE
);

const MEMOS_PER_PAGE = 6;

const sortedMemos = [...memos].sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

  return (
    new Date(b.updatedAt).getTime() -
    new Date(a.updatedAt).getTime()
  );
});

const filteredMemos = sortedMemos.filter((memo) =>
  `${memo.title} ${memo.content}`
    .toLowerCase()
    .includes(memoSearch.toLowerCase())
);

const totalMemoPages = Math.max(
  1,
  Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);

const visibleMemos = sortedMemos.filter((memo) => memo.visible);

const getMemoColorClass = (color?: MemoItem["color"]) => {
  switch (color) {
    case "blue":
      return "bg-blue-50/80 border-blue-100";
    case "yellow":
      return "bg-yellow-50/80 border-yellow-100";
    case "red":
      return "bg-red-50/80 border-red-100";
    case "clear":
  return "bg-white/40 border-gray-200";
    case "white":
    default:
      return "bg-white border-gray-200";
  }
};

const memoColorOptions: {
  value: MemoItem["color"];
  className: string;
}[] = [
  {
    value: "white",
    className: "bg-white border-gray-300 hover:bg-gray-50",
  },
  {
    value: "blue",
    className: "bg-blue-50 border-blue-100 hover:bg-blue-100",
  },
  {
    value: "yellow",
    className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
  },
  {
    value: "red",
    className: "bg-red-50 border-red-100 hover:bg-red-100",
  },
  {
  value: "clear",
  className:
    "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
},
];

  useEffect(() => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone;

  if (isStandalone) {
    setShowInstall(false);
  } else {
    setShowInstall(true);
  }

  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstall(true);
  };

  window.addEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );

  const fetchVisitor = async (hit = false) => {
    try {
    const res = await fetch(`/api/visitor${hit ? "?hit=1" : ""}`, {
      cache: "no-store",
    });

    const data = await res.json();

    setToday(data.today || 0);
    setTotal(data.total || 0);
  } catch (error) {
    console.log(error);
  }
};

    const todayKey = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Seoul",
});
const visited = localStorage.getItem("visitedDate");

if (visited !== todayKey) {
  fetchVisitor(true);
  localStorage.setItem("visitedDate", todayKey);
} else {
  fetchVisitor(false);
}


    const savedVersion = localStorage.getItem("noticeRead");

if (savedVersion != noticeVersion.toString()) {
  setHasUpdate(true);
}
const savedReadNoticeIds = localStorage.getItem("readNoticeIds");

if (savedReadNoticeIds) {
  setReadNoticeIds(JSON.parse(savedReadNoticeIds));
  const savedReadPressIds = localStorage.getItem("readPressIds");

if (savedReadPressIds) {
  setReadPressIds(JSON.parse(savedReadPressIds));
}
}
  return () => {
  window.removeEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );
};
}, []);

useEffect(() => {
  memoOpenRef.current = memoOpen;
}, [memoOpen]);

useEffect(() => {
  const savedRegion =
    localStorage.getItem("weather-region") || "서울";

  setWeatherRegion(savedRegion);
}, []);

useEffect(() => {
  if (!weatherRegion) return;

  const fetchWeather = async () => {
    try {
      const res = await fetch(
        `/api/weather?region=${weatherRegion}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      console.log("날씨 지역:", weatherRegion);
      console.log("날씨 데이터", data);

      setWeather(data);
      localStorage.setItem("weather-region", weatherRegion);
    } catch (error) {
      console.log(error);
    }
  };

  fetchWeather();
}, [weatherRegion]);



useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;
    const targetMemo = memos.find((memo) => memo.id === memoId);
    if (!targetMemo) return;
    setSelectedMemo(targetMemo);
    if (memoOpenRef.current) {
      setMemoOpen(true);
    }
    resetPopupPosition("memoDetail");
  };

  const openMemoContextMenu = (event: any) => {
  const { x, y, id } = event.detail;

  setContextMenu({
    x,
    y,
    type: "memo",
    id,
  });
};
  window.addEventListener("open-memo-detail", openMemoDetail);
  window.addEventListener("open-memo-context-menu", openMemoContextMenu);

  return () => {
    window.removeEventListener("open-memo-detail", openMemoDetail);
    window.removeEventListener("open-memo-context-menu", openMemoContextMenu);
  };
}, [memos]);

useEffect(() => {
  const savedPersonalMenus = localStorage.getItem("personalMenus");
  const parsedPersonalMenus: PersonalMenuItem[] = savedPersonalMenus
    ? JSON.parse(savedPersonalMenus)
    : [];

    setPersonalMenus(parsedPersonalMenus);

  const personalMenusWithIcon = parsedPersonalMenus.map((menu) => ({
    ...menu,
    icon: personalMenuIcons[menu.iconKey],
  }));

  const mergedMenus = [...defaultMenus, ...personalMenusWithIcon];

  const savedOrder = localStorage.getItem("insurance-menu-order");

  if (!savedOrder) {
    setMenus(mergedMenus);
    setTempMenus(mergedMenus);
    return;
  }

  try {
    const orderIds = JSON.parse(savedOrder);

    const orderedMenus = orderIds
      .map((id: string) => mergedMenus.find((menu) => menu.id === id))
      .filter(Boolean);

    const missingMenus = mergedMenus.filter(
      (menu) => !orderIds.includes(menu.id)
    );

    const nextMenus = [...orderedMenus, ...missingMenus];

    setMenus(nextMenus);
    setTempMenus(nextMenus);
  } catch {
    setMenus(mergedMenus);
    setTempMenus(mergedMenus);
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(menus.map((menu) => menu.id))
  );
}, [menus]);



useEffect(() => {
  const handleClick = () => {
    setSettingOpen(false);
    setWeatherOpen(false);
    setUserMenuOpen(false);
  };

  if (settingOpen || weatherOpen || userMenuOpen) {
    window.addEventListener("click", handleClick);
  }

  return () => {
    window.removeEventListener("click", handleClick);
  };
}, [settingOpen, weatherOpen, userMenuOpen]);

useEffect(() => {
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  window.addEventListener("pointerdown", closeContextMenu);

  return () => {
    window.removeEventListener("pointerdown", closeContextMenu);
  };
}, []);

const handleMenuSortDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setTempMenus((items) => {
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    return arrayMove(items, oldIndex, newIndex);
  });
};

const getCommittedTempPersonalMenus = () => {
  if (!selectedPersonalMenuId) return tempPersonalMenus;

  return tempPersonalMenus.map((menu) =>
    menu.id === selectedPersonalMenuId
      ? {
          ...menu,
          title: newMenuTitle.trim() || menu.title,
          desc: newMenuDesc.trim() || "개인 추가 메뉴",
          link: newMenuLink.trim() || menu.link,
          iconKey: newMenuIcon,
        }
      : menu
  );
};

const commitEditingMenuToTemp = () => {
  const nextTempPersonalMenus = getCommittedTempPersonalMenus();
  setTempPersonalMenus(nextTempPersonalMenus);
  return nextTempPersonalMenus;
};

const closeEditingMenu = () => {
  setSelectedPersonalMenuId("");
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setEditIconOpen(false);
};

const startEditPersonalMenu = (menu: PersonalMenuItem) => {
  commitEditingMenuToTemp();

  setEditingOriginalMenu(menu);

  setSelectedPersonalMenuId(menu.id);
  setNewMenuTitle(menu.title);
  setNewMenuDesc(menu.desc);
  setNewMenuLink(menu.link);
  setNewMenuIcon(menu.iconKey);
  setEditIconOpen(false);
};

const saveEditingMenuAndClose = () => {
  commitEditingMenuToTemp();
  setEditingOriginalMenu(null);
  closeEditingMenu();
};

const cancelEditingMenu = () => {
  setTempMenus(menus);
setTempPersonalMenus(personalMenus);
setTempQuickMenuKeys(quickMenuKeys);

  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);

  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
};

const savePersonalMenuEdits = () => {
  const nextPersonalMenus = commitEditingMenuToTemp();

  savePersonalMenus(nextPersonalMenus);

  const nextMenus = menus.map((menu) => {
    const editedMenu = nextPersonalMenus.find((item) => item.id === menu.id);

    if (!editedMenu) return menu;

    return {
      ...menu,
      title: editedMenu.title,
      desc: editedMenu.desc,
      link: editedMenu.link,
      iconKey: editedMenu.iconKey,
      icon: personalMenuIcons[editedMenu.iconKey],
      isPersonal: true,
    };
  });

  setMenus(nextMenus);
  setTempMenus(nextMenus);

  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(nextMenus.map((menu) => menu.id))
  );

  setEditingOriginalMenu(null);
  closeEditingMenu();
};

const hasMenuManageChanges = () => {
  const committedPersonalMenus = getCommittedTempPersonalMenus();

  const normalizePersonalMenus = (list: PersonalMenuItem[]) =>
    list.map((menu) => ({
      id: menu.id,
      title: menu.title,
      desc: menu.desc,
      link: menu.link,
      iconKey: menu.iconKey,
    }));

  return (
    JSON.stringify(normalizePersonalMenus(committedPersonalMenus)) !==
      JSON.stringify(normalizePersonalMenus(personalMenus)) ||
    JSON.stringify(tempQuickMenuKeys) !== JSON.stringify(quickMenuKeys) ||
    JSON.stringify(tempMenus.map((menu) => menu.id)) !==
      JSON.stringify(menus.map((menu) => menu.id))
  );
};

const saveMenuManageChanges = (type: "main" | "popup") => {
  const nextPersonalMenus = commitEditingMenuToTemp();

  savePersonalMenus(nextPersonalMenus);

  const personalMenusWithIcon = nextPersonalMenus.map((menu) => ({
    ...menu,
    icon: personalMenuIcons[menu.iconKey],
  }));

  const defaultMenuIds = defaultMenus.map((menu) => menu.id);

  const nextMenus =
    type === "popup"
      ? tempMenus
          .filter((menu) => defaultMenuIds.includes(menu.id) || menu.isPersonal)
          .map((menu) => {
            const editedPersonalMenu = personalMenusWithIcon.find(
              (item) => item.id === menu.id
            );

            return editedPersonalMenu || menu;
          })
      : menus
          .filter((menu) => defaultMenuIds.includes(menu.id) || menu.isPersonal)
          .map((menu) => {
            const editedPersonalMenu = personalMenusWithIcon.find(
              (item) => item.id === menu.id
            );

            return editedPersonalMenu || menu;
          });

  const missingPersonalMenus = personalMenusWithIcon.filter(
    (personalMenu) => !nextMenus.some((menu) => menu.id === personalMenu.id)
  );

  const finalMenus = [...nextMenus, ...missingPersonalMenus];

  setMenus(finalMenus);
setTempMenus(finalMenus);
setPersonalMenus(nextPersonalMenus);
setTempPersonalMenus(nextPersonalMenus);
setQuickMenuKeys(tempQuickMenuKeys);
setHiddenMenuIds(tempHiddenMenuIds);

   if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: finalMenus.map((menu) => menu.id),
      quick_menu_keys: tempQuickMenuKeys,
      hidden_menu_ids: tempHiddenMenuIds,
    }).eq("id", authUser.id).then();

 } else {
  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(finalMenus.map((menu) => menu.id))
  );

  localStorage.setItem(
    "quickMenuKeys",
    JSON.stringify(tempQuickMenuKeys)
  );

  localStorage.setItem(
    "hiddenMenuIds",
    JSON.stringify(tempHiddenMenuIds)
  );
}

  setEditingOriginalMenu(null);
  closeEditingMenu();

  setSaveConfirmType(type);
  setSaveConfirmOpen(true);
};


const goBackMainScreen = () => {
  setMainMenuManageMode("normal");
  setTempQuickMenuKeys(quickMenuKeys);
  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);
};

const deletePersonalMenu = () => {
  if (selectedDeleteMenuIds.length === 0) {
    alert("삭제할 메뉴를 선택해주세요.");
    return;
  }

  

  const nextPersonalMenus = personalMenus.filter(
    (menu) => !selectedDeleteMenuIds.includes(menu.id)
  );

  const nextMenus = menus.filter(
    (menu) => !selectedDeleteMenuIds.includes(menu.id)
  );

  savePersonalMenus(nextPersonalMenus);
  setMenus(nextMenus);
  setTempMenus(nextMenus);

    if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: nextMenus.map((menu) => menu.id),
    }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("insurance-menu-order", JSON.stringify(nextMenus.map((menu) => menu.id)));
  }

  setSelectedDeleteMenuIds([]);
  setDeleteConfirmOpen(false);


  setSelectedPersonalMenuId("");
setEditIconOpen(false);
};

const savePersonalMenus = (nextMenus: PersonalMenuItem[]) => {
  setPersonalMenus(nextMenus);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ personal_menus: nextMenus }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("personalMenus", JSON.stringify(nextMenus));
  }
};


const resetNewMenuForm = () => {
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setMenuAddOpen(false);
};

const addPersonalMenu = () => {
  if (!newMenuLink.trim()) {
    setMenuLinkAlertOpen(true);
    return;
  }

  const newMenu: PersonalMenuItem = {
    id: `personal-${crypto.randomUUID()}`,
    title: newMenuTitle.trim() || "",
    desc: newMenuDesc.trim() || "",
    link: newMenuLink.trim(),
    iconKey: newMenuIcon,
    isPersonal: true,
  };

  const newMenuWithIcon = {
    ...newMenu,
    icon: personalMenuIcons[newMenu.iconKey],
  };

  const isTemporaryAdd =
    mainMenuManageMode === "edit" || menuSortOpen;

 if (isTemporaryAdd) {
  setTempPersonalMenus((prev) => [...prev, newMenu]);
  setTempMenus((prev) => [...prev, newMenuWithIcon]);

  resetNewMenuForm();

  return;
}

  const nextPersonalMenus = [...personalMenus, newMenu];

  savePersonalMenus(nextPersonalMenus);

  const nextMenus = [...menus, newMenuWithIcon];

  setMenus(nextMenus);
  setTempMenus(nextMenus);

    if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: nextMenus.map((menu) => menu.id),
    }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("insurance-menu-order", JSON.stringify(nextMenus.map((menu) => menu.id)));
  }

  resetNewMenuForm();

  setSaveConfirmType("popup");
  setSaveConfirmMessage("메뉴가 추가되었습니다.");
  setSaveConfirmOpen(true);
};






const addMemo = async () => {
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
  saveMemos([newMemo, ...memos]);
  setMemoTitle("");
  setMemoContent("");
  setMemoColor("white");
  setMemoPage(1);
};


const updateMemo = async (id: string, field: "title" | "content", value: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, [field]: value, updatedAt: new Date().toISOString() } : memo
  );
  saveMemos(nextMemos);
};


const toggleMemoVisible = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, visible: !memo.visible } : memo
  );
  saveMemos(nextMemos);
};


const toggleMemoPinned = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? { ...memo, pinned: !memo.pinned, updatedAt: new Date().toISOString() }
      : memo
  );
  saveMemos(nextMemos);
};


const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);
  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;
  const unpinnedMemos = sortedMemos.filter((memo) => !memo.pinned);
  const pinnedMemos = sortedMemos.filter((memo) => memo.pinned);
  const oldIndex = unpinnedMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = unpinnedMemos.findIndex((memo) => memo.id === over.id);
  const reordered = arrayMove(unpinnedMemos, oldIndex, newIndex);
  const reorderedWithTime = reordered.map((memo, index) => ({
    ...memo,
    updatedAt: new Date(Date.now() - index).toISOString(),
  }));
  saveMemos([...pinnedMemos, ...reorderedWithTime]);
};


const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, color, updatedAt: new Date().toISOString() } : memo
  );
  saveMemos(nextMemos);
};


const deleteMemo = (id: string) => {
  setDeleteMemoId(id);
  setDeleteMemoConfirmOpen(true);
};

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;

  const nextMemos = memos.filter((memo) => memo.id !== deleteMemoId);
  saveMemos(nextMemos);

  if (memoPage > 1 && pagedMemos.length === 1) {
    setMemoPage((p) => Math.max(1, p - 1));
  }

  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};


// ─── 개인공간 PIN 해시 함수 ───
async function hashPinLocal(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "insurance-namu-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const openCmPinPopup = async () => {
  if (!authUser || authStatus !== "approved") {
    setCmPinState("not-approved");
    setCmPinOpen(true);
    return;
  }
  const { data } = await supabase
    .from("customer_settings")
    .select("pin_hash")
    .eq("user_id", authUser.id)
    .maybeSingle();
  cmPinInputRef.current = "";
  cmPinStepRef.current = "enter";
  setCmPinInput("");
  setCmPinConfirm("");
  setCmPinError("");
  setCmPinStep("enter");
  if (!data?.pin_hash) {
    setCmPinState("no-pin");
  } else {
    setCmPinState("locked");
  }
  setCmPinOpen(true);
};

const handleCmKeypad = async (val: string) => {
  if (cmPinState === "not-approved") return;
  if (cmPinState === "no-pin") {
    if (cmPinStepRef.current === "enter") {
      if (val === "del") {
        const next = cmPinInputRef.current.slice(0, -1);
        cmPinInputRef.current = next;
        setCmPinInput(next);
      } else if (cmPinInputRef.current.length < 4) {
        const next = cmPinInputRef.current + val;
        cmPinInputRef.current = next;
        setCmPinInput(next);
        if (next.length === 4) {
          setTimeout(() => {
            cmPinStepRef.current = "confirm";
            setCmPinStep("confirm");
            setCmPinConfirm("");
            setCmPinError("");
          }, 200);
        }
      }
    } else {
      if (val === "del") {
        setCmPinConfirm((p) => p.slice(0, -1));
      } else {
        setCmPinConfirm((prev) => {
          if (prev.length >= 4) return prev;
          const next = prev + val;
          if (next.length === 4) {
            setTimeout(async () => {
              if (cmPinInputRef.current !== next) {
                setCmPinError("PIN이 일치하지 않습니다. 다시 시도해주세요.");
                cmPinInputRef.current = "";
                cmPinStepRef.current = "enter";
                setCmPinStep("enter");
                setCmPinInput("");
                setCmPinConfirm("");
                return;
              }
              const hash = await hashPinLocal(cmPinInputRef.current);
              const { error } = await supabase.from("customer_settings").upsert(
                { user_id: authUser!.id, pin_hash: hash, pin_changed_at: new Date().toISOString() },
                { onConflict: "user_id" }
              );
              if (error) {
                setCmPinError("저장 오류: " + error.message);
                cmPinInputRef.current = "";
                cmPinStepRef.current = "enter";
                setCmPinStep("enter");
                setCmPinInput("");
                setCmPinConfirm("");
                return;
              }
              setCmPinOpen(false);
              window.location.href = "/my-page";
            }, 200);
          }
          return next;
        });
      }
    }
  } else {
    if (val === "del") {
      const next = cmPinInputRef.current.slice(0, -1);
      cmPinInputRef.current = next;
      setCmPinInput(next);
    } else if (cmPinInputRef.current.length < 4) {
      const next = cmPinInputRef.current + val;
      cmPinInputRef.current = next;
      setCmPinInput(next);
      if (next.length === 4) {
        setTimeout(async () => {
          const hash = await hashPinLocal(next);
          const { data } = await supabase
            .from("customer_settings")
            .select("pin_hash")
            .eq("user_id", authUser!.id)
            .maybeSingle();
          if (hash !== data?.pin_hash) {
            setCmPinError("PIN이 올바르지 않습니다.");
            cmPinInputRef.current = "";
            setCmPinInput("");
            return;
          }
          setCmPinOpen(false);
          window.location.href = "/my-page";
        }, 200);
      }
    }
  }
};

// ─── 개인공간 PIN 키보드 입력 ───
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!cmPinOpen) return;
    if (cmPinState === "not-approved") return;
    if (e.key >= "0" && e.key <= "9") {
      handleCmKeypad(e.key);
    } else if (e.key === "Backspace") {
      handleCmKeypad("del");
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [cmPinOpen, cmPinState]);


const openPcQuickMenu = () => {
  const wrap = pcQuickWrapRef.current;
  if (!wrap) {
    setPcQuickOpen((prev) => !prev);
    return;
  }

  const rect = wrap.getBoundingClientRect();
  const menuHeight = 420;

  const spaceTop = rect.top;
  const spaceBottom = window.innerHeight - rect.bottom;

  if (spaceBottom < menuHeight && spaceTop > spaceBottom) {
    setPcQuickDirection("up");
  } else {
    setPcQuickDirection("down");
  }

  setPcQuickOpen((prev) => !prev);
};

const startPcQuickDrag = (e: React.PointerEvent) => {
  const target = e.target as HTMLElement;

  if (target.closest("[data-pc-quick-menu]")) return;

  pcQuickDragRef.current = {
    startX: e.clientX,
    startY: e.clientY,
    originX: pcQuickPos.x,
    originY: pcQuickPos.y,
    moved: false,
  };

  const handleMove = (event: PointerEvent) => {
    if (!pcQuickDragRef.current) return;

    const dx = event.clientX - pcQuickDragRef.current.startX;
    const dy = event.clientY - pcQuickDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      pcQuickDragRef.current.moved = true;
    }

    const nextX =
  pcQuickDragRef.current.originX + dx;

const nextY =
  pcQuickDragRef.current.originY + dy;

const limitedX = Math.min(
  Math.max(nextX, -window.innerWidth + 260),
  0
);

const limitedY = Math.min(
  Math.max(nextY, -window.innerHeight + 150),
  100
);

setPcQuickPos({
  x: limitedX,
  y: limitedY,
});
  };

  const handleUp = () => {
  localStorage.setItem(
    "pcQuickPosition",
    JSON.stringify({
      x: pcQuickPos.x,
      y: pcQuickPos.y,
    })
  );

  window.removeEventListener("pointermove", handleMove);
  window.removeEventListener("pointerup", handleUp);
};

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);

};

const handleCheckPin = async () => {
  if (!authUser || !pinCheckPassword) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: pinCheckPassword,
  });
  if (error) {
    setPinCheckResult("비밀번호가 올바르지 않습니다.");
    return;
  }
  const { data } = await supabase
  .from("customer_settings")
  .select("pin_plain")
  .eq("user_id", authUser.id)
  .maybeSingle();
if (!data?.pin_plain) {
  setPinCheckResult("설정된 PIN이 없습니다.");
  return;
}
setPinCheckResult(`비밀번호: ${data.pin_plain}`);

};



const saveProfileSettings = async () => {
  if (!authUser?.email) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (!editNickname.trim()) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  if (!editInstagram.trim()) {
    alert("인스타그램 아이디를 입력해주세요.");
    return;
  }

  if (newPassword || newPasswordConfirm || currentPassword) {
    if (!currentPassword.trim()) {
      alert("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (!newPassword.trim()) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 6) {
      alert("새 비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    const { error: checkPasswordError } =
      await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });

    if (checkPasswordError) {
      alert("현재 비밀번호가 일치하지 않습니다.");
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

        if (passwordError) {
      setPasswordResultSuccess(false);
      setPasswordResultOpen(true);
      return;
    }

  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      nickname: editNickname.trim(),
      instagram_id: editInstagram.trim(),
    })
    .eq("id", authUser.id);

    if (profileError) {
    setPasswordResultSuccess(false);
    setPasswordResultOpen(true);
    return;
  }

      refreshAuth();
  setCurrentPassword("");

  setNewPassword("");
  setNewPasswordConfirm("");
      setProfileSettingOpen(false);
  
    passwordResultSuccessRef.current = true;
  passwordResultRef.current = true;
  setPasswordResultSuccess(true);
  setPasswordResultOpen(true);




};


  const sendMessage = async () => {
  if (!fixMessage.trim() && !addMessage.trim()) {
    alert("수정할 내용 또는 추가하고 싶은 내용을 입력해주세요.");
    return;
  }

  try {
    await emailjs.send(
      "service_qowldus",
      "template_7hs4byh",
      {
        fixMessage,
        addMessage,
        contact,
      },
      "1aQRC4TK_8wwBgPgw"
    );

    alert("메세지가 전송되었습니다.");

    setFixMessage("");
    setAddMessage("");
    setContact("");
    setOpen(false);

  } catch (error) {
  console.log(error);

  alert("메세지 전송에 실패했습니다.");
}
};

  return (
    <>
    <main className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="relative z-40 bg-white border-b shadow-sm">
        <div className="max-w-[1500px] mx-auto px-5 py-6">
          <div className="relative flex items-center justify-center md:justify-center">

    {/* PC 좌측 버튼 */}
{mainMenuManageMode !== "normal" ? (
  <div className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2">
    <button
      onClick={goBackMainScreen}
      className="
        px-4
        h-12
        rounded-2xl
        border
        border-gray-300
        bg-white
        flex
        items-center
        justify-center
        gap-2
        text-sm
        font-semibold
        text-gray-800
        shadow-sm
        hover:bg-gray-50
        transition
        cursor-default
      "
    >
      <HomeIcon className="w-4 h-4" />
      메인화면 돌아가기
    </button>
  </div>
) : (
  showInstall && (
    <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 items-center gap-10">
      <button
        onClick={async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();

            const result = await deferredPrompt.userChoice;

            if (result.outcome === "accepted") {
              setShowInstall(false);
              setDeferredPrompt(null);
            }

            return;
          }

          alert("크롬 또는 엣지에서 브라우저 메뉴 → 앱 설치를 눌러주세요.");
        }}
        className="
          px-4
          h-12
          rounded-2xl
          border
          border-gray-300
          bg-white
          flex
          items-center
          justify-center
          text-sm
          font-semibold
          text-gray-800
          shadow-sm
          hover:bg-gray-50
          transition
        "
      >
        바로가기 만들기
      </button>

      {weather && (
        <div className="relative">
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWeatherOpen(!weatherOpen);
            }}
            className="
              flex
              items-center
              gap-2
              text-black
              select-none
              cursor-default
            "
          >
           <span className="text-[22px] leading-none inline-block">
 {(weather.description || "").includes("비") ? (
  <span className="inline-block animate-[weatherRain_1.8s_ease-in-out_infinite]">
    🌧️
  </span>
) : (weather.description || "").includes("눈") ? (
  <span className="inline-block animate-[weatherSnow_3s_ease-in-out_infinite]">
    ❄️
  </span>
) : (weather.description || "").includes("구름") ? (
  <span className="inline-block animate-[weatherCloud_5s_ease-in-out_infinite]">
    ☁️
  </span>
) : (weather.description || "").includes("맑") ? (
  <span className="inline-block animate-[weatherSun_10s_linear_infinite]">
    ☀️
  </span>
) : (
  <span className="inline-block animate-[weatherCloud_5s_ease-in-out_infinite]">
    ☁️
  </span>
)}
</span>

            <span className="text-[15px] font-bold">
              {weather.region || "서울"}
            </span>

           {weather.temp !== undefined && (
  <span className="text-[15px] font-black">
    {weather.temp}°C
  </span>
)}
          </div>

          {weatherOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="
                absolute
                left-0
                top-12
                w-32
                rounded-2xl
                bg-white
                border
                border-gray-200
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              {WEATHER_REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    setWeatherRegion(region);
                    setWeatherOpen(false);
                  }}
                  className="
                    w-full
                    px-4
                    py-3
                    text-center
                    text-sm
                    font-bold
                    text-gray-700
                    hover:bg-gray-50
                    transition
                    cursor-default
                  "
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
)}

    
  <div className="absolute left-0 top-1/2 -translate-y-1/2 md:hidden">
    <div className="text-center">
      <p className="text-[10px] leading-none text-gray-400 font-bold">
        TODAY
      </p>

      <p className="text-sm font-black text-blue-600 mt-1">
        {today.toLocaleString()}
      </p>
    </div>
  </div>

  {/* 로고 */}
  <div className="text-center">
    <h1 className="text-2xl font-black text-blue-600">
      보험인사이트
    </h1>

    <p className="text-sm text-gray-500 mt-1">
      보험설계사 업무 통합 플랫폼
    </p>
  </div>

  {/* 모바일 TOTAL */}
  <div className="absolute right-0 top-1/2 -translate-y-1/2 md:hidden">
    <div className="text-center">
      <p className="text-[10px] leading-none text-gray-400 font-bold">
        TOTAL
      </p>

      <p className="text-sm font-black text-gray-900 mt-1">
        {total.toLocaleString()}
      </p>
    </div>
  </div>

    {/* PC 방문자 카운터 + 설정 */}
  <div
  className={`hidden md:block absolute right-6 top-1/2 -translate-y-1/2 ${
    settingOpen ? "z-[1000]" : "z-40"
  }`}
>
    <div className="flex items-center gap-13 text-center">
      
                 <div className="flex items-center gap-4 scale-130 mr-6">
{authLoading ? (
  <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
) : (
  <div
  onClick={() => {
    if (authStatus === "approved") setResourceOpen(true);
  }}
  className={authStatus === "approved" ? "cursor-pointer hover:opacity-80 transition" : ""}
>
  <AuthButton
    variant="label"
    user={authUser}
    nickname={authNickname}
    status={authStatus}
    createdAt={authCreatedAt}
  />
</div>

)}
</div>



<div>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TODAY
        </p>

        <p className="text-base font-black text-blue-600 mt-1">
          {today.toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TOTAL
        </p>

        <p className="text-base font-black text-gray-900 mt-1">
          {total.toLocaleString()}
        </p>
      </div>


      <div className="relative z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSettingOpen(!settingOpen);
          }}
          className={`
  w-10
  h-10
  rounded-full
  border
  border-gray-200
  shadow-sm
  flex
  items-center
  justify-center
  transition
  cursor-default
  ${
  settingOpen
    ? "bg-gray-100"
    : "bg-white hover:bg-gray-50"
}
`}
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>

        {settingOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              absolute
              right-0
              top-12
              z-[999]
              w-40
              rounded-2xl
              bg-white
              border
              border-gray-200
              shadow-xl
              overflow-hidden
            "
          >
            
          

<button
  onClick={() => {
  resetPopupPosition("menuAdd");
setMenuAddOpen(true);
  setMemoOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setEditIconOpen(false);
  setMenuManageMode("sort");
  setSettingOpen(false);
}}
  className="
    block
    w-full
    text-center
    px-4
    py-3
    text-sm
    font-bold
    text-gray-700
    hover:bg-gray-50
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 추가
</button>

<button
 onClick={() => {
        setTempMenus(menus);
    setTempPersonalMenus(personalMenus);
    setTempQuickMenuKeys(quickMenuKeys);
    setTempHiddenMenuIds(hiddenMenuIds);
    setSelectedPersonalMenuId("");
    setEditIconOpen(false);
    setMenuManageMode("sort");
    resetPopupPosition("menuSort");
setMenuSortOpen(true);

    setMemoOpen(false);
    setMenuAddOpen(false);
    setSettingOpen(false);
  }}
  className="
    block
    w-full
    text-center
    px-4
    py-3
    text-sm
    font-bold
    text-gray-700
    hover:bg-gray-50
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 변경
</button>

<button
  onClick={() => {
  setMainMenuManageMode("edit");
  setTempQuickMenuKeys(quickMenuKeys);
  setTempPersonalMenus(personalMenus);
  setMemoOpen(false);
  setMenuAddOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setEditIconOpen(false);
  setSettingOpen(false);
}}
  className="
    block
    w-full
    text-center
    px-4
    py-3
    text-sm
    font-bold
    text-gray-700
    hover:bg-blue-50
    hover:text-blue-600
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 수정
</button>

<button
  onClick={() => {
  setMainMenuManageMode("delete");
  setMemoOpen(false);
  setMenuAddOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setSettingOpen(false);
}}
  className="
    block
    w-full
    text-center
    px-4
    py-3
    text-sm
    font-bold
    text-gray-700
    hover:bg-red-50
    hover:text-red-500
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 삭제
</button>
          </div>
        )}
      </div>
    </div>
  </div>

          </div>
        </div>
      </header>
      
            {/* 메인 */}
      <div className="max-w-[1500px] mx-auto px-5 py-8 sm:px-10 sm:pt-10 sm:pb-2 md:pb-2 lg:pb-5">
       
        <div
  onClick={() => {
    if (selectedPersonalMenuId) {
  saveEditingMenuAndClose();
}
  }}
  className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 items-start"
>


        {mainMenuManageMode === "normal" &&
  menus.filter(menu => !hiddenMenuIds.includes(menu.id)).map((menu) => {
    const Icon = menu.icon;


    return (
      <a
        key={menu.id}
        onContextMenu={(e) => {
  if (!menu.isPersonal) return;

  e.preventDefault();

  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    type: "mainPersonal",
    id: menu.id,
  });
}}
href={
  menu.id === "customer-manage" || menu.id === "sales-book"
    ? undefined
    : menu.link
}
onClick={(e) => {
  if (menu.id === "customer-manage") {
    e.preventDefault();
    openCmPinPopup();
    return;
  }

if (menu.id === "sales-book") {
  e.preventDefault();

  if (!authUser || authStatus !== "approved") {
    setCmPinState("not-approved");
    setCmPinOpen(true);
    return;
  }

  setSalesBookAlertOpen(true);
  return;
}
}}
target={
  menu.title === "보험인사이트 폴더" ||
  menu.id === "auto-claim" ||
  menu.isPersonal
    ? "_blank"
    : "_self"
}
        rel="noopener noreferrer"
        className={`
          ${
            menu.title === "강의일정"
              ? "bg-white border border-gray-100"
              : "bg-white"
          }
          p-7
          sm:p-8
          rounded-3xl
          shadow
          hover:shadow-xl
          hover:-translate-y-1
          transition
          min-h-[190px]
          cursor-default
        `}
      >
        <Icon className="w-10 h-10 mb-4 text-blue-600" />

        <h2 className="text-lg font-bold">{menu.title}</h2>

        <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
          {menu.desc}
        </p>
            </a>
    );
  })}


{mainMenuManageMode === "normal" && authRole === "admin" && (
  <a
    href="/admin"
    className="bg-blue-600 p-7 sm:p-8 rounded-3xl shadow hover:shadow-xl hover:-translate-y-1 transition min-h-[190px] cursor-default"
  >
    <Settings className="w-10 h-10 mb-4 text-white" />
    <h2 className="text-lg font-bold text-white">관리자 페이지</h2>
    <p className="text-sm text-blue-100 mt-2 leading-relaxed break-keep">
      회원 승인 및 관리
    </p>
  </a>
)}


{mainMenuManageMode === "edit" && (

  <>
    <div className="col-span-full">
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-200 cursor-default">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            빠른메뉴 실행하기
          </h2>

          <p className="text-sm text-gray-500 mt-1 leading-relaxed break-keep">
            메인화면에서 바로 실행할 메뉴를 최대 4개까지 선택할 수 있습니다.
            추후 기능이 추가되면 선택 가능한 메뉴도 함께 추가됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {Array.from({ length: 4 }).map((_, index) => {
            const selectedKey = tempQuickMenuKeys[index];

            const selectedMenu = quickMenuOptions.find(
              (item) => item.key === selectedKey
            );

            if (!selectedMenu) {
              return (
                <button
                  key={index}
                  onClick={() => setQuickMenuSelectOpen(true)}
                  className="
                    h-[58px]
                    rounded-2xl
                    border
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-bold
                    text-gray-400
                    hover:bg-gray-100
                    hover:-translate-y-0.5
                    hover:shadow-md
                    transition
                    cursor-default
                  "
                >
                  <Plus className="w-5 h-5" />
                </button>
              );
            }

            return (
              <div
                key={selectedMenu.key}
                className="
                  h-[58px]
                  px-4
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50
                  flex
                  items-center
                  justify-between
                  gap-2
                  hover:-translate-y-0.5
                  hover:shadow-md
                  transition
                "
              >
                <span className="flex-1 text-center text-sm font-bold text-blue-600 truncate px-1">
                  {selectedMenu.title}
                </span>

                <button
                  onClick={() => {
                    setTempQuickMenuKeys((prev) =>
  prev.filter((key) => key !== selectedMenu.key)
);
                  }}
                  className="
                    w-7
                    h-7
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-blue-500
                    hover:bg-blue-100
                    transition
                    hover:scale-105
                    active:scale-95
                    cursor-pointer
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>

            {tempPersonalMenus.map((menu) => {
      const Icon = personalMenuIcons[menu.iconKey];
      const isSelected = selectedPersonalMenuId === menu.id;

      return (
        <div
  key={menu.id}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "menuManage",
      id: menu.id,
    });
  }}
  onClick={(e) => {
    e.stopPropagation();
    startEditPersonalMenu(menu);
  }}
          className="
            bg-white
            p-7
            sm:p-8
            rounded-3xl
            shadow
            border
            border-gray-200
            min-h-[190px]
            cursor-default
            transition
            hover:shadow-xl
            hover:-translate-y-1
          "
        >
          {!isSelected ? (
            <>
              <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

              <h2 className="text-lg font-bold text-gray-900">
                {menu.title}
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
                {menu.desc}
              </p>
            </>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setEditIconOpen(!editIconOpen)}
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  mb-3
                  cursor-pointer
                  hover:bg-gray-50
                  transition
                "
              >
                <Icon className="w-5 h-5 text-blue-600 shrink-0" />
              </button>

              {editIconOpen && (
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {Object.entries(personalMenuIcons).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setNewMenuIcon(key as PersonalMenuIconKey)
                      }
                      className="
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        transition
                        group
                      "
                    >
                      <Icon
                        className={`
                          w-5
                          h-5
                          shrink-0
                          transition
                          ${
                            newMenuIcon === key
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-500"
                          }
                        `}
                      />
                    </button>
                  ))}
                </div>
              )}

              <input
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="메뉴명"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
              />

              <input
                value={newMenuDesc}
                onChange={(e) => setNewMenuDesc(e.target.value)}
                placeholder="설명글"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
              />

              <input
                value={newMenuLink}
                onChange={(e) => setNewMenuLink(e.target.value)}
                placeholder="링크"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-3"
              />
            </div>
          )}
        </div>
      );
    })}
    <button
  onClick={() => {
    resetPopupPosition("menuAdd");
    setMenuAddOpen(true);
  }}
  className="
    bg-white
    p-7
    sm:p-8
    rounded-3xl
    shadow
    border
    border-dashed
    border-gray-300
    min-h-[190px]
    cursor-default
    flex
    items-center
    justify-center
    hover:bg-gray-50
    hover:shadow-xl
hover:-translate-y-1
    transition
  "
>
  <Plus className="w-10 h-10 text-gray-300" />
</button>
  </>
)}

{mainMenuManageMode === "delete" &&
  personalMenus.map((menu) => {
    const Icon = personalMenuIcons[menu.iconKey];
    const isSelected = selectedDeleteMenuIds.includes(menu.id);

    return (
      <button
        key={menu.id}
        onClick={() =>
  setSelectedDeleteMenuIds((prev) =>
    prev.includes(menu.id)
      ? prev.filter((id) => id !== menu.id)
      : [...prev, menu.id]
  )
}
        className={`
  p-7
  sm:p-8
  rounded-3xl
  shadow
  border
  min-h-[190px]
  text-left
  cursor-default
  transition
  hover:shadow-xl
  hover:-translate-y-1
  ${
    isSelected
      ? "bg-red-50 border-red-200"
      : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
  }
`}
      >
        <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

        <h2 className="text-lg font-bold text-gray-900">
          {menu.title}
        </h2>

        <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
          {menu.desc}
        </p>
      </button>
    );
  })}

          {/* 빠른 실행 - 모바일/태블릿 전용 */}
{mainMenuManageMode === "normal" && (
  <div className={quickOpen ? "relative pb-28 md:hidden" : "relative md:hidden"}>
            <button
  onClick={(e) => {
    e.stopPropagation();

    const nextOpen = !quickOpen;

    setQuickOpen(nextOpen);

    if (nextOpen) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }}
              className="
                w-full
                h-[50px]
                px-4
                py-3
                rounded-2xl
                bg-white
                border
                border-gray-200
                shadow-sm
                text-sm
                font-bold
                text-gray-700
                flex
                items-center
                justify-center
                gap-2
                hover:bg-gray-50
                transition
                whitespace-nowrap
              "
            >
              빠른 메뉴 실행하기

              {quickOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

           {quickOpen && (
  <div
    onClick={(e) => e.stopPropagation()}
    className="
      absolute
      animate-in
      fade-in
      zoom-in-95
      duration-150
      left-0
      top-[58px]
      z-30
      w-full
      max-h-[260px]
      rounded-2xl
      bg-white
      border
      border-gray-200
      shadow-xl
      overflow-y-auto
      grid
      grid-cols-2
    "
  >
    {Array.from({ length: 4 }).map((_, index) => {
  const selectedKey = quickMenuKeys[index];

  const selectedMenu = quickMenuOptions.find(
    (item) => item.key === selectedKey
  );

  if (!selectedMenu) {
    return (
      <button
        key={index}
        onClick={() => {
  setTempQuickMenuKeys(quickMenuKeys);
  setQuickMenuSelectOpen(true);
  setQuickOpen(false);
}}
        className={`
          min-h-[62px]
          px-3
          text-center
          text-[13px]
          font-bold
          text-gray-400
          hover:bg-gray-50
          transition
          ${index % 2 === 0 ? "border-r" : ""}
          ${index < 2 ? "border-b" : ""}
          border-gray-100
        `}
      >
        <div className="flex items-center justify-center">
  <Plus className="w-5 h-5" />
</div>
      </button>
    );
  }

  return (
    <button
      key={selectedMenu.key}
      onContextMenu={(e) => {
  e.preventDefault();

  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    type: "quickMenu",
    id: selectedMenu.key,
    index,
  });
}}
      onClick={selectedMenu.action}
      className={`
        min-h-[62px]
        px-3
        text-center
        text-[13px]
        font-bold
        text-gray-700
        hover:bg-gray-50
        transition
        ${index % 2 === 0 ? "border-r" : ""}
        ${index < 2 ? "border-b" : ""}
        border-gray-100
      `}
    >
      {selectedMenu.title}
    </button>
  );
})}
  </div>
)}
          </div>
)}
        </div>
      </div>

      {profileSettingOpen && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
    onClick={() => setProfileSettingOpen(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        w-full
        max-w-sm
        rounded-3xl
        bg-white
        p-6
        shadow-xl
        cursor-default
      "
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          개인설정
        </h2>

        <button
          onClick={() => setProfileSettingOpen(false)}
          className="
    w-9
    h-9
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
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
  <div className="flex items-center gap-3">
    <p className="shrink-0 text-[11px] font-bold text-gray-400">
      현재 이메일
    </p>

    <p className="text-sm font-bold text-gray-700 break-all">
      {authUser?.email}
    </p>
  </div>
</div>

<div className="space-y-3">
  
        <input
          type="text"
          placeholder="닉네임"
          value={editNickname}
          onChange={(e) => setEditNickname(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
        />

        <input
          type="text"
          placeholder="인스타그램 아이디"
          value={editInstagram}
          onChange={(e) => setEditInstagram(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />

        <div className="pt-3 border-t border-gray-100">
          <p className="mb-2 text-xs font-bold text-gray-500">개인공간 비밀번호</p>
          <div className="flex gap-2">
            <input
  type="password"
  placeholder="회원가입 비밀번호 입력"
  value={pinCheckPassword}
  onChange={(e) => setPinCheckPassword(e.target.value)}
  onKeyDown={(e) => { if (e.key === "Enter") handleCheckPin(); }}
  className="flex-1 h-11 rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
/>

            <button
              onClick={handleCheckPin}
              className="h-11 px-4 rounded-xl bg-gray-900 text-white text-sm font-bold cursor-pointer hover:bg-gray-800"
            >
              확인
            </button>
          </div>
          {pinCheckResult && (
            <p className="mt-2 text-sm text-center font-semibold text-blue-600">{pinCheckResult}</p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="mb-2 text-xs font-bold text-gray-500">
            비밀번호 변경

          </p>

          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={newPasswordConfirm}
            onChange={(e) =>
              setNewPasswordConfirm(e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <button
          onClick={saveProfileSettings}
          className="h-11 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 cursor-pointer"
        >
          저장하기
        </button>
        
      </div>
    </div>
  </div>
)}

{contextMenu && (
 <div
  style={{
    left: contextMenu.x,
    top: contextMenu.y,
  }}
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
    className="
      fixed
      z-[5000]
      w-36
      rounded-2xl
      bg-white
      border
      border-gray-200
      shadow-xl
      overflow-hidden
    "
  >
    <button
  onClick={() => {
  if (contextMenu.type === "memo") {
    const targetMemo = memos.find(
      (memo) => memo.id === contextMenu.id
    );

    if (!targetMemo) return;

    setSelectedMemo(targetMemo);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "quickMenu") {
    setTempQuickMenuKeys(quickMenuKeys);
    setQuickMenuSelectOpen(true);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "menuManage") {
    const targetMenu = tempPersonalMenus.find(
      (menu) => menu.id === contextMenu.id
    );

    if (!targetMenu) return;

    startEditPersonalMenu(targetMenu);
    setMenuManageMode("edit");
    setContextMenu(null);
    return;
  }

  const targetMenu = personalMenus.find(
    (menu) => menu.id === contextMenu.id
  );

  if (!targetMenu) return;

  setTempPersonalMenus(personalMenus);
  setTempQuickMenuKeys(quickMenuKeys);
  startEditPersonalMenu(targetMenu);
  setMainMenuManageMode("edit");
  setContextMenu(null);
}}
      className="
        block
        w-full
        text-left
        px-4
        py-3
        text-sm
        font-bold
        text-gray-700
        hover:bg-blue-50
        hover:text-blue-600
        transition
        cursor-default
      "
    >
      수정
    </button>

    <button
      onClick={() => {
  if (contextMenu.type === "memo") {
    deleteMemo(contextMenu.id);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "quickMenu") {
    setQuickDeleteKey(contextMenu.id);
    setQuickDeleteConfirmOpen(true);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "menuManage") {
    setTempMenus((prev) =>
      prev.filter((menu) => menu.id !== contextMenu.id)
    );

    setTempPersonalMenus((prev) =>
      prev.filter((menu) => menu.id !== contextMenu.id)
    );

    setSelectedPersonalMenuId("");
    setContextMenu(null);
    return;
  }

  setSelectedDeleteMenuIds([contextMenu.id]);
  setDeleteConfirmOpen(true);
  setContextMenu(null);
}}

      className="
        block
        w-full
        text-left
        px-4
        py-3
        text-sm
        font-bold
        text-gray-700
        hover:bg-red-50
        hover:text-red-500
        transition
        border-t
        border-gray-100
        cursor-default
      "
    >
      삭제
    </button>
  </div>
)}


      {/* 앱처럼 사용하기 */}
      {/* 앱처럼 사용하기 */}
{showInstall &&
  /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent) && (
        <div className="max-w-[1500px] mx-auto px-5 -mt-3 mb-10 md:hidden">
          <button
            onClick={async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShowInstall(false);
      setDeferredPrompt(null);
    }

    return;
  }

  alert(
    "홈화면에 추가 후 앱처럼 사용하세요 !\n\n사파리 또는 크롬에서 열기\n\n모바일: 공유 또는 메뉴 버튼 → 홈 화면에 추가\n\nPC: 브라우저 메뉴 → 앱 설치"
  );
}}
            className="
              w-full
              bg-white
              border
              border-gray-200
              rounded-2xl
              px-4
              h-[50px]
              flex
              items-center
              justify-center
              gap-2
              text-sm
              shadow-sm
            "
          >
            <span className="font-semibold text-gray-800">
  앱처럼 사용하기
</span>
          </button>
        </div>
      )}

      {/* 모바일 메세지 버튼 */}
<div className="max-w-[1500px] mx-auto px-5 -mt-5 mb-23 md:hidden">
  <button
    onClick={() => {
  resetPopupPosition("message");
  setOpen(true);
}}
    className="
      w-full
      h-[50px]
      rounded-2xl
      bg-blue-600
      text-white
      text-sm
      font-bold
      shadow-sm
      flex
      items-center
      justify-center
    "
  >
    보험나무에게 메세지 보내기
  </button>
</div>

<button
  onClick={(e) => {
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  }}
  className="
    fixed
    left-6
    bottom-24
    z-40
    w-14
    h-14
    rounded-full
    bg-gray-800
    shadow-lg
    flex
    items-center
    justify-center
    hover:shadow-2xl
    hover:-translate-y-0.5
    transition-all
    duration-200
  "
>
  <User className="w-6 h-6 text-white" />

  {hasUpdate && (
    <span className="absolute right-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
  )}
</button>

{userMenuOpen && (
  <div
    onClick={(e) => e.stopPropagation()}
    className="
      fixed
      left-6
      bottom-40
      z-50
      w-40
      rounded-2xl
      bg-white
      border
      border-gray-200
      shadow-xl
      overflow-hidden
    "
  >
       <AuthButton
  variant="menu"
  user={authUser}
  nickname={authNickname}
  status={authStatus}
  createdAt={authCreatedAt}
  onAuthChange={refreshAuth}
  onMenuClose={() => setUserMenuOpen(false)}
/>



{authUser && authStatus === "approved" && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        resetPopupPosition("memo");
        setMemoOpen(true);
        setUserMenuOpen(false);
      }}
            className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      메모장
    </button>
    

   <button
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = "/calendar";
        setUserMenuOpen(false);
      }}
      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      캘린더
    </button>

        <button
            onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("open-calculator"));
        setUserMenuOpen(false);
      }}

      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      계산기
    </button>

       <button
      onClick={(e) => {
        e.stopPropagation();
        setResourceOpen(true);
        setUserMenuOpen(false);
      }}
      className="block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      구독자료
    </button>


    
        <button
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = "/today-news";
        setUserMenuOpen(false);
      }}
      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      뉴스
    </button>

  </>
)}

    <button
  onClick={(e) => {
    e.stopPropagation();

    if (!authUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    setEditNickname(authNickname || "");
    setEditInstagram(authInstagram || "");

    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");

    setProfileSettingOpen(true);
    setUserMenuOpen(false);
  }}
    className="block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
>
  개인설정

</button>

<button
  onClick={() => {
    setTempMenus(menus);
    setTempPersonalMenus(personalMenus);
    setTempQuickMenuKeys(quickMenuKeys);
    setTempHiddenMenuIds(hiddenMenuIds);

    setSelectedPersonalMenuId("");
    setEditIconOpen(false);

    setMenuManageMode("sort");

    resetPopupPosition("menuSort");
    setMenuSortOpen(true);

    setUserMenuOpen(false);
  }}
  className="
    md:hidden
    block
    w-full
    px-4
    py-3
    text-center
    text-sm
    font-bold
    text-gray-700
    hover:bg-gray-50
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴변경
</button>

    <button
      onClick={(e) => {
        e.stopPropagation();

        localStorage.setItem("noticeRead", noticeVersion.toString());
        // DB 공지 전체 읽음 처리
        const allDbIds = dbNotices.map((n: any) => n.id);
        localStorage.setItem("seen_db_notice_ids", JSON.stringify(allDbIds));
        setHasUpdate(false);
        setSelectedNotice(null);
        resetPopupPosition("notice");
        setNoticeOpen(true);
        setUserMenuOpen(false);

      }}
      className="
        relative
        block
        w-full
        px-4
        py-3
        text-center
        text-sm
        font-bold
        text-gray-700
        hover:bg-gray-50
        border-t
        border-gray-100
        cursor-default
      "
    >
      공지사항

      {hasUpdate && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
      )}
    </button>
  </div>
)}



{/* PC 빠른메뉴 실행 버튼 */}
{mainMenuManageMode === "normal" && (
  <div
    ref={pcQuickWrapRef}
    onPointerDown={startPcQuickDrag}
    style={{
      transform: `translate(${pcQuickPos.x}px, ${pcQuickPos.y}px)`,
    }}
    className="
      hidden
      md:block
      fixed
      right-0
      bottom-20
      lg:bottom-25
      z-[60]
      w-[248px]
      cursor-default
      select-none
      touch-none
    "
  >
    {pcQuickOpen && pcQuickDirection === "up" && (
      <div
        data-pc-quick-menu
        className="
          absolute
          left-0
          z-[61]
          bottom-[60px]
          w-full
          min-w-full
                    rounded-2xl
          bg-white
          border
          border-gray-200
          overflow-hidden
        "
      >
            <div className="flex items-center border-t border-gray-100">

      <button
        onClick={(e) => {
          e.stopPropagation();
          resetPopupPosition("memo");
          setMemoOpen(true);
          setUserMenuOpen(false);
        }}
        className="flex-1 px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-default"
      >
        메모장
      </button>
      
    </div>

        
                       {authStatus === "approved" && (
          <button
            onClick={() => {
              window.location.href = "/calendar";
              setPcQuickOpen(false);
            }}
            className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
          >
            캘린더
          </button>
        )}

       





{Array.from({ length: 4 }).map((_, index) => {

  const selectedKey = quickMenuKeys[index];

  const selectedMenu = quickMenuOptions.find(
    (item) => item.key === selectedKey
  );

  if (!selectedMenu) {
    return (
      <button
        key={index}
        onClick={() => {
          setTempQuickMenuKeys(quickMenuKeys);
          setQuickMenuSelectOpen(true);
          setPcQuickOpen(false);
        }}
        className="w-full h-[48px] px-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      key={selectedMenu.key}
      onContextMenu={(e) => {
        e.preventDefault();

        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: "quickMenu",
          id: selectedMenu.key,
          index,
        });
      }}
      onClick={() => {
        selectedMenu.action();
        setPcQuickOpen(false);
      }}
      className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
    >
      {selectedMenu.title}
    </button>
  );
})}

        <button
  onClick={() => {
    window.location.href = "/today-news";
    setPcQuickOpen(false);
  }}
  className="
  w-full
  h-[48px]
  px-4
  text-sm
  font-bold
  text-gray-700
  hover:bg-gray-50
  transition
  cursor-default
  flex
  items-center
  justify-center
  border-t
  border-gray-100
  "
>
  오늘의 뉴스
</button>

        <button
          onClick={() => {
            resetPopupPosition("message");
            setOpen(true);
            setPcQuickOpen(false);
          }}
          className="w-full h-[48px] px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
        >
          보험나무에게 메세지 보내기
        </button>
      </div>
    )}

    <button
      onClick={(e) => {
        e.stopPropagation();

        if (pcQuickDragRef.current?.moved) {
          pcQuickDragRef.current = null;
          return;
        }

        openPcQuickMenu();
      }}
      className={`
  w-full
  h-[52px]
  px-5
  rounded-2xl
  border
  text-sm
  font-bold
  flex
  items-center
  justify-center
  gap-2
  transition
  hover:-translate-y-0.5
  cursor-default
  whitespace-nowrap
  ${
  pcQuickOpen
    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
    : "bg-blue-600 border-blue-600 text-white"
}
`}
    >
      빠른메뉴 실행하기

      {pcQuickOpen ? (
  <ChevronUp className="w-4 h-4 text-gray-400" />
) : (
  <ChevronDown className="w-4 h-4 text-white" />
)}
    </button>

    {pcQuickOpen && pcQuickDirection === "down" && (
      <div
        data-pc-quick-menu
        className="
          absolute
          left-0
          top-[60px]
          w-full
          min-w-full
                   rounded-2xl
          bg-white
          border
          border-gray-200
          overflow-hidden
        "
      >
        <button
          onClick={() => {
            resetPopupPosition("memo");

            setMemoOpen(true);
            setPcQuickOpen(false);
          }}
          className="
  w-full
  h-[48px]
  px-4
  text-sm
  font-bold
  text-gray-700
  hover:bg-gray-50
  transition
  cursor-default
  flex
  items-center
  justify-center
"
        >
          메모장
        </button>
        

                {authStatus === "approved" && (
          <button
            onClick={() => {
              window.location.href = "/calendar";
              setPcQuickOpen(false);
            }}
            className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
          >
            캘린더
          </button>
        )}

       
 



{Array.from({ length: 4 }).map((_, index) => {

  const selectedKey = quickMenuKeys[index];

  const selectedMenu = quickMenuOptions.find(
    (item) => item.key === selectedKey
  );

  if (!selectedMenu) {
    return (
      <button
        key={index}
        onClick={() => {
          setTempQuickMenuKeys(quickMenuKeys);
          setQuickMenuSelectOpen(true);
          setPcQuickOpen(false);
        }}
        className="w-full h-[48px] px-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      key={selectedMenu.key}
      onContextMenu={(e) => {
        e.preventDefault();

        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: "quickMenu",
          id: selectedMenu.key,
          index,
        });
      }}
      onClick={() => {
        selectedMenu.action();
        setPcQuickOpen(false);
      }}
      className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
    >
      {selectedMenu.title}
    </button>
  );
})}

<button
  onClick={() => {
    window.location.href = "/today-news";
    setPcQuickOpen(false);
  }}
  className="
    w-full
    h-[48px]
    px-4
    text-sm
    font-bold
    text-gray-700
    hover:bg-gray-50
    transition
    cursor-default
    flex
    items-center
    justify-center
    border-t
    border-gray-100
  "
>
  오늘의 뉴스
</button>

        <button
          onClick={() => {
            resetPopupPosition("message");
            setOpen(true);
            setPcQuickOpen(false);
          }}
          className="w-full h-[48px] px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
        >
          보험나무에게 메세지 보내기
        </button>
      </div>
    )}
  </div>
)}
    

{mainMenuManageMode === "normal" && <ExchangeIndexBar />}


      {/* 하단 고정 */}
      {mainMenuManageMode === "normal" && (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a
            href="https://naver.me/xsZ8mk7H"
            target="_blank"
rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            target="_blank"
rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            target="_blank"
rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
)}

{mainMenuManageMode !== "normal" && (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
    <div className="max-w-6xl mx-auto py-3 flex justify-center gap-6">
      <button
        onClick={() => {
          if (mainMenuManageMode === "edit") {
  cancelEditingMenu();
  return;
}

          if (mainMenuManageMode === "delete") {
            setSelectedDeleteMenuIds([]);
            return;
          }
        }}
        className="
          w-50
          h-[50px]
          rounded-2xl
          bg-gray-100
          text-gray-700
          text-sm
          font-bold
          hover:bg-gray-200
          transition
          cursor-default
        "
      >
        취소
      </button>

      <button
        onClick={() => {
          if (mainMenuManageMode === "edit") {
  saveMenuManageChanges("main");
  return;
}

          if (mainMenuManageMode === "delete") {
            setDeleteConfirmOpen(true);
            return;
          }
        }}
        className={`
          w-50
          h-[50px]
          rounded-2xl
          text-white
          text-sm
          font-bold
          transition
          cursor-default
          ${
            mainMenuManageMode === "delete"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {mainMenuManageMode === "delete" ? "삭제" : "저장"}
      </button>
    </div>
  </div>
)}

{menuLinkAlertOpen && (
  <div className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        링크 입력
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        메뉴로 연결할 링크를 입력해주세요.
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setMenuLinkAlertOpen(false)}
          className="
            w-32
            h-12
            rounded-2xl
            bg-gray-800
            text-white
            text-sm
            font-bold
            hover:bg-gray-700
            transition
            cursor-default
          "
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}

{deleteConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        메뉴 삭제
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        선택한 메뉴를 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setDeleteConfirmOpen(false)}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-gray-100
            text-gray-700
            text-sm
            font-bold
            hover:bg-gray-200
            transition
            cursor-default
          "
        >
          취소
        </button>

        <button
          onClick={deletePersonalMenu}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-red-500
            text-white
            text-sm
            font-bold
            hover:bg-red-600
            transition
            cursor-default
          "
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

{quickMenuSelectOpen && (
  <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">
          빠른메뉴 선택
        </h2>

        <button
  onClick={() => {
    setTempQuickMenuKeys(quickMenuKeys);
    setQuickMenuSelectOpen(false);
  }}
  className="
            w-9
            h-9
            rounded-full
            flex
            items-center
            justify-center
            text-gray-400
            hover:bg-gray-100
            transition
            cursor-pointer
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
  {quickMenuOptions.map((item) => {
    const isSelected = tempQuickMenuKeys.includes(item.key);

    return (
      <button
        key={item.key}
        onClick={() => {
          if (isSelected) {
            setTempQuickMenuKeys((prev) =>
              prev.filter((key) => key !== item.key)
            );
            return;
          }

          if (tempQuickMenuKeys.length >= 4) {
            setQuickLimitOpen(true);
            return;
          }

          setTempQuickMenuKeys((prev) => [...prev, item.key]);
        }}
        className={`
          h-12
          rounded-2xl
          border
          text-sm
          font-bold
          transition
          cursor-default
          ${
            isSelected
              ? "border-blue-400 bg-blue-50 text-blue-600"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }
        `}
      >
        {item.title}
      </button>
    );
  })}
</div>
      <div className="flex gap-3 mt-6">
  <button
    onClick={() => {
      setTempQuickMenuKeys(quickMenuKeys);
      setQuickMenuSelectOpen(false);
    }}
    className="
      flex-1
      h-12
      rounded-2xl
      bg-gray-100
      text-gray-700
      text-sm
      font-bold
      hover:bg-gray-200
      transition
      cursor-default
    "
  >
    취소
  </button>

    <button
  onClick={() => {
    if (mainMenuManageMode === "normal" && !menuSortOpen) {
      setQuickMenuKeys(tempQuickMenuKeys);
      if (authUser && authStatus === "approved") {
        supabase.from("profiles").update({ quick_menu_keys: tempQuickMenuKeys }).eq("id", authUser.id).then();
      } else {
        localStorage.setItem("quickMenuKeys", JSON.stringify(tempQuickMenuKeys));
      }
    }

    setQuickMenuSelectOpen(false);
  }}

    className="
      flex-1
      h-12
      rounded-2xl
      bg-blue-600
      text-white
      text-sm
      font-bold
      hover:bg-blue-700
      transition
      cursor-default
    "
  >
    저장
  </button>
</div>
    </div>
  </div>
)}

{quickLimitOpen && (
  <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        빠른메뉴 선택
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        빠른메뉴는 최대 4개까지 선택할 수 있습니다.
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setQuickLimitOpen(false)}
          className="
            w-32
            h-12
            rounded-2xl
            bg-gray-800
            text-white
            text-sm
            font-bold
            hover:bg-gray-700
            transition
            cursor-default
          "
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}

{quickDeleteConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        빠른메뉴 삭제
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        빠른메뉴에서 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setQuickDeleteConfirmOpen(false)}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-gray-100
            text-gray-700
            text-sm
            font-bold
            hover:bg-gray-200
            transition
            cursor-default
          "
        >
          취소
        </button>

        <button
          onClick={() => {
  if (!quickDeleteKey) return;

  setQuickMenuKeys((prev) =>
    prev.filter((key) => key !== quickDeleteKey)
  );

  setTempQuickMenuKeys((prev) =>
    prev.filter((key) => key !== quickDeleteKey)
  );

  setQuickDeleteKey(null);
  setQuickDeleteConfirmOpen(false);
}}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-red-500
            text-white
            text-sm
            font-bold
            hover:bg-red-600
            transition
            cursor-default
          "
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

{saveConfirmOpen && (
  <div className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        저장 완료
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        {saveConfirmMessage}
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setSaveConfirmOpen(false)}
          className={`
            w-32
            h-12
            rounded-2xl
            text-white
            text-sm
            font-bold
            transition
            cursor-default
            ${
  saveConfirmType === "popup"
    ? "bg-gray-800 hover:bg-gray-700"
    : "bg-blue-600 hover:bg-blue-700"
}
          `}
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}

{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        메모 삭제
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        선택한 메모를 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setDeleteMemoId(null);
            setDeleteMemoConfirmOpen(false);
          }}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-gray-100
            text-gray-700
            text-sm
            font-bold
            hover:bg-gray-200
            transition
            cursor-default
          "
        >
          취소
        </button>

        <button
          onClick={confirmDeleteMemo}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-red-500
            text-white
            text-sm
            font-bold
            hover:bg-red-600
            transition
            cursor-default
          "
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

{(passwordResultOpen || passwordResultRef.current) && (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-5">


    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
        {(passwordResultSuccess || passwordResultSuccessRef.current) ? "저장 완료" : "저장 실패"}
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        {(passwordResultSuccess || passwordResultSuccessRef.current)
          ? "개인설정이 저장되었습니다."
          : "저장에 실패했습니다. 다시 시도해주세요."}
      </p>

      <div className="flex gap-3 mt-6">
        <button
                    onClick={() => {
            setPasswordResultOpen(false);
            setPasswordResultSuccess(false);
            passwordResultRef.current = false;
            passwordResultSuccessRef.current = false;
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          확인

        </button>
      </div>
    </div>
  </div>
)}

      {/* 공지 팝업 */}
      {popupNotice && !popupNoticeClosed && (
        <div className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[80vh] flex flex-col">
            <div className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div className="font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                공지사항
              </div>
              <button
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                }}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 md:px-10 pt-6 pb-6 flex-1 min-h-0 flex flex-col overflow-y-auto">
              {(() => {
                const cat = dbCategories.find((c: any) => c.id === popupNotice.category_id);
                return (
                  <>
                    {cat && (
                      <span className={`inline-block w-fit mb-3 px-3 py-1 rounded-lg text-xs font-bold ${
                        cat.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                        cat.color === "red" ? "bg-red-100 text-red-600" :
                        cat.color === "green" ? "bg-emerald-100 text-emerald-700" :
                        cat.color === "orange" ? "bg-orange-100 text-orange-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>{cat.name}</span>
                    )}
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-2">
                      {popupNotice.title}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 mb-4">
                      {new Date(popupNotice.created_at).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                   <div className="border-t border-gray-200 pt-4 text-[15px] leading-6 text-gray-800 break-keep flex-1 overflow-x-hidden">
<div
  className="
    max-w-full
    overflow-hidden
    break-words
    [&_*]:max-w-full
    [&_p]:m-0
    [&_p]:min-h-[24px]
    [&_p]:leading-6
    [&_br]:block
    [&_a]:break-all
  "
   dangerouslySetInnerHTML={{
    __html: popupNotice.content.includes("<")
      ? popupNotice.content
      : popupNotice.content.replace(/\n/g, "<br />"),
  }}
/>
{(() => {
  const images =
    popupNotice.image_urls?.length > 0
      ? popupNotice.image_urls
      : popupNotice.image_url
      ? [popupNotice.image_url]
      : [];

  if (images.length === 0) return null;

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
      <img
        src={images[popupNoticeImageIndex]}
        alt="공지 이미지"
        className="w-full max-w-full h-auto object-contain max-h-[500px]"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
          >
            ‹
          </button>

          <button
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/45 text-white text-xs font-bold">
            {popupNoticeImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
})()}
</div>

                  </>
                );
              })()}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                  localStorage.setItem("noticeRead", noticeVersion.toString());
                  const allDbIds = dbNotices.map((n: any) => n.id);
                  localStorage.setItem("seen_db_notice_ids", JSON.stringify(allDbIds));
                  setHasUpdate(false);
                  setSelectedNotice(null);
                  resetPopupPosition("notice");
                  setNoticeOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-200 transition"
              >
                공지사항 전체보기
              </button>
              <button
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                }}
                className="px-5 py-3 rounded-xl bg-gray-800 text-white text-sm font-bold cursor-pointer hover:bg-gray-700 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메세지 모달 */}
      {open && (

        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div
  style={getPopupStyle("message")}
  className="bg-white rounded-3xl p-6 w-full max-w-md relative"
>
            <button
              onClick={() => setOpen(false)}
              className="
  absolute
  right-5
  top-5
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  text-gray-400
  hover:bg-gray-100
  transition
  cursor-pointer
"
            >
              <X className="w-5 h-5" />
            </button>

            <div
  onPointerDown={(e) => startPopupDrag("message", e)}
  className="mb-4"
>
  <h2 className="text-2xl font-black text-gray-900">
    보험나무에게 메세지 보내기
  </h2>

  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
    수정이 필요한 부분이나
    <br />
    추가하고 싶은 기능이 있다면 편하게 남겨주세요.
  </p>
</div>

            <div className="mb-3">
  <p className="text-sm font-bold text-gray-700 mb-1.5">
    수정할 내용
  </p>

              <textarea
                value={fixMessage}
                onChange={(e) => setFixMessage(e.target.value)}
                placeholder="예) 고객센터 팩스번호 수정 부탁드립니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

            <div className="mb-3">
  <p className="text-sm font-bold text-gray-700 mb-1.5">
    추가하고 싶은 내용
  </p>
              <textarea
                value={addMessage}
                onChange={(e) => setAddMessage(e.target.value)}
                placeholder="예) 새로운 기능이 추가되면 좋겠습니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

<p className="text-sm font-bold text-gray-700 mb-1.5 px-1">
  요청사항 변경 확인 메세지를 보내드립니다 !
</p>

            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              
              placeholder="연락처 또는 이름 (선택사항)"
              
              className="
                w-full
                border
                border-gray-200
                rounded-2xl
                p-4
                outline-none
                mb-6
              "
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="
  flex-1
  py-4
  rounded-2xl
  bg-gray-100
  font-bold
  text-gray-700
  hover:bg-gray-200
  active:scale-[0.98]
  transition
"
              >
                취소
              </button>

              <button
                onClick={sendMessage}
                className="
  flex-1
  py-4
  rounded-2xl
  bg-blue-600
  hover:bg-blue-700
  text-white
  font-bold
  active:scale-[0.98]
  transition
"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}
            {/* 공지사항 팝업 */}
      {noticeOpen && (
        <div
  onClick={() => setNoticeOpen(false)}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4"
>
         <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("notice")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[80vh] flex flex-col"
>
            <div
  onPointerDown={(e) => startPopupDrag("notice", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
              <div className="font-bold flex items-center gap-2">
                <User className="w-5 h-5" />
                공지사항
              </div>

              <button
  onClick={() => setNoticeOpen(false)}
  className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
>
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedNotice ? (
  <div className="flex flex-col flex-1 min-h-0">

    {/* 모바일 카드형 */}
    <div className="p-4 space-y-2 md:hidden overflow-y-auto flex-1">
      {pagedNotices.map((notice) => (
        <button
          key={notice.id}
          onClick={() => {
 setSelectedNotice(notice);
setNoticeImageIndex(0);

    const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ read_notice_ids: nextReadIds }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("readNoticeIds", JSON.stringify(nextReadIds));
  }

}}
          className="
  w-full
  text-left
  bg-white
  border
  border-gray-200
  rounded-2xl
  p-3
  hover:bg-gray-50
  transition
"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400">
              NO. {allNotices.length - allNotices.indexOf(notice)}
            </span>

                              {!readNoticeIds.includes(notice.id) && notice.category && (
  <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
    (notice as any).categoryColor === "yellow" || notice.category === "강의안내"
      ? "bg-yellow-100 text-yellow-700"
      : (notice as any).categoryColor === "red"
      ? "bg-red-100 text-red-600"
      : (notice as any).categoryColor === "green" || notice.category === "OPEN"
      ? "bg-emerald-100 text-emerald-700"
      : (notice as any).categoryColor === "orange"
      ? "bg-orange-100 text-orange-600"
      : "bg-blue-100 text-blue-600"
  }`}>
    {notice.category}
  </span>
)}

          </div>

          <div className="font-bold text-gray-900 leading-tight break-keep">
            {notice.title}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {notice.date}
          </div>
        </button>
      ))}
    </div>

    {/* PC 테이블형 */}
    <div className="hidden md:block p-4 overflow-y-auto flex-1">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-50 rounded-xl overflow-hidden">
          <tr>
            <th className="py-3 w-20">번호</th>
            <th className="py-3">제목</th>
            <th className="py-3 w-36">날짜</th>
          </tr>
        </thead>

                 <tbody>
            {pagedNotices.map((notice) => (
              <tr
                key={notice.id}


              onClick={() => {
  setSelectedNotice(notice);
setNoticeImageIndex(0);

    const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ read_notice_ids: nextReadIds }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("readNoticeIds", JSON.stringify(nextReadIds));
  }

}}
              className="
                border-b
                border-gray-100
                hover:bg-gray-50
                cursor-pointer
                transition
              "
            >
              <td className="py-4 text-center text-gray-700 border-b border-gray-100">

                {(notice as any).isDb ? allNotices.length - allNotices.indexOf(notice) : notice.id}
              </td>


              <td className="py-4 font-medium border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span>{notice.title}</span>

                                   {!readNoticeIds.includes(notice.id) && notice.category && (
  <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
    (notice as any).categoryColor === "yellow" || notice.category === "강의안내"
      ? "bg-yellow-100 text-yellow-700"
      : (notice as any).categoryColor === "red"
      ? "bg-red-100 text-red-600"
      : (notice as any).categoryColor === "green" || notice.category === "OPEN"
      ? "bg-emerald-100 text-emerald-700"
      : (notice as any).categoryColor === "orange"
      ? "bg-orange-100 text-orange-600"
      : "bg-blue-100 text-blue-600"
  }`}>
    {notice.category}
  </span>
)}

                </div>
              </td>

              <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
                {notice.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* 페이지네이션 */}
    {/* 페이지네이션 */}
<div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
  <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
    <button
      onClick={() => setNoticePage((p) => Math.max(1, p - 1))}
      disabled={noticePage === 1}
      className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
    >
      이전
    </button>

       {Array.from({
  length: Math.min(totalNoticePages, 10),
}).map((_, index) => {
      const page = index + 1;
      const start = Math.max(1, Math.min(noticePage - 2, totalNoticePages - 4));
      const end = Math.min(totalNoticePages, start + 4);
      if (page < start || page > end) return null;

      return (
        <button
          key={page}
          onClick={() => setNoticePage(page)}
          className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
            noticePage === page
              ? "bg-slate-800 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      );
    })}


    <button
      onClick={() =>
        setNoticePage((p) => Math.min(totalNoticePages, p + 1))
      }
      disabled={noticePage === totalNoticePages}
      className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
    >
      다음
    </button>
  </div>
</div>

  </div>
) : (
              <div className="px-6 md:px-10 pt-4 pb-6 flex-1 min-h-0 flex flex-col">



  <div className="overflow-y-auto overflow-x-hidden flex-1">
    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep">
      {selectedNotice.title}
    </h2>

    <p className="text-xs md:text-sm text-gray-500 mt-2">
      작성일: {selectedNotice.date}
    </p>

   <div className="border-t border-gray-200 mt-3 pt-4 pb-6 text-[15px] leading-6 text-gray-800 break-keep">

<div
  className="
    max-w-full
    overflow-hidden
    break-words
    [&_*]:max-w-full
    [&_p]:m-0
    [&_p]:min-h-[24px]
    [&_p]:leading-6
    [&_br]:block
    [&_a]:break-all
  "
  dangerouslySetInnerHTML={{
    __html: selectedNotice.content.includes("<")
      ? selectedNotice.content
      : selectedNotice.content.replace(/\n/g, "<br />"),
  }}
/>
  {(() => {
    const images =
      selectedNotice.image_urls?.length > 0
        ? selectedNotice.image_urls
        : selectedNotice.image_url
        ? [selectedNotice.image_url]
        : [];

    if (images.length === 0) return null;

    return (
      <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
    <img
  src={images[noticeImageIndex]}
  alt="공지 이미지"
  className="w-full max-w-full h-auto object-contain max-h-[500px]"
/>

        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setNoticeImageIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
            >
              ‹
            </button>

            <button
              onClick={() =>
                setNoticeImageIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/45 text-white text-xs font-bold">
              {noticeImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    );
  })()}
</div>
  </div>

  <div className="border-t border-gray-200 pt-4 text-center shrink-0">
    <button
      onClick={() => setSelectedNotice(null)}
      className="
  px-5
  py-3
  rounded-xl
  bg-gray-700
  text-white
  text-sm
  font-bold
  cursor-pointer
  hover:bg-gray-600
  hover:shadow-md
 
  transition-all
  duration-200
"
    >
      목록으로
    </button>
  </div>

</div>
            )}
          </div>
        </div>
      )}

{/* 메뉴 정렬 팝업 */}
{menuSortOpen && (
  <div
  onClick={() => setContextMenu(null)}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4"
>
   <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("menuSort")}
  className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col"
>
     <div
  onPointerDown={(e) => startPopupDrag("menuSort", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
  <div className="font-bold flex items-center gap-2">
    <Settings className="w-5 h-5" />
메뉴 변경
  </div>

 <button
  onClick={() => {
  if (menuManageMode === "sort") {
 setTempMenus(menus); 
  setTempPersonalMenus(personalMenus);
  setTempQuickMenuKeys(quickMenuKeys);
  setTempHiddenMenuIds(hiddenMenuIds);

  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);
  setMenuSortOpen(false);
  return;
}

    setMenuManageMode("sort");
    setSelectedPersonalMenuId("");
    setSelectedDeleteMenuIds([]);
    setEditIconOpen(false);
    setNewMenuTitle("");
    setNewMenuDesc("");
    setNewMenuLink("");
    setNewMenuIcon("globe");
  }}
  className={`
    h-9
    flex
    items-center
    justify-center
    transition
    cursor-pointer
    ${
      menuManageMode === "sort"
        ? "w-9 rounded-full hover:bg-white/10"
        : "px-4 min-w-[92px] -translate-x-0 rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
    }
  `}
>
  {menuManageMode === "sort" ? (
    <X className="w-5 h-5" />
  ) : (
    <span className="text-sm font-bold whitespace-nowrap">
      뒤로가기
    </span>
  )}
</button>
</div>

<div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
  <div className="min-w-0">
  <p className="text-base font-black text-gray-900">
    {menuManageMode === "sort" && (
  <>
    <span className="hidden md:inline">
      메뉴 위치 변경 및 숨기기
    </span>

    <span className="md:hidden">
      메뉴 숨기기
    </span>
  </>
)}
    {menuManageMode === "edit" && "메뉴 수정"}
    {menuManageMode === "delete" && "메뉴 삭제"}
  </p>

<p className="text-sm text-gray-500 mt-0 leading-relaxed break-keep">
  {menuManageMode === "sort" && (
    <>
      <span className="hidden md:inline">
        메뉴를 드래그해서 원하는 순서로 변경할 수 있습니다.
      </span>

      <span className="md:hidden">
        눈 아이콘으로 메뉴를 숨기거나 다시 표시할 수 있습니다.
      </span>
    </>
  )}

  {menuManageMode === "edit" &&
    "직접 추가한 메뉴를 수정하고 빠른메뉴 실행 항목을 설정할 수 있습니다."}

  {menuManageMode === "delete" &&
    "직접 추가한 메뉴 중 삭제할 메뉴를 선택할 수 있습니다."}
</p>
</div>
  <div className="flex gap-2 shrink-0">
   <button
      onClick={() => {
        setTempPersonalMenus(personalMenus);
        setSelectedPersonalMenuId("");
        setEditIconOpen(false);
        setTempQuickMenuKeys(quickMenuKeys);
        setMenuManageMode("edit");
      }}
      className={`
        h-9
        px-4
        rounded-xl
        text-xs
        font-bold
        transition
        cursor-default
        ${
          menuManageMode === "edit"
            ? "bg-gray-800 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
      `}
    >
      수정
    </button>

    <button
      onClick={() => {
        setSelectedPersonalMenuId("");
        setSelectedDeleteMenuIds([]);
        setMenuManageMode("delete");
      }}
      className={`
        h-9
        px-4
        rounded-xl
        text-xs
        font-bold
        transition
        cursor-default
        ${
          menuManageMode === "delete"
            ? "bg-red-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500"
        }
      `}
    >
      삭제
    </button>
  </div>
</div>
<div className="flex-1 overflow-y-auto p-5">

  {menuManageMode === "sort" && (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleMenuSortDragEnd}
    >
      <SortableContext
        items={tempMenus.map((menu) => menu.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {tempMenus.map((menu) => (
      <SortableMenuSortCard
    key={menu.id}
    menu={menu}
    tempHiddenMenuIds={tempHiddenMenuIds}
    setTempHiddenMenuIds={setTempHiddenMenuIds}

    onContextMenu={(e) => {


  if (!menu.isPersonal) return;

  e.preventDefault();

  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    type: "menuManage",
    id: menu.id,
  });
}}
    onEdit={() => {
  if (!menu.isPersonal) return;

  const targetMenu = tempPersonalMenus.find(
    (item) => item.id === menu.id
  );

  if (!targetMenu) return;

  startEditPersonalMenu(targetMenu);
  setMenuManageMode("edit");
}}
  />
))}
          <button
  onClick={() => {
  resetPopupPosition("menuAdd");
  setMenuAddOpen(true);
}}
  className="
    bg-white
    p-7
    sm:p-8
    rounded-3xl
    shadow
    border
    border-dashed
    border-gray-300
    min-h-[190px]
    cursor-default
    flex
    items-center
    justify-center
    hover:bg-gray-50
    hover:shadow-xl
    hover:-translate-y-1
    transition
  "
>
  <Plus className="w-10 h-10 text-gray-300" />
</button>
        </div>
      </SortableContext>
    </DndContext>
  )}

  {menuManageMode === "edit" && (
  <div
    onClick={() => {
      if (selectedPersonalMenuId) {
        saveEditingMenuAndClose();
      }
    }}
    className="space-y-5"
  >
    <div
      className="
        bg-white
       p-5
pb-3
sm:p-6
sm:pb-4
        rounded-3xl
        shadow
        border
        border-gray-200
        min-h-[180px]
        cursor-default
      "
    >
      <h2 className="text-lg font-bold text-gray-900">
        빠른메뉴 실행하기
      </h2>

      <p className="text-sm text-gray-500 mt-1 leading-relaxed break-keep">
        메인화면에서 바로 실행할 메뉴를 최대 4개까지 선택할 수 있습니다.
        추후 기능이 추가되면 선택 가능한 메뉴도 함께 추가됩니다.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {Array.from({ length: 4 }).map((_, index) => {
          const selectedKey = tempQuickMenuKeys[index];

          const selectedMenu = quickMenuOptions.find(
            (item) => item.key === selectedKey
          );

          if (!selectedMenu) {
            return (
              <button
                key={index}
                onClick={() => setQuickMenuSelectOpen(true)}
                className="
                  h-[50px]
                  rounded-2xl
                  border
                  border-dashed
                  border-gray-300
                  bg-gray-50
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-bold
                  text-gray-400
                  hover:bg-gray-100
                  hover:-translate-y-0.5
                  hover:shadow-md
                  transition
                  cursor-default
                "
              >
                <Plus className="w-5 h-5" />
              </button>
            );
          }

          return (
            <div
              key={selectedMenu.key}
             className="
  relative
  h-[50px]
  px-4
  rounded-2xl
  border
  border-blue-200
  bg-blue-50
  flex
  items-center
  justify-center
                gap-2
                hover:-translate-y-0.5
                hover:shadow-md
                transition
              "
            >
              <span className="flex-1 text-center text-sm font-bold text-blue-600">
                {selectedMenu.title}
              </span>

              <button
                onClick={() => {
                  setTempQuickMenuKeys((prev) =>
  prev.filter((key) => key !== selectedMenu.key)
);
                }}
                className="
  absolute
  right-3
  top-1/2
  -translate-y-1/2
  w-7
  h-7
  rounded-full
                  flex
                  items-center
                  justify-center
                  text-blue-500
                  hover:bg-blue-100
                  transition hover:scale-105 active:scale-95
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>

        
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
                {tempPersonalMenus.map((menu) => {
          const Icon = personalMenuIcons[menu.iconKey];
          const isSelected = selectedPersonalMenuId === menu.id;

          return (
            <div
  key={menu.id}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "menuManage",
      id: menu.id,
    });
  }}
  onClick={(e) => {
    e.stopPropagation();
    startEditPersonalMenu(menu);
  }}
              className="
                bg-white
                p-7
                sm:p-8
                rounded-3xl
                shadow
                border
                border-gray-200
                min-h-[190px]
                cursor-default
                transition
                hover:shadow-xl
                hover:-translate-y-1
              "
            >
              {!isSelected ? (
                <>
                  <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

                  <h2 className="text-lg font-bold text-gray-900">
                    {menu.title}
                  </h2>

                  <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
                    {menu.desc}
                  </p>
                </>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditIconOpen(!editIconOpen)}
                    className="
                      w-11
                      h-11
                      rounded-2xl
                      bg-white
                      border
                      border-gray-200
                      flex
                      items-center
                      justify-center
                      mb-3
                      cursor-pointer
                      hover:bg-gray-50
                      transition
                    "
                  >
                    <Icon className="w-5 h-5 text-blue-600 shrink-0" />
                  </button>

                  {editIconOpen && (
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      {Object.entries(personalMenuIcons).map(([key, Icon]) => (
                        <button
                          key={key}
                          onClick={() =>
                            setNewMenuIcon(key as PersonalMenuIconKey)
                          }
                          className="
                            h-9
                            rounded-xl
                            flex
                            items-center
                            justify-center
                            cursor-pointer
                            transition
                            group
                          "
                        >
                          <Icon
                            className={`
                              w-5
                              h-5
                              shrink-0
                              transition
                              ${
                                newMenuIcon === key
                                  ? "text-blue-600"
                                  : "text-gray-400 group-hover:text-gray-500"
                              }
                            `}
                          />
                        </button>
                      ))}
                      
                    </div>
                  )}

                  <input
                    value={newMenuTitle}
                    onChange={(e) => setNewMenuTitle(e.target.value)}
                    placeholder="메뉴명"
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
                  />

                  <input
                    value={newMenuDesc}
                    onChange={(e) => setNewMenuDesc(e.target.value)}
                    placeholder="설명글"
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
                  />

                  <input
                    value={newMenuLink}
                    onChange={(e) => setNewMenuLink(e.target.value)}
                    placeholder="링크"
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none"
                  />
                </div>
              )}
            </div>
          );
                })}

        <button
          onClick={() => {
  resetPopupPosition("menuAdd");
  setMenuAddOpen(true);
}}
          className="
            bg-white
            p-7
            sm:p-8
            rounded-3xl
            shadow
            border
            border-dashed
            border-gray-300
            min-h-[190px]
            cursor-default
            flex
            items-center
            justify-center
            hover:bg-gray-50
            hover:shadow-xl
hover:-translate-y-1
            transition
          "
        >
          <Plus className="w-10 h-10 text-gray-300" />
        </button>
      </div>
    
  </div>
)}

  {menuManageMode === "delete" && (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
      {personalMenus.length === 0 ? (
        <div className="col-span-full min-h-[380px] flex items-center justify-center pt-16 text-center text-sm text-gray-400">
  삭제할 개인 메뉴가 없습니다.
</div>
      ) : (
        personalMenus.map((menu) => {
          const Icon = personalMenuIcons[menu.iconKey];
          const isSelected = selectedDeleteMenuIds.includes(menu.id);

          return (
           <button
  key={menu.id}
  onClick={() =>
  setSelectedDeleteMenuIds((prev) =>
    prev.includes(menu.id)
      ? prev.filter((id) => id !== menu.id)
      : [...prev, menu.id]
  )
}
  className={`
    p-7
    sm:p-8
    rounded-3xl
    shadow
    border
    min-h-[190px]
    text-left
    cursor-default
    transition
    hover:shadow-xl
    hover:-translate-y-1
    ${
      isSelected
        ? "bg-red-50 border-red-200"
        : "bg-white border-gray-200"
    }
  `}
>
  <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

  <h2 className="text-lg font-bold leading-snug text-gray-900">
    {menu.title}
  </h2>

  <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
    {menu.desc}
  </p>
</button>
          );
        })
      )}
    </div>
  )}
</div>

      <div className="border-t border-gray-100 bg-white p-4 flex gap-3 justify-center">
  <button
    onClick={() => {
      if (menuManageMode === "edit") {
        cancelEditingMenu();
        return;
      }

      if (menuManageMode === "delete") {
        setSelectedDeleteMenuIds([]);
        return;
      }

           setTempMenus(menus);
      setTempPersonalMenus(personalMenus);
      setTempQuickMenuKeys(quickMenuKeys);
      setTempHiddenMenuIds(hiddenMenuIds);
      setSelectedPersonalMenuId("");
    }}
    className="
      w-32
      h-12
      rounded-2xl
      bg-gray-100

      text-gray-700
      text-sm
      font-bold
      hover:bg-gray-200
      transition
      cursor-default
    "
  >
    취소
  </button>

  {menuManageMode === "sort" && (
    <button
      onClick={() => {
        saveMenuManageChanges("popup");
      }}
      className="
        w-32
        h-12
        rounded-2xl
        bg-gray-800
        text-white
        text-sm
        font-bold
        hover:bg-gray-700
        transition
        cursor-default
      "
    >
      저장
    </button>
  )}

  {menuManageMode === "edit" && (
    <button
      onClick={() => {
        saveMenuManageChanges("popup");
      }}
      disabled={!hasMenuManageChanges()}
      className="
        w-32
        h-12
        rounded-2xl
        bg-gray-800
        text-white
        text-sm
        font-bold
        hover:bg-gray-700
        disabled:bg-gray-200
        disabled:text-gray-400
        transition
        cursor-default
      "
    >
      저장
    </button>
  )}

  {menuManageMode === "delete" && (
    <button
      onClick={() => setDeleteConfirmOpen(true)}
      disabled={selectedDeleteMenuIds.length === 0}
      className="
        w-32
        h-12
        rounded-2xl
        bg-red-500
        text-white
        text-sm
        font-bold
        hover:bg-red-600
        disabled:bg-gray-200
        disabled:text-gray-400
        transition
        cursor-default
      "
    >
      삭제
    </button>
  )}
</div>
    </div>
  </div>
)}



{/* 메뉴 추가 팝업 */}
{menuAddOpen && (
  <div
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("menuAdd")}
  className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6"
>
      <div
  onPointerDown={(e) => startPopupDrag("menuAdd", e)}
  className="flex items-center justify-between mb-5"
>
        <h2 className="text-xl font-black text-gray-900">
          메뉴 추가
        </h2>

        <button
          onClick={() => setMenuAddOpen(false)}
          className="
            w-9
            h-9
            rounded-full
            flex
            items-center
            justify-center
            text-gray-400
            hover:bg-gray-100
            transition
            cursor-pointer
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">
          아이콘 선택
        </p>

        <div className="grid grid-cols-6 gap-2">
          {Object.entries(personalMenuIcons).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setNewMenuIcon(key as PersonalMenuIconKey)}
              className={`
                h-12
                rounded-2xl
                border
                flex
                items-center
                justify-center
                transition
                cursor-default
                ${
                  newMenuIcon === key
                    ? "bg-gray-800 border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <input
        value={newMenuTitle}
        onChange={(e) => setNewMenuTitle(e.target.value)}
        placeholder="메뉴명"
        className="
          w-full
          h-12
          rounded-2xl
          border
          border-gray-200
          px-4
          text-sm
          outline-none
          mb-3
        "
      />

      <input
        value={newMenuDesc}
        onChange={(e) => setNewMenuDesc(e.target.value)}
        placeholder="설명글"
        className="
          w-full
          h-12
          rounded-2xl
          border
          border-gray-200
          px-4
          text-sm
          outline-none
          mb-3
        "
      />

      <input
        value={newMenuLink}
        onChange={(e) => setNewMenuLink(e.target.value)}
        placeholder="링크"
        className="
          w-full
          h-12
          rounded-2xl
          border
          border-gray-200
          px-4
          text-sm
          outline-none
          mb-5
        "
      />

      <div className="flex gap-3">
        <button
          onClick={() => {
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setMenuAddOpen(false);
}}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-gray-100
            text-gray-700
            text-sm
            font-bold
            hover:bg-gray-200
            transition
            cursor-default
          "
        >
          취소
        </button>

        <button
          onClick={addPersonalMenu}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-gray-800
            text-white
            text-sm
            font-bold
            hover:bg-gray-700
            transition
            cursor-default
          "
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}




      {/* 메모장 팝업 */}
      {memoOpen && (
  <div
  onClick={() => setContextMenu(null)}
  className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4"
>
          <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("memo")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col"
>
            <div
  onPointerDown={(e) => startPopupDrag("memo", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
              <div className="font-bold flex items-center gap-2">
                <NotebookPen className="w-5 h-5" />
                메모장
              </div>

              <button
                onClick={() => setMemoOpen(false)}
                className="
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  hover:bg-white/10
                  transition
                  cursor-pointer
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
  <div className="grid grid-cols-[1fr_auto] gap-3">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

      <input
        value={memoSearch}
        onChange={(e) => {
          setMemoSearch(e.target.value);
          setMemoPage(1);
        }}
        placeholder="메모 검색"
       className="
  w-full
  h-12
  rounded-2xl
  border
  border-gray-200
  bg-white
  pl-11
  pr-4
  text-sm
  outline-none
  focus:border-gray-400
  focus:ring-2
  focus:ring-gray-100
  transition
"
      />
    </div>

    <button
      onClick={() => setMemoAddOpen(true)}
      className="
  h-12
  rounded-2xl
  bg-gray-800
  text-white
  px-5
  text-sm
  font-bold
  flex
  items-center
  justify-center
  gap-1.5
  hover:bg-gray-700
  transition
  cursor-default
"
    >
      <Plus className="w-4 h-4" />
      추가
    </button>
  </div>
</div>

              

            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              {pagedMemos.length === 0 ? (
  <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400 min-h-[450px]">
    저장된 메모가 없습니다.
  </div>
) : (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleMemoDragEnd}
  >
    <SortableContext
      items={pagedMemos
        .filter((memo) => !memo.pinned)
        .map((memo) => memo.id)}
      strategy={rectSortingStrategy}
    >
      {pagedMemos.map((memo) => (
        <SortableMemoCard key={memo.id} memo={memo}>
          <div
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "memo",
      id: memo.id,
    });
  }}
  onDoubleClick={() => setSelectedMemo(memo)}
            className={`
              rounded-2xl
              border
              shadow-sm
              ${getMemoColorClass(memo.color)}
              hover:shadow-md
              hover:-translate-y-0.5
              transition-all
              duration-200
              cursor-default
              p-4
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 flex flex-col min-h-[130px]">
                <h3 className="text-sm font-black text-gray-900 mb-2 break-keep">
                  {memo.title}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep">
                  {memo.content}
                </p>

                <p className="text-[11px] text-gray-400 mt-auto pt-3">
                  수정일{" "}
                  {new Date(memo.updatedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMemoVisible(memo.id);
                  }}
                  className={`
  w-10
  h-10
  rounded-full
  hidden
  sm:flex
  items-center
  justify-center
  border
  transition
  cursor-default
  ${
    memo.visible
      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
  }
`}
title="메인 노출"
                >
                  {memo.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMemoPinned(memo.id);
                  }}
                                    className={`
  w-10
  h-10
  rounded-full
  flex
  items-center
  justify-center
  border
  transition
  cursor-default
  ${
    memo.pinned
      ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
  }
`}
title="상단 고정"

                >
                  <Pin className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMemo(memo);
                  }}
                  className="
                    w-10
                    h-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    border
                    border-gray-200
                    bg-white
                    text-gray-400
                    hover:bg-gray-50
                    hover:text-gray-600
                    transition
                    cursor-default
                  "
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

            <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100 bg-white">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
                  disabled={memoPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white disabled:hover:text-gray-300 cursor-default"
                >
                  이전
                </button>

                {Array.from({
                  length: Math.min(totalMemoPages, 10),
                }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      onClick={() => setMemoPage(page)}
                      className={`px-4 py-2 border-l border-gray-200 cursor-default ${
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
                  onClick={() =>
                    setMemoPage((p) => Math.min(totalMemoPages, p + 1))
                  }
                  disabled={memoPage === totalMemoPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white disabled:hover:text-gray-300 cursor-default"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

              {/* 메모 추가 팝업 */}
      {memoAddOpen && (
  <div
    onClick={() => setMemoAddOpen(false)}
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
          <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6"
>
            <div className="flex items-center justify-between mb-5">
  <h2 className="text-xl font-black text-gray-900">
    메모 추가
  </h2>

  <div className="flex items-center gap-2">
    {memoColorOptions.map((color) => (
      <button
        key={color.value}
        type="button"
        onClick={() => setMemoColor(color.value)}
        className={`
          w-7
          h-7
          rounded-full
          border
          transition
          hover:scale-105
          ${
            memoColor === color.value
              ? "ring-2 ring-gray-400 ring-offset-2"
              : ""
          }
          ${color.className}
        `}
      />
    ))}

    <button
      onClick={() => setMemoAddOpen(false)}
      className="
        w-9
        h-9
        rounded-full
        flex
        items-center
        justify-center
        text-gray-400
        hover:bg-gray-100
        transition
        cursor-pointer
      "
    >
      <X className="w-5 h-5" />
    </button>
  </div>
</div>

            <input
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="메모 제목"
              className="
                w-full
                h-12
                rounded-2xl
                border
                border-gray-200
                px-4
                text-sm
                outline-none
                mb-3
              "
            />

            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              className="
                w-full
                h-56
                rounded-2xl
                border
                border-gray-200
                p-4
                text-sm
                outline-none
                resize-none
                mb-5
              "
            />

            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
  {authUser && authStatus === "approved"
    ? "※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다."
    : "※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다."}
</p>

            <div className="flex gap-3">
              <button
                onClick={() => setMemoAddOpen(false)}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-100
                  text-gray-700
                  text-sm
                  font-bold
                  hover:bg-gray-200
                  transition
                  cursor-default
                "
              >
                취소
              </button>

              <button
  onClick={() => {
   addMemo();
setMemoAddOpen(false);


  }}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-800
                  text-white
                  text-sm
                  font-bold
                  hover:bg-gray-700
                  transition
                  cursor-default
                "
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

            {/* 메모 상세 팝업 */}
      {selectedMemo && (
  <div
    className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
  >
         <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("memoDetail")}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6"
>
            <div
  onPointerDown={(e) => startPopupDrag("memoDetail", e)}
  className="flex items-center justify-between mb-5"
>
  <h2 className="text-xl font-black text-gray-900">
    메모 수정
  </h2>

  <div className="flex items-center gap-2">
    {memoColorOptions.map((color) => (
      <button
        key={color.value}
        type="button"
        onClick={() => {
          changeMemoColor(selectedMemo.id, color.value);

          setSelectedMemo({
            ...selectedMemo,
            color: color.value,
            updatedAt: new Date().toISOString(),
          });
        }}
        className={`
          w-7
          h-7
          rounded-full
          border
          transition
          hover:scale-105
          ${
            selectedMemo.color === color.value
              ? "ring-2 ring-gray-400 ring-offset-2"
              : ""
          }
          ${color.className}
        `}
      />
    ))}

    <button
  onClick={() => {
  setSelectedMemo(null);
}}
      className="
        w-9
        h-9
        rounded-full
        flex
        items-center
        justify-center
        text-gray-400
        hover:bg-gray-100
        transition
        cursor-pointer
      "
    >
      <X className="w-5 h-5" />
    </button>
  </div>
</div>
              

            <input
  value={selectedMemo.title}
  onChange={(e) => {
    setSelectedMemo({
      ...selectedMemo,
      title: e.target.value,
    });
  }}
  placeholder="메모 제목"
  className="
    w-full
    h-12
    rounded-2xl
    border
    border-gray-200
    px-4
    text-sm
    outline-none
    mb-3
  "
/>

<textarea
  value={selectedMemo.content}
  onChange={(e) => {
    setSelectedMemo({
      ...selectedMemo,
      content: e.target.value,
    });
  }}
  placeholder="메모 내용을 입력하세요"
  className="
    w-full
    h-56
    rounded-2xl
    border
    border-gray-200
    p-4
    text-sm
    outline-none
    resize-none
    mb-5
  "
/>

<p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
  {authUser && authStatus === "approved"
    ? "※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다."
    : "※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다."}
</p>

<div className="flex gap-3">
  <button
    onClick={() => {
      deleteMemo(selectedMemo.id);
      
    }}
    className="
      flex-1
      h-12
      rounded-2xl
      bg-gray-100
      text-gray-600
      text-sm
      font-bold
      hover:bg-red-50
      hover:text-red-500
      transition
      cursor-default
    "
  >
    삭제
  </button>

 <button
 onClick={() => {
    const nextMemos = memos.map((memo) =>
      memo.id === selectedMemo.id
        ? {
            ...selectedMemo,
            color: selectedMemo.color,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : memo
    );
    saveMemos(nextMemos);
    setSelectedMemo(null);
    setSaveConfirmType("popup");
  }}

    className="
      flex-1
      h-12
      rounded-2xl
      bg-gray-800
      text-white
      text-sm
      font-bold
      hover:bg-gray-700
      transition
      cursor-default
    "
  >
    완료
  </button>
</div>
          </div>
        </div>
      )}

      

      <HospitalInfoPopup
  open={hospitalOpen}
  onClose={() => setHospitalOpen(false)}
/>

<DiseaseCodePopup
  open={diseaseOpen}
  onClose={() => setDiseaseOpen(false)}
/>

{bankRateOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div
      style={getPopupStyle("bankRate")}
      className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
    >
      <div
        onMouseDown={(e) => startPopupDrag("bankRate", e)}
        className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
      >
        <div className="font-bold flex items-center gap-2">
          <Percent className="w-5 h-5" />
          주요 은행 {bankRateMonth}개월 예금 금리
        </div>

        <button
          onClick={() => setBankRateOpen(false)}
          className="
            w-9
            h-9
            rounded-full
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setBankRateMonth("12")}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              bankRateMonth === "12"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            12개월
          </button>

          <button
            onClick={() => setBankRateMonth("24")}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              bankRateMonth === "24"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            24개월
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-700">
            은행별 기본금리
          </p>

          <p className="text-xs font-bold text-gray-400">
            금리 공시월 · {bankBaseDate}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bankRates.map((bank) => (
            <button
              key={bank.name}
              type="button"
              onDoubleClick={() => {
                if (bank.url) window.open(bank.url, "_blank");
              }}
              className={`
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-4
                min-h-[150px]
                flex
                flex-col
                items-center
                justify-center
                text-center
                shadow-sm
                transition
                hover:shadow-md
                ${bank.hover}
              `}
            >
              <img
                src={`/logos/banks/${bank.logo}.png`}
                alt={bank.name}
                className="w-10 h-10 object-contain mb-3"
              />

              <p className="text-sm font-semibold text-gray-800 break-keep">
                {bank.name}
              </p>

              <p className="text-xs font-medium text-gray-400 mt-3">
                기본금리
              </p>

              <p className="text-2xl font-black text-gray-900 mt-1">
                {bank.rate}
              </p>
            </button>
          ))}
        </div>

       <div className="border-t border-gray-100 mt-5 pt-4">
  <p className="text-xs text-gray-400 leading-relaxed break-keep">
    ※ 금리는 변동될 수 있으니 정확한 내용은 각 은행 홈페이지에서 확인해주세요.
  </p>

  <p className="text-xs text-gray-400 leading-relaxed mt-1 break-keep">
    ※ 은행 카드 더블클릭 시 해당 은행 홈페이지로 이동합니다.
  </p>
</div>
      </div>
    </div>
  </div>
)}



{npsTableOpen && (
  <div
    onClick={() => setNpsTableOpen(false)}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("nps")}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("nps", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          국민연금 예상연금월액표
        </div>

        <button
          onClick={() => setNpsTableOpen(false)}
          className="
            cursor-pointer
            w-9
            h-9
            rounded-full
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-5">
          {(["노령연금", "장애연금", "유족연금"] as NpsTableTab[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                setNpsTableTab(item);
                setNpsSearch("");
              }}
              className={`rounded-xl py-3 text-sm font-bold transition ${
                npsTableTab === item
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={
              npsSearch
                ? Number(npsSearch.replaceAll(",", "")).toLocaleString()
                : ""
            }
            onChange={(e) =>
              setNpsSearch(
                e.target.value.replaceAll(",", "").replace(/[^0-9]/g, "")
              )
            }
            placeholder="보험료 또는 기준소득월액 검색"
            className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="overflow-auto flex-1 border border-gray-200 rounded-2xl">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
                  번호
                </th>

                <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
                  기준소득월액
                </th>

                <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
                  보험료
                </th>

                {npsTableTab === "노령연금" ? (
                  <>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">15년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">20년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">25년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">30년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">35년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">40년</th>
                  </>
                ) : npsTableTab === "장애연금" ? (
                  <>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애1급</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애2급</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애3급</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애4급</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10년 미만</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10~20년</th>
                    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">20년 이상</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredNpsTable.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
                    {row.no?.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
                    {row.income?.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
                    {row.premium?.toLocaleString()}
                  </td>

                  {npsTableTab === "노령연금" ? (
                    <>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year10?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year15?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year20?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year25?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year30?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year35?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year40?.toLocaleString()}</td>
                    </>
                  ) : npsTableTab === "장애연금" ? (
                    <>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade1?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade2?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade3?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade4Lump?.toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.under10?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.between10And20?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center border-b border-gray-100">{row.year20?.toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNpsTable.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-10">
              검색 결과가 없습니다
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mt-4 px-1">
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;본 표는 2026년 국민연금 예상연금월액표 기준이며,
          실제 수령액은 가입이력 · 재평가율 · 연금개시연령 ·
          부양가족연금액 및 제도 변경 등에 따라 달라질 수 있습니다. (단위 :원)
        </p>
      </div>
    </div>
  </div>
)}

{lifeOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div
  style={getPopupStyle("life")}
  className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("life", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          기대수명 계산기
        </div>

        <button
          onClick={() => setLifeOpen(false)}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
          {(["남성", "여성"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setLifeGender(item)}
              className={`rounded-xl py-3 text-sm font-bold transition ${
                lifeGender === item
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <div className="relative">
            <input
              value={lifeAge}
              onChange={(e) =>
                setLifeAge(
                  e.target.value.replace(/[^0-9]/g, "")
                )
              }
              placeholder="나이를 입력하세요"
              className="
                w-full
                h-14
                rounded-2xl
                border
                border-gray-200
                px-5
                pr-16
                text-lg
                font-bold
                outline-none
              "
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
              세
            </span>
          </div>
        </div>
{!selectedLife && (
  <div className="bg-blue-50 rounded-3xl p-8 text-center mb-5">
    <img
      src={`/icons/pension/${lifeGender === "남성" ? "male" : "female"}.png`}
      alt={lifeGender}
      className="w-20 h-20 object-contain mx-auto mb-4"
    />

    <p className="text-sm text-gray-400 leading-relaxed">
      나이를 입력하면 기대여명과 건강기간을 확인할 수 있습니다.
    </p>
   
  </div>
  
)}
        {selectedLife && (
  <>
    <div className="bg-blue-50 rounded-3xl p-6 text-center mb-5">
      <img
        src={`/icons/pension/${lifeGender === "남성" ? "male" : "female"}.png`}
        alt={lifeGender}
        className="w-20 h-20 object-contain mx-auto mb-4"
      />

      <p className="text-gray-700 text-lg font-medium leading-relaxed">
        현재 <span className="font-bold">{lifeAge}세</span>{" "}
        <span className="font-bold">{lifeGender}</span> 기준,
        <br />
        예상 기대수명은 약{" "}
        <span className="text-blue-600 font-black">
          {expectAge.toFixed(1)}세
        </span>
        입니다.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          기대여명
        </p>

        <p className="text-2xl font-black text-blue-600">
          {expectYears.toFixed(1)}년
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          건강기간
        </p>

        <p className="text-2xl font-black text-blue-600">
          {healthyYears.toFixed(1)}년
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          유병기간
        </p>

        <p className="text-2xl font-black text-blue-600">
          {sickYears.toFixed(1)}년
        </p>
      </div>
    </div>

    <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-200 p-4">
     <p className="text-sm text-gray-700 leading-relaxed">
  현재 <span className="font-bold">{lifeAge}세</span>{" "}
  <span className="font-bold">{lifeGender}</span> 기준,
  예상 기대수명은 약{" "}
  <span className="font-bold text-blue-600">
    {expectAge.toFixed(1)}세
  </span>
  이며 남은 기대여명은 약{" "}
  <span className="font-bold text-blue-600">
    {expectYears.toFixed(1)}년
  </span>
  입니다.
  <br />
  건강기간은 약{" "}
  <span className="font-bold text-blue-600">
    {healthyYears.toFixed(1)}년
  </span>
  으로, 약{" "}
  <span className="font-bold text-blue-600">
    {sickStartAge.toFixed(1)}세
  </span>
  부터 평균{" "}
  <span className="font-bold text-blue-600">
    {sickYears.toFixed(1)}년
  </span>
  동안 유병기간이 이어질 수 있습니다.
</p>
    </div>
  </>
)}
<p className="text-xs text-gray-500 leading-relaxed mt-5 px-1">
  본 자료는 통계청 「2024년 생명표」 및
  유병기간 제외 기대수명(건강수명) 통계를 참고하여 계산한 추정값이며,
  개인의 건강상태 · 생활습관 · 질병 이력 등에 따라 실제 결과와 다를 수 있습니다.
</p>
      </div>
    </div>
  </div>
)}
{pressOpen && (
  <div
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
>
    <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("press")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("press", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          보도자료
        </div>

        <button
          onClick={() => {
            setPressOpen(false);
            setSelectedPress(null);
          }}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!selectedPress ? (
        <>
          <div className="p-4 border-b border-gray-100">
  <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3">
    <Search className="w-5 h-5 text-gray-400" />

    <input
      value={pressSearch}
      onChange={(e) => {
        setPressSearch(e.target.value);
        setPressPage(1);
      }}
      placeholder="보도자료 검색"
      className="w-full outline-none text-sm bg-transparent"
    />
  </div>
</div>

                                        <div className="flex-1 min-h-0 flex flex-col">
  {/* 모바일 카드형 */}
  <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 md:hidden">
              {paginatedPress.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPress(item);
                                        const nextReadPressIds = Array.from(new Set([...readPressIds, item.id]));
                    setReadPressIds(nextReadPressIds);
                    if (authUser && authStatus === "approved") {
                      supabase.from("profiles").update({ read_press_ids: nextReadPressIds }).eq("id", authUser.id).then();
                    } else {
                      localStorage.setItem("readPressIds", JSON.stringify(nextReadPressIds));
                    }

                  }}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">
                          NO. {filteredPress.length - ((pressPage - 1) * PRESS_PER_PAGE + index)}
                        </span>
                        {!readPressIds.includes(item.id) && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">NEW</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm leading-snug break-keep line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {item.source} · {item.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

  {/* PC 테이블형 */}
  <div className="hidden md:block overflow-y-auto flex-1 p-4">
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
          <th className="py-3 w-20">번호</th>
          <th className="py-3 text-center">제목</th>
          <th className="py-3 w-32">출처</th>
          <th className="py-3 w-32">날짜</th>
        </tr>
      </thead>
      <tbody>
        {paginatedPress.map((item, index) => (
          <tr
            key={item.id}
            onClick={() => {
              setSelectedPress(item);
                                  const nextReadPressIds = Array.from(new Set([...readPressIds, item.id]));
                    setReadPressIds(nextReadPressIds);
                    if (authUser && authStatus === "approved") {
                      supabase.from("profiles").update({ read_press_ids: nextReadPressIds }).eq("id", authUser.id).then();
                    } else {
                      localStorage.setItem("readPressIds", JSON.stringify(nextReadPressIds));
                    }

            }}
            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
          >
            <td className="py-4 text-center text-gray-700 border-b border-gray-100">
              {filteredPress.length - ((pressPage - 1) * PRESS_PER_PAGE + index)}
            </td>
            <td className="py-4 font-medium text-gray-800 border-b border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate">{item.title}</span>
                {!readPressIds.includes(item.id) && (
                  <span className="shrink-0 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">NEW</span>
                )}
              </div>
            </td>
            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">{item.source}</td>
            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">{item.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>



                                               <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setPressPage((p) => Math.max(1, p - 1))}
                  disabled={pressPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  이전
                </button>

                               {Array.from({
                  length: Math.min(totalPressPages, 10),
                }).map((_, index) => {
                  const page = index + 1;
                  const start = Math.max(1, Math.min(pressPage - 2, totalPressPages - 4));
                  const end = Math.min(totalPressPages, start + 4);
                  if (page < start || page > end) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setPressPage(page)}
                      className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                        pressPage === page
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}


                <button
                  onClick={() =>
                    setPressPage((p) => Math.min(totalPressPages, p + 1))
                  }
                  disabled={pressPage === totalPressPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  다음
                </button>
              </div>
            </div>



          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h2 className="text-2xl font-black text-gray-900 break-keep leading-snug">
              {selectedPress.title}
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              {selectedPress.date} · {selectedPress.source}
            </p>

            <div className="border-t border-gray-200 mt-4 pt-3 break-keep text-[15px] leading-[1.8] text-gray-700">
  {selectedPress.pdfs && (
    <div className="flex flex-wrap gap-3 mb-4">
      {selectedPress.pdfs.map((pdf: string, index: number) => (
        <a
          key={index}
          href={pdf}
          download
          className="
            inline-flex
            items-center
            gap-1.5
            text-sm
            text-gray-500
            underline
            underline-offset-2
            hover:text-gray-700
            transition
          "
        >
          <FileText className="w-4 h-4" />
          PDF 다운로드
          {selectedPress.pdfs.length > 1 && ` ${index + 1}`}
        </a>
      ))}
    </div>
  )}

  <div className="whitespace-pre-line">
    {selectedPress.body}
  </div>

  {selectedPress.pdfs?.[0] && (
    <div className="mt-6">
      <iframe
        src={selectedPress.pdfs[0]}
        className="
          w-full
          h-[900px]
          rounded-2xl
          border
          border-gray-200
        "
      />

      <p className="text-xs text-gray-400 mt-2">
        일부 모바일 환경에서는 PDF 미리보기가 지원되지 않을 수 있습니다.
      </p>
    </div>
  )}
</div>
          </div>

          <div className="border-t border-gray-200 p-4 text-center">
            <button
              onClick={() => setSelectedPress(null)}
              className="px-5 py-3 rounded-xl bg-gray-700 text-white text-sm font-bold cursor-pointer hover:bg-gray-600 transition"
            >
              목록으로
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


      {/* 개인공간 PIN 팝업 */}
      {cmPinOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 px-8 pt-10 pb-8">
<button
  onClick={() => setCmPinOpen(false)}
  className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
>
  <X className="w-4 h-4 text-gray-500" />
</button>

            {cmPinState === "not-approved" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">승인 회원 전용</h2>
                <p className="text-sm text-gray-500 mb-6">개인공간 기능은 승인된 회원만 이용 가능합니다.<br />로그인 후 승인을 받으세요.</p>
                <button onClick={() => setCmPinOpen(false)}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition cursor-pointer">확인</button>
              </div>
            )}

            {cmPinState === "no-pin" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{cmPinStep === "enter" ? "PIN 설정" : "PIN 확인"}</h2>
                <p className="text-sm text-gray-500 mb-5">{cmPinStep === "enter" ? "개인공간 전용 4자리 PIN을 설정해주세요." : "PIN을 한 번 더 입력해주세요."}</p>
                <div className="flex justify-center gap-3 mb-5">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${(cmPinStep === "enter" ? cmPinInput : cmPinConfirm).length > i ? "bg-blue-600 border-blue-600" : "border-gray-300"}`} />
                  ))}
                </div>
                {cmPinError && <p className="text-xs text-red-500 mb-3">{cmPinError}</p>}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {["1","2","3","4","5","6","7","8","9"].map((n) => (
                    <button key={n} onClick={() => handleCmKeypad(n)} className="py-4 rounded-2xl bg-gray-50 text-xl font-semibold hover:bg-gray-100 transition cursor-pointer">{n}</button>
                  ))}
                  <div />
                  <button onClick={() => handleCmKeypad("0")} className="py-4 rounded-2xl bg-gray-50 text-xl font-semibold hover:bg-gray-100 transition cursor-pointer">0</button>
                  <button onClick={() => handleCmKeypad("del")} className="py-4 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
                  </button>
                </div>
                <button onClick={() => setCmPinOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer">돌아가기</button>
              </div>
            )}

            {cmPinState === "locked" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">PIN 입력</h2>
                <p className="text-sm text-gray-500 mb-5">개인공간 4자리 PIN을 입력해주세요.</p>
                <div className="flex justify-center gap-3 mb-5">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${cmPinInput.length > i ? "bg-blue-600 border-blue-600" : "border-gray-300"}`} />
                  ))}
                </div>
                {cmPinError && <p className="text-xs text-red-500 mb-3">{cmPinError}</p>}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {["1","2","3","4","5","6","7","8","9"].map((n) => (
                    <button key={n} onClick={() => handleCmKeypad(n)} className="py-4 rounded-2xl bg-gray-50 text-xl font-semibold hover:bg-gray-100 transition cursor-pointer">{n}</button>
                  ))}
                  <div />
                  <button onClick={() => handleCmKeypad("0")} className="py-4 rounded-2xl bg-gray-50 text-xl font-semibold hover:bg-gray-100 transition cursor-pointer">0</button>
                  <button onClick={() => handleCmKeypad("del")} className="py-4 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
                  </button>
                </div>
                
              </div>
            )}

          </div>
        </div>
      )}

                                        </main>

          {resourceOpen && (
        <ResourceExplorer onClose={() => setResourceOpen(false)} authStatus={authStatus} authRole={authRole} />
      )}

 {/* 환율 변환기 (승인 구독자 전용 - 컴포넌트 내부에서 권한 체크) */}
        <CurrencyConverter />

        {salesBookAlertOpen && (
  <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30">
    <div className="w-[320px] rounded-3xl bg-white p-6 shadow-2xl text-center">
      <h3 className="text-lg font-black text-gray-900">
        서비스 준비중입니다
      </h3>

      <p className="mt-3 text-sm font-bold text-gray-500">
        세일즈북 서비스는 현재 제작 중입니다.
      </p>

      <button
        onClick={() => setSalesBookAlertOpen(false)}
   className="
  mt-6
  h-11
  w-full
  rounded-2xl
  bg-blue-600
  text-sm
  font-black
  text-white
  transition-all
  duration-200
  hover:bg-blue-700
  hover:shadow-lg
  cursor-pointer
"
      >
        확인
      </button>
    </div>
  </div>
)}

    </>
    );

}




function ExchangeIndexBar() {
  const [exchange, setExchange] = useState<any>(null);

  useEffect(() => {
    fetch("/api/exchange")
      .then((res) => res.json())
      .then((data) => setExchange(data))
      .catch(() => setExchange(null));
  }, []);

  if (!exchange?.items) {
    return (
      <div className="hidden md:block max-w-[1500px] mx-auto px-5 mb-22">
        <div className=" rounded-2xl px-4 py-3 text-center text-sm text-block-500">
          환율 정보를 불러오지 못했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block max-w-[1500px] mx-auto px-5 mb-22">
      <div className=" rounded-2xl px-4 py-3 ">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-600">
          <span className="font-bold text-gray-800">
            실시간 환율
          </span>

          {exchange.items.map((item: any) => (
            <span key={item.label}>
              {item.label}{" "}
              <b className="text-gray-900">
                {Math.round(item.value).toLocaleString()}원
              </b>
            </span>
          ))}

          

          <span className="text-[13px] text-gray-400">
  기준일 {exchange.date
    ? (() => {
        const d = new Date(exchange.date);
        return isNaN(d.getTime())
          ? exchange.date
          : d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      })()
    : "-"}
</span>

        </div>
      </div>
    </div>
  );
}

function SortableMenuSortCard({
  menu,
  onEdit,
  onContextMenu,
  tempHiddenMenuIds,
  setTempHiddenMenuIds,
  
}: {
  menu: any;
  onEdit: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  tempHiddenMenuIds: string[];
  setTempHiddenMenuIds: React.Dispatch<React.SetStateAction<string[]>>;
  
}) {


  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const Icon = menu.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
  <div
    ref={setNodeRef}
    style={style}
    {...attributes}
    {...listeners}
    onDoubleClick={onEdit}
    onContextMenu={onContextMenu}
    className="
      bg-white
      p-7
      sm:p-8
      rounded-3xl
      shadow
      border
      border-gray-200
      min-h-[190px]
      cursor-default
      transition
      hover:shadow-xl
      hover:-translate-y-1
       "
  >
    <div className="flex justify-between items-start mb-4">
            <Icon className="w-10 h-10 text-blue-600 shrink-0" />
     <button
  onClick={(e) => {
    e.stopPropagation();
    setTempHiddenMenuIds((prev) =>
      prev.includes(menu.id)
        ? prev.filter((id) => id !== menu.id)
        : [...prev, menu.id]
    );
  }}
  className="p-2 rounded-full hover:bg-gray-100 transition"
>
  {tempHiddenMenuIds.includes(menu.id) ? (
    <EyeOff className="w-5 h-5 text-gray-400" />
  ) : (
    <Eye className="w-5 h-5 text-gray-400" />
  )}
</button>



    </div>

    <h2 className="text-lg font-bold text-gray-900">

      {menu.title}
    </h2>

    <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
      {menu.desc}
    </p>
  </div>
);
}

function SortableMemoCard({
  memo,
  children,
}: {
  memo: MemoItem;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 80 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  if (memo.pinned) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "scale-[1.01]" : ""}
    >
      {children}
    </div>
  );
}

