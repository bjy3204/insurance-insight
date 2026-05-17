"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Building2,
  Phone,
  House,
  Megaphone,
  PlusCircle,
  Briefcase,
  MessageSquareText,
  X,
} from "lucide-react";

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

export default function JobPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
const companiesPerPage = 12;
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [readyOpen, setReadyOpen] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);

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
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
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

            <div className="w-11 h-11" />
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
          조건 기반 조직 연결을 지향합니다.
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