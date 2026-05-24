"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

// 지원 통화 목록
const CURRENCIES: { code: string; name: string; flag: string; img: string }[] = [
  { code: "KRW", name: "대한민국 원",      flag: "🇰🇷", img: "/flags/KRW.png" },
  { code: "PHP", name: "필리핀 페소",       flag: "🇵🇭", img: "/flags/PHP.png" },
  { code: "USD", name: "미국 달러",         flag: "🇺🇸", img: "/flags/USD.png" },
  { code: "JPY", name: "일본 엔화",         flag: "🇯🇵", img: "/flags/JPY.png" },
  { code: "VND", name: "베트남 동",         flag: "🇻🇳", img: "/flags/VND.png" },
  { code: "EUR", name: "유로",              flag: "🇪🇺", img: "/flags/EUR.png" },
  { code: "THB", name: "태국 바트",         flag: "🇹🇭", img: "/flags/THB.png" },
  { code: "CNY", name: "중국 위안화",       flag: "🇨🇳", img: "/flags/CNY.png" },
  { code: "RUB", name: "러시아 루블",       flag: "🇷🇺", img: "/flags/RUB.png" },
  { code: "TWD", name: "신 타이완 달러",    flag: "🇹🇼", img: "/flags/TWD.png" },
  { code: "HKD", name: "홍콩 달러",         flag: "🇭🇰", img: "/flags/HKD.png" },
  { code: "GBP", name: "영국 파운드",       flag: "🇬🇧", img: "/flags/GBP.png" },
  { code: "AUD", name: "호주 달러",         flag: "🇦🇺", img: "/flags/AUD.png" },
  { code: "CAD", name: "캐나다 달러",       flag: "🇨🇦", img: "/flags/CAD.png" },
  { code: "CHF", name: "스위스 프랑",       flag: "🇨🇭", img: "/flags/CHF.png" },
  { code: "SGD", name: "싱가포르 달러",     flag: "🇸🇬", img: "/flags/SGD.png" },
  { code: "MYR", name: "말레이시아 링깃",   flag: "🇲🇾", img: "/flags/MYR.png" },
  { code: "IDR", name: "인도네시아 루피아", flag: "🇮🇩", img: "/flags/IDR.png" },
  { code: "INR", name: "인도 루피",         flag: "🇮🇳", img: "/flags/INR.png" },
  { code: "NZD", name: "뉴질랜드 달러",     flag: "🇳🇿", img: "/flags/NZD.png" },
];

// 통화 단위 이름 (서브텍스트용)
const CURRENCY_UNIT: Record<string, string> = {
  KRW: "원", PHP: "페소", USD: "달러", JPY: "엔", VND: "동",
  EUR: "유로", THB: "바트", CNY: "위안", RUB: "루블", TWD: "달러",
  HKD: "달러", GBP: "파운드", AUD: "달러", CAD: "달러", CHF: "프랑",
  SGD: "달러", MYR: "링깃", IDR: "루피아", INR: "루피", NZD: "달러",
};

