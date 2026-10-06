"use client";

import styles from "../HomePage.module.css";
import { X, Settings, Plus } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { personalMenuIcons, PersonalMenuIconKey } from "../data";
import SortableMenuSortCard from "../components/SortableMenuSortCard";
import type { HomeController } from "../hooks/useHomeController";
export default function MenuSortDialog({ controller }: { controller: HomeController }) {
const { authStatus, menus, hiddenMenuIds, tempHiddenMenuIds, setTempHiddenMenuIds, sensors, menuSortOpen, setMenuSortOpen, tempMenus, setTempMenus, setMenuAddOpen, personalMenus, tempPersonalMenus, setTempPersonalMenus, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, menuManageMode, setMenuManageMode, selectedPersonalMenuId, setSelectedPersonalMenuId, selectedDeleteMenuIds, setSelectedDeleteMenuIds, setEditingOriginalMenu, editIconOpen, setEditIconOpen, startPopupDrag, getPopupStyle, resetPopupPosition, quickMenuKeys, tempQuickMenuKeys, setTempQuickMenuKeys, setContextMenu, setDeleteConfirmOpen, setQuickMenuSelectOpen, quickMenuOptions, handleMenuSortDragEnd, startEditPersonalMenu, saveEditingMenuAndClose, cancelEditingMenu, hasMenuManageChanges, saveMenuManageChanges } = controller;
return (<>{menuSortOpen && (
  <div
  onClick={() => setContextMenu(null)}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4"
>
   <div data-popup-frame="true"
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("menuSort")}
  className={`${styles.menuSortDialog} bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col`}
>
     <div
  onPointerDown={(e) => startPopupDrag("menuSort", e)}
  className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between"
>
  <div className="font-bold flex items-center gap-2">
    <Settings className="w-5 h-5" />
메뉴 변경
  </div>

 <button data-popup-close={menuManageMode === "sort"}
  onClick={() => {
  if (menuManageMode === "sort") {
 setTempMenus(menus); 
  setTempPersonalMenus(personalMenus);
  setTempQuickMenuKeys(quickMenuKeys);
  setTempHiddenMenuIds(hiddenMenuIds);

  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);
  setMenuSortOpen(false);
  return;
}

    setMenuManageMode("sort");
    setSelectedPersonalMenuId("");
    setSelectedDeleteMenuIds([]);
    setEditIconOpen(false);
    setNewMenuTitle("");
    setNewMenuDesc("");
    setNewMenuLink("");
    setNewMenuIcon("globe");
  }}
  className={`
    h-9
    flex
    items-center
    justify-center
    transition
    cursor-pointer
    ${
      menuManageMode === "sort"
        ? "w-9 rounded-full hover:bg-white/10"
        : "px-4 min-w-[92px] -translate-x-0 rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
    }
  `}
>
  {menuManageMode === "sort" ? (
    <X className="w-5 h-5" />
  ) : (
    <span className="text-sm font-bold whitespace-nowrap">
      뒤로가기
    </span>
  )}
</button>
</div>

<div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
  <div className="min-w-0">
  <p className="text-base font-black text-gray-900">
    {menuManageMode === "sort" && (
  <>
    <span className="hidden md:inline">
      메뉴 위치 변경 및 숨기기
    </span>

    <span className="md:hidden">
      메뉴 숨기기
    </span>
  </>
)}
    {menuManageMode === "edit" && "메뉴 수정"}
    {menuManageMode === "delete" && "메뉴 삭제"}
  </p>

<p className="text-sm text-gray-500 mt-0 leading-relaxed break-keep">
  {menuManageMode === "sort" && (
    <>
      <span className="hidden md:inline">
        메뉴를 드래그해서 원하는 순서로 변경할 수 있습니다.
      </span>

      <span className="md:hidden">
        눈 아이콘으로 메뉴를 숨기거나 다시 표시할 수 있습니다.
      </span>
    </>
  )}

  {menuManageMode === "edit" &&
    "직접 추가한 메뉴를 수정하고 빠른메뉴 실행 항목을 설정할 수 있습니다."}

  {menuManageMode === "delete" &&
    "직접 추가한 메뉴 중 삭제할 메뉴를 선택할 수 있습니다."}
</p>
</div>
  <div className="flex gap-2 shrink-0">
   <button data-menu-action
      onClick={() => {
        setTempPersonalMenus(personalMenus);
        setSelectedPersonalMenuId("");
        setEditIconOpen(false);
        setTempQuickMenuKeys(quickMenuKeys);
        setMenuManageMode("edit");
      }}
      className={`
        h-9
        px-4
        rounded-xl
        text-xs
        font-bold
        transition
        cursor-default
        ${
          menuManageMode === "edit"
            ? "bg-gray-800 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
      `}
    >
      수정
    </button>

    <button data-menu-action
      onClick={() => {
        setSelectedPersonalMenuId("");
        setSelectedDeleteMenuIds([]);
        setMenuManageMode("delete");
      }}
      className={`
        h-9
        px-4
        rounded-xl
        text-xs
        font-bold
        transition
        cursor-default
        ${
          menuManageMode === "delete"
            ? "bg-red-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500"
        }
      `}
    >
      삭제
    </button>
  </div>
</div>
<div className="flex-1 overflow-y-auto p-5">

  {menuManageMode === "sort" && (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleMenuSortDragEnd}
    >
<SortableContext
  items={tempMenus
    .filter((menu) => menu.id !== "lecture")
    .filter((menu) => !menu.approvedOnly || authStatus === "approved")
    .map((menu) => menu.id)}
>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
{tempMenus
  .filter((menu) => menu.id !== "lecture")
  .filter((menu) => !menu.approvedOnly || authStatus === "approved")
  .map((menu) => (
  <SortableMenuSortCard
    key={menu.id}
    menu={menu}
    tempHiddenMenuIds={tempHiddenMenuIds}
    setTempHiddenMenuIds={setTempHiddenMenuIds}

    onContextMenu={(e) => {

  if (!menu.isPersonal) return;

  e.preventDefault();

  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    type: "menuManage",
    id: menu.id,
  });
}}
    onEdit={() => {
  if (!menu.isPersonal) return;

  const targetMenu = tempPersonalMenus.find(
    (item) => item.id === menu.id
  );

  if (!targetMenu) return;

  startEditPersonalMenu(targetMenu);
  setMenuManageMode("edit");
}}
  />
))}
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
        </div>
      </SortableContext>
    </DndContext>
  )}

  {menuManageMode === "edit" && (
  <div
    onClick={() => {
      if (selectedPersonalMenuId) {
        saveEditingMenuAndClose();
      }
    }}
    className="space-y-5"
  >
    <div
      className="
        bg-white
       p-5
pb-3
sm:p-6
sm:pb-4
        rounded-3xl
        shadow
        border
        border-gray-200
        min-h-[180px]
        cursor-default
      "
    >
      <h2 className="text-lg font-bold text-gray-900">
        빠른메뉴 실행하기
      </h2>

      <p className="text-sm text-gray-500 mt-1 leading-relaxed break-keep">
        메인화면에서 바로 실행할 메뉴를 최대 4개까지 선택할 수 있습니다.
        추후 기능이 추가되면 선택 가능한 메뉴도 함께 추가됩니다.
      </p>

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
                  h-[50px]
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
  relative
  h-[50px]
  px-4
  rounded-2xl
  border
  border-blue-200
  bg-blue-50
  flex
  items-center
  justify-center
                gap-2
                hover:-translate-y-0.5
                hover:shadow-md
                transition
              "
            >
              <span className="flex-1 text-center text-sm font-bold text-blue-600">
                {selectedMenu.title}
              </span>

              <button
                onClick={() => {
                  setTempQuickMenuKeys((prev) =>
  prev.filter((key) => key !== selectedMenu.key)
);
                }}
                className="
  absolute
  right-3
  top-1/2
  -translate-y-1/2
  w-7
  h-7
  rounded-full
                  flex
                  items-center
                  justify-center
                  text-blue-500
                  hover:bg-blue-100
                  transition hover:scale-105 active:scale-95
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>

        
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
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
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none"
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
      </div>
    
  </div>
)}

  {menuManageMode === "delete" && (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
      {personalMenus.length === 0 ? (
        <div className="col-span-full min-h-[380px] flex items-center justify-center pt-16 text-center text-sm text-gray-400">
  삭제할 개인 메뉴가 없습니다.
</div>
      ) : (
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
        : "bg-white border-gray-200"
    }
  `}
>
  <Icon className="w-10 h-10 mb-4 text-blue-600 shrink-0" />

  <h2 className="text-lg font-bold leading-snug text-gray-900">
    {menu.title}
  </h2>

  <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
    {menu.desc}
  </p>
</button>
          );
        })
      )}
    </div>
  )}
</div>

      <div className="border-t border-gray-100 bg-white p-4 flex gap-3 justify-center">
  <button data-menu-action
    onClick={() => {
      if (menuManageMode === "edit") {
        cancelEditingMenu();
        return;
      }

      if (menuManageMode === "delete") {
        setSelectedDeleteMenuIds([]);
        return;
      }

           setTempMenus(menus);
      setTempPersonalMenus(personalMenus);
      setTempQuickMenuKeys(quickMenuKeys);
      setTempHiddenMenuIds(hiddenMenuIds);
      setSelectedPersonalMenuId("");
    }}
    className="
      w-32
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

  {menuManageMode === "sort" && (
    <button data-menu-action
      onClick={() => {
        saveMenuManageChanges("popup");
      }}
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
      저장
    </button>
  )}

  {menuManageMode === "edit" && (
    <button data-menu-action
      onClick={() => {
        saveMenuManageChanges("popup");
      }}
      disabled={!hasMenuManageChanges()}
      className="
        w-32
        h-12
        rounded-2xl
        bg-gray-800
        text-white
        text-sm
        font-bold
        hover:bg-gray-700
        disabled:bg-gray-200
        disabled:text-gray-400
        transition
        cursor-default
      "
    >
      저장
    </button>
  )}

  {menuManageMode === "delete" && (
    <button data-menu-action
      onClick={() => setDeleteConfirmOpen(true)}
      disabled={selectedDeleteMenuIds.length === 0}
      className="
        w-32
        h-12
        rounded-2xl
        bg-red-500
        text-white
        text-sm
        font-bold
        hover:bg-red-600
        disabled:bg-gray-200
        disabled:text-gray-400
        transition
        cursor-default
      "
    >
      삭제
    </button>
  )}
</div>
    </div>
  </div>
)}</>);
}
