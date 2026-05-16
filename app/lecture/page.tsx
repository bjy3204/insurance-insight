"use client";

import { ArrowLeft, CalendarDays, Search, MapPin, Clock, User, Megaphone, PlusCircle, BadgeCheck } from "lucide-react";
import Link from "next/link";

const lectures = [
  {
    id: 1,
    area: "부산",
    category: "실비",
    title: "실손보험 청구 실무 교육",
    host: "보험나무",
    date: "2026.05.25",
    time: "14:00 ~ 17:00",
    place: "부산",
    price: "무료",
    status: "모집중",
    type: "오프라인",
    link: "https://forms.gle/example",
  },
];

export default function LecturePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 상단 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              강의일정
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              보험업계 강의 일정을 한곳에서 확인하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* 소개 박스 */}
        <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 mb-5">
          <h2 className="text-lg font-black text-gray-900 mb-2">
            보험업계 일정 공유 플랫폼
          </h2>
          <p className="text-sm leading-relaxed text-gray-600 break-keep">
            강의 등록은 보험나무 검수 후 승인된 일정만 노출됩니다.
            현재 강의 등록은 무료로 운영되고 있으며, 추후 일부 추천 노출 서비스는 유료로 전환될 수 있습니다.
          </p>
        </section>

        {/* 버튼 */}
        <section className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="#lecture-list"
            className="rounded-2xl bg-white border border-gray-200 p-4 flex flex-col gap-2 shadow-sm"
          >
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">강의 일정 보기</span>
            <span className="text-xs text-gray-500">등록된 강의 확인</span>
          </a>

          <a
            href="https://forms.gle/example"
            target="_blank"
            className="rounded-2xl bg-white border border-gray-200 p-4 flex flex-col gap-2 shadow-sm"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">강의 등록하기</span>
            <span className="text-xs text-gray-500">무료 등록 신청</span>
          </a>

          <a
            href="https://forms.gle/example"
            target="_blank"
            className="rounded-2xl bg-white border border-gray-200 p-4 flex flex-col gap-2 shadow-sm"
          >
            <User className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">강사 등록하기</span>
            <span className="text-xs text-gray-500">강사 프로필 신청</span>
          </a>

          <a
            href="https://forms.gle/example"
            target="_blank"
            className="rounded-2xl bg-white border border-gray-200 p-4 flex flex-col gap-2 shadow-sm"
          >
            <Megaphone className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">강의 배너 신청</span>
            <span className="text-xs text-gray-500">교육 광고 문의</span>
          </a>
        </section>

        {/* 검색 */}
        <section className="relative mb-5">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            placeholder="지역, 강의명, 분류를 검색하세요"
            className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none"
          />
        </section>

        {/* 강의 리스트 */}
        <section id="lecture-list">
          <h2 className="text-base font-black text-gray-900 mb-3">
            등록된 강의 일정
          </h2>

          <div className="space-y-3">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="rounded-3xl bg-white border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {lecture.area}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    {lecture.category}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {lecture.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-2">
                  {lecture.title}
                </h3>

                <div className="space-y-1.5 text-sm text-gray-600 mb-4">
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
                  <p className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    {lecture.host} · {lecture.price} · {lecture.type}
                  </p>
                </div>

                <a
                  href={lecture.link}
                  target="_blank"
                  className="block w-full text-center rounded-2xl bg-gray-900 text-white py-3 text-sm font-bold"
                >
                  신청하기
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}