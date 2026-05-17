"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BadgeCheck,
  User,
  PlusCircle,
  X,
} from "lucide-react";


import { lectureFormLinks } from "../formLinks";


function LectureSchedulePageContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

 const [calendarDate, setCalendarDate] = useState(new Date());
const [selectedDate, setSelectedDate] = useState("");
const [selectedLecture, setSelectedLecture] = useState<any>(null);

const [lectures, setLectures] = useState<any[]>([]);
const [instructors, setInstructors] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayValue = formatDate(today);

  useEffect(() => {
  async function fetchData() {
    try {
      const [lectureRes, instructorRes] = await Promise.all([
        fetch("/api/lectures", {
          cache: "no-store",
        }),
        fetch("/api/instructors", {
          cache: "no-store",
        }),
      ]);

      const lectureData = await lectureRes.json();
      const instructorData = await instructorRes.json();

      const formattedLectures = (lectureData || []).map((lecture: any) => ({
        ...lecture,

        dateValue: lecture.date,

        host: lecture.instructorName,

        description: lecture.desc,

        link: lecture.applyLink,

        place: lecture.area,

        price: "문의",

        type: "오프라인",
      }));

      setLectures(formattedLectures);
      setInstructors(instructorData || []);
    } catch (error) {
      console.error("일정 데이터 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, []);

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
const nextMonthDays = 42 - (startDay + daysInMonth);

const calendarDays = [
  ...Array.from({ length: startDay }, (_, i) => ({
    day: prevMonthLastDay - startDay + i + 1,
    type: "prev",
  })),
  ...Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    type: "current",
  })),
  ...Array.from({ length: nextMonthDays }, (_, i) => ({
    day: i + 1,
    type: "next",
  })),
];

  const hasInstructor = (name: string) =>
    instructors.some((item) => item.name === name);

  const getCategoryColors = (category: string) => {
  switch (category) {
    case "실비":
      return { bg: "#eff6ff", text: "#1d4ed8", hover: "#dbeafe" };
    case "자동차":
      return { bg: "#ecfeff", text: "#0e7490", hover: "#cffafe" };
    case "보장분석":
      return { bg: "#ecfdf5", text: "#047857", hover: "#d1fae5" };
    case "영업":
      return { bg: "#fff7ed", text: "#c2410c", hover: "#ffedd5" };
    case "고객관리":
      return { bg: "#faf5ff", text: "#7e22ce", hover: "#f3e8ff" };
    case "법인":
      return { bg: "#eef2ff", text: "#4338ca", hover: "#e0e7ff" };
    case "세무":
      return { bg: "#fff1f2", text: "#be123c", hover: "#ffe4e6" };
    case "SNS":
      return { bg: "#fdf2f8", text: "#be185d", hover: "#fce7f3" };
    case "신입교육":
      return { bg: "#fffbeb", text: "#b45309", hover: "#fef3c7" };
    default:
      return { bg: "#f3f4f6", text: "#374151", hover: "#e5e7eb" };
  }
};

  const categoryLectures = lectures.filter((lecture) => {
    if (!selectedCategory) return true;
    return lecture.category === selectedCategory;
  });

  const listLectures = categoryLectures
    .filter((lecture) => {
      const lectureDate = new Date(lecture.dateValue);
      lectureDate.setHours(0, 0, 0, 0);

      if (selectedDate) {
        return lecture.dateValue === selectedDate;
      }

      return lectureDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.dateValue).getTime() -
        new Date(b.dateValue).getTime()
    );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/lecture"
              className="
                w-11 h-11 rounded-xl border border-gray-300 bg-white
                flex items-center justify-center
              "
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CalendarDays className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  강의일정 캘린더
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                {selectedCategory
                  ? `${selectedCategory} 강의 일정`
                  : "켈린더로 강의 일정을 확인하세요"}
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
            {loading && (
  <div className="text-center text-sm text-gray-400 py-10">
    강의 일정을 불러오는 중입니다
  </div>
)}
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() =>
                setCalendarDate(
                  new Date(currentYear, currentMonth - 1, 1)
                )
              }
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900">
  {currentYear}년 {currentMonth + 1}월

  <span className="ml-4 text-2xl font-black text-gray-900">
  {today.getDate()}일
</span>
</h2>

              <button
  onClick={() => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDate("");
  }}
  className="
  mt-3
  inline-flex
  items-center
  justify-center
  rounded-full
  bg-blue-50
  px-3
  py-1
  text-xs
  font-bold
  text-blue-600
  cursor-pointer
"
>
  오늘
</button>
            </div>

            <button
              onClick={() =>
                setCalendarDate(
                  new Date(currentYear, currentMonth + 1, 1)
                )
              }
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          
<div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
  {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
    <div
      key={day}
      style={{
  color:
    index === 0
      ? "#ef4444"
      : index === 6
      ? "#3b82f6"
      : "#374151",
}}
className="text-sm font-bold"
    >
      {day}
    </div>
  ))}
</div>

