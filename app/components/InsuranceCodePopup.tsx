"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, X, Search, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── 보험사 기본 목록 ──────────────────────────────────────────
const DEFAULT_NONLIFE = [
  "AIG손해보험", "DB손해보험", "KB손해보험", "MG손해보험",
  "NH농협손해보험", "라이나손해보험", "롯데손해보험", "메리츠화재",
  "삼성화재", "하나손해보험", "한화손해보험", "현대해상", "흥국화재",
];

const DEFAULT_LIFE = [
  "ABL생명", "AIA생명", "DB생명", "IBK연금보험", "KB라이프생명",
   "KDB생명", "NH농협생명", "iM라이프생명",
  "교보생명", "동양생명", "라이나생명", "메트라이프생명", "미래에셋생명",
  "삼성생명", "신한라이프", "처브라이프", "카디프생명", "푸본현대생명",
  "하나생명", "한화생명", "흥국생명",
];

type Tab = "nonlife" | "life";
type CodeEntry = { code: string; password: string };
type CodeMap = Record<string, CodeEntry>;

const LS_CODES = "insurance_codes";
const LS_ORDER_NONLIFE = "insurance_code_order_nonlife";
const LS_ORDER_LIFE = "insurance_code_order_life";
const LS_FAV_NONLIFE = "insurance_code_fav_nonlife";
const LS_FAV_LIFE = "insurance_code_fav_life";

function applyOrder(defaults: string[], saved: string[]): string[] {
  const set = new Set(saved);
  const ordered = saved.filter((id) => defaults.includes(id));
  const missing = defaults.filter((id) => !set.has(id));
  return [...ordered, ...missing];
}

function sortByFav(list: string[], favs: string[]): string[] {
  return [
    ...list.filter((n) => favs.includes(n)),
    ...list.filter((n) => !favs.includes(n)),
  ];
}

