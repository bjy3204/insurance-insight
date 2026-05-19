"use client";

import { useEffect, useRef, useState } from "react";
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

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const loadMemos = () => {
      const savedMemos = localStorage.getItem("personalMemos");

      if (savedMemos) {
        setMemos(JSON.parse(savedMemos));
      } else {
        setMemos([]);
      }
    };

    loadMemos();

    window.addEventListener("storage", loadMemos);
    window.addEventListener("memo-storage-updated", loadMemos);

    return () => {
      window.removeEventListener("storage", loadMemos);
      window.removeEventListener("memo-storage-updated", loadMemos);
    };
  }, []);

  const saveMemos = (nextMemos: MemoItem[]) => {
    setMemos(nextMemos);
    localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
    window.dispatchEvent(new Event("memo-storage-updated"));
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

  const moveMemoSticker = (id: string, x: number, y: number) => {
    const nextMemos = memos.map((memo) =>
      memo.id === id
        ? {
            ...memo,
            x,
            y,
          }
        : memo
    );

    saveMemos(nextMemos);
  };

  const getMemoColorClass = (color?: MemoItem["color"]) => {
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
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });

  const visibleMemos = sortedMemos.filter((memo) => memo.visible);

  return (
    <>
      {visibleMemos.map((memo, index) => (
        <div
          key={memo.id}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement;

            if (target.closest("button, input, textarea, select, a")) return;

            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;

            const originX = memo.x ?? 24;
            const originY = memo.y ?? 150 + index * 210;

            dragRef.current = {
              id: memo.id,
              startX,
              startY,
              originX,
              originY,
              moved: false,
            };

            const handleMove = (event: PointerEvent) => {
              if (!dragRef.current) return;

              const drag = dragRef.current;

              const nextX = drag.originX + event.clientX - drag.startX;
              const nextY = drag.originY + event.clientY - drag.startY;

              if (
                Math.abs(event.clientX - drag.startX) > 3 ||
                Math.abs(event.clientY - drag.startY) > 3
              ) {
                dragRef.current.moved = true;
              }

              moveMemoSticker(drag.id, nextX, nextY);
            };

            const handleUp = () => {
              dragRef.current = null;

              window.removeEventListener("pointermove", handleMove);
              window.removeEventListener("pointerup", handleUp);
            };

            window.addEventListener("pointermove", handleMove);
            window.addEventListener("pointerup", handleUp);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            window.dispatchEvent(
              new CustomEvent("open-memo-detail", {
                detail: memo.id,
              })
            );
          }}
          style={{
            left: memo.x ?? 24,
            top: memo.y ?? 150 + index * 210,
          }}
          className={`
            fixed
            z-[60]
            hidden
            md:block
            w-[260px]
            min-h-[190px]
            rounded-3xl
            shadow
            p-5
            hover:shadow-xl
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