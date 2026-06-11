"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Link2,
  Newspaper,
  MessageCircle,
  X,
  Pencil,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

import InsuranceLinks from "./InsuranceLinks";
import CardNewsLinks from "./CardNewsLinks";
import MemoManager from "@/app/components/MemoManager";
import MemoStickers from "@/app/components/MemoStickers";
import { useAuth } from "@/app/components/AuthProvider";

type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

const memoColorOptions: { value: MemoItem["color"]; className: string }[] = [
  { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
  { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
  { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
  { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
  { value: "clear", className: "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95" },
];

export default function UseLinkPage() {
  const { memos, saveMemos, authStatus } = useAuth();
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  const [memoEditPopupPosition, setMemoEditPopupPosition] = useState({ x: 0, y: 0 });
  const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);

  const [tab, setTab] = useState<"보험" | "카드뉴스">("보험");
  const [search, setSearch] = useState("");

  const [settingOpen, setSettingOpen] = useState(false);
const [memoOpen, setMemoOpen] = useState(false);

  useEffect(() => {
    const openMemoDetail = (event: any) => {
      const memoId = event.detail;
      const targetMemo = memos.find((memo) => memo.id === memoId);
      if (!targetMemo) return;
      setMemoEditPopupPosition({ x: 0, y: 0 });
      setSelectedMemo(targetMemo as MemoItem);
    };
    window.addEventListener("open-memo-detail", openMemoDetail);
    return () => window.removeEventListener("open-memo-detail", openMemoDetail);
  }, [memos]);

  useEffect(() => {
  const handleClick = () => {
    setSettingOpen(false);
  };

  if (settingOpen) {
    window.addEventListener("click", handleClick);
  }

  return () => {
    window.removeEventListener("click", handleClick);
  };
}, [settingOpen]);

  const changeMemoColor = (id: string, color: MemoItem["color"]) => {
    saveMemos(memos.map((memo) => memo.id === id ? { ...memo, color, updatedAt: new Date().toISOString() } : memo));
  };

  const deleteMemo = (id: string) => {
    setDeleteMemoId(id);
    setDeleteMemoConfirmOpen(true);
  };

  const confirmDeleteMemo = () => {
    if (!deleteMemoId) return;
    saveMemos(memos.filter((memo) => memo.id !== deleteMemoId));
    setSelectedMemo(null);
    setDeleteMemoId(null);
    setDeleteMemoConfirmOpen(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <a href="/" className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-black" />
            </a>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Link2 className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">바로가기</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">보험 업무에 필요한 바로가기 모음</p>
            </div>
            <div
  className={`absolute right-0 top-1/2 -translate-y-1/2 ${
    settingOpen ? "z-[1000]" : "z-40"
  }`}
>
  <div className="relative">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSettingOpen(!settingOpen);
      }}
      className={`
        w-10 h-10 rounded-full border border-gray-200 shadow-sm
        hidden md:flex items-center justify-center transition cursor-default
        ${settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}
      `}
    >
      <Pencil className="w-5 h-5 text-gray-400" />
    </button>

    {settingOpen && (
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          absolute right-0 top-12 z-[999] w-40 rounded-2xl
          bg-white border border-gray-200 shadow-xl overflow-hidden
        "
      >
        <button
          onClick={() => {
            setMemoOpen(true);
            setSettingOpen(false);
          }}
          className="
            block w-full text-center px-4 py-3 text-sm font-bold
            text-gray-700 hover:bg-gray-50 transition cursor-default
          "
        >
          메모장
        </button>

        {authStatus === "approved" && (
  <button
    onClick={() => {
      window.dispatchEvent(
        new CustomEvent("open-calculator")
      );
      setSettingOpen(false);
    }}
    className="
      block w-full text-center px-4 py-3 text-sm font-bold
      text-gray-700 hover:bg-gray-50 transition border-t
      border-gray-100 cursor-default
    "
  >
    계산기
  </button>
)}
      </div>
    )}
  </div>
</div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">

        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-7 gap-1">
          {["보험", "카드뉴스"].map((item) => (
            <button key={item} onClick={() => setTab(item as any)} className={`rounded-xl py-3 text-sm md:text-base font-bold ${tab === item ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
              {item}
            </button>
          ))}
        </div>
        {tab === "보험" && <InsuranceLinks search={search} />}
        {tab === "카드뉴스" && <CardNewsLinks search={search} />}
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a href="https://naver.me/xsZ8mk7H" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>
          <a href="https://open.kakao.com/o/gD7ej63h" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>
          <a href="https://www.instagram.com/g__tree_/" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>

<MemoManager open={memoOpen} onClose={() => setMemoOpen(false)} />
<MemoStickers />

      {/* 메모 수정 팝업 */}
      {selectedMemo && (
        <div className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4" onClick={( ) => setSelectedMemo(null)}>
          <div
            style={{ transform: `translate(${memoEditPopupPosition.x}px, ${memoEditPopupPosition.y}px)` }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">메모 수정</h2>
              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button key={color.value} type="button"
                    onClick={() => { changeMemoColor(selectedMemo.id, color.value); setSelectedMemo({ ...selectedMemo, color: color.value, updatedAt: new Date().toISOString() }); }}
                    className={`w-7 h-7 rounded-full border transition hover:scale-105 ${selectedMemo.color === color.value ? "ring-2 ring-gray-400 ring-offset-2" : ""} ${color.className}`}
                  />
                ))}
                <button onClick={() => { setSelectedMemo(null); setMemoEditPopupPosition({ x: 0, y: 0 }); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <input value={selectedMemo.title}
              onChange={(e) => setSelectedMemo({ ...selectedMemo, title: e.target.value })}
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3" />
            <textarea value={selectedMemo.content}
              onChange={(e) => setSelectedMemo({ ...selectedMemo, content: e.target.value })}
              className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5" />
            <div className="flex gap-3">
              <button onClick={() => deleteMemo(selectedMemo.id)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default">삭제</button>
              <button onClick={() => { saveMemos(memos.map((memo) => memo.id === selectedMemo.id ? { ...selectedMemo, updatedAt: new Date().toISOString() } : memo)); setSelectedMemo(null); }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default">완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 팝업 */}
      {deleteMemoConfirmOpen && (
        <div className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6">
            <h2 className="text-lg font-black text-gray-900 mb-2">메모 삭제</h2>
            <p className="text-sm text-gray-500 mb-5">이 메모를 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={() => { setDeleteMemoConfirmOpen(false); setDeleteMemoId(null); }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold cursor-default">취소</button>
              <button onClick={confirmDeleteMemo}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold cursor-default">삭제</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
