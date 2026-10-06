"use client";

import { useRef, useState } from "react";

import { MemoItem, defaultMenus, PersonalMenuIconKey, PersonalMenuItem, MenuItem } from "../data";
export function useHomeState() {
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

const [fortuneOpen, setFortuneOpen] = useState(false);

const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);

const [hiddenMenuIds, setHiddenMenuIds] = useState<string[]>([]);

const [tempHiddenMenuIds, setTempHiddenMenuIds] = useState<string[]>([]);

const [today, setToday] = useState(0);

const [total, setTotal] = useState(0);

const [showInstall, setShowInstall] = useState(false);

const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

const [weatherRegion, setWeatherRegion] = useState("");

const [weatherOpen, setWeatherOpen] = useState(false);

const [weather, setWeather] = useState<{
  region: string;
  temp: number;
  description: string;
  icon: string;
  tempMin?: number;
  tempMax?: number;
  humidity?: number;
  feelsLike?: number;

airQuality?: {
  pm10?: number;
  pm25?: number;
  pm10Status?: string;
  pm25Status?: string;
};
} | null>(null);

const [open, setOpen] = useState(false);

const [noticeOpen, setNoticeOpen] = useState(false);

const [userMenuOpen, setUserMenuOpen] = useState(false);

const [profileSettingOpen, setProfileSettingOpen] = useState(false);

const [kakaoConnected, setKakaoConnected] = useState(false);

const [kakaoConnecting, setKakaoConnecting] = useState(false);

const [editNickname, setEditNickname] = useState("");

const [editInstagram, setEditInstagram] = useState("");

const [pinCheckPassword, setPinCheckPassword] = useState("");

const [pinCheckResult, setPinCheckResult] = useState("");

const [newPassword, setNewPassword] = useState("");

const [currentPassword, setCurrentPassword] = useState("");

const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

const [passwordResultOpen, setPasswordResultOpen] = useState(false);

const [passwordResultSuccess, setPasswordResultSuccess] = useState(false);

const passwordResultRef = useRef(false);

const passwordResultSuccessRef = useRef(false);

const [quickOpen, setQuickOpen] = useState(false);

const [pcQuickOpen, setPcQuickOpen] = useState(false);

const [pcQuickDirection, setPcQuickDirection] = useState<"up" | "down">("up");

const [pcQuickPos, setPcQuickPos] = useState({ x: 0, y: 0 });

const [userBtnPos, setUserBtnPos] = useState({ x: 0, y: 0 });

const userBtnDragRef = useRef<{
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
} | null>(null);

const pcQuickWrapRef = useRef<HTMLDivElement | null>(null);

const pcQuickDragRef = useRef<{
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
} | null>(null);

const [settingOpen, setSettingOpen] = useState(false);

const [memoOpen, setMemoOpen] = useState(false);

const [resourceOpen, setResourceOpen] = useState(false);

const memoOpenRef = useRef(false);

const [menuSortOpen, setMenuSortOpen] = useState(false);

const [tempMenus, setTempMenus] = useState<MenuItem[]>(defaultMenus);

const [menuAddOpen, setMenuAddOpen] = useState(false);

const [personalMenus, setPersonalMenus] = useState<PersonalMenuItem[]>([]);

const [tempPersonalMenus, setTempPersonalMenus] = useState<PersonalMenuItem[]>([]);

const [newMenuTitle, setNewMenuTitle] = useState("");

const [newMenuDesc, setNewMenuDesc] = useState("");

const [newMenuLink, setNewMenuLink] = useState("");

const [newMenuIcon, setNewMenuIcon] =
  useState<PersonalMenuIconKey>("globe");

const [menuManageMode, setMenuManageMode] =
  useState<"sort" | "edit" | "delete">("sort");

const [selectedPersonalMenuId, setSelectedPersonalMenuId] = useState("");

const [selectedDeleteMenuIds, setSelectedDeleteMenuIds] = useState<string[]>([]);

const [editingOriginalMenu, setEditingOriginalMenu] =
  useState<PersonalMenuItem | null>(null);

const [editIconOpen, setEditIconOpen] = useState(false);

const [mainMenuManageMode, setMainMenuManageMode] =
  useState<"normal" | "edit" | "delete">("normal");

const [popupPositions, setPopupPositions] = useState<
  Partial<Record<PopupKey, { x: number; y: number }>>
>({});

const [popupZIndexes, setPopupZIndexes] = useState<
  Partial<Record<PopupKey, number>>
