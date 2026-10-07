"use client";

import { ChevronUp, ChevronDown, Plus, LayoutGrid } from "lucide-react";
import styles from "../HomePage.module.css";
import type { HomeController } from "../hooks/useHomeController";
export default function QuickMenuPanel({ controller, inRow = false }: { controller: HomeController; inRow?: boolean }) {
const { authStatus, setUserMenuOpen, pcQuickOpen, setPcQuickOpen, pcQuickDirection, pcQuickPos, pcQuickWrapRef, pcQuickDragRef, setMemoOpen, mainMenuManageMode, resetPopupPosition, quickMenuKeys, setTempQuickMenuKeys, setContextMenu, setQuickMenuSelectOpen, quickMenuOptions, openPcQuickMenu, startPcQuickDrag } = controller;
return (<>{mainMenuManageMode === "normal" && (
  <div
    ref={pcQuickWrapRef}
    onPointerDown={inRow ? undefined : startPcQuickDrag}
    style={inRow ? undefined : {
      transform: `translate(${pcQuickPos.x}px, ${pcQuickPos.y}px)`,
    }}
    className={inRow ? styles.quickMenuCard : `
      hidden
      md:block
      fixed
      right-0
      bottom-20
      lg:bottom-25
      z-[60]
      w-[248px]
      cursor-default
      select-none
      touch-none
    `}
  >
    {pcQuickOpen && pcQuickDirection === "up" && (
      <div
        data-pc-quick-menu
        className="
          absolute
          left-0
          z-[61]
          bottom-[calc(100%+8px)]
          w-full
          min-w-full
                    rounded-2xl
          bg-white
          border
          border-gray-200
          overflow-hidden
        "
      >
            <div className="flex items-center border-t border-gray-100">

      <button
        onClick={(e) => {
          e.stopPropagation();
          resetPopupPosition("memo");
          window.dispatchEvent(new Event("open-memo-manager"));
          setUserMenuOpen(false);
        }}
        className="flex-1 px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-default"
      >
        메모장
      </button>
      
    </div>

        
                       <button
            onClick={() => {
              window.location.href = "/calendar";
              setPcQuickOpen(false);
            }}
            className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
          >
            캘린더
          </button>

       

{Array.from({ length: 4 }).map((_, index) => {

  const selectedKey = quickMenuKeys[index];

  const selectedMenu = quickMenuOptions.find(
    (item) => item.key === selectedKey
  );

  if (!selectedMenu) {
    return (
      <button
        key={index}
        onClick={() => {
          setTempQuickMenuKeys(quickMenuKeys);
          setQuickMenuSelectOpen(true);
          setPcQuickOpen(false);
        }}
        className="w-full h-[48px] px-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      key={selectedMenu.key}
      onContextMenu={(e) => {
        e.preventDefault();

        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: "quickMenu",
          id: selectedMenu.key,
          index,
        });
      }}
      onClick={() => {
        selectedMenu.action();
        setPcQuickOpen(false);
      }}
      className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
    >
      {selectedMenu.title}
    </button>
  );
})}

        <button
  onClick={() => {
    window.location.href = "/today-news";
    setPcQuickOpen(false);
  }}
  className="
  w-full
  h-[48px]
  px-4
  text-sm
  font-bold
  text-blue-600
  hover:bg-blue-50
  transition
  cursor-default
  flex
  items-center
  justify-center
  border-t
  border-gray-100
  "
>
  오늘의 뉴스
</button>

      </div>
    )}

    <button
      onClick={(e) => {
        e.stopPropagation();

        if (pcQuickDragRef.current?.moved) {
          pcQuickDragRef.current = null;
          return;
        }

        openPcQuickMenu();
      }}
      aria-expanded={pcQuickOpen}
      className={`${inRow ? styles.quickMenuTrigger : ""}
  w-full
  h-[52px]
  px-5
  rounded-[14px]
  border
  text-sm
  font-bold
  flex
  items-center
  justify-center
  gap-2
  transition
  hover:-translate-y-0.5
  cursor-default
  whitespace-nowrap
  ${
  pcQuickOpen
    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
    : "bg-blue-600 border-blue-600 text-white"
}
`}
    >
      {inRow && <LayoutGrid size={34} aria-hidden="true" />}
      빠른메뉴 실행하기

      {!inRow && (pcQuickOpen ? (
  <ChevronUp className="w-4 h-4 text-gray-400" />
) : (
  <ChevronDown className="w-4 h-4 text-white" />
))}
    </button>

    {pcQuickOpen && pcQuickDirection === "down" && (
      <div
        data-pc-quick-menu
        className="
          absolute
          left-0
          top-[calc(100%+8px)]
          w-full
          min-w-full
                   rounded-2xl
          bg-white
          border
          border-gray-200
          overflow-hidden
        "
      >
        <button
          onClick={() => {
            resetPopupPosition("memo");

            window.dispatchEvent(new Event("open-memo-manager"));
            setPcQuickOpen(false);
          }}
          className="
  w-full
  h-[48px]
  px-4
  text-sm
  font-bold
  text-gray-700
  hover:bg-gray-50
  transition
  cursor-default
  flex
  items-center
  justify-center
"
        >
          메모장
        </button>
        

                <button
            onClick={() => {
              window.location.href = "/calendar";
              setPcQuickOpen(false);
            }}
            className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
          >
            캘린더
          </button>

       
 

{Array.from({ length: 4 }).map((_, index) => {

  const selectedKey = quickMenuKeys[index];

  const selectedMenu = quickMenuOptions.find(
    (item) => item.key === selectedKey
  );

  if (!selectedMenu) {
    return (
      <button
        key={index}
        onClick={() => {
          setTempQuickMenuKeys(quickMenuKeys);
          setQuickMenuSelectOpen(true);
          setPcQuickOpen(false);
        }}
        className="w-full h-[48px] px-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      key={selectedMenu.key}
      onContextMenu={(e) => {
        e.preventDefault();

        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          type: "quickMenu",
          id: selectedMenu.key,
          index,
        });
      }}
      onClick={() => {
        selectedMenu.action();
        setPcQuickOpen(false);
      }}
      className="w-full h-[48px] px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default flex items-center justify-center"
    >
      {selectedMenu.title}
    </button>
  );
})}

<button
  onClick={() => {
    window.location.href = "/today-news";
    setPcQuickOpen(false);
  }}
  className="
    w-full
    h-[48px]
    px-4
    text-sm
    font-bold
    text-blue-600
    hover:bg-blue-50
    transition
    cursor-default
    flex
    items-center
    justify-center
    border-t
    border-gray-100
  "
>
  오늘의 뉴스
</button>

      </div>
    )}
  </div>
)}</>);
}
