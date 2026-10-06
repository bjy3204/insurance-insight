"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoDetailDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, memos, saveMemos, startPopupDrag, getPopupStyle, selectedMemo, setSelectedMemo, setSaveConfirmType, memoColorOptions, changeMemoColor, deleteMemo } = controller;
return (<>{selectedMemo && (
  <div
    className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
  >
         <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("memoDetail")}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6"
>
            <div
  onPointerDown={(e) => startPopupDrag("memoDetail", e)}
  className="flex items-center justify-between mb-5"
>
  <h2 className="text-xl font-black text-gray-900">
    메모 수정
  </h2>

  <div className="flex items-center gap-2">
    {memoColorOptions.map((color) => (
      <button
        key={color.value}
        type="button"
        onClick={() => {
          changeMemoColor(selectedMemo.id, color.value);

          setSelectedMemo({
            ...selectedMemo,
            color: color.value,
            updatedAt: new Date().toISOString(),
          });
        }}
        className={`
          w-7
          h-7
          rounded-full
          border
          transition
          hover:scale-105
          ${
            selectedMemo.color === color.value
              ? "ring-2 ring-gray-400 ring-offset-2"
              : ""
          }
          ${color.className}
        `}
      />
    ))}

    <button data-popup-close="true"
  onClick={() => {
  setSelectedMemo(null);
}}
      className="
        w-9
        h-9
        rounded-full
        flex
        items-center
        justify-center
        text-gray-400
        hover:bg-gray-100
        transition
        cursor-pointer
      "
    >
      <X className="w-5 h-5" />
    </button>
  </div>
</div>
              

            <input
  value={selectedMemo.title}
  onChange={(e) => {
    setSelectedMemo({
      ...selectedMemo,
      title: e.target.value,
    });
  }}
  placeholder="메모 제목"
  className="
    w-full
    h-12
    rounded-2xl
    border
    border-gray-200
    px-4
    text-sm
    outline-none
    mb-3
  "
/>

<textarea
  value={selectedMemo.content}
  onChange={(e) => {
    setSelectedMemo({
      ...selectedMemo,
      content: e.target.value,
    });
  }}
  placeholder="메모 내용을 입력하세요"
  className="
    w-full
    h-56
    rounded-2xl
    border
    border-gray-200
    p-4
    text-sm
    outline-none
    resize-none
    mb-5
  "
/>

<p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
  {authUser && authStatus === "approved"
    ? "※ 메모는 서버에 저장되어 어디서든 로그인하면 불러올 수 있습니다."
    : "※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다."}
</p>

<div className="flex gap-3">
  <button
    onClick={() => {
      deleteMemo(selectedMemo.id);
      
    }}
    className="
      flex-1
      h-12
      rounded-2xl
      bg-gray-100
      text-gray-600
      text-sm
      font-bold
      hover:bg-red-50
      hover:text-red-500
      transition
      cursor-default
    "
  >
    삭제
  </button>

 <button
 onClick={() => {
    const nextMemos = memos.map((memo) =>
      memo.id === selectedMemo.id
        ? {
            ...selectedMemo,
            color: selectedMemo.color,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : memo
    );
    saveMemos(nextMemos);
    setSelectedMemo(null);
    setSaveConfirmType("popup");
  }}

    className="
      flex-1
      h-12
      rounded-2xl
      bg-gray-800
      text-white
      text-sm
      font-bold
      hover:bg-gray-700
      transition
      cursor-default
    "
  >
    완료
  </button>
</div>
          </div>
        </div>
      )}</>);
}
