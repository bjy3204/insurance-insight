"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { calculatePension } from "@/lib/pension-calculation";
import Link from "next/link";
import styles from "../components/CalculatorPresentation.module.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";


import { LayoutGrid,
  ArrowLeft,
  PiggyBank,
  UserRound,
  Accessibility,
  UsersRound,
  Calculator,
  RotateCcw,
  Newspaper,
  MessageCircle,
  FileText,
  X,
  Search,
  StickyNote,
NotebookPen,
Pin,
Eye,
EyeOff,
Plus,
Pencil,
} from "lucide-react";

import NpsTableModal from "@/app/components/NpsTableModal";
import {
  LIFE_DATA_YEAR,
  lifeExpectancyData,
} from "./lifeExpectancyData";
import { FaInstagram } from "react-icons/fa";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';
import CalculatorPageLayout from '@/app/components/CalculatorPageLayout';

type TabType = "retire" | "pension" | "lump" | "nps";
type LifeGender = "남성" | "여성";

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

function SortableMemoCard({
  memo,
  children,
}: {
  memo: MemoItem;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: memo.id,
    disabled: memo.pinned,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}

export default function PensionCalculatorPage() {
  const { authUser, authStatus, memos, saveMemos } = useAuth();

  const [tab, setTab] = useState<TabType>("retire");

  const [npsTableOpen, setNpsTableOpen] = useState(false);


const [lifeGender, setLifeGender] = useState<LifeGender>("남성");
const [lifeOpen, setLifeOpen] = useState(false);
const [lifePopupPos, setLifePopupPos] = useState({ x: 0, y: 0 });


const lifeDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const movePopup = (
  e: React.MouseEvent,
  type: "life"
) => {
  const drag = lifeDragRef.current;
  if (!drag.isDragging) return;

  const nextPos = {
    x: drag.originX + e.clientX - drag.startX,
    y: drag.originY + e.clientY - drag.startY,
  };

  setLifePopupPos(nextPos);
};

const stopPopupMove = () => {

  lifeDragRef.current.isDragging = false;
};

const closeNpsPopup = () => {
  setNpsTableOpen(false);

};

const closeLifePopup = () => {
  setLifeOpen(false);
  setLifePopupPos({ x: 0, y: 0 });
};

const [lifeAge, setLifeAge] = useState("");

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);




const [memoOpen, setMemoOpen] = useState(false);
const [settingOpen, setSettingOpen] = useState(false);

const [memoSearch, setMemoSearch] = useState("");
const [memoPage, setMemoPage] = useState(1);
const [memoTitle, setMemoTitle] = useState("");
const [memoContent, setMemoContent] = useState("");
const [memoColor, setMemoColor] =
  useState<MemoItem["color"]>("white");

const [memoAddOpen, setMemoAddOpen] = useState(false);

const [selectedMemo, setSelectedMemo] =
  useState<MemoItem | null>(null);

const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] =
  useState(false);

const [deleteMemoId, setDeleteMemoId] =
  useState<string | null>(null);

const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);


const [memoAddPopupPos, setMemoAddPopupPos] = useState({
  x: 0,
  y: 0,
});

const [memoEditPopupPos, setMemoEditPopupPos] = useState({
  x: 0,
  y: 0,
});

const memoAddDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const memoEditDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const moveMemoPopup = (
  e: React.MouseEvent,
  type: "memoAdd" | "memoEdit"
) => {
  const drag =
    type === "memoAdd"
      ? memoAddDragRef.current
      : memoEditDragRef.current;

  if (!drag.isDragging) return;

  const nextPos = {
    x: drag.originX + e.clientX - drag.startX,
    y: drag.originY + e.clientY - drag.startY,
  };

  if (type === "memoAdd") {
    setMemoAddPopupPos(nextPos);
  } else {
    setMemoEditPopupPos(nextPos);
  }
};

const stopMemoPopupMove = () => {
  memoAddDragRef.current.isDragging = false;
  memoEditDragRef.current.isDragging = false;
};




useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;
    const targetMemo = memos.find((memo) => memo.id === memoId);
    if (!targetMemo) return;
    openMemoEdit(targetMemo);
  };

  window.addEventListener("open-memo-detail", openMemoDetail);

  return () => {
    window.removeEventListener("open-memo-detail", openMemoDetail);
  };
}, [memos]);

