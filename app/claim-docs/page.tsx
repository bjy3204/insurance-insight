"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  FileText,
  Newspaper,
  MessageCircle,
  Hospital,
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
const [memos, setMemos] = useState<MemoItem[]>([]);
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
  const syncMemos = () => {
    const savedMemos = localStorage.getItem("personalMemos");
    setMemos(savedMemos ? JSON.parse(savedMemos) : []);
  };

  syncMemos();

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
    openMemoEdit(targetMemo);
  };

  window.addEventListener("open-memo-detail", openMemoDetail);

  return () => {
    window.removeEventListener("open-memo-detail", openMemoDetail);
  };
}, []);

const saveMemos = (nextMemos: MemoItem[]) => {
  setMemos(nextMemos);
  localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
  window.dispatchEvent(new Event("memo-storage-updated"));
};

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
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">

          <div className="relative flex items-center justify-center">

            {/* 뒤로가기 */}
            <Link
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

              <p className="text-sm text-gray-500 mt-1">
                보험금 청구서류 안내
              </p>

            </div>

                        <button
              onClick={() => setMemoOpen(true)}
              className="
              absolute
right-0
                hidden
                md:flex
                w-11
                h-11
                rounded-full
                border
                border-gray-200
                shadow-sm
                bg-white
                hover:bg-gray-50
                items-center
                justify-center
                transition
                cursor-default
              "
            >
              <StickyNote className="w-5 h-5 text-gray-400" />
            </button>

          </div>

        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">

        {/* 탭 */}
<div className="overflow-x-auto mb-7">
  <div className="grid grid-cols-12 bg-gray-200 rounded-2xl p-1 gap-1 min-w-[1180px]">
    {tabs.map((item) => (
      <button
        key={item}
        onClick={() => setTab(item)}
        className={`
          rounded-xl
          py-3
          font-bold
          text-sm
          whitespace-nowrap
          transition
          ${
            tab === item
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600"
          }
        `}
      >
        {item}
      </button>
    ))}
  </div>
</div>
        {/* 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {claimDocs[tab]?.map((doc) => (
            <div
              key={doc.title}
              className="
                bg-white
                rounded-3xl
                border
                border-gray-200
                shadow-sm
                p-6
              "
            >

              <h2 className="text-xl font-black text-blue-600 mb-5">
                {doc.title}
              </h2>

              <ol className="space-y-3 text-gray-800">

                {doc.items.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-3 font-semibold leading-relaxed"
                  >
                    <span className="text-blue-600 shrink-0">
                      {index + 1}.
                    </span>

                    <span>{item}</span>
                  </li>
                ))}

              </ol>

            </div>
          ))}

        </div>

      </section>



{memoOpen && (
  <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <NotebookPen className="w-5 h-5" />
          메모장
        </div>

        <button
          onClick={() => setMemoOpen(false)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={memoSearch}
            onChange={(e) => setMemoSearch(e.target.value)}
            placeholder="메모 검색"
            className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <button
          onClick={() => {
            setMemoAddPopupPos({ x: 0, y: 0 });
            stopMemoPopupMove();
            setMemoAddOpen(true);
          }}
          className="h-12 px-5 rounded-2xl bg-gray-800 text-white text-sm font-bold flex items-center gap-2 cursor-default"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
        {filteredMemos.length === 0 ? (
          <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400">
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
                    onDoubleClick={() => openMemoEdit(memo)}
                    className={`
                      rounded-2xl
                      border
                      p-4
                      shadow-sm
                      hover:shadow-md
                      transition
                      cursor-default
                      ${getMemoColorClass(memo.color)}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-gray-900 break-keep">
                          {memo.title || ""}
                        </h3>

                        <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">
                          {memo.content}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMemoVisible(memo.id);
                          }}
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                            ${
                              memo.visible
                                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }
                          `}
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
                            w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                            ${
                              memo.pinned
                                ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
                                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }
                          `}
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openMemoEdit(memo);
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-default"
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

      {totalMemoPages > 1 && (
  <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
    <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
      <button
        onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
        disabled={memoPage === 1}
        className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
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
            className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
              memoPage === page
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
          setMemoPage((p) => Math.min(totalMemoPages, p + 1))
        }
        disabled={memoPage === totalMemoPages}
        className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
      >
        다음
      </button>
    </div>
  </div>
)}
             
    </div>
  </div>
)}

{memoAddOpen && (
  <div
    onMouseMove={(e) => moveMemoPopup(e, "memoAdd")}
    onMouseUp={stopMemoPopupMove}
    onMouseLeave={stopMemoPopupMove}
    onClick={() => setMemoAddOpen(false)}
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
    <div
      style={{
        transform: `translate(${memoAddPopupPos.x}px, ${memoAddPopupPos.y}px)`,
      }}
      onMouseDown={(e) => {
        if (window.innerWidth < 768) return;

        const target = e.target as HTMLElement;

        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }

        memoAddDragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          originX: memoAddPopupPos.x,
          originY: memoAddPopupPos.y,
        };
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 추가</h2>

        <div className="flex items-center gap-2">
          {memoColorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setMemoColor(color.value)}
              className={`
                w-7 h-7 rounded-full border transition hover:scale-105
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
        ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setMemoAddOpen(false)}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
        >
          취소
        </button>

        <button
          onClick={() => {
            addMemo();
            setMemoAddOpen(false);
            
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}

{selectedMemo && (
  <div
    onMouseMove={(e) => moveMemoPopup(e, "memoEdit")}
    onMouseUp={stopMemoPopupMove}
    onMouseLeave={stopMemoPopupMove}
    className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
  >
    <div
      style={{
        transform: `translate(${memoEditPopupPos.x}px, ${memoEditPopupPos.y}px)`,
      }}
      onMouseDown={(e) => {
        if (window.innerWidth < 768) return;

        const target = e.target as HTMLElement;

        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }

        memoEditDragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          originX: memoEditPopupPos.x,
          originY: memoEditPopupPos.y,
        };
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 수정</h2>

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
                w-7 h-7 rounded-full border transition hover:scale-105
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
              setMemoEditPopupPos({ x: 0, y: 0 });
              memoEditDragRef.current = {
                isDragging: false,
                startX: 0,
                startY: 0,
                originX: 0,
                originY: 0,
              };
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <input
        value={selectedMemo.title}
        onChange={(e) =>
          setSelectedMemo({
            ...selectedMemo,
            title: e.target.value,
          })
        }
        placeholder="메모 제목"
        className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3"
      />

      <textarea
        value={selectedMemo.content}
        onChange={(e) =>
          setSelectedMemo({
            ...selectedMemo,
            content: e.target.value,
          })
        }
        placeholder="메모 내용을 입력하세요"
        className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
      />

      <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
        ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => deleteMemo(selectedMemo.id)}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default"
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
            
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          완료
        </button>
      </div>
    </div>
  </div>
)}

{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">메모 삭제</h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        선택한 메모를 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setDeleteMemoId(null);
            setDeleteMemoConfirmOpen(false);
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
        >
          취소
        </button>

        <button
          onClick={confirmDeleteMemo}
          className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

      
{/* 정보 메뉴 버튼 */}
<button
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
  <Hospital className="w-6 h-6 text-white" />
</button>

{infoMenuOpen && (
  <div
    onClick={() => setInfoMenuOpen(false)}
    className="fixed inset-0 z-40"
  >
    <div
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">

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

    </main>
  );
}