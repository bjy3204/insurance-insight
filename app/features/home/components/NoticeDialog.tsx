"use client";

import { supabase } from "@/lib/supabase";
import { X, User } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function NoticeDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, noticeOpen, setNoticeOpen, startPopupDrag, getPopupStyle, noticePage, setNoticePage, selectedNotice, setSelectedNotice, noticeImageIndex, setNoticeImageIndex, readNoticeIds, setReadNoticeIds, allNotices, totalNoticePages, pagedNotices } = controller;
return (<>{noticeOpen && (
        <div
  onClick={() => setNoticeOpen(false)}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4"
>
         <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("notice")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[80vh] flex flex-col"
>
            <div
  onPointerDown={(e) => startPopupDrag("notice", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
              <div className="font-bold flex items-center gap-2">
                <User className="w-5 h-5" />
                공지사항
              </div>

              <button data-popup-close="true"
  onClick={() => setNoticeOpen(false)}
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

            {!selectedNotice ? (
  <div className="flex flex-col flex-1 min-h-0">

    {/* 모바일 카드형 */}
    <div className="p-4 space-y-2 md:hidden overflow-y-auto flex-1">
      {pagedNotices.map((notice) => (
        <button
          key={notice.id}
          onClick={() => {
 setSelectedNotice(notice);
setNoticeImageIndex(0);

    const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ read_notice_ids: nextReadIds }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("readNoticeIds", JSON.stringify(nextReadIds));
  }

}}
          className="
  w-full
  text-left
  bg-white
  border
  border-gray-200
  rounded-2xl
  p-3
  hover:bg-gray-50
  transition
"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            {(notice as any).is_pinned ? (
              <span className="text-xs font-bold text-orange-500">📌 고정</span>
            ) : (
              <span className="text-xs font-bold text-gray-400">
                NO. {allNotices.length - allNotices.indexOf(notice)}
              </span>
            )}

                              {!readNoticeIds.includes(notice.id) && notice.category && (
  <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
    (notice as any).categoryColor === "yellow" || notice.category === "강의안내"
      ? "bg-yellow-100 text-yellow-700"
      : (notice as any).categoryColor === "red"
      ? "bg-red-100 text-red-600"
      : (notice as any).categoryColor === "green" || notice.category === "OPEN"
      ? "bg-emerald-100 text-emerald-700"
: (notice as any).categoryColor === "orange"
? "bg-orange-100 text-orange-600"
: (notice as any).categoryColor === "gray"
? "bg-gray-100 text-gray-500"
: "bg-blue-100 text-blue-600"
  }`}>
    {notice.category}
  </span>
)}

          </div>

          <div className="font-bold text-gray-900 leading-tight break-keep">
            {notice.title}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {notice.date}
          </div>
        </button>
      ))}
    </div>

    {/* PC 테이블형 */}
    <div className="hidden md:block p-4 overflow-y-auto flex-1">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-50 rounded-xl overflow-hidden">
          <tr>
            <th className="py-3 w-20">번호</th>
            <th className="py-3">제목</th>
            <th className="py-3 w-36">날짜</th>
          </tr>
        </thead>

                 <tbody>
            {pagedNotices.map((notice) => (
              <tr
                key={notice.id}

              onClick={() => {
  setSelectedNotice(notice);
setNoticeImageIndex(0);

    const nextReadIds = Array.from(
    new Set([...readNoticeIds, notice.id])
  );

  setReadNoticeIds(nextReadIds);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ read_notice_ids: nextReadIds }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("readNoticeIds", JSON.stringify(nextReadIds));
  }

}}
              className="
                border-b
                border-gray-100
                hover:bg-gray-50
                cursor-pointer
                transition
              "
            >
              <td className="py-4 text-center text-gray-700 border-b border-gray-100">

              {(notice as any).is_pinned
  ? <span className="text-orange-500">📌</span>
  : ((notice as any).isDb ? allNotices.length - allNotices.indexOf(notice) : notice.id)
}
              </td>

              <td className="py-4 font-medium border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span>{notice.title}</span>

                                   {!readNoticeIds.includes(notice.id) && notice.category && (
  <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
    (notice as any).categoryColor === "yellow" || notice.category === "강의안내"
      ? "bg-yellow-100 text-yellow-700"
      : (notice as any).categoryColor === "red"
      ? "bg-red-100 text-red-600"
      : (notice as any).categoryColor === "green" || notice.category === "OPEN"
      ? "bg-emerald-100 text-emerald-700"
: (notice as any).categoryColor === "orange"
? "bg-orange-100 text-orange-600"
: (notice as any).categoryColor === "gray"
? "bg-gray-100 text-gray-500"
: "bg-blue-100 text-blue-600"
  }`}>
    {notice.category}
  </span>
)}

                </div>
              </td>

              <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
                {notice.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* 페이지네이션 */}
    {/* 페이지네이션 */}
<div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
  <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
    <button
      onClick={() => setNoticePage((p) => Math.max(1, p - 1))}
      disabled={noticePage === 1}
      className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
    >
      이전
    </button>

       {Array.from({
  length: Math.min(totalNoticePages, 10),
}).map((_, index) => {
      const page = index + 1;
      const start = Math.max(1, Math.min(noticePage - 2, totalNoticePages - 4));
      const end = Math.min(totalNoticePages, start + 4);
      if (page < start || page > end) return null;

      return (
        <button
          key={page}
          onClick={() => setNoticePage(page)}
          className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
            noticePage === page
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
        setNoticePage((p) => Math.min(totalNoticePages, p + 1))
      }
      disabled={noticePage === totalNoticePages}
      className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
    >
      다음
    </button>
  </div>
</div>

  </div>
) : (
              <div className="px-6 md:px-10 pt-4 pb-6 flex-1 min-h-0 flex flex-col">

  <div className="overflow-y-auto overflow-x-hidden flex-1">
    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep">
      {selectedNotice.title}
    </h2>

    <p className="text-xs md:text-sm text-gray-500 mt-2">
      작성일: {selectedNotice.date}
    </p>

   <div className="border-t border-gray-200 mt-3 pt-4 pb-6 text-[15px] leading-6 text-gray-800 break-keep">

<div
  className="
    max-w-full
    overflow-hidden
    break-words
    [&_*]:max-w-full
    [&_p]:m-0
    [&_p]:min-h-[24px]
    [&_p]:leading-6
    [&_br]:block
    [&_a]:break-all
  "
  dangerouslySetInnerHTML={{
    __html: selectedNotice.content.includes("<")
      ? selectedNotice.content
      : selectedNotice.content.replace(/\n/g, "<br />"),
  }}
/>
  {(() => {
    const images =
      selectedNotice.image_urls?.length > 0
        ? selectedNotice.image_urls
        : selectedNotice.image_url
        ? [selectedNotice.image_url]
        : [];

    if (images.length === 0) return null;

    return (
      <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
    <img
  src={images[noticeImageIndex]}
  alt="공지 이미지"
  className="w-full max-w-full h-auto object-contain max-h-[500px]"
/>

        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setNoticeImageIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
            >
              ‹
            </button>

            <button
              onClick={() =>
                setNoticeImageIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/45 text-white text-xs font-bold">
              {noticeImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    );
  })()}
</div>
  </div>

  <div className="border-t border-gray-200 pt-4 text-center shrink-0">
    <button
      onClick={() => setSelectedNotice(null)}
      className="
  px-5
  py-3
  rounded-xl
  bg-gray-700
  text-white
  text-sm
  font-bold
  cursor-pointer
  hover:bg-gray-600
  hover:shadow-md
 
  transition-all
  duration-200
"
    >
      목록으로
    </button>
  </div>

</div>
            )}
          </div>
        </div>
      )}</>);
}
