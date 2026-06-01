"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";

type NoticeType = "exemption" | "reduction";

const noticeTypes: { id: NoticeType; label: string }[] = [
  { id: "exemption", label: "면책종료" },
  { id: "reduction", label: "감액종료" },
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
    nameTop: 200,
    nameX: -40,

    contentTop: 310,
    contentX: 40,

    signatureBottom: 130,
    signatureX: 40,
  },

  reduction: {
    nameTop: 150,
    nameX: -67,

    contentTop: 240,
    contentX: 0,

    signatureBottom: 210,
    signatureX: 0,
  },
};

export default function NoticeTab() {
  const { authUser } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  const [noticeType, setNoticeType] = useState<NoticeType>("exemption");
  const [month, setMonth] = useState("9-10");

  const [customerName, setCustomerName] = useState("홍길동");
const [content, setContent] = useState(
  defaultContents.exemption.content
);

const [signature, setSignature] = useState(
  defaultContents.exemption.signature
);

  const [fontFamily, setFontFamily] = useState("serif");
  const [textColor, setTextColor] = useState("#4a4a4a");
  const [signatureColor, setSignatureColor] = useState("#9a7a3a");
  const [saveMsg, setSaveMsg] = useState("");

  

  const bgUrl = `/card-templates/${noticeType}/${month}.png`;
  const pos = textPositions[noticeType];

  useEffect(() => {
    if (!authUser) return;

    const loadNotice = async () => {
      const { data } = await supabase
        .from("notice_settings")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!data) return;

      setNoticeType((data.notice_type as NoticeType) || "exemption");
      setMonth(data.month || "9-10");
      setCustomerName(data.customer_name || "홍길동");
      setContent(data.content || content);
      setSignature(data.signature || "든든한 보험 파트너 배지연");
      setFontFamily(data.font_family || "serif");
      setTextColor(data.text_color || "#4a4a4a");
      setSignatureColor(data.signature_color || "#9a7a3a");
    };

    loadNotice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const handleSave = async () => {
    if (!authUser) return;

    const { error } = await supabase.from("notice_settings").upsert(
      {
        user_id: authUser.id,
        notice_type: noticeType,
        month,
        customer_name: customerName,
        content,
        signature,
        font_family: fontFamily,
        text_color: textColor,
        signature_color: signatureColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSaveMsg(error ? "저장 실패" : "저장되었습니다");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const link = document.createElement("a");
    link.download = `${customerName || "고객"}_${
      noticeType === "exemption" ? "면책종료" : "감액종료"
    }_안내장.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 space-y-5">
        <div>
          <p className="text-sm font-black text-gray-800 mb-2">안내장 종류</p>
          <div className="grid grid-cols-2 gap-2">
            {noticeTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
  setNoticeType(type.id);
  setContent(defaultContents[type.id].content);
  setSignature(defaultContents[type.id].signature);
}}
                className={`h-11 rounded-2xl text-sm font-bold transition cursor-pointer ${
                  noticeType === type.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-gray-800 mb-2">월 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {monthTabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setMonth(item.id)}
                className={`h-10 rounded-xl text-xs font-bold transition cursor-pointer ${
                  month === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-black text-gray-800 mb-2 block">
            고객명
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="text-sm font-black text-gray-800 mb-2 block">
            안내 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={9}
            className="w-full p-4 rounded-2xl border border-gray-200 text-sm outline-none resize-none focus:border-blue-400 leading-relaxed"
          />
        </div>

        <div>
          <label className="text-sm font-black text-gray-800 mb-2 block">
            설계사
          </label>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div>
  <p className="text-sm font-black text-gray-800 mb-2">글자 폰트</p>

  <div className="grid grid-cols-2 gap-2">
    {fontOptions.map((font) => (
      <button
        key={font.value}
        type="button"
        onClick={() => setFontFamily(font.value)}
        className={`h-11 rounded-2xl text-sm font-bold border transition cursor-pointer ${
          fontFamily === font.value
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        {font.label}
      </button>
    ))}
  </div>
</div>

       <div className="grid grid-cols-2 gap-3">
  <div>
    <p className="text-sm font-black text-gray-800 mb-2">본문 색상</p>

    <label className="h-12 rounded-2xl border border-gray-200 bg-white px-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition">
      <span
        className="w-7 h-7 rounded-full border border-gray-200 shadow-inner"
        style={{ backgroundColor: textColor }}
      />
      <span className="text-xs font-bold text-gray-600">{textColor}</span>

      <input
        type="color"
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
        className="sr-only"
      />
    </label>
  </div>

  <div>
    <p className="text-sm font-black text-gray-800 mb-2">서명 색상</p>

    <label className="h-12 rounded-2xl border border-gray-200 bg-white px-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition">
      <span
        className="w-7 h-7 rounded-full border border-gray-200 shadow-inner"
        style={{ backgroundColor: signatureColor }}
      />
      <span className="text-xs font-bold text-gray-600">{signatureColor}</span>

      <input
        type="color"
        value={signatureColor}
        onChange={(e) => setSignatureColor(e.target.value)}
        className="sr-only"
      />
    </label>
  </div>
</div>

        <button
          onClick={handleSave}
          className="w-full h-12 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition cursor-pointer"
        >
          내용 저장
        </button>

        <button
          onClick={handleDownload}
          className="w-full h-12 rounded-2xl bg-gray-900 text-white text-sm font-black hover:bg-gray-800 transition cursor-pointer"
        >
          이미지 저장
        </button>

        {saveMsg && (
          <p className="text-xs text-center text-green-600 font-bold">
            {saveMsg}
          </p>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 flex justify-center overflow-auto">
        <div
          ref={previewRef}
          className="relative w-[720px] h-[720px] shrink-0 bg-white"
        >
          <img
            src={bgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div
            className="absolute left-0 w-full text-center"
            style={{
  top: `${pos.nameTop}px`,
  transform: `translateX(${pos.nameX}px)`,
  fontFamily,
  color: textColor,
}}
          >
            <span className="text-[38px] tracking-[-1px]">
              {customerName}
            </span>
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
        </div>
      </div>
    </div>
  );
}