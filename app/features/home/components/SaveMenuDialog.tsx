"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function SaveMenuDialog({ controller }: { controller: HomeController }) {
const { saveConfirmOpen, setSaveConfirmOpen, saveConfirmType, saveConfirmMessage } = controller;
return (<>{saveConfirmOpen && (
  <div className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        저장 완료
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        {saveConfirmMessage}
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setSaveConfirmOpen(false)}
          className={`
            w-32
            h-12
            rounded-2xl
            text-white
            text-sm
            font-bold
            transition
            cursor-default
            ${
  saveConfirmType === "popup"
    ? "bg-gray-800 hover:bg-gray-700"
    : "bg-blue-600 hover:bg-blue-700"
}
          `}
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}</>);
}
