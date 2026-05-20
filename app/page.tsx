"use client";
import DiseaseCodePopup from "./claim-docs/disease-code-popup";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";


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
    const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);

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

  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
    const [settingOpen, setSettingOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
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
  | "nps";

const [popupPositions, setPopupPositions] = useState<
  Partial<Record<PopupKey, { x: number; y: number }>>
>({});

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
  };
};

const resetPopupPosition = (key: PopupKey) => {
  setPopupPositions((prev) => ({
    ...prev,
    [key]: { x: 0, y: 0 },
  }));
};


  const [memos, setMemos] = useState<MemoItem[]>([]);
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


const [lifeGender, setLifeGender] = useState<"남성" | "여성">("남성");
const [lifeAge, setLifeAge] = useState("");
const [noticePage, setNoticePage] = useState(1);
const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [fixMessage, setFixMessage] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [contact, setContact] = useState("");
  const noticesPerPage = 10;
const totalNoticePages = Math.ceil(notices.length / noticesPerPage);

const pagedNotices = notices.slice(
  (noticePage - 1) * noticesPerPage,
  noticePage * noticesPerPage
);

const [hasUpdate, setHasUpdate] = useState(false);
const [readNoticeIds, setReadNoticeIds] = useState<number[]>([]);
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
const savedMemos = localStorage.getItem("personalMemos");

if (savedMemos) {
  setMemos(JSON.parse(savedMemos));
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
  const syncMemos = () => {
    const savedMemos = localStorage.getItem("personalMemos");

    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    } else {
      setMemos([]);
    }
  };

  window.addEventListener("memo-storage-updated", syncMemos);
  window.addEventListener("storage", syncMemos);

  return () => {
    window.removeEventListener("memo-storage-updated", syncMemos);
    window.removeEventListener("storage", syncMemos);
  };
}, []);

useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;

    const savedMemos = localStorage.getItem("personalMemos");
    if (!savedMemos) return;

    const parsedMemos: MemoItem[] = JSON.parse(savedMemos);
    const targetMemo = parsedMemos.find((memo) => memo.id === memoId);

    if (!targetMemo) return;

    setMemos(parsedMemos);
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
}, []);

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
  };

  if (settingOpen) {
    window.addEventListener("click", handleClick);
  }

  return () => {
    window.removeEventListener("click", handleClick);
  };
}, [settingOpen]);

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
  setQuickMenuKeys(tempQuickMenuKeys);

  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(finalMenus.map((menu) => menu.id))
  );

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

  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(nextMenus.map((menu) => menu.id))
  );

  setSelectedDeleteMenuIds([]);
  setDeleteConfirmOpen(false);

  setSelectedPersonalMenuId("");
setEditIconOpen(false);
};

const savePersonalMenus = (nextMenus: PersonalMenuItem[]) => {
  setPersonalMenus(nextMenus);
  localStorage.setItem("personalMenus", JSON.stringify(nextMenus));
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

    setSaveConfirmType("popup");
    setSaveConfirmMessage("메뉴가 추가되었습니다.");
    setSaveConfirmOpen(true);

    return;
  }

  const nextPersonalMenus = [...personalMenus, newMenu];

  savePersonalMenus(nextPersonalMenus);

  const nextMenus = [...menus, newMenuWithIcon];

  setMenus(nextMenus);
  setTempMenus(nextMenus);

  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(nextMenus.map((menu) => menu.id))
  );

  resetNewMenuForm();

  setSaveConfirmType("popup");
  setSaveConfirmMessage("메뉴가 추가되었습니다.");
  setSaveConfirmOpen(true);
};

const saveMemos = (nextMemos: MemoItem[]) => {
  setMemos(nextMemos);
  localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
  window.dispatchEvent(new Event("memo-storage-updated"));
};

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

  saveMemos([newMemo, ...memos]);

  setMemoTitle("");
setMemoContent("");
setMemoColor("white");
setMemoPage(1);
};

const updateMemo = (
  id: string,
  field: "title" | "content",
  value: string
) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          [field]: value,
          updatedAt: new Date().toISOString(),
        }
      : memo
  );

  saveMemos(nextMemos);
};

const toggleMemoVisible = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          visible: !memo.visible,
updatedAt: memo.updatedAt,
        }
      : memo
  );

  saveMemos(nextMemos);
};

const toggleMemoPinned = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          pinned: !memo.pinned,
          updatedAt: new Date().toISOString(),
        }
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

  const reorderedUnpinnedMemos = arrayMove(
    unpinnedMemos,
    oldIndex,
    newIndex
  ).map((memo, index) => ({
    ...memo,
    updatedAt: new Date(Date.now() - index).toISOString(),
  }));

  saveMemos([...pinnedMemos, ...reorderedUnpinnedMemos]);
};

const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          color,
          updatedAt: new Date().toISOString(),
        }
      : memo
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
    <main className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
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
    <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2">
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
    <div className="flex items-center gap-12 text-center">
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

      <div className="relative">
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
  resetPopupPosition("memo");