// ─── SortableRow ─────────────────────────────────────────────
function SortableRow({
  name,
  editMode,
  rowEditMode,
  onStartRowEdit,
  isFav,
  code,
  password,
  onToggleFav,
  onChangeCode,
  onChangePassword,
}: {
name: string;
editMode: boolean;
rowEditMode: boolean;
onStartRowEdit: () => void;
isFav: boolean;
code: string;
  password: string;
  onToggleFav: () => void;
  onChangeCode: (v: string) => void;
  onChangePassword: (v: string) => void;
}) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } =
    useSortable({ id: name });


  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridTemplateColumns: "20px 1fr 1fr 1fr",
    cursor: "default",
  };

  return (
<div
  ref={setNodeRef}
  style={style}
  onDoubleClick={() => onStartRowEdit()}
  {...attributes}
  {...listeners}
      className="grid gap-3 items-center px-4 py-3 rounded-2xl border border-gray-100 bg-white
        hover:-translate-y-[1px] hover:shadow hover:border-gray-200
        transition-all duration-150 select-none"
    >
      {/* 별표 자리 — 항상 20px 고정 */}
      <div className="flex items-center justify-center w-5">
        {editMode ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="transition cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${isFav ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
            />
          </button>
        ) : isFav ? (
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ) : (
          <span className="w-4 h-4 block" />
        )}
      </div>

      {/* 보험사명 */}
      <span className="text-sm font-bold text-gray-800 truncate">{name}</span>

      {/* 코드 */}
      {editMode || rowEditMode ? (
        <input
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="코드"
          className="h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 w-full cursor-text"
        />
      ) : (
        <span className="text-sm text-gray-700 truncate">{code}</span>
      )}

      {/* 비번 */}
      {editMode || rowEditMode ? (
        <input
          value={password}
          onChange={(e) => onChangePassword(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="비밀번호"
          className="h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 w-full cursor-text"
        />
      ) : (
        <span className="text-sm text-gray-700 truncate">{password}</span>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function InsuranceCodePopup() {
  const { authUser, authStatus } = useAuth();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("nonlife");
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
const [rowEditMode, setRowEditMode] = useState(false);
  const [codes, setCodes] = useState<CodeMap>({});
  const [nonlifeOrder, setNonlifeOrder] = useState<string[]>(DEFAULT_NONLIFE);
  const [lifeOrder, setLifeOrder] = useState<string[]>(DEFAULT_LIFE);
  const [nonlifeFavs, setNonlifeFavs] = useState<string[]>([]);
  const [lifeFavs, setLifeFavs] = useState<string[]>([]);

  const [tempCodes, setTempCodes] = useState<CodeMap>({});
  const [tempNonlifeOrder, setTempNonlifeOrder] = useState<string[]>(DEFAULT_NONLIFE);
  const [tempLifeOrder, setTempLifeOrder] = useState<string[]>(DEFAULT_LIFE);
  const [tempNonlifeFavs, setTempNonlifeFavs] = useState<string[]>([]);
  const [tempLifeFavs, setTempLifeFavs] = useState<string[]>([]);

  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
  );

  // ── 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (authUser && authStatus === "approved") {
        const { data } = await supabase
          .from("profiles")
          .select("insurance_codes, insurance_order_nonlife, insurance_order_life, insurance_fav_nonlife, insurance_fav_life")
          .eq("id", authUser.id)
          .maybeSingle();

        if (data) {
          const c = (data.insurance_codes as CodeMap) || {};
          const no = data.insurance_order_nonlife ? applyOrder(DEFAULT_NONLIFE, data.insurance_order_nonlife as string[]) : DEFAULT_NONLIFE;
          const lo = data.insurance_order_life ? applyOrder(DEFAULT_LIFE, data.insurance_order_life as string[]) : DEFAULT_LIFE;
          const nf = (data.insurance_fav_nonlife as string[]) || [];
          const lf = (data.insurance_fav_life as string[]) || [];
          setCodes(c); setTempCodes(c);
          setNonlifeOrder(no); setTempNonlifeOrder(no);
          setLifeOrder(lo); setTempLifeOrder(lo);
          setNonlifeFavs(nf); setTempNonlifeFavs(nf);
          setLifeFavs(lf); setTempLifeFavs(lf);
          return;
        }
      }
      const c = localStorage.getItem(LS_CODES);
      const no = localStorage.getItem(LS_ORDER_NONLIFE);
      const lo = localStorage.getItem(LS_ORDER_LIFE);
      const nf = localStorage.getItem(LS_FAV_NONLIFE);
      const lf = localStorage.getItem(LS_FAV_LIFE);
      const parsedC = c ? JSON.parse(c) as CodeMap : {};
      const parsedNo = no ? applyOrder(DEFAULT_NONLIFE, JSON.parse(no)) : DEFAULT_NONLIFE;
      const parsedLo = lo ? applyOrder(DEFAULT_LIFE, JSON.parse(lo)) : DEFAULT_LIFE;
      const parsedNf = nf ? JSON.parse(nf) as string[] : [];
      const parsedLf = lf ? JSON.parse(lf) as string[] : [];
      setCodes(parsedC); setTempCodes(parsedC);
      setNonlifeOrder(parsedNo); setTempNonlifeOrder(parsedNo);
      setLifeOrder(parsedLo); setTempLifeOrder(parsedLo);
      setNonlifeFavs(parsedNf); setTempNonlifeFavs(parsedNf);
      setLifeFavs(parsedLf); setTempLifeFavs(parsedLf);
    };
    load();
  }, [authUser, authStatus]);

  // ── 팝업 헤더 드래그 ─────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPopupPos({
        x: dragRef.current.originX + e.clientX - dragRef.current.startX,
        y: dragRef.current.originY + e.clientY - dragRef.current.startY,
      });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);


  // ── 저장 ─────────────────────────────────────────────────
  const save = async () => {
    setCodes(tempCodes);
    setNonlifeOrder(tempNonlifeOrder);
    setLifeOrder(tempLifeOrder);
    setNonlifeFavs(tempNonlifeFavs);
    setLifeFavs(tempLifeFavs);

    if (authUser && authStatus === "approved") {
      await supabase.from("profiles").update({
        insurance_codes: tempCodes,
        insurance_order_nonlife: tempNonlifeOrder,
        insurance_order_life: tempLifeOrder,
        insurance_fav_nonlife: tempNonlifeFavs,
        insurance_fav_life: tempLifeFavs,
      }).eq("id", authUser.id);
    } else {
      localStorage.setItem(LS_CODES, JSON.stringify(tempCodes));
      localStorage.setItem(LS_ORDER_NONLIFE, JSON.stringify(tempNonlifeOrder));
      localStorage.setItem(LS_ORDER_LIFE, JSON.stringify(tempLifeOrder));
      localStorage.setItem(LS_FAV_NONLIFE, JSON.stringify(tempNonlifeFavs));
      localStorage.setItem(LS_FAV_LIFE, JSON.stringify(tempLifeFavs));
    }
    setEditMode(false);
  };

  const cancelEdit = () => {
    setTempCodes(codes);
    setTempNonlifeOrder(nonlifeOrder);
    setTempLifeOrder(lifeOrder);
    setTempNonlifeFavs(nonlifeFavs);
    setTempLifeFavs(lifeFavs);
    setEditMode(false);
  };