// 국기 이미지 컴포넌트
function FlagImage({ code, flag, size = 40 }: { code: string; flag: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const currency = CURRENCIES.find((c) => c.code === code);
  if (!currency || imgError) {
    return <span style={{ fontSize: size * 0.6 }}>{flag}</span>;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Image
        src={currency.img}
        alt={code}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%" }}
        onError={() => setImgError(true)}
      />
    </span>
  );
}

// 숫자 포맷 (표시용 큰 숫자)
function formatAmount(value: number, code: string): string {
  if (isNaN(value) || !isFinite(value)) return "0";
  const noDecimal = ["KRW", "JPY", "IDR", "VND", "HUF"];
  // 정수 단위 통화라도 결과가 1 미만이면 소수점 표시 (예: 0.058)
  if (noDecimal.includes(code)) {
    if (value !== 0 && Math.abs(value) < 1) {
      return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    }
    return Math.round(value).toLocaleString("ko-KR");
  }
  return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 환율 1단위 표기용 포맷 (소수점 최대 4자리, 불필요한 0 제거)
function formatRate(value: number): string {
  if (isNaN(value) || !isFinite(value)) return "0";
  if (value === 0) return "0";
  if (value >= 1) {
    return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // 1 미만: 유효숫자 3자리 (예: 0.058, 0.0012)
  return parseFloat(value.toPrecision(3)).toString();
}

// 한글 단위 서브텍스트 생성 (예: "10만 원", "65.83 달러")
function formatSubText(value: number, code: string): string {
  const unit = CURRENCY_UNIT[code] || code;
  const noDecimal = ["KRW", "JPY", "IDR", "VND", "HUF"];

  if (noDecimal.includes(code)) {
    // 1 미만이면 소수점 표시
    if (value !== 0 && Math.abs(value) < 1) {
      return `${parseFloat(value.toPrecision(3))} ${unit}`;
    }
    const rounded = Math.round(value);
    if (rounded === 0) return `0 ${unit}`;
    if (rounded >= 100000000) {
      const eok = rounded / 100000000;
      return `${eok % 1 === 0 ? eok.toLocaleString() : eok.toFixed(1)} 억 ${unit}`;
    }
    if (rounded >= 10000) {
      const man = rounded / 10000;
      return `${man % 1 === 0 ? man.toLocaleString() : man.toFixed(1)} 만 ${unit}`;
    }
    return `${rounded.toLocaleString()} ${unit}`;
  }

  const formatted = value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${unit}`;
}

// 계산기 연산자 타입
type CalcOp = "÷" | "×" | "−" | "+" | null;

export default function CurrencyConverter() {
  const { authUser, authStatus } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 340, height: 620 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const themeLoaded = useRef(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rateDate, setRateDate] = useState("");
  const [rateTime, setRateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KRW");
  const [inputValue, setInputValue] = useState("1");
  const [activeInput, setActiveInput] = useState<"from" | "to">("from");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to">("from");

  const isDark = theme === "dark";
  const T = {
    bg:          isDark ? "#1c1c1e"  : "#f2f2f7",
    displayBg:   isDark ? "#252527"  : "#ffffff",
    displayBg2:  isDark ? "#2c2c2e"  : "#f0f0f5",
    divider:     isDark ? "#3a3a3c"  : "#e5e5ea",
    btnNum:      isDark ? "#3a3a3c"  : "#d1d1d6",
    btnNumHov:   isDark ? "#4a4a4c"  : "#c7c7cc",
    btnFunc:     isDark ? "#636366"  : "#aeaeb2",
    btnFuncHov:  isDark ? "#737376"  : "#9e9ea3",
    btnOrange:   "#ff9f0a",
    btnOrangeHov:"#e8900a",
    btnOrangeActive: "#cc7a00",
    textMain:    isDark ? "#ffffff"  : "#000000",
    textSub:     isDark ? "#8e8e93"  : "#8e8e93",
    textAccent:  isDark ? "#ff9f0a"  : "#ff9f0a",
    infoBg:      isDark ? "#252527"  : "#ffffff",
    pickerBg:    isDark ? "#1c1c1e"  : "#f2f2f7",
    pickerItem:  isDark ? "#2c2c2e"  : "#e5e5ea",
    searchBg:    isDark ? "#2c2c2e"  : "#e5e5ea",
    closeBtnHov: isDark ? "#3a3a3c"  : "#e5e5ea",
  };

  if (!authUser || authStatus !== "approved") return null;

  return <CurrencyConverterInner
    authUser={authUser}
    isOpen={isOpen} setIsOpen={setIsOpen}
    initialized={initialized} setInitialized={setInitialized}
    pos={pos} setPos={setPos}
    dragging={dragging} dragOffset={dragOffset} calcRef={calcRef}
    size={size} setSize={setSize}
    resizing={resizing} resizeStart={resizeStart}
    theme={theme} setTheme={setTheme} themeLoaded={themeLoaded}
    rates={rates} setRates={setRates}
    rateDate={rateDate} setRateDate={setRateDate}
    rateTime={rateTime} setRateTime={setRateTime}
    loading={loading} setLoading={setLoading}
    fromCurrency={fromCurrency} setFromCurrency={setFromCurrency}
    toCurrency={toCurrency} setToCurrency={setToCurrency}
    inputValue={inputValue} setInputValue={setInputValue}
    activeInput={activeInput} setActiveInput={setActiveInput}
    showCurrencyPicker={showCurrencyPicker} setShowCurrencyPicker={setShowCurrencyPicker}
    pickerTarget={pickerTarget} setPickerTarget={setPickerTarget}
    T={T}
  />;
}

function CurrencyConverterInner(props: any) {
  const {
    authUser,
    isOpen, setIsOpen,
    initialized, setInitialized,
    pos, setPos,
    dragging, dragOffset, calcRef,
    size, setSize,
    resizing, resizeStart,
    theme, setTheme, themeLoaded,
    rates, setRates,
    rateDate, setRateDate,
    rateTime, setRateTime,
    loading, setLoading,
    fromCurrency, setFromCurrency,
    toCurrency, setToCurrency,
    inputValue, setInputValue,
    activeInput, setActiveInput,
    showCurrencyPicker, setShowCurrencyPicker,
    pickerTarget, setPickerTarget,
    T,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");
  // 계산기 상태
  const [calcOp, setCalcOp] = useState<CalcOp>(null);
  const [calcPrev, setCalcPrev] = useState<string | null>(null);
  const [calcJustEq, setCalcJustEq] = useState(false);

  // 초기 위치
  useEffect(() => {
    if (!initialized) {
      setPos({ x: 20, y: Math.max(20, window.innerHeight - 640) });
      setInitialized(true);
    }
  }, [initialized, setInitialized, setPos]);

  // 외부 이벤트로 열기
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-currency-converter", handler);
    return () => window.removeEventListener("open-currency-converter", handler);
  }, [setIsOpen]);

  // 테마 로드
  useEffect(() => {
    if (!authUser || themeLoaded.current) return;
    themeLoaded.current = true;
    supabase.from("profiles").select("currency_converter_theme").eq("id", authUser.id).single()
      .then(({ data }) => { if (data?.currency_converter_theme) setTheme(data.currency_converter_theme); });
  }, [authUser, setTheme, themeLoaded]);

  // 테마 토글 + 저장
  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (authUser) {
      supabase.from("profiles").update({ currency_converter_theme: next }).eq("id", authUser.id).then();
    }
  }, [theme, setTheme, authUser]);

  // 환율 데이터
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exchange");
      const data = await res.json();
      const sourceItems = data?.allItems ?? data?.items;
      if (sourceItems && Array.isArray(sourceItems)) {
        const rateMap: Record<string, number> = { KRW: 1 };
        sourceItems.forEach((item: any) => {
          if (item.label && item.value) rateMap[item.label] = item.value;
          if (item.code && item.rate) rateMap[item.code] = item.rate;
        });
        setRates(rateMap);
        if (data.date) setRateDate(data.date);
       if (data.date) {
  const date = new Date(data.date);

  const formatted = date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  setRateTime(formatted.replaceAll(". ", ". ").replace(".", "."));
}
      }
    } catch (e) {
      console.error("환율 데이터 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setRates, setRateDate, setRateTime]);

  useEffect(() => {
    if (isOpen && Object.keys(rates).length === 0) fetchRates();
  }, [isOpen, rates, fetchRates]);

  // 환율 계산
  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      if (!rates[from] || !rates[to]) return 0;
      return (amount * rates[from]) / rates[to];
    },
    [rates]
  );

  const rawInput = parseFloat(inputValue.replace(/,/g, "")) || 0;
  const fromAmountForDisplay = activeInput === "from" ? rawInput : convert(rawInput, toCurrency, fromCurrency);
  const toAmountForDisplay   = activeInput === "to"   ? rawInput : convert(rawInput, fromCurrency, toCurrency);
  const oneUnitRate = convert(1, fromCurrency, toCurrency);

  // 드래그
  const onMouseDownDrag = useCallback(
    (e: React.MouseEvent) => {
      if (
        (e.target as HTMLElement).closest(".cc-btn") ||
        (e.target as HTMLElement).closest(".cc-resize") ||
        (e.target as HTMLElement).closest("input")
      ) return;
      dragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    },
    [pos, dragging, dragOffset]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y)),
        });
      }
      if (resizing.current) {
        const newW = Math.max(300, Math.min(500, resizeStart.current.w + (e.clientX - resizeStart.current.x)));
        const newH = Math.max(520, Math.min(780, resizeStart.current.h + (e.clientY - resizeStart.current.y)));
        setSize({ width: newW, height: newH });
      }
    };
    const onMouseUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [size, dragging, dragOffset, resizing, resizeStart, setPos, setSize]);

  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      resizing.current = true;
      resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
      e.preventDefault();
      e.stopPropagation();
    },
    [size, resizing, resizeStart]
  );

  // waitingForOperand: 연산자 누른 뒤 다음 숫자 입력 시 새 숫자로 시작
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // ── 입력 핸들러 ──────────────────────────────────────────────
  const handleDigit = useCallback((d: string) => {
    setCalcJustEq(false);
    if (waitingForOperand) {
      setInputValue(d === "." ? "0." : d);
      setWaitingForOperand(false);
      return;
    }
    setInputValue((prev: string) => {
      const raw = prev.replace(/,/g, "");
      if (raw === "0" && d !== ".") return d;
      if (d === "." && raw.includes(".")) return prev;
      if (raw.replace(".", "").length >= 15) return prev;
      return raw + d;
    });
  }, [setInputValue, waitingForOperand]);

  const handleBackspace = useCallback(() => {
    setCalcJustEq(false);
    setWaitingForOperand(false);
    setInputValue((prev: string) => {
      const raw = prev.replace(/,/g, "");
      return raw.length <= 1 ? "0" : raw.slice(0, -1);
    });
  }, [setInputValue]);

  const handleClear = useCallback(() => {
    setInputValue("0");
    setCalcOp(null);
    setCalcPrev(null);
    setCalcJustEq(false);
    setWaitingForOperand(false);
  }, [setInputValue]);

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setActiveInput("from");
    setInputValue("1");
    setCalcOp(null);
    setCalcPrev(null);
    setCalcJustEq(false);
  }, [fromCurrency, toCurrency, setFromCurrency, setToCurrency, setActiveInput, setInputValue]);

  // 계산기 연산자 처리
  const handleOperator = useCallback((op: CalcOp) => {
    setCalcJustEq(false);
    const cur = parseFloat(inputValue.replace(/,/g, ""));
    if (calcOp && calcPrev !== null && !waitingForOperand) {
      const prev = parseFloat(calcPrev);
      let result = cur;
      if (calcOp === "+") result = prev + cur;
      else if (calcOp === "−") result = prev - cur;
      else if (calcOp === "×") result = prev * cur;
      else if (calcOp === "÷") result = cur !== 0 ? prev / cur : 0;
      const resultStr = Number.isInteger(result) ? String(result) : result.toFixed(8).replace(/\.?0+$/, "");
      setInputValue(resultStr);
      setCalcPrev(resultStr);
    } else {
      setCalcPrev(String(cur));
    }
    setCalcOp(op);
    setWaitingForOperand(true);
  }, [calcOp, calcPrev, inputValue, waitingForOperand, setInputValue]);

  // % 처리
  const handlePercent = useCallback(() => {
    setCalcJustEq(false);
    setWaitingForOperand(false);
    const cur = parseFloat(inputValue.replace(/,/g, ""));
    if (isNaN(cur)) return;
    let result: number;
    if (calcOp && calcPrev !== null) {
      const prev = parseFloat(calcPrev);
      result = prev * (cur / 100);
    } else {
      result = cur / 100;
    }
    const resultStr = Number.isInteger(result) ? String(result) : result.toFixed(8).replace(/\.?0+$/, "");
    setInputValue(resultStr);
  }, [inputValue, calcOp, calcPrev, setInputValue]);

  // = 처리
  const handleEquals = useCallback(() => {
    if (!calcOp || calcPrev === null) return;
    const prev = parseFloat(calcPrev);
    const cur = parseFloat(inputValue.replace(/,/g, ""));
    let result = cur;
    if (calcOp === "+") result = prev + cur;
    else if (calcOp === "−") result = prev - cur;
    else if (calcOp === "×") result = prev * cur;
    else if (calcOp === "÷") result = cur !== 0 ? prev / cur : 0;
    const resultStr = Number.isInteger(result) ? String(result) : result.toFixed(8).replace(/\.?0+$/, "");
    setInputValue(resultStr);
    setCalcOp(null);
    setCalcPrev(null);
    setCalcJustEq(true);
    setWaitingForOperand(false);
  }, [calcOp, calcPrev, inputValue, setInputValue]);

  // 키보드 입력
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // 검색창(cc-search-input)은 자유 입력 보장, 숫자 표시 input(cc-display-input)은 키패드가 처리
      if (
        target.classList.contains("cc-search-input") ||
        (target.tagName === "INPUT" && !target.classList.contains("cc-display-input")) ||
        target.tagName === "TEXTAREA"
      ) return;
      // 통화 선택 팝업이 열려 있으면 Escape만 처리
      if (showCurrencyPicker) {
        if (e.key === "Escape") { e.preventDefault(); setShowCurrencyPicker(false); }
        return;
      }
      // cc-display-input에서 텍스트가 선택된 상태면 Backspace/Delete 모두 전체 지우기
      const dispInput = document.querySelector(".cc-display-input") as HTMLInputElement | null;
      const hasSelection = dispInput && (dispInput.selectionEnd! - dispInput.selectionStart! > 0);
      if (e.key >= "0" && e.key <= "9") { e.preventDefault(); handleDigit(e.key); }
      else if (e.key === ".") { e.preventDefault(); handleDigit("."); }
      else if (e.key === "Backspace") { e.preventDefault(); if (hasSelection) handleClear(); else handleBackspace(); }
      else if (e.key === "Delete") { e.preventDefault(); handleClear(); }
      else if (e.key === "Escape") { e.preventDefault(); setIsOpen(false); }
      else if (e.key === "+") { e.preventDefault(); handleOperator("+"); }
      else if (e.key === "-") { e.preventDefault(); handleOperator("−"); }
      else if (e.key === "*") { e.preventDefault(); handleOperator("×"); }
      else if (e.key === "/") { e.preventDefault(); handleOperator("÷"); }
      else if (e.key === "%") { e.preventDefault(); handlePercent(); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); handleEquals(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isOpen, showCurrencyPicker, handleDigit, handleBackspace, handleClear, handleOperator, handlePercent, handleEquals, setIsOpen, setShowCurrencyPicker]);

  // 통화 선택
  const openPicker = (target: "from" | "to") => {
    setPickerTarget(target);
    setSearchQuery("");
    setShowCurrencyPicker(true);
  };
  const selectCurrency = (code: string) => {
    if (pickerTarget === "from") setFromCurrency(code);
    else setToCurrency(code);
    setShowCurrencyPicker(false);
  };

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fromInfo = CURRENCIES.find((c) => c.code === fromCurrency) ?? CURRENCIES[0];
  const toInfo   = CURRENCIES.find((c) => c.code === toCurrency)   ?? CURRENCIES[0];

  const btnBase = "flex items-center justify-center rounded-2xl font-medium select-none cursor-pointer transition-all active:scale-95 text-xl cc-btn";

  return (
    <>
      {isOpen && initialized && (
        <div
          ref={calcRef}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: size.width,
            height: size.height,
            zIndex: 9998,
            userSelect: "none",
            background: T.bg,
            borderRadius: 24,
          }}
          className="shadow-2xl flex flex-col overflow-hidden"
          onMouseDown={onMouseDownDrag}
        >
          {/* 통화 선택 팝업 */}
          {showCurrencyPicker && (
            <div className="absolute inset-0 z-20 flex flex-col rounded-3xl overflow-hidden" style={{ background: T.pickerBg }}>
              <div className="flex items-center px-5 pt-5 pb-3 relative">
                <button
                  className="cc-btn text-sm font-medium absolute left-5 cursor-pointer"
                  style={{ color: T.textAccent }}
                  onClick={() => setShowCurrencyPicker(false)}
                >
                  ‹ 뒤로
                </button>
                <span className="font-bold text-base w-full text-center" style={{ color: T.textMain }}>통화</span>
                {/* X 버튼 - 통화 선택 팝업에서도 표시 */}
                <button
                  className="cc-btn w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer absolute right-5"
                  style={{ color: T.textSub }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.closeBtnHov; e.currentTarget.style.color = T.textMain; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; }}
                  onClick={() => setIsOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="px-4 mb-3">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onCompositionEnd={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  style={{ background: T.searchBg, color: T.textMain }}
                  className="cc-search-input w-full rounded-xl px-4 py-3 text-sm outline-none placeholder-gray-500 cursor-text"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    className="cc-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left cursor-pointer"
                    style={{ color: T.textMain }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.pickerItem)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => selectCurrency(c.code)}
                  >
                    <FlagImage code={c.code} flag={c.flag} size={36} />
                    <span className="flex-1 text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-bold" style={{ color: T.textSub }}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메인 */}
          <div className="relative z-10 flex flex-col h-full">

            {/* 상단 아이콘 바 */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              {/* 왼쪽: 테마 토글 */}
              <button
                className="cc-btn w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer hover:opacity-70"
                style={{ color: T.textSub }}
                onClick={toggleTheme}
                title={theme === "dark" ? "밝은 테마로 전환" : "어두운 테마로 전환"}
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* 가운데: 타이틀 */}
              <span className="font-semibold text-sm" style={{ color: T.textSub }}>환율 변환기</span>

              {/* 닫기 버튼 */}
              <button
                className="cc-btn w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
                style={{ color: T.textSub }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.closeBtnHov; e.currentTarget.style.color = T.textMain; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; }}
                onClick={() => setIsOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 디스플레이 영역 */}
            <div className="mx-3 mb-2 rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.divider}` }}>

              {/* From */}
              <div
                className="w-full flex items-center px-4 py-3 transition cursor-text"
                style={{ background: activeInput === "from" ? T.displayBg2 : T.displayBg }}
                onClick={() => {
                  if (activeInput !== "from") {
                    const converted = convert(parseFloat(inputValue.replace(/,/g, "")) || 0, toCurrency, fromCurrency);
                    setInputValue(String(converted));
                    setActiveInput("from");
                    setCalcOp(null);
                    setCalcPrev(null);
                    setCalcJustEq(false);
                  }
                }}
              >
                {/* 국기 + 통화코드 (div로 button 중첩 방지) */}
                <div
                  className="cc-btn flex items-center gap-2 hover:opacity-80 transition shrink-0 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); openPicker("from"); }}
                >
                  <FlagImage code={fromCurrency} flag={fromInfo.flag} size={36} />
                  <span className="font-bold text-sm w-10 text-left" style={{ color: T.textMain }}>{fromCurrency}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textAccent} strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* 숫자 + 서브텍스트 */}
                <div className="flex-1 flex flex-col items-end justify-center min-w-0 pl-2">
                  <input
                    type="text"
                    readOnly
                    value={formatAmount(fromAmountForDisplay, fromCurrency)}
                    className="cc-display-input font-bold text-2xl leading-tight w-full text-right bg-transparent outline-none cursor-text"
                    style={{ color: activeInput === "from" ? T.textMain : T.textSub, caretColor: T.textAccent }}
                  />
                  <span className="text-xs mt-0.5 truncate w-full text-right" style={{ color: T.textSub }}>
                    {formatSubText(fromAmountForDisplay, fromCurrency)}
                  </span>
                </div>
              </div>

              {/* 구분선 + 스왑 버튼 (디스플레이 중간) */}
              <div className="relative h-px" style={{ background: T.divider }}>
                <button
                  className="cc-btn absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer z-10 transition-all"
                  style={{ background: T.btnOrange }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.btnOrangeHov)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.btnOrange)}
                  onClick={(e) => { e.stopPropagation(); handleSwap(); }}
                  title="통화 스왑"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <polyline points="8 7 12 3 16 7" />
                    <polyline points="8 17 12 21 16 17" />
                  </svg>
                </button>
              </div>

              {/* To */}
              <div
                className="w-full flex items-center px-4 py-3 transition cursor-text"
                style={{ background: activeInput === "to" ? T.displayBg2 : T.displayBg }}
                onClick={() => {
                  if (activeInput !== "to") {
                    const converted = convert(parseFloat(inputValue.replace(/,/g, "")) || 0, fromCurrency, toCurrency);
                    setInputValue(String(converted));
                    setActiveInput("to");
                    setCalcOp(null);
                    setCalcPrev(null);
                    setCalcJustEq(false);
                  }
                }}
              >
                {/* 국기 + 통화코드 (div로 button 중첩 방지) */}
                <div
                  className="cc-btn flex items-center gap-2 hover:opacity-80 transition shrink-0 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); openPicker("to"); }}
                >
                  <FlagImage code={toCurrency} flag={toInfo.flag} size={36} />
                  <span className="font-bold text-sm w-10 text-left" style={{ color: T.textMain }}>{toCurrency}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.textAccent} strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* 숫자 + 서브텍스트 */}
                <div className="flex-1 flex flex-col items-end justify-center min-w-0 pl-2">
                  {loading ? (
                    <span className="text-sm" style={{ color: T.textSub }}>로딩중...</span>
                  ) : (
                    <>
                      <input
                        type="text"
                        readOnly
                        value={formatAmount(toAmountForDisplay, toCurrency)}
                        className="cc-display-input font-bold text-2xl leading-tight w-full text-right bg-transparent outline-none cursor-text"
                        style={{ color: activeInput === "to" ? T.textMain : T.textSub, caretColor: T.textAccent }}
                      />
                      <span className="text-xs mt-0.5 truncate w-full text-right" style={{ color: T.textSub }}>
                        {formatSubText(toAmountForDisplay, toCurrency)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 키패드 - 4열 × 5행 계산기 스타일 */}
            <div
              className="flex-1 grid grid-cols-4 gap-[8px] px-3"
              style={{ gridTemplateRows: "repeat(5, 1fr)" }}
            >
              {/* Row 1: C | ← | ↑↓(스왑) | ÷ */}
              <button
                className={btnBase}
                style={{ background: T.btnFunc, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnFuncHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnFunc)}
                onClick={handleClear}
              >C</button>

              <button
                className={btnBase}
                style={{ background: T.btnFunc, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnFuncHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnFunc)}
                onClick={handleBackspace}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>

              {/* ↑↓ 스왑 */}
              <button
                className={btnBase}
                style={{ background: T.btnFunc, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnFuncHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnFunc)}
                onClick={handleSwap}
                title="통화 스왑"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="3" x2="12" y2="21" />
                  <polyline points="8 7 12 3 16 7" />
                  <polyline points="8 17 12 21 16 17" />
                </svg>
              </button>

              {/* ÷ */}
              <button
                className={btnBase}
                style={{ background: calcOp === "÷" ? T.btnOrangeActive : T.btnOrange, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = calcOp === "÷" ? T.btnOrangeActive : T.btnOrangeHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = calcOp === "÷" ? T.btnOrangeActive : T.btnOrange)}
                onClick={() => handleOperator("÷")}
              >÷</button>

              {/* Row 2: 7 | 8 | 9 | × */}
              {["7","8","9"].map((d) => (
                <button
                  key={d}
                  className={btnBase}
                  style={{ background: T.btnNum, color: T.textMain }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.btnNumHov)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.btnNum)}
                  onClick={() => handleDigit(d)}
                >{d}</button>
              ))}
              <button
                className={btnBase}
                style={{ background: calcOp === "×" ? T.btnOrangeActive : T.btnOrange, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = calcOp === "×" ? T.btnOrangeActive : T.btnOrangeHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = calcOp === "×" ? T.btnOrangeActive : T.btnOrange)}
                onClick={() => handleOperator("×")}
              >×</button>

              {/* Row 3: 4 | 5 | 6 | − */}
              {["4","5","6"].map((d) => (
                <button
                  key={d}
                  className={btnBase}
                  style={{ background: T.btnNum, color: T.textMain }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.btnNumHov)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.btnNum)}
                  onClick={() => handleDigit(d)}
                >{d}</button>
              ))}
              <button
                className={btnBase}
                style={{ background: calcOp === "−" ? T.btnOrangeActive : T.btnOrange, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = calcOp === "−" ? T.btnOrangeActive : T.btnOrangeHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = calcOp === "−" ? T.btnOrangeActive : T.btnOrange)}
                onClick={() => handleOperator("−")}
              >−</button>

              {/* Row 4: 1 | 2 | 3 | + */}
              {["1","2","3"].map((d) => (
                <button
                  key={d}
                  className={btnBase}
                  style={{ background: T.btnNum, color: T.textMain }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.btnNumHov)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.btnNum)}
                  onClick={() => handleDigit(d)}
                >{d}</button>
              ))}
              <button
                className={btnBase}
                style={{ background: calcOp === "+" ? T.btnOrangeActive : T.btnOrange, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = calcOp === "+" ? T.btnOrangeActive : T.btnOrangeHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = calcOp === "+" ? T.btnOrangeActive : T.btnOrange)}
                onClick={() => handleOperator("+")}
              >+</button>

              {/* Row 5: 0 | . | % | = */}
              <button
                className={btnBase}
                style={{ background: T.btnNum, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnNumHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnNum)}
                onClick={() => handleDigit("0")}
              >0</button>

              <button
                className={btnBase}
                style={{ background: T.btnNum, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnNumHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnNum)}
                onClick={() => handleDigit(".")}
              >.</button>

              <button
                className={btnBase}
                style={{ background: T.btnFunc, color: T.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnFuncHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnFunc)}
                onClick={handlePercent}
              >%</button>

              <button
                className={btnBase}
                style={{ background: T.btnOrange, color: "white" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.btnOrangeHov)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.btnOrange)}
                onClick={handleEquals}
              >=</button>
            </div>

            {/* 하단 정보바: 새로고침 | 환율 조회 시각 | 설정(⋮) */}
            <div
              className="mx-3 mb-3 mt-2 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: T.infoBg }}
            >
              {/* 새로고침 버튼 */}
              <button
                className="cc-btn w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer hover:opacity-70"
                style={{ color: T.textAccent }}
                onClick={fetchRates}
                title="환율 새로고침"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>

              {/* 환율 조회 시각 + 1단위 환율 */}
              <div className="flex flex-col items-center">
                {rateTime && (
                  <span className="text-xs font-semibold" style={{ color: "#30d158" }}>
                    {rateTime}
                  </span>
                )}
                {!loading && oneUnitRate > 0 ? (
                  <span className="text-xs" style={{ color: T.textSub }}>
                    1 {fromCurrency} = {formatRate(oneUnitRate)} {toCurrency}
                  </span>
                ) : loading ? (
                  <span className="text-xs" style={{ color: T.textSub }}>환율 로딩중...</span>
                ) : null}
              </div>

              {/* ⋮ 버튼 - From 통화 선택 */}
              <button
                className="cc-btn w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer hover:opacity-70"
                style={{ color: T.textSub }}
                onClick={() => openPicker("to")}
                title="변환 통화 변경"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="12" cy="19" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {/* 리사이즈 핸들 */}
          <div
            className="cc-resize absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20"
            onMouseDown={onMouseDownResize}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" className="absolute bottom-1 right-1" style={{ color: T.textSub }}>
              <path d="M14 2L2 14M14 8L8 14M14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      {/* 커서 깜빡임 애니메이션 */}
      <style>{`
        @keyframes cc-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}