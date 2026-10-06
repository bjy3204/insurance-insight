"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
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
import Link from "next/link";

import { Menu,
  ArrowLeft,
  Calculator,
  Newspaper,
  MessageCircle,
  X,
  StickyNote,
  NotebookPen,
  Pin,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';
import CalculatorPageLayout from '@/app/components/CalculatorPageLayout';
import MedicalHistoryModal from './components/MedicalHistoryModal';

const generations = [
  
  { id: "gen1", name: "1세대", period: "~2009.09", note: "자기부담금 0%" },
  { id: "gen2a", name: "2세대", period: "2009.10~2012.12", note: "급여 90%" },
  { id: "gen2b", name: "2세대", period: "2013.01~2015.08", note: "급여 80%" },
  { id: "gen2c", name: "2세대", period: "2015.09~2017.03", note: "급여 90% · 비급여 80%" },
  { id: "gen3", name: "3세대", period: "2017.04~2021.06", note: "급여 90% · 비급여 80%" },
  { id: "gen4", name: "4세대", period: "2021.07~2026.04", note: "급여 80% · 비급여 70%" },
  { id: "gen5", name: "5세대", period: "2026.05~", note: "비급여 중증 · 비중증 분리" },
  { id: "simple", name: "유병자", period: "유병자 실손", note: "약제비 · 비급여3종 제외" },
];


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
  children: any;
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
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}

