"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { noticeVersion } from "@/app/notice/notices";
import { SALES_BOOK_VERSION } from "@/app/sales-book/data";

import { defaultMenus, personalMenuIcons, PersonalMenuItem, MenuItem } from "../data";
import type { HomeController } from "./useHomeController";
export function useHomeEffects(values: Pick<HomeController, "menus" | "setMenus" | "setHiddenMenuIds" | "setTempHiddenMenuIds" | "today" | "setToday" | "total" | "setTotal" | "setShowInstall" | "setDeferredPrompt" | "weatherRegion" | "setWeatherRegion" | "weatherOpen" | "setWeatherOpen" | "setWeather" | "userMenuOpen" | "setUserMenuOpen" | "setKakaoConnected" | "settingOpen" | "setSettingOpen" | "memoOpen" | "setMemoOpen" | "memoOpenRef" | "setTempMenus" | "setPersonalMenus" | "setSelectedMemo" | "bankRateMonth" | "setBankRates" | "setBankBaseDate" | "cmPinOpen" | "cmPinState" | "setQuickMenuKeys" | "setContextMenu" | "setHasUpdate" | "setHasSalesBookUpdate" | "setReadNoticeIds" | "setDbNotices" | "setDbCategories" | "setPopupNotice" | "setReadPressIds" | "authUser" | "authStatus" | "memos" | "resetPopupPosition" | "handleCmKeypad">) {
const { menus, setMenus, setHiddenMenuIds, setTempHiddenMenuIds, today, setToday, total, setTotal, setShowInstall, setDeferredPrompt, weatherRegion, setWeatherRegion, weatherOpen, setWeatherOpen, setWeather, userMenuOpen, setUserMenuOpen, setKakaoConnected, settingOpen, setSettingOpen, memoOpen, setMemoOpen, memoOpenRef, setTempMenus, setPersonalMenus, setSelectedMemo, bankRateMonth, setBankRates, setBankBaseDate, cmPinOpen, cmPinState, setQuickMenuKeys, setContextMenu, setHasUpdate, setHasSalesBookUpdate, setReadNoticeIds, setDbNotices, setDbCategories, setPopupNotice, setReadPressIds, authUser, authStatus, memos, resetPopupPosition, handleCmKeypad } = values;
useEffect(() => {
      const loadProfile = async (userId: string) => {

const { data: profile } = await supabase
  .from("profiles")
  .select("personal_menus, menu_order, quick_menu_keys, read_notice_ids, read_press_ids, hidden_menu_ids, kakao_connected")
  .eq("id", userId)
  .maybeSingle();

  setKakaoConnected(!!profile?.kakao_connected);

    if (profile?.personal_menus
 && Array.isArray(profile.personal_menus)) {
      const parsedPersonalMenus = profile.personal_menus as PersonalMenuItem[];
      setPersonalMenus(parsedPersonalMenus);

      const personalMenusWithIcon = parsedPersonalMenus.map((menu) => ({
        ...menu,
        icon: personalMenuIcons[menu.iconKey],
      }));

      const mergedMenus = [...defaultMenus, ...personalMenusWithIcon];

      if (profile?.menu_order && Array.isArray(profile.menu_order)) {
        const orderIds = profile.menu_order as string[];
        const orderedMenus = orderIds
          .map((id: string) => mergedMenus.find((menu) => menu.id === id))
          .filter(Boolean) as MenuItem[];
        const missingMenus = mergedMenus.filter((menu) => !orderIds.includes(menu.id));
        const nextMenus = [...orderedMenus, ...missingMenus];
        setMenus(nextMenus);
        setTempMenus(nextMenus);
      } else {
        setMenus(mergedMenus);
        setTempMenus(mergedMenus);
      }
    } else if (profile?.menu_order && Array.isArray(profile.menu_order)) {
      const orderIds = profile.menu_order as string[];
      const orderedMenus = orderIds
        .map((id: string) => defaultMenus.find((menu) => menu.id === id))
        .filter(Boolean) as MenuItem[];
      const missingMenus = defaultMenus.filter((menu) => !orderIds.includes(menu.id));
      const nextMenus = [...orderedMenus, ...missingMenus];
      setMenus(nextMenus);
      setTempMenus(nextMenus);
    }

    if (profile?.quick_menu_keys && Array.isArray(profile.quick_menu_keys)) {
      setQuickMenuKeys(profile.quick_menu_keys as string[]);
    }

    if (profile?.read_notice_ids && Array.isArray(profile.read_notice_ids)) {
      setReadNoticeIds(profile.read_notice_ids as number[]);
    }

           if (profile?.read_press_ids && Array.isArray(profile.read_press_ids)) {
      setReadPressIds(profile.read_press_ids as number[]);
    }

    if (authStatus === "approved") {
  if (profile?.hidden_menu_ids && Array.isArray(profile.hidden_menu_ids)) {
    setHiddenMenuIds(profile.hidden_menu_ids as string[]);
    setTempHiddenMenuIds(profile.hidden_menu_ids as string[]);
  }
} else {
  const savedHiddenMenus = localStorage.getItem("hiddenMenuIds");

  if (savedHiddenMenus) {
    const parsed = JSON.parse(savedHiddenMenus);

    setHiddenMenuIds(parsed);
    setTempHiddenMenuIds(parsed);
  }
}
  };

  if (authUser) {
    loadProfile(authUser.id);
  }
}, [authUser, authStatus]);

useEffect(() => {
  const fetchDbNotices = async () => {
    const { data: cats } = await supabase.from("notice_categories").select("*");
    if (cats) setDbCategories(cats);
    const { data: nts } = await supabase.from("notices_db").select("*").order("created_at", { ascending: false });
    console.log("notices_db 데이터:", nts);
    if (!nts) return;
    setDbNotices(nts);

    // 팝업 공지 처리
    const now = new Date();
    const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const seenIds: string[] = JSON.parse(localStorage.getItem("seen_popup_notice_ids") || "[]");
    const popupTarget = nts.find((n: any) => {
      if (!n.is_popup) return false;
      if (seenIds.includes(n.id)) return false;
      if (n.popup_start_date && n.popup_start_date > today) return false;
      if (n.popup_end_date && n.popup_end_date < today) return false;
      return true;
    });
    if (popupTarget) setPopupNotice(popupTarget);

    // 빨간점: 읽지 않은 DB 공지가 있으면
    const seenNoticeIds: string[] = JSON.parse(localStorage.getItem("seen_db_notice_ids") || "[]");
    const hasUnread = nts.some((n: any) => !seenNoticeIds.includes(n.id));
    if (hasUnread) setHasUpdate(true);
  };
  fetchDbNotices();
}, []);

useEffect(() => {
  const fetchBankRates = async () => {

    try {
      const res = await fetch(
        `/api/bank-rates?month=${bankRateMonth}`
      );

      const data = await res.json();

      setBankRates(data);

      if (data.length > 0) {
        const baseMonth = data[0].baseMonth;

        if (baseMonth?.length === 6) {
          setBankBaseDate(
            `${baseMonth.slice(0, 4)}.${baseMonth.slice(4, 6)}`
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  fetchBankRates();
}, [bankRateMonth]);

useEffect(() => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone;

  if (isStandalone) {
    setShowInstall(false);
  } else {
    setShowInstall(true);
  }

  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstall(true);
  };

  window.addEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );

  const fetchVisitor = async (hit = false) => {
    try {
    const res = await fetch(`/api/visitor${hit ? "?hit=1" : ""}`, {
      cache: "no-store",
    });

    const data = await res.json();

    setToday(data.today || 0);
    setTotal(data.total || 0);
  } catch (error) {
    console.log(error);
  }
};

    const todayKey = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Seoul",
});
const visited = localStorage.getItem("visitedDate");

if (visited !== todayKey) {
  fetchVisitor(true);
  localStorage.setItem("visitedDate", todayKey);
} else {
  fetchVisitor(false);
}

    const savedVersion = localStorage.getItem("noticeRead");

if (savedVersion != noticeVersion.toString()) {
  setHasUpdate(true);
}
const savedReadNoticeIds = localStorage.getItem("readNoticeIds");

if (savedReadNoticeIds) {
  setReadNoticeIds(JSON.parse(savedReadNoticeIds));
  const savedReadPressIds = localStorage.getItem("readPressIds");

if (savedReadPressIds) {
  setReadPressIds(JSON.parse(savedReadPressIds));
}
}
  return () => {
  window.removeEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );
};
}, []);

