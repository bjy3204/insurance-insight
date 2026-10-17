"use client";
import { useEffect, useState } from "react";
import { Copy, Check, MessageCircle, RefreshCw, ChevronLeft, Search, Menu } from "lucide-react";

const greetings=[
  "안녕하세요 😊\n요즘 어떻게 지내고 계세요?\n문득 생각나서 안부 인사드려요\n\n하시는 일도 일상도 무탈하게 이어가고 계신가요?\n바쁜 날에는 식사나 쉬는 시간을 놓치기 쉬운 것 같아요\n오늘은 따뜻한 밥 한 끼 드시고 잠깐이라도 숨 돌리셨으면 해요\n\n일과를 마친 뒤에는 좋아하는 일로 하루를 마무리하시고\n남은 시간도 편안하게 보내세요 🌿",
  "잘 지내고 계시죠? 😊\n한동안 인사를 못 드린 것 같아 연락드려요\n그사이 어떻게 지내셨는지 궁금하네요\n\n요즘 하시는 일은 잘 풀리고 계신가요?\n바쁠수록 내 몸이 보내는 신호는 놓치기 쉬운 것 같아요\n피곤한 날에는 잠깐 쉬어가셔도 괜찮으니 너무 무리하지 마세요\n\n끼니 거르지 마시고 오늘도 건강 잘 챙기시면서\n편안한 하루 보내셨으면 좋겠어요 🍀",
  "안녕하세요 😊\n오늘 하루는 어떻게 보내고 계세요?\n잠시 안부 전하고 싶어 메시지 남겨요\n\n늘 비슷한 하루 같아도 반가운 연락 하나가 기분을 바꿔주기도 하더라고요\n이 인사가 잠깐이나마 반가운 소식이 되었으면 좋겠어요\n시간 되실 때 요즘 지내시는 이야기도 들려주세요\n\n오늘은 작은 일에도 웃을 수 있는 순간이 있으시길 바라며\n남은 하루도 기분 좋게 보내세요",
  "안녕하세요 😊\n별일 없이 잘 지내고 계신가요?\n가족분들도 모두 평안하신지 궁금하네요\n\n각자 바쁘게 지내다 보면 함께하는 시간이 금방 지나가는 것 같아요\n오늘은 가족분들과 맛있는 식사도 하시고\n별것 아닌 이야기라도 편하게 나누는 시간 가지셨으면 좋겠어요\n\n일과를 마치고 돌아가는 길도 조심하시고\n따뜻하고 편안한 저녁 보내세요",
  "문득 생각나서 인사드려요 😊\n요즘 많이 바쁘신가요?\n하루하루 어떻게 지내고 계신지 궁금해요\n\n바쁜 날이 이어지면 나를 챙기는 일은 자꾸 뒤로 미뤄지더라고요\n오늘은 좋아하는 차 한 잔 드시면서 잠깐 쉬어가셨으면 해요\n짧은 산책이나 좋아하는 음악으로 기분 전환도 해보시고요\n\n해야 할 일은 많아도 너무 무리하지 않으셨으면 좋겠어요\n남은 하루도 여유롭게 보내세요 🌿"
];
export default function HomeGreeting(){
 const [previewTime,setPreviewTime]=useState<Date|null>(null);
 const [messageIndex,setMessageIndex]=useState(0);
 const [copied,setCopied]=useState(false),[error,setError]=useState("");
 useEffect(()=>{setPreviewTime(new Date());setMessageIndex(Math.floor(Math.random()*greetings.length));},[]);
 const message=greetings[messageIndex];
 const change=()=>{setMessageIndex(index=>(index+1+Math.floor(Math.random()*(greetings.length-1)))%greetings.length);setCopied(false);setError("");setPreviewTime(new Date());};
 const copy=async()=>{try{await navigator.clipboard.writeText(message);setCopied(true);setError("");}catch{setError("복사하지 못했습니다 문구를 선택해 복사해 주세요");}};
 return <section data-ui-card="true" className="personal-grid min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
  <div className="flex items-center justify-between gap-2 mb-3"><h2 data-personal-card-title="true" className="flex items-center gap-2"><MessageCircle size={19}/>안부 카톡</h2><button type="button" aria-label="다른 안부 문구" title="다른 안부 문구" className="shrink-0 p-1 text-slate-400 hover:text-blue-600" onClick={change}><RefreshCw size={17}/></button></div>
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#b2c7d9] shadow-sm">
   <div className="flex items-center gap-3 px-4 py-4 text-gray-900"><ChevronLeft size={20} aria-hidden="true"/><span className="flex-1 text-sm font-semibold">고객님</span><Search size={16} aria-hidden="true"/><Menu size={20} aria-hidden="true"/></div>
   <div className="min-h-[380px] px-3 pt-2 pb-6">
    <div className="mb-6 text-center"><span className="inline-flex rounded-full bg-black/10 px-3 py-0.5 text-xs leading-5 text-gray-600">{previewTime?.toLocaleDateString("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"long",day:"numeric",weekday:"short"})}</span></div>
    <div className="flex items-end justify-end gap-1.5"><span className="shrink-0 pb-0.5 text-xs text-gray-600">{previewTime?.toLocaleTimeString("ko-KR",{timeZone:"Asia/Seoul",hour:"numeric",minute:"2-digit",hour12:true})}</span><div className="relative w-[80%] min-w-0 rounded-xl rounded-tr-sm bg-[#fee500] px-3 py-3 shadow-sm before:absolute before:-right-1.5 before:top-0 before:border-t-[8px] before:border-t-[#fee500] before:border-r-[8px] before:border-r-transparent"><p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-900">{message}</p></div></div>
   </div>
  </div>
  <button type="button" onClick={()=>void copy()} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2a65ab] text-sm font-semibold text-white hover:brightness-95">{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"복사됨":"문구 복사"}</button>
  {error&&<p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
 </section>;
}
