"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import styles from "./AiMessageTab.module.css";
import { composeMessage, formatDisplayMessage } from "@/lib/ai-messages/format";
import { generateFallbackMessage } from "@/lib/ai-messages/fallback";
import { MESSAGE_TYPES, type MessageType } from "@/lib/ai-messages/types";
import { supabase } from "@/lib/supabase";
import { getTodaySpecialDays } from "@/lib/specialDays";
import { useAuth } from "@/app/components/AuthProvider";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  User,
  Search,
} from "lucide-react";

type KakaoShareSdk = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: { sendDefault: (settings: { objectType: "text"; text: string; link: { webUrl: string; mobileWebUrl: string }; buttonTitle: string }) => void };
};
const getKakaoSdk = () => (window as Window & { Kakao?: KakaoShareSdk }).Kakao;

// ─────────────────────────────────────────────
// 한국 공휴일 + 절기 + 기념일 데이터
// ─────────────────────────────────────────────


function getSeason(month: number): { name: string; emoji: string } {
  if (month >= 3 && month <= 5) return { name: "봄", emoji: "🌸" };
  if (month >= 6 && month <= 8) return { name: "여름", emoji: "☀️" };
  if (month >= 9 && month <= 11) return { name: "가을", emoji: "🍂" };
  return { name: "겨울", emoji: "❄️" };
}

