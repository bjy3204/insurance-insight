"use client";
import { useEffect, useRef, useState } from "react";
import { hospitalData } from "./hospital-data";
import {
  Hospital,
  X,
  Phone,
  UsersRound, ExternalLink,
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
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { if (open) setFilterOpen(false); }, [open]);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

const dragRef = useRef({
  isDragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

const movePopup = (e: React.MouseEvent) => {
  if (!dragRef.current.isDragging) return;

  setPopupPos({
    x: dragRef.current.originX + e.clientX - dragRef.current.startX,
    y: dragRef.current.originY + e.clientY - dragRef.current.startY,
  });
};

const stopPopupMove = () => {
  dragRef.current.isDragging = false;
};

const closePopup = () => {
  setPopupPos({ x: 0, y: 0 });
  onClose();
};

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
    <div
  onMouseMove={movePopup}
  onMouseUp={stopPopupMove}
  onMouseLeave={stopPopupMove}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4"
>
     <div data-popup-frame="true"
  onClick={(e) => e.stopPropagation()}
  style={{
    transform: `translate(${popupPos.x}px, ${popupPos.y}px)`,
  }}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
        <div data-popup-header="true"
  onMouseDown={(e) => {
  if (window.innerWidth < 768) return;

  dragRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    originX: popupPos.x,
    originY: popupPos.y,
  };
}}
  className="bg-white text-slate-800 px-4 md:px-5 py-3 flex items-center justify-between"
>
          <div data-popup-title="true" className="font-bold flex items-center gap-2">
            <Hospital className="w-5 h-5" />
            병원정보 검색
          </div>

          <button data-popup-close="true"
  onClick={closePopup}
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
            <div data-tab-group="true" className="grid grid-cols-4 bg-gray-200 rounded-2xl p-1 gap-1">
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
<div className="rounded-2xl border border-gray-200 bg-[#f8fafc] overflow-hidden">
<button type="button" aria-expanded={filterOpen} aria-controls="hospital-search-filters"
  onClick={() => setFilterOpen(!filterOpen)}
  className="
    w-full
    flex
    items-center
    justify-between
    rounded-2xl
    bg-transparent
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
            <div id="hospital-search-filters" className="border-t border-gray-100 p-4">
              <div className="grid grid-cols-3 gap-2">
            <input data-ui-field="true" data-page-search-input="true"
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              
              placeholder="시·도"
              className="w-full border border-gray-200 rounded-2xl bg-white px-4 py-3 outline-none text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />

            <input data-ui-field="true" data-page-search-input="true"
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

            <input data-ui-field="true" data-page-search-input="true"
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

<input data-ui-field="true" data-page-search-input="true"
  value={hospitalName}
  onChange={(e) => setHospitalName(e.target.value)}
  placeholder="병원명 검색"
  className="mt-2 w-full border border-gray-200 rounded-2xl bg-white px-4 py-3 outline-none text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
/>

            </div>
          )}

</div>
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

  <div className="grid grid-cols-3 md:grid-cols-[minmax(0,1fr)_165px_110px_100px_100px] items-center gap-3">
    <div className="col-span-3 md:col-span-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-[17px] font-black text-gray-900 break-words">{hospital.name}</h2>
        <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">{hospital.originalType || hospital.type}</span>
      </div>
      <div className="flex items-start gap-1.5 mt-1"><MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" /><p className="text-xs text-slate-500 break-words">{hospital.address}</p></div>
    </div>
    <a href={hospital.tel !== "-" ? `tel:${hospital.tel}` : undefined} className="flex items-center gap-2 min-w-0">
      <Phone size={17} className="hidden sm:block shrink-0 text-slate-400" />
      <div className="min-w-0"><p className="text-xs sm:text-sm text-slate-500">전화번호</p><p className="text-sm sm:text-base font-bold text-slate-900 break-words">{hospital.tel}</p></div>
    </a>
    <div className="flex items-center gap-2"><UsersRound size={18} className="hidden sm:block text-slate-400" /><div><p className="text-xs sm:text-sm text-slate-500">총 의사수</p><p className="text-base font-bold text-blue-600">{String(hospital.doctorCount).replace("명", "")}명</p></div></div>
    <button type="button" onClick={() => setOpenedIndex(openedIndex === index ? null : index)} aria-expanded={openedIndex === index} className="flex items-center justify-center gap-1 rounded-xl bg-blue-50 px-2 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-100 transition cursor-pointer">
      상세정보 {openedIndex === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    <a href={hospital.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"><span>바로가기</span><ExternalLink size={14} /></a>
  </div>

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
    <div className="flex    text-sm">
<nav data-pagination="true" aria-label="페이지 이동">
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
    </nav>
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
