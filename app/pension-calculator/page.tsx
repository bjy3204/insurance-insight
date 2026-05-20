"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PiggyBank,
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

import {
  npsOldAgeTable,
  npsDisabilityTable,
  npsSurvivorTable,
} from "./npsTableData";
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

type TabType = "retire" | "pension" | "lump" | "nps";
type NpsTableTab = "노령연금" | "장애연금" | "유족연금";
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
  const [tab, setTab] = useState<TabType>("retire");
  const [npsTableOpen, setNpsTableOpen] = useState(false);


const [npsTableTab, setNpsTableTab] = useState<NpsTableTab>("노령연금");
const [lifeGender, setLifeGender] = useState<LifeGender>("남성");
const [npsSearch, setNpsSearch] = useState("");
const [pensionInfoOpen, setPensionInfoOpen] = useState(false);
const [lifeOpen, setLifeOpen] = useState(false);
const [npsPopupPos, setNpsPopupPos] = useState({ x: 0, y: 0 });
const [lifePopupPos, setLifePopupPos] = useState({ x: 0, y: 0 });

const npsDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const lifeDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const movePopup = (
  e: React.MouseEvent,
  type: "nps" | "life"
) => {
  const drag = type === "nps" ? npsDragRef.current : lifeDragRef.current;
  if (!drag.isDragging) return;

  const nextPos = {
    x: drag.originX + e.clientX - drag.startX,
    y: drag.originY + e.clientY - drag.startY,
  };

  if (type === "nps") {
    setNpsPopupPos(nextPos);
  } else {
    setLifePopupPos(nextPos);
  }
};

const stopPopupMove = () => {
  npsDragRef.current.isDragging = false;
  lifeDragRef.current.isDragging = false;
};

const closeNpsPopup = () => {
  setNpsTableOpen(false);
  setNpsPopupPos({ x: 0, y: 0 });
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

const [memoOpen, setMemoOpen] = useState(false);
const [memos, setMemos] = useState<MemoItem[]>([]);
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
  const syncMemos = () => {
    const savedMemos = localStorage.getItem("personalMemos");

    setMemos(savedMemos ? JSON.parse(savedMemos) : []);
  };

  syncMemos();

  window.addEventListener("memo-storage-updated", syncMemos);
  window.addEventListener("storage", syncMemos);

  return () => {
    window.removeEventListener(
      "memo-storage-updated",
      syncMemos
    );

    window.removeEventListener("storage", syncMemos);
  };
}, []);

useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;

    const savedMemos =
      localStorage.getItem("personalMemos");

    if (!savedMemos) return;

    const parsedMemos: MemoItem[] =
      JSON.parse(savedMemos);

    const targetMemo = parsedMemos.find(
      (memo) => memo.id === memoId
    );

    if (!targetMemo) return;

    setMemos(parsedMemos);

    openMemoEdit(targetMemo);
  };

  window.addEventListener(
    "open-memo-detail",
    openMemoDetail
  );

  return () => {
    window.removeEventListener(
      "open-memo-detail",
      openMemoDetail
    );
  };
}, []);

