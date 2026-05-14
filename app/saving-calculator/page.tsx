"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Landmark,
  Newspaper,
  MessageCircle,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

type CalcType = "deposit" | "saving";
type InterestType = "simple" | "year" | "quarter" | "month";

export default function SavingCalculatorPage() {
  const [type, setType] = useState<CalcType>("saving");
  const [interestType, setInterestType] = useState<InterestType>("simple");
  const [taxRate, setTaxRate] = useState(15.4);

  const [depositMoney, setDepositMoney] = useState("");
  const [depositMonths, setDepositMonths] = useState("");
  const [depositRate, setDepositRate] = useState("");

  const [savingMoney, setSavingMoney] = useState("");
  const [savingMonths, setSavingMonths] = useState("");
  const [savingRate, setSavingRate] = useState("");

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
                <Landmark className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  예금 · 적금 계산기
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                단리 · 복리 만기금액 계산
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 탭 */}
        <div className="flex justify-center gap-2 mb-4">
          <TopButton
  active={type === "saving"}
  onClick={() => {
    setType("saving");
    setInterestType("simple");
  }}
>
  적금
</TopButton>


<TopButton
  active={type === "deposit"}
  onClick={() => {
    setType("deposit");
    setInterestType("simple");
  }}
>
  예금
</TopButton>
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
              <SelectButton active={taxRate === 15.4} onClick={() => setTaxRate(15.4)}>
                일반과세
              </SelectButton>
              <SelectButton active={taxRate === 9.5} onClick={() => setTaxRate(9.5)}>
                세금우대
              </SelectButton>
              <SelectButton active={taxRate === 0} onClick={() => setTaxRate(0)}>
                비과세
              </SelectButton>
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
    실제 금융상품의 금리, 세율, 우대조건에 따라 결과는 달라질 수 있습니다.
  </p>

  <p>
    이자소득세: 일반과세(15.4%), 세금우대(9.5%)
  
  </p>
</div>
        </div>
      </div>

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