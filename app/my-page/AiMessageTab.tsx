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
  User,
  Search,
  ChevronLeft,
  Menu,
  ChevronDown,
  Clock,
  X,
  MessageCircle,
  Send,
} from "lucide-react";
type KakaoSdk = { isInitialized: () => boolean; init: (key: string) => void; Share: { sendDefault: (options: { objectType: "text"; text: string; link: { webUrl: string; mobileWebUrl: string }; buttonTitle: string }) => void } };

const MESSAGE_GROUPS: { label: string; ids: MessageType[] }[] = [
  { label: "자주 사용", ids: ["daily_check", "longtime", "family_health", "morning"] },
  { label: "일상 · 안부", ids: ["moving", "travel", "vacation_return"] },
  { label: "기념일", ids: ["birthday", "birth_congrats", "marriage", "newyear_holiday", "chuseok", "christmas", "yearend", "newyear"] },
  { label: "계절 · 날씨", ids: ["spring", "summer", "autumn", "winter", "boknal", "heatwave", "rainy", "storm", "snow", "season_change", "first_snow", "dust"] },
  { label: "건강 · 병원", ids: ["cancer_check", "tax", "surgery", "after_hospital", "after_discharge", "after_accident"] },
  { label: "보험 · 업무", ids: ["policy_check", "car_renewal"] },
];
type RecentMessage = { type: MessageType; date: string };

// ─────────────────────────────────────────────
// 한국 공휴일 + 절기 + 기념일 데이터
// ─────────────────────────────────────────────


function getSeason(month: number): { name: string; emoji: string } {
  if (month >= 3 && month <= 5) return { name: "봄", emoji: "🌸" };
  if (month >= 6 && month <= 8) return { name: "여름", emoji: "☀️" };
  if (month >= 9 && month <= 11) return { name: "가을", emoji: "🍂" };
  return { name: "겨울", emoji: "❄️" };
}

