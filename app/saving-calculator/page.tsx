"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Landmark,
  Newspaper,
  MessageCircle,
  StickyNote,
  NotebookPen,
  Pin,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Search,
  X,
  Percent,
} from "lucide-react";

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

type CalcType = "deposit" | "saving";
type InterestType = "simple" | "year" | "quarter" | "month";
type BankRateMonth = "12" | "24";

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

export default function SavingCalculatorPage() {
  const [type, setType] = useState<CalcType>("saving");
  const [interestType, setInterestType] = useState<InterestType>("simple");
  const [taxRate, setTaxRate] = useState(15.4);
  const [bankRateMonth, setBankRateMonth] =
  useState<BankRateMonth>("12");

  const [bankRates, setBankRates] = useState<any[]>([]);
const [bankBaseDate, setBankBaseDate] = useState("");

  const [depositMoney, setDepositMoney] = useState("");
  const [depositMonths, setDepositMonths] = useState("");
  const [depositRate, setDepositRate] = useState("");

  const [savingMoney, setSavingMoney] = useState("");
  const [savingMonths, setSavingMonths] = useState("");
  const [savingRate, setSavingRate] = useState("");

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);

const [bankRateOpen, setBankRateOpen] = useState(false);

const [bankPopupPos, setBankPopupPos] = useState({ x: 0, y: 0 });

const bankDragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const moveBankPopup = (e: React.MouseEvent) => {
  if (!bankDragRef.current.isDragging) return;

  setBankPopupPos({
    x: bankDragRef.current.originX + e.clientX - bankDragRef.current.startX,
    y: bankDragRef.current.originY + e.clientY - bankDragRef.current.startY,
  });
};

const stopBankPopupMove = () => {
  bankDragRef.current.isDragging = false;
};

const [memoOpen, setMemoOpen] = useState(false);
const [memos, setMemos] = useState<MemoItem[]>([]);
const [memoSearch, setMemoSearch] = useState("");
const [memoPage, setMemoPage] = useState(1);
const [memoTitle, setMemoTitle] = useState("");
const [memoContent, setMemoContent] = useState("");
const [memoColor, setMemoColor] =
  useState<MemoItem["color"]>("white");
const [memoAddOpen, setMemoAddOpen] = useState(false);
const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);


const [memoAddPopupPos, setMemoAddPopupPos] = useState({ x: 0, y: 0 });
const [memoEditPopupPos, setMemoEditPopupPos] = useState({ x: 0, y: 0 });

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
    type === "memoAdd" ? memoAddDragRef.current : memoEditDragRef.current;

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
    window.removeEventListener("memo-storage-updated", syncMemos);
    window.removeEventListener("storage", syncMemos);
  };
}, []);

useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;

    const savedMemos = localStorage.getItem("personalMemos");
    if (!savedMemos) return;

    const parsedMemos: MemoItem[] = JSON.parse(savedMemos);
    const targetMemo = parsedMemos.find((memo) => memo.id === memoId);

    if (!targetMemo) return;

    setMemos(parsedMemos);
    openMemoEdit(targetMemo);
  };

  window.addEventListener("open-memo-detail", openMemoDetail);

  return () => {
    window.removeEventListener("open-memo-detail", openMemoDetail);
  };
}, []);

const saveMemos = (nextMemos: MemoItem[]) => {
  setMemos(nextMemos);
  localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
  window.dispatchEvent(new Event("memo-storage-updated"));
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

const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? { ...memo, color, updatedAt: new Date().toISOString() }
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

  const nextMemos = memos.filter((memo) => memo.id !== deleteMemoId);

  saveMemos(nextMemos);
  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};

const toggleMemoVisible = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id ? { ...memo, visible: !memo.visible } : memo
    )
  );
};

const toggleMemoPinned = (id: string) => {
  saveMemos(
    memos.map((memo) =>
      memo.id === id
        ? { ...memo, pinned: !memo.pinned, updatedAt: new Date().toISOString() }
        : memo
    )
  );
};

const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);

  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;

  const pinnedMemos = memos.filter((memo) => memo.pinned);
  const normalMemos = memos.filter((memo) => !memo.pinned);

  const oldIndex = normalMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = normalMemos.findIndex((memo) => memo.id === over.id);

  saveMemos([...pinnedMemos, ...arrayMove(normalMemos, oldIndex, newIndex)]);
};

