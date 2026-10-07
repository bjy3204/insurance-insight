"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Job.module.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";


import { LayoutGrid,
  ArrowLeft,
  Search,
  ChevronLeft,
ChevronRight,
  Phone,
  House,
  Megaphone,
  PlusCircle,
  Briefcase,
  MessageSquareText,
  NotebookPen,
Pin,
Eye,
EyeOff,
Plus,
Pencil,
StickyNote,
  X,
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
import { SiteFooterFrame } from '@/app/components/SiteFooter';
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';

import { loadCompanies, cachedCompanies, warmCompanyImages } from "./companyCache";

type Company = {
  id: string;
  company: string;
  organization: string;
  description: string;
  region: string;
  manager: string;
  phone: string;
  website: string;
  memo: string;
  image: string[];
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
  children: React.ReactNode;
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
        opacity: isDragging ? 0.55 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}

export default function JobPage() {
    const { authUser, authStatus, memos, saveMemos } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
const companiesPerPage = 12;

  const [readyOpen, setReadyOpen] = useState(false);
  const [readyService, setReadyService] = useState("컨설팅 신청");
  const [careerOpen, setCareerOpen] = useState(false);


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
    e: React.MouseEvent,
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
    saveMemos(
      memos.map((memo) =>
        memo.id === id
          ? { ...memo, color, updatedAt: new Date().toISOString() }
          : memo
      )
    );
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
          ? { ...memo, pinned: !memo.pinned, updatedAt: new Date().toISOString() }
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
  
    saveMemos([...pinnedMemos, ...arrayMove(normalMemos, oldIndex, newIndex)]);
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
  
  const memoColorOptions: {
    value: MemoItem["color"];
    className: string;
  }[] = [
    { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
    { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
    { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
    { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
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
  if (color === "clear") return "bg-white/40 border-gray-200";

  return "bg-white border-gray-200";
};

useEffect(() => {
    const cached = cachedCompanies();
    if (cached) setCompanies(cached);
    loadCompanies()
      .then((data) => {
        setCompanies(data);
      }).catch(() => {});
  }, []);

  const filteredCompanies = companies.filter((item) =>
    `${item.company} ${item.organization} ${item.region} ${item.description} ${item.memo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(
  1,
  Math.ceil(filteredCompanies.length / companiesPerPage)
);

const currentCompanies = filteredCompanies.slice(
  (page - 1) * companiesPerPage,
  page * companiesPerPage
);

  return (
    <main className="min-h-screen bg-gray-100 pb-20 flex flex-col">
      <header data-page-header="true" className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
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

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Briefcase className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  채용공고
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
                        text-gray-700 hover:bg-gray-50 transition cursor-default
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

      <div data-page-content="true" className="w-full px-6 py-6 max-w-7xl mx-auto flex flex-col flex-1">
        <section className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input data-ui-field="true" data-page-search-input="true"
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
            placeholder="지역, 회사명, 조직명을 검색하세요"
            className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
          />
        </section>

        <section className="min-h-[400px] flex flex-col flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {filteredCompanies.length === 0 && (
              <div className="col-span-full flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[470px]">
                검색 결과가 없습니다.
              </div>
            )}

            {currentCompanies.map((item, index) => (
              <Link href={`/job/${item.id}`} key={item.id} onPointerEnter={() => warmCompanyImages(item)} onFocus={() => warmCompanyImages(item)} className={styles.card} aria-label={`${item.organization} 채용공고 보기`}>
                <div className={styles.cover}>
                  {item.image?.[0] ? <img src={item.image[0]} alt="" loading={index < 5 ? "eager" : "lazy"} decoding="async" /> : <div className={styles.placeholder}><Briefcase size={36} strokeWidth={1.3} /></div>}
                  {item.region && <span className={styles.region}>{item.region}</span>}
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.company}>{item.company}</p>
                  <h3 title={item.organization}>{item.organization}</h3>
                  <p className={styles.description}>{item.description}</p>
                  {item.memo && <div className={styles.cardFoot}><span>{item.memo}</span><ChevronRight size={18} /></div>}
                </div>
              </Link>
            ))}
          </div>
         
  <div className="flex justify-center px-4 mt-auto pt-8">
<nav data-pagination="true" aria-label="채용공고 페이지 이동" className="inline-flex text-sm">
  <button
    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
    disabled={page === 1}
    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
  >
    이전
  </button>

  {Array.from({
    length: Math.min(
      10,
      totalPages - Math.floor((page - 1) / 10) * 10
    ),
  }).map((_, index) => {
    const startPage = Math.floor((page - 1) / 10) * 10 + 1;
    const pageNumber = startPage + index;

    return (
      <button
        key={pageNumber}
        onClick={() => setPage(pageNumber)}
        aria-current={page === pageNumber ? "page" : undefined}
        className={`w-10 h-10 rounded-xl text-sm font-semibold border cursor-pointer ${
          page === pageNumber
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
      >
        {pageNumber}
      </button>
    );
  })}

  <button
    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={page === totalPages}
    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
  >
    다음
  </button>
</nav>
</div>

        </section>

        

            </div>

      <button
  onClick={() => setCareerOpen(true)}
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
    cursor-pointer
  "
>
  <MessageSquareText className="w-6 h-6 text-white" />
</button>

{careerOpen && (
  <div
    onClick={() => setCareerOpen(false)}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5"
  >
    <div data-popup-frame="true"
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-4xl h-[86vh] rounded-3xl shadow-xl overflow-hidden flex flex-col"
    >
      <div data-popup-header="true" className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <MessageSquareText className="w-5 h-5" />
          INSURANCE TREE
        </div>

        <button data-popup-close="true"
          type="button"
          onClick={() => setCareerOpen(false)}
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="mt-0 mx-0 rounded-2xl overflow-hidden">
  <iframe
    src="https://www.youtube.com/embed/2264CwLZRb4"
    title="이직컨설팅 영상"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="w-full aspect-video"
  />
</div>
        <h2 className="text-xl pl-2 font-black text-gray-900 leading-snug break-keep mt-3 mb-0">
          지금의 조직은
          
          여러분의 가치를 제대로 알아봐주고 있나요?
        </h2>

        <p className="mt-3 pl-2 text-sm text-gray-600 leading-[1.9] whitespace-pre-line break-keep">
          {` 여러분은 나의 가치를 제대로 알아봐주는 곳에 계신가요 ?
일하는 방식이 다르고 나의 가치를 알아봐 주지 못한다면
          누군가에겐 기회인 그 곳도 누군가에겐 맞지 않는 환경일 수 있습니다.
          
          보험나무가 여러분에게 맞는 새로운 선택지를 함께 고민합니다.
보험인사이트는 무분별한 공개 연결이 아닌 조건과 방향을 고려한 조직 연결을 지향합니다.`}
        </p>

        <button
          type="button"
          onClick={() => setCareerOpen(false)}
          className="mt-6 w-full rounded-2xl bg-gray-900 text-white py-3 text-sm font-bold hover:bg-gray-800 cursor-pointer transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}

      {readyOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-black text-gray-900 mb-3">
              서비스 준비중입니다
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {readyService} 서비스는 현재 준비중입니다.
            </p>

            <button
              onClick={() => setReadyOpen(false)}
              className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold cursor-pointer active:scale-[0.98] transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      
      
      
      
      

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





      <SiteFooterFrame>
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <button
            type="button"
            onClick={() => { setReadyService("컨설팅 신청"); setReadyOpen(true); }}
            className="py-3 flex flex-col items-center gap-1"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-sm">컨설팅신청</span>
          </button>

          <a
            href="https://www.notion.so/363a0c26695980b0ab78ff4576542b59?pvs=106"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-sm">회사등록</span>
          </a>

          <button
            type="button"
            onClick={() => { setReadyService("배너 신청"); setReadyOpen(true); }}
            className="py-3 flex flex-col items-center gap-1 cursor-pointer"
          >
            <Megaphone className="w-5 h-5" />
            <span className="text-sm">배너신청</span>
          </button>
        </div>
      </SiteFooterFrame>
    </main>
  );
}
