"use client";
import AccessRestrictedPage from "@/app/components/AccessRestrictedPage";

import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import useSalesBookPageSize from "../useSalesBookPageSize";
import styles from "../SalesBook.module.css";
import SalesBookTools from "../SalesBookTools";
import { use, useState, useEffect } from "react";
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
const itemsPerPage = useSalesBookPageSize();
useEffect(() => { setPage(1); }, [itemsPerPage]);

  if (!authUser || authStatus !== "approved") { return <AccessRestrictedPage paymentError={authStatus === "payment_error"}/>; }

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
      <header data-page-header="true" className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <SalesBookTools />
            <Link data-icon-only="true" data-header-control="true"
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

              
            </div>
          </div>
        </div>
      </header>

      <div data-page-content="true" className="max-w-7xl mx-auto px-4 py-4">
        <div data-page-search-wrapper="true" className="h-12 rounded-2xl border border-gray-300 bg-white px-5 flex items-center gap-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />

          <ClearableSearchInput onClear={() => {
  setSearch("");
  setPage(1);
}} data-ui-field="true" data-page-search-input="true"
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

      <div data-page-content="true" className="max-w-7xl mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-[265px_minmax(0,1fr)] gap-3 items-start">
          <aside
            
            className={`${styles.menu} hidden md:block bg-white rounded-2xl border border-blue-100/60 py-4 px-3 sticky top-6`}
          >
            <Link
              href="/sales-book"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              전체 자료
            </Link>

            <div className="mt-3 space-y-1">
              {categories.map((item) => (
                <Link
                  key={item}
                  aria-current={item === category ? "page" : undefined}
                  href={`/sales-book/${encodeURIComponent(item)}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                    item === category
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </Link>
              ))}
            </div>
          </aside>

          <section data-ui-card="true" className={`${styles.materials} bg-white rounded-2xl border border-blue-100/60 px-4 md:px-6 py-5 md:py-6 flex flex-col min-w-0`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-black text-gray-700">
                  {category}
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  총 {filteredSubcategories.length}개 자료
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button data-icon-only="true"
                  aria-label="그리드 보기" onClick={() => setViewMode("grid")}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>

                <button data-icon-only="true"
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
              <div data-page-card-grid="true" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1 pb-5">
                {pagedSubcategories.map((subcategory) => (
                  <Link data-ui-card="true" data-card-lift="subtle" data-card-highlight="true" data-menu-card="true"
                    key={subcategory}
                    href={`/sales-book/${encodeURIComponent(
                      category
                    )}/${encodeURIComponent(subcategory)}`}
                    className={`${styles.card} bg-white rounded-3xl border border-gray-200 min-w-0 shadow-sm`}
                  >
                    <FileText className="w-9 h-9 text-red-500 mb-3" />

                    <h2 className="text-base font-black text-gray-900 break-words">
                      {subcategory}
                    </h2>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {pagedSubcategories.map((subcategory) => (
                  <Link
                    key={subcategory}
                    href={`/sales-book/${encodeURIComponent(
                      category
                    )}/${encodeURIComponent(subcategory)}`}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    <Folder className="w-8 h-8 text-yellow-500 shrink-0" />

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
<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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