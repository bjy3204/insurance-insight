"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Calculator,
  Newspaper,
  MessageCircle,
  BookOpen,
  X,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";

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

export default function CalculatorPage() {
  const [generation, setGeneration] = useState("gen1");
  const [type, setType] = useState("outpatient");
  const [hospitalType, setHospitalType] = useState("clinic");
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);
const [selectedDictionaryGen, setSelectedDictionaryGen] = useState("1세대");
const [dictionaryTab, setDictionaryTab] = useState("실손정보");

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

    // 5세대 통원 비급여 보상한도: 중증+비중증 합산 20만원
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

  // 5세대 입원 비중증 비급여 보상한도: 300만원
  const mildUncoveredPay = Math.min(
    Math.max(mildUncoveredAmount - mildUncoveredDeductible, 0),
    3000000
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
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="
                w-11 h-11 rounded-xl border border-gray-300 bg-white
                flex items-center justify-center
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

              <p className="text-sm text-gray-500 mt-1">
                세대별 실손보험금 예상 계산
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">
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

        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setType("outpatient")}
            className={`rounded-xl py-3 font-bold ${
              type === "outpatient"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            통원
          </button>

          <button
            onClick={() => setType("inpatient")}
            className={`rounded-xl py-3 font-bold ${
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
            <div>
              <label className="text-sm font-bold text-gray-500">
                외래 한도
              </label>

              <input
                type="text"
                value={formatNumber(outpatientLimit)}
                onChange={(e) =>
                  setOutpatientLimit(parseNumber(e.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500">
                병원등급
              </label>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setHospitalType("clinic")}
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "clinic"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  의원
                </button>

                <button
                  onClick={() => setHospitalType("general")}
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "general"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  종합병원
                </button>

                <button
                  onClick={() => setHospitalType("advanced")}
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "advanced"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  상급종합병원
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500">
                급여
              </label>

              <input
                type="text"
                value={formatNumber(covered)}
                onChange={(e) => setCovered(parseNumber(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 mb-5">
          <h3 className="text-base font-black text-gray-900 mb-4">
            통원 비급여
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-500">
                중증 비급여
              </label>

              <input
                type="text"
                value={formatNumber(uncovered)}
                onChange={(e) => setUncovered(parseNumber(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500">
                비중증 비급여
              </label>

              <input
  type="text"
  value={formatNumber(mildUncovered)}
  onChange={(e) =>
    setMildUncovered(parseNumber(e.target.value))
  }
  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
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
            <div>
              <label className="text-sm font-bold text-gray-500">
                {generation === "gen1" ? "통원 한도" : "외래 한도"}
              </label>

              <input
                type="text"
                value={formatNumber(outpatientLimit)}
                onChange={(e) =>
                  setOutpatientLimit(parseNumber(e.target.value))
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
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
        className={`rounded-xl py-3 font-bold border ${
          hospitalType === "clinic"
            ? "bg-blue-50 text-blue-600 border-blue-600"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        의원
      </button>

      <button
        onClick={() => setHospitalType("general")}
        className={`rounded-xl py-3 font-bold border ${
          hospitalType === "general"
            ? "bg-blue-50 text-blue-600 border-blue-600"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        종합병원
      </button>

      <button
        onClick={() => setHospitalType("advanced")}
        className={`rounded-xl py-3 font-bold border ${
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
              <div>
                <label className="text-sm font-bold text-gray-500">급여</label>
                <input type="text" value={formatNumber(covered)} onChange={(e) => setCovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white" />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-500">비급여</label>
                <input type="text" value={formatNumber(uncovered)} onChange={(e) => setUncovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white" />
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
              <div>
                <label className="text-sm font-bold text-gray-500">
                  약제비 한도
                </label>

                <input
                  type="text"
                  value={formatNumber(medicineLimit)}
                  onChange={(e) =>
                    setMedicineLimit(parseNumber(e.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">급여</label>
                  <input type="text" value={formatNumber(medicineCovered)} onChange={(e) => setMedicineCovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white" />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500">비급여</label>
                  <input type="text" value={formatNumber(medicineUncovered)} onChange={(e) => setMedicineUncovered(parseNumber(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px] outline-none text-lg font-bold bg-white" />
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
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "clinic"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  의원
                </button>

                <button
                  onClick={() => setHospitalType("general")}
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "general"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  종합병원
                </button>

                <button
                  onClick={() => setHospitalType("advanced")}
                  className={`rounded-xl py-3 font-bold border ${
                    hospitalType === "advanced"
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  상급종합병원
                </button>
              </div>
            </div>

            <div>
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

            <div>
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
                "
              />
            </div>

            <div>
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
                "
              />
            </div>

          </div>
        </div>
      </>
    ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-500">
              급여 금액
            </label>

            <input
              type="text"
              value={formatNumber(covered)}
              onChange={(e) => setCovered(parseNumber(e.target.value))}
              className="
                mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
                outline-none text-lg font-bold
              "
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-500">
              비급여 금액
            </label>

            <input
              type="text"
              value={formatNumber(uncovered)}
              onChange={(e) => setUncovered(parseNumber(e.target.value))}
              className="
                mt-2 w-full rounded-2xl border border-gray-200 px-4 h-[56px]
                outline-none text-lg font-bold
              "
            />
          </div>

          <div>
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
                outline-none text-lg font-bold
              "
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-500">
              병실
            </label>

            <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mt-2">
              <button
                onClick={() => setRoomType("standard")}
                className={`rounded-xl py-3 font-bold ${
                  roomType === "standard"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                기준병실
              </button>

              <button
                onClick={() => setRoomType("premium")}
                className={`rounded-xl py-3 font-bold ${
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
            <div className="md:col-span-2">
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
                  outline-none text-lg font-bold
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
  <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
    <button
      onClick={() => setSpecialType("severe")}
      className={`rounded-xl py-3 font-bold ${
        specialType === "severe"
          ? "bg-white text-blue-600 shadow-sm"
          : "text-gray-600"
      }`}
    >
      중증
    </button>

    <button
      onClick={() => setSpecialType("mild")}
      className={`rounded-xl py-3 font-bold ${
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
      <div>
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
          "
        />
      </div>

      <div>
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
          "
        />
      </div>
    </>
  )}

  <div>
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
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
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
      {/* 실손 사전 아이콘 */}
<button
  onClick={() => setDictionaryOpen(!dictionaryOpen)}
  className="
    fixed
    left-6
    bottom-24
    z-40
    w-14
    h-14
    rounded-full
    bg-gray-800
    shadow-lg
    flex
    items-center
    justify-center
  "
>
  <BookOpen className="w-6 h-6 text-white" />
</button>

{/* 세대 선택 메뉴 */}
{dictionaryOpen && (
  <div
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
      grid
      grid-cols-3
      gap-2
    "
  >
    {["1세대", "2세대", "3세대", "4세대", "5세대", "유병자"].map((gen) => (
      <button
        key={gen}
        onClick={() => {
          setSelectedDictionaryGen(gen);
          setDictionaryTab("실손정보");
          setDictionaryModalOpen(true);
          setDictionaryOpen(false);
        }}
        className="
          px-3
          py-2
          rounded-xl
          bg-gray-100
          text-sm
          font-bold
          text-gray-700
          hover:bg-blue-50
          hover:text-blue-600
          transition
        "
      >
        {gen}
      </button>
    ))}
  </div>
)}

{/* 실손 사전 팝업 */}
{dictionaryModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
      
      {/* 팝업 헤더 */}
      <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {selectedDictionaryGen} 실손 사전
        </div>

        <button onClick={() => setDictionaryModalOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        {/* 팝업 내부 탭 */}
        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setDictionaryTab("실손정보")}
            className={`rounded-xl py-3 font-bold transition ${
              dictionaryTab === "실손정보"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            실손정보
          </button>

          <button
            onClick={() => setDictionaryTab("면책사항")}
            className={`rounded-xl py-3 font-bold transition ${
              dictionaryTab === "면책사항"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            면책사항
          </button>
        </div>

        {/* 실손정보 */}
        {dictionaryTab === "실손정보" && (
          <div className="space-y-3">
            {[
              ["적용기간", "내용 입력 예정"],
              ["보험기간", "내용 입력 예정"],
              ["갱신주기", "내용 입력 예정"],
              ["담보구성", "내용 입력 예정"],
              ["자기부담금", "내용 입력 예정"],
              ["본인부담한도", "내용 입력 예정"],
              ["상급병실", "내용 입력 예정"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <p className="text-sm font-black text-gray-900">
                  {label}
                </p>

                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 면책사항 */}
        {dictionaryTab === "면책사항" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">
                    항목
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">
                    보상 여부
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">
                    비고
                  </th>
                </tr>
              </thead>

              <tbody>
                {[
                  ["미용·성형", "제외", "내용 입력 예정"],
                  ["건강검진", "제한", "내용 입력 예정"],
                  ["예방접종", "제외", "내용 입력 예정"],
                  ["임신·출산", "제한", "내용 입력 예정"],
                  ["치과·한방", "제한", "내용 입력 예정"],
                  ["비급여 항목", "세대별 상이", "내용 입력 예정"],
                ].map(([item, cover, desc]) => (
                  <tr key={item} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">
                      {item}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        {cover}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-5 text-xs text-gray-400 leading-relaxed">
          ※ 실제 보장내용은 가입 시기, 상품명, 특약 구성, 약관에 따라 달라질 수 있습니다.
        </p>
      </div>
    </div>
  </div>
)}
    </main>
  );
}