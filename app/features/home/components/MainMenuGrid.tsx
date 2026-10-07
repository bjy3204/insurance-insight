"use client";

import styles from "../HomePage.module.css";
import { X, ChevronUp, ChevronDown, Settings, Plus } from "lucide-react";
import { SALES_BOOK_VERSION } from "@/app/sales-book/data";
import { personalMenuIcons, PersonalMenuIconKey } from "../data";
import type { HomeController } from "../hooks/useHomeController";
export default function MainMenuGrid({ controller }: { controller: HomeController }) {
const { authUser, authStatus, authRole, menus, hiddenMenuIds, quickOpen, setQuickOpen, setMenuAddOpen, personalMenus, tempPersonalMenus, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, selectedPersonalMenuId, selectedDeleteMenuIds, setSelectedDeleteMenuIds, editIconOpen, setEditIconOpen, mainMenuManageMode, resetPopupPosition, setCmPinOpen, setCmPinState, quickMenuKeys, tempQuickMenuKeys, setTempQuickMenuKeys, setContextMenu, setQuickMenuSelectOpen, hasSalesBookUpdate, setHasSalesBookUpdate, quickMenuOptions, startEditPersonalMenu, saveEditingMenuAndClose, openCmPinPopup } = controller;
return (<><div className={`${styles.menuSection} max-w-[1500px] mx-auto px-5 py-8 sm:px-10 sm:pt-10 sm:pb-2 md:pb-2 lg:pb-5`}>
       
        <div
  onClick={() => {
    if (selectedPersonalMenuId) {
  saveEditingMenuAndClose();
}
  }}
  className={`${styles.menuGrid} relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 items-start`}
>

{mainMenuManageMode === "normal" &&
  menus
  .filter((menu) => menu.id !== "lecture")
    .filter((menu) => !hiddenMenuIds.includes(menu.id))
    .filter((menu) => !menu.approvedOnly || authStatus === "approved")
    .map((menu) => {
    const Icon = menu.icon;

    return (
      <a
        data-menu-id={menu.id}
        key={menu.id}
        onContextMenu={(e) => {
  if (!menu.isPersonal) return;

  e.preventDefault();

  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    type: "mainPersonal",
    id: menu.id,
  });
}}
href={
  menu.id === "customer-manage" || menu.id === "sales-book"
    ? undefined
    : menu.link
}
onClick={(e) => {
  if (menu.id === "customer-manage") {
    e.preventDefault();
    openCmPinPopup();
    return;
  }

if (menu.id === "sales-book") {
  e.preventDefault();

  if (!authUser || authStatus !== "approved") {
    setCmPinState("not-approved");
    setCmPinOpen(true);
    return;
  }

  localStorage.setItem(
    "sales-book-viewed-version",
    SALES_BOOK_VERSION.toString()
  );

  setHasSalesBookUpdate(false);

  window.location.href = "/sales-book";
  return;
}

}}
target={
  menu.title === "보험인사이트 폴더" ||
  menu.id === "subscriber-folder" ||
  menu.id === "auto-claim" ||
  menu.isPersonal
    ? "_blank"
    : "_self"
}
        rel="noopener noreferrer"
        className={`
          ${
            menu.title === "강의일정"
              ? "bg-white border border-gray-100"
              : "bg-white"
          }
          p-7
          sm:p-8
          rounded-3xl
          shadow
          hover:shadow-xl
          hover:-translate-y-1
          transition
          min-h-[190px]
          cursor-default
        `}
      >
        <Icon className="w-10 h-10 mb-4 text-blue-600" />

<div className="flex items-center gap-2">
  <h2 className="text-lg font-bold">{menu.title}</h2>

  {menu.id === "sales-book" && hasSalesBookUpdate && (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold leading-none text-blue-600">
      Update
    </span>
  )}
</div>

<p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
  {menu.id === "insurance-folder"
    ? authStatus === "approved"
      ? "비밀번호 : 1234"
      : "비밀번호 : 카카오톡 공지"
    : menu.desc}
</p>
            </a>
    );
  })}

{mainMenuManageMode === "normal" && authRole === "admin" && (
  <a
    data-menu-id="admin"
    href="/admin"
    className="bg-blue-600 p-7 sm:p-8 rounded-3xl shadow hover:shadow-xl hover:-translate-y-1 transition min-h-[190px] cursor-default"
  >
    <Settings className="w-10 h-10 mb-4 text-white" />
    <h2 className="text-lg font-bold text-white">관리자 페이지</h2>
    <p className="text-sm text-blue-100 mt-2 leading-relaxed break-keep">
      회원 승인 및 관리
    </p>
  </a>
)}

