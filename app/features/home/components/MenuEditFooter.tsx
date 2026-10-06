"use client";
import styles from "../HomePage.module.css";

import type { HomeController } from "../hooks/useHomeController";
export default function MenuEditFooter({ controller }: { controller: HomeController }) {
const { setSelectedDeleteMenuIds, mainMenuManageMode, setDeleteConfirmOpen, cancelEditingMenu, saveMenuManageChanges } = controller;
return (<>{mainMenuManageMode !== "normal" && (
  <div className={styles.footer}>
    <div className="max-w-6xl mx-auto py-3 flex justify-center gap-6">
      <button
        onClick={() => {
          if (mainMenuManageMode === "edit") {
  cancelEditingMenu();
  return;
}

          if (mainMenuManageMode === "delete") {
            setSelectedDeleteMenuIds([]);
            return;
          }
        }}
        className="
          w-50
          h-[50px]
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
          if (mainMenuManageMode === "edit") {
  saveMenuManageChanges("main");
  return;
}

          if (mainMenuManageMode === "delete") {
            setDeleteConfirmOpen(true);
            return;
          }
        }}
        className={`
          w-50
          h-[50px]
          rounded-2xl
          text-white
          text-sm
          font-bold
          transition
          cursor-default
          ${
            mainMenuManageMode === "delete"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {mainMenuManageMode === "delete" ? "삭제" : "저장"}
      </button>
    </div>
  </div>
)}</>);
}