const handleOpen = () => {
  setPopupPos({ x: 0, y: 0 });
  setEditMode(false);
  setRowEditMode(false);
  setSearch("");
  setOpen(true);
};

    useEffect(() => {
  const handler = () => handleOpen();
  window.addEventListener("open-insurance-code", handler);
  return () => window.removeEventListener("open-insurance-code", handler);
}, []);

  // ── 현재 탭 데이터 ────────────────────────────────────────
  const currentOrder = editMode
    ? (tab === "nonlife" ? tempNonlifeOrder : tempLifeOrder)
    : (tab === "nonlife" ? nonlifeOrder : lifeOrder);
  const currentFavs = editMode
    ? (tab === "nonlife" ? tempNonlifeFavs : tempLifeFavs)
    : (tab === "nonlife" ? nonlifeFavs : lifeFavs);
  const tempFavs = tab === "nonlife" ? tempNonlifeFavs : tempLifeFavs;

  const displayList = sortByFav(currentOrder, currentFavs).filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // ── DnD 드래그 종료 ───────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const setter = tab === "nonlife" ? setTempNonlifeOrder : setTempLifeOrder;
    setter((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIdx, newIdx);
    });

    // 수정 모드가 아닐 때도 순서 즉시 저장
    if (!editMode) {
      const orderSetter = tab === "nonlife" ? setNonlifeOrder : setLifeOrder;
      orderSetter((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIdx, newIdx);
        if (authUser && authStatus === "approved") {
          const col = tab === "nonlife" ? "insurance_order_nonlife" : "insurance_order_life";
          supabase.from("profiles").update({ [col]: next }).eq("id", authUser.id);
        } else {
          const key = tab === "nonlife" ? LS_ORDER_NONLIFE : LS_ORDER_LIFE;
          localStorage.setItem(key, JSON.stringify(next));
        }
        return next;
      });
    }
  };

  const toggleFav = (name: string) => {
    if (tab === "nonlife") {
      setTempNonlifeFavs((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [name, ...prev]
      );
    } else {
      setTempLifeFavs((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [name, ...prev]
      );
    }
  };

  return (
    <>
      {/* ── 왼쪽 하단 자물쇠 버튼 ── */}
      <button
        onClick={handleOpen}
        className="
          fixed left-6 bottom-24 z-40
          w-14 h-14 rounded-full bg-gray-800 shadow-lg
          hover:shadow-2xl hover:-translate-y-0.5
          transition-all duration-200
          flex items-center justify-center
        "
        title="보험사 코드"
      >
        <Lock className="w-6 h-6 text-white" />
      </button>

      {/* ── 팝업 ── */}
      {open && (
        <div
          className="fixed inset-0 z-[1500] bg-black/40 flex items-center justify-center p-3 md:p-4"
          onClick={() => { if (!editMode) setOpen(false); }}
        >
          <div
            style={{ transform: `translate(${popupPos.x}px, ${popupPos.y}px)` }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div
              onMouseDown={(e) => {
                if (window.innerWidth < 768) return;
                dragRef.current = { startX: e.clientX, startY: e.clientY, originX: popupPos.x, originY: popupPos.y };
              }}
              className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between cursor-default select-none"
            >
              <div className="font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                보험사 코드
              </div>
              <div className="flex items-center gap-2">
                {editMode || rowEditMode ? (
                  <>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => {
  cancelEdit();
  setRowEditMode(false);
}}
                      className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition"
                    >
                      취소
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => {
  save();
  setRowEditMode(false);
}}
                      className="h-8 px-3 rounded-xl bg-white text-gray-800 hover:bg-gray-100 text-sm font-bold transition"
                    >
                      저장
                    </button>
                  </>
                ) : (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setEditMode(true)}
                    className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition"
                  >
                    수정
                  </button>
                )}
<button
  onMouseDown={(e) => e.stopPropagation()}
  onClick={() => {
    cancelEdit();
    setRowEditMode(false);
    setOpen(false);
  }}
  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
>
  <X className="w-5 h-5" />
</button>
              </div>
            </div>

            {/* 탭 + 검색 */}
            <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
              <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1">
                <button
                  onClick={() => { setTab("nonlife"); setSearch(""); }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    tab === "nonlife" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
                  }`}
                >
                  손해보험
                </button>
                <button
                  onClick={() => { setTab("life"); setSearch(""); }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    tab === "life" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
                  }`}
                >
                  생명보험
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="보험사 검색"
                  className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400"
                />
              </div>
            </div>

            {/* 컬럼 헤더 */}
            <div
              className="grid gap-3 px-5 pb-1"
              style={{ gridTemplateColumns: "20px 1fr 1fr 1fr" }}
            >
              <span />
              <span className="text-[13px] font-bold text-gray-400 pl-8">보험사</span>
              <span className="text-[13px] font-bold text-gray-400">코드</span>
              <span className="text-[13px] font-bold text-gray-400">비밀번호</span>
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={displayList} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-1.5">
                    {displayList.map((name) => {
                      const entry = (editMode || rowEditMode ? tempCodes : codes)[name] ?? {
  code: "",
  password: "",
};
                      const isFav = (editMode ? tempFavs : currentFavs).includes(name);
                      return (
<SortableRow
  key={name}
  name={name}
  editMode={editMode}
  rowEditMode={rowEditMode}
  onStartRowEdit={() => {
  setTempCodes(codes);
  setRowEditMode(true);
}}
  isFav={isFav}
                          code={entry.code}
                          password={entry.password}
                          onToggleFav={() => toggleFav(name)}
                          onChangeCode={(v) =>
                            setTempCodes((prev) => ({
                              ...prev,
                              [name]: { code: v, password: prev[name]?.password ?? "" },
                            }))
                          }
                          onChangePassword={(v) =>
                            setTempCodes((prev) => ({
                              ...prev,
                              [name]: { code: prev[name]?.code ?? "", password: v },
                            }))
                          }
                        />
                      );
                    })}

                    {displayList.length === 0 && (
                      <div className="py-16 text-center text-sm text-gray-400">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      )}
    </>
  );
}