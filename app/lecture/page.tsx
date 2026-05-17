"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { lectureFormLinks } from "./formLinks";
import {
  ArrowLeft,
  CalendarDays,
  Search,
  MapPin,
  Clock,
  User,
  Megaphone,
  PlusCircle,
  BadgeCheck,
  MessageCircle,
  X,
} from "lucide-react";

export default function LecturePage() {
  const searchParams = useSearchParams();

  const [instructors, setInstructors] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");

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
  }, []);

    const hasInstructor = (name: string) =>
    instructors.some((item) => item.name === name);

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
          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="
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

            <div className="w-11 h-11" />
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
  강의 등록은 보험나무 검수 후 승인된 일정만 노출되며 현재 무료 운영중입니다. (추후 상단 추천 노출 서비스 유료화 예정입니다)
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
    onClick={() => setSelectedLecture(null)}
    className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-[calc(100%-24px)] sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
>

      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          강의 상세
        </div>

        <button
          type="button"
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
              <Link
                href={`/lecture/instructor?name=${encodeURIComponent(selectedLecture.instructorName)}`}
                className="font-bold text-blue-600 underline underline-offset-2"
              >
                {selectedLecture.instructorName}
              </Link>
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