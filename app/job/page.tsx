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
import CompanyRegistration from "./CompanyRegistration";
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';

import { loadCompanies, cachedCompanies, warmCompanyImages } from "./companyCache";
import { availableRegions, regionsFor } from "./regions";

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
  const [selectedRegion, setSelectedRegion] = useState("");
  const [page, setPage] = useState(1);
const companiesPerPage = 12;

  const [readyOpen, setReadyOpen] = useState(false);
  const [readyService, setReadyService] = useState("컨설팅 신청");


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

  const regionOptions = availableRegions(companies.map(item => item.region || ""));
  const filteredCompanies = companies.filter((item) =>
    (!selectedRegion || regionsFor(item.region || "").includes(selectedRegion)) &&
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
    <main className={`${styles.listPage} min-h-screen pb-20 flex flex-col`}>
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

      <section className={styles.recruitHero} aria-label="채용공고 검색">
        <div className={styles.recruitHeroInner}>
          <div className={styles.recruitIntro}>
            <p className={styles.recruitEyebrow}>RECRUIT</p>
            <h2><span>새로운 시작</span>을 찾고 있다면</h2>
            <p>보험업계의 다양한 채용 기회를 확인해보세요.</p>
          </div>
          <div className={styles.recruitSearch}>
            <div data-page-search-wrapper="true" className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input data-ui-field="true" data-page-search-input="true" aria-label="채용공고 검색" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="지역, 회사명, 조직명을 검색하세요" className="w-full bg-transparent text-sm outline-none" />
              {search && <button type="button" aria-label="검색어 지우기" onClick={() => { setSearch(""); setPage(1); }} className="cursor-pointer text-gray-400"><X className="h-4 w-4" /></button>}
            </div>
            <div className={styles.regionFilters} aria-label="채용 지역">
              {["", ...regionOptions].map(region => <button key={region} type="button" aria-pressed={selectedRegion === region} onClick={() => { setSelectedRegion(region); setPage(1); }} className={selectedRegion === region ? styles.regionSelected : ""}>{region || "전체"}</button>)}
            </div>
          </div>
        </div>
      </section>
      <div data-page-content="true" className="w-full px-6 py-6 max-w-7xl mx-auto flex flex-col flex-1">

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
                  {item.image?.[0] ? <img src={`${item.image[0]}&w=384`} alt="" loading={index < 5 ? "eager" : "lazy"} fetchPriority={index < 5 ? "high" : "auto"} decoding="async" /> : <div className={styles.placeholder}><Briefcase size={36} strokeWidth={1.3} /></div>}
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
    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm cursor-pointer hover:bg-gray-100 disabled:text-gray-300"
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
            ? "bg-blue-50 text-blue-600 border-blue-100"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
        }`}
      >
        {pageNumber}
      </button>
    );
  })}

  <button
    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={page === totalPages}
    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm cursor-pointer hover:bg-gray-100 disabled:text-gray-300"
  >
    다음
  </button>
</nav>
</div>

        </section>

        

            </div>

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
              className="w-full h-[46px] px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer active:scale-[0.98] transition"
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





      <CompanyRegistration />
      <SiteFooterFrame>
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <button
            type="button"
            onClick={() => { setReadyService("컨설팅 신청"); setReadyOpen(true); }}
            className="py-3 flex flex-col items-center gap-1 cursor-pointer"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-sm">컨설팅신청</span>
          </button>

          <button type="button" onClick={() => window.dispatchEvent(new Event("open-company-registration"))} className="py-3 flex flex-col items-center gap-1 cursor-pointer"><PlusCircle className="w-5 h-5" /><span className="text-sm">회사등록</span></button>

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