export default function CalculatorPage() {
    const { authUser, authStatus, memos, saveMemos } = useAuth();

  const [generation, setGeneration] = useState("gen1");
  const [type, setType] = useState("outpatient");
  const [hospitalType, setHospitalType] = useState("clinic");
  




const [memoAddPopupPos, setMemoAddPopupPos] = useState({ x: 0, y: 0 });
const [memoEditPopupPos, setMemoEditPopupPos] = useState({ x: 0, y: 0 });

const [memoOpen, setMemoOpen] = useState(false);
const [settingOpen, setSettingOpen] = useState(false);
const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);

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
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);





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

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);




  const [outpatientLimit, setOutpatientLimit] = useState("");
  const [medicineLimit, setMedicineLimit] = useState("");

  const [covered, setCovered] = useState("");
  const [uncovered, setUncovered] = useState("");
  const [mildUncovered, setMildUncovered] = useState("");

  const [medicineCovered, setMedicineCovered] = useState("");
  const [medicineUncovered, setMedicineUncovered] = useState("");

  const [manualTherapy, setManualTherapy] = useState("");
  const [injection, setInjection] = useState("");
  const [mri, setMri] = useState("");
  const [specialType, setSpecialType] = useState("severe");

  const [days, setDays] = useState("");
  const [roomType, setRoomType] = useState("standard");
  const [roomDiff, setRoomDiff] = useState("");

  const formatNumber = (value: string) => {
    if (!value) return "";
    return Number(String(value).replaceAll(",", "")).toLocaleString();
  };

  const parseNumber = (value: string) => {
    return value.replaceAll(",", "").replace(/[^0-9]/g, "");
  };

  const coveredAmount = Number(covered || 0);
  const uncoveredAmount = Number(uncovered || 0);
  const mildUncoveredAmount = Number(mildUncovered || 0);
  const outpatientMedical = coveredAmount + uncoveredAmount;

  const medicineCoveredAmount = Number(medicineCovered || 0);
  const medicineUncoveredAmount = Number(medicineUncovered || 0);
  const medicineMedical = medicineCoveredAmount + medicineUncoveredAmount;

  const manualTherapyAmount = Number(manualTherapy || 0);
  const injectionAmount = Number(injection || 0);
  const mriAmount = Number(mri || 0);

  const outpatientLimitAmount = Number(outpatientLimit || 0);
  const medicineLimitAmount = Number(medicineLimit || 0);

  const roomDiffAmount = Number(roomDiff || 0);
  const daysAmount = Number(days || 0);

  const totalMedical =
    type === "outpatient"
      ? outpatientMedical + medicineMedical
      : outpatientMedical;

  const getGen1OutpatientDeductible = () => {
    if (hospitalType === "clinic") return 5000;
    return 10000;
  };

  const getGen2OutpatientDeductible = () => {
    if (hospitalType === "clinic") return 10000;
    if (hospitalType === "general") return 15000;
    return 20000;
  };

  const calculateRoomPayWithDailyLimit = () => {
    if (roomType !== "premium") return 0;

    const halfRoomDiff = Math.round(roomDiffAmount * 0.5);
    const dailyLimit = daysAmount * 100000;

    return Math.min(halfRoomDiff, dailyLimit);
  };

  const calculateSpecialPay = (amount: number, limit: number) => {
    const deductible = Math.max(20000, Math.round(amount * 0.3));
    const pay = Math.max(amount - deductible, 0);

    return Math.min(pay, limit);
  };

  const calculateGen1 = () => {
    if (type === "outpatient") {
      const deductible = getGen1OutpatientDeductible();
      const claimable = Math.max(outpatientMedical - deductible, 0);

      const pay =
        outpatientLimitAmount > 0
          ? Math.min(claimable, outpatientLimitAmount)
          : claimable;

      return {
        total: outpatientMedical,
        deductible,
        roomPay: 0,
        selfPay: deductible,
        pay,
      };
    }

    const roomPay =
      roomType === "premium"
        ? Math.round(roomDiffAmount * 0.5)
        : 0;

    const pay = outpatientMedical + roomPay;

    return {
      total: outpatientMedical,
      deductible: 0,
      roomPay,
      selfPay: 0,
      pay,
    };
  };

  const calculateGen2a = () => {
    if (type === "outpatient") {
      const outpatientDeductible = getGen2OutpatientDeductible();
      const medicineDeductible = 8000;

      const outpatientPay = Math.max(outpatientMedical - outpatientDeductible, 0);
      const medicinePay = Math.max(medicineMedical - medicineDeductible, 0);

      const limitedOutpatientPay =
        outpatientLimitAmount > 0
          ? Math.min(outpatientPay, outpatientLimitAmount)
          : outpatientPay;

      const limitedMedicinePay =
        medicineLimitAmount > 0
          ? Math.min(medicinePay, medicineLimitAmount)
          : medicinePay;

      const pay = limitedOutpatientPay + limitedMedicinePay;
      const deductible = totalMedical - pay;

      return {
        total: totalMedical,
        deductible,
        roomPay: 0,
        selfPay: deductible,
        pay,
      };
    }

    const selfPay = Math.round(outpatientMedical * 0.1);
    const basePay = Math.round(outpatientMedical * 0.9);
    const roomPay = calculateRoomPayWithDailyLimit();

    return {
      total: outpatientMedical,
      deductible: selfPay,
      roomPay,
      selfPay,
      pay: Math.min(basePay + roomPay, 50000000),
    };
  };

  const calculateGen2b = () => {
    if (type === "outpatient") {
      const baseDeductible = getGen2OutpatientDeductible();

      const outpatientDeductible = Math.max(
        baseDeductible,
        Math.round(outpatientMedical * 0.2)
      );

      const medicineDeductible = Math.max(
        8000,
        Math.round(medicineMedical * 0.2)
      );

      const outpatientPay = Math.max(outpatientMedical - outpatientDeductible, 0);
      const medicinePay = Math.max(medicineMedical - medicineDeductible, 0);

      const limitedOutpatientPay =
        outpatientLimitAmount > 0
          ? Math.min(outpatientPay, outpatientLimitAmount)
          : outpatientPay;

      const limitedMedicinePay =
        medicineLimitAmount > 0
          ? Math.min(medicinePay, medicineLimitAmount)
          : medicinePay;

      const pay = limitedOutpatientPay + limitedMedicinePay;
      const deductible = totalMedical - pay;

      return {
        total: totalMedical,
        deductible,
        roomPay: 0,
        selfPay: deductible,
        pay,
      };
    }

    const selfPay = Math.min(
  Math.round(outpatientMedical * 0.2),
  2000000
);
    const basePay = outpatientMedical - selfPay;
    const roomPay = calculateRoomPayWithDailyLimit();

    return {
      total: outpatientMedical,
      deductible: selfPay,
      roomPay,
      selfPay,
      pay: Math.min(basePay + roomPay, 50000000),
    };
  };

  const calculateGen2c = () => {
    if (type === "outpatient") {
      const baseDeductible = getGen2OutpatientDeductible();

      const outpatientDeductible = Math.max(
        baseDeductible,
        Math.round(coveredAmount * 0.1 + uncoveredAmount * 0.2)
      );

      const medicineDeductible = Math.max(
        8000,
        Math.round(medicineCoveredAmount * 0.1 + medicineUncoveredAmount * 0.2)
      );

      const outpatientPay = Math.max(outpatientMedical - outpatientDeductible, 0);
      const medicinePay = Math.max(medicineMedical - medicineDeductible, 0);

      const limitedOutpatientPay =
        outpatientLimitAmount > 0
          ? Math.min(outpatientPay, outpatientLimitAmount)
          : outpatientPay;

      const limitedMedicinePay =
        medicineLimitAmount > 0
          ? Math.min(medicinePay, medicineLimitAmount)
          : medicinePay;

      const pay = limitedOutpatientPay + limitedMedicinePay;
      const deductible = totalMedical - pay;

      return {
        total: totalMedical,
        deductible,
        roomPay: 0,
        selfPay: deductible,
        pay,
      };
    }

    const inpatientDeductible = Math.min(
  Math.round(
    coveredAmount * 0.1 + uncoveredAmount * 0.2
  ),
  2000000
);

    const basePay = outpatientMedical - inpatientDeductible;
    const roomPay = calculateRoomPayWithDailyLimit();

    return {
      total: outpatientMedical,
      deductible: inpatientDeductible,
      roomPay,
      selfPay: inpatientDeductible,
      pay: Math.min(basePay + roomPay, 50000000),
    };
  };

  const calculateGen3 = () => {
    const specialTotal = manualTherapyAmount + injectionAmount + mriAmount;

    const manualPay = calculateSpecialPay(manualTherapyAmount, 3500000);
    const injectionPay = calculateSpecialPay(injectionAmount, 2500000);
    const mriPay = calculateSpecialPay(mriAmount, 3000000);

    const specialPay = manualPay + injectionPay + mriPay;

    if (type === "outpatient") {
      const baseDeductible = getGen2OutpatientDeductible();

      const outpatientDeductible = Math.max(
        baseDeductible,
        Math.round(coveredAmount * 0.1 + uncoveredAmount * 0.2)
      );

      const medicineDeductible = Math.max(
        8000,
        Math.round(medicineCoveredAmount * 0.1 + medicineUncoveredAmount * 0.2)
      );

      const outpatientPay = Math.max(outpatientMedical - outpatientDeductible, 0);
      const medicinePay = Math.max(medicineMedical - medicineDeductible, 0);

      const limitedOutpatientPay =
        outpatientLimitAmount > 0
          ? Math.min(outpatientPay, outpatientLimitAmount)
          : outpatientPay;

      const limitedMedicinePay =
        medicineLimitAmount > 0
          ? Math.min(medicinePay, medicineLimitAmount)
          : medicinePay;

      const pay = limitedOutpatientPay + limitedMedicinePay + specialPay;
      const total = totalMedical + specialTotal;
      const deductible = total - pay;

      return {
        total,
        deductible,
        roomPay: 0,
        selfPay: deductible,
        pay,
      };
    }

    const inpatientDeductible = Math.min(
  Math.round(
    coveredAmount * 0.1 + uncoveredAmount * 0.2
  ),
  2000000
);

    const basePay = outpatientMedical - inpatientDeductible;
    const roomPay = calculateRoomPayWithDailyLimit();

    const baseLimitedPay = Math.min(basePay + roomPay, 50000000);

const pay = baseLimitedPay + specialPay;
    const total = outpatientMedical + specialTotal;
    const deductible = total - pay;

    return {
      total,
      deductible,
      roomPay,
      selfPay: deductible,
      pay,
    };
  };

  const calculateGen4 = () => {
  const specialTotal = manualTherapyAmount + injectionAmount + mriAmount;

  const calculateGen4SpecialPay = (amount: number, limit: number) => {
    const deductible = Math.max(30000, Math.round(amount * 0.3));
    const pay = Math.max(amount - deductible, 0);
    return Math.min(pay, limit);
  };

  const manualPay = calculateGen4SpecialPay(manualTherapyAmount, 3500000);
  const injectionPay = calculateGen4SpecialPay(injectionAmount, 2500000);
  const mriPay = calculateGen4SpecialPay(mriAmount, 3000000);

  const specialPay = manualPay + injectionPay + mriPay;

  if (type === "outpatient") {
    const coveredBaseDeductible =
      hospitalType === "clinic" ? 10000 : 20000;

    const coveredDeductible = Math.max(
      coveredBaseDeductible,
      Math.round(coveredAmount * 0.2)
    );

    const uncoveredDeductible = Math.max(
      30000,
      Math.round(uncoveredAmount * 0.3)
    );

    const coveredPay = Math.max(coveredAmount - coveredDeductible, 0);
    const uncoveredPay = Math.max(uncoveredAmount - uncoveredDeductible, 0);

    const outpatientPay = coveredPay + uncoveredPay;

    const limitedOutpatientPay =
      outpatientLimitAmount > 0
        ? Math.min(outpatientPay, outpatientLimitAmount)
        : outpatientPay;

    const pay = limitedOutpatientPay + specialPay;
    const total = outpatientMedical + specialTotal;
    const deductible = total - pay;

    return {
      total,
      deductible,
      roomPay: 0,
      selfPay: deductible,
      pay,
    };
  }

    const total = coveredAmount + uncoveredAmount;

const inpatientDeductible = Math.min(
  Math.round(coveredAmount * 0.2 + uncoveredAmount * 0.3),
  2000000
);

const basePay = total - inpatientDeductible;
const roomPay = calculateRoomPayWithDailyLimit();

const baseLimitedPay = Math.min(basePay + roomPay, 50000000);

const pay = baseLimitedPay + specialPay;
const totalWithSpecial = total + specialTotal;
const deductible = totalWithSpecial - pay;

 return {
  total: totalWithSpecial,
  deductible,
  roomPay,
  selfPay: deductible,
  pay,
};
};
const calculateGen5 = () => {
  const specialTotal =
    specialType === "severe"
      ? manualTherapyAmount + injectionAmount + mriAmount
      : mriAmount;

  const calculateGen5SpecialPay = (amount: number, limit: number) => {
    const deductible =
      specialType === "severe"
        ? Math.max(30000, Math.round(amount * 0.3))
        : Math.max(50000, Math.round(amount * 0.5));

    const pay = Math.max(amount - deductible, 0);
    return Math.min(pay, limit);
  };

  const manualPay =
    specialType === "severe"
      ? calculateGen5SpecialPay(manualTherapyAmount, 3500000)
      : 0;

  const injectionPay =
    specialType === "severe"
      ? calculateGen5SpecialPay(injectionAmount, 2500000)
      : 0;

  const mriPay =
    specialType === "severe"
      ? calculateGen5SpecialPay(mriAmount, 3000000)
      : calculateGen5SpecialPay(mriAmount, 2000000);

  const specialPay = manualPay + injectionPay + mriPay;

  if (type === "outpatient") {
    const coveredBaseDeductible =
      hospitalType === "clinic" ? 10000 : 20000;

    const coveredDeductible = Math.max(
      coveredBaseDeductible,
      Math.round(coveredAmount * 0.2)
    );

    const severeUncoveredDeductible = Math.max(
      30000,
      Math.round(uncoveredAmount * 0.3)
    );

    const mildUncoveredDeductible = Math.max(
      50000,
      Math.round(mildUncoveredAmount * 0.5)
    );

    const coveredPay = Math.max(coveredAmount - coveredDeductible, 0);

    const severeUncoveredPay = Math.max(
      uncoveredAmount - severeUncoveredDeductible,
      0
    );

    const mildUncoveredPay = Math.max(
      mildUncoveredAmount - mildUncoveredDeductible,
      0
    );

    // 5세대 통원 비급여 보장한도: 중증+비중증 합산 20만원
    const uncoveredPay = Math.min(
      severeUncoveredPay + mildUncoveredPay,
      200000
    );

    const outpatientPay = coveredPay + uncoveredPay;

    const limitedOutpatientPay =
      outpatientLimitAmount > 0
        ? Math.min(outpatientPay, outpatientLimitAmount)
        : outpatientPay;

    const total =
      coveredAmount +
      uncoveredAmount +
      mildUncoveredAmount +
      specialTotal;

    const pay = limitedOutpatientPay + specialPay;
    const deductible = total - pay;

    return {
      total,
      deductible,
      roomPay: 0,
      selfPay: deductible,
      pay,
    };
  }

  // 5세대 입원
  const severeTotal = coveredAmount + uncoveredAmount;

  const inpatientSelfPayLimit =
    hospitalType === "general" || hospitalType === "advanced"
      ? 5000000
      : 2000000;

  const severeDeductible = Math.min(
    Math.round(coveredAmount * 0.2 + uncoveredAmount * 0.3),
    inpatientSelfPayLimit
  );

  const severePay = Math.max(severeTotal - severeDeductible, 0);

  const mildUncoveredDeductible = Math.round(mildUncoveredAmount * 0.5);

// 5세대 입원 비중증 비급여 보장한도: 병의원 300만원, 상급종합병원 1000만원
const mildUncoveredLimit = hospitalType === "advanced" ? 10000000 : 3000000;
const mildUncoveredPay = Math.min(
  Math.max(mildUncoveredAmount - mildUncoveredDeductible, 0),
  mildUncoveredLimit
);


  const total =
    coveredAmount +
    uncoveredAmount +
    mildUncoveredAmount +
    specialTotal;

  const baseLimitedPay = Math.min(
  severePay + mildUncoveredPay,
  50000000
);

const pay = baseLimitedPay + specialPay;
  const deductible = total - pay;

  return {
    total,
    deductible,
    roomPay: 0,
    selfPay: deductible,
    pay,
  };
};
const calculateSimple = () => {
  if (type === "outpatient") {
    const total = coveredAmount + uncoveredAmount;

    const deductible = Math.max(
      20000,
      Math.round(total * 0.3)
    );

    const claimable = Math.max(total - deductible, 0);

    const pay =
      outpatientLimitAmount > 0
        ? Math.min(claimable, outpatientLimitAmount, 200000)
        : Math.min(claimable, 200000);

    return {
      total,
      deductible: total - pay,
      roomPay: 0,
      selfPay: total - pay,
      pay,
    };
  }

  const total = coveredAmount + uncoveredAmount;

  const deductible = Math.max(
    100000,
    Math.round(total * 0.3)
  );

  const basePay = Math.max(total - deductible, 0);

  const limitedBasePay = Math.min(basePay, 50000000);

  const roomPay = calculateRoomPayWithDailyLimit();

  const pay = limitedBasePay + roomPay;

  return {
    total: total + roomDiffAmount,
    deductible: total + roomDiffAmount - pay,
    roomPay,
    selfPay: total + roomDiffAmount - pay,
    pay,
  };
};



