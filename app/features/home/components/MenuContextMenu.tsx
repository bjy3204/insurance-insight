"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function MenuContextMenu({ controller }: { controller: HomeController }) {
const { memos, setTempMenus, personalMenus, tempPersonalMenus, setTempPersonalMenus, setMenuManageMode, setSelectedPersonalMenuId, setSelectedDeleteMenuIds, setMainMenuManageMode, setSelectedMemo, quickMenuKeys, setTempQuickMenuKeys, contextMenu, setContextMenu, setDeleteConfirmOpen, setQuickMenuSelectOpen, setQuickDeleteConfirmOpen, setQuickDeleteKey, startEditPersonalMenu, deleteMemo } = controller;
return (<>{contextMenu && (
 <div
  style={{
    left: contextMenu.x,
    top: contextMenu.y,
  }}
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
    className="
      fixed
      z-[5000]
      w-36
      rounded-2xl
      bg-white
      border
      border-gray-200
      shadow-xl
      overflow-hidden
    "
  >
    <button
  onClick={() => {
  if (contextMenu.type === "memo") {
    const targetMemo = memos.find(
      (memo) => memo.id === contextMenu.id
    );

    if (!targetMemo) return;

    setSelectedMemo(targetMemo);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "quickMenu") {
    setTempQuickMenuKeys(quickMenuKeys);
    setQuickMenuSelectOpen(true);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "menuManage") {
    const targetMenu = tempPersonalMenus.find(
      (menu) => menu.id === contextMenu.id
    );

    if (!targetMenu) return;

    startEditPersonalMenu(targetMenu);
    setMenuManageMode("edit");
    setContextMenu(null);
    return;
  }

  const targetMenu = personalMenus.find(
    (menu) => menu.id === contextMenu.id
  );

  if (!targetMenu) return;

  setTempPersonalMenus(personalMenus);
  setTempQuickMenuKeys(quickMenuKeys);
  startEditPersonalMenu(targetMenu);
  setMainMenuManageMode("edit");
  setContextMenu(null);
}}
      className="
        block
        w-full
        text-center
        px-4
        py-3
        text-sm
        font-bold
        text-gray-700
        hover:bg-blue-50
        hover:text-blue-600
        transition
        cursor-default
      "
    >
      수정
    </button>

    <button
      onClick={() => {
  if (contextMenu.type === "memo") {
    deleteMemo(contextMenu.id);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "quickMenu") {
    setQuickDeleteKey(contextMenu.id);
    setQuickDeleteConfirmOpen(true);
    setContextMenu(null);
    return;
  }

  if (contextMenu.type === "menuManage") {
    setTempMenus((prev) =>
      prev.filter((menu) => menu.id !== contextMenu.id)
    );

    setTempPersonalMenus((prev) =>
      prev.filter((menu) => menu.id !== contextMenu.id)
    );

    setSelectedPersonalMenuId("");
    setContextMenu(null);
    return;
  }

  setSelectedDeleteMenuIds([contextMenu.id]);
  setDeleteConfirmOpen(true);
  setContextMenu(null);
}}

      className="
        block
        w-full
        text-center
        px-4
        py-3
        text-sm
        font-bold
        text-gray-700
        hover:bg-red-50
        hover:text-red-500
        transition
        border-t
        border-gray-100
        cursor-default
      "
    >
      삭제
    </button>
  </div>
)}</>);
}
