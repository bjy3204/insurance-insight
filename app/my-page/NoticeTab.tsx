"use client";
import ClaimNoticePaper from "./ClaimNoticePaper";
import { claimNotices, getClaimNotice, readClaimContent, parseClaimContent, type ClaimKind } from "./claim-notices";
import ColorSelectButton from "@/app/components/memos/ColorSelectButton";
import { ChevronDown, Download, Save, X, FileText, MessageCircle } from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { captureClaimNotice } from "@/lib/capture-claim-notice";

type NoticeType = "exemption" | "reduction" | "claim";
const noticeTypes: { id: NoticeType; label: string }[] = [
  { id: "exemption", label: "면책종료" },
  { id: "reduction", label: "감액종료" },
  { id: "claim", label: "청구서류" },
];

const monthTabs = [
  { id: "1-2", label: "1~2월" },
  { id: "3-4", label: "3~4월" },
  { id: "5-6", label: "5~6월" },
  { id: "7-8", label: "7~8월" },
  { id: "9-10", label: "9~10월" },
  { id: "11-12", label: "11~12월" },
];

const fontOptions = [
  { value: "serif", label: "명조체" },
  { value: "sans-serif", label: "고딕체" },
  { value: "'Nanum Myeongjo', serif", label: "나눔명조" },
  { value: "'Noto Serif KR', serif", label: "Noto 명조" },
];

const defaultContents = {
  exemption: {
    content: `고객님의 보험을 맡겨주신지
어느덧 3개월이 지났습니다 😊

가입하신 진단비의 면책기간 종료와
보장개시를 안내드립니다

앞으로도 늘 곁에서 함께하겠습니다`,
    signature: "든든한 보험 파트너",
  },

  reduction: {
    content: `고객님과 함께한 시간이 어느덧 1년이 되었습니다 😊

가입하신 보장의 감액기간이 종료되어
이제부터 보장을 100% 받으실 수 있음을 안내드립니다

병원방문이나 건강검진 예정이 있으시다면
언제든 편하게 연락주시면 빠르게 도와드리겠습니다`,
    signature: "든든한 보험 파트너",
  },
};

// 면책 / 감액 글자 위치 따로 조절
const textPositions = {
  exemption: {
    nameTop: 210,
    nameX: -40,

    contentTop: 310,
    contentX: 40,

    signatureBottom: 130,
    signatureX: 40,
  },

  reduction: {
    nameTop: 160,
    nameX: -67,

    contentTop: 240,
    contentX: 0,

    signatureBottom: 210,
    signatureX: 0,
  },
};

