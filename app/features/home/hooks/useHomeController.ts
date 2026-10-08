"use client";
import { useEffect, useState } from "react";
import { useHomeEffects } from "./useHomeEffects";
import { useHomeState } from "./useHomeState";

import { getTodaySpecialDays } from "@/lib/specialDays";

import { supabase } from "@/lib/supabase";
import { lifeExpectancyData } from "@/app/pension-calculator/lifeExpectancyData";
import { useAuth } from "@/app/components/AuthProvider";
import emailjs from "@emailjs/browser";
import { notices } from "@/app/notice/notices";

import { PRESS } from "@/app/product-public/press";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MemoItem, defaultMenus, personalMenuIcons, PersonalMenuItem } from "../data";

export function useHomeController() {
const { fortuneOpen, setFortuneOpen, menus, setMenus, hiddenMenuIds, setHiddenMenuIds, tempHiddenMenuIds, setTempHiddenMenuIds, today, setToday, total, setTotal, showInstall, setShowInstall, deferredPrompt, setDeferredPrompt, weatherRegion, setWeatherRegion, weatherOpen, setWeatherOpen, weather, setWeather, open, setOpen, noticeOpen, setNoticeOpen, userMenuOpen, setUserMenuOpen, profileSettingOpen, setProfileSettingOpen, kakaoConnected, setKakaoConnected, kakaoConnecting, setKakaoConnecting, editNickname, setEditNickname, editInstagram, setEditInstagram, pinCheckPassword, setPinCheckPassword, pinCheckResult, setPinCheckResult, newPassword, setNewPassword, currentPassword, setCurrentPassword, newPasswordConfirm, setNewPasswordConfirm, passwordResultOpen, setPasswordResultOpen, passwordResultSuccess, setPasswordResultSuccess, passwordResultRef, passwordResultSuccessRef, quickOpen, setQuickOpen, pcQuickOpen, setPcQuickOpen, pcQuickDirection, setPcQuickDirection, pcQuickPos, setPcQuickPos, userBtnPos, setUserBtnPos, userBtnDragRef, pcQuickWrapRef, pcQuickDragRef, settingOpen, setSettingOpen, memoOpen, setMemoOpen, resourceOpen, setResourceOpen, memoOpenRef, menuSortOpen, setMenuSortOpen, tempMenus, setTempMenus, menuAddOpen, setMenuAddOpen, personalMenus, setPersonalMenus, tempPersonalMenus, setTempPersonalMenus, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, menuManageMode, setMenuManageMode, selectedPersonalMenuId, setSelectedPersonalMenuId, selectedDeleteMenuIds, setSelectedDeleteMenuIds, editingOriginalMenu, setEditingOriginalMenu, editIconOpen, setEditIconOpen, mainMenuManageMode, setMainMenuManageMode, popupPositions, setPopupPositions, popupZIndexes, setPopupZIndexes, popupZIndexRef, dragPopupRef, memoTitle, setMemoTitle, memoContent, setMemoContent, memoColor, setMemoColor, memoSearch, setMemoSearch, memoPage, setMemoPage, memoAddOpen, setMemoAddOpen, selectedMemo, setSelectedMemo, deleteMemoConfirmOpen, setDeleteMemoConfirmOpen, deleteMemoId, setDeleteMemoId, hospitalOpen, setHospitalOpen, diseaseOpen, setDiseaseOpen, pressOpen, setPressOpen, selectedPress, setSelectedPress, pressSearch, setPressSearch, pressPage, setPressPage, lifeOpen, setLifeOpen, npsTableOpen, setNpsTableOpen, bankRateOpen, setBankRateOpen, bankRateMonth, setBankRateMonth, bankRates, setBankRates, bankBaseDate, setBankBaseDate, cmPinOpen, setCmPinOpen, cmPinState, setCmPinState, cmPinStep, setCmPinStep, cmPinInput, setCmPinInput, cmPinConfirm, setCmPinConfirm, cmPinError, setCmPinError, cmPinInputRef, cmPinStepRef, quickMenuKeys, setQuickMenuKeys, tempQuickMenuKeys, setTempQuickMenuKeys, contextMenu, setContextMenu, deleteConfirmOpen, setDeleteConfirmOpen, quickLimitOpen, setQuickLimitOpen, quickMenuSelectOpen, setQuickMenuSelectOpen, quickDeleteConfirmOpen, setQuickDeleteConfirmOpen, quickDeleteKey, setQuickDeleteKey, saveConfirmOpen, setSaveConfirmOpen, saveConfirmType, setSaveConfirmType, saveConfirmMessage, setSaveConfirmMessage, menuLinkAlertOpen, setMenuLinkAlertOpen, lifeGender, setLifeGender, lifeAge, setLifeAge, noticePage, setNoticePage, selectedNotice, setSelectedNotice, noticeImageIndex, setNoticeImageIndex, popupNoticeImageIndex, setPopupNoticeImageIndex, fixMessage, setFixMessage, addMessage, setAddMessage, contact, setContact, hasUpdate, setHasUpdate, hasSalesBookUpdate, setHasSalesBookUpdate, readNoticeIds, setReadNoticeIds, dbNotices, setDbNotices, dbCategories, setDbCategories, popupNotice, setPopupNotice, popupNoticeClosed, setPopupNoticeClosed, readPressIds, setReadPressIds } = useHomeState();
const { authUser, authNickname, authInstagram, authStatus, authRole, authCreatedAt, authLoading, refreshAuth, memos, saveMemos } = useAuth();

const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

const WEATHER_REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "제주",
];

