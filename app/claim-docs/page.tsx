"use client";

import { useState, useEffect, useRef, type SVGProps, type ComponentType } from "react";
import Link from "next/link";
import styles from "./ClaimDocs.module.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";


import { LayoutGrid,
  ArrowLeft,
  FileText,
  Stethoscope, Scissors, Bandage, Brain, Baby, Accessibility, Car, Shield, PawPrint, UserRound, UsersRound, Info,
  Ribbon, BedSingle, Syringe, Bone, Flame, Ambulance, HeartCrack, Hospital as HospitalIcon, Scale, Gavel, CircleDollarSign, IdCard, Droplets, HeartPulse, ClipboardList,
  Newspaper,
  MessageCircle,
  MapPinPlus,
  X,
  Search,
  StickyNote,
  NotebookPen,
  Pin,
  Eye,
  EyeOff,
    Plus,
  Pencil,
} from "lucide-react";

import HospitalInfoPopup from "./hospital-info";
import DiseaseCodePopup from "./disease-code-popup";
import { FaInstagram } from "react-icons/fa";
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
import SiteFooter from '@/app/components/SiteFooter';
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';

const tabs = [
  "공통",
  "실손의료비",
  "수술",
  "골절/화상/응급",
  "치매/간병",
  "태아",
  "사망/장해",
  "운전자",
  "치아",
  "배상/누수",
  "펫",
  "기타",
] as const;

