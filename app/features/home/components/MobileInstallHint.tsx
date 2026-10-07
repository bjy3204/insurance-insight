"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function MobileInstallHint({ controller }: { controller: HomeController }) {
const { showInstall, setShowInstall, deferredPrompt, setDeferredPrompt } = controller;
return (<>{showInstall &&
  /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent) && (
        <div className="max-w-[1500px] mx-auto px-5 -mt-3 mb-3 md:hidden">
          <button
            onClick={async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShowInstall(false);
      setDeferredPrompt(null);
    }

    return;
  }

  alert(
    "홈화면에 추가 후 앱처럼 사용하세요 !\n\n사파리 또는 크롬에서 열기\n\n모바일: 공유 또는 메뉴 버튼 → 홈 화면에 추가\n\nPC: 브라우저 메뉴 → 앱 설치"
  );
}}
            className="
              w-full
              bg-white
              border
              border-gray-200
              rounded-2xl
              px-4
              h-[50px]
              flex
              items-center
              justify-center
              gap-2
              text-sm
              shadow-sm
            "
          >
            <span className="font-semibold text-gray-800">
  앱처럼 사용하기
</span>
          </button>
        </div>
      )}</>);
}
