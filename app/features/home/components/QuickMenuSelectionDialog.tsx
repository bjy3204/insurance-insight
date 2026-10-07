"use client";

import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function QuickMenuSelectionDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, menuSortOpen, mainMenuManageMode, quickMenuKeys, setQuickMenuKeys, tempQuickMenuKeys, setTempQuickMenuKeys, setQuickLimitOpen, quickMenuSelectOpen, setQuickMenuSelectOpen, quickMenuOptions } = controller;
const validSelection = [...new Set(tempQuickMenuKeys)].filter((key) => quickMenuOptions.some((item) => item.key === key));
return (<>{quickMenuSelectOpen && (
  <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">
          빠른메뉴 선택
        </h2>

        <button data-popup-close="true"
  onClick={() => {
    setTempQuickMenuKeys(quickMenuKeys);
    setQuickMenuSelectOpen(false);
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

      <div className="grid grid-cols-1 gap-2">
  {quickMenuOptions.map((item) => {
    const isSelected = validSelection.includes(item.key);

    return (
      <button
        key={item.key}
        onClick={() => {
          if (isSelected) {
            setTempQuickMenuKeys((prev) =>
              prev.filter((key) => key !== item.key)
            );
            return;
          }

          if (validSelection.length >= 4) {
            setQuickLimitOpen(true);
            return;
          }

          setTempQuickMenuKeys([...validSelection, item.key]);
        }}
        className={`
          h-12
          rounded-2xl
          border
          text-sm
          font-bold
          transition
          cursor-default
          ${
            isSelected
              ? "border-blue-400 bg-blue-50 text-blue-600"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }
        `}
      >
        {item.title}
      </button>
    );
  })}
</div>
      <div className="flex gap-3 mt-6">
  <button
    onClick={() => {
      setTempQuickMenuKeys(quickMenuKeys);
      setQuickMenuSelectOpen(false);
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
  onClick={() => {
    if (mainMenuManageMode === "normal" && !menuSortOpen) {
      setTempQuickMenuKeys(validSelection);
      setQuickMenuKeys(validSelection);
      if (authUser && authStatus === "approved") {
        supabase.from("profiles").update({ quick_menu_keys: validSelection }).eq("id", authUser.id).then();
      } else {
        localStorage.setItem("quickMenuKeys", JSON.stringify(validSelection));
      }
    }

    setQuickMenuSelectOpen(false);
  }}

    className="
      flex-1
      h-12
      rounded-2xl
      bg-blue-600
      text-white
      text-sm
      font-bold
      hover:bg-blue-700
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
