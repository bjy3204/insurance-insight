"use client";

import { X, Megaphone } from "lucide-react";
import { noticeVersion } from "@/app/notice/notices";
import type { HomeController } from "../hooks/useHomeController";
export default function PopupNoticeDialog({ controller }: { controller: HomeController }) {
const { setNoticeOpen, resetPopupPosition, setSelectedNotice, popupNoticeImageIndex, setPopupNoticeImageIndex, setHasUpdate, dbNotices, dbCategories, popupNotice, popupNoticeClosed, setPopupNoticeClosed } = controller;
return (<>{popupNotice && !popupNoticeClosed && (
        <div className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-3 md:p-4">
          <div data-popup-frame="true" className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[80vh] flex flex-col">
            <div data-popup-header="true" className="bg-blue-600 text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div data-popup-title="true" className="font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                공지사항
              </div>
              <button data-popup-close="true"
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                }}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 md:px-10 pt-6 pb-6 flex-1 min-h-0 flex flex-col overflow-y-auto">
              {(() => {
                const cat = dbCategories.find((c: any) => c.id === popupNotice.category_id);
                return (
                  <>
                    {cat && (
                      <span className={`inline-block w-fit mb-3 px-3 py-1 rounded-lg text-xs font-bold ${
cat.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
cat.color === "red" ? "bg-red-100 text-red-600" :
cat.color === "green" ? "bg-emerald-100 text-emerald-700" :
cat.color === "orange" ? "bg-orange-100 text-orange-600" :
cat.color === "gray" ? "bg-gray-100 text-gray-500" :
"bg-blue-100 text-blue-600"
                      }`}>{cat.name}</span>
                    )}
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep mb-2">
                      {popupNotice.title}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 mb-4">
                      {new Date(popupNotice.created_at).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                   <div className="border-t border-gray-200 pt-4 text-[15px] leading-6 text-gray-800 break-keep flex-1 overflow-x-hidden">
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
    __html: popupNotice.content.includes("<")
      ? popupNotice.content
      : popupNotice.content.replace(/\n/g, "<br />"),
  }}
/>
{(() => {
  const images =
    popupNotice.image_urls?.length > 0
      ? popupNotice.image_urls
      : popupNotice.image_url
      ? [popupNotice.image_url]
      : [];

  if (images.length === 0) return null;

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
      <img
        src={images[popupNoticeImageIndex]}
        alt="공지 이미지"
        className="w-full max-w-full h-auto object-contain max-h-[500px]"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600/85 text-white flex items-center justify-center hover:bg-blue-700/90 transition cursor-pointer"
          >
            ‹
          </button>

          <button
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600/85 text-white flex items-center justify-center hover:bg-blue-700/90 transition cursor-pointer"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600/85 text-white text-xs font-bold">
            {popupNoticeImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
})()}
</div>

                  </>
                );
              })()}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                  localStorage.setItem("noticeRead", noticeVersion.toString());
                  const allDbIds = dbNotices.map((n: any) => n.id);
                  localStorage.setItem("seen_db_notice_ids", JSON.stringify(allDbIds));
                  setHasUpdate(false);
                  setSelectedNotice(null);
                  resetPopupPosition("notice");
                  setNoticeOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-200 transition"
              >
                공지사항 전체보기
              </button>
              <button
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                }}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold cursor-pointer hover:bg-blue-600 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}</>);
}