const specialDays = getTodaySpecialDays(new Date());

type PopupKey =
  | "message"
  | "notice"
  | "memo"
  | "memoDetail"
  | "menuAdd"
  | "menuSort"
  | "press"
  | "life"
  | "nps"
| "bankRate";

const bringPopupToFront = (key: PopupKey) => {
  popupZIndexRef.current += 1;

  setPopupZIndexes((prev) => ({
    ...prev,
    [key]: popupZIndexRef.current,
  }));
};

const startPopupDrag = (key: PopupKey, e: any) => {
  const target = e.target as HTMLElement;

  if (target.closest("button, input, textarea, select, a")) return;

  e.preventDefault();
  bringPopupToFront(key);

  const current = popupPositions[key] || { x: 0, y: 0 };

  dragPopupRef.current = {
    key,
    startX: e.clientX,
    startY: e.clientY,
    originX: current.x,
    originY: current.y,
  };

  const handleMove = (event: PointerEvent) => {
    if (!dragPopupRef.current) return;

    const drag = dragPopupRef.current;

    setPopupPositions((prev) => ({
      ...prev,
      [drag.key]: {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
    }));
  };

  const handleUp = () => {
    dragPopupRef.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
};

const getPopupStyle = (key: PopupKey) => {
  const pos = popupPositions[key] || { x: 0, y: 0 };

  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    zIndex: popupZIndexes[key] || 1500,
  };
};

const resetPopupPosition = (key: PopupKey) => {
  setPopupPositions((prev) => ({
    ...prev,
    [key]: { x: 0, y: 0 },
  }));
};

const noticesPerPage = 10;

const dbNoticesFormatted = dbNotices.map((n: any) => {

  const cat = dbCategories.find((c: any) => c.id === n.category_id);
  return {
    id: `db_${n.id}`,
    title: n.title,
    content: n.content,
    category: cat?.name || "",
    categoryColor: cat?.color || "blue",
    date: (() => {
      const d = new Date(n.created_at);
      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    })(),
    isDb: true,
    dbId: n.id,
    image_url: n.image_url || null,
    image_urls: n.image_urls || [],
    is_pinned: n.is_pinned || false,
  };
});

const allNotices = [
  ...dbNoticesFormatted.filter((n: any) => n.is_pinned),
  ...dbNoticesFormatted.filter((n: any) => !n.is_pinned),
  ...notices
];

const totalNoticePages = Math.ceil(allNotices.length / noticesPerPage);

const pagedNotices = allNotices.slice(
  (noticePage - 1) * noticesPerPage,
  noticePage * noticesPerPage
);

const lifeAgeNumber = lifeAge === "" ? null : Number(lifeAge);

const selectedLife =
  lifeAgeNumber === null
    ? null
    : lifeExpectancyData[
        lifeGender as keyof typeof lifeExpectancyData
      ]?.[
        lifeAgeNumber as keyof (typeof lifeExpectancyData)["남성"]
      ];

const expectYears = selectedLife?.expect || 0;

const averageSickYears =
  lifeGender === "남성"
    ? 16.2
    : 20.2;

const sickYears = Math.min(
  averageSickYears,
  expectYears
);

const healthyYears = Math.max(
  expectYears - sickYears,
  0
);

const expectAge =
  Number(lifeAge || 0) + expectYears;

const sickStartAge =
  Number(lifeAge || 0) + healthyYears;


const quickMenuOptions = [
  {
    key: "hospital",
    title: "병원정보 검색",
    action: () => {
      setHospitalOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "life",
    title: "기대수명 계산기",
    action: () => {
      resetPopupPosition("life");
setLifeOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "press",
    title: "보도자료",
    action: () => {
      resetPopupPosition("press");
setPressOpen(true);
      setSelectedPress(null);
      setPressSearch("");
      setPressPage(1);
      setQuickOpen(false);
    },
  },
  {
    key: "disease",
    title: "상병코드 검색",
    action: () => {
      setDiseaseOpen(true);
      setQuickOpen(false);
    },
  },
  {
    key: "nps",
    title: "국민연금표",
    action: () => {
      resetPopupPosition("nps");
setNpsTableOpen(true);
      setQuickOpen(false);
    },
  },
      {
    key: "bankRate",
    title: "예금 금리 비교",
    action: () => {
      resetPopupPosition("bankRate");
      setBankRateOpen(true);
      setQuickOpen(false);
      setPcQuickOpen(false);
    },
  },
  // 로그인 없이 사용하는 도구
  { key: "currencyConverter",
    title: "환율 변환기",
    action: () => {
      window.dispatchEvent(new CustomEvent("open-currency-converter"));
      setQuickOpen(false);
      setPcQuickOpen(false);
    },
  },
  { key: "calculator",
  title: "계산기",
  action: () => {
    window.dispatchEvent(new CustomEvent("open-calculator"));
    setQuickOpen(false);
    setPcQuickOpen(false);
  },
},

];

// Discard removed or duplicate tools from previously saved selections.
const quickMenuOptionKeys = quickMenuOptions.map((item) => item.key).join(",");
useEffect(() => {
  const allowedKeys = new Set(quickMenuOptionKeys.split(","));
  const clean = (keys: string[]) => [...new Set(keys)].filter((key) => allowedKeys.has(key)).slice(0, 4);
  setQuickMenuKeys((previous) => {
    const next = clean(previous);
    return next.length === previous.length && next.every((key, index) => key === previous[index]) ? previous : next;
  });
  setTempQuickMenuKeys((previous) => {
    const next = clean(previous);
    return next.length === previous.length && next.every((key, index) => key === previous[index]) ? previous : next;
  });
}, [quickMenuOptionKeys, quickMenuKeys, tempQuickMenuKeys, setQuickMenuKeys, setTempQuickMenuKeys]);

const sortedPress = [...PRESS.items].sort(
  (a, b) =>
    new Date(b.date.replace(/\./g, "-")).getTime() -
    new Date(a.date.replace(/\./g, "-")).getTime()
);

const filteredPress = sortedPress.filter((item) =>
  `${item.title} ${item.date} ${item.source} `
    .toLowerCase()
    .includes(pressSearch.toLowerCase())
);

const PRESS_PER_PAGE = 10;

const totalPressPages = Math.ceil(filteredPress.length / PRESS_PER_PAGE);

const paginatedPress = filteredPress.slice(
  (pressPage - 1) * PRESS_PER_PAGE,
  pressPage * PRESS_PER_PAGE
);

const MEMOS_PER_PAGE = 6;

const sortedMemos = [...memos].sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

  return (
    new Date(b.updatedAt).getTime() -
    new Date(a.updatedAt).getTime()
  );
});

const filteredMemos = sortedMemos.filter((memo) =>
  `${memo.title} ${memo.content}`
    .toLowerCase()
    .includes(memoSearch.toLowerCase())
);

const totalMemoPages = Math.max(
  1,
  Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);

const visibleMemos = sortedMemos.filter((memo) => memo.visible);

const getMemoColorClass = (color?: MemoItem["color"]) => {
  switch (color) {
    case "blue":
      return "bg-blue-50/80 border-blue-100";
    case "yellow":
      return "bg-yellow-50/80 border-yellow-100";
    case "red":
      return "bg-red-50/80 border-red-100";
    case "clear":
  return "bg-white/40 border-gray-200";
    case "white":
    default:
      return "bg-white border-gray-200";
  }
};

const memoColorOptions: {
  value: MemoItem["color"];
  className: string;
}[] = [
  {
    value: "white",
    className: "bg-white border-gray-300 hover:bg-gray-50",
  },
  {
    value: "blue",
    className: "bg-blue-50 border-blue-100 hover:bg-blue-100",
  },
  {
    value: "yellow",
    className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
  },
  {
    value: "red",
    className: "bg-red-50 border-red-100 hover:bg-red-100",
  },
  {
  value: "clear",
  className:
    "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
},
];

const handleMenuSortDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setTempMenus((items) => {
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    return arrayMove(items, oldIndex, newIndex);
  });
};

