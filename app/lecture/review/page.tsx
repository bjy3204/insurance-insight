"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { lectureFormLinks } from "../formLinks";
import {
  ArrowLeft,
  Calendar,
  MessageSquareText,
  Search,
  Star,
  X,
  PenLine,
  CalendarDays,
  UserRound,
    ChevronLeft,
ChevronDown,
} from "lucide-react";

interface Review {
  id: string;
  lectureTitle: string;
  
  writer: string;
  content: string;
  rating: string;
  date: string;
}



export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
const [instructors, setInstructors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState<"latest" | "rating">("latest");
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [reviewPage, setReviewPage] = useState(1);
const [popupMode, setPopupMode] = useState<"review" | "lecture" | "instructor">("review");
const [reviewSearch, setReviewSearch] = useState("");
const [previousPopupMode, setPreviousPopupMode] = useState<"lecture" | "instructor" | null>(null);

const reviewsPerPage = 5;

const lecturesPerPage = 12;

  useEffect(() => {
  fetch("/api/reviews")
    .then((res) => res.json())
    .then((data) => {
      setReviews(Array.isArray(data) ? data : []);
    });

  fetch("/api/lectures")
    .then((res) => res.json())
    .then((data) => {
      setLectures(Array.isArray(data) ? data : []);
    });

  fetch("/api/instructors")
    .then((res) => res.json())
    .then((data) => {
      setInstructors(Array.isArray(data) ? data : []);
    });
}, []);

  const getRatingNumber = (rating: string) =>
    rating.match(/⭐/g)?.length || 0;

  const lectureGroups = useMemo(() => {
    const map = new Map<string, Review[]>();

    reviews.forEach((review) => {
      if (!map.has(review.lectureTitle)) {
        map.set(review.lectureTitle, []);
      }
      map.get(review.lectureTitle)?.push(review);
    });

    return Array.from(map.entries())
      .map(([lectureTitle, list]) => {
        const average =
          list.reduce((sum, item) => sum + getRatingNumber(item.rating), 0) /
          list.length;

        const lectureInfo = lectures.find(
  (lecture) =>
    lecture.title?.trim() === lectureTitle?.trim()
);

const instructorName = lectureInfo?.instructorName || "강사명 미등록";
const category = lectureInfo?.category || "";
const area = lectureInfo?.area || "";
const date = lectureInfo?.date || "";

        return {
  lectureTitle,
  instructorName,
  category,
  area,
  date,
  reviews: list,
  reviewCount: list.length,
  averageRating: average,
  latestDate: list[0]?.date || "",
};
      })
      .filter((item) =>
        `${item.lectureTitle} ${item.instructorName} ${item.category} ${item.area}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortType === "rating") {
          return b.averageRating - a.averageRating;
        }

        return (
          new Date(b.latestDate).getTime() -
          new Date(a.latestDate).getTime()
        );
      });
  }, [reviews, search, sortType]);

const totalPages = Math.max(
  1,
  Math.ceil(lectureGroups.length / lecturesPerPage)
);

const startIndex =
  (currentPage - 1) * lecturesPerPage;

const currentLectures = lectureGroups.slice(
  startIndex,
  startIndex + lecturesPerPage
);

    const selectedLectureInfo = lectures.find(
    (lecture) => lecture.title === selectedLecture
  );

  const selectedInstructorInfo = instructors.find(
    (instructor) => instructor.name === selectedLectureInfo?.instructorName
  );

  const selectedReviews = reviews
    .filter((review) => review.lectureTitle === selectedLecture)
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
  return (
   <main className="min-h-screen bg-gray-100 pb-35 overflow-x-hidden">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/lecture"
              className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <MessageSquareText className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  강의후기
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                수강생들의 실제 후기를 작성해 주세요 !
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 pt-6 pb-6">
        <div className="relative mb-3">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="강의명 · 강사이름 검색"
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

        <div className="flex gap-2 mb-5">
          <button
  onClick={() => setSortType("latest")}
  className={`h-10 px-4 rounded-xl text-sm border font-medium ${
    sortType === "latest"
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-white text-gray-600 border-gray-200"
  }`}
>
  최신순
</button>

          <button
  onClick={() => setSortType("rating")}
  className={`h-10 px-4 rounded-xl text-sm border font-medium ${
    sortType === "rating"
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-white text-gray-600 border-gray-200"
  }`}
>
  평점 높은순
</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-x-4 gap-y-5 items-start">
          {lectureGroups.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 py-16 text-center">
              <p className="text-gray-400 text-sm">
                등록된 강의 후기가 없습니다.
              </p>
            </div>
          )}

          {currentLectures.map((lecture) => (
            <div
              key={lecture.lectureTitle}
              className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm flex flex-col h-[215px] transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-2">
                <h2 className="text-lg font-black text-gray-900 leading-snug">
                  {lecture.lectureTitle}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {lecture.instructorName}
                </p>

                

<div className="flex flex-wrap gap-2 mt-3 min-h-[28px]">
  {lecture.category && (
    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
      {lecture.category}
    </span>
  )}

  {lecture.area && (
    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
      {lecture.area}
    </span>
  )}

  {lecture.date && (
    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
      {lecture.date}
    </span>
  )}
</div>
              </div>

              <div className="mt-auto">
  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />

    <span className="font-bold">
      {lecture.averageRating.toFixed(1)}
    </span>

    <span className="text-gray-400">
      · 후기 {lecture.reviewCount}개
    </span>
  </div>

  <button
    onClick={() => {
  setSelectedLecture(lecture.lectureTitle);
  setReviewPage(1);
  setReviewSearch("");
  setPopupMode("review");
}}
    className="w-full py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold cursor-pointer transition hover:bg-blue-700"
  >
    후기보기
  </button>
</div>
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
          ? "bg-blue-600 text-white border-blue-600"
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


      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <Link href="/lecture/schedule"
            className="py-3 flex flex-col items-center gap-1"
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-sm">강의일정</span>
          </Link>

          <a
            href={lectureFormLinks.reviewRegister}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <PenLine className="w-5 h-5" />
            <span className="text-sm">후기적기</span>
          </a>

          <Link
            href="/lecture/instructor"
            className="py-3 flex flex-col items-center gap-1"
          >
            <UserRound className="w-5 h-5" />
            <span className="text-sm">강사찾기</span>
          </Link>
        </div>
      </div>

      {selectedLecture && (
  <div
    onClick={() => {
      setSelectedLecture(null);
      setPopupMode("review");
      setPreviousPopupMode(null);
    }}
    className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full sm:max-w-5xl h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
    >

      {/* 상단 */}
      <div className="shrink-0 bg-slate-800 text-white px-5 py-4 border-b border-slate-700">
        {popupMode === "review" && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black break-keep">
                  {selectedLecture}
                </h3>

                {selectedLectureInfo?.instructorName && (
                  <span className="text-sm text-slate-200 font-medium">
                    · {selectedLectureInfo.instructorName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {selectedLectureInfo?.category && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                    {selectedLectureInfo.category}
                  </span>
                )}

                {selectedLectureInfo?.area && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                    {selectedLectureInfo.area}
                  </span>
                )}

                {selectedLectureInfo?.date && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                    {selectedLectureInfo.date}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPopupMode("lecture")}
                className="h-9 px-4 rounded-xl bg-white text-slate-800 text-sm font-bold cursor-pointer hover:bg-slate-100 transition"
              >
                강의 정보 보기
              </button>

              <button
                onClick={() => setPopupMode("instructor")}
                className="h-9 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold cursor-pointer hover:bg-white/15 transition"
              >
                강사 정보 보기
              </button>

              <button
                onClick={() => setSelectedLecture(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {popupMode !== "review" && (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPopupMode("review")}
              className="h-9 px-3 rounded-xl bg-white/10 text-white text-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-white/15 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              뒤로가기
            </button>

            <p className="text-sm font-bold">
              {popupMode === "lecture" ? "강의정보 자세히보기" : "강사정보보기"}
            </p>

            <button
              onClick={() => setSelectedLecture(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 후기 화면 */}
      {popupMode === "review" && (
        <>
          <div className="shrink-0 bg-white px-5 py-4">
            <p className="text-sm font-bold text-gray-700 mb-4">
              {previousPopupMode && (
  <button
    onClick={() => {
      setPopupMode(previousPopupMode);
      setPreviousPopupMode(null);
    }}
    className="
      mb-4
      h-9
      px-3
      rounded-xl
      border
      border-gray-200
      bg-white
      text-sm
      font-bold
      flex
      items-center
      gap-1
      cursor-pointer
      hover:bg-gray-50
      transition
    "
  >
    <ChevronLeft className="w-4 h-4" />
    뒤로가기
  </button>
)}
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
                검색 결과가 없습니다.
              </div>
            )}

            {currentReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-gray-200 p-5 min-h-[170px] flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                      <UserRound className="w-5 h-5 text-blue-500" />
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">
                        {review.writer}
                      </p>
                      <p className="text-xs text-gray-400">
                        {review.lectureTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const filled = index < getRatingNumber(review.rating);

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

                <div className="flex flex-col gap-1">
                  <p
                    className={`text-[15px] leading-relaxed text-gray-700 whitespace-pre-line ${
                      expanded.includes(review.id) ? "" : "line-clamp-1"
                    }`}
                  >
                    {review.content}
                  </p>

                  {review.content.split("\n").length > 1 || review.content.length > 35 ? (
                   <button
  onClick={() => {
    if (expanded.includes(review.id)) {
      setExpanded(expanded.filter((id) => id !== review.id));
    } else {
      setExpanded([...expanded, review.id]);
    }
  }}
 className="
    mt-0.5
    text-xs
    text-gray-400
    font-medium
    cursor-pointer
    flex
    items-center
    gap-1
    hover:text-gray-500
    transition
  "
>
  <span>
    <ChevronDown
  className={`w-3.5 h-3.5 transition ${
    expanded.includes(review.id) ? "rotate-180" : ""
  }`}
/>
  </span>

  {expanded.includes(review.id) ? "접기" : "더보기"}
</button>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(review.date).toLocaleDateString("ko-KR")}</span>
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

              {Array.from({
                length: Math.min(
                  10,
                  totalReviewPages - Math.floor((reviewPage - 1) / 10) * 10
                ),
              }).map((_, index) => {
                const startPage = Math.floor((reviewPage - 1) / 10) * 10 + 1;
                const page = startPage + index;

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
                  setReviewPage((prev) =>
                    Math.min(
                      Math.floor((reviewPage - 1) / 10) * 10 + 11,
                      totalReviewPages
                    )
                  )
                }
                className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm cursor-pointer hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        </>
      )}

      {/* 강의 상세 화면 */}
      {popupMode === "lecture" && selectedLectureInfo && (
        <>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                {selectedLectureInfo.area}
              </span>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                {selectedLectureInfo.category}
              </span>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                {selectedLectureInfo.status}
              </span>
            </div>

            <h2 className="text-[26px] leading-tight font-black text-gray-900 mb-4 break-keep">
              {selectedLectureInfo.title}
            </h2>

            <div className="space-y-2.5 text-sm text-gray-700 mb-5">
              <p className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {selectedLectureInfo.date}
              </p>

              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {selectedLectureInfo.time}
              </p>

              <p className="flex items-center gap-2">
                <UserRound className="w-4 h-4 text-gray-400" />
                {selectedLectureInfo.instructorName} · {selectedLectureInfo.price} · {selectedLectureInfo.type}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed break-keep whitespace-pre-line">
                {selectedLectureInfo.desc}
              </p>
            </div>

            {selectedLectureInfo.images?.length > 0 && (
              <div className="space-y-3">
                {selectedLectureInfo.images.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedLectureInfo.title}-${index}`}
                    className="w-full max-h-[700px] object-contain bg-gray-50"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white p-4">
            <a
              href={selectedLectureInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center rounded-2xl bg-gray-800 text-white py-4 text-sm font-bold"
            >
              신청하기
            </a>
          </div>
        </>
      )}

      {/* 강사 정보 화면 */}
      {popupMode === "instructor" && (
        <>
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedInstructorInfo && (
              <div className="text-center text-sm text-gray-400 py-16">
                등록된 강사 정보가 없습니다.
              </div>
            )}

            {selectedInstructorInfo && (
  <div>
    <div className="flex flex-col md:flex-row gap-6">
      {/* 왼쪽 사진 */}
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

      {/* 오른쪽 강사정보 */}
      <div className="flex-1">
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
          <p className="text-sm text-gray-600 leading-relaxed break-keep whitespace-pre-line">
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
          .filter((lecture) => lecture.instructorName === selectedInstructorInfo.name)
          .map((lecture) => (
            <button
              key={lecture.id}
              onClick={() => {
  setPreviousPopupMode("instructor");
  setSelectedLecture(lecture.title);
  setPopupMode("review");
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
                후기보기
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
              sum + getRatingNumber(review.rating),
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
                    href={selectedInstructorInfo.openchat}
                    target="_blank"
                    rel="noopener noreferrer"
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
    </main>
  );
}