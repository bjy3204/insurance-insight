"use client";

import AuthButton from "@/components/AuthButton";
import { noticeVersion } from "@/app/notice/notices";
import type { HomeController } from "../hooks/useHomeController";
export default function MemberMenu({ controller }: { controller: HomeController }) {
const { authUser, authNickname, authInstagram, authStatus, authCreatedAt, refreshAuth, menus, hiddenMenuIds, setTempHiddenMenuIds, setNoticeOpen, userMenuOpen, setUserMenuOpen, setProfileSettingOpen, setEditNickname, setEditInstagram, setNewPassword, setCurrentPassword, setNewPasswordConfirm, userBtnPos, setMemoOpen, setResourceOpen, setMenuSortOpen, setTempMenus, personalMenus, setTempPersonalMenus, setMenuManageMode, setSelectedPersonalMenuId, setEditIconOpen, resetPopupPosition, quickMenuKeys, setTempQuickMenuKeys, setSelectedNotice, hasUpdate, setHasUpdate, dbNotices } = controller;
return (<>{userMenuOpen && (
 <div
  onClick={(e) => e.stopPropagation()}
  style={{
    transform: `translate(${userBtnPos.x}px, ${userBtnPos.y}px)`,
  }}
  className="
    md:hidden
    fixed
    left-6
    bottom-40
    z-[9999]
    w-40
    rounded-2xl
    bg-white
    border
    border-gray-200
    shadow-xl
    overflow-hidden
  "
>

       <AuthButton
  variant="menu"
  user={authUser}
  nickname={authNickname}
  status={authStatus}
  createdAt={authCreatedAt}
  onAuthChange={refreshAuth}
  onMenuClose={() => setUserMenuOpen(false)}
/>

{authUser && authStatus === "approved" && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        resetPopupPosition("memo");
        window.dispatchEvent(new Event("open-memo-manager"));
        setUserMenuOpen(false);
      }}
            className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      메모장
    </button>
    

   <button
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = "/calendar";
        setUserMenuOpen(false);
      }}
      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      캘린더
    </button>

        <button
            onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("open-calculator"));
        setUserMenuOpen(false);
      }}

      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      계산기
    </button>

       <button
      onClick={(e) => {
        e.stopPropagation();
        setResourceOpen(true);
        setUserMenuOpen(false);
      }}
      className="block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      구독자료
    </button>

    
        <button
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = "/today-news";
        setUserMenuOpen(false);
      }}
      className="sm:hidden block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
    >
      뉴스
    </button>

  </>
)}

   {authUser && (
  <button
    onClick={(e) => {
      e.stopPropagation();

      setEditNickname(authNickname || "");
      setEditInstagram(authInstagram || "");

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

      setProfileSettingOpen(true);
      setUserMenuOpen(false);
    }}
    className="block w-full px-4 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100 cursor-default"
  >
    개인설정
  </button>
)}

<button
  onClick={() => {
    setTempMenus(menus);
    setTempPersonalMenus(personalMenus);
    setTempQuickMenuKeys(quickMenuKeys);
    setTempHiddenMenuIds(hiddenMenuIds);

    setSelectedPersonalMenuId("");
    setEditIconOpen(false);

    setMenuManageMode("sort");

    resetPopupPosition("menuSort");
    setMenuSortOpen(true);

    setUserMenuOpen(false);
  }}
  className="
    md:hidden
    block
    w-full
    px-4
    py-3
    text-center
    text-sm
    font-bold
    text-gray-700
    hover:bg-gray-50
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴변경
</button>

    <button
      onClick={(e) => {
        e.stopPropagation();

        localStorage.setItem("noticeRead", noticeVersion.toString());
        // DB 공지 전체 읽음 처리
        const allDbIds = dbNotices.map((n: any) => n.id);
        localStorage.setItem("seen_db_notice_ids", JSON.stringify(allDbIds));
        setHasUpdate(false);
        setSelectedNotice(null);
        resetPopupPosition("notice");
        setNoticeOpen(true);
        setUserMenuOpen(false);

      }}
      className="
        relative
        block
        w-full
        px-4
        py-3
        text-center
        text-sm
        font-bold
        text-gray-700
        hover:bg-gray-50
        border-t
        border-gray-100
        cursor-default
      "
    >
      공지사항

      {hasUpdate && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
      )}
    </button>
  </div>
)}</>);
}