type Tab = (typeof tabs)[number];
const claimGroups: { title: string; items: Tab[] }[] = [
  { title: "기본 청구", items: ["공통"] },
  { title: "질병·상해", items: ["실손의료비", "수술", "골절/화상/응급", "치아"] },
  { title: "가족·돌봄", items: ["태아", "치매/간병", "사망/장해"] },
  { title: "사고·배상", items: ["운전자", "배상/누수"] },
  { title: "반려동물·기타", items: ["펫", "기타"] },
];
type ClaimIcon = ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
function ToothIcon({size=24,...props}: SVGProps<SVGSVGElement> & {size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 4.5C9 2 4 3 4 7.5c0 3 1.6 4.5 2 7 .4 2.8 1 6.5 2.8 6.5 1.4 0 1.3-6.5 3.2-6.5s1.8 6.5 3.2 6.5c1.8 0 2.4-3.7 2.8-6.5.4-2.5 2-4 2-7C20 3 15 2 12 4.5Z"/><path d="M9 4c1 .3 2.1 1 3 1.5"/></svg>;
}
const claimIcons: Record<Tab, ClaimIcon> = { "공통": ClipboardList, "실손의료비": Stethoscope, "수술": Scissors, "골절/화상/응급": Bandage, "치매/간병": Brain, "태아": Baby, "사망/장해": Ribbon, "운전자": Car, "치아": ToothIcon, "배상/누수": Shield, "펫": PawPrint, "기타": HeartPulse };
const documentIcons: Record<string, ClaimIcon> = {
  "본인 청구": UserRound, "대리인(가족) 청구": UsersRound,
  "입원": BedSingle, "통원": Stethoscope,
  "1~5종 수술비": Scissors, "N대 수술비": Syringe,
  "골절 진단비": Bone, "화상 진단비": Flame, "응급실 내원비": Ambulance,
  "치매 진단비": Brain, "간병인 (지원/사용)": Accessibility,
  "출생 / 선천이상": Baby, "유산 / 사산": HeartCrack, "응급 제왕절개": HospitalIcon,
  "사망 보험금": Ribbon, "후유장해": Accessibility,
  "자동차부상치료비": Ambulance, "교통사고처리지원금": UsersRound,
  "변호사선임비용": Scale, "벌금": Gavel, "면허정지/취소 위로금": IdCard,
  "치아": ToothIcon, "일상생활배상책임": Shield, "급배수시설 누출손해": Droplets,
  "통원 / 입원 / 수술": PawPrint, "독감 / 대상포진": Syringe, "고혈압 / 당뇨 / 통풍": HeartPulse,
};


const claimDocs = {
  공통: [
    {
      title: "본인 청구",
      items: [
        "보험금 청구서",
        "신분증 사본",
      ],
    },

    {
      title: "대리인(가족) 청구",
      items: [
        "위임장 (인감 날인)",
        "위임자 인감증명서 (또는 본인서명사실확인서)",
        "대리인 신분증",
        "가족관계증명서",
      ],
    },
  ],

  실손의료비: [
    {
      title: "입원",
      items: [
        "진단서 또는 입퇴원확인서 (질병코드 필수)",
        "진료비 영수증",
        "진료비 세부내역서",
      ],
    },

    {
      title: "통원",
      items: [
        "진단서 또는 진료확인서 (질병코드 필수)",
        "진료비 영수증",
        "진료비 세부내역서",
        "약제비 영수증",
      ],
    },
  ],

  수술: [
    {
      title: "1~5종 수술비",
      items: [
        "수술확인서",
      ],
    },

    {
      title: "N대 수술비",
      items: [
        "진단서 또는 진료확인서 (질병코드 필수)",
        "수술확인서",
      ],
    },
  ],

  "골절/화상/응급": [
    {
      title: "골절 진단비",
      items: [
        "진단서",
        "영상검사결과지 (CT, MRI, X-ray)",
      ],
    },

    {
      title: "화상 진단비",
      items: [
        "진단서 (심재성 2도 이상 여부 기재 필수)",
        "응급처치 기록지",
      ],
    },

    {
      title: "응급실 내원비",
      items: [
        "응급실 내원 확인서",
        "진료비 영수증",
      ],
    },
  ],

  "치매/간병": [
    {
      title: "치매 진단비",
      items: [
        "진단서 (CDR 척도 점수 기재 필수)",
        "CDR 검사 결과지",
        "뇌 영상 검사(MRI/CT) 판독지",
        "MMSE(간이정신상태) 검사 결과지",
      ],
    },

    {
      title: "간병인 (지원/사용)",
      items: [
        "간병인 사용 영수증",
        "간병인 자격증 사본 또는 사업자등록증",
        "간병 사실 확인서 (업체 양식)",
      ],
    },
  ],

  태아: [
    {
      title: "출생 / 선천이상",
      items: [
        "출생증명서",
        "등본",
        "진단서",
        "입퇴원확인서",
      ],
    },

    {
      title: "유산 / 사산",
      items: [
        "진단서 또는 사산증명서",
        "의무기록사본",
      ],
    },

    {
      title: "응급 제왕절개",
      items: [
        "진단서 (응급 사유 기재)",
        "수술확인서",
        "진료비 영수증 및 세부내역서",
      ],
    },
  ],

  "사망/장해": [
    {
      title: "사망 보험금",
      items: [
        "사망진단서 (시체검안서) 원본",
        "피보험자 기본증명서",
        "가족관계증명서",
        "상속인 전원 인감증명서, 위임장, 신분증",
      ],
    },

    {
      title: "후유장해",
      items: [
        "후유장해 진단서",
        "사고 입증 서류 및 초진차트",
        "영상 CD (MRI, CT 등)",
      ],
    },
  ],

  운전자: [
    {
      title: "자동차부상치료비",
      items: [
        "지급결의서",
        "진단서",
        "교통사고사실확인원 (경찰 신고 시)",
      ],
    },

    {
      title: "교통사고처리지원금",
      items: [
        "교통사고사실확인원",
        "피해자 진단서 또는 사망진단서",
        "형사합의서 원본",
      ],
    },

    {
      title: "변호사선임비용",
      items: [
        "교통사고사실확인원",
        "판결문, 공소장, 변호사가 발행한 세금계산서",
        "구속명장 또는 사건처분증명원",
        "재소 또는 출소증명원",
      ],
    },

    {
      title: "벌금",
      items: [
        "교통사고사실확인원",
        "벌금납부 영수증",
        "약식명령문 또는 법원 판결문",
      ],
    },

    {
      title: "면허정지/취소 위로금",
      items: [
        "교통사고사실확인원",
        "운전경력증명서",
        "면허정지확인원 (교육 이수 후)",
        "면허취소확인원",
      ],
    },
  ],

  치아: [
    {
      title: "치아",
      items: [
        "치과치료확인서",
        "치과진료기록부 사본",
        "치료 전/후 파노라마 X-ray 사진",
      ],
    },
  ],

  "배상/누수": [
    {
      title: "일상생활배상책임",
      items: [
        "사고경위서 (자필, 6하원칙)",
        "등본 (거주지 확인)",
        "피해 입증 사진 (파손 부위)",
        "수리비 견적서 및 영수증",
        "피해자 통장사본",
      ],
    },

    {
      title: "급배수시설 누출손해",
      items: [
        "사고경위서",
        "기술소견서 (필수: 누수 원인이 노후가 아닌 사고임을 입증)",
        "수리비 견적서 및 영수증",
        "공사 전/중/후 사진",
      ],
    },
  ],

  펫: [
    {
      title: "통원 / 입원 / 수술",
      items: [
        "진료비 영수증",
        "진료비 세부내역서",
        "초진차트 (또는 진료기록부)",
        "수술기록지 (수술시)",
      ],
    },
  ],

  기타: [
    {
      title: "독감 / 대상포진",
      items: [
        "진단명/코드 기재된 서류 (처방전, 확인서 등)",
        "진료비 계산서",
        "(독감) 독감 검사 결과지",
      ],
    },

    {
      title: "고혈압 / 당뇨 / 통풍",
      items: [
        "처방전 (질병코드 포함)",
        "진료비 계산서",
        "(통풍) 요산 수치 검사 결과지",
      ],
    },
  ],
};

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

function SortableMemoCard({
  memo,
  children,
}: {
  memo: MemoItem;
  children: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: memo.id,
    disabled: memo.pinned,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}


export default function ClaimDocsPage() {
   const { authUser, authStatus, memos, saveMemos } = useAuth();

  const [tab, setTab] = useState<Tab>("공통");

  const [hospitalOpen, setHospitalOpen] = useState(false);

  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
const [diseaseOpen, setDiseaseOpen] = useState(false);

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);

const [memoOpen, setMemoOpen] = useState(false);
const [settingOpen, setSettingOpen] = useState(false);

const [memoSearch, setMemoSearch] = useState("");
const [memoPage, setMemoPage] = useState(1);
const [memoTitle, setMemoTitle] = useState("");
const [memoContent, setMemoContent] = useState("");
const [memoColor, setMemoColor] =
  useState<MemoItem["color"]>("white");
const [memoAddOpen, setMemoAddOpen] = useState(false);
const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);



const [memoAddPopupPos, setMemoAddPopupPos] = useState({ x: 0, y: 0 });
const [memoEditPopupPos, setMemoEditPopupPos] = useState({ x: 0, y: 0 });

const memoAddDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const memoEditDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const moveMemoPopup = (
  e: any,
  type: "memoAdd" | "memoEdit"
) => {
  const drag =
    type === "memoAdd" ? memoAddDragRef.current : memoEditDragRef.current;

  if (!drag.isDragging) return;

  const nextPos = {
    x: drag.originX + e.clientX - drag.startX,
    y: drag.originY + e.clientY - drag.startY,
  };

  if (type === "memoAdd") {
    setMemoAddPopupPos(nextPos);
  } else {
    setMemoEditPopupPos(nextPos);
  }
};

const stopMemoPopupMove = () => {
  memoAddDragRef.current.isDragging = false;
  memoEditDragRef.current.isDragging = false;
};



useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;
    const targetMemo = memos.find((memo) => memo.id === memoId);
    if (!targetMemo) return;
    openMemoEdit(targetMemo);
  };

  window.addEventListener("open-memo-detail", openMemoDetail);

  return () => {
    window.removeEventListener("open-memo-detail", openMemoDetail);
  };
}, [memos]);

