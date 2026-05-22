"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";

// Frankfurter API 지원 통화 목록 (30개)
const CURRENCIES: { code: string; name: string; flag: string }[] = [
  { code: "KRW", name: "대한민국 원", flag: "🇰🇷" },
  { code: "USD", name: "미국 달러", flag: "🇺🇸" },
  { code: "EUR", name: "유로", flag: "🇪🇺" },
  { code: "JPY", name: "일본 엔화", flag: "🇯🇵" },
  { code: "CNY", name: "중국 위안화", flag: "🇨🇳" },
  { code: "GBP", name: "영국 파운드", flag: "🇬🇧" },
  { code: "AUD", name: "호주 달러", flag: "🇦🇺" },
  { code: "CAD", name: "캐나다 달러", flag: "🇨🇦" },
  { code: "CHF", name: "스위스 프랑", flag: "🇨🇭" },
  { code: "HKD", name: "홍콩 달러", flag: "🇭🇰" },
  { code: "SGD", name: "싱가포르 달러", flag: "🇸🇬" },
  { code: "THB", name: "태국 바트", flag: "🇹🇭" },
  { code: "VND", name: "베트남 동", flag: "🇻🇳" },
  { code: "MYR", name: "말레이시아 링깃", flag: "🇲🇾" },
  { code: "PHP", name: "필리핀 페소", flag: "🇵🇭" },
  { code: "IDR", name: "인도네시아 루피아", flag: "🇮🇩" },
  { code: "INR", name: "인도 루피", flag: "🇮🇳" },
  { code: "TWD", name: "신 타이완 달러", flag: "🇹🇼" },
  { code: "NZD", name: "뉴질랜드 달러", flag: "🇳🇿" },
  { code: "SEK", name: "스웨덴 크로나", flag: "🇸🇪" },
  { code: "NOK", name: "노르웨이 크로네", flag: "🇳🇴" },
  { code: "DKK", name: "덴마크 크로네", flag: "🇩🇰" },
  { code: "MXN", name: "멕시코 페소", flag: "🇲🇽" },
  { code: "BRL", name: "브라질 헤알", flag: "🇧🇷" },
  { code: "ZAR", name: "남아공 랜드", flag: "🇿🇦" },
  { code: "TRY", name: "터키 리라", flag: "🇹🇷" },
  { code: "PLN", name: "폴란드 즐로티", flag: "🇵🇱" },
  { code: "HUF", name: "헝가리 포린트", flag: "🇭🇺" },
  { code: "CZK", name: "체코 코루나", flag: "🇨🇿" },
  { code: "ILS", name: "이스라엘 셰켈", flag: "🇮🇱" },
];

