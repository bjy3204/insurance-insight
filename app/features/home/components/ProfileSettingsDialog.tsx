"use client";

import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import AccountPinCheck from "./AccountPinCheck";
import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function ProfileSettingsDialog({ controller }: { controller: HomeController }) {
const { authUser, profileSettingOpen, setProfileSettingOpen, kakaoConnected, kakaoConnecting, editNickname, setEditNickname, editInstagram, setEditInstagram, newPassword, setNewPassword, currentPassword, setCurrentPassword, newPasswordConfirm, setNewPasswordConfirm, saveProfileSettings, handleKakaoConnect, handleKakaoDisconnect } = controller;
return (<>{profileSettingOpen && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
    onClick={() => setProfileSettingOpen(false)}
  >
    <div
      data-popup-resize="false"
      data-popup-small="true"
      data-account-settings="true"
      role="dialog" aria-modal="true" aria-label="계정설정"
      onClick={(e) => e.stopPropagation()}
      className="
        w-full
        max-w-sm
        max-h-[calc(100dvh-32px)]
        overflow-y-auto
        rounded-3xl
        bg-white
        p-6
        shadow-xl
        cursor-default
      "
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 data-popup-heading="true" className="text-lg font-bold text-gray-900">
          계정설정
        </h2>

        <button data-icon-only="true" data-popup-close="true"
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
    <p className="shrink-0 text-sm font-bold text-gray-400">
      현재 이메일
    </p>

    <p className="text-sm font-bold text-gray-700 break-all">
      {authUser?.email}
    </p>
  </div>
</div>

<div className="space-y-3">
  
        <ClearableSearchInput onClear={() => setEditNickname("")} data-ui-field="true"
          type="text"
          placeholder="닉네임"
          value={editNickname}
          onChange={(e) => setEditNickname(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
        />

        <ClearableSearchInput onClear={() => setEditInstagram("")} data-ui-field="true"
          type="text"
          placeholder="인스타그램 아이디"
          value={editInstagram}
          onChange={(e) => setEditInstagram(e.target.value)}
          className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />

        <AccountPinCheck controller={controller}/>

        <div className="pt-3 border-t border-gray-100">
          <p className="mb-2 text-sm font-bold text-gray-500">
            비밀번호 변경

          </p>

          <ClearableSearchInput onClear={() => setCurrentPassword("")} data-ui-field="true"
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <ClearableSearchInput onClear={() => setNewPassword("")} data-ui-field="true"
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-3 h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <ClearableSearchInput onClear={() => setNewPasswordConfirm("")} data-ui-field="true"
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

        <button data-popup-action="true" data-action-height="48"
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