const saveMemos = (nextMemos: MemoItem[]) => {
  setMemos(nextMemos);

  localStorage.setItem(
    "personalMemos",
    JSON.stringify(nextMemos)
  );

  window.dispatchEvent(
    new Event("memo-storage-updated")
  );
};

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

  const result = useMemo(() => {
    const current = Number(currentAge || 0);
    const startAge = Number(pensionStartAge || 0);
    const receiveYears = Number(pensionYears || 0);
    const saveYears = Number(savingYears || 0);

    const monthlySave = Number(monthly || 0) * 10000;
    const targetMonthlyPension = Number(targetPension || 0) * 10000;

    const annualRate = Number(rate || 0) / 100;
    const monthlyRate = annualRate / 12;

    const savingMonths =
  tab === "retire"
    ? Math.max(startAge - current, 0) * 12
    : Math.max(saveYears, 0) * 12;
const inputSavingMonths = savingMonths;
const retireMonths = Math.max(startAge - current, 0) * 12;
const pensionMonths = receiveYears * 12;

    const pensionFactor =
      monthlyRate === 0
        ? pensionMonths
        : (1 - Math.pow(1 + monthlyRate, -pensionMonths)) / monthlyRate;

    const needRetireMoney = targetMonthlyPension * pensionFactor;


    const savingFactorForRetire =
      monthlyRate === 0
        ? savingMonths
        : (Math.pow(1 + monthlyRate, savingMonths) - 1) / monthlyRate;

    const requiredMonthlySaving =
  savingFactorForRetire === 0
    ? 0
    : needRetireMoney / savingFactorForRetire;

    const lumpTotal =
      monthlyRate === 0
        ? monthlySave * inputSavingMonths
        : monthlySave *
          ((Math.pow(1 + monthlyRate, inputSavingMonths) - 1) / monthlyRate);

    const monthsBetweenSavingEndAndPensionStart = Math.max(
  retireMonths - inputSavingMonths,
  0
);

const pensionTotal =
  lumpTotal * Math.pow(1 + monthlyRate, monthsBetweenSavingEndAndPensionStart);

    const estimatedMonthlyPension =
      pensionFactor === 0 ? 0 : pensionTotal / pensionFactor;

    const nps = Number(npsPremium || 0);

const NPS_A_VALUE = 3193511;

// 2026년 5월 현재 기준
const NPS_MIN_INCOME = 400000;
const NPS_MAX_INCOME = 6370000;
const NPS_RATE = 0.09;


const incomeBase = Math.min(
  Math.max(nps / NPS_RATE, NPS_MIN_INCOME),
  NPS_MAX_INCOME
);

const calcNpsBase = (years: number) => {
  const months = years * 12;
  const over20Months = Math.max(months - 240, 0);

  return (
    1.29 *
    (NPS_A_VALUE + incomeBase) *
    (1 + (0.05 * over20Months) / 12)
  );
};

const calcOldAge = (years: number) => {
  if (years < 10) return 0;

  const months = years * 12;

  const paymentRate = Math.min(
    0.5 + ((months - 120) * 5) / 12 / 100,
    1
  );

  return (calcNpsBase(years) * paymentRate) / 12;
};

    return {
      current,
      startAge,
      receiveYears,
      pensionEndAge: startAge + receiveYears,
      savingEndAge: current + saveYears,

      needRetireMoney,
      requiredMonthlySaving,

      pensionTotal,
      estimatedMonthlyPension,

      lumpTotal,

      nps: {
        incomeBase,
        oldAge: [
          { years: 10, amount: calcOldAge(10) },
          { years: 20, amount: calcOldAge(20) },
          { years: 30, amount: calcOldAge(30) },
        ],
        disability: [
  { label: "장애 1급", amount: (calcNpsBase(20) * 1) / 12 },
  { label: "장애 2급", amount: (calcNpsBase(20) * 0.8) / 12 },
  { label: "장애 3급", amount: (calcNpsBase(20) * 0.6) / 12 },
  { label: "장애 4급(일시금)", amount: calcNpsBase(20) * 2.25 },
],
survivor: [
  { label: "10년 미만 가입", amount: (calcNpsBase(1) * 0.4) / 12 },
  { label: "10년~20년 미만", amount: (calcNpsBase(15) * 0.5) / 12 },
  { label: "20년 가입", amount: (calcNpsBase(20) * 0.6) / 12 },
],
      },
    };
  }, [
    tab,
    currentAge,
    pensionStartAge,
    pensionYears,
    targetPension,
    monthly,
    savingYears,
    rate,
    npsPremium,
  ]);

  const description = {
    retire:
      "희망하는 월 연금액을 입력하시면 필요한 은퇴자금과 매월 저축해야 하는 금액을 계산할 수 있습니다.",
    pension:
      "저축금액과 저축기간을 기준으로 연금개시 시점의 예상 월 연금액을 계산할 수 있습니다.",
    lump:
      "매월 저축 가능한 금액과 저축기간을 입력하시면 은퇴시점에 얼마나 모이는지 알 수 있습니다.",
    nps:
      "월 납입보험료를 기준으로 국민연금 예상 수령액을 간편하게 확인할 수 있습니다.",
  };
const currentNpsTable =
  npsTableTab === "노령연금"
    ? npsOldAgeTable
    : npsTableTab === "장애연금"
    ? npsDisabilityTable
    : npsSurvivorTable;

