"use client";

import { X } from "lucide-react";
import { personalMenuIcons, PersonalMenuIconKey } from "../data";
import type { HomeController } from "../hooks/useHomeController";
export default function MenuAddDialog({ controller }: { controller: HomeController }) {
const { menuAddOpen, setMenuAddOpen, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, startPopupDrag, getPopupStyle, addPersonalMenu } = controller;
return (<>{menuAddOpen && (
  <div
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("menuAdd")}
  className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6"
>
      <div
  onPointerDown={(e) => startPopupDrag("menuAdd", e)}
  className="flex items-center justify-between mb-5"
>
        <h2 className="text-xl font-black text-gray-900">
          메뉴 추가
        </h2>

        <button data-popup-close="true"
          onClick={() => setMenuAddOpen(false)}
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

      <div className="mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">
          아이콘 선택
        </p>

        <div className="grid grid-cols-6 gap-2">
          {Object.entries(personalMenuIcons).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setNewMenuIcon(key as PersonalMenuIconKey)}
              className={`
                h-12
                rounded-2xl
                border
                flex
                items-center
                justify-center
                transition
                cursor-default
                ${
                  newMenuIcon === key
                    ? "bg-gray-800 border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <input
        value={newMenuTitle}
        onChange={(e) => setNewMenuTitle(e.target.value)}
        placeholder="메뉴명"
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

      <input
        value={newMenuDesc}
        onChange={(e) => setNewMenuDesc(e.target.value)}
        placeholder="설명글"
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

      <input
        value={newMenuLink}
        onChange={(e) => setNewMenuLink(e.target.value)}
        placeholder="링크"
        className="
          w-full
          h-12
          rounded-2xl
          border
          border-gray-200
          px-4
          text-sm
          outline-none
          mb-5
        "
      />

      <div className="flex gap-3">
        <button
          onClick={() => {
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setMenuAddOpen(false);
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
          onClick={addPersonalMenu}
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
