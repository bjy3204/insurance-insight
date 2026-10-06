"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockPageScroll } from "@/app/features/home/components/dashboard/DashboardDialog";
import styles from "./CalendarEventModal.module.css";

export type CalendarEventForm = { title:string; content:string; date:string; time:string; place:string; memo:string; icon:string; color:string };
const EMOJI_LIST = [
  "📅", "🎉", "🎊", "🎈", "🎁", "🎯", "📝", "📌", "⭐", "🌟",
  "💼", "📊", "📈", "🔔", "📢", "💡", "🎓", "🏆", "🎂", "🎬",
  "🎵", "🎸", "🎹", "🎤", "📱", "💻", "⚙️", "❤️", "🛒", "🚗","🚨","⏰","ℹ️","✔️","☠️","🎁","📖","🗂️","✏️","✈️",
];

// The existing calendar page's editor, shared by all three calendar entry points.
export default function CalendarEventModal({ formData, setFormData, editingEvent, onClose, onSave, onDelete, saving=false, error="" }: {
  formData:CalendarEventForm; setFormData:(value:CalendarEventForm)=>void; editingEvent:boolean;
  onClose:()=>void; onSave:()=>void; onDelete?:()=>void; saving?:boolean; error?:string;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(formData.date.slice(0,4)) || new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => (Number(formData.date.slice(5,7)) || new Date().getMonth()+1)-1);
  const [modalPos, setModalPos] = useState({x:0,y:0});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x:0,y:0});
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => lockPageScroll(), []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLInputElement>('input')?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); close.current(); }
      if (e.key !== "Tab") return;
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)') || []);
      if (e.shiftKey && document.activeElement === elements[0]) { e.preventDefault(); elements.at(-1)?.focus(); }
      if (!e.shiftKey && document.activeElement === elements.at(-1)) { e.preventDefault(); elements[0]?.focus(); }
    };
    document.addEventListener('keydown',keyboard);
    return () => { document.removeEventListener('keydown',keyboard); previous?.focus(); };
  }, []);
  return createPortal(<div className={styles.editor} role="dialog" aria-modal="true" aria-label={editingEvent ? "일정 수정" : "일정 추가"}>
    <div
          onClick={() => onClose()}
          className="fixed inset-0 z-[3500] bg-black/40 flex items-center justify-center"
        >
                    <div ref={panel}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("input, textarea, button")) return;
              setIsDragging(true);
              setDragStart({ x: e.clientX - modalPos.x, y: e.clientY - modalPos.y });
            }}

            onMouseMove={(e) => {
              if (isDragging) {
                setModalPos({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            className="bg-white w-[90%] max-w-lg rounded-3xl shadow-xl flex flex-col"
            style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)` }}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-black text-gray-900">
                {editingEvent ? "일정 수정" : "일정 추가"}
              </h2>
              <button data-popup-close="true" disabled={saving}
                onClick={() => { onClose(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-2 pb-4 overflow-y-auto flex-1 min-w-0">
              <div className="space-y-3">
                {/* 제목 + 이모지 */}
                <div className="flex gap-2">
                  <div className="relative">
                    <button disabled={saving}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 border border-gray-200 rounded-2xl text-2xl hover:bg-gray-50 transition flex items-center justify-center focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none"
                    >
                      {formData.icon}
                    </button>

                    {showEmojiPicker && (
                      <>
                        <div
                          className="fixed inset-0 z-[99]"
                          onClick={() => setShowEmojiPicker(false)}
                        />
                        <div
                          className="absolute top-14 left-0 bg-white border border-gray-200 rounded-2xl p-2 z-[100] shadow-lg"
                          style={{ width: "280px" }}
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {Array.from(new Set(EMOJI_LIST)).map((emoji) => (
                              <button disabled={saving}
                                key={emoji}
                                onClick={() => {
                                  setFormData({ ...formData, icon: emoji });
                                  setShowEmojiPicker(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-xl transition"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <input disabled={saving}
                    type="text"
                    placeholder="제목"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="flex-1 h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  />
                </div>

                {/* 날짜 커스텀 피커 */}
                <div className="relative">
                  <button disabled={saving}
                    type="button"
                    onClick={() => {
                      if (formData.date) {
                        const [y, m] = formData.date.split("-").map(Number);
                        setPickerYear(y);
                        setPickerMonth(m - 1);
                      }
                      setShowDatePicker(!showDatePicker);

                    }}
                    className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition"
                  >
                    <span className="text-gray-400">📅</span>
                    <span className={formData.date ? "text-gray-800" : "text-gray-400"}>
                      {formData.date || "날짜 선택"}
                    </span>
                  </button>

                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-[99]" onClick={() => setShowDatePicker(false)} />
                      <div className="absolute top-14 left-0 bg-white border border-gray-200 rounded-2xl p-4 z-[100] shadow-lg" style={{ width: "320px" }}>
                        <div className="flex items-center justify-between mb-3">
                          <button type="button" onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else setPickerMonth(pickerMonth - 1); }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">‹</button>
                          <span className="text-sm font-bold text-gray-800">{pickerYear}년 {pickerMonth + 1}월</span>
                          <button type="button" onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else setPickerMonth(pickerMonth + 1); }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">›</button>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {["일","월","화","수","목","금","토"].map((d, i) => (
                            <div key={d} className={`text-center text-sm font-bold py-1 ${i===0?"text-red-400":i===6?"text-blue-400":"text-gray-400"}`}>{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7">
                          {(() => {
                            const firstDow = new Date(pickerYear, pickerMonth, 1).getDay();
                            const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                            const cells = [];
                            for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);
                            for (let d = 1; d <= daysInMonth; d++) {
                              const dateStr = `${pickerYear}-${String(pickerMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                              const isSelected = formData.date === dateStr;
                              const dow = new Date(pickerYear, pickerMonth, d).getDay();
                              cells.push(
                                <button key={d} type="button"
                                  onClick={() => { setFormData({ ...formData, date: dateStr }); setShowDatePicker(false); }}
                                  className={`h-9 w-full rounded-xl text-sm font-medium transition
                                    ${isSelected ? "bg-gray-800 text-white" : "hover:bg-gray-100"}
                                    ${!isSelected && dow===0 ? "text-red-400" : ""}
                                    ${!isSelected && dow===6 ? "text-blue-400" : ""}
                                    ${!isSelected && dow!==0 && dow!==6 ? "text-gray-700" : ""}
                                  `}
                                >{d}</button>
                              );
                            }
                            return cells;
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 시간 */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">⏰</span>
                  <input disabled={saving}
                    type="text"
                    placeholder="시간 (예: 오후 2시)"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full h-12 rounded-2xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                  />
                </div>

                <input disabled={saving}
                  type="text"
                  placeholder="장소"
                  value={formData.place}
                  onChange={(e) =>
                    setFormData({ ...formData, place: e.target.value })
                  }
                  className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />

                <textarea disabled={saving}
                  placeholder="메모"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  className="w-full h-20 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />

                {/* 색상 선택 */}
                <div className="flex gap-2 items-center mb-0">
                  <div className="flex gap-3">
                    {[
                      { value: "white", color: "bg-white", border: "border-gray-200" },
                      { value: "blue", color: "bg-blue-50", border: "border-blue-100" },
                      { value: "green", color: "bg-green-50", border: "border-green-100" },
                      { value: "yellow", color: "bg-yellow-50", border: "border-yellow-100" },
                      { value: "red", color: "bg-red-50", border: "border-red-100" },
                    ].map((option) => (
                      <button disabled={saving}
                        key={option.value}
                        onClick={() =>
                          setFormData({ ...formData, color: option.value })
                        }
                        className={`w-8 h-8 rounded-full transition cursor-pointer hover:scale-105 border border-gray-200 ${
                          formData.color === option.value
                            ? "ring-2 ring-gray-400 ring-offset-2"
                            : ""
                        } ${option.color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="px-6 text-sm text-red-500" role="alert">{error}</p>}
            <div className="flex gap-3 px-6 pb-6 pt-4">
              {editingEvent && (
                <button disabled={saving}
                  onClick={() => {
                    onDelete?.();
                  }}
                  className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                >
                  삭제
                </button>
              )}
              <button disabled={saving}
                onClick={() => {
                  onSave();
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer"
              >
                {editingEvent ? "완료" : "추가"}
              </button>
            </div>
          </div>
        </div>
  </div>, document.body);
}
