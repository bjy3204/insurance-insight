"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  NotebookPen,
  Plus,
  Pin,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/app/components/AuthProvider";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function SortableMemoCard({
  memo,
  children,
}: {
  memo: MemoItem;
  children: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: memo.id,
    disabled: memo.pinned,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}

export default function MemoManager({ open, onClose }: Props) {
  const { memos, saveMemos } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [memoSearch, setMemoSearch] = useState("");
  const [memoPage, setMemoPage] = useState(1);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [memoColor, setMemoColor] =
    useState<MemoItem["color"]>("white");
  const [memoAddOpen, setMemoAddOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
  const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);

  const [memoAddPopupPos, setMemoAddPopupPos] = useState({ x: 0, y: 0 });
  const [memoEditPopupPos, setMemoEditPopupPos] = useState({ x: 0, y: 0 });

  const memoAddDragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const memoEditDragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const moveMemoPopup = (
    e: any,
    type: "memoAdd" | "memoEdit"
  ) => {
    const drag =
      type === "memoAdd" ? memoAddDragRef.current : memoEditDragRef.current;

    if (!drag.isDragging) return;

    const nextPos = {
      x: drag.originX + e.clientX - drag.startX,
      y: drag.originY + e.clientY - drag.startY,
    };

    if (type === "memoAdd") {
      setMemoAddPopupPos(nextPos);
    } else {
      setMemoEditPopupPos(nextPos);
    }
  };

  const stopMemoPopupMove = () => {
    memoAddDragRef.current.isDragging = false;
    memoEditDragRef.current.isDragging = false;
  };

  const openMemoEdit = (memo: MemoItem) => {
    setSelectedMemo(null);

    memoEditDragRef.current = {
      isDragging: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    };

    setMemoEditPopupPos({ x: 0, y: 0 });

    requestAnimationFrame(() => {
      setSelectedMemo(memo);
    });
  };

  useEffect(() => {
    const openMemoDetail = (event: any) => {
      const memoId = event.detail;
      const targetMemo = memos.find((memo) => memo.id === memoId);
      if (!targetMemo) return;
      openMemoEdit(targetMemo);
    };

    window.addEventListener("open-memo-detail", openMemoDetail);

    return () => {
      window.removeEventListener("open-memo-detail", openMemoDetail);
    };
  }, [memos]);

  useEffect(() => {
    const openMemoContextMenu = (event: any) => {
      setContextMenu(event.detail);
    };

    window.addEventListener("open-memo-context-menu", openMemoContextMenu);

    return () => {
      window.removeEventListener("open-memo-context-menu", openMemoContextMenu);
    };
  }, []);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener("pointerdown", closeContextMenu);
    return () => window.removeEventListener("pointerdown", closeContextMenu);
  }, []);

  const addMemo = () => {
    const now = new Date().toISOString();

    const newMemo: MemoItem = {
      id: crypto.randomUUID(),
      title: memoTitle.trim(),
      content: memoContent.trim(),
      pinned: false,
      visible: false,
      color: memoColor,
      createdAt: now,
      updatedAt: now,
    };

    saveMemos([newMemo, ...memos]);
    setMemoPage(1);
    setMemoTitle("");
    setMemoContent("");
    setMemoColor("white");
    setMemoAddOpen(false);
  };

  const changeMemoColor = (id: string, color: MemoItem["color"]) => {
    const nextMemos = memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            color,
            updatedAt: new Date().toISOString(),
          }
        : memo
    );

    saveMemos(nextMemos);
  };

  const deleteMemo = (id: string) => {
    setDeleteMemoId(id);
    setDeleteMemoConfirmOpen(true);
  };

  const confirmDeleteMemo = () => {
    if (!deleteMemoId) return;

    const nextMemos = memos.filter((memo) => memo.id !== deleteMemoId);

    saveMemos(nextMemos);
    setSelectedMemo(null);
    setDeleteMemoId(null);
    setDeleteMemoConfirmOpen(false);
  };

  const toggleMemoVisible = (id: string) => {
    saveMemos(
      memos.map((memo) =>
        memo.id === id ? { ...memo, visible: !memo.visible } : memo
      )
    );
  };

  const toggleMemoPinned = (id: string) => {
    saveMemos(
      memos.map((memo) =>
        memo.id === id
          ? {
              ...memo,
              pinned: !memo.pinned,
              updatedAt: new Date().toISOString(),
            }
          : memo
      )
    );
  };

  const handleMemoDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeMemo = memos.find((memo) => memo.id === active.id);
    const overMemo = memos.find((memo) => memo.id === over.id);

    if (!activeMemo || !overMemo) return;
    if (activeMemo.pinned || overMemo.pinned) return;

    const pinnedMemos = memos.filter((memo) => memo.pinned);
    const normalMemos = memos.filter((memo) => !memo.pinned);

    const oldIndex = normalMemos.findIndex((memo) => memo.id === active.id);
    const newIndex = normalMemos.findIndex((memo) => memo.id === over.id);

    const reorderedNormalMemos = arrayMove(normalMemos, oldIndex, newIndex);

    saveMemos([...pinnedMemos, ...reorderedNormalMemos]);
  };

  const memoColorOptions: {
    value: MemoItem["color"];
    className: string;
  }[] = [
    {
      value: "white",
      className: "bg-white border-gray-300 hover:bg-gray-50",
    },
    {
      value: "blue",
      className: "bg-blue-50 border-blue-100 hover:bg-blue-100",
    },
    {
      value: "yellow",
      className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
    },
    {
      value: "red",
      className: "bg-red-50 border-red-100 hover:bg-red-100",
    },
    {
      value: "clear",
      className:
        "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
    },
  ];

  const filteredMemos = memos
    .filter((memo) =>
      `${memo.title} ${memo.content}`
        .toLowerCase()
        .includes(memoSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      return (
        memos.findIndex((memo) => memo.id === a.id) -
        memos.findIndex((memo) => memo.id === b.id)
      );
    });

  const MEMOS_PER_PAGE = 6;

  const totalMemoPages = Math.max(
    1,
    Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
  );

  const pagedMemos = filteredMemos.slice(
    (memoPage - 1) * MEMOS_PER_PAGE,
    memoPage * MEMOS_PER_PAGE
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
            <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
              <div className="font-bold flex items-center gap-2">
                <NotebookPen className="w-5 h-5" />
                메모장
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  value={memoSearch}
                  onChange={(e) => setMemoSearch(e.target.value)}
                  placeholder="메모 검색"
                  className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <button
                onClick={() => {
                  setMemoAddPopupPos({ x: 0, y: 0 });
                  stopMemoPopupMove();
                  setMemoAddOpen(true);
                }}
                className="h-12 px-5 rounded-2xl bg-gray-800 text-white text-sm font-bold flex items-center gap-2 cursor-default"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredMemos.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 py-20">
                  저장된 메모가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleMemoDragEnd}
                  >
                    <SortableContext
                      items={pagedMemos
                        .filter((memo) => !memo.pinned)
                        .map((memo) => memo.id)}
                      strategy={rectSortingStrategy}
                    >
                      {pagedMemos.map((memo) => (
                        <SortableMemoCard key={memo.id} memo={memo}>
                          <div
                            onDoubleClick={() => openMemoEdit(memo)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                id: memo.id,
                              });
                            }}
                            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition cursor-default"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1 flex flex-col min-h-[130px]">
                                <h3 className="text-sm font-black text-gray-900 break-keep">
                                  {memo.title || ""}
                                </h3>

                                <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">
                                  {memo.content}
                                </p>

                                <p className="text-[11px] text-gray-400 mt-auto pt-3">
                                  수정일{" "}
                                  {new Date(memo.updatedAt).toLocaleDateString(
                                    "ko-KR"
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMemoVisible(memo.id);
                                  }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${
                                    memo.visible
                                      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  }`}
                                >
                                  {memo.visible ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMemoPinned(memo.id);
                                  }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${
                                    memo.pinned
                                      ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
                                      : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                  }`}
                                >
                                  <Pin className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMemoEdit(memo);
                                  }}
                                  className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-default"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </SortableMemoCard>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
                <button
                  onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
                  disabled={memoPage === 1}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  이전
                </button>

                {Array.from({ length: Math.min(totalMemoPages, 10) }).map(
                  (_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        key={page}
                        onClick={() => setMemoPage(page)}
                        className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                          memoPage === page
                            ? "bg-slate-800 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() =>
                    setMemoPage((p) => Math.min(totalMemoPages, p + 1))
                  }
                  disabled={memoPage === totalMemoPages}
                  className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {memoAddOpen && (
        <div
          onMouseMove={(e) => moveMemoPopup(e, "memoAdd")}
          onMouseUp={stopMemoPopupMove}
          onMouseLeave={stopMemoPopupMove}
          onClick={() => setMemoAddOpen(false)}
          className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
        >
          <div
            style={{
              transform: `translate(${memoAddPopupPos.x}px, ${memoAddPopupPos.y}px)`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">메모 추가</h2>

              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setMemoColor(color.value)}
                    className={`
                      w-7 h-7 rounded-full border transition hover:scale-105
                      ${
                        memoColor === color.value
                          ? "ring-2 ring-gray-400 ring-offset-2"
                          : ""
                      }
                      ${color.className}
                    `}
                  />
                ))}

                <button
                  onClick={() => setMemoAddOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="메모 제목"
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none mb-3"
            />

            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
            />

            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMemoAddOpen(false)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
              >
                취소
              </button>

              <button
                onClick={() => {
                  addMemo();
                  setMemoAddOpen(false);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMemo && (
        <div
          onMouseMove={(e) => moveMemoPopup(e, "memoEdit")}
          onMouseUp={stopMemoPopupMove}
          onMouseLeave={stopMemoPopupMove}
          className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
        >
          <div
            style={{
              transform: `translate(${memoEditPopupPos.x}px, ${memoEditPopupPos.y}px)`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">메모 수정</h2>

              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      changeMemoColor(selectedMemo.id, color.value);

                      setSelectedMemo({
                        ...selectedMemo,
                        color: color.value,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className={`
                      w-7 h-7 rounded-full border transition hover:scale-105
                      ${
                        selectedMemo.color === color.value
                          ? "ring-2 ring-gray-400 ring-offset-2"
                          : ""
                      }
                      ${color.className}
                    `}
                  />
                ))}

                <button
                  onClick={() => {
                    setSelectedMemo(null);
                    setMemoEditPopupPos({ x: 0, y: 0 });
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input
              value={selectedMemo.title}
              onChange={(e) =>
                setSelectedMemo({
                  ...selectedMemo,
                  title: e.target.value,
                })
              }
              placeholder="메모 제목"
              className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3"
            />

            <textarea
              value={selectedMemo.content}
              onChange={(e) =>
                setSelectedMemo({
                  ...selectedMemo,
                  content: e.target.value,
                })
              }
              placeholder="메모 내용을 입력하세요"
              className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5"
            />

            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => deleteMemo(selectedMemo.id)}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default"
              >
                삭제
              </button>

              <button
                onClick={() => {
                  const nextMemos = memos.map((memo) =>
                    memo.id === selectedMemo.id
                      ? {
                          ...selectedMemo,
                          updatedAt: new Date().toISOString(),
                        }
                      : memo
                  );

                  saveMemos(nextMemos);
                  setSelectedMemo(null);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const target = memos.find((m) => m.id === contextMenu.id);
              if (target) openMemoEdit(target);
              setContextMenu(null);
            }}
            className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default text-left"
          >
            수정
          </button>

          <button
            onClick={() => {
              deleteMemo(contextMenu.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-default text-left border-t border-gray-100"
          >
            삭제
          </button>
        </div>
      )}

      {deleteMemoConfirmOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">메모 삭제</h2>

            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              선택한 메모를 삭제하시겠습니까?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteMemoId(null);
                  setDeleteMemoConfirmOpen(false);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
              >
                취소
              </button>

              <button
                onClick={confirmDeleteMemo}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}