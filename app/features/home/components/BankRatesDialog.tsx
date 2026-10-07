"use client";

import { X, Percent } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function BankRatesDialog({ controller }: { controller: HomeController }) {
const { open, startPopupDrag, getPopupStyle, bankRateOpen, setBankRateOpen, bankRateMonth, setBankRateMonth, bankRates, bankBaseDate } = controller;
return (<>{bankRateOpen && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div data-popup-frame="true"
      style={getPopupStyle("bankRate")}
      className="bg-white w-full max-w-4xl rounded-[24px] shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
    >
      <div data-popup-header="true"
        onMouseDown={(e) => startPopupDrag("bankRate", e)}
        className="bg-white text-slate-800 px-4 py-3 md:px-7 md:py-4 border-b border-[#e1e9fb] flex items-center justify-between gap-3 shrink-0"
      >
        <h2 data-popup-title="true" className="font-bold text-lg flex items-center gap-2.5">
          <Percent className="w-[25px] h-[25px] text-blue-600 shrink-0" />
          주요 은행 {bankRateMonth}개월 예금 금리
        </h2>

        <button type="button" data-popup-close="true" aria-label="예금 금리 닫기"
          onMouseDown={event => event.stopPropagation()}
          onClick={() => setBankRateOpen(false)}
          className="
            w-9
            h-9
            rounded-full
            flex
            items-center
            justify-center
            hover:bg-blue-50
            transition
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        <div data-tab-group="true" className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-5">
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
                ${bank.hover}
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
  <p className="text-xs font-medium text-gray-500 mb-2">금리 공시월 · {bankBaseDate}</p>
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
)}</>);
}