const filteredNpsTable = currentNpsTable.filter((row: any) =>
  
  `${row.income} ${row.premium}`
    .replaceAll(",", "")
    .includes(npsSearch.replaceAll(",", ""))
);
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
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
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

              <p className="text-sm text-gray-500 mt-1">
                은퇴자금 · 연금액 · 국민연금 계산
              </p>
            </div>

            <button
  onClick={() => setMemoOpen(true)}
  className="
  absolute
  right-0
  hidden
  md:flex
    w-11
    h-11
    rounded-full
    border
    border-gray-200
    shadow-sm
    bg-white
    hover:bg-gray-50
    items-center
    justify-center
    transition
    cursor-default
  "
>
  <StickyNote className="w-5 h-5 text-gray-400" />
</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-200 rounded-2xl p-1 mb-7 gap-1">
  <button
    onClick={() => setTab("retire")}
    className={`rounded-xl py-3 font-bold transition ${
      tab === "retire"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    은퇴설계
  </button>

  <button
    onClick={() => setTab("pension")}
    className={`rounded-xl py-3 font-bold transition ${
      tab === "pension"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    연금액
  </button>

  <button
    onClick={() => setTab("lump")}
    className={`rounded-xl py-3 font-bold transition ${
      tab === "lump"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    목돈
  </button>

  <button
    onClick={() => setTab("nps")}
    className={`rounded-xl py-3 font-bold transition ${
      tab === "nps"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    국민연금
  </button>
</div>

        <div className="text-center text-sm text-gray-500 leading-relaxed mb-5">
          {description[tab]}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-5">
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
              label="월 납입보험료"
              value={npsPremium}
              setValue={setNpsPremium}
              unit="원"
            />
          )}

          {tab !== "nps" && (
            <>
              <div className="bg-blue-50 rounded-3xl p-7 text-center mt-6">
                {tab === "retire" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      현재가치 기준으로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(targetPension || 0).toLocaleString()}만원
                      </span>
                      의 연금을
                      <br />
                      <span className="font-semibold">{pensionStartAge}세</span>
                      부터{" "}
                      <span className="font-semibold">{pensionYears}년</span>간
                      받으려면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.needRetireMoney)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      <span className="font-semibold">{pensionStartAge}세</span>
                      시점까지 준비되어 있어야 하며,
                      <br />
                      매월{" "}
                      <span className="text-blue-600 font-semibold">
                        {formatKoreanMoney(result.requiredMonthlySaving)}
                      </span>
                      씩 저축해야 합니다.
                    </p>
                  </>
                )}

                {tab === "pension" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      연 <span className="font-semibold">{rate}%</span>의
                      수익률로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(monthly || 0).toLocaleString()}만원
                      </span>
                      씩{" "}
                      <span className="font-semibold">{savingYears}년</span>{" "}
                      동안 저축하면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.pensionTotal)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      <span className="font-semibold">{pensionStartAge}세</span>
 연금개시 시점에 모이며,