const getCommittedTempPersonalMenus = () => {
  if (!selectedPersonalMenuId) return tempPersonalMenus;

  return tempPersonalMenus.map((menu) =>
    menu.id === selectedPersonalMenuId
      ? {
          ...menu,
          title: newMenuTitle.trim() || menu.title,
          desc: newMenuDesc.trim() || "개인 추가 메뉴",
          link: newMenuLink.trim() || menu.link,
          iconKey: newMenuIcon,
        }
      : menu
  );
};

const commitEditingMenuToTemp = () => {
  const nextTempPersonalMenus = getCommittedTempPersonalMenus();
  setTempPersonalMenus(nextTempPersonalMenus);
  return nextTempPersonalMenus;
};

const closeEditingMenu = () => {
  setSelectedPersonalMenuId("");
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setEditIconOpen(false);
};

const startEditPersonalMenu = (menu: PersonalMenuItem) => {
  commitEditingMenuToTemp();

  setEditingOriginalMenu(menu);

  setSelectedPersonalMenuId(menu.id);
  setNewMenuTitle(menu.title);
  setNewMenuDesc(menu.desc);
  setNewMenuLink(menu.link);
  setNewMenuIcon(menu.iconKey);
  setEditIconOpen(false);
};

const saveEditingMenuAndClose = () => {
  commitEditingMenuToTemp();
  setEditingOriginalMenu(null);
  closeEditingMenu();
};

const cancelEditingMenu = () => {
  setTempMenus(menus);
setTempPersonalMenus(personalMenus);
setTempQuickMenuKeys(quickMenuKeys);

  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);

  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
};

const savePersonalMenuEdits = () => {
  const nextPersonalMenus = commitEditingMenuToTemp();

  savePersonalMenus(nextPersonalMenus);

  const nextMenus = menus.map((menu) => {
    const editedMenu = nextPersonalMenus.find((item) => item.id === menu.id);

    if (!editedMenu) return menu;

    return {
      ...menu,
      title: editedMenu.title,
      desc: editedMenu.desc,
      link: editedMenu.link,
      iconKey: editedMenu.iconKey,
      icon: personalMenuIcons[editedMenu.iconKey],
      isPersonal: true,
    };
  });

  setMenus(nextMenus);
  setTempMenus(nextMenus);

  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(nextMenus.map((menu) => menu.id))
  );

  setEditingOriginalMenu(null);
  closeEditingMenu();
};

const hasMenuManageChanges = () => {
  const committedPersonalMenus = getCommittedTempPersonalMenus();

  const normalizePersonalMenus = (list: PersonalMenuItem[]) =>
    list.map((menu) => ({
      id: menu.id,
      title: menu.title,
      desc: menu.desc,
      link: menu.link,
      iconKey: menu.iconKey,
    }));

  return (
    JSON.stringify(normalizePersonalMenus(committedPersonalMenus)) !==
      JSON.stringify(normalizePersonalMenus(personalMenus)) ||
    JSON.stringify(tempQuickMenuKeys) !== JSON.stringify(quickMenuKeys) ||
    JSON.stringify(tempMenus.map((menu) => menu.id)) !==
      JSON.stringify(menus.map((menu) => menu.id))
  );
};

