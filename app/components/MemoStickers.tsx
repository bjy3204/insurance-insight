"use client";

import { useEffect, useState } from "react";
import { Pin } from "lucide-react";

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

export default function MemoStickers() {
  const [memos, setMemos] = useState<MemoItem[]>([]);

  useEffect(() => {
    const savedMemos = localStorage.getItem("personalMemos");

    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  const saveMemos = (nextMemos: MemoItem[]) => {
    setMemos(nextMemos);
    localStorage.setItem(
      "personalMemos",
      JSON.stringify(nextMemos)
    );
  };

  const toggleMemoVisible = (id: string) => {
    const nextMemos = memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            visible: !memo.visible,
            updatedAt: new Date().toISOString(),
          }
        : memo
    );

    saveMemos(nextMemos);
  };

  const moveMemoSticker = (
    id: string,
    x: number,
    y: number
  ) => {
    const maxY = window.innerHeight - 290;

    const nextMemos = memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            x,
            y: Math.min(y, maxY),
          }
        : memo
    );

    saveMemos(nextMemos);
  };

  const getMemoColorClass = (
    color?: MemoItem["color"]
  ) => {
    switch (color) {
      case "blue":
        return "bg-blue-50/80 border-blue-100";

      case "yellow":
        return "bg-yellow-50/80 border-yellow-100";

      case "red":
        return "bg-red-50/80 border-red-100";

      case "clear":
        return "bg-white/40 border-gray-200";

      case "white":
      default:
        return "bg-white border-gray-200";
    }
  };

  const sortedMemos = [...memos].sort((a, b) => {
    if (a.pinned !== b.pinned)
      return a.pinned ? -1 : 1;

    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });

  const visibleMemos = sortedMemos.filter(
    (memo) => memo.visible
  );

  return (
    <>
      {visibleMemos.map((memo, index) => (
        <div
          key={memo.id}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;

            if (target.closest("button")) return;

            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = memo.x ?? 24;
            const startTop =
              memo.y ?? 150 + index * 210;

            const handleMouseMove = (
              moveEvent: MouseEvent
            ) => {
              const nextX =
                startLeft +
                moveEvent.clientX -
                startX;

              const nextY =
                startTop +
                moveEvent.clientY -
                startY;

              moveMemoSticker(
                memo.id,
                nextX,
                nextY
              );
            };

            const handleMouseUp = () => {
              window.removeEventListener(
                "mousemove",
                handleMouseMove
              );

              window.removeEventListener(
                "mouseup",
                handleMouseUp
              );
            };

            window.addEventListener(
              "mousemove",
              handleMouseMove
            );

            window.addEventListener(
              "mouseup",
              handleMouseUp
            );
          }}
          style={{
            left: memo.x ?? 24,
            top: memo.y ?? 150 + index * 210,
          }}
          className={`
            fixed
            z-[70]
            hidden
            md:block
            w-[260px]
            min-h-[190px]
            rounded-3xl
            shadow
            p-5
            hover:shadow-xl
            hover:-translate-y-1
            transition
            cursor-default
            ${getMemoColorClass(memo.color)}
          `}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-black text-gray-900 break-keep line-clamp-1">
              {memo.title}
            </h3>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMemoVisible(memo.id);
              }}
              className="
                w-8
                h-8
                -mt-2
                rounded-full
                flex
                items-center
                justify-center
                text-gray-400
                hover:bg-gray-100
                hover:text-gray-600
                transition
                shrink-0
                cursor-default
              "
              title="메인에서 숨기기"
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-5 whitespace-pre-line break-keep">
            {memo.content}
          </p>
        </div>
      ))}
    </>
  );
}