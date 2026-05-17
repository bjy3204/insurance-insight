"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CalendarDays,
  Clock,
  MapPin,
  BadgeCheck,
  User,
  PlusCircle,
  X,
  Star,
} from "lucide-react";

import { lectureFormLinks } from "../formLinks";

const categories = [
  "실비",
  "자동차",
  "보장분석",
  "영업",
  "고객관리",
  "법인",
  "세무",
  "SNS",
  "신입교육",
  "기타",
];

export default function LectureCategoryPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
const [lectures, setLectures] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [selectedLecture, setSelectedLecture] = useState<any>(null);
const [instructors, setInstructors] = useState<any[]>([]);
const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

useEffect(() => {
  async function fetchLectures() {
    try {
      const res = await fetch("/api/lectures", {
        cache: "no-store",
      });

      fetch("/api/instructors")
  .then((res) => res.json())
  .then((data) => {
    setInstructors(Array.isArray(data) ? data : []);
  });

  
      const data = await res.json();

      const formattedLectures = (data || []).map((lecture: any) => ({
        ...lecture,
        dateValue: lecture.date,
        host: lecture.instructorName,
        place: lecture.area,
        price: "문의",
        type: "오프라인",
        link: lecture.applyLink,
      }));

      setLectures(formattedLectures);
    } catch (error) {
      console.error("강의 데이터 불러오기 실패:", error);
      setLectures([]);
    } finally {
      setLoading(false);
    }
  }

  fetchLectures();
}, []);

const findInstructor = (name: string) =>
  instructors.find((instructor) => instructor.name === name);

  return (
    <main className="min-h-screen bg-gray-100 pb-40">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/lecture"
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
                <Search className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  분야별 강의
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                분야별 강의를 확인하세요
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                rounded-2xl
                border
                border-gray-200
                shadow-sm
                px-5
                py-3
                flex
                items-center
                justify-center
                text-center
                transition
                cursor-pointer
                ${
                  selectedCategory === category
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-900 hover:shadow-md"
                }
              `}
            >
              <span className="text-sm font-black">
                {category}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {lectures
  .filter((lecture) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lectureDate = new Date(lecture.dateValue);
    lectureDate.setHours(0, 0, 0, 0);

    return (
      (!selectedCategory ||
        lecture.category === selectedCategory) &&
      lectureDate >= today
    );
  })
    .map((lecture) => (
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

          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
            {lecture.category}
          </span>

          <span
            className={`
              px-3 py-1 rounded-full text-xs font-bold
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
    {lecture.place}
  </p>


</div>
       <button
  type="button"
  onClick={() => setSelectedLecture(lecture)}
  className="
    block
    w-full
    text-center
    rounded-2xl
    bg-gray-900
    text-white
    py-3
    text-sm
    font-bold
    cursor-pointer
    hover:bg-gray-800
    transition
  "
>
  자세히 보기
</button>
      </div>
    ))}
</div>
            </div>

      {selectedLecture && (
        <div
  onClick={() => setSelectedLecture(null)}
  className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
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

            <div className="p-6 overflow-y-auto flex-1 lecture-popup-scroll min-w-0 overflow-x-hidden">
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
                  {selectedLecture.place}
                </p>

               

                <p className="flex items-center gap-2 flex-wrap">
  <BadgeCheck className="w-4 h-4 text-gray-400" />

  {findInstructor(selectedLecture.host) ? (
    <button
      type="button"
      onClick={() => setSelectedInstructor(findInstructor(selectedLecture.host))}
      className="font-bold text-blue-600 underline underline-offset-2 cursor-pointer"
    >
      {selectedLecture.host}
    </button>
  ) : (
    <span>{selectedLecture.host}</span>
  )}

  
</p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-6">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-all overflow-hidden">
  {selectedLecture.desc}
</p>
              </div>

              {selectedLecture.images?.length > 0 && (
                <div className="space-y-3 min-w-0 overflow-hidden">
                  {selectedLecture.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${selectedLecture.title}-${index}`}
                      className="w-full max-w-full max-h-[75vh] object-contain bg-gray-50"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-200 bg-white p-4">
              {selectedLecture.link ? (
                <a
                  href={
                    selectedLecture.link.startsWith("http")
                      ? selectedLecture.link
                      : `tel:${selectedLecture.link.replace(/-/g, "")}`
                  }
                  target={selectedLecture.link.startsWith("http") ? "_blank" : undefined}
                  rel={selectedLecture.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block w-full text-center rounded-2xl bg-gray-800 text-white py-4 text-sm font-bold"
                >
                  신청하기
                </a>
              ) : (
                <div className="block w-full text-center rounded-2xl bg-gray-300 text-white py-4 text-sm font-bold">
                  신청링크가 등록되지 않았습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}
{selectedInstructor && (
  <div
  onClick={() => setSelectedInstructor(null)}
  className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
>
    <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
>
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="font-bold flex items-center gap-2">
          <User className="w-5 h-5" />
          강사정보보기
        </div>

        <button
          type="button"
          onClick={() => setSelectedInstructor(null)}
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full lg:w-[220px] shrink-0">
            {selectedInstructor.image ? (
              <img
                src={selectedInstructor.image}
                alt={selectedInstructor.name}
                className="w-full max-h-[320px] lg:max-h-none rounded-2xl object-contain border border-gray-200 bg-gray-50 p-2"
              />
            ) : (
              <div className="w-full h-[260px] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400 font-medium">
                등록된 사진이 없습니다
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {selectedInstructor.name}
            </h2>

            <p className="text-sm text-blue-600 font-bold mb-2">
              {selectedInstructor.category}
            </p>

            <p className="text-sm text-gray-500 mb-5">
              {selectedInstructor.area}
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
              <p className="text-sm text-gray-600 leading-relaxed break-keep whitespace-pre-line">
                {selectedInstructor.desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          {selectedInstructor.openchat && (
            <a
              href={
                selectedInstructor.openchat.startsWith("http")
                  ? selectedInstructor.openchat
                  : `tel:${selectedInstructor.openchat.replace(/-/g, "")}`
              }
              target={
                selectedInstructor.openchat.startsWith("http")
                  ? "_blank"
                  : undefined
              }
              rel={
                selectedInstructor.openchat.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="flex-1 text-center rounded-2xl bg-gray-900 text-white py-4 text-sm font-bold"
            >
              문의하기
            </a>
          )}

          {selectedInstructor.instagram && (
            <a
              href={selectedInstructor.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center rounded-2xl border border-gray-200 bg-white text-gray-900 py-4 text-sm font-bold"
            >
              SNS
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
)}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <Link href="/lecture/instructor" className="py-3 flex flex-col items-center gap-1">
            <User className="w-5 h-5" />
            <span className="text-sm">강사찾기</span>
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

          <Link href="/lecture/schedule" className="py-3 flex flex-col items-center gap-1">
            <CalendarDays className="w-5 h-5" />
            <span className="text-sm">강의일정</span>
          </Link>
        </div>
      </div>
    </main>
  );
}