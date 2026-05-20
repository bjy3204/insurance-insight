"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { lectureFormLinks } from "./formLinks";
import {
  ArrowLeft,
  CalendarDays,
  Search,
  Star,
  MapPin,
  Clock,
  User,
  Megaphone,
  PlusCircle,
  BadgeCheck,
  MessageCircle,
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

function LecturePageContent() {
  const searchParams = useSearchParams();

  const [instructors, setInstructors] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
 const [selectedLecture, setSelectedLecture] = useState<any>(null);
 const [lecturePopupMode, setLecturePopupMode] = useState<"lecture" | "instructor" | "review">("lecture");

const [selectedDate, setSelectedDate] = useState("");
const [reviewSearch, setReviewSearch] = useState("");
const [reviewPage, setReviewPage] = useState(1);
const [expanded, setExpanded] = useState<string[]>([]);
const reviewsPerPage = 5;

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

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    fetch("/api/instructors")
      .then((res) => res.json())
      .then((data) => {
        setInstructors(Array.isArray(data) ? data : []);
      });

    fetch("/api/lectures")
      .then((res) => res.json())
      .then((data) => {
        setLectures(Array.isArray(data) ? data : []);
      });
      fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      });
  }, []);

    const hasInstructor = (name: string) =>
    instructors.some((item) => item.name === name);

const selectedInstructorInfo = selectedLecture
  ? instructors.find(
      (instructor) => instructor.name === selectedLecture.instructorName
    )
  : null;

const selectedReviews = reviews
  .filter((review) => review.lectureTitle === selectedLecture?.title)
  .filter((review) =>
    `${review.writer} ${review.content} ${review.rating}`
      .toLowerCase()
      .includes(reviewSearch.toLowerCase())
  )
  .sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

const totalReviewPages = Math.max(
  1,
  Math.ceil(selectedReviews.length / reviewsPerPage)
);

const currentReviews = selectedReviews.slice(
  (reviewPage - 1) * reviewsPerPage,
  reviewPage * reviewsPerPage
);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const firstDay = new Date(currentYear, currentMonth, 1);
const lastDay = new Date(currentYear, currentMonth + 1, 0);

const startDay = firstDay.getDay();
const daysInMonth = lastDay.getDate();

const calendarDays = [
  ...Array(startDay).fill(null),
  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
];
  const activeLectures = lectures
  .filter((lecture) => {
    const isCategoryValid =
      !selectedCategory || lecture.category === selectedCategory;

    const keyword = search.toLowerCase();

    const isDateFilterValid =
      !selectedDate || lecture.date === selectedDate;

    const isSearchValid =
      !keyword ||
      `${lecture.area} ${lecture.category} ${lecture.title} ${lecture.instructorName} ${lecture.desc}`
        .toLowerCase()
        .includes(keyword);

    return (
      isCategoryValid &&
      isSearchValid &&
      isDateFilterValid
    );
  })
  .sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      
      {/* 상단 */}
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
                <CalendarDays className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  강의일정
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                보험업계 일정 공유 플랫폼
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

      {/* 본문 */}
      <div className="w-full px-6 py-6 max-w-7xl mx-auto">

       

        {/* 상단 메뉴 버튼 */}
<section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  <a
    href="/lecture/schedule"
    className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-6
  min-h-[135px]
  md:min-h-[150px]
  flex
  flex-col
  items-center
  justify-center
  text-center
  hover:shadow-md
  transition
"
  >
    <CalendarDays className="w-8 h-8 text-blue-600 mx-auto mb-4" />
   <p className="text-base font-black text-gray-900">캘린더 보기</p>
  </a>

  <a
    href="/lecture/instructor"
    className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-6
  min-h-[135px]
  md:min-h-[150px]
  flex
  flex-col
  items-center
  justify-center
  text-center
  hover:shadow-md
  transition
"
  >
    <User className="w-8 h-8 text-blue-600 mx-auto mb-4" />
   <p className="text-base font-black text-gray-900">강사소개 보기</p>
  </a>

  <a
    href="/lecture/review"
    className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-6
  min-h-[135px]
  md:min-h-[150px]
  flex
  flex-col
  items-center
  justify-center
  text-center
  hover:shadow-md
  transition
"
  >
    <BadgeCheck className="w-8 h-8 text-blue-600 mx-auto mb-4" />
    <p className="text-base font-black text-gray-900">강의후기 보기</p>
  </a>

  <a
    href="/lecture/category"
    className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-6
  min-h-[135px]
  md:min-h-[150px]
  flex
  flex-col
  items-center
  justify-center
  text-center
  hover:shadow-md
  transition