useEffect(() => {
  const closeContextMenu = () => setContextMenu(null);
  window.addEventListener("pointerdown", closeContextMenu);
  return () => window.removeEventListener("pointerdown", closeContextMenu);
}, []);

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


const openMemoEdit = (memo: MemoItem) => {
  setSelectedMemo(null);

  memoEditDragRef.current = {
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  };

  setMemoEditPopupPos({ x: 0, y: 0 });

  requestAnimationFrame(() => {
    setSelectedMemo(memo);
  });
};

const addMemo = () => {
  const now = new Date().toISOString();

  const newMemo: MemoItem = {
    id: crypto.randomUUID(),
    title: memoTitle.trim(),
    content: memoContent.trim(),
    pinned: false,
    visible: false,
    color: memoColor,
    createdAt: now,
    updatedAt: now,
  };

  saveMemos([newMemo, ...memos]);
  setMemoPage(1);
  setMemoTitle("");
  setMemoContent("");
  setMemoColor("white");
  setMemoAddOpen(false);
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
  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};

const toggleMemoVisible = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id ? { ...memo, visible: !memo.visible } : memo
    )
  );
};

const toggleMemoPinned = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            pinned: !memo.pinned,
            updatedAt: new Date().toISOString(),
          }
        : memo
    )
  );
};

