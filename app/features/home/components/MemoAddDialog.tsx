"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoAddDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, memoTitle, setMemoTitle, memoContent, setMemoContent, memoColor, setMemoColor, memoAddOpen, setMemoAddOpen, memoColorOptions, addMemo } = controller;
return (<>{memoAddOpen && (
  <div
    onClick={() => setMemoAddOpen(false)}
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
          <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6"
>
            <div className="flex items-center justify-between mb-5">
  <h2 className="text-xl font-black text-gray-900">
    메모 추가
  </h2>

  <div className="flex items-center gap-2">
    {memoColorOptions.map((color) => (
      <button
        key={color.value}
        type="button"
        onClick={() => setMemoColor(color.value)}
        className={`
          w-7
          h-7
          rounded-full
          border
          transition
          hover:scale-105
          ${
            memoColor === color.value
              ? "ring-2 ring-gray-400 ring-offset-2"
              : ""
          }
          ${color.className}
        `}
      />
    ))}

    <button data-popup-close="true"
      onClick={() => setMemoAddOpen(false)}
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
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
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
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
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
                onClick={() => setMemoAddOpen(false)}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-100
                  text-gray-700
                  text-sm
                  font-bold
                  hover:bg-gray-200
                  transition
                  cursor-default
                "
              >
                취소
              </button>

              <button
  onClick={() => {
   addMemo();
setMemoAddOpen(false);

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
                저장
              </button>
            </div>
          </div>
        </div>
      )}</>);
}
