"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function MobileMessageButton({ controller }: { controller: HomeController }) {
const { setOpen, resetPopupPosition } = controller;
return (<><div className="max-w-[1500px] mx-auto px-5 -mt-5 mb-23 md:hidden">
  <button
    onClick={() => {
  resetPopupPosition("message");
  setOpen(true);
}}
    className="
      w-full
      h-[50px]
      rounded-2xl
      bg-blue-600
      text-white
      text-sm
      font-bold
      shadow-sm
      flex
      items-center
      justify-center
    "
  >
    보험나무에게 메세지 보내기
  </button>
</div></>);
}
