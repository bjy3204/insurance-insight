"use client";
import { useEffect, useState } from "react";
import { hospitalData } from "./hospital-data";
import {
  Hospital,
  X,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HospitalInfoPopup({ open, onClose }: Props) {
  const [selectedType, setSelectedType] = useState("전체");
  const [sido, setSido] = useState("");
  const [dong, setDong] = useState("");
  const [department, setDepartment] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);

  const hospitalTypes = ["의원", "종합병원", "상급종합병원"];
  const normalize = (value: any) =>
  String(value ?? "")
    .toLowerCase()
    .replaceAll(" ", "")
    .trim();
  const itemsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(results.length / itemsPerPage));

  const pagedResults = results.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
const handleSearch = () => {
  setPage(1);
  setLoading(true);

  try {
    const sidoKeyword = normalize(sido);
    const dongKeyword = normalize(dong);
    const departmentKeyword = normalize(department);
    const hospitalNameKeyword = normalize(hospitalName);

    const filtered = hospitalData.filter((hospital) => {
      const typeText = normalize(hospital.type);
      const originalTypeText = normalize(hospital.originalType);
      const addressText = normalize(hospital.address);
      const departmentText = normalize(hospital.departments);
      const nameText = normalize(hospital.name);

      const matchType =
        selectedType === "전체" ||
        typeText.includes(normalize(selectedType)) ||
        originalTypeText.includes(normalize(selectedType));

      const matchSido =
        !sidoKeyword || addressText.includes(sidoKeyword);

      const matchDong =
        !dongKeyword || addressText.includes(dongKeyword);

      const matchDepartment =
        !departmentKeyword || departmentText.includes(departmentKeyword);

      const matchHospitalName =
        !hospitalNameKeyword || nameText.includes(hospitalNameKeyword);

      return (
        matchType &&
        matchSido &&
        matchDong &&
        matchDepartment &&
        matchHospitalName
      );
    });

    setResults(filtered);
  } catch (error) {
    console.log(error);
    setResults([]);
  } finally {
    setLoading(false);
  }
};
    

  useEffect(() => {
  if (!open) return;

  const timer = setTimeout(() => {
    handleSearch();
  }, 300);

  return () => clearTimeout(timer);
}, [open, selectedType, sido, dong, department, hospitalName]);
  if (!open) return null;