useEffect(() => {
  const closeContextMenu = () => setContextMenu(null);
  window.addEventListener("pointerdown", closeContextMenu);
  return () => window.removeEventListener("pointerdown", closeContextMenu);
}, []);

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


const openMemoEdit = (memo: MemoItem) => {
  setSelectedMemo(null);

  memoEditDragRef.current = {
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  };

  setMemoEditPopupPos({ x: 0, y: 0 });

  requestAnimationFrame(() => {
    setSelectedMemo(memo);
  });
};

const addMemo = () => {
  const now = new Date().toISOString();

  const newMemo: MemoItem = {
    id: crypto.randomUUID(),
    title: memoTitle.trim(),
    content: memoContent.trim(),
    pinned: false,
    visible: false,
    color: memoColor,
    createdAt: now,
    updatedAt: now,
  };

  saveMemos([newMemo, ...memos]);

  setMemoPage(1);
  setMemoTitle("");
  setMemoContent("");
  setMemoColor("white");
  setMemoAddOpen(false);
};

const changeMemoColor = (
  id: string,
  color: MemoItem["color"]
) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            color,
            updatedAt: new Date().toISOString(),
          }
        : memo
    )
  );
};

const deleteMemo = (id: string) => {
  setDeleteMemoId(id);
  setDeleteMemoConfirmOpen(true);
};

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;

  const nextMemos = memos.filter(
    (memo) => memo.id !== deleteMemoId
  );

  saveMemos(nextMemos);

  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};

const toggleMemoVisible = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? { ...memo, visible: !memo.visible }
        : memo
    )
  );
};

const toggleMemoPinned = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            pinned: !memo.pinned,
            updatedAt: new Date().toISOString(),
          }
        : memo
    )
  );
};

const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const activeMemo = memos.find(
    (memo) => memo.id === active.id
  );

  const overMemo = memos.find(
    (memo) => memo.id === over.id
  );

  if (!activeMemo || !overMemo) return;

  if (activeMemo.pinned || overMemo.pinned) return;

  const pinnedMemos = memos.filter(
    (memo) => memo.pinned
  );

  const normalMemos = memos.filter(
    (memo) => !memo.pinned
  );

  const oldIndex = normalMemos.findIndex(
    (memo) => memo.id === active.id
  );

  const newIndex = normalMemos.findIndex(
    (memo) => memo.id === over.id
  );

  saveMemos([
    ...pinnedMemos,
    ...arrayMove(normalMemos, oldIndex, newIndex),
  ]);
};

const filteredMemos = memos
  .filter((memo) =>
    `${memo.title} ${memo.content}`
      .toLowerCase()
      .includes(memoSearch.toLowerCase())
  )
  .sort((a, b) => {
    if (a.pinned !== b.pinned)
      return a.pinned ? -1 : 1;

    return (
      memos.findIndex(
        (memo) => memo.id === a.id
      ) -
      memos.findIndex(
        (memo) => memo.id === b.id
      )
    );
  });

const MEMOS_PER_PAGE = 6;

const totalMemoPages = Math.max(
  1,
  Math.ceil(
    filteredMemos.length / MEMOS_PER_PAGE
  )
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);

const memoColorOptions: {
  value: MemoItem["color"];
  className: string;
}[] = [
  {
    value: "white",
    className:
      "bg-white border-gray-300 hover:bg-gray-50",
  },
  {
    value: "blue",
    className:
      "bg-blue-50 border-blue-100 hover:bg-blue-100",
  },
  {
    value: "yellow",
    className:
      "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
  },
  {
    value: "red",
    className:
      "bg-red-50 border-red-100 hover:bg-red-100",
  },
  {
    value: "clear",
    className:
      "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
  },
];