"
  >
    <Search className="w-8 h-8 text-blue-600 mx-auto mb-4" />
    <p className="text-base font-black text-gray-900">분야별 강의</p>
  </a>
</section>
<p className="text-[13px] text-gray-400 mb-3 px-1 break-keep">
  강의 등록은 검수 후 승인된 일정만 노출되며 현재 무료 운영중입니다. (추후 상단 추천 노출 서비스 유료화 예정입니다)
</p>

        {/* 검색 */}
        <section className="relative mb-6">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="지역, 강의명, 분류를 검색하세요"
            className="
              w-full
              rounded-2xl
              border
              border-gray-200
              bg-white
              pl-11
              pr-4
              py-3
              text-sm
              outline-none
              focus:border-gray-400
focus:ring-2
focus:ring-gray-100
transition
            "
          />
        </section>

        {/* 강의 리스트 */}
        <section id="lecture-list">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            등록된 강의 일정
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
{activeLectures.length === 0 && (
  <div className="col-span-full text-center py-16 text-gray-400 text-sm">
    검색 결과가 없습니다.
  </div>
)}
            {activeLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="
  bg-white
  rounded-3xl
  border
  border-gray-200
  shadow-sm
  p-5
  hover:-translate-y-1
  hover:shadow-md
  transition
"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">

  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
    {lecture.area}
  </span>

  <span
    className={`px-3 py-1 rounded-full text-xs font-bold ${
      lecture.category === "실비"
        ? "bg-blue-50 text-blue-600"
        : lecture.category === "자동차"
        ? "bg-yellow-50 text-yellow-700"
        : lecture.category === "보장분석"
        ? "bg-red-50 text-red-600"
        : lecture.category === "영업"
        ? "bg-purple-50 text-purple-600"
        : lecture.category === "고객관리"
        ? "bg-orange-50 text-orange-600"
        : lecture.category === "법인"
        ? "bg-gray-100 text-gray-700"
        : lecture.category === "세무"
        ? "bg-pink-50 text-pink-600"
        : lecture.category === "신입교육"
        ? "bg-green-50 text-green-600"
        : lecture.category === "SNS"
        ? "bg-sky-50 text-sky-600"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    {lecture.category}
  </span>

  <span
    className={`
      px-3
      py-1
      rounded-full
      text-xs
      font-bold
      ${
        lecture.status === "모집중"
          ? "bg-emerald-50 text-emerald-600"
          : lecture.status === "마감임박"
          ? "bg-orange-50 text-orange-600"
          : "bg-gray-100 text-gray-600"
      }
    `}
  >
    {lecture.status}
  </span>

</div>

                <h3 className="text-xl font-black text-gray-900 mb-4 break-keep">
                  {lecture.title}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-5">

  <p className="flex items-center gap-2">
    <CalendarDays className="w-4 h-4" />
    {lecture.date}
  </p>

  <p className="flex items-center gap-2">
    <Clock className="w-4 h-4" />
    {lecture.time}
  </p>

  <p className="flex items-center gap-2">
    <MapPin className="w-4 h-4" />
    {lecture.area}
  </p>

  <p className="flex items-center gap-2">
    <BadgeCheck className="w-4 h-4" />
    {lecture.instructorName}
  </p>
</div>
               <button
  type="button"
  onClick={() => {
  setSelectedLecture(lecture);
  setLecturePopupMode("lecture");

  setTimeout(() => {
    const popup = document.querySelector(".lecture-popup-scroll");

    if (popup) {
      popup.scrollTo({
        top: 0,
      });
    }
  }, 0);
}}
  className="
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
        </section>
      </div>
     
{/* 강의 상세 팝업 */}
{selectedLecture && (
  <div
    onClick={() => {
      setSelectedLecture(null);
      setLecturePopupMode("lecture");
    }}
    className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-[calc(100%-24px)] sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
        {lecturePopupMode === "lecture" ? (
          <div className="font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            강의 상세
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLecturePopupMode("lecture")}
            className="h-9 px-3 rounded-xl bg-white/10 text-white text-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-white/15 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setSelectedLecture(null);
            setLecturePopupMode("lecture");
          }}
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {lecturePopupMode === "lecture" && (
        <>
          <div className="p-6 overflow-y-auto flex-1 lecture-popup-scroll min-w-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                {selectedLecture.area}
              </span>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                {selectedLecture.category}
              </span>

              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                {selectedLecture.status}
              </span>
            </div>

            <h2 className="text-[26px] leading-tight font-black text-gray-900 mb-4 break-all">
              {selectedLecture.title}
            </h2>

            <div className="space-y-2.5 text-sm text-gray-700 mb-5">
              <p className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {selectedLecture.date}
              </p>

              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {selectedLecture.time}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {selectedLecture.area}
              </p>

              <p className="flex items-center gap-2 flex-wrap">
                <BadgeCheck className="w-4 h-4 text-gray-400" />

                {hasInstructor(selectedLecture.instructorName) ? (
                  <button
                    type="button"
                    onClick={() => setLecturePopupMode("instructor")}
                    className="font-bold text-blue-600 underline underline-offset-2 cursor-pointer"
                  >
                    {selectedLecture.instructorName}
                  </button>
                ) : (
                  <span>{selectedLecture.instructorName}</span>
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-all">
                {selectedLecture.desc}
              </p>
            </div>

            {selectedLecture.images?.length > 0 && (
              <div className="space-y-3 min-w-0">
                {selectedLecture.images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedLecture.title}-${index}`}
                    className="w-full max-w-full max-h-[700px] object-contain bg-gray-50"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white p-4">
            <a
              href={selectedLecture.applyLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center rounded-2xl bg-gray-800 text-white py-4 text-sm font-bold"
            >
              신청하기
            </a>
          </div>
        </>
      )}

