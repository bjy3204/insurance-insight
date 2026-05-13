"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
} from "lucide-react";

export default function MoneyValuePage() {
  const [type, setType] = useState<"future" | "present">("future");

  const [money, setMoney] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");

  const result =
  type === "future"
    ? Number(money || 0) *
      Math.pow(
        1 + Number(rate || 0) / 100,
        Number(years || 0)
      )
    : Number(money || 0) /
      Math.pow(
        1 + Number(rate || 0) / 100,
        Number(years || 0)
      );

  const formatMoney = (num: number) => {
    return Math.round(num).toLocaleString();
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

      {/* 헤더 */}
<header className="bg-white border-b border-black shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-6">

    <div className="flex items-center justify-between">

      {/* 뒤로가기 */}
      <Link
        href="/"
        className="
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

      {/* 제목 */}
      <div className="text-center">

        <div className="flex items-center justify-center gap-2">
          <CircleDollarSign className="w-7 h-7 text-blue-600" />

          <h1 className="text-2xl font-black text-gray-900">
            화폐가치 계산기
          </h1>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          물가상승률 기준 현재·미래 화폐가치를 계산합니다
        </p>

      </div>

      {/* 오른쪽 균형 */}
      <div className="w-11 h-11" />

    </div>

  </div>
</header>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* 탭 */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setType("future")}
            className={`
              px-5
              h-11
              rounded-2xl
              font-bold
              text-sm
              transition
              shadow-sm
              ${
                type === "future"
                  ? "bg-white text-blue-600"
                  : "bg-gray-200 text-gray-600"
              }
            `}
          >
            미래가치
          </button>

          <button
            onClick={() => setType("present")}
            className={`
              px-5
              h-11
              rounded-2xl
              font-bold
              text-sm
              transition
              shadow-sm
              ${
                type === "present"
                  ? "bg-white text-blue-600"
                  : "bg-gray-200 text-gray-600"
              }
            `}
          >
            현재가치
          </button>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-sm p-5">

          {/* 현재금액 */}
          <div className="mb-5">
            <label className="text-lg font-black text-gray-800 mb-3 block">
              {type === "future" ? "현재금액" : "미래금액"}
            </label>

            <div className="relative">
              <input
  type="text"
  inputMode="numeric"
  value={
    money
      ? Number(String(money).replaceAll(",", "")).toLocaleString()
      : ""
  }
  onChange={(e) => {
    const value = e.target.value.replaceAll(",", "");
    setMoney(value.replace(/[^0-9]/g, ""));
  }}
  className="
    w-full
    h-16
    rounded-2xl
    border
    border-gray-200
    px-5
    pr-20
    text-lg
    font-bold
    outline-none
    focus:ring-2
    focus:ring-blue-500
  "
/>

              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                만원
              </span>
            </div>
          </div>

          {/* 물가상승률 */}
          <div className="mb-5">
            <label className="text-lg font-black text-gray-800 mb-3 block">
              물가상승률 (%)
            </label>

            <div className="relative">
              <input
  type="text"
  inputMode="decimal"
  value={rate}
  onChange={(e) =>
  setRate(e.target.value.replace(/[^0-9.]/g, ""))
}
                className="
                  w-full
                  h-16
                  rounded-2xl
                  border
                  border-gray-200
                  px-5
                  pr-20
                  text-lg
                  font-bold
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                %
              </span>
            </div>
          </div>

          {/* 기간 */}
          <div className="mb-6">
            <label className="text-lg font-black text-gray-800 mb-3 block">
              기간 (년)
            </label>

            <div className="relative">
              <input
  type="text"
  inputMode="numeric"
  value={years}
  onChange={(e) =>
  setYears(e.target.value.replace(/[^0-9]/g, ""))
}
                className="
                  w-full
                  h-16
                  rounded-2xl
                  border
                  border-gray-200
                  px-5
                  pr-20
                  text-lg
                  font-bold
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                년
              </span>
            </div>
          </div>

          {/* 결과 */}
          <div className="bg-blue-50 rounded-3xl p-7 text-center">
            <p className="text-gray-600 text-lg font-bold mb-2">
              계산 결과
            </p>

            <div className="flex items-end justify-center gap-3">
              <span className="text-5xl font-black text-blue-600 leading-none">
                {formatMoney(result)}
              </span>

              <span className="text-2xl font-bold text-gray-700 mb-1">
                만원
              </span>
            </div>

            <p className="text-gray-600 text-sm mt-4">
  {type === "future"
    ? `현재 ${formatMoney(
        Number(money || 0)
      )}만원은 ${years}년 뒤 약 ${formatMoney(
        result
      )}만원의 가치가 됩니다`
    : `${years}년 뒤 ${formatMoney(
        Number(money || 0)
      )}만원의 현재가치는 약 ${formatMoney(
        result
      )}만원입니다`}
</p>
          </div>

          {/* 설명 */}
          <div className="mt-5 text-gray-500 text-sm">
            물가상승률이 높을수록 미래의 화폐가치는 커지고,
            현재가치는 작아집니다.
          </div>
        </div>
      </div>
    </main>
  );
}