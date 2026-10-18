"use client";
import {useState} from "react";
import DashboardDialog from "./dashboard/DashboardDialog";
import { ChevronLeft as TaskChevronLeft, ChevronRight as TaskChevronRight } from "lucide-react";

import { X, Megaphone } from "lucide-react";
import { noticeVersion } from "@/app/notice/notices";
import type { HomeController } from "../hooks/useHomeController";
export default function PopupNoticeDialog({ controller }: { controller: HomeController }) {
const [hideToday,setHideToday]=useState(false);
const [expandedImage,setExpandedImage]=useState<string|null>(null);
const { setNoticeOpen, resetPopupPosition, setSelectedNotice, popupNoticeImageIndex, setPopupNoticeImageIndex, setHasUpdate, dbNotices, dbCategories, popupNotice, popupNoticeClosed, setPopupNoticeClosed } = controller;
return (<>{popupNotice && !popupNoticeClosed && (
        <div data-notice-overlay="true" className="fixed inset-0 z-[9000] bg-black/40 flex items-center justify-center p-3 md:p-4">
          <div data-update-notice="true" data-popup-frame="true" data-hide-popup-scrollbar="true" className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[80vh] flex flex-col">
            <div data-popup-header="true" className="bg-blue-600 text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div data-popup-title="true" className="font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                <span>{popupNotice.title}</span>
              </div>
              <button data-icon-only="true" data-popup-close="true"
                onClick={() => {
                  const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
                  if (!seenIds.includes(popupNotice.id)) seenIds.push(popupNotice.id);
                  if(!popupNotice.popup_repeat_daily)localStorage.setItem("seen_popup_notice_ids", JSON.stringify(seenIds));
                  setPopupNoticeClosed(true);
                }}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div onClick={event=>{const image=(event.target as HTMLElement).closest("img");if(image)setExpandedImage(image.src);}} data-notice-body="true" className="px-6 md:px-10 pt-6 pb-6 flex-1 min-h-0 flex flex-col overflow-y-auto">
              {(() => {
                const cat = dbCategories.find((c: any) => c.id === popupNotice.category_id);
                return (
                  <>
                   <div data-notice-content="true" className="border-t border-gray-200 pt-4 text-[15px] leading-6 text-gray-800 break-keep flex-1 overflow-x-hidden">
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
          <button data-icon-only="true" data-prev-next="true"
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-blue-600/85 text-white flex items-center justify-center hover:bg-blue-700/90 transition cursor-pointer"
          >
            <TaskChevronLeft data-arrow-size="24" size={24} role="img" aria-label="이전" style={{display:"inline-block",verticalAlign:"middle"}} />
          </button>

          <button data-icon-only="true" data-prev-next="true"
            onClick={() =>
              setPopupNoticeImageIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-blue-600/85 text-white flex items-center justify-center hover:bg-blue-700/90 transition cursor-pointer"
          >
            <TaskChevronRight data-arrow-size="24" size={24} role="img" aria-label="다음" style={{display:"inline-block",verticalAlign:"middle"}} />
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
            <div data-notice-footer="true" className="border-t border-gray-200 px-6 py-4 flex items-center shrink-0">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600"><input type="checkbox" checked={hideToday} onChange={event=>{const checked=event.target.checked;setHideToday(checked);try{const key=`popup_notice_hidden_day:${popupNotice.id}`;if(checked)localStorage.setItem(key,new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}));else localStorage.removeItem(key);}catch{}}}/>오늘 하루 보지 않기</label>
            </div>
          </div>
        </div>
      )}{expandedImage&&<DashboardDialog title="공지 이미지 크게 보기" onClose={()=>setExpandedImage(null)}><div data-notice-image-viewer="true"><img src={expandedImage} alt="공지 안내 이미지 확대"/></div></DashboardDialog>}</>);
}
