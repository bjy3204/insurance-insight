"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function MenuLinkAlert({ controller }: { controller: HomeController }) {
const { menuLinkAlertOpen, setMenuLinkAlertOpen } = controller;
return (<>{menuLinkAlertOpen && (
  <div className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">
        링크 입력
      </h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        메뉴로 연결할 링크를 입력해주세요.
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setMenuLinkAlertOpen(false)}
          className="
            w-32
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
          확인
        </button>
      </div>
    </div>
  </div>
)}</>);
}