{lecturePopupMode === "review" && (
  <>
    <div className="shrink-0 bg-white px-5 py-4">
      <p className="text-sm font-bold text-gray-700 mb-4">
        총 {selectedReviews.length}개의 후기
      </p>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={reviewSearch}
          onChange={(e) => {
            setReviewSearch(e.target.value);
            setReviewPage(1);
          }}
          placeholder="후기 내용을 검색하세요"
          className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-5 pt-0 pb-5 space-y-4">
      {currentReviews.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-16">
          등록된 후기가 없습니다.
        </div>
      )}

      {currentReviews.map((review) => (
        <div
          key={review.id}
          className="rounded-3xl border border-gray-200 p-5 min-h-[170px] flex flex-col"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-bold text-gray-900">
                {review.writer}
              </p>

              <p className="text-xs text-gray-400">
                {review.lectureTitle}
              </p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, index) => {
                const filled =
                  index < (review.rating?.match(/⭐/g)?.length || 0);

                return (
                  <span
                    key={index}
                    className={
                      filled
                        ? "text-yellow-400 text-lg"
                        : "text-gray-300 text-lg"
                    }
                  >
                    ★
                  </span>
                );
              })}
            </div>
          </div>

          <p
            className={`text-[15px] leading-relaxed text-gray-700 whitespace-pre-line ${
              expanded.includes(review.id) ? "" : "line-clamp-1"
            }`}
          >
            {review.content}
          </p>

          {review.content?.length > 35 && (
            <button
              type="button"
              onClick={() => {
                if (expanded.includes(review.id)) {
                  setExpanded(expanded.filter((id) => id !== review.id));
                } else {
                  setExpanded([...expanded, review.id]);
                }
              }}
              className="mt-2 text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-500 transition"
            >
              {expanded.includes(review.id) ? "접기" : "더보기"}
            </button>
          )}

          <div className="mt-3 text-xs text-gray-400">
            {new Date(review.date).toLocaleDateString("ko-KR")}
          </div>
        </div>
      ))}
    </div>

    <div className="shrink-0 border-t border-gray-200 bg-white px-5 pt-3 pb-4">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
        >
          이전
        </button>

        {Array.from({ length: totalReviewPages }).map((_, index) => {
          const page = index + 1;

          return (
            <button
              key={page}
              onClick={() => setReviewPage(page)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold border cursor-pointer ${
                reviewPage === page
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() =>
            setReviewPage((prev) => Math.min(prev + 1, totalReviewPages))
          }
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
        >
          다음
        </button>
      </div>
    </div>
  </>
)}

      {lecturePopupMode === "instructor" && (
  <>
    <div className="p-6 overflow-y-auto flex-1 min-w-0">
      {!selectedInstructorInfo && (
        <div className="text-center text-sm text-gray-400 py-16">
          등록된 강사 정보가 없습니다.
        </div>
      )}

      {selectedInstructorInfo && (
        <div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full lg:w-[220px] shrink-0">
              {selectedInstructorInfo.image ? (
                <img
                  src={selectedInstructorInfo.image}
                  alt={selectedInstructorInfo.name}
                  className="w-full max-h-[320px] lg:max-h-none rounded-2xl object-contain border border-gray-200 bg-gray-50 p-2"
                />
              ) : (
                <div className="w-full h-[260px] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400 font-medium">
                  등록된 사진이 없습니다
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {selectedInstructorInfo.name}
              </h2>

              <p className="text-sm text-blue-600 font-bold mb-2">
                {selectedInstructorInfo.category}
              </p>

              <p className="text-sm text-gray-500 mb-5">
                {selectedInstructorInfo.area}
              </p>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-all">
                  {selectedInstructorInfo.desc}
                </p>
              </div>
            </div>
          </div>

          {/* 진행 강의 */}
          <div className="mt-6">
            <h3 className="text-sm font-black text-gray-900 mb-3">
              진행 강의
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {lectures
                .filter(
                  (lecture) =>
                    lecture.instructorName === selectedInstructorInfo.name
                )
                .map((lecture) => (
                  <button
                    key={lecture.id}
                    type="button"
                    onClick={() => {
  setSelectedLecture(lecture);
  setLecturePopupMode("review");
  setReviewPage(1);
  setReviewSearch("");
}}
                    className="text-left rounded-2xl border border-gray-200 bg-white p-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        {lecture.category}
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {lecture.area}
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {lecture.date}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-gray-900 break-keep leading-snug mb-2">
                      {lecture.title}
                    </h4>

                    <p className="text-xs text-gray-400">
  강의후기 보기
</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {selectedInstructorInfo && (
      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="flex items-center justify-center gap-1 mb-3">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />

          <span className="text-sm font-bold text-gray-900">
            {(
              reviews
                .filter((review) =>
                  lectures.some(
                    (lecture) =>
                      lecture.title === review.lectureTitle &&
                      lecture.instructorName === selectedInstructorInfo.name
                  )
                )
                .reduce(
                  (sum, review) =>
                    sum + (review.rating?.match(/⭐/g)?.length || 0),
                  0
                ) /
              Math.max(
                1,
                reviews.filter((review) =>
                  lectures.some(
                    (lecture) =>
                      lecture.title === review.lectureTitle &&
                      lecture.instructorName === selectedInstructorInfo.name
                  )
                ).length
              )
            ).toFixed(1)}
          </span>

          <span className="text-xs text-gray-400">
            · 후기{" "}
            {
              reviews.filter((review) =>
                lectures.some(
                  (lecture) =>
                    lecture.title === review.lectureTitle &&
                    lecture.instructorName === selectedInstructorInfo.name
                )
              ).length
            }
            개
          </span>
        </div>

        <div className="flex gap-2">
          {selectedInstructorInfo.openchat && (
            <a
              href={
                selectedInstructorInfo.openchat.startsWith("http")
                  ? selectedInstructorInfo.openchat
                  : `tel:${selectedInstructorInfo.openchat.replace(/-/g, "")}`
              }
              target={
                selectedInstructorInfo.openchat.startsWith("http")
                  ? "_blank"
                  : undefined
              }
              rel={
                selectedInstructorInfo.openchat.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="flex-1 text-center rounded-2xl bg-gray-900 text-white py-4 text-sm font-bold"
            >
              문의하기
            </a>
          )}

          {selectedInstructorInfo.instagram && (
            <a
              href={selectedInstructorInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center rounded-2xl border border-gray-200 bg-white text-gray-900 py-4 text-sm font-bold"
            >
              SNS
            </a>
          )}
        </div>
      </div>
    )}
    </>
)}
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

      {/* 하단 고정 등록 메뉴 */}
<div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
  <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
    <a
      href={lectureFormLinks.instructorRegister}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex flex-col items-center gap-1"
    >
      <User className="w-5 h-5" />
      <span className="text-sm">강사등록</span>
    </a>

    <a
      href={lectureFormLinks.lectureRegister}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex flex-col items-center gap-1"
    >
      <PlusCircle className="w-5 h-5" />
      <span className="text-sm">강의등록</span>
    </a>

    <a
  href="https://open.kakao.com/me/bh_insight_"
  target="_blank"
  rel="noopener noreferrer"
  className="py-3 flex flex-col items-center gap-1"
>
  <MessageCircle className="w-5 h-5" />
  <span className="text-sm">수정요청</span>
</a>
  </div>
</div>
    </main>
  );
}
export default function LecturePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-100" />}>
      <LecturePageContent />
    </Suspense>
  );
}