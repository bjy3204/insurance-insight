"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  X,
  Pencil,
  Highlighter,
  Eraser,
  Trash2,
   Lock,
} from "lucide-react";
import { salesData } from "../../data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { useRouter } from "next/navigation";
import { tooltipData } from "./tooltipData";

export default function SubCategoryPage({
  params,
}: {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}) {
  const { category: rawCategory, subcategory: rawSubcategory } = use(params);

  const category = decodeURIComponent(rawCategory);
  const subcategory = decodeURIComponent(rawSubcategory);

  const categoryData = salesData[category as keyof typeof salesData];

  const slides: string[] = categoryData
    ? categoryData[subcategory as keyof typeof categoryData] || []
    : [];

const showDriverTooltip =
  category === "운전자보험" &&
  subcategory === "운전자보험 설명서";

const [current, setCurrent] = useState(0);

const currentTooltips = showDriverTooltip
  ? tooltipData[current] || []
  : [];
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [drawMode, setDrawMode] = useState(false);

  const router = useRouter();
const { authUser, authStatus } = useAuth();

const [slideNote, setSlideNote] = useState("");
const [savedSlideNote, setSavedSlideNote] = useState("");
const [noteEditing, setNoteEditing] = useState(false);
const [noteSaving, setNoteSaving] = useState(false);

const canvasRef = useRef<HTMLCanvasElement>(null);
const isDrawing = useRef(false);
const lastPoint = useRef({ x: 0, y: 0 });

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
};

const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  isDrawing.current = true;
  lastPoint.current = getCanvasPoint(e);
};

const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
  if (!isDrawing.current) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

const point = getCanvasPoint(e);

const x = point.x;
const y = point.y;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "pen") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1;
  }

  if (tool === "highlighter") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 35;
    ctx.globalAlpha = 0.2;
    ctx.lineCap = "butt";
     ctx.lineJoin = "round";
  }

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 24;
    ctx.globalAlpha = 1;
  }

  ctx.beginPath();
  ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastPoint.current = { x, y };
};

const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
  if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  isDrawing.current = false;
};

const clearCanvas = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

useEffect(() => {
  const fetchSlideNote = async () => {
    if (!authUser) return;

    const { data } = await supabase
      .from("sales_book_notes")
      .select("note")
      .eq("user_id", authUser.id)
      .eq("category", category)
      .eq("subcategory", subcategory)
      .eq("slide_index", current)
      .maybeSingle();

    const note = data?.note || "";

    setSlideNote(note);
    setSavedSlideNote(note);
    setNoteEditing(false);
  };

  fetchSlideNote();
}, [authUser, category, subcategory, current]);