const saveMenuManageChanges = (type: "main" | "popup") => {
  const nextPersonalMenus = commitEditingMenuToTemp();

  savePersonalMenus(nextPersonalMenus);

  const personalMenusWithIcon = nextPersonalMenus.map((menu) => ({
    ...menu,
    icon: personalMenuIcons[menu.iconKey],
  }));

  const defaultMenuIds = defaultMenus.map((menu) => menu.id);

  const nextMenus =
    type === "popup"
      ? tempMenus
          .filter((menu) => defaultMenuIds.includes(menu.id) || menu.isPersonal)
          .map((menu) => {
            const editedPersonalMenu = personalMenusWithIcon.find(
              (item) => item.id === menu.id
            );

            return editedPersonalMenu || menu;
          })
      : menus
          .filter((menu) => defaultMenuIds.includes(menu.id) || menu.isPersonal)
          .map((menu) => {
            const editedPersonalMenu = personalMenusWithIcon.find(
              (item) => item.id === menu.id
            );

            return editedPersonalMenu || menu;
          });

  const missingPersonalMenus = personalMenusWithIcon.filter(
    (personalMenu) => !nextMenus.some((menu) => menu.id === personalMenu.id)
  );

  const finalMenus = [...nextMenus, ...missingPersonalMenus];

  setMenus(finalMenus);
setTempMenus(finalMenus);
setPersonalMenus(nextPersonalMenus);
setTempPersonalMenus(nextPersonalMenus);
setQuickMenuKeys(tempQuickMenuKeys);
setHiddenMenuIds(tempHiddenMenuIds);

   if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: finalMenus.map((menu) => menu.id),
      quick_menu_keys: tempQuickMenuKeys,
      hidden_menu_ids: tempHiddenMenuIds,
    }).eq("id", authUser.id).then();

 } else {
  localStorage.setItem(
    "insurance-menu-order",
    JSON.stringify(finalMenus.map((menu) => menu.id))
  );

  localStorage.setItem(
    "quickMenuKeys",
    JSON.stringify(tempQuickMenuKeys)
  );

  localStorage.setItem(
    "hiddenMenuIds",
    JSON.stringify(tempHiddenMenuIds)
  );
}

  setEditingOriginalMenu(null);
  closeEditingMenu();

  setSaveConfirmType(type);
  setSaveConfirmOpen(true);
};

const goBackMainScreen = () => {
  setMainMenuManageMode("normal");
  setTempQuickMenuKeys(quickMenuKeys);
  setSelectedPersonalMenuId("");
  setSelectedDeleteMenuIds([]);
  setEditingOriginalMenu(null);
  setEditIconOpen(false);
};

const deletePersonalMenu = () => {
  if (selectedDeleteMenuIds.length === 0) {
    alert("삭제할 메뉴를 선택해주세요.");
    return;
  }

  

  const nextPersonalMenus = personalMenus.filter(
    (menu) => !selectedDeleteMenuIds.includes(menu.id)
  );

  const nextMenus = menus.filter(
    (menu) => !selectedDeleteMenuIds.includes(menu.id)
  );

  savePersonalMenus(nextPersonalMenus);
  setMenus(nextMenus);
  setTempMenus(nextMenus);

    if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: nextMenus.map((menu) => menu.id),
    }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("insurance-menu-order", JSON.stringify(nextMenus.map((menu) => menu.id)));
  }

  setSelectedDeleteMenuIds([]);
  setDeleteConfirmOpen(false);

  setSelectedPersonalMenuId("");
setEditIconOpen(false);
};

const savePersonalMenus = (nextMenus: PersonalMenuItem[]) => {
  setPersonalMenus(nextMenus);
  if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({ personal_menus: nextMenus }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("personalMenus", JSON.stringify(nextMenus));
  }
};

const resetNewMenuForm = () => {
  setNewMenuTitle("");
  setNewMenuDesc("");
  setNewMenuLink("");
  setNewMenuIcon("globe");
  setMenuAddOpen(false);
};

const addPersonalMenu = () => {
  if (!newMenuLink.trim()) {
    setMenuLinkAlertOpen(true);
    return;
  }

  const newMenu: PersonalMenuItem = {
    id: `personal-${crypto.randomUUID()}`,
    title: newMenuTitle.trim() || "",
    desc: newMenuDesc.trim() || "",
    link: newMenuLink.trim(),
    iconKey: newMenuIcon,
    isPersonal: true,
  };

  const newMenuWithIcon = {
    ...newMenu,
    icon: personalMenuIcons[newMenu.iconKey],
  };

  const isTemporaryAdd =
    mainMenuManageMode === "edit" || menuSortOpen;

 if (isTemporaryAdd) {
  setTempPersonalMenus((prev) => [...prev, newMenu]);
  setTempMenus((prev) => [...prev, newMenuWithIcon]);

  resetNewMenuForm();

  return;
}

  const nextPersonalMenus = [...personalMenus, newMenu];

  savePersonalMenus(nextPersonalMenus);

  const nextMenus = [...menus, newMenuWithIcon];

  setMenus(nextMenus);
  setTempMenus(nextMenus);

    if (authUser && authStatus === "approved") {
    supabase.from("profiles").update({
      menu_order: nextMenus.map((menu) => menu.id),
    }).eq("id", authUser.id).then();
  } else {
    localStorage.setItem("insurance-menu-order", JSON.stringify(nextMenus.map((menu) => menu.id)));
  }

  resetNewMenuForm();

  setSaveConfirmType("popup");
  setSaveConfirmMessage("메뉴가 추가되었습니다.");
  setSaveConfirmOpen(true);
};

