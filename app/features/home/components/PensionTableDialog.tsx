"use client";

import { FileText, X, Search } from "lucide-react";
import { NpsTableTab } from "../data";
import type { HomeController } from "../hooks/useHomeController";
export default function PensionTableDialog({ controller }: { controller: HomeController }) {
const { startPopupDrag, getPopupStyle, npsTableOpen, setNpsTableOpen, npsTableTab, setNpsTableTab, npsSearch, setNpsSearch, filteredNpsTable } = controller;
return (<>{npsTableOpen && (
  <div
    onClick={() => setNpsTableOpen(false)}
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div data-popup-frame="true"
  onClick={(e) => e.stopPropagation()}
  style={getPopupStyle("nps")}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
      <div
  onPointerDown={(e) => startPopupDrag("nps", e)}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          국민연금 예상연금월액표
        </div>

        <button data-popup-close="true"
          onClick={() => setNpsTableOpen(false)}
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
        <div data-tab-group="true" className="grid grid-cols-3 bg-gray-200 rounded-2xl p-1 mb-5">
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
)}</>);
}
