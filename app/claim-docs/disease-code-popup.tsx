"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, X } from "lucide-react";

type DiseaseCode = Record<string, any>;

export default function DiseaseCodePopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DiseaseCode[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
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

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    fetch("/data/disease-codes.json")
      .then((res) => res.json())
      .then((json) => {
      const rows =
  Array.isArray(json)
    ? json
    : Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.items)
    ? json.items
    : [];

console.log(rows.length);
setItems(rows);
      })
      .catch((error) => {
        console.log("상병코드 파일 로딩 실패:", error);
        setItems([]);
      })
      .finally(() => {
  setLoading(false);
  setLoaded(true);
});
  }, [open]);

  const filteredItems = useMemo(() => {
  const keyword = search
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll(".", "")
    .replaceAll("-", "");

  if (!keyword) {
    return items.slice(0, 300);
  }

  return items
    .filter((item) => {
      const text = JSON.stringify(item)
        .toLowerCase()
        .replaceAll(" ", "")
        .replaceAll(".", "")
        .replaceAll("-", "");

      return text.includes(keyword);
    })
    .slice(0, 500);
}, [items, search]);

  if (!open) return null;

  return (
    <div
  onMouseMove={movePopup}
  onMouseUp={stopPopupMove}
  onMouseLeave={stopPopupMove}
  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
>
      <div
  style={{
    transform: `translate(${popupPos.x}px, ${popupPos.y}px)`,
  }}
  className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
>
        <div
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
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
          <div className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            상병코드 검색
          </div>

          <button
            onClick={closePopup}
            className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 min-h-0 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상병코드 또는 질병명을 검색하세요"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
            />
          </div>

         <p className="text-sm font-bold text-gray-700 mb-3">
  {!loaded
    ? "상병코드 데이터 불러오는 중..."
    : `전체 ${items.length.toLocaleString()}개 · 검색 결과 ${filteredItems.length.toLocaleString()}개`}
</p>
          <div className="overflow-auto flex-1 border border-gray-200 rounded-2xl">
            {loading ? (
              <div className="text-center text-sm text-gray-400 py-10">
                상병코드 데이터를 불러오는 중입니다
              </div>
            ) : (
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                  <tr>
                    <th className="w-[90px] py-3 px-2 border-b border-gray-200 whitespace-nowrap">
  코드
</th>

<th className="w-[260px] py-3 px-3 border-b border-gray-200 text-center">
  질병명
</th>

<th className="w-[360px] py-3 px-3 border-b border-gray-200 text-center">
  영문명
</th>

<th className="w-[120px] py-3 px-2 border-b border-gray-200 whitespace-nowrap text-center">
  법정감염병
</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-3 border-b border-gray-100 text-center font-bold text-blue-600 whitespace-nowrap">
                        {Object.values(item)[0] || "-"}
                      </td>

                      <td className="py-3 px-4 border-b border-gray-100 text-center">
                        {Object.values(item)[2] || "-"}
                      </td>

                      <td className="py-3 px-4 border-b border-gray-100 text-gray-500 text-center">
                        {Object.values(item)[3] || "-"}
                      </td>

                     

                      <td className="py-3 px-2 border-b border-gray-100 text-center whitespace-nowrap text-xs">
                        {Object.values(item)[6] || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-10">
                검색 결과가 없습니다
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed mt-4 px-1">
            상병코드는 건강보험심사평가원 에서 배포한 상병마스터(26.03) 기준으로 제공되며, 실제 보험금 청구 및 보험사 심사 결과와 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}