const saveSlideNote = async () => {
  if (!authUser) return;

  setNoteSaving(true);

  await supabase.from("sales_book_notes").upsert(
    {
      user_id: authUser.id,
      category,
      subcategory,
      slide_index: current,
      note: slideNote,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,category,subcategory,slide_index",
    }
  );

  setSavedSlideNote(slideNote);
  setNoteEditing(false);
  setNoteSaving(false);
};

  const openFullscreen = async () => {
    setShowFullscreen(true);

    setTimeout(() => {
      const target = document.getElementById("salesbook-fullscreen");

      if (target?.requestFullscreen) {
        target.requestFullscreen();
      }
    }, 50);
  };

  const closeFullscreen = async () => {
    setShowFullscreen(false);

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "Escape") setShowFullscreen(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [slides.length]);

  if (!authUser || authStatus !== "approved") {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-2">
          접근 제한
        </h2>

        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          세일즈북 기능은 승인된 회원만
          <br />
          이용 가능합니다.
        </p>

        <button
          onClick={() => router.push("/")}
          className="w-full h-11 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

  if (slides.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-black text-gray-900">자료 제작중입니다.</div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-100 overflow-x-hidden">
        <header className="bg-white border-b border-black shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="relative flex items-center justify-center">
              <Link
                href={`/sales-book/${encodeURIComponent(category)}`}
                className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-black" />
              </Link>

              <div className="text-center">
                <h1 className="text-2xl font-black text-gray-900">
                  {category}
                </h1>
                <p className="text-sm text-gray-500 mt-1">{subcategory}</p>
              </div>

              <button
                onClick={openFullscreen}
                className="hidden md:flex absolute right-0 h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold items-center gap-2 hover:bg-blue-700 transition cursor-pointer"
              >
                <Maximize className="w-4 h-4" />
                전체화면
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 pt-4 pb-10">
          {/* PC */}
<div
  className="hidden md:flex bg-white rounded-3xl border border-gray-200 overflow-hidden"
  style={{ height: "calc(100vh - 100px)" }}
>
<aside
  className="border-r border-gray-200 bg-gray-100 py-4 px-4"
  style={{
    width: 190,
    flex: "0 0 190px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  }}
>
    <div className="text-xs font-black text-gray-400 px-4 mb-3 shrink-0">
      슬라이드 목록
    </div>

    <div
      className="space-y-3 pr-1"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
      }}
    >
      {slides.map((slide: string, index: number) => (
        <button
          key={index}
          onClick={() => setCurrent(index)}
          className={`w-full rounded-2xl border-2 bg-white p-1.5 transition cursor-pointer ${
            current === index
              ? "border-blue-600 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <img
            src={slide}
            alt=""
            onContextMenu={(e) => e.preventDefault()}
            className="w-full aspect-video object-contain rounded-xl block"
            draggable={false}
          />

          <div className="text-xs font-black text-gray-500 mt-1">
            {index + 1}
          </div>
        </button>
      ))}
    </div>
  </aside>

 <section
  className="px-6 py-6"
  style={{
    flex: 1,
    minWidth: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  }}
>
    <div className="flex items-center justify-between mb-5 shrink-0">
      <div>
        <h2 className="text-sm font-black text-gray-700">
          {subcategory}
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          총 {slides.length}장
        </p>
      </div>

      <div className="text-xs font-black text-gray-400">
        {current + 1} / {slides.length}
      </div>
    </div>

       <div
      className="relative w-full overflow-hidden"
      style={{ flex: "0 0 auto" }}
    >
      <button
        onClick={prevSlide}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center hover:bg-white transition cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <img
        src={slides[current]}
        alt=""
        className="w-full h-auto rounded-2xl bg-white border-0 outline-none block"
        draggable={false}
      />
      <button
        onClick={nextSlide}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center hover:bg-white transition cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>


        <div className="mt-3 shrink-0">
      <div className="flex items-center justify-between mb-2">


      </div>

      <textarea
        value={slideNote}
        readOnly={!noteEditing}
        onChange={(e) => setSlideNote(e.target.value)}
        placeholder=""
        className="w-full h-20 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
      />
    </div>

     <div className="flex items-center gap-2">
          <button
            onClick={() => setNoteEditing(true)}
            className="h-8 px-3 rounded-xl bg-white border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-100 transition"
          >
            수정
          </button>

          <button
            onClick={saveSlideNote}
            disabled={noteSaving || slideNote === savedSlideNote}
            className="h-8 px-3 rounded-xl bg-blue-600 text-white text-xs font-black disabled:bg-gray-300 transition"
          >
            {noteSaving ? "저장중" : "저장"}
          </button>
        </div>
    
  </section>
</div>

          {/* 모바일 */}
          <div className="md:hidden space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-black text-gray-800">
                    슬라이드 목록
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    총 {slides.length}장
                  </p>
                </div>

                <div className="text-xs font-black text-gray-400">
                  {current + 1} / {slides.length}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {slides.map((slide: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`shrink-0 w-24 rounded-2xl border-2 bg-white p-1.5 ${
                      current === index
                        ? "border-blue-600"
                        : "border-gray-200"
                    }`}
                  >
<img
  src={slide}
  alt=""
  onContextMenu={(e) => e.preventDefault()}
  className="w-full aspect-video object-contain rounded-xl block"
  draggable={false}
/>

                    <div className="text-[11px] font-black text-gray-500 mt-1">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
              <div className="mb-3">
                <h2 className="text-sm font-black text-gray-800">
                  {subcategory}
                </h2>
              </div>

              <div className="bg-gray-50 rounded-3xl border border-gray-200 p-2 h-[190px] flex items-center justify-center overflow-hidden">
                <img
                  src={slides[current]}
                  alt=""
                  className="w-full h-full object-contain rounded-2xl bg-white shadow-lg"
                  draggable={false}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={prevSlide}
                  className="h-11 rounded-2xl bg-white border border-gray-200 text-sm font-black text-gray-700 shadow-sm flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </button>

                <button
                  onClick={nextSlide}
                  className="h-11 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-sm flex items-center justify-center gap-1"
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showFullscreen && (
<div
  id="salesbook-fullscreen"
  onClick={(e) => {
    if (drawMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const half = rect.width / 2;

    if (clickX < half) {
      prevSlide();
    } else {
      nextSlide();
    }
  }}
  className="fixed inset-0 z-[5000] bg-black flex items-center justify-center"
>

            <div className="hidden md:flex absolute top-5 left-5 z-30 gap-2">
  <button
  onClick={(e) => {
    e.stopPropagation();
    setDrawMode((prev) => !prev);
    setTool("pen");
  }}
className={`w-11 h-11 rounded-full text-white flex items-center justify-center transition ${
  drawMode && tool === "pen" ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"
}`}
  >
    <Pencil className="w-5 h-5" />
  </button>

<button
  onClick={(e) => {
    e.stopPropagation();
    setDrawMode(true);
    setTool("highlighter");
  }}
  className={`w-11 h-11 rounded-full text-white flex items-center justify-center transition ${
    drawMode && tool === "highlighter" ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"
  }`}
>
    <Highlighter className="w-5 h-5" />
  </button>

<button
  onClick={(e) => {
    e.stopPropagation();
    setDrawMode(true);
    setTool("eraser");
  }}
  className={`w-11 h-11 rounded-full text-white flex items-center justify-center transition ${
    drawMode && tool === "eraser" ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"
  }`}
>
    <Eraser className="w-5 h-5" />
  </button>

 <button
  onClick={(e) => {
    e.stopPropagation();
    clearCanvas();
  }}
    className="
  w-11 h-11
  rounded-full
  text-white
  flex
  items-center
  justify-center
  bg-transparent
  hover:bg-white/20
  transition
"
  >
    <Trash2 className="w-5 h-5" />
  </button>
</div>

          <button
            onClick={(e) => {
  e.stopPropagation();
  closeFullscreen();
}}
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

{drawMode && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      prevSlide();
    }}
    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
  >
    <ChevronLeft className="w-8 h-8" />
  </button>
)}

<div
  onClick={(e) => {
    if (drawMode) e.stopPropagation();
  }}
  className="relative max-w-screen max-h-screen overflow-visible"
>
  <img
    src={slides[current]}
    alt=""
    onContextMenu={(e) => e.preventDefault()}
    className="max-w-screen max-h-screen object-contain select-none"
    draggable={false}
  />

{currentTooltips.map((item, index) => (
  <div key={index} className="group absolute inset-0 z-[9999] pointer-events-none">
    {/* 마우스 올리는 영역 */}
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.w}%`,
        height: `${item.h}%`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {item.highlight !== false && (
  <div
    className={`
      absolute inset-0
      z-[50]
      ${item.shape === "pill" ? "rounded-full" : "rounded-md"}
      bg-white/10
      opacity-0
      group-hover:opacity-100
      transition
    `}
  />
)}
    </div>

    {/* 설명 이미지 / 설명 박스 위치는 별도 */}
   {item.type === "image" && item.image ? (
  <>
    <img
      src={item.image}
      alt=""
      className={`
        hidden
        group-hover:block
        absolute
        ${item.tooltipX || "left-[50%]"}
        ${item.tooltipY || "top-[50%]"}
        ${item.tooltipWidth || "!w-[250px]"}
        max-w-none
        ${item.borderless ? "" : "rounded-2xl shadow-xl bg-white border border-gray-200"}
        z-[9999]
      `}
      draggable={false}
    />

    {item.image2 && (
      <img
        src={item.image2}
        alt=""
        className={`
          hidden
          group-hover:block
          absolute
          ${item.tooltipX2 || "left-[50%]"}
          ${item.tooltipY2 || "top-[50%]"}
          ${item.tooltipWidth2 || "!w-[250px]"}
          max-w-none
          z-[20]
        `}
        draggable={false}
      />
    )}
  </>
) : (
      <div
        className={`
          hidden
          group-hover:block
          absolute
          ${item.tooltipX || "left-[50%]"}
          ${item.tooltipY || "top-[50%]"}
          w-[570px]
          rounded-4xl
          bg-white
          border
          border-gray-200
          shadow-xl
          px-5
          py-4
          text-center
          text-[18px]
          font-bold
          text-gray-800
          leading-snug
          z-[9999]
        `}
      >
        {item.text}
      </div>
    )}
  </div>
))}



  <canvas
    ref={canvasRef}
    width={1920}
    height={1080}
    onPointerDown={startDrawing}
    onPointerMove={draw}
    onPointerUp={stopDrawing}
    onPointerLeave={stopDrawing}
    className={`hidden md:block absolute inset-0 w-full h-full touch-none ${
  drawMode ? "pointer-events-auto" : "pointer-events-none"
}`}
  />
</div>

{drawMode && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      nextSlide();
    }}
    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
  >
    <ChevronRight className="w-8 h-8" />
  </button>
)}


        </div>
      )}
    </>
  );
}