export default function AiMessageTab() {
  const { authUser } = useAuth();
  const today = new Date();

  const [messageType, setMessageType] = useState<MessageType>("daily_check");
  const [customerName, setCustomerName] = useState("");
  const [agentName, setAgentName] = useState(() => localStorage.getItem("agent-name") || "");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [messageCreated, setMessageCreated] = useState(false);
  const messageEditorRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [extraInfo, setExtraInfo] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  const generatingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => { const request = requestRef.current; requestRef.current = null; request?.abort(); }, []);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const resizeEditor = () => {
      const editor = messageEditorRef.current;
      if (!editor) return;
      editor.style.height = "auto";
      editor.style.height = `${editor.scrollHeight}px`;
    };
    resizeEditor();
    window.addEventListener("resize", resizeEditor);
    return () => window.removeEventListener("resize", resizeEditor);
  }, [generatedMessage, messageCreated]);

  const specialDays = getTodaySpecialDays(today);
  const season = getSeason(today.getMonth() + 1);
  const filteredTypes = MESSAGE_TYPES.filter(t => t.label.includes(searchQuery));

  useEffect(() => {
    if (!authUser) return;
    fetchAgentName();
  }, [authUser]);

  const fetchAgentName = async () => {
    const { data: settings } = await supabase
      .from("customer_settings")
      .select("agent_name")
      .eq("user_id", authUser!.id)
      .single();
    if (settings?.agent_name) setAgentName(settings.agent_name);
  };

  const handleGenerate = async () => {
    if (generatingRef.current) return;
    if (messageType === "car_renewal" && extraInfo && extraInfo !== "-") { const [month, day] = extraInfo.split("-").map(Number); if (!(month >= 1 && month <= 12 && day >= 1 && day <= new Date(2000, month, 0).getDate())) { setGenerationNotice("갱신일의 월과 일을 확인하시기 바랍니다."); return; } }
    generatingRef.current = true; setGenerating(true); setGenerationNotice(""); setCopied(false);
    const controller = new AbortController(); requestRef.current = controller;
    const timer = setTimeout(() => controller.abort(), 28000);
    const fallback = (notice: string) => { setGeneratedMessage(formatDisplayMessage(generateFallbackMessage(messageType, customerName.trim(), agentName, today, extraInfo))); setMessageCreated(true); setGenerationNotice(""); };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGenerationNotice("로그인 후 다시 이용해 주세요."); return; }
      const response = await fetch("/api/ai-message", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ messageType, renewalDate: messageType === "car_renewal" ? extraInfo : "" }), signal: controller.signal });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) { setGenerationNotice(result.error || "로그인 상태를 확인해 주세요."); return; }
      if (!response.ok || !Array.isArray(result.paragraphs) || result.paragraphs.length < 2 || result.paragraphs.some((p: unknown) => typeof p !== "string" || !p.trim())) { fallback(result.error || "AI 연결이 원활하지 않아 기본 문구를 준비했어요."); return; }
      setGeneratedMessage(composeMessage(result.paragraphs, customerName, agentName)); 
      setMessageCreated(true);
    } catch { if (requestRef.current === controller) fallback("AI 연결이 원활하지 않아 기본 문구를 준비했어요."); }
    finally { clearTimeout(timer); if (requestRef.current === controller) { requestRef.current = null; generatingRef.current = false; setGenerating(false); } }
  };
  const handleCopy = async () => {
    if (!generatedMessage.trim() || generating) return;
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = async () => {
    if (!generatedMessage.trim() || generating || sharing) return;
    setShareNotice("");
    setSharing(true);
    try {
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share({ text: generatedMessage });
        return;
      }
      if (Array.from(generatedMessage).length > 200) {
        setShareNotice("카카오톡 기본 공유는 200자까지 가능합니다. 긴 문자는 모바일 공유 또는 문자 내용 복사를 이용해 주세요.");
        return;
      }
      const kakao = getKakaoSdk();
      if (!kakao) {
        setShareNotice("카카오톡 공유를 준비하지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      if (!kakao.isInitialized()) kakao.init(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "518af1512d73dd3244aedb922e2a32ed");
      const url = window.location.origin;
      kakao.Share.sendDefault({ objectType: "text", text: generatedMessage, link: { webUrl: url, mobileWebUrl: url }, buttonTitle: "보험인사이트" });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setShareNotice("공유 창을 열지 못했습니다. 문자 내용 복사를 이용해 주세요.");
    } finally {
      setSharing(false);
    }
  };

 return (
  <div className="flex flex-col lg:flex-row gap-6 lg:gap-20 items-start overflow-visible">
    <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js" strategy="afterInteractive" integrity="sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E" crossOrigin="anonymous" />

    {/* 왼쪽: 입력 폼 */}
    <div className="flex-1 space-y-4">
      {/* 오늘의 특별한 날 배지 */}
      {specialDays.length > 0 && (
        <div className="flex flex-wrap gap-2">
{specialDays.map((d, i) => (
  <span
    key={i}
    className="
      group
      relative
      inline-flex
      items-center
      justify-center
      gap-1
      text-xs
      bg-amber-50
      border
      border-amber-200
      text-amber-700
      px-2.5
      py-1
      rounded-full
      font-medium
      transition-all
      duration-300
     
      hover:shadow-sm
      hover:bg-sky-50
      hover:border-sky-200
      hover:text-sky-700
    "
  >
   <span className="group-hover:opacity-0 text-xs font-medium">
      {d.emoji} {d.label}
    </span>

    <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
      📅 {new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2,"0")}.{String(new Date().getDate()).padStart(2,"0")}
    </span>
  </span>
))}
        </div>
      )}

      {/* 이름 입력 */}
<div className="grid grid-cols-2 gap-3">
  <div className="personal-grid bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <label className="text-sm font-bold text-gray-500 block mb-2">설계사 이름</label>
    <input
        disabled={generating}
      type="text"
      value={agentName}
      onChange={(e) => {
  setAgentName(e.target.value);
  localStorage.setItem("agent-name", e.target.value);
}}
      placeholder="설계사 이름"
      className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition"
    />
  </div>

  <div className="personal-grid bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <label className="text-sm font-bold text-gray-500 block mb-2">고객 이름</label>
    <div className="relative">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        disabled={generating}
        type="text"
        value={customerName}
        onChange={(e) => {
          setCustomerName(e.target.value);
          setGeneratedMessage(""); setMessageCreated(false); setGenerationNotice("");
        }}
        placeholder="고객 이름"
        className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition"
      />
    </div>
  </div>
</div>

{/* 메시지 종류 선택 */}
<div className="personal-grid bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
  <label className="text-sm font-bold text-gray-500 block mb-3">메시지 종류</label>

  <div className="mb-3 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
    <input
        disabled={generating}
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="메시지 종류 검색"
      className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition"
    />
  </div>

  <div className="grid grid-cols-4 gap-1.5 md:gap-2">
    {filteredTypes.map((t) => (
      <button
        disabled={generating}
        key={t.id}
        onClick={() => {
          setMessageType(t.id);
          setGeneratedMessage(""); setMessageCreated(false); setGenerationNotice("");
        }}
        className={`h-10 md:h-13 rounded-xl text-[12px] md:text-[13px] font-semibold flex items-center justify-center transition ${
          messageType === t.id
            ? "bg-gray-900 text-white"
            : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-400"
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>

  {messageType === "car_renewal" && (
    <div className="mt-3">
      <label className="text-xs text-gray-400 block mb-1.5">
        자동차보험 갱신일
      </label>
      <div className="flex items-center gap-2 h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus-within:border-blue-400">
        <input aria-label="갱신 월" inputMode="numeric" disabled={generating} value={extraInfo.split("-")[0] || ""} onChange={event => { const value = event.target.value.replace(/\D/g, "").slice(0, 2); setExtraInfo(value + "-" + (extraInfo.split("-")[1] || "")); if (value.length === 2) event.currentTarget.parentElement?.querySelector<HTMLInputElement>('[aria-label="갱신 일"]')?.focus(); }} placeholder="MM" className="w-10 bg-transparent text-center outline-none" /><span>월</span>
        <input aria-label="갱신 일" inputMode="numeric" disabled={generating} value={extraInfo.split("-")[1] || ""} onChange={event => setExtraInfo((extraInfo.split("-")[0] || "") + "-" + event.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="DD" className="w-10 bg-transparent text-center outline-none" /><span>일</span>
      </div>
    </div>
  )}
</div>

{/* 생성 버튼 */}
<button
  onClick={handleGenerate}
  disabled={generating}
  className="w-full h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition bg-gray-900 text-white hover:bg-gray-800 shadow-sm cursor-pointer disabled:cursor-default"
>
  {generating ? (
    <>
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      생성 중...
    </>
  ) : messageCreated ? (
    <>
      <RefreshCw className="w-5 h-5" />
      다시 생성
    </>
  ) : (
    <>
      <Sparkles className="w-5 h-5" />
      메시지 생성
    </>
  )}
</button>
{generationNotice && <p role="status" className="text-sm text-gray-500">{generationNotice}</p>}
    </div>

    {/* 오른쪽: 휴대폰 미리보기 (항상 표시) */}
    <div className="flex flex-col items-center lg:sticky lg:top-4 lg:scale-[1.3] lg:origin-top w-full lg:w-[300px] lg:shrink-0">
      <div className="relative w-full max-w-[350px] mx-auto">
        <div className="bg-gray-900 rounded-[50px] p-3 shadow-2xl">
          <div className="bg-gray-800 rounded-[32px] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <span className="text-white text-[14px] font-semibold">
                {today.getHours().toString().padStart(2, "0")}:{today.getMinutes().toString().padStart(2, "0")}
              </span>
              <div className="w-16 h-4 bg-gray-900 rounded-full" />
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 bg-white rounded-sm opacity-80" />
                <div className="w-1 h-1 bg-white rounded-full opacity-80" />
              </div>
            </div>
            <div className={styles.phoneScroll + " bg-gray-100 h-[550px] lg:h-[450px] overflow-y-auto px-4 py-4"}>


              <div className="text-center mb-3">
                <span className="text-[12px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  {customerName || "고객"}
                </span>
              </div>
              {messageCreated ? (
                <div className="flex justify-start">
                  <div className="w-full min-w-0">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                      <textarea
                        ref={messageEditorRef}
                        aria-label="문자 내용 수정"
                        value={generatedMessage}
                        disabled={generating}
                        rows={1}
                        placeholder="문자 내용을 입력하세요"
                        onChange={(event) => {
                          setGeneratedMessage(event.target.value);
                          setCopied(false);
                          setShareNotice("");
                        }}
                        className="block w-full min-h-12 resize-none overflow-hidden border-0 bg-transparent p-0 text-[13px] md:text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap font-sans outline-none focus:ring-1 focus:ring-blue-200 rounded-sm"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block ml-1">
                      {today.getMonth() + 1}/{today.getDate()}{" "}
                      {today.getHours().toString().padStart(2, "0")}:{today.getMinutes().toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">

                  <p className="text-[13px] text-gray-400 text-center">메시지를 생성하면  
여기에 표시됩니다</p>
                </div>
              )}
            </div>
            <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-gray-100">
              <div className="flex-1 h-8 bg-gray-100 rounded-full px-3 flex items-center">
                <span className="text-[12px] text-gray-400">메시지 입력</span>
              </div>
              <button
                type="button"
                aria-label="카카오톡으로 문자 공유"
                title="카카오톡으로 문자 공유"
                onClick={handleShare}
                disabled={!generatedMessage.trim() || generating || sharing}
                className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 disabled:opacity-40 disabled:cursor-default transition"
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-1.5 top-24 w-1 h-10 bg-gray-700 rounded-r-full" />
        <div className="absolute -left-1.5 top-20 w-1 h-7 bg-gray-700 rounded-l-full" />
        <div className="absolute -left-1.5 top-32 w-1 h-7 bg-gray-700 rounded-l-full" />
      </div>
      {messageCreated && (
        <p className="mt-3 text-[11px] text-gray-500">문자를 눌러 직접 수정할 수 있습니다</p>
      )}
      {messageCreated && (
        <button
          onClick={handleCopy}
          disabled={!generatedMessage.trim() || generating}
          className={`mt-3 flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer disabled:cursor-default disabled:opacity-40 ${
            copied ? "bg-green-100 text-green-700" : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 문자 내용 복사</>}
        </button>
      )}
      {shareNotice && <p role="status" className="mt-3 max-w-[350px] text-xs text-gray-500 text-center">{shareNotice}</p>}

    </div>
  </div>
);
}
