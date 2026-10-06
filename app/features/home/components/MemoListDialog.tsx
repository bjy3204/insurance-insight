"use client";

import { X, NotebookPen, Pin, Eye, EyeOff, Plus, Search, Pencil } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableMemoCard from "../components/SortableMemoCard";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoListDialog({ controller }: { controller: HomeController }) {
const { sensors, memoOpen, setMemoOpen, startPopupDrag, getPopupStyle, memoSearch, setMemoSearch, memoPage, setMemoPage, setMemoAddOpen, setSelectedMemo, setContextMenu, totalMemoPages, pagedMemos, getMemoColorClass, toggleMemoVisible, toggleMemoPinned, handleMemoDragEnd } = controller;
return (<>{memoOpen && (
  <div
  onClick={() => setContextMenu(null)}
  className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4"
>
          <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("memo")}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col"
>
            <div
  onPointerDown={(e) => startPopupDrag("memo", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
              <div className="font-bold flex items-center gap-2">
                <NotebookPen className="w-5 h-5" />
                메모장
              </div>

              <button data-popup-close="true"
                onClick={() => setMemoOpen(false)}
                className="
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  hover:bg-white/10
                  transition
                  cursor-pointer
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
  <div className="grid grid-cols-[1fr_auto] gap-3">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

      <input
        value={memoSearch}
        onChange={(e) => {
          setMemoSearch(e.target.value);
          setMemoPage(1);
        }}
        placeholder="메모 검색"
       className="
  w-full
  h-12
  rounded-2xl
  border
  border-gray-200
  bg-white
  pl-11
  pr-4
  text-sm
  outline-none
  focus:border-gray-400
  focus:ring-2
  focus:ring-gray-100
  transition
"
      />
    </div>

    <button
      onClick={() => setMemoAddOpen(true)}
      className="
  h-12
  rounded-2xl
  bg-gray-800
  text-white
  px-5
  text-sm
  font-bold
  flex
  items-center
  justify-center
  gap-1.5
  hover:bg-gray-700
  transition
  cursor-default
"
    >
      <Plus className="w-4 h-4" />
      추가
    </button>
  </div>
</div>

              

            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              {pagedMemos.length === 0 ? (
  <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400 min-h-[450px]">
    저장된 메모가 없습니다.
  </div>
) : (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleMemoDragEnd}
  >
    <SortableContext
      items={pagedMemos
        .filter((memo) => !memo.pinned)
        .map((memo) => memo.id)}
      strategy={rectSortingStrategy}
    >
      {pagedMemos.map((memo) => (
        <SortableMemoCard key={memo.id} memo={memo}>
          <div
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "memo",
      id: memo.id,
    });
  }}
  onDoubleClick={() => setSelectedMemo(memo)}
            className={`
              rounded-2xl
              border
              shadow-sm
              ${getMemoColorClass(memo.color)}
              hover:shadow-md
              hover:-translate-y-0.5
              transition-all
              duration-200
              cursor-default
              p-4
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 flex flex-col min-h-[130px]">
                <h3 className="text-sm font-black text-gray-900 mb-2 break-keep">
                  {memo.title}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-keep">
                  {memo.content}
                </p>

                <p className="text-[11px] text-gray-400 mt-auto pt-3">
                  수정일{" "}
                  {new Date(memo.updatedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMemoVisible(memo.id);
                  }}
                  className={`
  w-10
  h-10
  rounded-full
  hidden
  sm:flex
  items-center
  justify-center
  border
  transition
  cursor-default
  ${
    memo.visible
      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
  }
`}
title="메인 노출"
                >
                  {memo.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMemoPinned(memo.id);
                  }}
                                    className={`
  w-10
  h-10
  rounded-full
  flex
  items-center
  justify-center
  border
  transition
  cursor-default
  ${
    memo.pinned
      ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
  }
`}
title="상단 고정"

                >
                  <Pin className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMemo(memo);
                  }}
                  className="
                    w-10
                    h-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    border
                    border-gray-200
                    bg-white
                    text-gray-400
                    hover:bg-gray-50
                    hover:text-gray-600
                    transition
                    cursor-default
                  "
                  title="수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </SortableMemoCard>
      ))}
    </SortableContext>
  </DndContext>
)}
            </div>

            <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100 bg-white">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
                  disabled={memoPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white disabled:hover:text-gray-300 cursor-default"
                >
                  이전
                </button>

                {Array.from({
                  length: Math.min(totalMemoPages, 10),
                }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      onClick={() => setMemoPage(page)}
                      className={`px-4 py-2 border-l border-gray-200 cursor-default ${
                        memoPage === page
  ? "bg-slate-800 text-white hover:bg-slate-700"
  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setMemoPage((p) => Math.min(totalMemoPages, p + 1))
                  }
                  disabled={memoPage === totalMemoPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:text-gray-300 disabled:hover:bg-white disabled:hover:text-gray-300 cursor-default"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}</>);
}