const getMemoColorClass = (
  color: MemoItem["color"]
) => {
  if (color === "blue")
    return "bg-blue-50 border-blue-100";

  if (color === "yellow")
    return "bg-yellow-50 border-yellow-100";

  if (color === "red")
    return "bg-red-50 border-red-100";

  if (color === "clear")
    return "bg-white/40 border-gray-200";

  return "bg-white border-gray-200";
};

  const [currentAge, setCurrentAge] = useState("");
  const [pensionStartAge, setPensionStartAge] = useState("");
  const [pensionYears, setPensionYears] = useState("");
  const [targetPension, setTargetPension] = useState("");

  const [monthly, setMonthly] = useState("");
  const [savingYears, setSavingYears] = useState("");
  const [rate, setRate] = useState("");

  const [npsPremium, setNpsPremium] = useState("");

  const formatKoreanMoney = (won: number) => {
    const man = Math.round(won / 10000);
    const eok = Math.floor(man / 10000);
    const rest = man % 10000;

    if (eok > 0 && rest > 0) return `${eok.toLocaleString()}억 ${rest.toLocaleString()}만원`;
    if (eok > 0) return `${eok.toLocaleString()}억원`;

    return `${man.toLocaleString()}만원`;
  };

  const formatWon = (won: number) => {
  return (Math.round(won / 1000) * 1000).toLocaleString();
};

  const result = useMemo(() => calculatePension({ tab, currentAge, pensionStartAge, pensionYears, targetPension, monthly, savingYears, rate, npsPremium }), [tab, currentAge, pensionStartAge, pensionYears, targetPension, monthly, savingYears, rate, npsPremium]);

  const activeValues = tab === "nps" ? [npsPremium] : tab === "retire"
    ? [currentAge, targetPension, pensionStartAge, pensionYears, rate]
    : tab === "pension" ? [currentAge, monthly, savingYears, pensionStartAge, pensionYears, rate]
    : [currentAge, monthly, savingYears, rate];
  const inputSignature = JSON.stringify([tab, ...activeValues]);
  const [submittedSignature, setSubmittedSignature] = useState<string | null>(null);
  const showResult = submittedSignature === inputSignature;
  const missingInput = activeValues.some(value => value.trim() === "");

const lifeAgeNumber = lifeAge === "" ? null : Number(lifeAge);

const selectedLife =
  lifeAgeNumber === null
    ? null
    : lifeExpectancyData[lifeGender as keyof typeof lifeExpectancyData]?.[
        lifeAgeNumber as keyof (typeof lifeExpectancyData)["남성"]
      ];

const expectYears = selectedLife?.expect || 0;

const averageSickYears =
  lifeGender === "남성"
    ? 16.2
    : 20.2;
const sickYears = Math.min(
  averageSickYears,
  expectYears
);

const healthyYears = Math.max(
  expectYears - sickYears,
  0
);

