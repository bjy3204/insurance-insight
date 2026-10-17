"use client";

import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import { X } from "lucide-react";
import { personalMenuIcons, PersonalMenuIconKey } from "../data";
import type { HomeController } from "../hooks/useHomeController";
export default function MenuAddDialog({ controller }: { controller: HomeController }) {
const { menuAddOpen, setMenuAddOpen, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, startPopupDrag, getPopupStyle, addPersonalMenu } = controller;
return (<>{menuAddOpen && (
  <div
    data-menu-add-overlay="true" className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
    <div
  id="home-menu-add-dialog" data-menu-add-dialog="true" data-popup-padded="true" data-popup-resize="false" data-account-inputs="true"
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("menuAdd")}
  className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6"
>
      <div
  data-popup-drag-handle="true"
  onPointerDown={(e) => startPopupDrag("menuAdd", e)}
  className="flex items-center justify-between mb-5"
>
        <h2 data-popup-heading="true" className="text-xl font-black text-gray-900">
          메뉴 추가
        </h2>

        <button data-icon-only="true" data-popup-close="true"
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

        <div className="grid grid-cols-6 gap-2">
          {Object.entries(personalMenuIcons).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setNewMenuIcon(key as PersonalMenuIconKey)}
              className={`
                h-12
                rounded-xl
                border
                flex
                items-center
                justify-center
                transition
                cursor-default
                ${
                  newMenuIcon === key
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <ClearableSearchInput onClear={() => setNewMenuTitle("")} data-ui-field="true"
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

      <ClearableSearchInput onClear={() => setNewMenuDesc("")} data-ui-field="true"
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

      <ClearableSearchInput onClear={() => setNewMenuLink("")} data-ui-field="true"
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
          mb-0
        "
      />

      <div className="flex gap-3">
        <button data-popup-action="true" data-action-height="48"
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

        <button data-popup-action="true" data-action-height="48"
          onClick={addPersonalMenu}
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
