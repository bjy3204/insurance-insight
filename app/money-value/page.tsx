"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  Newspaper,
  MessageCircle,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";

export default function MoneyValuePage() {
  const [type, setType] = useState<"future" | "present" | "dollar">("future");

  const [money, setMoney] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [currentRate, setCurrentRate] = useState("");
  const [compareRate, setCompareRate] = useState("");

  const result =
    type === "future"
      ? Number(money || 0) *
        Math.pow(1 + Number(rate || 0) / 100, Number(years || 0))
      : type === "present"
      ? Number(money || 0) /
        Math.pow(1 + Number(rate || 0) / 100, Number(years || 0))
      : 0;

  const dollarValue =
    Number(currentRate || 0) > 0
      ? (Number(money || 0) * 10000) / Number(currentRate || 0)
      : 0;

  const compareDollarValue =
    Number(compareRate || 0) > 0
      ? (Number(money || 0) * 10000) / Number(compareRate || 0)
      : 0;

  const formatMoney = (num: number) => {
    return Math.round(num).toLocaleString();
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
                <CircleDollarSign className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  화폐가치 계산기
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                물가상승률·환율 기준 현재·미래 화폐가치 계산
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 탭 */}
        <div className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-7">
          <button
            onClick={() => setType("future")}
            className={`rounded-xl py-3 font-bold transition ${
              type === "future"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            미래가치
          </button>

          <button
            onClick={() => setType("present")}
            className={`rounded-xl py-3 font-bold transition ${
              type === "present"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            현재가치
          </button>

          <button
            onClick={() => setType("dollar")}
            className={`rounded-xl py-3 font-bold transition ${
              type === "dollar"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            달러가치
          </button>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          {/* 금액 */}
          <div className="mb-5">
            <label className="text-lg font-black text-gray-800 mb-3 block">
              {type === "future"
                ? "현재금액"
                : type === "present"
                ? "미래금액"
                : "현재자산"}
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
                  w-full h-16 rounded-2xl border border-gray-200
                  px-5 pr-20 text-lg font-bold outline-none
                  focus:ring-2 focus:ring-blue-500
                "
              />

              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                만원
              </span>
            </div>
          </div>

          {type !== "dollar" && (
            <>
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
                      w-full h-16 rounded-2xl border border-gray-200
                      px-5 pr-20 text-lg font-bold outline-none
                      focus:ring-2 focus:ring-blue-500
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
                      w-full h-16 rounded-2xl border border-gray-200
                      px-5 pr-20 text-lg font-bold outline-none
                      focus:ring-2 focus:ring-blue-500
                    "
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                    년
                  </span>
                </div>
              </div>
            </>
          )}

          {type === "dollar" && (
            <>
              {/* 현재환율 */}
              <div className="mb-5">
                <label className="text-lg font-black text-gray-800 mb-3 block">
                  현재환율
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      currentRate
                        ? Number(
                            String(currentRate).replaceAll(",", "")
                          ).toLocaleString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replaceAll(",", "");
                      setCurrentRate(value.replace(/[^0-9]/g, ""));
                    }}
                    className="
                      w-full h-16 rounded-2xl border border-gray-200
                      px-5 pr-20 text-lg font-bold outline-none
                      focus:ring-2 focus:ring-blue-500
                    "
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                    원
                  </span>
                </div>
              </div>

              {/* 비교환율 */}
              <div className="mb-6">
                <label className="text-lg font-black text-gray-800 mb-3 block">
                  비교환율
                </label>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      compareRate
                        ? Number(
                            String(compareRate).replaceAll(",", "")
                          ).toLocaleString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replaceAll(",", "");
                      setCompareRate(value.replace(/[^0-9]/g, ""));
                    }}
                    className="
                      w-full h-16 rounded-2xl border border-gray-200
                      px-5 pr-20 text-lg font-bold outline-none
                      focus:ring-2 focus:ring-blue-500
                    "
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                    원
                  </span>
                </div>
              </div>
            </>
          )}
          {/* 결과 */}
          <div className="bg-blue-50 rounded-3xl p-6 mb-5">
            <p className="text-gray-700 text-lg font-black text-center mb-5">
              계산 결과
            </p>

            {type !== "dollar" ? (
              <>
                <div className="flex items-end justify-center gap-3">
                  <span className="text-5xl font-black text-blue-600 leading-none">
                    {formatMoney(result)}
                  </span>

                  <span className="text-2xl font-bold text-gray-700 mb-1">
                    만원
                  </span>
                </div>

                <p className="text-gray-600 text-sm mt-4 text-center">
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
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* 현재달러가치 */}
                <div className="bg-white rounded-2xl border border-blue-100 p-5 text-center">
                  <p className="text-sm font-bold text-gray-500 mb-2">
                    현재달러가치
                  </p>

                  <p className="text-2xl font-black text-blue-600">
                    {Math.round(dollarValue).toLocaleString()}달러
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    환율 {formatMoney(Number(currentRate || 0))}원 기준
                  </p>
                </div>

                {/* 비교달러가치 */}
                <div className="bg-white rounded-2xl border border-blue-100 p-5 text-center">
                  <p className="text-sm font-bold text-gray-500 mb-2">
                    비교달러가치
                  </p>

                  <p className="text-2xl font-black text-blue-600">
                    {Math.round(compareDollarValue).toLocaleString()}달러
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    환율 {formatMoney(Number(compareRate || 0))}원 기준
                  </p>
                </div>

                {/* 노동가치 */}
                <div className="bg-white rounded-2xl border border-blue-100 p-5 text-center">
                  <p className="text-sm font-bold text-gray-500 mb-2">
                    노동가치
                  </p>

                  <p className="text-2xl font-black text-blue-600">
                    {Math.round(
                      (Number(money || 0) * 10000) / 10320
                    ).toLocaleString()}시간
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    최저시급 10,320원 기준
                  </p>
                </div>

              </div>
            )}
          </div>
          
          {/* 설명 */}
          <div className="mt-5 text-gray-500 text-sm leading-relaxed">
            {type === "dollar"
              ? "환율 변화에 따라 같은 원화 자산이라도 달러 기준 가치는 달라질 수 있습니다."
              : "물가상승률이 높을수록 미래의 화폐가치는 커지고, 현재가치는 작아집니다."}
          </div>
        </div>
      </div>

      {/* 하단 고정 메뉴 */}
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
    </main>
  );
}