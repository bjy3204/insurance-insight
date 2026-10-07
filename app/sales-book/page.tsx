"use client";

import Link from "next/link";
import useSalesBookPageSize from "./useSalesBookPageSize";
import styles from "./SalesBook.module.css";
import SalesBookTools from "./SalesBookTools";
import { useState, useEffect } from "react";
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

const itemsPerPage = useSalesBookPageSize();
useEffect(() => { setPage(1); }, [itemsPerPage]);

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
      <header data-page-header="true" className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <SalesBookTools />
            <Link data-header-control="true"
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

              
            </div>
          </div>
        </div>
      </header>

     <div data-page-content="true" className="max-w-7xl mx-auto px-3 md:px-4 py-4">
  <div data-page-search-wrapper="true"
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
    focus-within:ring-2 focus-within:ring-blue-500/20
    focus-within:border-blue-500
    transition
  "
>
  <Search className="w-4 h-4 text-gray-400 shrink-0" />

  <input data-ui-field="true" data-page-search-input="true"
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

    "
  />
</div>
</div>
      

      <div data-page-content="true" className="max-w-7xl mx-auto px-3 md:px-4 pb-6">
  <div className="grid grid-cols-1 md:grid-cols-[265px_minmax(0,1fr)] gap-3 items-start">
       <aside
  
  className={`${styles.menu} hidden md:block bg-white rounded-2xl border border-blue-100/60 py-4 px-3 sticky top-6`}
>
          <Link
            href="/sales-book"
            aria-current="page"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-blue-600 bg-blue-100 hover:bg-blue-50 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            전체 자료
          </Link>

          <div className="mt-3 space-y-1">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/sales-book/${encodeURIComponent(category)}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition  cursor-pointer"
              >
                <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="truncate">{category}</span>
              </Link>
            ))}
          </div>
        </aside>

        <section className={`${styles.materials} bg-white rounded-2xl border border-blue-100/60 px-4 md:px-6 py-5 md:py-6 flex flex-col min-w-0`}>
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
                aria-label="그리드 보기" onClick={() => setViewMode("grid")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>

              <button
                aria-label="목록 보기" onClick={() => setViewMode("list")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

{viewMode === "grid" ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1 pb-5">
              {pagedCategories.map((category) => (
                <Link data-card-lift="subtle" data-card-highlight="true" data-menu-card="true"
                  key={category}
                  href={`/sales-book/${encodeURIComponent(category)}`}
                  className={`${styles.card} bg-white rounded-3xl border border-gray-200 min-w-0 shadow-sm`}
                >
                  <Folder className="w-9 h-9 text-yellow-500 mb-3" />

                  <h2 className="text-base font-black text-gray-900 break-words break-keep">
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
            <div className="space-y-1">
              {pagedCategories.map((category) => (
                <Link
                  key={category}
                  href={`/sales-book/${encodeURIComponent(category)}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition cursor-pointer"
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
<nav data-pagination="true" aria-label="페이지 이동">
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
  </nav>
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