const addMemo = async () => {
  const now = new Date().toISOString();
  const newMemo: MemoItem = {
    id: crypto.randomUUID(),
    title: memoTitle.trim() || "",
    content: memoContent.trim(),
    pinned: false,
    visible: false,
    color: memoColor,
    createdAt: now,
    updatedAt: now,
  };
  saveMemos([newMemo, ...memos]);
  setMemoTitle("");
  setMemoContent("");
  setMemoColor("white");
  setMemoPage(1);
};

const updateMemo = async (id: string, field: "title" | "content", value: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, [field]: value, updatedAt: new Date().toISOString() } : memo
  );
  saveMemos(nextMemos);
};

const toggleMemoVisible = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, visible: !memo.visible } : memo
  );
  saveMemos(nextMemos);
};

const toggleMemoPinned = (id: string) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? { ...memo, pinned: !memo.pinned, updatedAt: new Date().toISOString() }
      : memo
  );
  saveMemos(nextMemos);
};

const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);
  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;
  const unpinnedMemos = sortedMemos.filter((memo) => !memo.pinned);
  const pinnedMemos = sortedMemos.filter((memo) => memo.pinned);
  const oldIndex = unpinnedMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = unpinnedMemos.findIndex((memo) => memo.id === over.id);
  const reordered = arrayMove(unpinnedMemos, oldIndex, newIndex);
  const reorderedWithTime = reordered.map((memo, index) => ({
    ...memo,
    updatedAt: new Date(Date.now() - index).toISOString(),
  }));
  saveMemos([...pinnedMemos, ...reorderedWithTime]);
};

const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id ? { ...memo, color, updatedAt: new Date().toISOString() } : memo
  );
  saveMemos(nextMemos);
};

const deleteMemo = (id: string) => {
  setDeleteMemoId(id);
  setDeleteMemoConfirmOpen(true);
};

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;

  const nextMemos = memos.filter((memo) => memo.id !== deleteMemoId);
  saveMemos(nextMemos);

  if (memoPage > 1 && pagedMemos.length === 1) {
    setMemoPage((p) => Math.max(1, p - 1));
  }

  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};

async function hashPinLocal(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "insurance-namu-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const openCmPinPopup = async () => {
  if (!authUser || authStatus !== "approved") {
    setCmPinState("not-approved");
    setCmPinOpen(true);
    return;
  }
  const { data } = await supabase
    .from("customer_settings")
    .select("pin_hash")
    .eq("user_id", authUser.id)
    .maybeSingle();
  cmPinInputRef.current = "";
  cmPinStepRef.current = "enter";
  setCmPinInput("");
  setCmPinConfirm("");
  setCmPinError("");
  setCmPinStep("enter");
  if (!data?.pin_hash) {
    setCmPinState("no-pin");
  } else {
    setCmPinState("locked");
  }
  setCmPinOpen(true);
};

const handleCmKeypad = async (val: string) => {
  if (cmPinState === "not-approved") return;
  if (cmPinState === "no-pin") {
    if (cmPinStepRef.current === "enter") {
      if (val === "del") {
        const next = cmPinInputRef.current.slice(0, -1);
        cmPinInputRef.current = next;
        setCmPinInput(next);
      } else if (cmPinInputRef.current.length < 4) {
        const next = cmPinInputRef.current + val;
        cmPinInputRef.current = next;
        setCmPinInput(next);
        if (next.length === 4) {
          setTimeout(() => {
            cmPinStepRef.current = "confirm";
            setCmPinStep("confirm");
            setCmPinConfirm("");
            setCmPinError("");
          }, 200);
        }
      }
    } else {
      if (val === "del") {
        setCmPinConfirm((p) => p.slice(0, -1));
      } else {
        setCmPinConfirm((prev) => {
          if (prev.length >= 4) return prev;
          const next = prev + val;
          if (next.length === 4) {
            setTimeout(async () => {
              if (cmPinInputRef.current !== next) {
                setCmPinError("PIN이 일치하지 않습니다. 다시 시도해주세요.");
                cmPinInputRef.current = "";
                cmPinStepRef.current = "enter";
                setCmPinStep("enter");
                setCmPinInput("");
                setCmPinConfirm("");
                return;
              }
              const hash = await hashPinLocal(cmPinInputRef.current);
              const { error } = await supabase.from("customer_settings").upsert(
                { user_id: authUser!.id, pin_hash: hash, pin_changed_at: new Date().toISOString() },
                { onConflict: "user_id" }
              );
              if (error) {
                setCmPinError("저장 오류: " + error.message);
                cmPinInputRef.current = "";
                cmPinStepRef.current = "enter";
                setCmPinStep("enter");
                setCmPinInput("");
                setCmPinConfirm("");
                return;
              }
              setCmPinOpen(false);
              window.location.href = "/my-page";
            }, 200);
          }
          return next;
        });
      }
    }
  } else {
    if (val === "del") {
      const next = cmPinInputRef.current.slice(0, -1);
      cmPinInputRef.current = next;
      setCmPinInput(next);
    } else if (cmPinInputRef.current.length < 4) {
      const next = cmPinInputRef.current + val;
      cmPinInputRef.current = next;
      setCmPinInput(next);
      if (next.length === 4) {
        setTimeout(async () => {
          const hash = await hashPinLocal(next);
          const { data } = await supabase
            .from("customer_settings")
            .select("pin_hash")
            .eq("user_id", authUser!.id)
            .maybeSingle();
          if (hash !== data?.pin_hash) {
            setCmPinError("PIN이 올바르지 않습니다.");
            cmPinInputRef.current = "";
            setCmPinInput("");
            return;
          }
          setCmPinOpen(false);
          window.location.href = "/my-page";
        }, 200);
      }
    }
  }
};

