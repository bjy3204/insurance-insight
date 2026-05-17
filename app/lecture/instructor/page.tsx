"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Search,
  Star,
  BadgeCheck,
  PlusCircle,
  CalendarDays,
  MessageCircle,
   X,
} from "lucide-react";

import { lectureFormLinks } from "../formLinks";


export default function InstructorPage() {
    const [instructors, setInstructors] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchInstructors() {
    try {
      const res = await fetch("/api/instructors", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("강사 API 오류:", data);
        setInstructors([]);
        return;
      }

      setInstructors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("강사 데이터 불러오기 실패:", error);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }

  fetchInstructors();
}, []);
    const searchParams = useSearchParams();
const initialName = searchParams.get("name") || "";
const [search, setSearch] = useState(initialName);
const [currentPage, setCurrentPage] = useState(1);
const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

const instructorsPerPage = 4;

const filteredInstructors = instructors.filter((item) =>
  `${item.name} ${item.area} ${item.category} ${item.desc}`
    .toLowerCase()
    .includes(search.toLowerCase())
);
const totalPages = Math.max(
  1,
  Math.ceil(filteredInstructors.length / instructorsPerPage)
);

const startIndex =
  (currentPage - 1) * instructorsPerPage;

const currentInstructors = filteredInstructors.slice(
  startIndex,
  startIndex + instructorsPerPage
);
  return (
    <main className="min-h-screen bg-gray-100 pb-36">

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
                <User className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  강사 소개
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                등록된 강사 정보를 강사 확인하세요 !
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
<div className="relative mb-6">
  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="강사명, 지역, 분야를 검색하세요"
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
</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {loading && (
            <div className="col-span-full text-center text-sm text-gray-400 py-10">
              강사 정보를 불러오는 중입니다
            </div>
          )}

          {!loading && currentInstructors.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-400 py-10">
              등록된 강사가 없습니다
            </div>
          )}

          {!loading && currentInstructors.map((item) => (
            <div
              key={item.id}
              className="
                bg-white
                rounded-3xl
                border
                border-gray-200
                shadow-sm
                p-5
              "
            >
              {item.image ? (
  <img
    src={item.image}
    alt={item.name}
    className="
      w-full
      h-70
      rounded-2xl
      object-cover
      mb-4
      border
      border-gray-200
      bg-gray-50
    "
  />
) : (
  <div
    className="
      w-full
      h-70
      rounded-2xl
      mb-4
      border
      border-gray-200
      bg-gray-50
      flex
      items-center
      justify-center
      text-sm
      text-gray-400
      font-medium
    "
  >
    사진이 등록되지 않았습니다
  </div>
)}

              <h2 className="text-xl font-black text-gray-900 mb-2">
                {item.name}
              </h2>

              <p className="text-sm text-blue-600 font-bold mb-2">
                {item.category}
              </p>

              <p className="text-sm text-gray-500 mb-3">
                {item.area}
              </p>

              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 break-all">
  {item.desc}
</p>
              <div className="flex items-center gap-1 mt-5 mb-3">
  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />

  <span className="text-sm font-bold text-gray-900">
    평균 별점
  </span>

  <span className="text-xs text-gray-400">
    · 후기 0개
  </span>
</div>
              <button
  type="button"
  onClick={() => setSelectedInstructor(item)}
  className="
    mt-5
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
  강사정보 보기
</button>
            </div>
          ))}

        </div>
      </div>

<div className="fixed bottom-[73px] left-0 right-0 z-40 bg-gray-100 py-4 after:absolute after:left-0 after:right-0 after:top-full after:h-[73px] after:bg-gray-100 after:content-['']">
  <div className="flex items-center justify-center gap-2 flex-wrap px-4">

    <button
      onClick={() =>
        setCurrentPage((prev) => Math.max(prev - 1, 1))
      }
      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
    >
      이전
    </button>

    {Array.from({
      length: Math.min(
        10,
        totalPages - Math.floor((currentPage - 1) / 10) * 10
      ),
    }).map((_, index) => {
      const startPage =
        Math.floor((currentPage - 1) / 10) * 10 + 1;

      const page = startPage + index;

      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold border cursor-pointer ${
            currentPage === page
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
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
      }
      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
    >
      다음
    </button>

  </div>
</div>
{selectedInstructor && (
  <div
    onClick={() => setSelectedInstructor(null)}
    className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
  >
   <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-[calc(100%-24px)] sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col"
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
        <div className="flex flex-col md:flex-row gap-6 min-w-0">
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

          <div className="flex-1 min-w-0">
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
             <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-all">
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
<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
  <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
    <Link
      href="/lecture/review"
      className="py-3 flex flex-col items-center gap-1"
    >
      <BadgeCheck className="w-5 h-5" />
      <span className="text-sm">후기보기</span>
    </Link>

    <a
      href={lectureFormLinks.instructorRegister}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex flex-col items-center gap-1"
    >
      <PlusCircle className="w-5 h-5" />
      <span className="text-sm">강사등록</span>
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