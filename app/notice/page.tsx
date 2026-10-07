import Link from "next/link";
import { Megaphone, ArrowLeft } from "lucide-react";
import { notices } from "./notices";

export default function NoticePage() {
  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      {/* 헤더 */}
      <header data-page-header="true" className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            
            {/* 뒤로가기 */}
            <Link data-header-control="true"
              href="/"
              className="
                absolute
                left-0
                w-11
                h-11
                flex
                items-center
                justify-center
                rounded-xl
                border
                border-gray-300
                bg-white
              "
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* 제목 */}
            <div className="flex items-center gap-3">
              <Megaphone className="w-7 h-7 text-blue-600" />

              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  공지사항
                </h1>

                
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 목록 */}
      <div data-page-content="true" className="max-w-5xl mx-auto px-5 py-6">
        <div className="space-y-4">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notice/${notice.id}`}
              className="
                block
                bg-white
                border
                border-gray-200
                rounded-2xl
                p-5
                shadow-sm
                hover:shadow-md
                transition
              "
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span
                  className="
                    px-3
                    py-1
                    rounded-full
                    bg-blue-100
                    text-blue-600
                    text-xs
                    font-bold
                  "
                >
                  {notice.category}
                </span>

                <span className="text-xs text-gray-400">
                  {notice.date}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                {notice.title}
              </h2>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}