// 숫자 포맷 (소수점 처리)
function formatAmount(value: number, code: string): string {
  if (isNaN(value)) return "0";
  // 소수점 없는 통화
  const noDecimal = ["KRW", "JPY", "IDR", "VND", "HUF"];
  if (noDecimal.includes(code)) {
    return Math.round(value).toLocaleString("ko-KR");
  }
  return value.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function CurrencyConverter() {
  const { authUser, authStatus } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 드래그
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  // 리사이즈
  const [size, setSize] = useState({ width: 340, height: 580 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // 환율 상태
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rateDate, setRateDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // 입력 상태
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KRW");
  const [inputValue, setInputValue] = useState("1"); // 위쪽 (from) 입력값
  const [activeInput, setActiveInput] = useState<"from" | "to">("from"); // 현재 입력 중인 쪽

  // 통화 선택 팝업
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to">("from");
  const [searchQuery, setSearchQuery] = useState("");

  // 초기 위치 (기존 계산기와 겹치지 않게 왼쪽에 배치)
  useEffect(() => {
    if (!initialized) {
      setPos({
        x: 20,
        y: window.innerHeight - 620,
      });
      setInitialized(true);
    }
  }, [initialized]);

  // 외부 이벤트로 열기
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-currency-converter", handler);
    return () => window.removeEventListener("open-currency-converter", handler);
  }, []);

  // 환율 데이터 가져오기 (Frankfurter API)
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=USD");
      const data = await res.json();
      // USD 기준 rates에 USD 자신도 추가
      const allRates: Record<string, number> = { ...data.rates, USD: 1 };
      setRates(allRates);
      setRateDate(data.date);
      setLastFetched(new Date());
    } catch (e) {
      console.error("환율 데이터 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && Object.keys(rates).length === 0) {
      fetchRates();
    }
  }, [isOpen, rates, fetchRates]);

  // 환율 계산
  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      if (!rates[from] || !rates[to]) return 0;
      // USD 기준으로 변환
      const inUSD = amount / rates[from];
      return inUSD * rates[to];
    },
    [rates]
  );

  // 현재 표시값 계산
  const fromAmount = activeInput === "from" ? parseFloat(inputValue.replace(/,/g, "")) || 0 : parseFloat(inputValue.replace(/,/g, "")) || 0;
  const toAmount = convert(fromAmount, fromCurrency, toCurrency);
  const fromAmountForDisplay = activeInput === "to"
    ? convert(parseFloat(inputValue.replace(/,/g, "")) || 0, toCurrency, fromCurrency)
    : fromAmount;
  const toAmountForDisplay = activeInput === "from"
    ? toAmount
    : parseFloat(inputValue.replace(/,/g, "")) || 0;

  // 1단위 환율 표시
  const oneUnitRate = convert(1, fromCurrency, toCurrency);

  // 드래그
  const onMouseDownDrag = useCallback(
    (e: React.MouseEvent) => {
      if (
        (e.target as HTMLElement).closest(".cc-btn") ||
        (e.target as HTMLElement).closest(".cc-resize") ||
        (e.target as HTMLElement).closest("input")
      )
        return;
      dragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    },
    [pos]
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
        const newH = Math.max(520, Math.min(750, resizeStart.current.h + (e.clientY - resizeStart.current.y)));
        setSize({ width: newW, height: newH });
      }
    };
    const onMouseUp = () => {
      dragging.current = false;
      resizing.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [size]);

  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      resizing.current = true;
      resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
      e.preventDefault();
      e.stopPropagation();
    },
    [size]
  );

  // 숫자 버튼 입력
  const handleDigit = (d: string) => {
    setInputValue((prev) => {
      const raw = prev.replace(/,/g, "");
      if (raw === "0" && d !== ".") return d;
      if (d === "." && raw.includes(".")) return prev;
      return raw + d;
    });
  };

  const handleBackspace = () => {
    setInputValue((prev) => {
      const raw = prev.replace(/,/g, "");
      if (raw.length <= 1) return "0";
      return raw.slice(0, -1);
    });
  };

  const handleClear = () => setInputValue("0");

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setActiveInput("from");
    setInputValue("1");
  };

  // 통화 선택 팝업 열기
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

  const fromCurrencyInfo = CURRENCIES.find((c) => c.code === fromCurrency)!;
  const toCurrencyInfo = CURRENCIES.find((c) => c.code === toCurrency)!;

  // 버튼 스타일 (어두운 테마)
  const btnBase = "flex items-center justify-center rounded-2xl font-medium select-none cursor-default transition-all active:scale-95 text-xl";
  const btnNum = `${btnBase} bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white cc-btn`;
  const btnFunc = `${btnBase} bg-[#636366] hover:bg-[#737376] text-white cc-btn`;
  const btnOrange = `${btnBase} bg-[#ff9f0a] hover:bg-[#e8900a] text-white cc-btn`;

  const fontSize = size.width < 340 ? "text-4xl" : "text-5xl";

  if (!authUser || authStatus !== "approved") return null;

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
          }}
          className="rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          onMouseDown={onMouseDownDrag}
        >
          {/* 배경 */}
          <div className="absolute inset-0 bg-[#1c1c1e] rounded-3xl" />

          {/* 통화 선택 팝업 */}
          {showCurrencyPicker && (
            <div className="absolute inset-0 bg-[#1c1c1e] rounded-3xl z-20 flex flex-col">
              {/* 헤더 */}
              <div className="flex items-center px-5 pt-5 pb-3 relative">
                <button
                  className="cc-btn text-[#ff9f0a] text-base font-medium absolute left-5"
                  onClick={() => setShowCurrencyPicker(false)}
                >
                  ‹ 뒤로
                </button>
                <span className="font-bold text-white text-base w-full text-center">통화</span>
              </div>
              {/* 검색 */}
              <div className="px-4 mb-3">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#2c2c2e] text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none"
                  autoFocus
                />
              </div>
              {/* 목록 */}
              <div className="flex-1 overflow-y-auto px-2">
                {filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    className="cc-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#2c2c2e] transition text-left"
                    onClick={() => selectCurrency(c.code)}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <span className="flex-1 text-white text-sm font-medium">{c.name}</span>
                    <span className="text-gray-500 text-sm font-bold">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메인 컨텐츠 */}
          <div className="relative z-10 flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">환율 변환기</span>
              </div>
              <button
                className="cc-btn w-8 h-8 rounded-full hover:bg-[#2c2c2e] flex items-center justify-center text-gray-400 hover:text-white transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 디스플레이 영역 */}
            <div className="mx-3 mb-2 rounded-2xl overflow-hidden border border-[#2c2c2e]">
              {/* From 통화 */}
              <button
                className={`cc-btn w-full flex items-center px-5 py-4 transition ${activeInput === "from" ? "bg-[#2c2c2e]" : "bg-[#252527] hover:bg-[#2c2c2e]"}`}
                onClick={() => setActiveInput("from")}
              >
                <div className="flex flex-col items-start gap-0.5 min-w-[70px]">
                  <button
                    className="cc-btn flex items-center gap-2 hover:opacity-80 transition"
                    onClick={(e) => { e.stopPropagation(); openPicker("from"); }}
                  >
                    <span className="text-2xl">{fromCurrencyInfo.flag}</span>
                    <span className="text-white font-bold text-sm">{fromCurrency}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`flex-1 text-right font-light ${fontSize} ${activeInput === "from" ? "text-white" : "text-gray-400"} truncate`}>
                  {formatAmount(fromAmountForDisplay, fromCurrency)}
                </div>
              </button>

              {/* 구분선 + 스왑 버튼 */}
              <div className="relative h-px bg-[#3a3a3c]">
                <button
                  className="cc-btn absolute right-5 -top-4 w-8 h-8 bg-[#3a3a3c] hover:bg-[#4a4a4c] rounded-full flex items-center justify-center transition"
                  onClick={handleSwap}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" strokeWidth="2.5">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              </div>

              {/* To 통화 */}
              <button
                className={`cc-btn w-full flex items-center px-5 py-4 transition ${activeInput === "to" ? "bg-[#2c2c2e]" : "bg-[#252527] hover:bg-[#2c2c2e]"}`}
                onClick={() => setActiveInput("to")}
              >
                <div className="flex flex-col items-start gap-0.5 min-w-[70px]">
                  <button
                    className="cc-btn flex items-center gap-2 hover:opacity-80 transition"
                    onClick={(e) => { e.stopPropagation(); openPicker("to"); }}
                  >
                    <span className="text-2xl">{toCurrencyInfo.flag}</span>
                    <span className="text-white font-bold text-sm">{toCurrency}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className={`flex-1 text-right font-light ${fontSize} ${activeInput === "to" ? "text-white" : "text-gray-400"} truncate`}>
                  {loading ? (
                    <span className="text-gray-500 text-2xl">로딩중...</span>
                  ) : (
                    formatAmount(toAmountForDisplay, toCurrency)
                  )}
                </div>
              </button>
            </div>

            {/* 환율 정보 바 */}
            <div className="mx-3 mb-2 flex items-center justify-between px-4 py-2 rounded-xl bg-[#252527]">
              <button className="cc-btn text-[#ff9f0a] hover:opacity-80 transition" onClick={fetchRates} title="환율 새로고침">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
              <div className="text-center">
                {rateDate && (
                  <div className="text-[#ff9f0a] text-xs font-medium">
                    {rateDate} 기준
                  </div>
                )}
                {!loading && oneUnitRate > 0 && (
                  <div className="text-gray-400 text-xs">
                    1 {fromCurrency} = {formatAmount(oneUnitRate, toCurrency)} {toCurrency}
                  </div>
                )}
              </div>
              <button
                className="cc-btn text-gray-500 hover:text-gray-300 transition"
                onClick={() => {
                  setFromCurrency("USD");
                  setToCurrency("KRW");
                  setInputValue("1");
                  setActiveInput("from");
                }}
                title="초기화"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              </button>
            </div>

            {/* 키패드 */}
            <div
              className="flex-1 grid grid-cols-4 gap-2 px-3 pb-3"
              style={{ gridTemplateRows: "repeat(5, 1fr)" }}
            >
              {/* Row 1: C, ←, ↑↓(swap), ÷ */}
              <button className={`${btnFunc} cc-btn`} onClick={handleClear}>C</button>
              <button className={`${btnFunc} cc-btn`} onClick={handleBackspace}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
              <button className={`${btnFunc} cc-btn`} onClick={handleSwap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
              <button className={`${btnOrange} cc-btn`} onClick={() => {
                // 통화 선택 토글 (from/to 전환)
                setActiveInput(a => a === "from" ? "to" : "from");
                setInputValue("0");
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>

              {/* Row 2 */}
              <button className={`${btnNum}`} onClick={() => handleDigit("7")}>7</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("8")}>8</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("9")}>9</button>
              <button className={`${btnOrange} cc-btn`} onClick={() => openPicker("from")}>
                <span className="text-base">{fromCurrencyInfo.flag}</span>
              </button>

              {/* Row 3 */}
              <button className={`${btnNum}`} onClick={() => handleDigit("4")}>4</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("5")}>5</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("6")}>6</button>
              <button className={`${btnOrange} cc-btn`} onClick={() => openPicker("to")}>
                <span className="text-base">{toCurrencyInfo.flag}</span>
              </button>

              {/* Row 4 */}
              <button className={`${btnNum}`} onClick={() => handleDigit("1")}>1</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("2")}>2</button>
              <button className={`${btnNum}`} onClick={() => handleDigit("3")}>3</button>
              <button className={`${btnOrange} cc-btn`} onClick={handleSwap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>

              {/* Row 5 */}
              <button className={`${btnNum}`} onClick={() => handleDigit("0")}>0</button>
              <button className={`${btnNum}`} onClick={() => handleDigit(".")}>.</button>
              <button className={`col-span-2 ${btnOrange} cc-btn`} onClick={() => {
                setActiveInput(a => a === "from" ? "to" : "from");
                setInputValue("0");
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* 리사이즈 핸들 */}
          <div
            className="cc-resize absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20"
            onMouseDown={onMouseDownResize}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-1 right-1 text-gray-600">
              <path d="M14 2L2 14M14 8L8 14M14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}