"use client";

import MobileHeaderMenu from "./MobileHeaderMenu";
import DesktopHeader from "./DesktopHeader";
import SiteHeader from "@/app/components/SiteHeader";
import { Settings, Home as HomeIcon } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import type { HomeController } from "../hooks/useHomeController";
export default function MainHeader({ controller }: { controller: HomeController }) {
const { authUser, authNickname, authStatus, authCreatedAt, authLoading, setFortuneOpen, menus, hiddenMenuIds, setTempHiddenMenuIds, today, total, showInstall, setShowInstall, deferredPrompt, setDeferredPrompt, WEATHER_REGIONS, setWeatherRegion, weatherOpen, setWeatherOpen, weather, specialDays, settingOpen, setSettingOpen, setMemoOpen, setResourceOpen, setMenuSortOpen, setTempMenus, setMenuAddOpen, personalMenus, setTempPersonalMenus, setMenuManageMode, setSelectedPersonalMenuId, setSelectedDeleteMenuIds, setEditIconOpen, mainMenuManageMode, setMainMenuManageMode, resetPopupPosition, quickMenuKeys, setTempQuickMenuKeys, goBackMainScreen } = controller;
return (<><DesktopHeader controller={controller} /><div className="md:hidden"><SiteHeader variant="main">
          <div className="relative flex items-center justify-center md:justify-center">

    {/* PC 좌측 버튼 */}
{mainMenuManageMode !== "normal" ? (
  <div className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2">
    <button
      onClick={goBackMainScreen}
      className="
        px-4
        h-12
        rounded-2xl
        border
        border-gray-300
        bg-white
        flex
        items-center
        justify-center
        gap-2
        text-sm
        font-semibold
        text-gray-800
        shadow-sm
        hover:bg-gray-50
        transition
        cursor-default
      "
    >
      <HomeIcon className="w-4 h-4" />
      메인화면 돌아가기
    </button>
  </div>
) : (
  <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 items-center gap-10">
      {showInstall && (
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

      alert("크롬 또는 엣지에서 브라우저 메뉴 → 앱 설치를 눌러주세요.");
    }}
    className="
      px-4
      h-12
      rounded-2xl
      border
      border-gray-300
      bg-white
      flex
      items-center
      justify-center
      text-sm
      font-semibold
      text-gray-800
      shadow-sm
      hover:bg-gray-50
      transition
    "
  >
    바로가기 만들기
  </button>
)}

{weather && (
  <div className="relative">
  <div className="flex items-center gap-2 text-black select-none cursor-default">
    
    {/* 날씨만 감싸는 박스 */}
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setWeatherOpen(!weatherOpen);
      }}
      className="relative group flex items-center gap-2"
    >
      {/* 날씨 아이콘 */}
      <span className="text-[22px] leading-none inline-block">
        {(weather.description || "").includes("비") ? (
          <span className="inline-block animate-[weatherRain_1.8s_ease-in-out_infinite]">
            🌧️
          </span>
        ) : (weather.description || "").includes("눈") ? (
          <span className="inline-block animate-[weatherSnow_3s_ease-in-out_infinite]">
            ❄️
          </span>
        ) : (weather.description || "").includes("흐림") ||
     (weather.description || "").includes("구름") ? (
          <span className="inline-block animate-[weatherCloud_5s_ease-in-out_infinite]">
            ☁️
          </span>
        ) : (weather.description || "").includes("맑") ? (
          <span className="inline-block animate-[weatherSun_10s_linear_infinite]">
            ☀️
          </span>
        ) : (
          <span className="inline-block animate-[weatherCloud_5s_ease-in-out_infinite]">
            ☁️
          </span>
        )}
      </span>

      <span className="text-[15px] font-bold">
        {weather.region || "서울"}
      </span>

      {weather.temp !== undefined && (
        <span className="text-[15px] font-black">
          {weather.temp}°C
        </span>
      )}

      {/* 날씨 상세 박스 */}
      <div className="pointer-events-none absolute -left-6 top-9 z-50 w-48 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-700 shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        <div className="font-black text-gray-900 mb-2">
          {weather.description || "날씨 정보"}
        </div>

        <div className="flex justify-between">
          <span>최고기온</span>
          <b>{weather.tempMax ?? "-"}°C</b>
        </div>

        <div className="flex justify-between mt-1">
          <span>최저기온</span>
          <b>{weather.tempMin ?? "-"}°C</b>
        </div>

        <div className="flex justify-between mt-1">
          <span>습도</span>
          <b>{weather.humidity ?? "-"}%</b>
        </div>

        <div className="flex justify-between mt-1">
          <span>체감온도</span>
          <b>{weather.feelsLike ?? "-"}°C</b>
        </div>

 
      </div>
    </div>

{/* 기념일 · 날짜 · 포춘쿠키 버튼 */}
<button data-header-date
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setFortuneOpen(true);
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  className={`
    group
    relative
    ml-8
    inline-flex
    min-w-[110px]
    items-center
    justify-center
    rounded-full
    border
    px-2.5
    py-1
    text-xs
    font-medium
    transition-all
    duration-300
    cursor-default

    ${
      specialDays.length > 0
        ? `
          border-amber-200
          bg-amber-50
          text-amber-700
          hover:border-sky-200
          hover:bg-sky-50
          hover:text-sky-700
          hover:shadow-sm
        `
        : `
          border-sky-200
          bg-sky-50
          text-sky-700
          shadow-sm
        `
    }
  `}
>
  {specialDays.length > 0 ? (
    <>
      {/* 평소에는 기념일 */}
      <span className="text-xs font-medium transition-opacity group-hover:opacity-0">
        {specialDays[0].emoji} {specialDays[0].label}
      </span>

      {/* 마우스를 올리면 날짜 */}
      <span className="absolute text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
        📅 {new Date().getFullYear()}.
        {String(new Date().getMonth() + 1).padStart(2, "0")}.
        {String(new Date().getDate()).padStart(2, "0")}
      </span>
    </>
  ) : (
    /* 기념일이 없으면 날짜 항상 표시 */
    <span className="text-xs font-medium">
      📅 {new Date().getFullYear()}.
      {String(new Date().getMonth() + 1).padStart(2, "0")}.
      {String(new Date().getDate()).padStart(2, "0")}
    </span>
  )}
</button>
  </div>

          {weatherOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="
                absolute
                left-0
                top-12
                w-32
                rounded-2xl
                bg-white
                border
                border-gray-200
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              {WEATHER_REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    setWeatherRegion(region);
                    setWeatherOpen(false);
                  }}
                  className="
                    w-full
                    px-4
                    py-3
                    text-center
                    text-sm
                    font-bold
                    text-gray-700
                    hover:bg-gray-50
                    transition
                    cursor-default
                  "
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
)}

    
  {/* 로고 */}
  <div className="text-center">
    <h1 className="text-2xl font-black text-blue-600">
      보험인사이트
    </h1>

    <p className="text-sm text-gray-500 mt-1">
      보험설계사 업무 통합 플랫폼
    </p>
  </div>

  <MobileHeaderMenu controller={controller} />

    {/* PC 방문자 카운터 + 설정 */}
  <div
  className={`hidden md:block absolute right-6 top-1/2 -translate-y-1/2 ${
    settingOpen ? "z-[1000]" : "z-40"
  }`}