const expectAge = Number(lifeAge || 0) + expectYears;
const sickStartAge = Number(lifeAge || 0) + healthyYears;
  return (
    <main className={`${styles.page} min-h-screen pb-24`}>
      <header data-page-header="true" className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link data-header-control="true"
  href="/"
  className="
    absolute
    left-0
    w-11
    h-11
    rounded-xl
    border
    border-gray-300
    bg-white
    flex
    items-center
    justify-center
  "
>
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <PiggyBank className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  연금 계산기
                </h1>
              </div>

              
            </div>

                        <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 ${
                settingOpen ? "z-[1000]" : "z-40"
              }`}
            >
              <div className="relative">
                <button data-header-control="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingOpen(!settingOpen);
                  }}
                                    className={`
                    w-10 h-10 rounded-full border border-gray-200 shadow-sm
                    flex items-center justify-center transition cursor-default
                    ${settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}
                  `}

                >
                  <LayoutGrid className="w-5 h-5 text-gray-400" />
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
                        window.dispatchEvent(new Event("open-memo-manager"));
                        setSettingOpen(false);
                      }}
                      className="
                        block w-full text-center px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer
                      "
                    >
                      메모장
                    </button>

                    <HeaderUtilityItems onClose={() => setSettingOpen(false)} />
                    <button
                      onClick={() => { setNpsTableOpen(true); setSettingOpen(false); }}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default"
                    >국민연금표</button>
                    <button
                      onClick={() => { setLifeOpen(true); setSettingOpen(false); }}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default"
                    >기대수명 계산기</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      <CalculatorPageLayout>
        <div data-tab-style="rounded" data-calculator-primary-tabs="true" className="grid grid-cols-4 gap-1 rounded-2xl bg-white border border-blue-100/70 p-1.5 mb-7">
          {([{ id: "retire", label: "은퇴설계" }, { id: "pension", label: "연금액" }, { id: "lump", label: "목돈" }, { id: "nps", label: "국민연금" }] as const).map(item => (
            <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`rounded-xl py-3 px-2 text-sm md:text-base transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-3px] ${tab === item.id ? "bg-blue-600 text-white font-semibold shadow-sm" : "text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-600"}`}>
              {item.label}
            </button>
          ))}
        </div>

<div className={`${styles.panel} rounded-3xl p-5 md:p-7`}>
          <div className="min-w-0">
          {tab === "retire" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="희망 월 연금액" value={targetPension} setValue={setTargetPension} unit="만원" />
              <InputBox label="연금개시 나이" value={pensionStartAge} setValue={setPensionStartAge} unit="세" />
              <InputBox label="연금 수령기간" value={pensionYears} setValue={setPensionYears} unit="년" />
              <InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "pension" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="매월 저축금액" value={monthly} setValue={setMonthly} unit="만원" />
              <InputBox label="저축기간" value={savingYears} setValue={setSavingYears} unit="년" />
<InputBox label="연금개시 나이" value={pensionStartAge} setValue={setPensionStartAge} unit="세" />
<InputBox label="연금 수령기간" value={pensionYears} setValue={setPensionYears} unit="년" />
<InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "lump" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="매월 저축금액" value={monthly} setValue={setMonthly} unit="만원" />
              <InputBox label="저축기간" value={savingYears} setValue={setSavingYears} unit="년" />
              <InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "nps" && (
            <InputBox
              label="월 납입보험료 (본인+사업주 총액)"
              value={npsPremium}
              setValue={setNpsPremium}
              unit="원"
            />
          )}

          </div>
          <button type="button" onClick={() => setSubmittedSignature(inputSignature)} className={styles.calculateButton}>
            <Calculator className="w-5 h-5" aria-hidden="true" />결과 보기
          </button>
          {showResult && missingInput && <p role="alert" className="mt-4 text-sm text-red-600">입력칸을 모두 채워 주세요</p>}
          <div key={submittedSignature ?? "initial"} className={showResult && !missingInput ? styles.result : "min-w-0"}>
          {showResult && !missingInput && result.error && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">{result.error}</p>}
          {showResult && !missingInput && !result.error && tab !== "nps" && (
            <div className="">
              <div className={`${styles.summary} rounded-3xl p-7 text-center mt-6`}>
                {tab === "retire" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      <span className="font-semibold">{pensionStartAge}세</span><span className="font-normal">부터</span> <span className="font-semibold">{pensionYears}년</span><span className="font-normal">간</span>
                      {" "}매월 <span className="font-semibold">{Number(targetPension || 0).toLocaleString()}만원</span>을 받으려면
                    </p>
                    <p className="mt-4 text-sm text-gray-500">{pensionStartAge}세까지 필요한 은퇴자금</p>
                    <ResultAmount value={formatKoreanMoney(result.needRetireMoney)} />
                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      지금부터 매월 <span className="text-blue-600 font-semibold">{formatKoreanMoney(result.requiredMonthlySaving)}</span>
                      {" "}저축하면 됩니다
                    </p>
                  </>
                )}

                {tab === "pension" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">매월 <strong>{Number(monthly || 0).toLocaleString()}만원</strong>씩 <strong>{savingYears}년</strong> 동안 저축하면</p>
                    <p className="mt-4 text-sm text-gray-500">{pensionStartAge}세 연금 개시 때 예상 자금</p>
                    <ResultAmount value={formatKoreanMoney(result.pensionTotal)} />
                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">매월 <span className="text-blue-600 font-semibold">{Math.round(result.estimatedMonthlyPension).toLocaleString()}원</span>의 연금을 받을 수 있습니다</p>
                  </>
                )}
                {tab === "lump" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">매월 <strong>{Number(monthly || 0).toLocaleString()}만원</strong>씩 <strong>{savingYears}년</strong> 동안 저축하면</p>
                    <p className="mt-4 text-sm text-gray-500">저축 종료 때 예상 자금</p>
                    <ResultAmount value={formatKoreanMoney(result.lumpTotal)} />
                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">{result.savingEndAge}세까지 모을 수 있는 금액입니다</p>
                  </>
                )}
              </div>

              <div className="bg-gray-50 border border-[#e1e9fb] rounded-3xl p-8 mt-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute left-[40px] top-[40px] bottom-[40px] w-[2px] bg-gray-300" />

                    {tab === "retire" && (
                      <>
                        <TimelineItem
  age={`${currentAge}세`}
  title="현재 나이"
  desc={
    <>
      은퇴 준비 시작
      <br />
      매월{" "}
      <span className="text-blue-600 font-semibold">
        {formatKoreanMoney(result.requiredMonthlySaving)}
      </span>{" "}
      저축
    </>
  }
/>
                        <TimelineItem
                          age={`${pensionStartAge}세`}
                          title="연금 개시"
                          desc={
                            <>
                              필요 자금{" "}
                              <span className="text-blue-600 font-semibold">
                                {formatKoreanMoney(result.needRetireMoney)}
                              </span>
                            </>
                          }
                        />
                       <TimelineItem
  age={`${result.pensionEndAge}세`}
  title="연금 종료"
  desc={
    <>
      매월{" "}
      <span className="text-blue-600 font-semibold">
        {Number(targetPension || 0).toLocaleString()}만원
      </span>
      씩{" "}
      <span className="text-blue-600 font-semibold">
        {pensionYears}
      </span>
      년 수령
    </>
  }
  last
/>
                      </>
                    )}

                    {tab === "pension" && (
  <>
    <TimelineItem
      age={`${currentAge}세`}
      title="현재 나이"
      desc="저축 시작"
    />

    <TimelineItem
      age={`${result.savingEndAge}세`}
      title="저축 종료"
      desc={
        <>
          저축 완료 자산{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.lumpTotal)}
          </span>
        </>
      }
    />

    <TimelineItem
      age={`${pensionStartAge}세`}
      title="연금 개시"
      desc={
        <>
          연금개시 자산{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.pensionTotal)}
          </span>
          <br />
          월{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.estimatedMonthlyPension)}
          </span>{" "}
          수령
        </>
      }
    />

    <TimelineItem
      age={`${result.pensionEndAge}세`}
      title="연금 종료"
      desc={
        <>
          <span className="text-blue-600 font-semibold">
            {pensionYears}
          </span>
          년 수령
        </>
      }
      last
    />
  </>
)}

                    {tab === "lump" && (
                      <>
                        <TimelineItem
                          age={`${currentAge}세`}
                          title="현재 나이"
                          desc="저축 시작"
                        />
                        <TimelineItem
                          age={`${result.savingEndAge}세`}
                          title="저축 종료"
                          desc={
                            <>
                              예상 목돈{" "}
                              <span className="text-blue-600 font-semibold">
                                {formatKoreanMoney(result.lumpTotal)}
                              </span>
                            </>
                          }
                          last
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResult && !missingInput && !result.error && tab === "nps" && (
            <div className="space-y-5 mt-6">
              <div className="bg-blue-50 rounded-3xl p-7 text-center">
                <p className="text-gray-700 text-lg font-medium leading-relaxed">
                  월 납입보험료{" "}
                  <span className="font-semibold">
                    {formatWon(Number(npsPremium || 0))}원
                  </span>
                  기준
                  <br />
                  추정 소득기준은{" "}
                  <span className="text-blue-600 font-semibold">
                    {formatWon(result.nps.incomeBase)}원
                  </span>
                  입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
              <section className="md:rounded-2xl md:border md:border-blue-100 md:bg-blue-50/40 md:p-5 flex flex-col gap-6">
              <div className="flex items-center gap-3"><span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600"><UserRound className="w-5 h-5" /></span><SectionTitle title="노령연금" desc="가입기간별 월 지급예상액" /></div>

              <div className="divide-y divide-gray-200/60 lg:min-h-[280px] flex flex-col justify-between [&>div]:flex-1">
                {result.nps.oldAge.map((item) => (
                  <NpsCard
                    key={item.years}
                    label={`${item.years}년 가입`}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              </section>
              <section className="md:rounded-2xl md:border md:border-amber-100 md:bg-amber-50/40 md:p-5 flex flex-col gap-6">
              <div className="flex items-center gap-3"><span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600"><Accessibility className="w-5 h-5" /></span><SectionTitle title="장애연금" desc="등급별 예상액 · 4급은 일시금" /></div>

              <div className="divide-y divide-gray-200/60 lg:min-h-[280px] flex flex-col justify-between [&>div]:flex-1">
                {result.nps.disability.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              </section>
              <section className="md:rounded-2xl md:border md:border-pink-100 md:bg-pink-50/40 md:p-5 flex flex-col gap-6">
              <div className="flex items-center gap-3"><span className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600"><UsersRound className="w-5 h-5" /></span><SectionTitle title="유족연금" desc="가입기간별 월 지급예상액" /></div>

              <div className="divide-y divide-gray-200/60 lg:min-h-[280px] flex flex-col justify-between [&>div]:flex-1">
                {result.nps.survivor.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>
              </section>
              </div>
            </div>
          )}

          </div>
          <div className="mt-6 text-xs text-gray-500 leading-relaxed lg:col-span-2">
  {tab === "nps" ? (
    <>
      국민연금은 2026년 7월 예상연금월액표 기준이며 표 사이의 소득은 보간한 추정값입니다
      실제 수령액은 가입 이력 · 재평가율 · 부양가족연금액 · 제도 변경에 따라
      달라질 수 있습니다
    </>
  ) : (
    <>
      계산값은 입력값과 일반적인 산식에 따른 간편 추정 결과입니다
      연 수익률을 12로 나눈 월 이율과 매월 말 납입·수령을 가정합니다<br />물가상승률 · 세금 · 수수료는 반영하지 않습니다
    </>
  )}
</div>
        </div>
      </CalculatorPageLayout>
{npsTableOpen && <NpsTableModal onClose={closeNpsPopup} />}
{lifeOpen && (
  <div
    onMouseMove={(e) => movePopup(e, "life")}
    onMouseUp={stopPopupMove}
    onMouseLeave={stopPopupMove}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div data-popup-frame="true"
  onClick={(e) => e.stopPropagation()}
  style={{
    transform: `translate(${lifePopupPos.x}px, ${lifePopupPos.y}px)`,
  }}
  className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div data-popup-header="true"
  onMouseDown={(e) => {
  if (window.innerWidth < 768) return;

  lifeDragRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    originX: lifePopupPos.x,
    originY: lifePopupPos.y,
  };
}}
  className="bg-white text-slate-800 px-5 py-4 flex items-center justify-between"
>
        <div data-popup-title="true" className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          기대수명 계산기
        </div>

        <button data-popup-close="true"
  onClick={closeLifePopup}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        <div data-tab-group="true" className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
          {(["남성", "여성"] as LifeGender[]).map((item) => (
            <button
              key={item}
              onClick={() => setLifeGender(item)}
              className={`rounded-xl py-3 text-sm font-bold transition ${
                lifeGender === item
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-5">
  <label className="text-lg font-black text-gray-800 mb-3 block">
    현재 나이
  </label>

  <div className="relative">
    <input
      value={lifeAge}
      onChange={(e) =>
        setLifeAge(e.target.value.replace(/[^0-9]/g, ""))
      }
      placeholder="나이를 입력하세요"
      inputMode="numeric"
      className="placeholder:text-sm placeholder:font-normal placeholder:text-gray-400 
        w-full
        h-14
        rounded-2xl
        border
        border-gray-200
        px-5
        pr-16
        text-lg
        font-bold
        outline-none
        focus:ring-2
        focus:ring-blue-500
      "
    />

    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
      세
    </span>
  </div>
</div>

        <div className="bg-blue-50 rounded-3xl p-6 text-center mb-5">
          <img
            src={`/icons/pension/${lifeGender === "남성" ? "male" : "female"}.png`}
            alt={lifeGender}
            className="w-20 h-20 object-contain mx-auto mb-4"
          />

          {selectedLife ? (
            <p className="text-gray-700 text-lg font-medium leading-relaxed">
              현재 <span className="font-bold">{lifeAge}세</span>{" "}
              <span className="font-bold">{lifeGender}</span> 기준,
              <br />
              예상 기대수명은 약{" "}
              <span className="text-blue-600 font-black">
                {expectAge.toFixed(1)}세
              </span>
              입니다.
            </p>
          ) : (
            <p className="text-gray-400 text-sm leading-relaxed">
              나이를 입력하면 기대여명과 건강기간을 확인할 수 있습니다.
            </p>
          )}
        </div>

        {selectedLife && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <p className="text-sm font-bold text-gray-500 mb-2">기대여명</p>
              <p className="text-2xl font-black text-blue-600">
                {expectYears.toFixed(1)}년
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <p className="text-sm font-bold text-gray-500 mb-2">건강기간</p>
              <p className="text-2xl font-black text-blue-600">
                {healthyYears.toFixed(1)}년
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <p className="text-sm font-bold text-gray-500 mb-2">유병기간</p>
              <p className="text-2xl font-black text-blue-600">
                {sickYears.toFixed(1)}년
              </p>
            </div>
          </div>
        )}

        {selectedLife && (
  <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-200 p-4">
    <p className="text-sm text-gray-700 leading-relaxed">
  현재 <span className="font-bold">{lifeAge}세</span>{" "}
  <span className="font-bold">{lifeGender}</span> 기준,
  예상 기대수명은 약{" "}
  <span className="font-bold text-blue-600">
    {expectAge.toFixed(1)}세
  </span>
  이며 남은 기대여명은 약{" "}
  <span className="font-bold text-blue-600">
    {expectYears.toFixed(1)}년
  </span>
  입니다.
  <br />
  건강기간은 약{" "}
  <span className="font-bold text-blue-600">
    {healthyYears.toFixed(1)}년
  </span>
  으로, 약{" "}
  <span className="font-bold text-blue-600">
    {sickStartAge.toFixed(1)}세
  </span>
  부터 평균{" "}
  <span className="font-bold text-blue-600">
    {sickYears.toFixed(1)}년
  </span>
  동안 유병기간이 이어질 수 있습니다.
</p>
  </div>
)}


        <p className="text-xs text-gray-500 leading-relaxed mt-5 px-1">
  본 자료는 통계청 「2024년 생명표」 및
  유병기간 제외 기대수명(건강수명) 통계를 참고하여 계산한 추정값이며,
  개인의 건강상태 · 생활습관 · 질병 이력 등에 따라 실제 결과와 다를 수 있습니다.