<div className="grid grid-cols-7 gap-1 sm:gap-2">
  {calendarDays.map((dateItem, index) => {
    const displayDay = dateItem.day;

    const dateYear =
      dateItem.type === "prev"
        ? currentMonth === 0
          ? currentYear - 1
          : currentYear
        : dateItem.type === "next"
        ? currentMonth === 11
          ? currentYear + 1
          : currentYear
        : currentYear;

    const dateMonth =
      dateItem.type === "prev"
        ? currentMonth === 0
          ? 11
          : currentMonth - 1
        : dateItem.type === "next"
        ? currentMonth === 11
          ? 0
          : currentMonth + 1
        : currentMonth;

    const fullDate = `${dateYear}-${String(dateMonth + 1).padStart(2, "0")}-${String(displayDay).padStart(2, "0")}`;

    const dayLectures = categoryLectures.filter(
      (lecture) => lecture.dateValue === fullDate
    );

    const isToday = fullDate === todayValue;
    const isOtherMonth = dateItem.type !== "current";
    const dayIndex = index % 7;
    const realDay = new Date(fullDate).getDay();

const numberColor =
  realDay === 0
    ? isOtherMonth
      ? "#fecaca"
      : "#ef4444"
    : realDay === 6
    ? isOtherMonth
      ? "#bfdbfe"
      : "#3b82f6"
    : isOtherMonth
    ? "#d1d5db"
    : "#374151";

    return (
      <div
        key={`${dateItem.type}-${displayDay}-${index}`}
        onClick={() => setSelectedDate(fullDate)}
        className={`
          aspect-square
          rounded-xl
          border
          border-gray-200
          p-3
          ${
  selectedDate === fullDate
    ? "bg-gray-100"
    : isToday
    ? "bg-blue-50"
    : "bg-white"
}
          }
          hover:-translate-y-1
          hover:shadow-md
          transition
        `}
      >
        <div
  className="text-base font-semibold mb-2"
  style={{ color: numberColor }}
>
  {displayDay}
</div>

        <div className="space-y-1">
          {dayLectures.slice(0, 2).map((lecture) => (
            <button
  key={lecture.id}
  onClick={(e) => {
    e.stopPropagation();
    setSelectedLecture(lecture);
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor =
      getCategoryColors(lecture.category).hover;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor =
      getCategoryColors(lecture.category).bg;
  }}
  style={{
    backgroundColor: getCategoryColors(lecture.category).bg,
    color: getCategoryColors(lecture.category).text,
  }}
  className="
    block
    w-full
    text-left
    text-[12px]
    leading-tight
    truncate
    whitespace-nowrap
    rounded-md
    px-2
    py-1
    cursor-pointer
    transition
  "
>
  {lecture.title}
</button>
          ))}

          {dayLectures.length > 2 && (
            <div className="text-[11px] text-gray-400">
              +{dayLectures.length - 2}
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>
        </section>

        
      </div>

    {selectedLecture && (
  <div
    onClick={() => setSelectedLecture(null)}
    className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
>

      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          강의 상세
        </div>

        <button
          onClick={() => setSelectedLecture(null)}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  active:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 lecture-popup-scroll min-w-0">

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
            {selectedLecture.area}
          </span>

          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
            {selectedLecture.category}
          </span>

          <span
            className={`
              px-3
              py-1
              rounded-full
              text-xs
              font-bold
              ${
                selectedLecture.status === "모집중"
                  ? "bg-emerald-50 text-emerald-600"
                  : selectedLecture.status === "마감임박"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-gray-100 text-gray-600"
              }
            `}
          >
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
            {selectedLecture.place}
          </p>

          <p className="flex items-center gap-2 flex-wrap">
            <BadgeCheck className="w-4 h-4 text-gray-400" />

            {hasInstructor(selectedLecture.host) ? (
              <Link
                href={`/lecture/instructor?name=${encodeURIComponent(
                  selectedLecture.host
                )}`}
                className="font-bold text-blue-600 underline underline-offset-2"
              >
                {selectedLecture.host}
              </Link>
            ) : (
              <span>{selectedLecture.host}</span>
            )}

            <span>
              · {selectedLecture.price} · {selectedLecture.type}
            </span>
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-all overflow-hidden">
  {selectedLecture.description}
</p>
        </div>

        {selectedLecture.images?.length > 0 && (
          <div className="space-y-3 min-w-0">
            {selectedLecture.images.map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`${selectedLecture.title}-${index}`}
               className="
  w-full
  max-w-full
  max-h-[800px]
  object-contain
"
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        {new Date(selectedLecture.dateValue) < today ? (
  <div
    className="
      block
      w-full
      text-center
      rounded-2xl
      bg-gray-300
      text-white
      py-4
      text-sm
      font-bold
      cursor-not-allowed
    "
  >
    신청 기간이 종료되었습니다
  </div>
) : (
  <a
    href={
  (selectedLecture.applyLink || selectedLecture.link)?.startsWith("http")
    ? (selectedLecture.applyLink || selectedLecture.link)
    : `tel:${(selectedLecture.applyLink || selectedLecture.link).replace(/-/g, "")}`
}
target={
  (selectedLecture.applyLink || selectedLecture.link)?.startsWith("http")
    ? "_blank"
    : undefined
}
rel={
  (selectedLecture.applyLink || selectedLecture.link)?.startsWith("http")
    ? "noopener noreferrer"
    : undefined
}
    className="
      block
      w-full
      text-center
      rounded-2xl
      bg-gray-800
      text-white
      py-4
      text-sm
      font-bold
      cursor-pointer
    "
  >
    신청하기
  </a>
)}
      </div>

    </div>
  </div>
)}

<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
  <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
    <Link
      href="/lecture/instructor"
      className="py-3 flex flex-col items-center gap-1"
    >
      <User className="w-5 h-5" />
      <span className="text-sm">강사보기</span>
    </Link>

    <a
      href={lectureFormLinks.lectureRegister}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex flex-col items-center gap-1"
    >
      <PlusCircle className="w-5 h-5" />
      <span className="text-sm">강의등록</span>
    </a>

    <Link
      href="/lecture/review"
      className="py-3 flex flex-col items-center gap-1"
    >
      <BadgeCheck className="w-5 h-5" />
      <span className="text-sm">후기보기</span>
    </Link>
  </div>
</div>

    </main>
  );
}
export default function LectureSchedulePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-100" />}>
      <LectureSchedulePageContent />
    </Suspense>
  );
}