useEffect(() => {
  const openMemoDetail = (event: any) => {
    const memoId = event.detail;
    const targetMemo = memos.find((memo) => memo.id === memoId);
    if (!targetMemo) return;
    setSelectedMemo(targetMemo);
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
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          color,
          updatedAt: new Date().toISOString(),
        }
      : memo
  );

  saveMemos(nextMemos);
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

  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);

  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;

  const pinnedMemos = memos.filter((memo) => memo.pinned);
  const normalMemos = memos.filter((memo) => !memo.pinned);

  const oldIndex = normalMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = normalMemos.findIndex((memo) => memo.id === over.id);

  const reorderedNormalMemos = arrayMove(normalMemos, oldIndex, newIndex);

  saveMemos([...pinnedMemos, ...reorderedNormalMemos]);
};

const memoColorOptions: {
  value: MemoItem["color"];
  className: string;
}[] = [
  {
    value: "white",
    className: "bg-white border-gray-300 hover:bg-gray-50",
  },
  {
    value: "blue",
    className: "bg-blue-50 border-blue-100 hover:bg-blue-100",
  },
  {
    value: "yellow",
    className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
  },
  {
    value: "red",
    className: "bg-red-50 border-red-100 hover:bg-red-100",
  },
  {
    value: "clear",
    className:
      "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
  },
];

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

  const result =
  generation === "gen1"
    ? calculateGen1()
    : generation === "gen2a"
    ? calculateGen2a()
    : generation === "gen2b"
    ? calculateGen2b()
    : generation === "gen2c"
    ? calculateGen2c()
    : generation === "gen3"
    ? calculateGen3()
    : generation === "gen4"
    ? calculateGen4()
    : generation === "gen5"
    ? calculateGen5()
    : generation === "simple"
    ? calculateSimple()
    : calculateGen1();

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header data-page-header="true" className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link data-header-control="true"
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
                <Calculator className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  실비계산기
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
                  <Menu className="w-5 h-5 text-gray-400" />
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

                    <HeaderUtilityItems onClose={() => setSettingOpen(false)} />
                    <button
                      onClick={() => { setSettingOpen(false); setMedicalHistoryOpen(true); }}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default"
                    >실손백과</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      <CalculatorPageLayout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {generations.map((item) => (
            <button
              key={item.id}
              onClick={() => setGeneration(item.id)}
              className={`
  bg-white rounded-2xl border p-4 text-left transition 
                ${
                  generation === item.id
                    ? "border-blue-600 shadow-md"
                    : "border-gray-200"
                }
              `}
            >
              <p className="font-black text-gray-900">{item.name}</p>

              <p className="text-sm text-gray-500 mt-1">{item.period}</p>

              {item.note && (
                <p className="text-xs text-blue-600 mt-1 font-bold">
                  {item.note}
                </p>
              )}
            </button>
          ))}
        </div>

        <div data-tab-group="true" className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setType("outpatient")}
            className={`rounded-2xl py-3 font-bold ${
              type === "outpatient"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            통원
          </button>

          <button
            onClick={() => setType("inpatient")}
            className={`rounded-2xl py-3 font-bold ${
              type === "inpatient"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            입원
          </button>
        </div>

        {type === "outpatient" && (
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-6">
    <h2 className="text-xl font-black text-gray-900 mb-6">통원</h2>

    {generation === "gen5" ? (
      <>
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 mb-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            통원 급여
          </h3>

          <div className="space-y-4">
            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                외래 한도
              </label>

              <input
                type="text"
                value={formatNumber(outpatientLimit)}
                onChange={(e) =>
                  setOutpatientLimit(parseNumber(e.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500">
                병원등급
              </label>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setHospitalType("clinic")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "clinic"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  의원
                </button>

                <button
                  onClick={() => setHospitalType("general")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "general"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  종합병원
                </button>

                <button
                  onClick={() => setHospitalType("advanced")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "advanced"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  상급종합병원
                </button>
              </div>
            </div>

            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                급여
              </label>

              <input
                type="text"
                value={formatNumber(covered)}
                onChange={(e) => setCovered(parseNumber(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 mb-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            통원 비급여
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                중증 비급여
              </label>

              <input
                type="text"
                value={formatNumber(uncovered)}
                onChange={(e) => setUncovered(parseNumber(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                비중증 비급여
              </label>

              <input
  type="text"
  value={formatNumber(mildUncovered)}
  onChange={(e) =>
    setMildUncovered(parseNumber(e.target.value))
  }
  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
/>
            </div>
          </div>
        </div>
      </>
    ) : (
      <>
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 mb-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            {generation === "gen4" ? "통원 외래+약제" : "통원 외래"}
          </h3>

          <div className="space-y-4">
            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                {generation === "gen1" ? "통원 한도" : "외래 한도"}
              </label>

              <input
                type="text"
                value={formatNumber(outpatientLimit)}
                onChange={(e) =>
                  setOutpatientLimit(parseNumber(e.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {generation !== "simple" && (
  <div>
    <label className="text-sm font-bold text-gray-500">
      병원등급
    </label>

    <div className="grid grid-cols-3 gap-2 mt-2">
      <button
        onClick={() => setHospitalType("clinic")}
        className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
          hospitalType === "clinic"
            ? "bg-blue-50 text-blue-600 border-blue-600"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        의원
      </button>

      <button
        onClick={() => setHospitalType("general")}
        className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
          hospitalType === "general"
            ? "bg-blue-50 text-blue-600 border-blue-600"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        종합병원
      </button>

      <button
        onClick={() => setHospitalType("advanced")}
        className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
          hospitalType === "advanced"
            ? "bg-blue-50 text-blue-600 border-blue-600"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        상급종합병원
      </button>
    </div>
  </div>
)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-calculator-field="true">
                <label className="text-sm font-bold text-gray-500">급여</label>
                <input type="text" value={formatNumber(covered)} onChange={(e) => setCovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div data-calculator-field="true">
                <label className="text-sm font-bold text-gray-500">비급여</label>
                <input type="text" value={formatNumber(uncovered)} onChange={(e) => setUncovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
          </div>
        </div>

        {generation !== "gen1" &&
  generation !== "gen4" &&
  generation !== "simple" && (
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5">
            <h3 className="text-base font-black text-gray-900 mb-4">
              통원 약제
            </h3>

            <div className="space-y-4">
              <div data-calculator-field="true">
                <label className="text-sm font-bold text-gray-500">
                  약제비 한도
                </label>

                <input
                  type="text"
                  value={formatNumber(medicineLimit)}
                  onChange={(e) =>
                    setMedicineLimit(parseNumber(e.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-calculator-field="true">
                  <label className="text-sm font-bold text-gray-500">급여</label>
                  <input type="text" value={formatNumber(medicineCovered)} onChange={(e) => setMedicineCovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition" />
                </div>

                <div data-calculator-field="true">
                  <label className="text-sm font-bold text-gray-500">비급여</label>
                  <input type="text" value={formatNumber(medicineUncovered)} onChange={(e) => setMedicineUncovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}
        {type === "inpatient" && (
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-6">
    <h2 className="text-xl font-black text-gray-900 mb-5">입원</h2>

    {generation === "gen5" ? (
      <>
        {/* 입원 급여 */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 mb-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            입원 급여
          </h3>

          <div className="space-y-4">

            <div>
              <label className="text-sm font-bold text-gray-500">
                병원등급
              </label>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setHospitalType("clinic")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "clinic"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  의원
                </button>

                <button
                  onClick={() => setHospitalType("general")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "general"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  종합병원
                </button>

                <button
                  onClick={() => setHospitalType("advanced")}
                  className={`rounded-2xl h-[56px] flex items-center justify-center font-bold border ${
                    hospitalType === "advanced"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  상급종합병원
                </button>
              </div>
            </div>

            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                급여 금액
              </label>

              <input
                type="text"
                value={formatNumber(covered)}
                onChange={(e) =>
                  setCovered(parseNumber(e.target.value))
                }
                className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
              />
            </div>

          </div>
        </div>

        {/* 입원 비급여 */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            입원 비급여
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                중증 비급여
              </label>

              <input
                type="text"
                value={formatNumber(uncovered)}
                onChange={(e) =>
                  setUncovered(parseNumber(e.target.value))
                }
               className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
              />
            </div>

            <div data-calculator-field="true">
              <label className="text-sm font-bold text-gray-500">
                비중증 비급여
              </label>

              <input
                type="text"
                value={formatNumber(mildUncovered)}
                onChange={(e) =>
                  setMildUncovered(parseNumber(e.target.value))
                }
                className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
              />
            </div>

          </div>
        </div>
      </>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div data-calculator-field="true">
            <label className="text-sm font-bold text-gray-500">
              급여 금액
            </label>

            <input
              type="text"
              value={formatNumber(covered)}
              onChange={(e) => setCovered(parseNumber(e.target.value))}
             className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
            />
          </div>

          <div data-calculator-field="true">
            <label className="text-sm font-bold text-gray-500">
              비급여 금액
            </label>

            <input
              type="text"
              value={formatNumber(uncovered)}
              onChange={(e) => setUncovered(parseNumber(e.target.value))}
              className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
            />
          </div>

          <div data-calculator-field="true">
            <label className="text-sm font-bold text-gray-500">
              입원일수
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={days}
              onChange={(e) =>
                setDays(e.target.value.replace(/[^0-9]/g, ""))
              }
             className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-500">
              병실
            </label>

            <div data-tab-group="true" className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mt-2">
              <button
                onClick={() => setRoomType("standard")}
                className={`rounded-2xl py-3 font-bold ${
                  roomType === "standard"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                기준병실
              </button>

              <button
                onClick={() => setRoomType("premium")}
                className={`rounded-2xl py-3 font-bold ${
                  roomType === "premium"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                상급병실
              </button>
            </div>
          </div>

          {roomType === "premium" && (
            <div data-calculator-field="true" className="md:col-span-2">
              <label className="text-sm font-bold text-gray-500">
                상급병실료 차액
              </label>

              <input
                type="text"
                value={formatNumber(roomDiff)}
                onChange={(e) =>
                  setRoomDiff(parseNumber(e.target.value))
                }
                className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
              />
            </div>
          )}
        </div>
      </>
    )}
  </div>
)}

        {(generation === "gen3" || generation === "gen4" || generation === "gen5") && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-black text-gray-900 mb-5">
              비급여 3종
            </h2>

            {generation === "gen5" && (
  <div data-tab-group="true" className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
    <button
      onClick={() => setSpecialType("severe")}
      className={`rounded-2xl py-3 font-bold ${
        specialType === "severe"
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600"
      }`}
    >
      중증
    </button>

    <button
      onClick={() => setSpecialType("mild")}
      className={`rounded-2xl py-3 font-bold ${
        specialType === "mild"
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600"
      }`}
    >
      비중증
    </button>
  </div>
)}

<p className="text-sm text-gray-500 mb-5 leading-relaxed">
  {generation === "gen3" ? (
    <>
      도수치료 350만원 / 비급여주사 250만원 / MRI·MRA 300만원 한도
    
    </>
  ) : generation === "gen5" && specialType === "mild" ? (
    <>
      
      MRI·MRA 200만원 한도
    </>
  ) : (
    <>
      도수치료 350만원 / 비급여주사 250만원 / MRI·MRA 300만원 한도
     
    </>
  )}
</p>

<div
  className={`grid grid-cols-1 ${
    generation === "gen5" && specialType === "mild"
      ? "md:grid-cols-1"
      : "md:grid-cols-3"
  } gap-4`}
>
  {!(generation === "gen5" && specialType === "mild") && (
    <>
      <div data-calculator-field="true">
        <label className="text-sm font-bold text-gray-500">
          도수치료
        </label>

        <input
          type="text"
          value={formatNumber(manualTherapy)}
          onChange={(e) =>
            setManualTherapy(parseNumber(e.target.value))
          }
          className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
        />
      </div>

      <div data-calculator-field="true">
        <label className="text-sm font-bold text-gray-500">
          비급여주사
        </label>

        <input
          type="text"
          value={formatNumber(injection)}
          onChange={(e) =>
            setInjection(parseNumber(e.target.value))
          }
          className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
        />
      </div>
    </>
  )}

  <div data-calculator-field="true">
    <label className="text-sm font-bold text-gray-500">
      MRI/MRA
    </label>

    <input
      type="text"
      value={formatNumber(mri)}
      onChange={(e) => setMri(parseNumber(e.target.value))}
      className="
  mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
  outline-none text-lg font-bold bg-white
  focus:ring-2 focus:ring-blue-500 transition
"
    />
  </div>
</div>
          </div>
        )}

        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-md">
          <p className="text-sm opacity-80 mb-2">예상 지급 보험금</p>

          <p className="text-4xl font-black mb-5">
            {result.pay.toLocaleString()}원
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white/15 rounded-2xl p-4">
              <p className="opacity-80">총 진료비</p>
              <p className="text-lg font-black mt-1">
                {result.total.toLocaleString()}원
              </p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4">
              <p className="opacity-80">공제금액</p>
              <p className="text-lg font-black mt-1">
                {result.deductible.toLocaleString()}원
              </p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4">
              <p className="opacity-80">상급병실료 지급</p>
              <p className="text-lg font-black mt-1">
                {result.roomPay.toLocaleString()}원
              </p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4">
              <p className="opacity-80">예상 자기부담금</p>
              <p className="text-lg font-black mt-1">
                {result.selfPay.toLocaleString()}원
              </p>
            </div>
          </div>

          <p className="text-xs opacity-80 mt-4 leading-relaxed">
            실제 보험금은 가입시기, 특약, 병원급, 한도, 약관에 따라 달라질 수 있습니다.
          </p>
        </div>
      </CalculatorPageLayout>

     

{memoOpen && (
  <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
    <div data-popup-frame="true" className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <NotebookPen className="w-5 h-5" />
          메모장
        </div>

        <button data-popup-close="true"
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
        {filteredMemos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 py-20">
            저장된 메모가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
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
                      onDoubleClick={() => {
                        setMemoEditPopupPos({ x: 0, y: 0 });
                        stopMemoPopupMove();
                        setSelectedMemo(memo);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, id: memo.id });
                      }}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition cursor-default"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 flex flex-col min-h-[130px]">
                          <h3 className="text-sm font-black text-gray-900 break-keep">
                            {memo.title || ""}
                          </h3>

                                                  <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">
                            {memo.content}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-auto pt-3">
                            수정일{" "}
                            {new Date(memo.updatedAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>


                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoVisible(memo.id);
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${
                              memo.visible
                                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }`}
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${
                              memo.pinned
                                ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
                                : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemoEditPopupPos({ x: 0, y: 0 });
                              stopMemoPopupMove();
                              setSelectedMemo(memo);
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
          </div>
        )}
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
  onClick={() => {
    setMemoAddOpen(false);
    setMemoAddPopupPos({ x: 0, y: 0 });
    stopMemoPopupMove();
  }}
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

          <button data-popup-close="true"
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

          <button data-popup-close="true"
            onClick={() => {
  setSelectedMemo(null);
  setMemoEditPopupPos({ x: 0, y: 0 });
  stopMemoPopupMove();
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

{contextMenu && (
  <div
    style={{ top: contextMenu.y, left: contextMenu.x }}
    className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32"
    onPointerDown={(e) => e.stopPropagation()}
  >
    <button
      onClick={() => {
        const target = memos.find((m) => m.id === contextMenu.id);
        if (target) {
          setMemoEditPopupPos({ x: 0, y: 0 });
          stopMemoPopupMove();
          setSelectedMemo(target);
        }
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

      <>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a
            href="https://naver.me/xsZ8mk7H"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            className="py-3 flex flex-col items-center gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            className="py-3 flex flex-col items-center gap-1"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
      </>
      {medicalHistoryOpen && <MedicalHistoryModal onClose={() => setMedicalHistoryOpen(false)} />}
    </main>
  );
}
