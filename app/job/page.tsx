"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  
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
  image: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
const companiesPerPage = 12;
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [readyOpen, setReadyOpen] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);

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
    fetch("/api/company")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
      });
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
    <main className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
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

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Briefcase className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  이직컨설팅
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                검수형 보험 조직 연결 플랫폼
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

      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
        <section className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
            placeholder="지역, 회사명, 조직명을 검색하세요"
            className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
          />
        </section>

        <p className="text-[13px] text-gray-400 mb-6 px-1 break-keep">
          회사 등록 시 검토 후 승인된 조직만 등록되며 무분별한 공개 연결이 아닌
          조건 기반 조직 연결을 지향합니다.(현재 무료 운영중입니다 !)
        </p>

       <section className="-mt-4 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            등록 조직
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCompanies.length === 0 && (
              <div className="col-span-full flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[470px]">
                검색 결과가 없습니다.
              </div>
            )}

            {currentCompanies.map((item) => (
              <div
                key={item.id}
                className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-5
  min-h-[270px]
  flex
  flex-col
  hover:-translate-y-1
  hover:shadow-md
  transition
"
              >
               <div className="flex items-center justify-between gap-2 mb-2">
  <p className="text-sm text-blue-600 font-bold">
    {item.company}
  </p>

  {item.website && (
    <a
      href={item.website}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
    >
      <House className="w-4 h-4 text-gray-500" />
    </a>
  )}
</div>

<div className="flex items-center gap-2 mb-3">
  <h3 className="text-xl font-black text-gray-900 break-keep">
    {item.organization}
  </h3>

  {item.region && (
    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
      {item.region}
    </span>
  )}
</div>

{item.memo && (
  <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 mb-3">
    <div className="flex items-center gap-2 min-w-0">
      <Megaphone className="w-4 h-4 text-gray-400 shrink-0" />
      <p className="text-sm text-gray-500 truncate">
        {item.memo}
      </p>
    </div>
  </div>
)}

<p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-6">
  {item.description}
</p>

<button
  type="button"
  onClick={() => setSelectedCompany(item)}
  className="
    mt-auto
    block
    w-full
    text-center
    rounded-2xl
    bg-gray-900
    text-white
    active:scale-[0.98]
    transition
    py-3
    text-sm
    font-bold
    cursor-pointer
  "
>
  자세히 보기
</button>
              </div>
            ))}
          </div>
         
  <div className="flex items-center justify-center gap-2 flex-wrap px-4 mt-auto pt-8">
  <button
    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
  >
    다음
  </button>
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
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-4xl h-[86vh] rounded-3xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <MessageSquareText className="w-5 h-5" />
          INSURANCE TREE
        </div>

        <button
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
          className="mt-6 w-full rounded-2xl bg-gray-900 text-white py-3 text-sm font-bold hover:bg-gray-800 transition"
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}

      {selectedCompany && (
  <div
    onClick={() => setSelectedCompany(null)}
    className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-[calc(100%-24px)] sm:max-w-3xl h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          조직 상세
        </div>

        <button
          type="button"
          onClick={() => setSelectedCompany(null)}
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {selectedCompany.image && (
          <div className="mb-6 rounded-2xl overflow-hidden">
            <img
              src={selectedCompany.image}
              alt={selectedCompany.organization}
              className="w-full h-auto"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm text-blue-600 font-bold truncate">
            {selectedCompany.company}
          </p>

          {selectedCompany.website && (
            <a
              href={selectedCompany.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0"
            >
              <House className="w-4 h-4 text-gray-500" />
            </a>
          )}
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-3 break-keep">
          {selectedCompany.organization}
        </h2>

        {selectedCompany.region && (
          <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-5">
            {selectedCompany.region}
          </span>
        )}

        {selectedCompany.memo && (
          <div className="rounded-2xl border border-gray-200 p-5 mb-5">
            

            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep">
              {selectedCompany.memo}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 mb-0">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-keep">
            {selectedCompany.description}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        {selectedCompany.phone && (
          <a
            href={
              selectedCompany.phone.startsWith("http")
                ? selectedCompany.phone
                : `tel:${selectedCompany.phone.replace(/-/g, "")}`
            }
            target={
              selectedCompany.phone.startsWith("http") ? "_blank" : undefined
            }
            rel={
              selectedCompany.phone.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="w-full text-center rounded-2xl bg-gray-900 text-white py-4 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            문의하기
          </a>
        )}
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
              컨설팅 신청 서비스는 현재 준비중입니다.
            </p>

            <button
              onClick={() => setReadyOpen(false)}
              className="w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}

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
                  onChange={(e) => {
                    setMemoSearch(e.target.value);
                    setMemoPage(1);
                  }}
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
      
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
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
            </div>
      
            <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
                  disabled={memoPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
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
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
      
                <button
                  onClick={() => setMemoPage((p) => Math.min(totalMemoPages, p + 1))}
                  disabled={memoPage === totalMemoPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  다음
                </button>
              </div>
            </div>
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

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <button
            type="button"
            onClick={() => setReadyOpen(true)}
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

          <a
            href="https://open.kakao.com/me/bh_insight_"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Megaphone className="w-5 h-5" />
            <span className="text-sm">배너신청</span>
          </a>
        </div>
      </div>
    </main>
  );
}