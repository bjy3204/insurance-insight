"use client";

import { supabase } from "@/lib/supabase";
import { FileText, Newspaper, X, Search } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function PressDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, startPopupDrag, getPopupStyle, pressOpen, setPressOpen, selectedPress, setSelectedPress, pressSearch, setPressSearch, pressPage, setPressPage, readPressIds, setReadPressIds, filteredPress, PRESS_PER_PAGE, totalPressPages, paginatedPress } = controller;
return (<>{pressOpen && (
  <div
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
>
    <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("press")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("press", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          보도자료
        </div>

        <button data-popup-close="true"
          onClick={() => {
            setPressOpen(false);
            setSelectedPress(null);
          }}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!selectedPress ? (
        <>
          <div className="p-4 border-b border-gray-100">
  <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3">
    <Search className="w-5 h-5 text-gray-400" />

    <input
      value={pressSearch}
      onChange={(e) => {
        setPressSearch(e.target.value);
        setPressPage(1);
      }}
      placeholder="보도자료 검색"
      className="w-full outline-none text-sm bg-transparent"
    />
  </div>
</div>

                                        <div className="flex-1 min-h-0 flex flex-col">
  {/* 모바일 카드형 */}
  <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 md:hidden">
              {paginatedPress.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPress(item);
                                        const nextReadPressIds = Array.from(new Set([...readPressIds, item.id]));
                    setReadPressIds(nextReadPressIds);
                    if (authUser && authStatus === "approved") {
                      supabase.from("profiles").update({ read_press_ids: nextReadPressIds }).eq("id", authUser.id).then();
                    } else {
                      localStorage.setItem("readPressIds", JSON.stringify(nextReadPressIds));
                    }

                  }}
                  className="bg-white border border-gray-200 rounded-2xl px-4 py-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">
                          NO. {filteredPress.length - ((pressPage - 1) * PRESS_PER_PAGE + index)}
                        </span>
                        {!readPressIds.includes(item.id) && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">NEW</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm leading-snug break-keep line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {item.source} · {item.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

  {/* PC 테이블형 */}
  <div className="hidden md:block overflow-y-auto flex-1 p-4">
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
          <th className="py-3 w-20">번호</th>
          <th className="py-3 text-center">제목</th>
          <th className="py-3 w-32">출처</th>
          <th className="py-3 w-32">날짜</th>
        </tr>
      </thead>
      <tbody>
        {paginatedPress.map((item, index) => (
          <tr
            key={item.id}
            onClick={() => {
              setSelectedPress(item);
                                  const nextReadPressIds = Array.from(new Set([...readPressIds, item.id]));
                    setReadPressIds(nextReadPressIds);
                    if (authUser && authStatus === "approved") {
                      supabase.from("profiles").update({ read_press_ids: nextReadPressIds }).eq("id", authUser.id).then();
                    } else {
                      localStorage.setItem("readPressIds", JSON.stringify(nextReadPressIds));
                    }

            }}
            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
          >
            <td className="py-4 text-center text-gray-700 border-b border-gray-100">
              {filteredPress.length - ((pressPage - 1) * PRESS_PER_PAGE + index)}
            </td>
            <td className="py-4 font-medium text-gray-800 border-b border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate">{item.title}</span>
                {!readPressIds.includes(item.id) && (
                  <span className="shrink-0 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">NEW</span>
                )}
              </div>
            </td>
            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">{item.source}</td>
            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">{item.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

                                               <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setPressPage((p) => Math.max(1, p - 1))}
                  disabled={pressPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  이전
                </button>

                               {Array.from({
                  length: Math.min(totalPressPages, 10),
                }).map((_, index) => {
                  const page = index + 1;
                  const start = Math.max(1, Math.min(pressPage - 2, totalPressPages - 4));
                  const end = Math.min(totalPressPages, start + 4);
                  if (page < start || page > end) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setPressPage(page)}
                      className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                        pressPage === page
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setPressPage((p) => Math.min(totalPressPages, p + 1))
                  }
                  disabled={pressPage === totalPressPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  다음
                </button>
              </div>
            </div>

          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h2 className="text-2xl font-black text-gray-900 break-keep leading-snug">
              {selectedPress.title}
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              {selectedPress.date} · {selectedPress.source}
            </p>

            <div className="border-t border-gray-200 mt-4 pt-3 break-keep text-[15px] leading-[1.8] text-gray-700">
  {selectedPress.pdfs && (
    <div className="flex flex-wrap gap-3 mb-4">
      {selectedPress.pdfs.map((pdf: string, index: number) => (
        <a
          key={index}
          href={pdf}
          download
          className="
            inline-flex
            items-center
            gap-1.5
            text-sm
            text-gray-500
            underline
            underline-offset-2
            hover:text-gray-700
            transition
          "
        >
          <FileText className="w-4 h-4" />
          PDF 다운로드
          {selectedPress.pdfs.length > 1 && ` ${index + 1}`}
        </a>
      ))}
    </div>
  )}

  <div className="whitespace-pre-line">
    {selectedPress.body}
  </div>

  {selectedPress.pdfs?.[0] && (
    <div className="mt-6">
      <iframe
        src={selectedPress.pdfs[0]}
        className="
          w-full
          h-[900px]
          rounded-2xl
          border
          border-gray-200
        "
      />

      <p className="text-xs text-gray-400 mt-2">
        일부 모바일 환경에서는 PDF 미리보기가 지원되지 않을 수 있습니다.
      </p>
    </div>
  )}
</div>
          </div>

          <div className="border-t border-gray-200 p-4 text-center">
            <button
              onClick={() => setSelectedPress(null)}
              className="px-5 py-3 rounded-xl bg-gray-700 text-white text-sm font-bold cursor-pointer hover:bg-gray-600 transition"
            >
              목록으로
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}</>);
}