export default function NoticeTab({ active = true }: { active?: boolean }) {
  const { authUser } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [fontOpen, setFontOpen] = useState(false);
  const [mobileDesignOpen, setMobileDesignOpen] = useState(false);
  useEffect(() => { if (active) { setMobileDesignOpen(false); setFontOpen(false); } }, [active]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const element = previewContainerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setPreviewScale(element.clientWidth / 720));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [noticeType, setNoticeType] = useState<NoticeType>("exemption");
  const [claimContents, setClaimContents] = useState<Record<ClaimKind, string>>(() => Object.fromEntries(claimNotices.map(item => [item.id, readClaimContent(item.id, null)])) as Record<ClaimKind, string>);
  useEffect(() => { setClaimContents(previous => Object.fromEntries(Object.entries(previous).map(([kind, value]) => [kind, readClaimContent(kind, JSON.stringify({version:2,content:value}))])) as Record<ClaimKind, string>); }, []);
  const [claimKind, setClaimKind] = useState<ClaimKind>("hospital");
  const [month, setMonth] = useState("9-10");
  const [customerName, setCustomerName] = useState("홍길동");
  const [content, setContent] = useState(defaultContents.exemption.content);
  const [signature, setSignature] = useState(defaultContents.exemption.signature);
  const [fontFamily, setFontFamily] = useState("serif");
  const [textColor, setTextColor] = useState("#4a4a4a");
  const [signatureColor, setSignatureColor] = useState("#9a7a3a");
  const [saveMsg, setSaveMsg] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [preparingShare, setPreparingShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareFileRef = useRef<{ key: string; file: File } | null>(null);
  const captureBusy = useRef(false);
  const bgUrl = `/card-templates/${noticeType}/${month}.png`;
  const pos = textPositions[noticeType === "claim" ? "exemption" : noticeType];
  const selectNoticeType = (type: NoticeType) => {
    setNoticeType(type); setSaveMsg("");
    if (type === "claim") { setSignature("든든한 설계사"); setFontFamily("sans-serif"); setSignatureColor("#4a4a4a"); }
    else { setContent(defaultContents[type].content); setSignature(defaultContents[type].signature); }
  };
  useEffect(() => {
    if (!authUser) return;
    let active = true;
    const loadNotice = async () => {
      const [{ data }, { data: savedClaims }] = await Promise.all([
        supabase.from("notice_settings").select("*").eq("user_id", authUser.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("notice_settings").select("month,content").eq("user_id", authUser.id).eq("notice_type", "claim"),
      ]);
      if (!active) return;
      const drafts = Object.fromEntries(claimNotices.map(item => [item.id, readClaimContent(item.id, null)])) as Record<ClaimKind, string>;
      for (const saved of savedClaims ?? []) { const kind = claimNotices.find(item => item.id === saved.month)?.id; if (kind) drafts[kind] = readClaimContent(kind, saved.content); }
      if (data?.notice_type === "claim") drafts[getClaimNotice(data.month).id] = readClaimContent(data.month, data.content);
      setClaimContents(drafts);
      if (!active || !data) return;
      const loadedType: NoticeType = data.notice_type === "claim" ? "claim" : data.notice_type === "reduction" ? "reduction" : "exemption";
      setNoticeType(loadedType);
      const loadedClaim = getClaimNotice(data.month);
      if (loadedType === "claim") setClaimKind(loadedClaim.id);
      if (loadedType !== "claim") setMonth(data.month || "9-10"); setCustomerName(data.customer_name ?? "홍길동");
      setContent(data.content ?? (loadedType === "claim" ? loadedClaim.content : defaultContents[loadedType].content));
      setSignature(data.signature ?? "든든한 보험 파트너");
      setFontFamily(data.font_family || "serif"); setTextColor(data.text_color || "#4a4a4a"); setSignatureColor(data.signature_color || "#9a7a3a");
    };
    void loadNotice(); return () => { active = false; };
  }, [authUser?.id]);
  const handleSave = async () => {
    if (!authUser || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("notice_settings").upsert({ user_id: authUser.id, notice_type: noticeType, month: noticeType === "claim" ? claimKind : month, customer_name: customerName, content: noticeType === "claim" ? JSON.stringify({ version: 2, content: claimContents[claimKind] }) : content, signature, font_family: fontFamily, text_color: textColor, signature_color: signatureColor, updated_at: new Date().toISOString() }, { onConflict: "user_id,notice_type,month" });
      setSaveMsg(error ? "저장 실패" : "저장되었습니다");
    } catch { setSaveMsg("저장 실패"); } finally { setSaving(false); }
  };
  const captureNotice = useCallback(async () => {
    if (!previewRef.current) throw new Error("안내장 미리보기를 확인해 주세요.");
    if (noticeType === "claim") return captureClaimNotice(previewRef.current);
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 300));
    return html2canvas(previewRef.current, { scale: 2, width: 720, height: 720, useCORS: true, backgroundColor: null, onclone: (_document, element) => { element.style.transform = "none"; } });
  }, [noticeType]);
  const imageName = `${customerName || "고객"}_${noticeType === "claim" ? `${getClaimNotice(claimKind).label}_청구서류` : noticeType === "exemption" ? "면책종료" : "감액종료"}_안내장.png`;
  const shareKey = JSON.stringify([noticeType, claimKind, month, customerName, signature, fontFamily, textColor, signatureColor, noticeType === "claim" ? claimContents[claimKind] : content]);
  useEffect(() => {
    shareFileRef.current = null;
    if (!active || !navigator.share || !navigator.canShare) { setPreparingShare(false); return; }
    let cancelled = false;
    setPreparingShare(true);
    // 공유창은 버튼을 누르는 즉시 열 수 있도록 사진을 미리 준비합니다.
    const timer = setTimeout(async () => {
      try {
        const canvas = await captureNotice();
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("이미지 준비 실패")), "image/png"));
        if (!cancelled) shareFileRef.current = { key: shareKey, file: new File([blob], imageName, { type: "image/png" }) };
      } catch { /* 지원하지 않는 브라우저에서는 이미지 저장으로 안내합니다. */ }
      finally { if (!cancelled) setPreparingShare(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active, shareKey, captureNotice, imageName]);
  const handleKakaoShare = async () => {
    const prepared = shareFileRef.current;
    if (!navigator.share || !navigator.canShare) {
      setSaveMsg("이 브라우저는 사진 공유를 지원하지 않습니다. 이미지 저장 후 카카오톡에서 사진으로 보내 주세요."); return;
    }
    if (!prepared || prepared.key !== shareKey || !navigator.canShare({ files: [prepared.file] })) {
      setSaveMsg("사진 공유를 준비하지 못했습니다. 이미지 저장 후 카카오톡에서 사진으로 보내 주세요."); return;
    }
    setSharing(true); setSaveMsg("");
    try { await navigator.share({ files: [prepared.file] }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setSaveMsg("사진 공유 창을 열지 못했습니다. 이미지 저장 후 카카오톡에서 사진으로 보내 주세요."); }
    finally { setSharing(false); }
  };
  const handleDownload = async () => {
    if (!previewRef.current || captureBusy.current) return;
    captureBusy.current = true;
    setIsCapturing(true);
    try {
      const canvas = await captureNotice();
      const link = document.createElement("a");
      link.download = imageName;
      link.href = canvas.toDataURL("image/png"); link.click();
    } catch { setSaveMsg("이미지를 저장하지 못했습니다. 다시 시도해 주세요."); } finally { setIsCapturing(false); captureBusy.current = false; }
  };
    return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <h2 className="mr-auto flex items-center gap-3 text-xl font-bold"><FileText className="w-7 h-7 text-violet-500" />안내장</h2>
        {saveMsg && <p role="status" className="text-sm text-gray-600">{saveMsg}</p>}
        <button type="button" aria-label="내용 저장" title="내용 저장" onClick={handleSave} disabled={!authUser || saving} className="flex items-center justify-center gap-2 h-11 px-3 sm:px-5 shrink-0 rounded-xl border border-gray-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-50"><Save className="w-4 h-4" /><span className="whitespace-nowrap">{saving ? "저장 중..." : "내용 저장"}</span></button>
        <button type="button" aria-label="이미지 저장" title="이미지 저장" onClick={handleDownload} disabled={isCapturing} className="flex items-center justify-center gap-2 h-11 px-3 sm:px-5 shrink-0 rounded-xl bg-blue-600 text-white text-sm font-bold cursor-pointer disabled:opacity-50"><Download className="w-4 h-4" /><span className="whitespace-nowrap">{isCapturing ? "저장 중..." : "이미지 저장"}</span></button>
        <button type="button" aria-label="카톡 공유하기" title="카톡 공유하기" onClick={handleKakaoShare} disabled={preparingShare || sharing} className="flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-5 shrink-0 rounded-xl bg-[#fee500] text-gray-900 text-sm font-bold cursor-pointer disabled:opacity-50"><MessageCircle className="w-4 h-4" /><span className="hidden sm:inline whitespace-nowrap">{preparingShare ? "이미지 준비 중..." : "카톡 공유하기"}</span></button>
      </div>
      <div className="personal-grid bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[96px_1fr] items-center"><p className="text-sm font-bold">안내장 종류</p><div className="grid grid-cols-3 gap-3 max-w-[540px]">{noticeTypes.map(type => <button type="button" key={type.id} onClick={() => selectNoticeType(type.id)} className={`h-11 rounded-xl text-sm font-bold cursor-pointer ${noticeType === type.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{type.label}</button>)}</div></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
        <div className="personal-grid flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 gap-5">
        {noticeType === "claim" ? <div className="space-y-2"><p className="text-sm font-bold">청구 종류</p><div className="grid grid-cols-3 gap-2">{claimNotices.map(item => <button type="button" key={item.id} onClick={() => { setClaimKind(item.id); setSaveMsg(""); }} className={`h-11 rounded-xl text-sm font-semibold cursor-pointer ${claimKind === item.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>{item.label}</button>)}</div></div> : (<div className="space-y-2"><p className="text-sm font-bold">월 선택</p><div className="grid grid-cols-3 lg:grid-cols-3 gap-2 max-w-[800px]">{monthTabs.map(item => <button type="button" key={item.id} onClick={() => setMonth(item.id)} className={`h-11 rounded-xl text-sm font-semibold cursor-pointer ${month === item.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>{item.label}</button>)}</div></div>)}
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label htmlFor="notice-customer" className="block text-sm font-bold mb-2">고객명</label><div className="relative"><input id="notice-customer" value={customerName} onChange={event => setCustomerName(event.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" /><button type="button" aria-label="고객명 지우기" onClick={() => setCustomerName("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"><X className="w-4 h-4" /></button></div></div>
          <div><label htmlFor="notice-signature" className="block text-sm font-bold mb-2">설계사</label><div className="relative"><input id="notice-signature" value={signature} onChange={event => setSignature(event.target.value)} className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400" /><button type="button" aria-label="설계사 지우기" onClick={() => setSignature("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"><X className="w-4 h-4" /></button></div></div>
        </div>
          <div className="flex flex-col flex-1"><label htmlFor="notice-content" className="block text-sm font-bold mb-3">안내 내용</label><textarea id="notice-content" value={noticeType === "claim" ? claimContents[claimKind] : content} onChange={event => { const value = event.target.value; if (noticeType === "claim") setClaimContents(previous => ({ ...previous, [claimKind]: value })); else setContent(value); setSaveMsg(""); }} rows={noticeType === "claim" ? 12 : 6} className="block w-full flex-1 min-h-[180px] p-4 rounded-xl border border-gray-200 text-sm leading-7 outline-none resize-none focus:border-blue-400" /></div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <h3 className="hidden md:block text-sm font-bold">디자인 설정</h3>
            <button type="button" aria-expanded={mobileDesignOpen} aria-controls="notice-design-settings" onClick={() => { setMobileDesignOpen(previous => !previous); setFontOpen(false); }} className="flex md:hidden w-full items-center justify-between text-sm font-bold cursor-pointer">디자인 설정<ChevronDown className={`w-4 h-4 transition-transform ${mobileDesignOpen ? "rotate-180" : ""}`} /></button>
            <div id="notice-design-settings" className={`${mobileDesignOpen ? "grid" : "hidden"} md:grid sm:grid-cols-3 gap-3 mt-4`}>
              <div className="relative"><p className="text-xs font-semibold text-gray-600 mb-2">글자 폰트</p><button type="button" aria-expanded={fontOpen} onClick={() => setFontOpen(previous => !previous)} className="w-full h-12 flex items-center justify-between gap-2 px-3 rounded-xl bg-white border border-gray-200 text-sm cursor-pointer">{fontOptions.find(font => font.value === fontFamily)?.label}<ChevronDown className="w-4 h-4 text-gray-400" /></button>{fontOpen && <><button type="button" aria-label="폰트 선택 닫기" onClick={() => setFontOpen(false)} className="fixed inset-0 z-10 cursor-default" /><div className="absolute top-full mt-1 w-full z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1">{fontOptions.map(font => <button type="button" key={font.value} onClick={() => { setFontFamily(font.value); setFontOpen(false); }} className={`block w-full text-left text-sm px-3 py-2 rounded-lg cursor-pointer ${fontFamily === font.value ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"}`}>{font.label}</button>)}</div></>}</div>
              <div><p className="text-xs font-semibold text-gray-600 mb-2">본문 색상</p><ColorSelectButton label="본문 색상 선택" value={textColor} onChange={setTextColor} /></div>
              <div><p className="text-xs font-semibold text-gray-600 mb-2">서명 색상</p><ColorSelectButton label="서명 색상 선택" value={signatureColor} onChange={setSignatureColor} /></div>
            </div>
          </div>
        </div>
        <div className="personal-grid min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-bold mb-4">미리보기</h3>
          <div ref={previewContainerRef} className="relative w-full max-w-[720px] mx-auto aspect-square overflow-hidden">
    <div
      ref={previewRef}
      className="relative w-[720px] h-[720px] shrink-0 bg-white origin-top-left"
      style={{ transform: `scale(${previewScale})` }}
    >
          {noticeType === "claim" ? <ClaimNoticePaper text={parseClaimContent(claimContents[claimKind])} kind={claimKind} customerName={customerName} content={content} signature={signature} fontFamily={fontFamily} textColor={textColor} signatureColor={signatureColor} /> : <>
          <img
            src={bgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div
  className="absolute left-0 w-full text-center text-[40px]"
  style={{
    top: `${pos.nameTop - (isCapturing ? 18 : 0)}px`,
    transform: `translateX(${pos.nameX}px)`,
    fontFamily,
    color: textColor,
    lineHeight: "40px",
    height: "40px",
  }}
>
  {customerName}
</div>

         <div
  className="absolute left-[100px] right-[100px] text-center text-[18px]"
  style={{
    top: `${pos.contentTop}px`,
    transform: `translateX(${pos.contentX}px)`,
    fontFamily,
    color: textColor,
  }}
>
  {content.split("\n").map((line, idx) => (
    <div
      key={idx}
      className={line.trim() === "" ? "h-5" : "leading-[1.9]"}
    >
      {line}
    </div>
  ))}
</div>

          <div
            className="absolute left-0 w-full text-center text-[18px]"
            style={{
  bottom: `${pos.signatureBottom}px`,
  transform: `translateX(${pos.signatureX}px)`,
  fontFamily,
  color: signatureColor,
}}
          >
            {signature}
          </div>
          </>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