const filteredMemos = memos
  .filter((memo) =>
    `${memo.title} ${memo.content}`
      .toLowerCase()
      .includes(memoSearch.toLowerCase())
  )
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    return (
      memos.findIndex((memo) => memo.id === a.id) -
      memos.findIndex((memo) => memo.id === b.id)
    );
  });

const MEMOS_PER_PAGE = 6;

const totalMemoPages = Math.max(
  1,
  Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);

const memoColorOptions: {
  value: MemoItem["color"];
  className: string;
}[] = [
  { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
  { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
  { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
  { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
  {
    value: "clear",
    className:
      "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
  },
];


useEffect(() => {
  const fetchBankRates = async () => {
    try {
      const res = await fetch(
        `/api/bank-rates?month=${bankRateMonth}`
      );

      const data = await res.json();

      setBankRates(data);

      if (data.length > 0) {
        const baseMonth = data[0].baseMonth;

        if (baseMonth?.length === 6) {
          const formatted =
  `${baseMonth.slice(0, 4)}.` +
  `${baseMonth.slice(4, 6)}`;

          setBankBaseDate(formatted);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  fetchBankRates();
}, [bankRateMonth]);
  

const getMemoColorClass = (color: MemoItem["color"]) => {
  if (color === "blue") return "bg-blue-50 border-blue-100";
  if (color === "yellow") return "bg-yellow-50 border-yellow-100";
  if (color === "red") return "bg-red-50 border-red-100";
  if (color === "clear") return "bg-white/40 border-gray-200";
  return "bg-white border-gray-200";
};

  const getCompoundCount = () => {
    if (interestType === "year") return 1;
    if (interestType === "quarter") return 4;
    if (interestType === "month") return 12;
    return 1;
  };

  const result = useMemo(() => {
    if (type === "deposit") {
      const principal = Number(depositMoney || 0) * 10000;

const inputYears = Number(depositMonths || 0);
const months = inputYears * 12;

const rate = Number(depositRate || 0) / 100;

const years = months / 12;

      let beforeTaxTotal = principal;

      if (interestType === "simple") {
        beforeTaxTotal = principal + principal * rate * years;
      } else {
        const n =
          interestType === "year" ? 1 :
          interestType === "quarter" ? 4 :
          12;

        beforeTaxTotal = principal * Math.pow(1 + rate / n, n * years);
      }

      const interest = beforeTaxTotal - principal;
      const tax = interest * (taxRate / 100);
      const afterInterest = interest - tax;

      return {
        principal,
        interest,
        tax,
        afterInterest,
        total: principal + afterInterest,
      };
    }

    const monthly = Number(savingMoney || 0) * 10000;

const inputYears = Number(savingMonths || 0);
const months = inputYears * 12;

const rate = Number(savingRate || 0) / 100;

const principal = monthly * months;

    let beforeTaxTotal = principal;

    if (interestType === "simple") {
      const monthlyRate = rate / 12;
      const interest = monthly * monthlyRate * ((months * (months + 1)) / 2);
      beforeTaxTotal = principal + interest;
    } else {
      const n =
        interestType === "year" ? 1 :
        interestType === "quarter" ? 4 :
        12;

      beforeTaxTotal = 0;

      for (let i = 0; i < months; i++) {
        const remainingYears = (months - i) / 12;
        beforeTaxTotal += monthly * Math.pow(1 + rate / n, n * remainingYears);
      }
    }

    const interest = beforeTaxTotal - principal;
    const tax = interest * (taxRate / 100);
    const afterInterest = interest - tax;

    return {
      principal,
      interest,
      tax,
      afterInterest,
      total: principal + afterInterest,
    };
  }, [
    type,
    interestType,
    taxRate,
    depositMoney,
    depositMonths,
    depositRate,
    savingMoney,
    savingMonths,
    savingRate,
  ]);

  const formatMoney = (num: number) => {
    return Math.round(num / 10000).toLocaleString();
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* 헤더 */}
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
  rounded-2xl
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
                <Landmark className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  예금 · 적금 계산기
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                단리 · 복리 만기금액 계산
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
        {/* 탭 */}
<div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-7">
  <button
    onClick={() => {
      setType("saving");
      setInterestType("simple");
    }}
    className={`rounded-2xl py-3 font-bold transition ${
      type === "saving"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    적금
  </button>

  <button
    onClick={() => {
      setType("deposit");
      setInterestType("simple");
    }}
    className={`rounded-2xl py-3 font-bold transition ${
      type === "deposit"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    예금
  </button>
</div>

        <div className="bg-white rounded-3xl shadow-sm p-5">
          {/* 이자방식 */}
<div className="mb-6">
  <div className={`grid gap-2 mb-6 ${type === "saving" ? "grid-cols-2" : "grid-cols-4"}`}>
    <SelectButton
      active={interestType === "simple"}
      onClick={() => setInterestType("simple")}
    >
      단리
    </SelectButton>

    {type === "saving" ? (
      <SelectButton
        active={interestType === "month"}
        onClick={() => setInterestType("month")}
      >
        복리(월)
      </SelectButton>
    ) : (
      <>
        <SelectButton
          active={interestType === "year"}
          onClick={() => setInterestType("year")}
        >
          복리(년)
        </SelectButton>

        <SelectButton
          active={interestType === "quarter"}
          onClick={() => setInterestType("quarter")}
        >
          복리(3개월)
        </SelectButton>

        <SelectButton
          active={interestType === "month"}
          onClick={() => setInterestType("month")}
        >
          복리(월)
        </SelectButton>
      </>
    )}
  </div>
</div>
          {type === "deposit" ? (
            <>
              <InputBox label="예치금액" value={depositMoney} setValue={setDepositMoney} unit="만원" numeric />
              <InputBox label="예치기간" value={depositMonths} setValue={setDepositMonths} unit="년" numeric />
              <InputBox label="이자율 (%)" value={depositRate} setValue={setDepositRate} unit="%" decimal />
            </>
          ) : (
            <>
              <InputBox label="월 납입금액" value={savingMoney} setValue={setSavingMoney} unit="만원" numeric />
              <InputBox label="적립기간" value={savingMonths} setValue={setSavingMonths} unit="년" numeric />
              <InputBox label="이자율 (%)" value={savingRate} setValue={setSavingRate} unit="%" decimal />
            </>
          )}



          {/* 과세유형 */}
          <div className="mb-6">
            <label className="text-lg font-black text-gray-800 mb-3 block">
              과세유형
            </label>

            <div className="grid grid-cols-3 gap-2">
  <button
    onClick={() => setTaxRate(15.4)}
    className={`rounded-2xl py-3 font-bold border ${
      taxRate === 15.4
        ? "bg-blue-50 text-blue-600 border-blue-600"
        : "bg-white text-gray-600 border-gray-200"
    }`}
  >
    일반과세
  </button>

  <button
    onClick={() => setTaxRate(9.5)}
    className={`rounded-2xl py-3 font-bold border ${
      taxRate === 9.5
        ? "bg-blue-50 text-blue-600 border-blue-600"
        : "bg-white text-gray-600 border-gray-200"
    }`}
  >
    세금우대
  </button>

  <button
    onClick={() => setTaxRate(0)}
    className={`rounded-2xl py-3 font-bold border ${
      taxRate === 0
        ? "bg-blue-50 text-blue-600 border-blue-600"
        : "bg-white text-gray-600 border-gray-200"
    }`}
  >
    비과세
  </button>
</div>
          </div>

          {/* 결과 */}
          <div className="bg-blue-50 rounded-3xl p-7 text-center">
            <p className="text-gray-600 text-lg font-bold mb-2">
              세후 만기 수령액
            </p>

            <div className="flex items-end justify-center gap-3">
              <span className="text-5xl font-black text-blue-600 leading-none">
                {formatMoney(result.total)}
              </span>
              <span className="text-2xl font-bold text-gray-700 mb-1">
                만원
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5 text-sm">
              <ResultItem label="원금" value={result.principal} />
              <ResultItem label="세전이자" value={result.interest} />
              <ResultItem label="세금" value={result.tax} />
              <ResultItem label="세후이자" value={result.afterInterest} />
            </div>
          </div>

          <div className="mt-5 text-gray-500 text-sm space-y-1 leading-relaxed">
  <p>
    실제 금융상품의 금리, 세율, 우대조건에 따라 결과는 달라질 수 있습니다. 이자소득세: 일반과세(15.4%), 세금우대(9.5%)
  </p>

 
</div>
        </div>
      </div>

      
<button
  onClick={() => setBankRateOpen(true)}
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
  <Percent className="w-6 h-6 text-white" />
</button>

{bankRateOpen && (
  <div
    onMouseMove={moveBankPopup}
    onMouseUp={stopBankPopupMove}
    onMouseLeave={stopBankPopupMove}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div
  style={{
    transform: `translate(${bankPopupPos.x}px, ${bankPopupPos.y}px)`,
  }}
  className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
>
      <div
  onMouseDown={(e) => {
    if (window.innerWidth < 768) return;

    bankDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: bankPopupPos.x,
      originY: bankPopupPos.y,
    };
  }}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <Percent className="w-5 h-5" />
          주요 은행 {bankRateMonth}개월 예금 금리
        </div>

        <button
          onClick={() => setBankRateOpen(false)}
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
  <button
    onClick={() => setBankRateMonth("12")}
    className={`rounded-xl py-3 text-sm font-bold transition ${
      bankRateMonth === "12"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    12개월
  </button>

  <button
    onClick={() => setBankRateMonth("24")}
    className={`rounded-xl py-3 text-sm font-bold transition ${
      bankRateMonth === "24"
        ? "bg-white text-blue-600 shadow-sm"
        : "text-gray-600"
    }`}
  >
    24개월
  </button>
</div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-700">
            은행별 기본금리
          </p>

          <p className="text-xs font-bold text-gray-400">
            금리 공시월 · {bankBaseDate}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bankRates.map((bank) => (
           <button
  key={bank.name}
  type="button"
  onDoubleClick={() => {
    if (bank.url) window.open(bank.url, "_blank");
  }}
  className={`
  rounded-2xl
  border
  border-gray-200
  bg-white
  p-4
  min-h-[150px]
  flex
  flex-col
  items-center
  justify-center
  text-center
  shadow-sm
  transition
  hover:shadow-md
  ${bank.hover || "hover:bg-gray-50"}
`}
>
  <img
    src={`/logos/banks/${bank.logo}.png`}
    alt={bank.name}
    className="w-10 h-10 object-contain mb-3"
  />

  <p className="text-sm font-semibold text-gray-800 break-keep">
    {bank.name}
  </p>

  <p className="text-xs font-medium text-gray-400 mt-3">
    기본금리
  </p>

  <p className="text-2xl font-black text-gray-900 mt-1">
    {bank.rate}
  </p>
</button>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-5 pt-4">
          <p className="text-xs text-gray-400 leading-relaxed break-keep">
            ※ 금리는 변동될 수 있으니 정확한 내용은 각 은행 홈페이지에서 확인해주세요.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed mt-1 break-keep">
            ※ 은행 카드 더블클릭 시 해당 은행 홈페이지로 이동합니다.
          </p>
        </div>
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



      {/* 하단 고정 메뉴 */}
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

function TopButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-5 h-11 rounded-2xl font-bold text-sm transition shadow-sm
        ${active ? "bg-white text-blue-600" : "bg-gray-200 text-gray-600"}
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
  numeric,
  decimal,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  unit: string;
  numeric?: boolean;
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
            numeric && value
              ? Number(String(value).replaceAll(",", "")).toLocaleString()
              : value
          }
          onChange={(e) => {
            const raw = e.target.value.replaceAll(",", "");
            setValue(decimal ? raw.replace(/[^0-9.]/g, "") : raw.replace(/[^0-9]/g, ""));
          }}
          className="
            w-full h-16 rounded-2xl border border-gray-200 px-5 pr-20
            text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500
          "
        />

        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
          {unit}
        </span>
      </div>
    </div>
  );
}

function SelectButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-12 rounded-2xl font-bold text-sm transition px-2 py-2
        ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
      `}
    >
      {children}
    </button>
  );
}

function ResultItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-3">
      <p className="text-gray-500 font-bold mb-1">{label}</p>
      <p className="text-gray-900 font-black">
        {Math.round(value / 10000).toLocaleString()}만원
      </p>
    </div>
  );
}