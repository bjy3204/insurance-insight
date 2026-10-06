"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function DeleteMemoDialog({ controller }: { controller: HomeController }) {
const { deleteMemoConfirmOpen, setDeleteMemoConfirmOpen, setDeleteMemoId, confirmDeleteMemo } = controller;
return (<>{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        메모 삭제
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        선택한 메모를 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setDeleteMemoId(null);
            setDeleteMemoConfirmOpen(false);
          }}
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
          onClick={confirmDeleteMemo}
          className="
            flex-1
            h-12
            rounded-2xl
            bg-red-500
            text-white
            text-sm
            font-bold
            hover:bg-red-600
            transition
            cursor-default
          "
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}</>);
}
