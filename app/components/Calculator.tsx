"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";

type HistoryItem = {
  expression: string;
  result: string;
};

export default function Calculator() {
 

  const { authUser, authStatus } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);

  // 드래그 상태
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  // 리사이즈 상태
  const [size, setSize] = useState({ width: 340, height: 560 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // 초기 위치 설정 (화면 오른쪽 하단)
  useEffect(() => {
    if (!initialized) {
      setPos({
        x: window.innerWidth - 360,
        y: window.innerHeight - 600,
      });
      setInitialized(true);
    }
  }, [initialized]);

  

    // 외부에서 계산기 열기 (커스텀 이벤트)
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-calculator", handler);
    return () => window.removeEventListener("open-calculator", handler);
  }, []);






  // 드래그 핸들러
    const onMouseDownDrag = useCallback((e: React.MouseEvent) => {
    if (
  (e.target as HTMLElement).closest(".calc-btn") ||
  (e.target as HTMLElement).closest(".calc-resize") ||
  (e.target as HTMLElement).closest("input")
) return;
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }, [pos]);


  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y)),
        });
      }
      if (resizing.current) {
        const newW = Math.max(280, Math.min(600, resizeStart.current.w + (e.clientX - resizeStart.current.x)));
        const newH = Math.max(460, Math.min(800, resizeStart.current.h + (e.clientY - resizeStart.current.y)));
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


    


  // 리사이즈 핸들러
  const onMouseDownResize = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    e.preventDefault();
    e.stopPropagation();
  }, [size]);

  // 계산기 로직
  const formatNumber = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return num;
    return n.toLocaleString("ko-KR", { maximumFractionDigits: 10 });
  };

  const inputDigit = (digit: string) => {
    if (justCalculated) {
      setDisplay(digit);
      setExpression(digit);
      setJustCalculated(false);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      } else {
      const raw = display.replace(/,/g, "");
      if (raw === "0" && digit === "0") return;
      const newVal = raw === "0" ? digit : raw + digit;

      setDisplay(formatNumber(newVal));
      setExpression((prev) => {
        const parts = prev.split(/([+\-×÷])/);
        const last = parts[parts.length - 1];
        if (last === "0") {
          parts[parts.length - 1] = digit;
        } else {
          parts[parts.length - 1] = last + digit;
        }
        return parts.join("");
      });
    }
  };

  const inputDecimal = () => {
    if (justCalculated) {
      setDisplay("0.");
      setExpression("0.");
      setJustCalculated(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    const raw = display.replace(/,/g, "");
    if (!raw.includes(".")) {
      setDisplay(raw + ".");
    }
  };

  const handleOperator = (op: string) => {
    const raw = parseFloat(display.replace(/,/g, ""));
    if (prevValue !== null && !waitingForOperand) {
      const prev = parseFloat(prevValue);
      let result = 0;
      if (operator === "+") result = prev + raw;
      else if (operator === "-") result = prev - raw;
      else if (operator === "×") result = prev * raw;
      else if (operator === "÷") result = raw !== 0 ? prev / raw : 0;
      const resultStr = String(result);
      setDisplay(formatNumber(resultStr));
      setPrevValue(resultStr);
      setExpression(formatNumber(resultStr) + " " + op + " ");
    } else {
      setPrevValue(String(raw));
      setExpression(formatNumber(String(raw)) + " " + op + " ");
    }
    setOperator(op);
    setWaitingForOperand(true);
    setJustCalculated(false);
  };

  const calculate = () => {
    if (operator === null || prevValue === null) return;
    const raw = parseFloat(display.replace(/,/g, ""));
    const prev = parseFloat(prevValue);
    let result = 0;
    if (operator === "+") result = prev + raw;
    else if (operator === "-") result = prev - raw;
    else if (operator === "×") result = prev * raw;
    else if (operator === "÷") result = raw !== 0 ? prev / raw : 0;
    const resultStr = String(result);
    const expr = expression + " =";
    setHistory((h) => [{ expression: expr, result: formatNumber(resultStr) }, ...h].slice(0, 20));
    setDisplay(formatNumber(resultStr));
    setExpression(expr);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustCalculated(true);
  };

    const handlePercent = () => {
    const raw = parseFloat(display.replace(/,/g, ""));
    if (prevValue !== null && operator !== null) {
      // 앞 숫자의 %로 계산 (예: 885000 - 20% → 885000의 20% = 177000)
      const prev = parseFloat(prevValue);
      const result = (prev * raw) / 100;
      setDisplay(formatNumber(String(result)));
    } else {
      const result = raw / 100;
      setDisplay(formatNumber(String(result)));
    }
  };

  const handleBackspace = () => {
    if (justCalculated) { clear(); return; }
    const raw = display.replace(/,/g, "");
    if (raw.length <= 1) {
      setDisplay("0");
    } else {
      const newVal = raw.slice(0, -1);
      setDisplay(formatNumber(newVal));
    }
  };

  const clear = () => {
    setDisplay("0");
    setExpression("");
    setOperator(null);
    setPrevValue(null);
    setWaitingForOperand(false);
    setJustCalculated(false);
  };

  const toggleSign = () => {
    const raw = parseFloat(display.replace(/,/g, ""));
    setDisplay(formatNumber(String(-raw)));
  };

  const btnBase = "flex items-center justify-center rounded-2xl font-medium select-none cursor-default transition-all active:scale-95";
  const btnGray = `${btnBase} bg-[#f0f0f0] hover:bg-[#e0e0e0] text-black`;
  const btnDark = `${btnBase} bg-[#e8e8e8] hover:bg-[#d8d8d8] text-black`;
  const btnEqual = `${btnBase} bg-[#2d3250] hover:bg-[#1e2340] text-white`;

  const fontSize = size.width < 310 ? "text-4xl" : size.width < 380 ? "text-5xl" : "text-6xl";
  const btnSize = `h-[${Math.floor((size.height - 200) / 5)}px]`;

  // 승인 회원이 아니면 아무것도 렌더링하지 않음
     return (
    <>
     

            {/* 계산기 본체 */}
      {authUser && authStatus === "approved" && isOpen && initialized && (

                <div
          ref={calcRef}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key >= "0" && e.key <= "9") { inputDigit(e.key); return; }
            if (e.key === ".") { inputDecimal(); return; }
            if (e.key === "+") { handleOperator("+"); return; }
            if (e.key === "-") { handleOperator("-"); return; }
            if (e.key === "*") { handleOperator("×"); return; }
            
            if (e.key === "/") { e.preventDefault(); handleOperator("÷"); return; }
            if (e.key === "Enter" || e.key === "=") { calculate(); return; }
                        if (e.key === "%") { handlePercent(); return; }

            if (e.key === "Backspace") { handleBackspace(); return; }
            if (e.key === "Escape") { setIsOpen(false); return; }
            if (e.key === "Delete") { clear(); return; }
          }}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: size.width,
            height: size.height,
            zIndex: 9999,
            userSelect: "none",
          }}
          className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          onMouseDown={onMouseDownDrag}
        >

        
          {/* 히스토리 패널 */}
          {showHistory && (
            <div className="absolute inset-0 bg-white rounded-3xl z-10 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">계산 기록</span>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 calc-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">기록이 없습니다</div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 calc-btn"
                      onClick={() => {
                        setDisplay(h.result.replace(/,/g, "") !== "" ? h.result : "0");
                        setJustCalculated(true);
                        setShowHistory(false);
                      }}
                    >
                      <div className="text-xs text-gray-400">{h.expression}</div>
                      <div className="text-lg font-semibold text-right">{h.result}</div>
                    </div>
                  ))}
                </div>
              )}
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="mt-3 text-sm text-red-400 hover:text-red-600 calc-btn"
                >
                  기록 전체 삭제
                </button>
              )}
            </div>
          )}

          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="10" y2="10"/>
                <line x1="12" y1="10" x2="14" y2="10"/>
                <line x1="16" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="10" y2="14"/>
                <line x1="12" y1="14" x2="14" y2="14"/>
                <line x1="16" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="10" y2="18"/>
                <line x1="12" y1="18" x2="14" y2="18"/>
                <line x1="16" y1="18" x2="16" y2="18"/>
              </svg>
              <span className="font-semibold text-gray-700 text-sm"> 계산기</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="calc-btn w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={() => setIsOpen(false)}
                className="calc-btn w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

                    {/* 디스플레이 */}
          <div
  className="mx-4 mb-3 bg-[#f7f7f7] rounded-2xl px-5 py-4 flex flex-col justify-between border border-transparent focus-within:border-gray-300 transition"
  style={{ minHeight: 100 }}
