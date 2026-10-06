"use client";

import { FileText, X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function LifeExpectancyDialog({ controller }: { controller: HomeController }) {
const { startPopupDrag, getPopupStyle, lifeOpen, setLifeOpen, lifeGender, setLifeGender, lifeAge, setLifeAge, selectedLife, expectYears, sickYears, healthyYears, expectAge, sickStartAge } = controller;
return (<>{lifeOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div
  style={getPopupStyle("life")}
  className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("life", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          기대수명 계산기
        </div>

        <button data-popup-close="true"
          onClick={() => setLifeOpen(false)}
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
          {(["남성", "여성"] as const).map((item) => (
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
          <div className="relative">
            <input
              value={lifeAge}
              onChange={(e) =>
                setLifeAge(
                  e.target.value.replace(/[^0-9]/g, "")
                )
              }
              placeholder="나이를 입력하세요"
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
              "
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
              세
            </span>
          </div>
        </div>
{!selectedLife && (
  <div className="bg-blue-50 rounded-3xl p-8 text-center mb-5">
    <img
      src={`/icons/pension/${lifeGender === "남성" ? "male" : "female"}.png`}
      alt={lifeGender}
      className="w-20 h-20 object-contain mx-auto mb-4"
    />

    <p className="text-sm text-gray-400 leading-relaxed">
      나이를 입력하면 기대여명과 건강기간을 확인할 수 있습니다.
    </p>
   
  </div>
  
)}
        {selectedLife && (
  <>
    <div className="bg-blue-50 rounded-3xl p-6 text-center mb-5">
      <img
        src={`/icons/pension/${lifeGender === "남성" ? "male" : "female"}.png`}
        alt={lifeGender}
        className="w-20 h-20 object-contain mx-auto mb-4"
      />

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
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          기대여명
        </p>

        <p className="text-2xl font-black text-blue-600">
          {expectYears.toFixed(1)}년
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          건강기간
        </p>

        <p className="text-2xl font-black text-blue-600">
          {healthyYears.toFixed(1)}년
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm font-bold text-gray-500 mb-2">
          유병기간
        </p>

        <p className="text-2xl font-black text-blue-600">
          {sickYears.toFixed(1)}년
        </p>
      </div>
    </div>

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
  </>
)}
<p className="text-xs text-gray-500 leading-relaxed mt-5 px-1">
  본 자료는 통계청 「2024년 생명표」 및
  유병기간 제외 기대수명(건강수명) 통계를 참고하여 계산한 추정값이며,
  개인의 건강상태 · 생활습관 · 질병 이력 등에 따라 실제 결과와 다를 수 있습니다.
</p>
      </div>
    </div>
  </div>
)}</>);
}