const [pcQuickDocked, setPcQuickDocked] = useState<"left" | "right" | null>("right");

useEffect(() => {
  try {
    const raw=localStorage.getItem("pcQuickPosition");
    if(!raw) {
      const bottom = pcQuickWrapRef.current ? parseFloat(getComputedStyle(pcQuickWrapRef.current).bottom) || 0 : 100;
      setPcQuickPos({ x: 0, y: bottom - window.innerHeight / 2 + 18 });
      return;
    }
    const saved=JSON.parse(raw);
    if(!Number.isFinite(saved.x)||!Number.isFinite(saved.y)) return;
    const dock=saved.docked === "left" || saved.docked === "right" ? saved.docked : null;
    setPcQuickDocked(dock);
    setPcQuickPos({x:dock === "left" ? -window.innerWidth+248 : dock === "right" ? 0 : Math.min(0,Math.max(-window.innerWidth+248,saved.x)),y:Math.min(pcQuickWrapRef.current ? parseFloat(getComputedStyle(pcQuickWrapRef.current).bottom)||0 : 100,Math.max(-window.innerHeight+(dock?36:52)+(pcQuickWrapRef.current ? parseFloat(getComputedStyle(pcQuickWrapRef.current).bottom)||0 : 100),saved.y))});
  } catch { /* Use the default edge position when local storage is unavailable. */ }
}, [setPcQuickPos]);

const openPcQuickMenu = () => {
  const wrap = pcQuickWrapRef.current;
  if (!wrap) {
    setPcQuickOpen((prev) => !prev);
    return;
  }

  const rect = wrap.getBoundingClientRect();
  const menuHeight = pcQuickDocked ? 7 * 36 + 2 : 6 * 48 + 44 + 2;

  const spaceBottom = window.innerHeight - rect.bottom;

  setPcQuickDirection(spaceBottom >= menuHeight + (pcQuickDocked ? 0 : 8) ? "down" : "up");

  setPcQuickOpen((prev) => !prev);
};

const startPcQuickDrag = (e: React.PointerEvent) => {
  if (e.button !== 0 || (e.target as HTMLElement).closest("[data-pc-quick-menu]")) return;
  e.preventDefault();
  const trigger=(e.target as HTMLElement).closest<HTMLButtonElement>("button") ?? e.currentTarget;
  trigger.setPointerCapture(e.pointerId);
  pcQuickDragRef.current = {startX:e.clientX,startY:e.clientY,originX:pcQuickPos.x,originY:pcQuickPos.y,moved:false};
  const bottom = pcQuickWrapRef.current ? parseFloat(getComputedStyle(pcQuickWrapRef.current).bottom)||0 : 100;
  let position = {...pcQuickPos};
  const startedDocked = pcQuickDocked;
  let remainsDocked = pcQuickDocked;
  const handleMove = (event: PointerEvent) => {
    const drag = pcQuickDragRef.current;
    if (!drag) return;
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if (!drag.moved && Math.abs(dx)<=5 && Math.abs(dy)<=5) return;
    drag.moved=true;
    setPcQuickOpen(false);
    remainsDocked=startedDocked === "right" && dx>=-18 ? "right" : startedDocked === "left" && dx<=18 ? "left" : null;
    setPcQuickDocked(remainsDocked);
    position={x:remainsDocked === "right" ? 0 : remainsDocked === "left" ? -window.innerWidth+248 :Math.min(0,Math.max(-window.innerWidth+248,drag.originX+dx)),y:Math.min(bottom,Math.max(-window.innerHeight+bottom+(remainsDocked?36:52),drag.originY+dy))};
    setPcQuickPos(position);
  };
  const handleUp = () => {
    window.removeEventListener("pointermove",handleMove);
    window.removeEventListener("pointerup",handleUp);
    window.removeEventListener("pointercancel",handleUp);
    if (!pcQuickDragRef.current?.moved) return;
    const dock=remainsDocked || (position.x>=-16 ? "right" : position.x<=-window.innerWidth+264 ? "left" : null);
    setPcQuickDocked(dock);
    if(dock) position={...position,x:dock === "right" ? 0 : -window.innerWidth+248};
    setPcQuickPos(position);
    try { localStorage.setItem("pcQuickPosition",JSON.stringify({...position,docked:dock})); } catch { /* Dragging still works without local storage. */ }
  };
  window.addEventListener("pointermove",handleMove);
  window.addEventListener("pointerup",handleUp,{once:true});
  window.addEventListener("pointercancel",handleUp,{once:true});
};

const startUserBtnDrag = (e: React.PointerEvent) => {
  userBtnDragRef.current = {
    startX: e.clientX,
    startY: e.clientY,
    originX: userBtnPos.x,
    originY: userBtnPos.y,
    moved: false,
  };

  const handleMove = (event: PointerEvent) => {
    if (!userBtnDragRef.current) return;

    const dx = event.clientX - userBtnDragRef.current.startX;
    const dy = event.clientY - userBtnDragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      userBtnDragRef.current.moved = true;
    }

    const nextX = userBtnDragRef.current.originX + dx;
    const nextY = userBtnDragRef.current.originY + dy;

const limitedX = Math.min(Math.max(nextX, -24), window.innerWidth - 80);
const limitedY = Math.min(Math.max(nextY, -window.innerHeight + 150), 100);

    setUserBtnPos({ x: limitedX, y: limitedY });
  };

  const handleUp = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
};

