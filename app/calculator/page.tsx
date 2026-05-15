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
const dictionaryData: any = {
  "1세대": {
    info: [
      ["구분", "표준화 이전"],
      ["보험기간", "80세, 100세"],
      ["갱신주기", "5년, 3년"],
      ["본인부담한도", "없음"],
      ["상급병실", "병실료 차액 50%"],
      ["가입금액", "입원 최대 1억 / 통원 10만~50만 등 상품별 상이"],
    ],
    selfpay: [
      ["입원", "자기부담금 0%"],
      ["통원", "상품별 5천원 또는 1만원 공제"],
      ["약제비", "통원 한도 내 포함 또는 상품별 상이"],
      ["비급여3종", "해당 없음"],
    ],
    waiting: [
      ["상해입원", "365일 보장"],
      ["질병입원", "365일 보장 후 180일 면책 가능"],
      ["통원", "30회 보장 후 180일 면책 가능"],
    ],
    exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["건강검진", "일부 가능", "이상소견 추가검사 가능"],
  ["예방접종", "보장 제외", "예방 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "보장 제한", "급여 치료 일부 가능"],
  ["정신질환", "보장 제한", "대부분 제한"],
  ["정신과", "보장 제한", "대부분 제한"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["해외치료", "일부 가능", "구실손 일부 상품 가능"],
],
  },

  "2세대 1차": {
    info: [
      ["구분", "표준화 Ⅰ"],
      ["보험기간", "100세"],
      ["갱신주기", "3년"],
      ["본인부담한도", "입원 자기부담금 연 200만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "입원 최대 5천만원 / 통원 최대 30만원"],
    ],
    selfpay: [
      ["입원", "자기부담금 10%"],
      ["통원", "의원 1만 / 병원 1.5만 / 종합병원 2만원 공제"],
      ["약제비", "8천원 공제"],
      ["비급여3종", "해당 없음"],
    ],
    waiting: [
      ["입원", "최초 입원일부터 365일 보장 후 90일 면책"],
      ["통원", "1년 내 180회 보장"],
    ],
   exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["건강검진", "일부 가능", "이상소견 추가검사 가능"],
  ["예방접종", "보장 제외", "예방 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "보장 제한", "급여 치료 일부 가능"],
  ["정신질환", "보장 제한", "대부분 제한"],
  ["정신과", "보장 제한", "대부분 제한"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
],
  },

  "2세대 2차": {
    info: [
      ["구분", "표준화 Ⅱ"],
      ["보험기간", "15년 재가입"],
      ["갱신주기", "1년"],
      ["본인부담한도", "입원 자기부담금 연 200만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "입원 최대 5천만원 / 통원 최대 30만원"],
    ],
    selfpay: [
      ["입원", "표준형 20% / 선택형 10%"],
      ["통원", "의원 1만원, 병원 1.5만원, 종합병원 2만원 또는 20% 중 큰 금액"],
      ["약제비", "8천원 또는 20% 중 큰 금액"],
      ["비급여3종", "해당 없음"],
    ],
    waiting: [
      ["입원", "최초 입원일부터 365일 보장 후 90일 면책"],
      ["통원", "1년 내 180회 보장"],
      ["동일 질병·상해", "퇴원 후 180일 이내 재입원 시 같은 사고로 볼 수 있음"],
    ],
    exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["건강검진", "일부 가능", "이상소견 추가검사 가능"],
  ["예방접종", "보장 제외", "예방 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "보장 제한", "급여 치료 일부 가능"],
  ["정신질환", "보장 제한", "대부분 제한"],
  ["정신과", "보장 제한", "대부분 제한"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
],
  },

  "2세대 3차": {
    info: [
      ["구분", "표준화 Ⅲ"],
      ["보험기간", "15년 재가입"],
      ["갱신주기", "1년"],
      ["본인부담한도", "입원 자기부담금 연 200만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "입원 최대 5천만원 / 통원 최대 30만원"],
    ],
    selfpay: [
      ["입원", "급여 10% / 비급여 20% 자기부담"],
      ["통원", "1만·1.5만·2만원 또는 급여10%, 비급여20% 중 큰 금액"],
      ["약제비", "8천원 또는 급여10%+비급여20% 중 큰 금액"],
      ["비급여3종", "해당 없음"],
    ],
    waiting: [
      ["입원", "2016년 이후 보장한도 소진 시까지"],
      ["275일 초과", "최초입원~보장종료가 275일 초과 시 90일 면책"],
      ["275일 이내", "365일에서 실제 입원일수를 뺀 기간 면책"],
      ["통원", "1년 내 180회 보장"],
    ],
   exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["건강검진", "일부 가능", "이상소견 추가검사 가능"],
  ["예방접종", "보장 제외", "예방 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "일부 가능", "K09~K14 급여 일부 가능"],
  ["정신질환", "일부 가능", "2016년 이후 일부 급여 가능"],
  ["정신과", "일부 가능", "급여 치료 일부 가능"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
],
  },

  "3세대": {
    info: [
      ["구분", "착한실손"],
      ["보험기간", "15년 재가입"],
      ["갱신주기", "1년"],
      ["본인부담한도", "입원 자기부담금 연 200만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "입원 5,000만원 / 통원 최대 30만원 / 도수 350만원 / 주사 250만원 / MRI 300만원"],
    ],
    selfpay: [
      ["입원", "급여 10% / 비급여 20% 자기부담"],
      ["통원", "1만·1.5만·2만원 또는 급여10%, 비급여20% 중 큰 금액"],
      ["약제비", "8천원 또는 급여10%, 비급여20% 중 큰 금액"],
      ["비급여3종", "2만원 또는 30% 중 큰 금액"],
    ],
    waiting: [
      ["입원", "한도 소진 시 다음 계약해당일부터 보장"],
      ["통원", "1년 내 180회 보장"],
      ["비급여3종", "도수 50회 / 비급여주사 50회 / MRI 연 300만원"],
    ],
    exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["비만", "보장 제외", "치료 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "일부 가능", "급여 치료 일부 가능"],
  ["정신질환", "일부 가능", "급여 일부 보장"],
  ["정신과", "일부 가능", "급여 치료 일부 가능"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["도수치료", "보장 제한", "치료 효과 입증 필요"],
  ["영양주사", "보장 제한", "치료 목적 확인 필요"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
],
  },

  "4세대": {
    info: [
      ["구분", "보험료 차등제"],
      ["보험기간", "5년 재가입"],
      ["갱신주기", "1년"],
      ["본인부담한도", "급여 입원 자기부담금 연 200만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "급여 5,000만원 / 비급여 5,000만원 / 통원 회당 20만원 / 도수 350만원 / 주사 250만원 / MRI 300만원"],
    ],
    selfpay: [
      ["입원", "급여 20% / 비급여 30% 자기부담"],
      ["통원", "급여 병·의원 1만원, 상급·종합병원 2만원 또는 20% 중 큰 금액 / 비급여 3만원 또는 30% 중 큰 금액"],
      ["약제비", "통원 급여에 포함"],
      ["비급여3종", "3만원 또는 30% 중 큰 금액"],
    ],
    waiting: [
      ["입원", "한도 소진 시 다음 계약해당일부터 보장"],
      ["통원", "회당 20만원 / 비급여 통원 연 100회"],
      ["비급여3종", "한도 또는 횟수 소진 시 다음 계약해당일까지"],
    ],
    exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["비만", "보장 제외", "치료 목적 제외"],
  ["임신·출산", "보장 제외", "임신·출산 관련 질환 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "일부 가능", "급여 치료 일부 가능"],
  ["정신질환", "일부 가능", "급여 일부 보장"],
  ["정신과", "일부 가능", "급여 치료 일부 가능"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["비급여 백내장", "보장 제한", "심사 강화"],
  ["영양주사", "보장 제한", "치료 목적 확인 필요"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
],
  },

  "5세대": {
    info: [
      ["구분", "중증·비중증 비급여 분리"],
      ["적용기간", "2026.04~"],
      ["보험기간", "5년 재가입"],
      ["갱신주기", "1년"],
      ["본인부담한도", "급여 200만원 / 중증 비급여 상급·종합병원 연 500만원"],
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "급여 5,000만원 / 중증 비급여 5,000만원 / 비중증 비급여 1,000만원 / 중증 3종 도수 350만·주사 250만·MRI 300만"],
    ],
    selfpay: [
      ["입원 급여", "20% 자기부담"],
      ["입원 중증 비급여", "30% 자기부담"],
      ["입원 비중증 비급여", "50% 자기부담"],
      ["통원 급여", "건보 본인부담률 또는 20% 중 큰 금액"],
      ["통원 중증 비급여", "3만원 또는 30% 중 큰 금액"],
      ["통원 비중증 비급여", "5만원 또는 50% 중 큰 금액"],
      ["3종 중증", "3만원 또는 30% 중 큰 금액"],
      ["3종 비중증", "5만원 또는 50% 중 큰 금액"],
    ],
    waiting: [
      ["입원", "한도 소진 시 다음 계약해당일부터 보장"],
      ["통원", "통원 일당 20만원"],
      ["비급여3종", "각 항목 한도 소진 시 다음 계약해당일까지"],
    ],
   exclude: [
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["비만", "보장 제외", "치료 목적 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "일부 가능", "급여 치료 일부 가능"],
  ["정신질환", "일부 가능", "급여 일부 보장"],
  ["정신과", "일부 가능", "급여 치료 일부 가능"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["해외치료", "보장 제외", "국내 치료 중심"],
  ["근골격계 비중증 치료", "보장 제한", "비중증 비급여 50% 본인부담"],
  ["비급여 도수·주사", "보장 제한", "중증·비중증 구분 적용"],
  ["비급여 백내장", "보장 제한", "심사 강화"],
],
  },

  "유병자": {
    info: [
      ["구분", "간편심사 실손"],
      ["보험기간", "3년 재가입"],
      ["갱신주기", "1년"],
      
      ["상급병실", "병실료 차액 50% (1일 10만원 한도)"],
      ["가입금액", "입원 5,000만원 / 통원 회당 20만원"],
    ],
    selfpay: [
      ["입원", "10만원 또는 30% 중 큰 금액"],
      ["통원", "2만원 또는 30% 중 큰 금액"],
      ["약제비", "보장 제외"],
      ["비급여3종", "보장 제외"],
    ],
    waiting: [
      ["입원", "365일 보장 후 90일 면책"],
      ["통원", "연 180회 보장"],
    ],
  exclude: [
  ["처방조제", "보장 제외", "약제비 보장 제외"],
  ["도수치료", "보장 제외", "비급여 3종 제외"],
  ["비급여주사", "보장 제외", "비급여 3종 제외"],
  ["MRI/MRA 특약", "보장 제외", "비급여 3종 제외"],
  ["한방", "보장 제한", "급여 일부 가능"],
  ["치과", "보장 제한", "급여 치료 일부 가능"],
  ["정신질환", "보장 제한", "대부분 제한"],
  ["정신과", "보장 제한", "대부분 제한"],
  ["안과", "보장 제한", "비급여 시력교정 제외"],
  ["미용·성형", "보장 제외", "치료 목적 제외"],
  ["비만", "보장 제외", "치료 목적 제외"],
],
  },
};
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

  // 5세대 입원 비중증 비급여 보장한도: 300만원
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
  bg-white rounded-2xl border p-4 text-left transition cursor-pointer
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
  <div className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-5">
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
    shadow-lg
hover:shadow-2xl
hover:-translate-y-0.5
transition-all
duration-200
cursor-pointer
  "
>
  <BookOpen className="w-6 h-6 text-white" />
</button>

{/* 세대 선택 메뉴 */}
{dictionaryOpen && (
  <div
    className="
      fixed
      left-10
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
w-62
    "
  >
    {[
  { title: "1세대", date: "~2009.09", value: "1세대" },
{ title: "2세대", date: "2009.10~2012.12", value: "2세대 1차" },
{ title: "2세대", date: "2013.01~2015.08", value: "2세대 2차" },
{ title: "2세대", date: "2015.09~2017.03", value: "2세대 3차" },
{ title: "3세대", date: "2017.04~2021.06", value: "3세대" },
{ title: "4세대", date: "2021.07~2026.04", value: "4세대" },
{ title: "5세대", date: "2026.05~", value: "5세대" },
{ title: "유병자 실손", date: "2018.04~", value: "유병자" },
].map((gen) => (
  <button
    key={gen.value}
    onClick={() => {
      setSelectedDictionaryGen(gen.value);
      setDictionaryTab("실손정보");
      setDictionaryModalOpen(true);
      setDictionaryOpen(false);
    }}
    className="
      w-full
      px-4
      py-3
      rounded-xl
      bg-gray-100
      text-sm
      font-bold
      text-gray-700
      text-left
      hover:bg-blue-50
      hover:text-blue-600
      transition
    "
  >
    <div className="flex items-center justify-between gap-4">
  <span className="text-sm font-bold text-gray-800">
    {gen.title}
  </span>

  <span className="text-xs font-medium text-gray-400">
    {gen.date}
  </span>
</div>
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
          {selectedDictionaryGen.includes("2세대")
  ? "2세대"
  : selectedDictionaryGen}{" "}
실손 사전
        </div>

        <button
  onClick={() => setDictionaryModalOpen(false)}
  className="cursor-pointer"
>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        {/* 팝업 내부 탭 */}
        <div className="grid grid-cols-4 gap-1 bg-gray-200 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setDictionaryTab("실손정보")}
            className={`rounded-xl py-3 text-[12px] sm:text-sm font-bold transition whitespace-nowrap ${
              dictionaryTab === "실손정보"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            실손정보
          </button>
          <button
  onClick={() => setDictionaryTab("자기부담금")}
  className={`rounded-xl py-3 text-[11px] sm:text-sm font-bold transition whitespace-nowrap ${
    dictionaryTab === "자기부담금"
      ? "bg-white text-blue-600 shadow-sm"
      : "text-gray-600"
  }`}
>
  자기부담금
</button>
<button
  onClick={() => setDictionaryTab("면책기간")}
  className={`rounded-xl py-3 text-[12px] sm:text-sm font-bold transition whitespace-nowrap ${
    dictionaryTab === "면책기간"
      ? "bg-white text-blue-600 shadow-sm"
      : "text-gray-600"
  }`}
>
  면책기간
</button>
          <button
            onClick={() => setDictionaryTab("면책사항")}
            className={`rounded-xl py-3 text-[12px] sm:text-sm font-bold transition whitespace-nowrap ${
              dictionaryTab === "면책사항"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            면책사항
          </button>
        </div>
<div className="mb-5 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
  <p className="text-xs font-medium text-yellow-800 leading-relaxed">
    📢 현재 실손사전은 지속적으로 수정·업데이트 중입니다.
      일부 내용에 오류가 있을 수 있으니 참고용으로 활용해 주세요.
  </p>

  <p className="text-xs text-yellow-700 leading-relaxed mt-1">
        &nbsp;&nbsp; &nbsp;&nbsp;수정이 필요한 부분이나 추가되었으면 하는 내용은
    ‘보험나무에게 메세지 보내기’를 통해 남겨주세요.
  </p>
</div>
        {/* 실손정보 */}
{dictionaryTab === "실손정보" && (
  <div className="space-y-3">
    {dictionaryData[selectedDictionaryGen].info.map(
      ([label, value]: [string, string]) => (
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
      )
    )}
  </div>
)}
{/* 자기부담금 */}
{dictionaryTab === "자기부담금" && (
  <div className="space-y-3">
    {dictionaryData[selectedDictionaryGen].selfpay.map(
      ([label, value]: [string, string]) => (
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
      )
    )}
  </div>
)}
{/* 면책기간 */}
{dictionaryTab === "면책기간" && (
  <div className="space-y-3">
    {dictionaryData[selectedDictionaryGen].waiting.map(
      ([label, value]: [string, string]) => (
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
      )
    )}
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
                  <th className="px-2 py-3 text-left font-bold text-gray-700 w-[88px] min-w-[88px]">
  구분
</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">
                    비고
                  </th>
                </tr>
              </thead>

              <tbody>
                {dictionaryData[selectedDictionaryGen].exclude.map(
  ([item, cover, note]: [string, string, string]) => (
    <tr key={item} className="border-t border-gray-100">
      <td className="px-4 py-3 text-gray-700">
        {item}
      </td>

      <td className="px-2 py-3 w-[88px] min-w-[88px]">
  <span
    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
            cover.includes("제외")
              ? "bg-red-100 text-red-600"
              : cover.includes("가능")
              ? "bg-blue-100 text-blue-600"
              : cover.includes("제한")
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {cover}
        </span>
      </td>

      <td className="px-4 py-3 text-gray-500">
        {note}
      </td>
    </tr>
  )
)}
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