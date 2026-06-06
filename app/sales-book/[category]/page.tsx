"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Folder,
  Grid3X3,
  List,
  Home,
  Search,
  Lock,
} from "lucide-react";
import { salesData } from "../data";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
      const router = useRouter();
  const { authUser, authStatus } = useAuth();
  const { category: rawCategory } = use(params);
  const category = decodeURIComponent(rawCategory);

  const categories = Object.keys(salesData);
  const subcategories = salesData[category as keyof typeof salesData];

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

const [page, setPage] = useState(1);
const itemsPerPage = 12;

  if (!authUser || authStatus !== "approved") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-2">
            접근 제한
          </h2>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            세일즈북 기능은 승인된 회원만
            <br />
            이용 가능합니다.
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!subcategories) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black">카테고리를 찾을 수 없습니다</h2>

          <Link
            href="/sales-book"
            className="inline-block mt-4 text-blue-600 font-bold"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const filteredSubcategories = Object.keys(subcategories).filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);

const pagedSubcategories = filteredSubcategories.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
              href="/sales-book"
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-8 h-8 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  {category}
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                현재 자료 제작중 입니다 !
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="h-12 rounded-2xl border border-gray-300 bg-white px-5 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />

          <input
            type="text"
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setPage(1);
}}
            placeholder="자료 검색..."
            className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none"
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
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-blue-600 bg-blue-100 hover:bg-blue-50 cursor-default"
            >
              <Home className="w-4 h-4" />
              전체 자료
            </Link>

            <div className="mt-3 space-y-1">
              {categories.map((item) => (
                <Link
                  key={item}
                  href={`/sales-book/${encodeURIComponent(item)}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-default ${
                    item === category
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </Link>
              ))}
            </div>
          </aside>

          <section className="flex-1 px-4 md:px-6 py-5 md:py-6 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-black text-gray-700">
                  {category}
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  총 {filteredSubcategories.length}개 자료
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setViewMode("list")}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pr-3 pt-3 pb-5">
                {pagedSubcategories.map((subcategory) => (
                  <Link
                    key={subcategory}
                    href={`/sales-book/${encodeURIComponent(
                      category
                    )}/${encodeURIComponent(subcategory)}`}
                    className="bg-white rounded-3xl border border-gray-200 p-5 md:p-8 h-[120px] md:h-[150px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition cursor-default"
                  >
                    <FileText className="w-12 h-12 text-red-500 mb-4" />

                    <h2 className="text-lg font-black text-gray-900">
                      {subcategory}
                    </h2>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
                {pagedSubcategories.map((subcategory) => (
                  <Link
                    key={subcategory}
                    href={`/sales-book/${encodeURIComponent(
                      category
                    )}/${encodeURIComponent(subcategory)}`}
                    className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition cursor-default"
                  >
                    <FileText className="w-8 h-8 text-red-500 shrink-0" />

                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-gray-900 truncate">
                        {subcategory}
                      </h2>
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

            {filteredSubcategories.length === 0 && (
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