export default function AiMessageTab({ active = true }: { active?: boolean }) {
  const { authUser } = useAuth();
  const today = new Date();

  const [messageType, setMessageType] = useState<MessageType>("daily_check");
  const [customerName, setCustomerName] = useState("");
  const [agentName, setAgentName] = useState(() => localStorage.getItem("agent-name") || "든든한 설계사");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [messageCreated, setMessageCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewInput, setPreviewInput] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [extraInfo, setExtraInfo] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  const generatingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => { const request = requestRef.current; requestRef.current = null; request?.abort(); }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  useEffect(() => { if (active) { setOpenGroups([]); setSearchQuery(""); } }, [active]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  useEffect(() => {
    setRecentMessages([]);
    if (!authUser) return;
    try { const saved = JSON.parse(localStorage.getItem(`ai-message-recent:${authUser.id}`) || "[]"); if (Array.isArray(saved)) setRecentMessages(saved.filter(item => MESSAGE_TYPES.some(type => type.id === item?.type) && typeof item?.date === "string").slice(0, 5)); } catch {}
  }, [authUser?.id]);
  const rememberMessage = () => {
    if (!authUser) return;
    setRecentMessages(previous => {
      const next = [{ type: messageType, date: new Date().toISOString() }, ...previous.filter(item => item.type !== messageType)].slice(0, 5);
      try { localStorage.setItem(`ai-message-recent:${authUser.id}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const selectMessage = (type: MessageType) => { setMessageType(type); setGeneratedMessage(""); setMessageCreated(false); setGenerationNotice(""); };
  const removeRecentMessage = (type: MessageType) => {
    setRecentMessages(previous => {
      const next = previous.filter(item => item.type !== type);
      if (authUser) { try { localStorage.setItem(`ai-message-recent:${authUser.id}`, JSON.stringify(next)); } catch {} }
      return next;
    });
  };

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
    const fallback = (notice: string) => { setGeneratedMessage(formatDisplayMessage(generateFallbackMessage(messageType, customerName.trim(), agentName, today, extraInfo))); setMessageCreated(true); rememberMessage(); setGenerationNotice(""); };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGenerationNotice("로그인 후 다시 이용해 주세요."); return; }
      const response = await fetch("/api/ai-message", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token }, body: JSON.stringify({ messageType, renewalDate: messageType === "car_renewal" ? extraInfo : "" }), signal: controller.signal });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) { setGenerationNotice(result.error || "로그인 상태를 확인해 주세요."); return; }
      if (!response.ok || !Array.isArray(result.paragraphs) || result.paragraphs.length < 2 || result.paragraphs.some((p: unknown) => typeof p !== "string" || !p.trim())) { fallback(result.error || "AI 연결이 원활하지 않아 기본 문구를 준비했어요."); return; }
      setGeneratedMessage(composeMessage(result.paragraphs, customerName, agentName));
      setMessageCreated(true);
      rememberMessage();
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
    if (!generatedMessage.trim() || generating) return;
    setShareNotice("");
    try {
      if (Array.from(generatedMessage).length > 200) { setShareNotice("카카오톡 기본 공유는 200자까지 가능합니다. 긴 메시지는 복사해 카카오톡에 붙여 넣어 주세요."); return; }
      const kakao = (window as Window & { Kakao?: KakaoSdk }).Kakao;
      if (!kakao) { setShareNotice("카카오톡 공유를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
      const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "518af1512d73dd3244aedb922e2a32ed";
      if (!kakao.isInitialized()) kakao.init(key);
      const url = window.location.origin;
      kakao.Share.sendDefault({ objectType: "text", text: generatedMessage, link: { webUrl: url, mobileWebUrl: url }, buttonTitle: "보험인사이트" });
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setShareNotice("공유 창을 열지 못했습니다."); }
  };
  const appendPreviewInput = () => {
    if (!previewInput.trim() || generating) return;
    setGeneratedMessage(previous => [previous, previewInput.trim()].filter(Boolean).join("\n\n"));
    setMessageCreated(true); setCopied(false); setPreviewInput("");
  };
 return (
  <div className="space-y-4">
    <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js" strategy="afterInteractive" integrity="sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E" crossOrigin="anonymous" />
    <h2 className="flex items-center gap-3 text-xl font-bold"><MessageCircle className="w-7 h-7 text-blue-500" />AI 메시지</h2>
  <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-3 items-start overflow-visible">

    <aside className="personal-grid min-w-0 xl:min-h-[690px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input disabled={generating} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="메시지 종류 검색" className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-blue-400" /></div>
      {MESSAGE_GROUPS.map(group => {
        const options = filteredTypes.filter(type => group.ids.includes(type.id));
        if (!options.length) return null;
        const expanded = !!searchQuery || openGroups.includes(group.label);
        return <div key={group.label} className="border-b border-gray-100 pb-2 mb-2"><button type="button" aria-expanded={expanded} onClick={() => setOpenGroups(previous => previous.includes(group.label) ? previous.filter(label => label !== group.label) : [...previous, group.label])} className="w-full flex items-center justify-between py-3 text-sm font-bold text-gray-900 cursor-pointer">{group.label}<ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && options.map(type => <button type="button" key={type.id} disabled={generating} onClick={() => selectMessage(type.id)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-50 ${type.id === messageType ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>{type.label}</button>)}</div>;
      })}
      <div className="hidden md:block mt-4 rounded-xl bg-gray-50 p-3"><h3 className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-3"><Clock className="w-4 h-4" />최근 사용한 메시지</h3>{recentMessages.length ? recentMessages.map(item => <div key={item.type} className="flex items-center gap-2"><button type="button" disabled={generating} onClick={() => selectMessage(item.type)} className="flex-1 min-w-0 flex items-center justify-between gap-2 py-2 text-xs text-gray-600 cursor-pointer"><span>{MESSAGE_TYPES.find(type => type.id === item.type)?.label}</span><span className="text-gray-400">{new Date(item.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span></button><button type="button" onClick={() => removeRecentMessage(item.type)} aria-label={`${MESSAGE_TYPES.find(type => type.id === item.type)?.label} 최근 사용 기록 삭제`} className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"><X className="w-3.5 h-3.5" /></button></div>) : <p className="text-xs text-gray-400">아직 사용한 메시지가 없습니다.</p>}</div>
    </aside>
    <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-3 items-stretch">
    {/* 가운데: 입력 및 메시지 편집 */}
    <div className="personal-grid flex flex-col min-w-0 h-[560px] md:h-[640px] gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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

<div>
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

{generationNotice && <p role="status" className="text-sm text-gray-500">{generationNotice}</p>}
      <div className="flex min-h-0 flex-1 flex-col">
        <label htmlFor="generated-message-editor" className="block text-sm font-bold text-gray-900 mb-3">생성된 메시지</label>
        <textarea id="generated-message-editor" value={generatedMessage} disabled={!messageCreated || generating} rows={10} placeholder="메시지를 생성한 뒤 여기에서 내용을 수정하세요." onChange={event => { setGeneratedMessage(event.target.value); setCopied(false); }} className="block w-full min-h-0 flex-1 resize-none overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 leading-7 outline-none focus:border-blue-400 disabled:bg-gray-50" />
      </div>
{/* 생성 버튼 */}
<button
  onClick={handleGenerate}
  disabled={generating}
  className="mt-auto shrink-0 w-full h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition bg-gray-900 text-white hover:bg-gray-800 shadow-sm cursor-pointer disabled:cursor-default"
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

    </div>

    {/* 오른쪽: 대화창 미리보기 */}
    <div className="personal-grid flex flex-col items-center w-full min-w-0 h-[640px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="w-full mb-3 text-sm font-bold text-gray-900">미리보기</h3>
      <div className="relative flex min-h-0 flex-1 w-full max-w-[350px] mx-auto">
        <div className="flex flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col flex-1 rounded-2xl overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[#b2c7d9]">
              <div className="flex items-center gap-3 px-4 py-4 text-gray-900">
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate text-sm font-semibold">{customerName.trim() ? `${customerName.trim()} 고객님` : "고객님"}</span>
                <Search className="w-4 h-4 shrink-0" />
                <Menu className="w-5 h-5 shrink-0" />
              </div>
              <div className={`${styles.previewScroll} flex-1 min-h-0 overflow-y-auto px-3 pb-6`}>
              <div className="text-center mb-6">
                <span className="text-[11px] text-gray-600 bg-black/10 px-3 py-1.5 rounded-full">
                  {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </span>
              </div>
              {messageCreated ? (
                <div className="flex items-end justify-end gap-1.5">
                    <span className="shrink-0 text-[10px] text-gray-600 pb-0.5">
                      {today.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </span>
                    <div className="relative w-[80%] min-w-0 bg-[#fee500] rounded-xl rounded-tr-sm px-3 py-3 shadow-sm before:absolute before:-right-1.5 before:top-0 before:border-t-[8px] before:border-t-[#fee500] before:border-r-[8px] before:border-r-transparent">
                      <p className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-wrap break-words cursor-default">{generatedMessage}</p>
                    </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[230px]">

                  <p className="text-[13px] text-gray-600 text-center">메시지를 생성하면<br />여기에 표시됩니다</p>
                </div>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border-t border-gray-100 p-2">
              <input aria-label="미리보기 메시지 입력" value={previewInput} onChange={event => setPreviewInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); appendPreviewInput(); } }} disabled={generating} placeholder="메시지를 입력하세요" className="min-w-0 flex-1 h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs outline-none focus:border-gray-400" />
              <button type="button" aria-label="카카오톡 공유" title="카카오톡 공유" onClick={handleShare} disabled={!generatedMessage.trim() || generating} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#fee500] text-gray-900 cursor-pointer disabled:opacity-40"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

        <button
          onClick={handleCopy}
          disabled={!generatedMessage.trim() || generating}
          className={`mt-4 shrink-0 w-full h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:cursor-default disabled:opacity-40 ${
            copied ? "bg-green-100 text-green-700" : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {copied ? <><Check className="w-5 h-5" /> 복사됨</> : <><Copy className="w-5 h-5" /> 메시지 복사하기</>}
        </button>


    </div>
    </div>
  </div>
  </div>
);
}