</p>
      </div>
    </div>
  </div>
)}









{contextMenu && (
  <div
    style={{ top: contextMenu.y, left: contextMenu.x }}
    className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32"
    onPointerDown={(e) => e.stopPropagation()}
  >
    <button
      onClick={() => {
        const target = memos.find((m) => m.id === contextMenu.id);
        if (target) openMemoEdit(target);
        setContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default text-left"
    >
      수정
    </button>
    <button
      onClick={() => {
        deleteMemo(contextMenu.id);
        setContextMenu(null);
      }}
      className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-default text-left border-t border-gray-100"
    >
      삭제
    </button>
  </div>
)}





      <>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a href="https://naver.me/xsZ8mk7H" className="py-3 flex flex-col items-center gap-1">
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a href="https://open.kakao.com/o/gD7ej63h" className="py-3 flex flex-col items-center gap-1">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a href="https://www.instagram.com/g__tree_/" className="py-3 flex flex-col items-center gap-1">
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
      </>
    </main>
  );
}

function ResultAmount({ value }: { value: string }) {
  return (
    <div className="mt-5">
      <span className="text-5xl font-black text-blue-600">{value}</span>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

function NpsCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-1">
      <p className="text-sm md:text-base font-semibold text-gray-700">{label}</p>
      <p className="text-xl font-bold text-gray-900 whitespace-nowrap">
        {value}
        <span className="text-sm font-medium text-gray-700 ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}

function TopButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        h-12 rounded-2xl font-bold text-sm transition
        ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
      `}
    >
      {children}
    </button>
  );
}

function InputBox({
  label,
  value,
  setValue,
  unit,
  decimal,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  unit: string;
  decimal?: boolean;
}) {
  return (
    <div className="mb-5">
      <label className="text-lg font-black text-gray-800 mb-3 block">
        {label}
      </label>

      <div data-calculator-field="true" className="relative">
        <input
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          value={
  decimal
    ? value
    : value
    ? Number(String(value).replaceAll(",", "")).toLocaleString()
    : ""
}
          onChange={(e) => {
            const raw = e.target.value.replaceAll(",", "");
            setValue(
              decimal
                ? raw.replace(/[^0-9.]/g, "")
                : raw.replace(/[^0-9]/g, "")
            );
          }}
          className="
            w-full h-16 rounded-2xl border border-gray-200
            px-5 pr-20 text-lg font-bold outline-none
            focus:ring-2 focus:ring-blue-500
          "
        />

        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
          {unit}
        </span>
      </div>
    </div>
  );
}

function TimelineItem({
  age,
  title,
  desc,
  last,
}: {
  age: string;
  title: string;
  desc: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`relative flex items-center gap-5 ${last ? "" : "pb-10"}`}>
      <div
        className={`
          w-20 h-20 rounded-full border-4 border-white
          bg-blue-600 text-white flex items-center
          justify-center text-xl font-black shadow-lg
        `}
      >
        {age}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm min-w-[220px]">
        <p className="text-gray-500 font-bold text-sm">{title}</p>
        <p className="text-lg font-medium text-gray-900 mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
