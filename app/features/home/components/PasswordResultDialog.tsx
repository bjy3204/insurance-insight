"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function PasswordResultDialog({ controller }: { controller: HomeController }) {
const { passwordResultOpen, setPasswordResultOpen, passwordResultSuccess, setPasswordResultSuccess, passwordResultRef, passwordResultSuccessRef } = controller;
return (<>{(passwordResultOpen || passwordResultRef.current) && (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-5">

    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
        {(passwordResultSuccess || passwordResultSuccessRef.current) ? "저장 완료" : "저장 실패"}
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        {(passwordResultSuccess || passwordResultSuccessRef.current)
          ? "개인설정이 저장되었습니다."
          : "저장에 실패했습니다. 다시 시도해주세요."}
      </p>

      <div className="flex gap-3 mt-6">
        <button
                    onClick={() => {
            setPasswordResultOpen(false);
            setPasswordResultSuccess(false);
            passwordResultRef.current = false;
            passwordResultSuccessRef.current = false;
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          확인

        </button>
      </div>
    </div>
  </div>
)}</>);
}