>
    <div className="flex items-center gap-13 text-center">
      
                 <div data-header-member className="hidden min-[1110px]:flex items-center gap-4 scale-130 mr-6">
{authLoading ? (
  <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
) : (
  <div
  onClick={() => {
    if (authStatus === "approved") setResourceOpen(true);
  }}
  className={authStatus === "approved" ? "cursor-pointer hover:opacity-80 transition" : ""}
>
  <AuthButton
    variant="label"
    user={authUser}
    nickname={authNickname}
    status={authStatus}
    createdAt={authCreatedAt}
  />
</div>

)}
</div>

<div>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TODAY
        </p>

        <p className="text-base font-black text-blue-600 mt-1">
          {today.toLocaleString()}
        </p>
      </div>

      <div data-header-total>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TOTAL
        </p>

        <p className="text-base font-black text-gray-900 mt-1">
          {total.toLocaleString()}
        </p>
      </div>

      <div className="relative z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSettingOpen(!settingOpen);
          }}
          className={`
  w-10
  h-10
  rounded-full
  border
  border-gray-200
  shadow-sm
  flex
  items-center
  justify-center
  transition
  cursor-default
  ${
  settingOpen
    ? "bg-gray-100"
    : "bg-white hover:bg-gray-50"
}
`}
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>

        {settingOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              absolute
              right-0
              top-12
              z-[999]
              w-40
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
  resetPopupPosition("menuAdd");
setMenuAddOpen(true);
  setMemoOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setEditIconOpen(false);
  setMenuManageMode("sort");
  setSettingOpen(false);
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
    hover:bg-gray-50
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 추가
</button>

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

    setMemoOpen(false);
    setMenuAddOpen(false);
    setSettingOpen(false);
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
    hover:bg-gray-50
    transition
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 변경
</button>

<button
  onClick={() => {
  setMainMenuManageMode("edit");
  setTempQuickMenuKeys(quickMenuKeys);
  setTempPersonalMenus(personalMenus);
  setMemoOpen(false);
  setMenuAddOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setEditIconOpen(false);
  setSettingOpen(false);
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
    border-t
    border-gray-100
    cursor-default
  "
>
  메뉴 수정
</button>

<button
  onClick={() => {
  setMainMenuManageMode("delete");
  setMemoOpen(false);
  setMenuAddOpen(false);
  setMenuSortOpen(false);
  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setSettingOpen(false);
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
  메뉴 삭제
</button>
          </div>
        )}
      </div>
    </div>
  </div>

          </div>
      </SiteHeader></div></>);
}
