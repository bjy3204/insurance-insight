"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function ProfileSettingsDialog({ controller }: { controller: HomeController }) {
const { authUser, profileSettingOpen, setProfileSettingOpen, kakaoConnected, kakaoConnecting, editNickname, setEditNickname, editInstagram, setEditInstagram, pinCheckPassword, setPinCheckPassword, pinCheckResult, newPassword, setNewPassword, currentPassword, setCurrentPassword, newPasswordConfirm, setNewPasswordConfirm, handleCheckPin, saveProfileSettings, handleKakaoConnect, handleKakaoDisconnect } = controller;
return (<>{profileSettingOpen && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
    onClick={() => setProfileSettingOpen(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        w-full
        max-w-sm
        rounded-3xl
        bg-white
        p-6
        shadow-xl
        cursor-default
      "
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          개인설정
        </h2>

        <button data-popup-close="true"
          onClick={() => setProfileSettingOpen(false)}
          className="
    w-9
    h-9
    rounded-full
    flex
    items-center
    justify-center
    text-gray-400
    hover:bg-gray-100
    hover:text-gray-600
    transition
    cursor-pointer
  "
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
  <div className="flex items-center gap-3">
    <p className="shrink-0 text-[11px] font-bold text-gray-400">
      현재 이메일
    </p>

    <p className="text-sm font-bold text-gray-700 break-all">
      {authUser?.email}
    </p>
  </div>
</div>

<div className="space-y-3">
  
        <input
          type="text"
          placeholder="닉네임"
          value={editNickname}
          onChange={(e) => setEditNickname(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
        />

        <input
          type="text"
          placeholder="인스타그램 아이디"
          value={editInstagram}
          onChange={(e) => setEditInstagram(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />

        <div className="pt-3 border-t border-gray-100">
          <p className="mb-2 text-xs font-bold text-gray-500">개인공간 비밀번호</p>
          <div className="flex gap-2">
            <input
  type="password"
  placeholder="회원가입 비밀번호 입력"
  value={pinCheckPassword}
  onChange={(e) => setPinCheckPassword(e.target.value)}
  onKeyDown={(e) => { if (e.key === "Enter") handleCheckPin(); }}
  className="flex-1 h-11 rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
/>

            <button
              onClick={handleCheckPin}
              className="h-11 px-4 rounded-xl bg-gray-900 text-white text-sm font-bold cursor-pointer hover:bg-gray-800"
            >
              확인
            </button>
          </div>
          {pinCheckResult && (
            <p className="mt-2 text-sm text-center font-semibold text-blue-600">{pinCheckResult}</p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="mb-2 text-xs font-bold text-gray-500">
            비밀번호 변경

          </p>

          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={newPasswordConfirm}
            onChange={(e) =>
              setNewPasswordConfirm(e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />
        </div>

        <div className="pt-3 border-t border-gray-100">
  <p className="mb-2 text-xs font-bold text-gray-500">
    카카오 로그인
  </p>

{kakaoConnected ? (
  <button
    onClick={handleKakaoDisconnect}
    className="
      h-11
      w-full
      rounded-xl
      border
      border-red-200
      bg-red-50
      text-sm
      font-bold
      text-red-600
      cursor-pointer
      transition
      hover:bg-red-100
    "
  >
    카카오 연결 해제
  </button>
) : (
  <button
    onClick={handleKakaoConnect}
    disabled={kakaoConnecting}
    className="
      h-11
      w-full
      rounded-xl
      bg-[#FEE500]
      text-sm
      font-bold
      text-[#191919]
      cursor-pointer
      transition
      hover:bg-[#f6dc00]
    "
  >
    {kakaoConnecting ? "연결중..." : "카카오 연결하기"}
  </button>
)}
</div>

        <button
          onClick={saveProfileSettings}
          className="h-11 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 cursor-pointer"
        >
          저장하기
        </button>
        
      </div>
    </div>
  </div>
)}</>);
}