const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);

  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;

  const pinnedMemos = memos.filter((memo) => memo.pinned);
  const normalMemos = memos.filter((memo) => !memo.pinned);

  const oldIndex = normalMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = normalMemos.findIndex((memo) => memo.id === over.id);

  const reorderedNormalMemos = arrayMove(normalMemos, oldIndex, newIndex);

  saveMemos([...pinnedMemos, ...reorderedNormalMemos]);
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

const getMemoColorClass = (color: MemoItem["color"]) => {
  if (color === "blue") return "bg-blue-50 border-blue-100";
  if (color === "yellow") return "bg-yellow-50 border-yellow-100";
  if (color === "red") return "bg-red-50 border-red-100";
  if (color === "clear") {
  return "bg-white/40 border-gray-200";
}

  return "bg-white border-gray-200";
};

const filteredMemos = memos
  .filter((memo) =>
    `${memo.title} ${memo.content}`
      .toLowerCase()
      .includes(memoSearch.toLowerCase())
  )
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    return (
      memos.findIndex((memo) => memo.id === a.id) -
      memos.findIndex((memo) => memo.id === b.id)
    );
  });

  const MEMOS_PER_PAGE = 6;

const totalMemoPages = Math.max(
  1,
  Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);

const visibleMemos = memos.filter((memo) => memo.visible);

  return (
    <main className={`${styles.page} min-h-screen bg-gray-100 pb-24`}>

      {/* 헤더 */}
      <header data-page-header="true" className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">

          <div className="relative flex items-center justify-center">

            {/* 뒤로가기 */}
            <Link data-header-control="true"
              href="/"
              className="
              absolute
left-0
                w-11
                h-11
                rounded-xl
                border
                border-gray-300
                bg-white
                flex
                items-center
                justify-center
              "
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            {/* 제목 */}
            <div className="text-center">

              <div className="flex items-center justify-center gap-2">
                <FileText className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  청구서류
                </h1>
              </div>

              

            </div>

                                    <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 ${
                settingOpen ? "z-[1000]" : "z-40"
              }`}
            >
              <div className="relative">
                <button data-header-control="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingOpen(!settingOpen);
                  }}
                                    className={`
                    w-10 h-10 rounded-full border border-gray-200 shadow-sm
                    flex items-center justify-center transition cursor-default
                    ${settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}
                  `}

                >
                  <LayoutGrid className="w-5 h-5 text-gray-400" />
                </button>

                {settingOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute right-0 top-12 z-[999] w-40 rounded-2xl
                      bg-white border border-gray-200 shadow-xl overflow-hidden
                    "
                  >
                    <button
                      onClick={() => {
                        window.dispatchEvent(new Event("open-memo-manager"));
                        setSettingOpen(false);
                      }}
                      className="
                        block w-full text-center px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer
                      "
                    >
                      메모장
                    </button>

                    <HeaderUtilityItems onClose={() => setSettingOpen(false)} />
                  </div>
                )}
              </div>
            </div>


          </div>

        </div>
      </header>


      <section data-page-content="true" className={`${styles.content} max-w-7xl mx-auto px-4 md:px-6 py-6`}>
        <div className={`${styles.layout} grid grid-cols-1 md:grid-cols-[265px_minmax(0,1fr)] gap-3 items-start`}>
          <nav aria-label="청구서류 종류" className={`${styles.menu} bg-white border border-blue-100/60 rounded-2xl p-3 md:p-4`}>
            <div className="flex gap-5 overflow-x-auto md:block">
              {claimGroups.map((group) => (
                <div key={group.title} className="shrink-0 md:mb-5 md:last:mb-0">
                  <p className="px-2 mb-2 text-xs font-bold text-slate-500">{group.title}</p>
                  <div className="flex gap-1 md:flex-col">
                    {group.items.map((item) => {
                      const Icon = claimIcons[item];
                      return <button type="button" key={item} onClick={() => setTab(item)} aria-current={tab === item ? "page" : undefined}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${tab === item ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-blue-50/50"}`}>
                        <Icon size={18} aria-hidden="true" />{item}
                      </button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
          <div className={`${styles.documents} min-w-0 bg-white border border-blue-100/60 rounded-2xl p-5 md:p-7`}>
            <div className={styles.documentHeading}><span className="inline-block rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-600 mb-3">{claimGroups.find(group => group.items.includes(tab))?.title}</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{tab === "공통" ? "공통 청구서류" : `${tab} 청구서류`}</h2></div>
            <div key={tab} className={styles.documentScroll}><div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {claimDocs[tab]?.map((doc, docIndex) => {
                const Icon = documentIcons[doc.title] ?? claimIcons[tab];
                return <div key={doc.title} className="rounded-2xl border border-blue-100/70 bg-white hover:bg-blue-50/40 transition-colors duration-200 cursor-default p-5 md:p-6">
                  <div className="flex items-center gap-4 pb-5 mb-5 border-b border-blue-100/70">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${docIndex % 2 === 0 ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-500"}`}><Icon size={28} aria-hidden="true" /></div>
                    <h3 className="text-xl font-bold text-slate-900">{doc.title}</h3>
                  </div>
                  <ol className="space-y-4 text-slate-800">
                    {doc.items.map((item,index) => <li key={item} className="flex items-start gap-3 leading-relaxed">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${docIndex % 2 === 0 ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"}`}>{index+1}</span>
                      <span className="pt-0.5 font-medium">{item}</span>
                    </li>)}
                  </ol>
                </div>;
              })}
            </div>
            </div>
            <div className={`${styles.notice} rounded-2xl bg-slate-50 p-5 mt-6 text-sm text-slate-600 leading-relaxed`}>
              <p className="flex items-center gap-2 font-bold text-slate-800 mb-2"><Info size={18} />안내사항</p>
              <p>보험사 및 상품에 따라 추가 서류가 필요할 수 있습니다</p>
              <p>원본 제출 여부와 제출 방법은 해당 보험사에 확인해 주세요</p>
            </div>
          </div>
        </div>
      </section>











{contextMenu && (
  <div
    style={{ top: contextMenu.y, left: contextMenu.x }}
    className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32"
    onPointerDown={(e) => e.stopPropagation()}
  >
    <button
      onClick={() => {
        const target = memos.find((m) => m.id === contextMenu.id);
        if (target) openMemoEdit(target);
        setContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default text-left"
    >
      수정
    </button>
    <button
      onClick={() => {
        deleteMemo(contextMenu.id);
        setContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-default text-left border-t border-gray-100"
    >
      삭제
    </button>
  </div>
)}





      
{/* 정보 메뉴 버튼 */}
<button
  data-page-floating-control="true"
  onClick={() => setInfoMenuOpen(!infoMenuOpen)}
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
  <MapPinPlus className="w-6 h-6 text-white" />
</button>

{infoMenuOpen && (
  <div
    onClick={() => setInfoMenuOpen(false)}
    className="fixed inset-0 z-40"
  >
    <div data-page-floating-menu="true"
      onClick={(e) => e.stopPropagation()}
      className="
        fixed
        left-6
        bottom-40
        z-40
        bg-white
        border
        border-gray-200
        shadow-xl
        rounded-2xl
        p-3
        flex
        flex-col
        gap-2
        w-64
      "
    >



    <button
      onClick={() => {
        setHospitalOpen(true);
        setInfoMenuOpen(false);
      }}
      className="w-full px-4 py-3 rounded-2xl bg-gray-100 text-left hover:bg-blue-50 hover:text-blue-600 transition "
    >
      <p className="text-sm font-bold text-gray-800">
        병원정보 검색
      </p>

      <p className="text-xs text-gray-400 mt-1">
        병원명 · 진료과목 · 전화번호 검색
      </p>
    </button>

    <button
      onClick={() => {
        setDiseaseOpen(true);
        setInfoMenuOpen(false);
      }}
      className="w-full px-4 py-3 rounded-2xl bg-gray-100 text-left hover:bg-blue-50 hover:text-blue-600 transition "
    >
      <p className="text-sm font-bold text-gray-800">
        상병코드 검색
      </p>

      <p className="text-xs text-gray-400 mt-1">
        질병명 · 상병코드 검색
      </p>
    </button>

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
      {/* 하단 고정 메뉴 */}
      <>
        <SiteFooter desktopOnly />
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">

        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">

          <a
            href="https://naver.me/xsZ8mk7H"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            className="py-3 flex flex-col items-center gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            className="py-3 flex flex-col items-center gap-1"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>

        </div>

      </div>
      </>

    </main>
  );
}