<br />
<span className="font-semibold">{pensionYears}년</span>
 동안 받을 예상 월 연금은{" "}
                      <span className="text-blue-600 font-semibold">
                        {formatKoreanMoney(result.estimatedMonthlyPension)}
                      </span>
                      입니다.
                    </p>
                  </>
                )}

                {tab === "lump" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      연 <span className="font-semibold">{rate}%</span>의
                      수익률로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(monthly || 0).toLocaleString()}만원
                      </span>
                      씩{" "}
                      <span className="font-semibold">{savingYears}년</span>{" "}
                      동안 저축하면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.lumpTotal)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      은퇴시점에 모입니다.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-3xl p-8 mt-6">
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
            </>
          )}

          {tab === "nps" && (
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

              <SectionTitle title="노령연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.nps.oldAge.map((item) => (
                  <NpsCard
                    key={item.years}
                    label={`${item.years}년 가입`}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              <SectionTitle title="장애연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {result.nps.disability.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              <SectionTitle title="유족연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.nps.survivor.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-xs text-gray-500 leading-relaxed">
  {tab === "nps" ? (
    <>
      국민연금은 2026년 A값과 기준소득월액을 기준으로 단순 계산한 값입니다.
      실제 수령액은 가입 이력, 재평가율, 부양가족연금액, 제도 변경에 따라
      달라질 수 있습니다.
    </>
  ) : (
    <>
      계산값은 입력값과 일반적인 산식에 따른 간편 추정 결과입니다.
      실제 금융상품 수익률, 세금, 수수료 등에 따라 실제 금액과 다를 수 있습니다.
    </>
  )}
</div>
        </div>
      </div>
<button
  onClick={() => setPensionInfoOpen(!pensionInfoOpen)}
  className="
    fixed
    left-6
    bottom-24
   z-[999]
    w-14
    h-14
    rounded-full
    bg-gray-800
    shadow-lg
    flex
    items-center
    justify-center
    hover:shadow-2xl
    hover:-translate-y-0.5
    transition-all
    duration-200
   
  "
>
  <FileText className="w-6 h-6 text-white" />
</button>
{pensionInfoOpen && (
  <div
    onClick={() => setPensionInfoOpen(false)}
    className="fixed inset-0 z-[9999]"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        fixed
        left-6
        bottom-40
        z-40
        bg-white
        border
        border-gray-200
        shadow-xl
        rounded-2xl
        p-3
        flex
        flex-col
        gap-2
        w-64
      "
    >
    <button
      onClick={() => {
        setNpsTableOpen(true);
        setPensionInfoOpen(false);
      }}
      className="w-full px-4 py-3 rounded-2xl bg-gray-100 text-left hover:bg-blue-50 hover:text-blue-600 transition"
    >
      <p className="text-sm font-bold text-gray-800">
        국민연금 예상연금월액표
      </p>
      <p className="text-xs text-gray-400 mt-1">
        노령 · 장애 · 유족연금 기준표
      </p>
    </button>

    <button
      onClick={() => {
        setLifeOpen(true);
        setPensionInfoOpen(false);
      }}
      className="w-full px-4 py-3 rounded-2xl bg-gray-100 text-left hover:bg-blue-50 hover:text-blue-600 transition "
    >
      <p className="text-sm font-bold text-gray-800">
        평균 기대수명 계산기
      </p>
      <p className="text-xs text-gray-400 mt-1">
        기대여명 · 건강기간 · 유병기간 계산
      </p>
    </button>
      </div>
  </div>
)}

{npsTableOpen && (
  <div
    onMouseMove={(e) => movePopup(e, "nps")}
    onMouseUp={stopPopupMove}
    onMouseLeave={stopPopupMove}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
   <div
  onClick={(e) => e.stopPropagation()}
  style={{
    transform: `translate(${npsPopupPos.x}px, ${npsPopupPos.y}px)`,
  }}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onMouseDown={(e) => {
  if (window.innerWidth < 768) return;

  npsDragRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    originX: npsPopupPos.x,
    originY: npsPopupPos.y,
  };
}}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          국민연금 예상연금월액표
        </div>

        <button
  onClick={closeNpsPopup}
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

      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-5">
          {(["노령연금", "장애연금", "유족연금"] as NpsTableTab[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                setNpsTableTab(item);
                setNpsSearch("");
              }}
              className={`rounded-xl py-3 text-sm font-bold transition ${
                npsTableTab === item
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={
  npsSearch
    ? Number(npsSearch.replaceAll(",", "")).toLocaleString()
    : ""
}
onChange={(e) =>
  setNpsSearch(
    e.target.value.replaceAll(",", "").replace(/[^0-9]/g, "")
  )
}
            placeholder="보험료 또는 기준소득월액 검색"
            className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="overflow-auto flex-1 border border-gray-200 rounded-2xl">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
  <tr>
    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
      번호
    </th>

    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
      기준소득월액
    </th>

    <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">
      보험료
    </th>

    {npsTableTab === "노령연금" ? (
      <>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">15년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">20년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">25년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">30년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">35년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">40년</th>
      </>
    ) : npsTableTab === "장애연금" ? (
      <>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애1급</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애2급</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애3급</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">장애4급</th>
      </>
    ) : (
      <>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10년 미만</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">10~20년</th>
        <th className="py-3 px-3 border-b border-gray-200 whitespace-nowrap">20년 이상</th>
      </>
    )}
  </tr>
</thead>

            <tbody>
  {filteredNpsTable.map((row: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
        {row.no?.toLocaleString()}
      </td>

      <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
        {row.income?.toLocaleString()}
      </td>

      <td className="py-3 px-3 text-center border-b border-gray-100 whitespace-nowrap">
        {row.premium?.toLocaleString()}
      </td>

      {npsTableTab === "노령연금" ? (
        <>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year10?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year15?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year20?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year25?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year30?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year35?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year40?.toLocaleString()}</td>
        </>
      ) : npsTableTab === "장애연금" ? (
        <>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade1?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade2?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade3?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.grade4Lump?.toLocaleString()}</td>
        </>
      ) : (
        <>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.under10?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.between10And20?.toLocaleString()}</td>
          <td className="py-3 px-3 text-center border-b border-gray-100">{row.year20?.toLocaleString()}</td>
        </>
      )}
    </tr>
  ))}
</tbody>
          </table>

          {filteredNpsTable.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-10">
              검색 결과가 없습니다
            </div>
          )}
          
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mt-4 px-1">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;본 표는 2026년 국민연금 예상연금월액표 기준이며,
  실제 수령액은 가입이력 · 재평가율 · 연금개시연령 ·
  부양가족연금액 및 제도 변경 등에 따라 달라질 수 있습니다. (단위 :원)
</p>
      </div>
    </div>
  </div>
)}
{lifeOpen && (
  <div
    onMouseMove={(e) => movePopup(e, "life")}
    onMouseUp={stopPopupMove}
    onMouseLeave={stopPopupMove}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div
  onClick={(e) => e.stopPropagation()}
  style={{
    transform: `translate(${lifePopupPos.x}px, ${lifePopupPos.y}px)`,
  }}
  className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
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
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          기대수명 계산기
        </div>

        <button
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
        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
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
      className="
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



{memoOpen && (
  <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <NotebookPen className="w-5 h-5" />
          메모장
        </div>

        <button
          onClick={() => setMemoOpen(false)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={memoSearch}
            onChange={(e) => {
              setMemoSearch(e.target.value);
              setMemoPage(1);
            }}
            placeholder="메모 검색"
            className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <button
          onClick={() => {
            setMemoAddPopupPos({ x: 0, y: 0 });
            stopMemoPopupMove();
            setMemoAddOpen(true);
          }}
          className="h-12 px-5 rounded-2xl bg-gray-800 text-white text-sm font-bold flex items-center gap-2 cursor-default"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
          {filteredMemos.length === 0 ? (
            <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400">
              저장된 메모가 없습니다.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMemoDragEnd}
            >
              <SortableContext
                items={pagedMemos
                  .filter((memo) => !memo.pinned)
                  .map((memo) => memo.id)}
                strategy={rectSortingStrategy}
              >
                {pagedMemos.map((memo) => (
                  <SortableMemoCard key={memo.id} memo={memo}>
                    <div
                      onDoubleClick={() => openMemoEdit(memo)}
                      className={`
                        rounded-2xl
                        border
                        p-4
                        shadow-sm
                        hover:shadow-md
                        transition
                        cursor-default
                        ${getMemoColorClass(memo.color)}
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-gray-900 break-keep">
  {memo.title || ""}
</h3>

<p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">
  {memo.content}
</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoVisible(memo.id);
                            }}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                              ${
                                memo.visible
                                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }
                            `}
                          >
                            {memo.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoPinned(memo.id);
                            }}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                              ${
                                memo.pinned
                                  ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
                                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }
                            `}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemoEdit(memo);
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-default"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SortableMemoCard>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
        <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
          <button
            onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
            disabled={memoPage === 1}
            className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
          >
            이전
          </button>

          {Array.from({ length: Math.min(totalMemoPages, 10) }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setMemoPage(page)}
                className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                  memoPage === page
                    ? "bg-slate-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setMemoPage((p) => Math.min(totalMemoPages, p + 1))}
            disabled={memoPage === totalMemoPages}
            className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{memoAddOpen && (
  <div
    onMouseMove={(e) => moveMemoPopup(e, "memoAdd")}
    onMouseUp={stopMemoPopupMove}
    onMouseLeave={stopMemoPopupMove}
    onClick={() => setMemoAddOpen(false)}
    className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
  >
    <div
      style={{
        transform: `translate(${memoAddPopupPos.x}px, ${memoAddPopupPos.y}px)`,
      }}
      onMouseDown={(e) => {
        if (window.innerWidth < 768) return;

        const target = e.target as HTMLElement;

        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }

        memoAddDragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          originX: memoAddPopupPos.x,
          originY: memoAddPopupPos.y,
        };
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 추가</h2>

        <div className="flex items-center gap-2">
          {memoColorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setMemoColor(color.value)}
              className={`
                w-7 h-7 rounded-full border transition hover:scale-105
                ${
                  memoColor === color.value
                    ? "ring-2 ring-gray-400 ring-offset-2"
                    : ""
                }
                ${color.className}
              `}
            />
          ))}

          <button
            onClick={() => setMemoAddOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <input
        value={memoTitle}
        onChange={(e) => setMemoTitle(e.target.value)}
        placeholder="메모 제목"
        className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none mb-3"
      />

      <textarea
        value={memoContent}
        onChange={(e) => setMemoContent(e.target.value)}
        placeholder="메모 내용을 입력하세요"
        className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
      />

      <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
        ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setMemoAddOpen(false)}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
        >
          취소
        </button>

        <button
          onClick={() => {
            addMemo();
            setMemoAddOpen(false);
            
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}

{selectedMemo && (
  <div
    onMouseMove={(e) => moveMemoPopup(e, "memoEdit")}
    onMouseUp={stopMemoPopupMove}
    onMouseLeave={stopMemoPopupMove}
    className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
  >
    <div
      style={{
        transform: `translate(${memoEditPopupPos.x}px, ${memoEditPopupPos.y}px)`,
      }}
      onMouseDown={(e) => {
        if (window.innerWidth < 768) return;

        const target = e.target as HTMLElement;

        if (
          target.closest("button") ||
          target.closest("input") ||
          target.closest("textarea")
        ) {
          return;
        }

        memoEditDragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          originX: memoEditPopupPos.x,
          originY: memoEditPopupPos.y,
        };
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 수정</h2>

        <div className="flex items-center gap-2">
          {memoColorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                changeMemoColor(selectedMemo.id, color.value);

                setSelectedMemo({
                  ...selectedMemo,
                  color: color.value,
                  updatedAt: new Date().toISOString(),
                });
              }}
              className={`
                w-7 h-7 rounded-full border transition hover:scale-105
                ${
                  selectedMemo.color === color.value
                    ? "ring-2 ring-gray-400 ring-offset-2"
                    : ""
                }
                ${color.className}
              `}
            />
          ))}

          <button
            onClick={() => {
              setSelectedMemo(null);
              setMemoEditPopupPos({ x: 0, y: 0 });
              memoEditDragRef.current = {
                isDragging: false,
                startX: 0,
                startY: 0,
                originX: 0,
                originY: 0,
              };
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <input
        value={selectedMemo.title}
        onChange={(e) =>
          setSelectedMemo({
            ...selectedMemo,
            title: e.target.value,
          })
        }
        placeholder="메모 제목"
        className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3"
      />

      <textarea
        value={selectedMemo.content}
        onChange={(e) =>
          setSelectedMemo({
            ...selectedMemo,
            content: e.target.value,
          })
        }
        placeholder="메모 내용을 입력하세요"
        className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
      />

      <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
        ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => deleteMemo(selectedMemo.id)}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default"
        >
          삭제
        </button>

        <button
          onClick={() => {
            const nextMemos = memos.map((memo) =>
              memo.id === selectedMemo.id
                ? {
                    ...selectedMemo,
                    updatedAt: new Date().toISOString(),
                  }
                : memo
            );

            saveMemos(nextMemos);
            setSelectedMemo(null);
            
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          완료
        </button>
      </div>
    </div>
  </div>
)}

{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">메모 삭제</h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        선택한 메모를 삭제하시겠습니까?
      </p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setDeleteMemoId(null);
            setDeleteMemoConfirmOpen(false);
          }}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
        >
          취소
        </button>

        <button
          onClick={confirmDeleteMemo}
          className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
)}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
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
    <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
      <p className="text-sm font-bold text-gray-500 mb-2">{label}</p>
      <p className="text-xl font-semibold text-black">
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

      <div className="relative">
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
        className="
          w-20 h-20 rounded-full border-4 border-white
          bg-blue-600 text-white flex items-center
          justify-center text-xl font-black shadow-lg
        "
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