>
            <div className="text-gray-400 text-sm truncate">{expression || "\u00A0"}</div>
                                   <input
              readOnly
              value={display}
              className={`font-light text-right text-gray-900 truncate ${fontSize} bg-transparent outline-none w-full cursor-text select-all`}
            />


          </div>


          {/* 버튼 그리드 */}
          <div className="flex-1 grid grid-cols-4 gap-2 px-4 pb-4" style={{ gridTemplateRows: "repeat(5, 1fr)" }}>
            {/* Row 1 */}
            <button className={`${btnGray} calc-btn`} onClick={handleBackspace}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
            </button>
            <button className={`${btnGray} calc-btn`} onClick={clear}>AC</button>
            <button className={`${btnGray} calc-btn`} onClick={handlePercent}>%</button>
            <button className={`${btnDark} calc-btn`} onClick={() => handleOperator("÷")}>÷</button>

            {/* Row 2 */}
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("7")}>7</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("8")}>8</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("9")}>9</button>
            <button className={`${btnDark} calc-btn`} onClick={() => handleOperator("×")}>×</button>

            {/* Row 3 */}
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("4")}>4</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("5")}>5</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("6")}>6</button>
            <button className={`${btnDark} calc-btn`} onClick={() => handleOperator("-")}>−</button>

            {/* Row 4 */}
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("1")}>1</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("2")}>2</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("3")}>3</button>
            <button className={`${btnDark} calc-btn`} onClick={() => handleOperator("+")}>+</button>

            {/* Row 5 */}
            <button className={`${btnGray} calc-btn`} onClick={toggleSign}>+/−</button>
            <button className={`${btnGray} calc-btn`} onClick={() => inputDigit("0")}>0</button>
            <button className={`${btnGray} calc-btn`} onClick={inputDecimal}>.</button>
            <button className={`${btnEqual} calc-btn`} onClick={calculate}>=</button>
          </div>

          {/* 리사이즈 핸들 */}
          <div
            className="calc-resize absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
            onMouseDown={onMouseDownResize}
            style={{ zIndex: 10 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-1 right-1 text-gray-300">
              <path d="M14 2L2 14M14 8L8 14M14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
    </>
  );
}