>({});

const popupZIndexRef = useRef(1500);

const dragPopupRef = useRef<{
  key: PopupKey;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null>(null);

const [memoTitle, setMemoTitle] = useState("");

const [memoContent, setMemoContent] = useState("");

const [memoColor, setMemoColor] =
  useState<MemoItem["color"]>("white");

const [memoSearch, setMemoSearch] = useState("");

const [memoPage, setMemoPage] = useState(1);

const [memoAddOpen, setMemoAddOpen] = useState(false);

const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);

const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);

const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);

const [hospitalOpen, setHospitalOpen] = useState(false);

const [diseaseOpen, setDiseaseOpen] = useState(false);

const [pressOpen, setPressOpen] = useState(false);

const [selectedPress, setSelectedPress] = useState<any>(null);

const [pressSearch, setPressSearch] = useState("");

const [pressPage, setPressPage] = useState(1);

const [lifeOpen, setLifeOpen] = useState(false);

const [npsTableOpen, setNpsTableOpen] = useState(false);



const [bankRateOpen, setBankRateOpen] = useState(false);

const [bankRateMonth, setBankRateMonth] = useState<"12" | "24">("12");

const [bankRates, setBankRates] = useState<any[]>([]);

const [bankBaseDate, setBankBaseDate] = useState("");

const [cmPinOpen, setCmPinOpen] = useState(false);

const [cmPinState, setCmPinState] = useState<"not-approved" | "no-pin" | "locked">("locked");

const [cmPinStep, setCmPinStep] = useState<"enter" | "confirm">("enter");

const [cmPinInput, setCmPinInput] = useState("");

const [cmPinConfirm, setCmPinConfirm] = useState("");

const [cmPinError, setCmPinError] = useState("");

const cmPinInputRef = useRef("");

const cmPinStepRef = useRef<"enter" | "confirm">("enter");

const [quickMenuKeys, setQuickMenuKeys] = useState<string[]>([
  "hospital",
  "life",
  "press",
  "disease",
]);

const [tempQuickMenuKeys, setTempQuickMenuKeys] = useState<string[]>([]);

const [contextMenu, setContextMenu] = useState<{
  x: number;
  y: number;
  type: "mainPersonal" | "quickMenu" | "menuManage" | "memo";
  id: string;
  index?: number;
} | null>(null);

const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

const [quickLimitOpen, setQuickLimitOpen] = useState(false);

const [quickMenuSelectOpen, setQuickMenuSelectOpen] = useState(false);

const [quickDeleteConfirmOpen, setQuickDeleteConfirmOpen] =
  useState(false);

const [quickDeleteKey, setQuickDeleteKey] = useState<string | null>(null);

const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

const [saveConfirmType, setSaveConfirmType] =
  useState<"main" | "popup">("main");

const [saveConfirmMessage, setSaveConfirmMessage] =
  useState("변경 내용이 저장되었습니다.");

const [menuLinkAlertOpen, setMenuLinkAlertOpen] = useState(false);

const [lifeGender, setLifeGender] = useState<"남성" | "여성">("남성");

const [lifeAge, setLifeAge] = useState("");

const [noticePage, setNoticePage] = useState(1);

const [selectedNotice, setSelectedNotice] = useState<any>(null);

const [noticeImageIndex, setNoticeImageIndex] = useState(0);

const [popupNoticeImageIndex, setPopupNoticeImageIndex] = useState(0);

const [fixMessage, setFixMessage] = useState("");

const [addMessage, setAddMessage] = useState("");

const [contact, setContact] = useState("");

const [hasUpdate, setHasUpdate] = useState(false);

const [hasSalesBookUpdate, setHasSalesBookUpdate] = useState(false);

const [readNoticeIds, setReadNoticeIds] = useState<(number | string)[]>([]);

const [dbNotices, setDbNotices] = useState<any[]>([]);

const [dbCategories, setDbCategories] = useState<any[]>([]);

const [popupNotice, setPopupNotice] = useState<any | null>(null);

const [popupNoticeClosed, setPopupNoticeClosed] = useState(false);