useEffect(() => {
  memoOpenRef.current = memoOpen;
}, [memoOpen]);

useEffect(() => {
  const viewedVersion = Number(
    localStorage.getItem("sales-book-viewed-version") || 0
  );

  setHasSalesBookUpdate(viewedVersion < SALES_BOOK_VERSION);
}, []);

useEffect(() => {
  const savedRegion =
    localStorage.getItem("weather-region") || "서울";

  setWeatherRegion(savedRegion);
}, []);

useEffect(() => {
  if (!weatherRegion) return;

  const fetchWeather = async () => {
    try {
      const res = await fetch(
        `/api/weather?region=${weatherRegion}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      console.log("날씨 지역:", weatherRegion);
      console.log("날씨 데이터", data);

      setWeather(data);
      localStorage.setItem("weather-region", weatherRegion);
    } catch (error) {
      console.log(error);
    }
  };

  fetchWeather();
}, [weatherRegion]);



useEffect(() => {
  const savedPersonalMenus = localStorage.getItem("personalMenus");
  const parsedPersonalMenus: PersonalMenuItem[] = savedPersonalMenus
    ? JSON.parse(savedPersonalMenus)
    : [];

    setPersonalMenus(parsedPersonalMenus);

  const personalMenusWithIcon = parsedPersonalMenus.map((menu) => ({
    ...menu,
    icon: personalMenuIcons[menu.iconKey],
  }));

  const mergedMenus = [...defaultMenus, ...personalMenusWithIcon];

  const savedOrder = localStorage.getItem("insurance-menu-order");

  if (!savedOrder) {
    setMenus(mergedMenus);
    setTempMenus(mergedMenus);
    return;
  }

  try {
    const orderIds = JSON.parse(savedOrder);

    const orderedMenus = orderIds
      .map((id: string) => mergedMenus.find((menu) => menu.id === id))
      .filter(Boolean);

    const missingMenus = mergedMenus.filter(
      (menu) => !orderIds.includes(menu.id)
    );

    const nextMenus = [...orderedMenus, ...missingMenus];

    setMenus(nextMenus);
    setTempMenus(nextMenus);
  } catch {
    setMenus(mergedMenus);
    setTempMenus(mergedMenus);
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(menus.map((menu) => menu.id))
  );
}, [menus]);

useEffect(() => {
  const handleClick = () => {
    setSettingOpen(false);
    setWeatherOpen(false);
    setUserMenuOpen(false);
  };

  if (settingOpen || weatherOpen || userMenuOpen) {
    window.addEventListener("click", handleClick);
  }

  return () => {
    window.removeEventListener("click", handleClick);
  };
}, [settingOpen, weatherOpen, userMenuOpen]);

useEffect(() => {
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  window.addEventListener("pointerdown", closeContextMenu);

  return () => {
    window.removeEventListener("pointerdown", closeContextMenu);
  };
}, []);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!cmPinOpen) return;
    if (cmPinState === "not-approved") return;
    if (e.key >= "0" && e.key <= "9") {
      handleCmKeypad(e.key);
    } else if (e.key === "Backspace") {
      handleCmKeypad("del");
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [cmPinOpen, cmPinState]);
}