setMemoOpen(true);
  setMenuAddOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setEditIconOpen(false);
  setMenuManageMode("sort");
  setSettingOpen(false);
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
    hover:bg-gray-50
    transition
    cursor-default
  "
>
  메모장
</button>

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
    text-left
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
    text-left
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
    text-left
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
  menus.map((menu) => {
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
        href={menu.link}
        target={
          menu.title === "보험인사이트 폴더" || menu.isPersonal
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

          {/* 빠른 실행 */}
          {mainMenuManageMode === "normal" && (
  <div className={quickOpen ? "relative pb-28" : "relative"}>
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
  onClick={() => {
  localStorage.setItem("noticeRead", noticeVersion.toString());
  setHasUpdate(false);
  setSelectedNotice(null);
  resetPopupPosition("notice");
  setNoticeOpen(true);
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
  <Megaphone className="w-6 h-6 text-white" />

  {hasUpdate && (
    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" />
  )}

</button>
    {/* PC 메세지 버튼 */}
<button
  onClick={() => {
  resetPopupPosition("message");
  setOpen(true);
}}
  className="
    hidden
    md:block
    fixed
    right-6
    bottom-20
    lg:bottom-25
    z-40
    bg-blue-600
     
    text-white
    px-5
    py-4
    rounded-2xl
    shadow-lg
    font-bold
    
  "
>
  보험나무에게 메세지 보내기
</button>

<ExchangeIndexBar />


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
      setQuickMenuKeys(tempQuickMenuKeys);
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
  setTempQuickMenuKeys((prev) =>
    prev.filter((key) => key !== quickDeleteKey)
  );

  setQuickDeleteConfirmOpen(false);
  setQuickDeleteKey(null);
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
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[70vh] flex flex-col"
>
            <div
  onPointerDown={(e) => startPopupDrag("notice", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
              <div className="font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
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

  const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  localStorage.setItem(
    "readNoticeIds",
    JSON.stringify(nextReadIds)
  );
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
              NO. {notice.id}
            </span>

            {!readNoticeIds.includes(notice.id) && (
  <span
    className={`
      px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap
      ${
        notice.category === "업데이트"
          ? "bg-blue-100 text-blue-600"
          : notice.category === "강의안내"
          ? "bg-yellow-100 text-yellow-700"
          : notice.category === "OPEN"
          ? "bg-emerald-100 text-emerald-700 px-3"
          : "bg-orange-100 text-orange-600"
      }
    `}
  >
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

  const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  localStorage.setItem(
    "readNoticeIds",
    JSON.stringify(nextReadIds)
  );
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
                {notice.id}
              </td>

              <td className="py-4 font-medium border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span>{notice.title}</span>

                  {!readNoticeIds.includes(notice.id) && (
  <span
    className={`
      px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap
      ${
        notice.category === "업데이트"
          ? "bg-blue-100 text-blue-600"
          : notice.category === "강의안내"
          ? "bg-yellow-100 text-yellow-700"
          : notice.category === "OPEN"
          ? "bg-emerald-100 text-emerald-700 px-3"
          : "bg-orange-100 text-orange-600"
      }
    `}
  >
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

  <div className="overflow-y-auto flex-1">
    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep">
      {selectedNotice.title}
    </h2>

    <p className="text-xs md:text-sm text-gray-500 mt-2">
      작성일: {selectedNotice.date}
    </p>

    <div className="border-t border-gray-200 mt-3 pt-2 pb-6 whitespace-pre-line text-[15px] leading-6 text-gray-800 break-keep">
      {selectedNotice.content}
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
    {menuManageMode === "sort" && "메뉴 위치 변경"}
    {menuManageMode === "edit" && "메뉴 수정"}
    {menuManageMode === "delete" && "메뉴 삭제"}
  </p>

  <p className="text-sm text-gray-500 mt-0. leading-relaxed break-keep">
    {menuManageMode === "sort" &&
      "메뉴를 드래그해서 원하는 순서로 변경할 수 있습니다."}
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
      disabled={tempPersonalMenus.length === 0}
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
                    flex
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
  ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
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
  ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
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
            <div className="overflow-y-auto flex-1 p-4">
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

  const nextReadPressIds = Array.from(
    new Set([...readPressIds, item.id])
  );

  setReadPressIds(nextReadPressIds);
  localStorage.setItem(
    "readPressIds",
    JSON.stringify(nextReadPressIds)
  );
}}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="py-4 text-center text-gray-700 border-b border-gray-100">
                        {filteredPress.length -
                          ((pressPage - 1) * PRESS_PER_PAGE + index)}
                      </td>

                      <td className="py-4 font-medium text-gray-800 border-b border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
  <span className="truncate">
    {item.title}
  </span>

  {!readPressIds.includes(item.id) && (
    <span className="shrink-0 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">
      NEW
    </span>
  )}
</div>
                      </td>

                      <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
                        {item.source}
                      </td>

                      <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPressPages > 1 && (
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
            )}
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

       </main>
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
            기준일 {exchange.date}
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
}: {
  menu: any;
  onEdit: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
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
    <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

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