const toggleType = (type: string) => {
  setPage(1);
  setSelectedType(type);
};
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4">
     <div
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
        <div className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between">
          <div className="font-bold flex items-center gap-2">
            <Hospital className="w-5 h-5" />
            병원정보 검색
          </div>

          <button
  onClick={onClose}
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

        <div className="hospital-scroll flex-1 overflow-y-auto p-5">
          

          <div className="mb-5">
            <div className="grid grid-cols-4 bg-gray-200 rounded-2xl p-1 gap-1">
              {["전체", ...hospitalTypes].map((item) => {
                const active = selectedType === item;

                return (
                  <button
                    key={item}
                    onClick={() => toggleType(item)}
                    className={`rounded-2xl py-3 text-[11px] sm:text-sm font-bold transition whitespace-nowrap ${
                      active
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
                    </div>
<button
  onClick={() => setFilterOpen(!filterOpen)}
  className="
    w-full
    mb-4
    flex
    items-center
    justify-between
    rounded-2xl
    border
    border-gray-200
    bg-white
    px-4
    py-3
    text-sm
    font-bold
    text-gray-700
  "
>
  검색조건

  {filterOpen ? (
    <ChevronUp className="w-4 h-4 text-gray-400" />
  ) : (
    <ChevronDown className="w-4 h-4 text-gray-400" />
  )}
</button>
          {filterOpen && (
            <>
              <div className="grid grid-cols-3 gap-2">
            <input
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              
              placeholder="시·도"
              className="w-full border border-gray-200 rounded-2xl bg-white px-4 py-3 outline-none text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />

            <input
              value={dong}
              onChange={(e) => setDong(e.target.value)}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
}}
              placeholder="동(선택)"
             className="w-full border border-gray-200 rounded-2xl bg-white px-4 py-3 outline-none text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />

            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
}}
              placeholder="진료과목"
              className="w-full border border-gray-200 rounded-2xl bg-white px-4 py-3 outline-none text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>

<input
  value={hospitalName}
  onChange={(e) => setHospitalName(e.target.value)}
  placeholder="병원명 검색"
  className="
    w-full
    mt-2
    border
    border-gray-200
    rounded-2xl
    bg-white
    px-4
    py-3
    outline-none
    text-sm
    focus:border-slate-400
    focus:ring-2
    focus:ring-slate-100
    transition
  "
/>

            </>
          )}

          <div className="mt-6 mb-4">
            <p className="text-sm font-bold text-gray-700">
              검색 결과 {results.length.toLocaleString()}개 · {page} /{" "}
              {totalPages}페이지
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm font-medium">
              병원 정보를 불러오는 중입니다
            </div>
          ) : (
            <div className="space-y-4">
              {results.length === 0 ? (
               <div className="text-center py-16">
  

  <p className="text-sm font-bold text-gray-500">
    검색 결과가 없습니다
  </p>

  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
    시·도 또는 진료과목을 다시 확인해 주세요.
  </p>
</div>
              ) : (
                pagedResults.map((hospital, index) => (
                  <div
  key={index}
  className="
    bg-white
    border
    border-gray-200
    rounded-3xl
    p-5
    shadow-sm
  "
>
  {/* 상단 */}
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-[17px] leading-snug font-black text-gray-900 break-keep">
          {hospital.name}
        </h2>

        <span
          className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
            hospital.type === "상급종합병원"
              ? "bg-blue-100 text-blue-600"
              : hospital.type === "종합병원"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {hospital.originalType || hospital.type}
        </span>
      </div>

      <div className="flex items-start gap-2 mt-2">
  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-[2px]" />

  <p className="text-[13px] text-gray-500 leading-relaxed break-keep">
    {hospital.address}
  </p>
</div>
    </div>

    
  </div>

  {/* 정보 박스 */}
<div className="grid grid-cols-3 gap-3 mt-4">
  <a
    href={hospital.tel !== "-" ? `tel:${hospital.tel}` : undefined}
    className="
      bg-gray-50
      rounded-2xl
      py-4
      px-3
      text-center
      hover:bg-gray-100
      transition
    "
  >
    <p className="text-[11px] text-gray-400 font-semibold">
      전화번호
    </p>

    <p className="text-[18px] font-black text-gray-900 mt-1 tracking-tight">
      {hospital.tel}
    </p>
  </a>

  <div className="bg-gray-50 rounded-2xl py-4 px-3 text-center">
    <p className="text-[11px] text-gray-400 font-semibold">
      총 의사수
    </p>

    <p className="text-[18px] font-black text-gray-900 mt-1 tracking-tight">
      <span className="text-blue-600">
  {String(hospital.doctorCount).replace("명", "")}
</span>{" "}
명
    </p>
  </div>

  <a
    href={hospital.homepage}
    target="_blank"
    rel="noopener noreferrer"
    className="
      bg-gray-800
      rounded-2xl
      py-4
      px-3
      flex
      items-center
      justify-center
      gap-2
      text-white
      hover:bg-gray-700
      transition
    "
  >
    <div className="text-center">
      <p className="text-[11px] font-bold opacity-70">
        병원정보
      </p>

      <p className="text-sm font-black mt-1">
        바로가기
      </p>
    </div>

    
  </a>
</div>
  {/* 상세정보 버튼 */}
  <button
  onClick={() =>
    setOpenedIndex(openedIndex === index ? null : index)
  }
  className="
    w-full
    mt-4
    border-t
    border-gray-100
    pt-4
    flex
    items-center
    justify-center
    text-sm
    font-medium
    text-gray-400
    hover:text-gray-600
    transition
  "
>
  <div className="flex items-center gap-1">
    <span>상세정보 보기</span>

    {openedIndex === index ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )}
  </div>
</button>

  {openedIndex === index && (
    <div className="mt-4 space-y-4">
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-black text-gray-900">
          진료과목
        </p>

        <p className="text-sm text-gray-600 mt-2 leading-relaxed break-keep">
          {hospital.departments}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-black text-gray-900">
          교통정보
        </p>

        <p className="text-sm text-gray-600 mt-2 leading-relaxed break-keep whitespace-pre-line">
          {hospital.traffic}
        </p>
      </div>
    </div>
  )}
</div>
                ))
              )}
            </div>
          )}
         

        
          <div className="pt-4 pb-3">
  <div className="flex justify-center">
    <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
      >
        이전
      </button>

      {Array.from({ length: Math.min(totalPages, 10) }).map((_, index) => {
        const pageNumber = index + 1;

        return (
          <button
            key={pageNumber}
            onClick={() => {
  setPage(pageNumber);

  const container = document.querySelector(
    ".hospital-scroll"
  );

  if (container) {
    container.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}}
            className={`px-4 py-2 border-l border-gray-200 ${
              page === pageNumber
                ? "bg-slate-800 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
      >
        다음
      </button>
    </div>
  </div>

  <p className="text-[11px] text-center text-gray-400 mt-3 leading-relaxed">
    본 의료기관 정보는 보건의료빅데이터개방시스템 자료를 기반으로 제공됩니다.
  
    실제 진료 여부 및 운영 정보는 의료기관에 직접 확인해 주세요.
  </p>
</div>
        </div>
      </div>
    </div>
  );
}