const handleCheckPin = async () => {
  if (!authUser || !pinCheckPassword) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: pinCheckPassword,
  });
  if (error) {
    setPinCheckResult("비밀번호가 올바르지 않습니다.");
    return;
  }
  const { data } = await supabase
  .from("customer_settings")
  .select("pin_plain")
  .eq("user_id", authUser.id)
  .maybeSingle();
if (!data?.pin_plain) {
  setPinCheckResult("설정된 PIN이 없습니다.");
  return;
}
setPinCheckResult(`비밀번호: ${data.pin_plain}`);

};

const saveProfileSettings = async () => {
  if (!authUser?.email) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (!editNickname.trim()) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  if (!editInstagram.trim()) {
    alert("인스타그램 아이디를 입력해주세요.");
    return;
  }

  if (newPassword || newPasswordConfirm || currentPassword) {
    if (!currentPassword.trim()) {
      alert("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (!newPassword.trim()) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 6) {
      alert("새 비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    const { error: checkPasswordError } =
      await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });

    if (checkPasswordError) {
      alert("현재 비밀번호가 일치하지 않습니다.");
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

        if (passwordError) {
      setPasswordResultSuccess(false);
      setPasswordResultOpen(true);
      return;
    }

  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      nickname: editNickname.trim(),
      instagram_id: editInstagram.trim(),
    })
    .eq("id", authUser.id);

    if (profileError) {
    setPasswordResultSuccess(false);
    setPasswordResultOpen(true);
    return;
  }

      refreshAuth();
  setCurrentPassword("");

  setNewPassword("");
  setNewPasswordConfirm("");
      setProfileSettingOpen(false);
  
    passwordResultSuccessRef.current = true;
  passwordResultRef.current = true;
  setPasswordResultSuccess(true);
  setPasswordResultOpen(true);

};

const handleKakaoConnect = async () => {
  setKakaoConnecting(true);

  const { error } = await supabase.auth.linkIdentity({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    setKakaoConnecting(false);
    alert(error.message);
    return;
  }

  await supabase
    .from("profiles")
    .update({ kakao_connected: true })
    .eq("id", authUser.id);

  setKakaoConnected(true);
  setKakaoConnecting(false);
};

const handleKakaoDisconnect = async () => {
  if (!authUser?.id) return;

  const ok = confirm("카카오 연결을 해제하시겠습니까?");
  if (!ok) return;

  const { data, error } = await supabase.auth.getUserIdentities();

  if (error) {
    alert(error.message);
    return;
  }

  const kakaoIdentity = data.identities.find(
    (identity: any) => identity.provider === "kakao"
  );

  if (!kakaoIdentity) {
    alert("카카오 연결 정보를 찾을 수 없습니다.");
    return;
  }

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(kakaoIdentity);

  if (unlinkError) {
    alert(unlinkError.message);
    return;
  }

  await supabase
    .from("profiles")
    .update({ kakao_connected: false })
    .eq("id", authUser.id);

  setKakaoConnected(false);
  alert("카카오 연결이 해제되었습니다.");
};

const sendMessage = async () => {
  if (!fixMessage.trim() && !addMessage.trim()) {
    alert("수정할 내용 또는 추가하고 싶은 내용을 입력해주세요.");
    return;
  }

  try {
    await emailjs.send(
      "service_qowldus",
      "template_7hs4byh",
      {
        fixMessage,
        addMessage,
        contact,
      },
      "1aQRC4TK_8wwBgPgw"
    );

    alert("메세지가 전송되었습니다.");

    setFixMessage("");
    setAddMessage("");
    setContact("");
    setOpen(false);

  } catch (error) {
  console.log(error);

  alert("메세지 전송에 실패했습니다.");
}
};
useHomeEffects({ menus, setMenus, setHiddenMenuIds, setTempHiddenMenuIds, today, setToday, total, setTotal, setShowInstall, setDeferredPrompt, weatherRegion, setWeatherRegion, weatherOpen, setWeatherOpen, setWeather, userMenuOpen, setUserMenuOpen, setKakaoConnected, settingOpen, setSettingOpen, memoOpen, setMemoOpen, memoOpenRef, setTempMenus, setPersonalMenus, setSelectedMemo, bankRateMonth, setBankRates, setBankBaseDate, cmPinOpen, cmPinState, setQuickMenuKeys, setContextMenu, setHasUpdate, setHasSalesBookUpdate, setReadNoticeIds, setDbNotices, setDbCategories, setPopupNotice, setReadPressIds, authUser, authStatus, memos, resetPopupPosition, handleCmKeypad });
return { authUser,
authNickname,
authInstagram,
authStatus,
authRole,
authCreatedAt,
authLoading,
refreshAuth,
memos,
saveMemos,
fortuneOpen,
setFortuneOpen,
menus,
hiddenMenuIds,
tempHiddenMenuIds,
setTempHiddenMenuIds,
sensors,
today,
total,
showInstall,
setShowInstall,
deferredPrompt,
setDeferredPrompt,
WEATHER_REGIONS,
setWeatherRegion,
weatherOpen,
setWeatherOpen,
weather,
specialDays,
open,
setOpen,
noticeOpen,
setNoticeOpen,
userMenuOpen,
setUserMenuOpen,
profileSettingOpen,
setProfileSettingOpen,
kakaoConnected,
kakaoConnecting,
editNickname,
setEditNickname,
editInstagram,
setEditInstagram,
pinCheckPassword,
setPinCheckPassword,
pinCheckResult,
newPassword,
setNewPassword,
currentPassword,
setCurrentPassword,
newPasswordConfirm,
setNewPasswordConfirm,
passwordResultOpen,
setPasswordResultOpen,
passwordResultSuccess,
setPasswordResultSuccess,
passwordResultRef,
passwordResultSuccessRef,
quickOpen,
setQuickOpen,
pcQuickOpen,
setPcQuickOpen,
pcQuickDirection,
pcQuickDocked,
pcQuickPos,
userBtnPos,
userBtnDragRef,
pcQuickWrapRef,
pcQuickDragRef,
settingOpen,
setSettingOpen,
memoOpen,
setMemoOpen,
resourceOpen,
setResourceOpen,
menuSortOpen,
setMenuSortOpen,
tempMenus,
setTempMenus,
menuAddOpen,
setMenuAddOpen,
personalMenus,
tempPersonalMenus,
setTempPersonalMenus,
newMenuTitle,
setNewMenuTitle,
newMenuDesc,
setNewMenuDesc,
newMenuLink,
setNewMenuLink,
newMenuIcon,
setNewMenuIcon,
menuManageMode,
setMenuManageMode,
selectedPersonalMenuId,
setSelectedPersonalMenuId,
selectedDeleteMenuIds,
setSelectedDeleteMenuIds,
setEditingOriginalMenu,
editIconOpen,
setEditIconOpen,
mainMenuManageMode,
setMainMenuManageMode,
startPopupDrag,
getPopupStyle,
resetPopupPosition,
memoTitle,
setMemoTitle,
memoContent,
setMemoContent,
memoColor,
setMemoColor,
memoSearch,
setMemoSearch,
memoPage,
setMemoPage,
memoAddOpen,
setMemoAddOpen,
selectedMemo,
setSelectedMemo,
deleteMemoConfirmOpen,
setDeleteMemoConfirmOpen,
setDeleteMemoId,
hospitalOpen,
setHospitalOpen,
diseaseOpen,
setDiseaseOpen,
pressOpen,
setPressOpen,
selectedPress,
setSelectedPress,
pressSearch,
setPressSearch,
pressPage,
setPressPage,
lifeOpen,
setLifeOpen,
npsTableOpen,
setNpsTableOpen,
bankRateOpen,
setBankRateOpen,
bankRateMonth,
setBankRateMonth,
bankRates,
bankBaseDate,
cmPinOpen,
setCmPinOpen,
cmPinState,
setCmPinState,
cmPinStep,
cmPinInput,
cmPinConfirm,
cmPinError,
quickMenuKeys,
setQuickMenuKeys,
tempQuickMenuKeys,
setTempQuickMenuKeys,
contextMenu,
setContextMenu,
deleteConfirmOpen,
setDeleteConfirmOpen,
quickLimitOpen,
setQuickLimitOpen,
quickMenuSelectOpen,
setQuickMenuSelectOpen,
quickDeleteConfirmOpen,
setQuickDeleteConfirmOpen,
quickDeleteKey,
setQuickDeleteKey,
saveConfirmOpen,
setSaveConfirmOpen,
saveConfirmType,
setSaveConfirmType,
saveConfirmMessage,
menuLinkAlertOpen,
setMenuLinkAlertOpen,
lifeGender,
setLifeGender,
lifeAge,
setLifeAge,
noticePage,
setNoticePage,
selectedNotice,
setSelectedNotice,
noticeImageIndex,
setNoticeImageIndex,
popupNoticeImageIndex,
setPopupNoticeImageIndex,
fixMessage,
setFixMessage,
addMessage,
setAddMessage,
contact,
setContact,
hasUpdate,
setHasUpdate,
hasSalesBookUpdate,
setHasSalesBookUpdate,
readNoticeIds,
setReadNoticeIds,
dbNotices,
dbCategories,
popupNotice,
popupNoticeClosed,
setPopupNoticeClosed,
allNotices,
totalNoticePages,
pagedNotices,
selectedLife,
expectYears,
sickYears,
healthyYears,
expectAge,
sickStartAge,
readPressIds,
setReadPressIds,
quickMenuOptions,
filteredPress,
PRESS_PER_PAGE,
totalPressPages,
paginatedPress,
totalMemoPages,
pagedMemos,
getMemoColorClass,
memoColorOptions,
handleMenuSortDragEnd,
startEditPersonalMenu,
saveEditingMenuAndClose,
cancelEditingMenu,
hasMenuManageChanges,
saveMenuManageChanges,
goBackMainScreen,
deletePersonalMenu,
addPersonalMenu,
addMemo,
toggleMemoVisible,
toggleMemoPinned,
handleMemoDragEnd,
changeMemoColor,
deleteMemo,
confirmDeleteMemo,
openCmPinPopup,
handleCmKeypad,
openPcQuickMenu,
startPcQuickDrag,
startUserBtnDrag,
handleCheckPin,
saveProfileSettings,
handleKakaoConnect,
handleKakaoDisconnect,
sendMessage,
setMenus,
setHiddenMenuIds,
setToday,
setTotal,
weatherRegion,
setWeather,
setKakaoConnected,
memoOpenRef,
setPersonalMenus,
setBankRates,
setBankBaseDate,
setDbNotices,
setDbCategories,
setPopupNotice };
}
export type HomeController = ReturnType<typeof useHomeController>;