const [readPressIds, setReadPressIds] = useState<number[]>([]);
return { fortuneOpen, setFortuneOpen, menus, setMenus, hiddenMenuIds, setHiddenMenuIds, tempHiddenMenuIds, setTempHiddenMenuIds, today, setToday, total, setTotal, showInstall, setShowInstall, deferredPrompt, setDeferredPrompt, weatherRegion, setWeatherRegion, weatherOpen, setWeatherOpen, weather, setWeather, open, setOpen, noticeOpen, setNoticeOpen, userMenuOpen, setUserMenuOpen, profileSettingOpen, setProfileSettingOpen, kakaoConnected, setKakaoConnected, kakaoConnecting, setKakaoConnecting, editNickname, setEditNickname, editInstagram, setEditInstagram, pinCheckPassword, setPinCheckPassword, pinCheckResult, setPinCheckResult, newPassword, setNewPassword, currentPassword, setCurrentPassword, newPasswordConfirm, setNewPasswordConfirm, passwordResultOpen, setPasswordResultOpen, passwordResultSuccess, setPasswordResultSuccess, passwordResultRef, passwordResultSuccessRef, quickOpen, setQuickOpen, pcQuickOpen, setPcQuickOpen, pcQuickDirection, setPcQuickDirection, pcQuickPos, setPcQuickPos, userBtnPos, setUserBtnPos, userBtnDragRef, pcQuickWrapRef, pcQuickDragRef, settingOpen, setSettingOpen, memoOpen, setMemoOpen, resourceOpen, setResourceOpen, memoOpenRef, menuSortOpen, setMenuSortOpen, tempMenus, setTempMenus, menuAddOpen, setMenuAddOpen, personalMenus, setPersonalMenus, tempPersonalMenus, setTempPersonalMenus, newMenuTitle, setNewMenuTitle, newMenuDesc, setNewMenuDesc, newMenuLink, setNewMenuLink, newMenuIcon, setNewMenuIcon, menuManageMode, setMenuManageMode, selectedPersonalMenuId, setSelectedPersonalMenuId, selectedDeleteMenuIds, setSelectedDeleteMenuIds, editingOriginalMenu, setEditingOriginalMenu, editIconOpen, setEditIconOpen, mainMenuManageMode, setMainMenuManageMode, popupPositions, setPopupPositions, popupZIndexes, setPopupZIndexes, popupZIndexRef, dragPopupRef, memoTitle, setMemoTitle, memoContent, setMemoContent, memoColor, setMemoColor, memoSearch, setMemoSearch, memoPage, setMemoPage, memoAddOpen, setMemoAddOpen, selectedMemo, setSelectedMemo, deleteMemoConfirmOpen, setDeleteMemoConfirmOpen, deleteMemoId, setDeleteMemoId, hospitalOpen, setHospitalOpen, diseaseOpen, setDiseaseOpen, pressOpen, setPressOpen, selectedPress, setSelectedPress, pressSearch, setPressSearch, pressPage, setPressPage, lifeOpen, setLifeOpen, npsTableOpen, setNpsTableOpen, bankRateOpen, setBankRateOpen, bankRateMonth, setBankRateMonth, bankRates, setBankRates, bankBaseDate, setBankBaseDate, cmPinOpen, setCmPinOpen, cmPinState, setCmPinState, cmPinStep, setCmPinStep, cmPinInput, setCmPinInput, cmPinConfirm, setCmPinConfirm, cmPinError, setCmPinError, cmPinInputRef, cmPinStepRef, quickMenuKeys, setQuickMenuKeys, tempQuickMenuKeys, setTempQuickMenuKeys, contextMenu, setContextMenu, deleteConfirmOpen, setDeleteConfirmOpen, quickLimitOpen, setQuickLimitOpen, quickMenuSelectOpen, setQuickMenuSelectOpen, quickDeleteConfirmOpen, setQuickDeleteConfirmOpen, quickDeleteKey, setQuickDeleteKey, saveConfirmOpen, setSaveConfirmOpen, saveConfirmType, setSaveConfirmType, saveConfirmMessage, setSaveConfirmMessage, menuLinkAlertOpen, setMenuLinkAlertOpen, lifeGender, setLifeGender, lifeAge, setLifeAge, noticePage, setNoticePage, selectedNotice, setSelectedNotice, noticeImageIndex, setNoticeImageIndex, popupNoticeImageIndex, setPopupNoticeImageIndex, fixMessage, setFixMessage, addMessage, setAddMessage, contact, setContact, hasUpdate, setHasUpdate, hasSalesBookUpdate, setHasSalesBookUpdate, readNoticeIds, setReadNoticeIds, dbNotices, setDbNotices, dbCategories, setDbCategories, popupNotice, setPopupNotice, popupNoticeClosed, setPopupNoticeClosed, readPressIds, setReadPressIds };
}
