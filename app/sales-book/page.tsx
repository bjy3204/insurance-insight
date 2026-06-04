"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Folder,
  Grid3X3,
  List,
  Home,
  Search,
} from "lucide-react";
import { salesData } from "./data";

export default function SalesBookPage() {
  const categories = Object.keys(salesData);

const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [search, setSearch] = useState("");
const [page, setPage] = useState(1);

const itemsPerPage = 12;

  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

const pagedCategories = filteredCategories.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  세일즈북
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                고객 상담용 프레젠테이션 자료
              </p>
            </div>
          </div>
        </div>
      </header>

     <div className="max-w-7xl mx-auto px-4 py-4">
  <div
  className="
    h-12
    rounded-2xl
    border
    border-gray-300
    bg-white
    px-5
    flex
    items-center
    gap-3
    focus-within:bg-gray-400
    focus-within:border-gray-400
    transition
  "
>
  <Search className="w-4 h-4 text-gray-400 shrink-0" />

  <input
    type="text"
    value={search}
    onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
    placeholder="파일명 또는 폴더명 검색..."
    className="
      flex-1
      min-w-0
      bg-transparent
      text-sm
      font-medium
      text-gray-700
      placeholder:text-gray-400
      outline-none
      focus:text-white
      focus:placeholder:text-white/80
    "
  />
</div>
</div>
      

      <div className="max-w-7xl mx-auto px-4 pb-6">
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex h-[82vh]">
       <aside
  style={{ flex: "0 0 190px" }}
  className="hidden md:block border-r border-gray-200 bg-gray-100 py-4 px-4 overflow-y-auto"
>
          <Link
            href="/sales-book"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-blue-600 bg-blue-100"
          >
            <Home className="w-4 h-4" />
            전체 자료
          </Link>

          <div className="mt-3 space-y-1">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/sales-book/${encodeURIComponent(category)}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-white transition"
              >
                <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="truncate">{category}</span>
              </Link>
            ))}
          </div>
        </aside>

        <section className="flex-1 px-4 md:px-6 py-5 md:py-6 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-black text-gray-700">
                전체 자료
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                총 {filteredCategories.length}개 폴더
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pr-3 pt-3 pb-5">
              {pagedCategories.map((category) => (
                <Link
                  key={category}
                  href={`/sales-book/${encodeURIComponent(category)}`}
                  className="bg-white rounded-3xl border border-gray-200 p-5 md:p-8 h-[120px] md:h-[150px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
                >
                  <Folder className="w-12 h-12 text-yellow-500 mb-4" />

                  <h2 className="text-lg font-black text-gray-900 break-keep">
                    {category}
                  </h2>

                  <p className="text-xs text-gray-400 font-bold mt-2">
                    {Object.keys(
                      salesData[category as keyof typeof salesData]
                    ).length}개 자료
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
              {pagedCategories.map((category) => (
                <Link
                  key={category}
                  href={`/sales-book/${encodeURIComponent(category)}`}
                  className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition"
                >
                  <Folder className="w-8 h-8 text-yellow-500 shrink-0" />

                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-gray-900 truncate">
                      {category}
                    </h2>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {Object.keys(
                        salesData[category as keyof typeof salesData]
                      ).length}개 자료
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
  <div className="mt-auto pt-5 flex items-center justify-center gap-2">
    <button
      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
      disabled={page === 1}
      className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40"
    >
      이전
    </button>

    {Array.from({ length: totalPages }).map((_, index) => (
      <button
        key={index}
        onClick={() => setPage(index + 1)}
        className={`w-9 h-9 rounded-xl text-sm font-black ${
          page === index + 1
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-600"
        }`}
      >
        {index + 1}
      </button>
    ))}

    <button
      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={page === totalPages}
      className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40"
    >
      다음
    </button>
  </div>
)}

          {filteredCategories.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center text-sm font-bold text-gray-400">
              검색 결과가 없습니다
            </div>
          )}
        </section>
        </div>

      </div>
    </main>
  );
}