{mainMenuManageMode === "edit" && (

  <>
    <div className="col-span-full">
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow border border-gray-200 cursor-default">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            빠른메뉴 실행하기
          </h2>

          <p className="text-sm text-gray-500 mt-1 leading-relaxed break-keep">
            메인화면에서 바로 실행할 메뉴를 최대 4개까지 선택할 수 있습니다.
            추후 기능이 추가되면 선택 가능한 메뉴도 함께 추가됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {Array.from({ length: 4 }).map((_, index) => {
            const selectedKey = tempQuickMenuKeys[index];

            const selectedMenu = quickMenuOptions.find(
              (item) => item.key === selectedKey
            );

            if (!selectedMenu) {
              return (
                <button
                  key={index}
                  onClick={() => setQuickMenuSelectOpen(true)}
                  className="
                    h-[58px]
                    rounded-2xl
                    border
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-bold
                    text-gray-400
                    hover:bg-gray-100
                    hover:-translate-y-0.5
                    hover:shadow-md
                    transition
                    cursor-default
                  "
                >
                  <Plus className="w-5 h-5" />
                </button>
              );
            }

            return (
              <div
                key={selectedMenu.key}
                className="
                  h-[58px]
                  px-4
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50
                  flex
                  items-center
                  justify-between
                  gap-2
                  hover:-translate-y-0.5
                  hover:shadow-md
                  transition
                "
              >
                <span className="flex-1 text-center text-sm font-bold text-blue-600 truncate px-1">
                  {selectedMenu.title}
                </span>

                <button
                  onClick={() => {
                    setTempQuickMenuKeys((prev) =>
  prev.filter((key) => key !== selectedMenu.key)
);
                  }}
                  className="
                    w-7
                    h-7
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-blue-500
                    hover:bg-blue-100
                    transition
                    hover:scale-105
                    active:scale-95
                    cursor-pointer
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>

            {tempPersonalMenus.map((menu) => {
      const Icon = personalMenuIcons[menu.iconKey];
      const isSelected = selectedPersonalMenuId === menu.id;

      return (
        <div
  key={menu.id}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "menuManage",
      id: menu.id,
    });
  }}
  onClick={(e) => {
    e.stopPropagation();
    startEditPersonalMenu(menu);
  }}
          className="
            bg-white
            p-7
            sm:p-8
            rounded-3xl
            shadow
            border
            border-gray-200
            min-h-[190px]
            cursor-default
            transition
            hover:shadow-xl
            hover:-translate-y-1
          "
        >
          {!isSelected ? (
            <>
              <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

              <h2 className="text-lg font-bold text-gray-900">
                {menu.title}
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
                {menu.desc}
              </p>
            </>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setEditIconOpen(!editIconOpen)}
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-white
                  border
                  border-gray-200
                  flex
                  items-center
                  justify-center
                  mb-3
                  cursor-pointer
                  hover:bg-gray-50
                  transition
                "
              >
                <Icon className="w-5 h-5 text-blue-600 shrink-0" />
              </button>

              {editIconOpen && (
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {Object.entries(personalMenuIcons).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setNewMenuIcon(key as PersonalMenuIconKey)
                      }
                      className="
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        transition
                        group
                      "
                    >
                      <Icon
                        className={`
                          w-5
                          h-5
                          shrink-0
                          transition
                          ${
                            newMenuIcon === key
                              ? "text-blue-600"
                              : "text-gray-400 group-hover:text-gray-500"
                          }
                        `}
                      />
                    </button>
                  ))}
                </div>
              )}

              <input
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="메뉴명"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
              />

              <input
                value={newMenuDesc}
                onChange={(e) => setNewMenuDesc(e.target.value)}
                placeholder="설명글"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-2"
              />

              <input
                value={newMenuLink}
                onChange={(e) => setNewMenuLink(e.target.value)}
                placeholder="링크"
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none mb-3"
              />
            </div>
          )}
        </div>
      );
    })}
    <button
  onClick={() => {
    resetPopupPosition("menuAdd");
    setMenuAddOpen(true);
  }}
  className="
    bg-white
    p-7
    sm:p-8
    rounded-3xl
    shadow
    border
    border-dashed
    border-gray-300
    min-h-[190px]
    cursor-default
    flex
    items-center
    justify-center
    hover:bg-gray-50
    hover:shadow-xl
hover:-translate-y-1
    transition
  "
>
  <Plus className="w-10 h-10 text-gray-300" />
</button>
  </>
)}

{mainMenuManageMode === "delete" &&
  personalMenus.map((menu) => {
    const Icon = personalMenuIcons[menu.iconKey];
    const isSelected = selectedDeleteMenuIds.includes(menu.id);

    return (
      <button
        key={menu.id}
        onClick={() =>
  setSelectedDeleteMenuIds((prev) =>
    prev.includes(menu.id)
      ? prev.filter((id) => id !== menu.id)
      : [...prev, menu.id]
  )
}
        className={`
  p-7
  sm:p-8
  rounded-3xl
  shadow
  border
  min-h-[190px]
  text-left
  cursor-default
  transition
  hover:shadow-xl
  hover:-translate-y-1
  ${
    isSelected
      ? "bg-red-50 border-red-200"
      : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
  }
`}
      >
        <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

        <h2 className="text-lg font-bold text-gray-900">
          {menu.title}
        </h2>

        <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
          {menu.desc}
        </p>
      </button>
    );
  })}

          {/* 빠른 실행 - 모바일/태블릿 전용 */}

        </div>
      </div></>);
}
