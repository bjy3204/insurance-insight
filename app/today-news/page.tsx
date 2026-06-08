"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import {
  ArrowLeft,
  Newspaper,
  MessageCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

import { useAuth } from "@/app/components/AuthProvider";
import { X } from "lucide-react";


import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type NewsItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

type ExchangeItem = {
  label: string;
  value: number;
  change: number;
  direction: "up" | "down" | "same";
};

type MarketItem = {
  label: string;
  value: number;
  change: number;
  direction: "up" | "down" | "same";
};

type WeatherItem = {
  region: string;
  temp: number;
  description: string;
  icon: string;
};

type InstagramItem = {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  media_type?: string;
};

type TickerNewsItem = {
  title: string;
  link: string;
  originallink: string;
};

const WEATHER_REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "제주",
];

const quickKeywords = [
   "전체",
  "보험",
  "금융",
  "경제",
  "금감원",
  "실손보험",
  "손해보험",
  "생명보험",
];

const cleanText = (text: string) => {
  return text
    .replaceAll("<b>", "")
    .replaceAll("</b>", "")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
};

const formatDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatExchangeDate = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};


const formatExchange = (label: string, value: number) => {
  if (label === "JPY") {
    return value.toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const EXCHANGE_LINKS: Record<string, string> = {
  USD: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW",
  JPY: "https://m.stock.naver.com/marketindex/exchange/FX_JPYKRW",
  EUR: "https://m.stock.naver.com/marketindex/exchange/FX_EURKRW",
  CNY: "https://m.stock.naver.com/marketindex/exchange/FX_CNYKRW",
};

const MARKET_LINKS: Record<string, string> = {
  코스피: "https://m.stock.naver.com/domestic/index/KOSPI/total",
  코스닥: "https://m.stock.naver.com/domestic/index/KOSDAQ/total",
  "국내 금 (원/g)": "https://m.stock.naver.com/marketindex/metals/M04020000",
  "은 (USD/OZS)": "https://m.stock.naver.com/marketindex/metals/SIcv1",
};

const isGold = (label: string) => label === "국내 금 (원/g)";

const formatMarketValue = (item: MarketItem) => {
  return item.value.toLocaleString("ko-KR", {
    minimumFractionDigits: isGold(item.label) ? 0 : 2,
    maximumFractionDigits: isGold(item.label) ? 0 : 2,
  });
};

const formatMarketChange = (item: MarketItem) => {
  return Math.abs(item.change).toLocaleString("ko-KR", {
    minimumFractionDigits: isGold(item.label) ? 0 : 2,
    maximumFractionDigits: isGold(item.label) ? 0 : 2,
  });
};

const getTitleClamp = (title: string) => {
  return cleanText(title).length <= 28 ? "line-clamp-1" : "line-clamp-2";
};

const getDescriptionClamp = (title: string) => {
  return cleanText(title).length <= 28 ? "line-clamp-3" : "line-clamp-2";
};

const getWeatherIcon = (description: string) => {
  if (description.includes("맑")) return "☀️";
  if (description.includes("구름")) return "☁️";
  if (description.includes("비")) return "🌧️";
  if (description.includes("눈")) return "❄️";
  return "☀️";
};

const getWeatherAnimation = (description: string) => {
  if (description.includes("맑")) return "animate-[weatherSun_14s_linear_infinite]";
  if (description.includes("구름")) return "animate-[weatherCloud_6s_ease-in-out_infinite]";
  if (description.includes("비")) return "animate-[weatherRain_3s_ease-in-out_infinite]";
  if (description.includes("눈")) return "animate-[weatherSnow_8s_linear_infinite]";
  return "animate-[weatherSun_14s_linear_infinite]";
};

function SortableWeatherCard({ item }: { item: WeatherItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.region });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
        flex
        items-center
        justify-center
        gap-1.5
        text-[15px]
        font-bold
        text-gray-700
        min-w-0
        bg-gray-50
        border
        border-gray-200
        rounded-xl
        py-2.5
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
       select-none
      "
    >
      <span className="text-gray-500">{item.region}</span>

      <span
        className={`inline-block text-[18px] leading-none ${getWeatherAnimation(
          item.description || ""
        )}`}
      >
        {getWeatherIcon(item.description || "")}
      </span>

      <span className="font-black text-gray-900">{item.temp}°</span>
    </div>
  );
}

export default function NaverNewsPage() {
  const { memos, saveMemos } = useAuth();
const [selectedMemo, setSelectedMemo] = useState<{
  id: string; title: string; content: string;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
} | null>(null);
const [memoEditPos, setMemoEditPos] = useState({ x: 0, y: 0 });
const memoEditDragRef = useRef({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);

const memoColorOptions: { value: "white" | "blue" | "yellow" | "red" | "clear"; className: string }[] = [
  { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
  { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
  { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
  { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
  { value: "clear", className: "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95" },
];

const changeMemoColor = (id: string, color: "white" | "blue" | "yellow" | "red" | "clear") => {
  saveMemos(memos.map(m => m.id === id ? { ...m, color, updatedAt: new Date().toISOString() } : m));
};

const deleteMemo = (id: string) => { setDeleteMemoId(id); setDeleteMemoConfirmOpen(true); };

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;
  saveMemos(memos.filter(m => m.id !== deleteMemoId));
  setSelectedMemo(null); setDeleteMemoId(null); setDeleteMemoConfirmOpen(false);
};

const [query, setQuery] = useState("전체");
const [searchInput, setSearchInput] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeDate, setExchangeDate] = useState("");
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
const [marketLoading, setMarketLoading] = useState(false);

 const [weatherItems, setWeatherItems] = useState<WeatherItem[]>([]);
const [weatherOrder, setWeatherOrder] = useState<string[]>(WEATHER_REGIONS);
const [weatherLoading, setWeatherLoading] = useState(false);
const [instagramItem, setInstagramItem] = useState<InstagramItem | null>(null);

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  })
);
const [breakingNews, setBreakingNews] = useState<TickerNewsItem[]>([]);
const [headlineNews, setHeadlineNews] = useState<TickerNewsItem[]>([]);

  const mainNews = useMemo(() => {
  if (query === "전체" && breakingNews.length > 0) {
    return [
      {
        title: breakingNews[0].title,
        link: breakingNews[0].link,
        originallink: breakingNews[0].originallink,
       description:
  news[0]?.description ||
  "실시간 주요 뉴스입니다.",
        pubDate: new Date().toString(),
      },
    ];
  }

  return news.slice(0, 1);
}, [news, breakingNews, query]);
const listNews = useMemo(() => news.slice(2, 6), [news]);

const sortedWeatherItems = useMemo(() => {
  return [...weatherItems].sort(
    (a, b) => weatherOrder.indexOf(a.region) - weatherOrder.indexOf(b.region)
  );
}, [weatherItems, weatherOrder]);

  const fetchNews = async (keyword = query) => {
    try {
      setLoading(true);

      const searchKeyword =
  keyword === "전체"
    ? "보험 금융 경제 금감원 실손보험 손해보험 생명보험"
    : keyword;

      const res = await fetch(
        `/api/naver-news?query=${encodeURIComponent(searchKeyword)}&display=10`,
        { cache: "no-store" }
      );

      const data = await res.json();

      setNews(data.items || []);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchange = async () => {
    try {
      setExchangeLoading(true);

const res = await fetch("/api/naver-exchange", {
  cache: "no-store",
});

      const data = await res.json();

      setExchangeDate(data.date || "");
      setExchangeItems(data.items || []);
    } catch {
      setExchangeItems([]);
    } finally {
      setExchangeLoading(false);
    }
  };

  const fetchMarket = async () => {
  try {
    setMarketLoading(true);

    const res = await fetch("/api/market", {
      cache: "no-store",
    });

    const data = await res.json();

    setMarketItems(data.items || []);
  } catch {
    setMarketItems([]);
  } finally {
    setMarketLoading(false);
  }
};

  const fetchWeatherItems = async () => {
  try {
    setWeatherLoading(true);

    const results = await Promise.all(
      WEATHER_REGIONS.map(async (region) => {
        const res = await fetch(`/api/weather?region=${region}`, {
          cache: "no-store",
        });

        return res.json();
      })
    );

    setWeatherItems(results.filter((item) => !item.error));
  } catch {
    setWeatherItems([]);
  } finally {
    setWeatherLoading(false);
  }
};

const fetchInstagram = async () => {
  try {
    const res = await fetch("/api/instagram", {
      cache: "no-store",
    });

    const data = await res.json();

    setInstagramItem(data.data?.[0] || null);
  } catch {
    setInstagramItem(null);
  }
};

const fetchTickerNews = async () => {
  try {
    const breakingRes = await fetch(
      `/api/naver-news?query=${encodeURIComponent("속보")}&display=5`,
      { cache: "no-store" }
    );

    const breakingData = await breakingRes.json();

    const headlineRes = await fetch(
      `/api/naver-news?query=${encodeURIComponent("실시간 주요뉴스")}&display=5`,
      { cache: "no-store" }
    );

    const headlineData = await headlineRes.json();

    setBreakingNews(breakingData.items || []);
    setHeadlineNews(headlineData.items || []);
  } catch {
    setBreakingNews([]);
    setHeadlineNews([]);
  }
};

useEffect(() => {
  const handleMemoDetail = (e: Event) => {
    const id = (e as CustomEvent).detail;
    const target = memos.find(m => m.id === id);
    if (!target) return;
    setMemoEditPos({ x: 0, y: 0 });
    memoEditDragRef.current = { isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
    requestAnimationFrame(() => setSelectedMemo(target));
  };
  const handleMemoContext = (e: Event) => {
    const { x, y, id } = (e as CustomEvent).detail;
    setContextMenu({ x, y, id });
  };
  window.addEventListener("open-memo-detail", handleMemoDetail);
  window.addEventListener("open-memo-context-menu", handleMemoContext);
  return () => {
    window.removeEventListener("open-memo-detail", handleMemoDetail);
    window.removeEventListener("open-memo-context-menu", handleMemoContext);
  };
}, [memos]);

useEffect(() => {
  const close = () => setContextMenu(null);
  window.addEventListener("pointerdown", close);
  return () => window.removeEventListener("pointerdown", close);
}, []);


useEffect(() => {
  fetchNews("전체");
  fetchExchange();
  fetchMarket();
  fetchWeatherItems();
  fetchInstagram();
  fetchTickerNews();
}, []);

  const submitSearch = () => {
    const keyword = searchInput.trim() || "보험";

    setQuery(keyword);
    setSearchInput(keyword);
    fetchNews(keyword);
  };

  const selectKeyword = (keyword: string) => {
    setQuery(keyword);
    setSearchInput(keyword);
    fetchNews(keyword);
  };
  const handleWeatherDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setWeatherOrder((items) => {
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));

    return arrayMove(items, oldIndex, newIndex);
  });
};

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="
                absolute
                left-0
                w-11
                h-11
                rounded-2xl
                border
                border-gray-300
                bg-white
                flex
                items-center
                justify-center
              "
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Newspaper className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  오늘의 뉴스
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                보험 · 금융 · 경제 · 모닝뉴스 
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-[#1f2937] overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 md:px-6 h-11 flex items-center overflow-hidden">
    <div
  className="flex w-max whitespace-nowrap animate-[tickerMove_50s_linear_infinite] hover:[animation-play-state:paused]"
  style={{ paddingLeft: "10%" }}
>
      {breakingNews.length > 0 && (
        <>
          <span className="text-sm font-black text-red-500 mr-3">
            [속보]
          </span>

          {breakingNews.map((item, index) => (
            <a
              key={`breaking-${index}`}
              href={item.link || item.originallink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-normal text-white mr-8 hover:underline"
            >
              {cleanText(item.title)}
            </a>
          ))}
        </>
      )}

      <span className="text-sm font-black text-blue-300 mr-3">
        [주요뉴스]
      </span>

      {headlineNews.map((item, index) => (
        <a
          key={`headline-${index}`}
          href={item.link || item.originallink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-white mr-8 hover:underline"
        >
          {cleanText(item.title)}
        </a>
      ))}
    </div>
  </div>
</section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">


      {/* 지역별 날씨 */}
<section className="mb-4 -mt-2">
  <div className="px-0 py-0 overflow-hidden">
    {weatherItems.length === 0 ? (
      <div className="text-sm text-gray-400 text-center py-1">
        날씨 정보를 불러오지 못했습니다.
      </div>
    ) : (
      <>
       {/* 모바일 전용 날씨 티커 */}
<div className="md:hidden bg-white border border-gray-200 rounded-2xl overflow-hidden h-11 flex items-center">
  <div className="flex w-max min-w-max whitespace-nowrap animate-[weatherTickerMove_28s_linear_infinite] active:[animation-play-state:paused]">
    {[...sortedWeatherItems, ...sortedWeatherItems].map((item, index) => (
      <div
        key={`${item.region}-${index}`}
        className="inline-flex shrink-0 items-center gap-1.5 px-5 text-sm font-bold text-gray-700"
      >
        <span className="text-gray-500">{item.region}</span>

        <span
          className={`inline-block text-[16px] leading-none ${getWeatherAnimation(
            item.description || ""
          )}`}
        >
          {getWeatherIcon(item.description || "")}
        </span>

        <span className="font-black text-gray-900">{item.temp}°</span>
      </div>
    ))}
  </div>
</div>

        {/* PC 전용 기존 날씨 카드 */}
        <div className="hidden md:block">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleWeatherDragEnd}
          >
            <SortableContext items={weatherOrder} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
                {sortedWeatherItems.map((item) => (
                  <SortableWeatherCard key={item.region} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </>
    )}
  </div>
</section>
      

        {/* 뉴스 검색 영역 */}
        <section className="mb-3">
         <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3">
  <Search className="w-5 h-5 text-gray-400" />

  <input
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") submitSearch();
    }}
    placeholder="뉴스 검색"
    className="w-full outline-none text-sm bg-transparent"
  />
</div>

          <div className="flex gap-2 overflow-x-auto pt-3 pb-0">
            {quickKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => selectKeyword(keyword)}
                className={`
                  shrink-0
                  h-9
                  px-4
                  rounded-2xl
                  border
                  text-sm
                  font-bold
                  transition
                  cursor-default
                  ${
                    query === keyword
                      ? "bg-white border-gray-200 text-gray-900 shadow-sm"
                      : "bg-transparent border-transparent text-gray-500 hover:bg-white"
                  }
                `}
              >
                {keyword}
              </button>
            ))}
          </div>
        </section>

        {/* 인스타그램 피드 + 뉴스 본문 */}
<section className="grid grid-cols-1 lg:grid-cols-[580px_minmax(0,1fr)] gap-5 items-start">
  {/* 왼쪽: 인스타그램 */}
  <div>
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-lg font-black text-gray-900 pl-3">
        모닝뉴스
      </h2>
    </div>

    {instagramItem && (
      <a
        href={instagramItem.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="
          block
          bg-white
          border
          border-gray-200
          rounded-3xl
          overflow-hidden
          shadow-sm
          hover:shadow-xl
          hover:-translate-y-0.5
          transition-all
          duration-200
          cursor-default
        "
      >
        <div className="bg-gray-100 overflow-hidden">
          <img
            src={instagramItem.media_url}
            alt="최근 인스타그램 게시물"
            className="w-full h-full object-cover"
          />
        </div>
      </a>
    )}
  </div>

  {/* 오른쪽: 최신뉴스 */}
<div>
  <div className="flex items-end justify-between mb-2">
      <h2 className="text-lg font-black text-gray-900 pl-3 relative -top-[3px]">
      최신 뉴스
    </h2>

    <button
      onClick={() => fetchNews(query)}
      className="
                h-9
                px-3
                rounded-xl
                bg-white
                border
                border-gray-200
                text-xs
                font-bold
                text-gray-500
                flex
                items-center
                gap-1.5
                hover:bg-gray-50
                transition
                cursor-default
              "
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
      />
      새로고침
    </button>
  </div>

    {loading ? (
      <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center text-sm text-gray-400">
        뉴스를 불러오는 중입니다.
      </div>
    ) : news.length === 0 ? (
      <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center text-sm text-gray-400">
        표시할 뉴스가 없습니다.
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 gap-4 mb-4">
          {mainNews.map((item, index) => (
            <div
  key={`${item.link}-${index}`}
              
              className="
  flex
  flex-col
  bg-white
  border
  border-gray-200
  rounded-3xl
  p-5
  min-h-[250px]
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-0.5
                transition-all
                duration-200
                cursor-default
              "
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="h-7 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center">
                  주요뉴스
                </span>

                <span className="text-xs text-gray-400 font-bold">
                  {formatDate(item.pubDate)}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep line-clamp-2">
                {cleanText(item.title)}
              </h3>

              <p
  className={`text-sm text-gray-500 leading-relaxed mt-3 break-keep ${getDescriptionClamp(
    item.title
  )}`}
>
                {cleanText(item.description)}
              </p>

              <a
  href={item.link || item.originallink}
  target="_blank"
  rel="noopener noreferrer"
  className="
  inline-flex
  items-center
  self-start
  rounded-xl
  px-3
  py-1.5
  mt-auto
    text-sm
    font-bold
    text-blue-600
    hover:bg-blue-50
    hover:text-blue-700
    transition
    cursor-pointer
  "
>
  기사 원문 보기
</a>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {listNews.map((item, index) => (
           <div
  key={`${item.link}-${index}`}
  className="
    flex
    flex-col
    bg-white
    border
    border-gray-200
    rounded-3xl
    p-6
    min-h-[220px]
    shadow-sm
    hover:shadow-xl
    hover:-translate-y-0.5
    transition-all
    duration-200
    cursor-default
  "
>
              <div className="flex-1">
  <p className="text-xs text-gray-400 font-bold mb-2">
    {formatDate(item.pubDate)}
  </p>

  <h3
    className={`text-base font-black text-gray-900 leading-snug break-keep ${getTitleClamp(
      item.title
    )}`}
  >
    {cleanText(item.title)}
  </h3>

  <p
    className={`text-sm text-gray-500 leading-relaxed mt-3 break-keep ${getDescriptionClamp(
      item.title
    )}`}
  >
    {cleanText(item.description)}
  </p>
</div>

             <a
  href={item.link || item.originallink}
  target="_blank"
  rel="noopener noreferrer"
  className="
    inline-flex
    items-center
    self-start
    rounded-xl
    px-3
  py-1.5
  mt-auto
    text-sm
    font-bold
    text-blue-600
    hover:bg-blue-50
    hover:text-blue-700
    transition
    cursor-pointer
  "
>
  자세히 보기
</a>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</section>

         {/* 환율 보드 */}
        <section className="mt-6">
          <div className="flex items-end justify-between gap-3 mb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 pl-3">
  <h2 className="text-lg font-black text-gray-900">
    오늘의 환율
  </h2>

<p className="text-xs text-gray-400 font-bold">
  네이버 증권 기준
</p>
</div>

            <button
              onClick={fetchExchange}
              className="
                h-9
                px-3
                rounded-xl
                bg-white
                border
                border-gray-200
                text-xs
                font-bold
                text-gray-500
                flex
                items-center
                gap-1.5
                hover:bg-gray-50
                transition
                cursor-default
              "
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  exchangeLoading ? "animate-spin" : ""
                }`}
              />
              새로고침
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {exchangeItems.map((item) => {
              const isUp = item.direction === "up";
              const isDown = item.direction === "down";

return (
  <a
    key={item.label}
    href={EXCHANGE_LINKS[item.label]}
    target="_blank"
    rel="noopener noreferrer"
                 className="
  block
  bg-gray-50
  border
  border-gray-200
  rounded-3xl
  p-5
                    shadow-sm
                    hover:shadow-xl
hover:-translate-y-0.5
transition-all
duration-200
                    mb-4
                    cursor-default
                  "
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-400">
                      {item.label}/KRW
                    </p>

     
                  </div>

                  <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
                    {formatExchange(item.label, item.value)}
                  </p>

                  <p
                    className={`
                      text-base
                      font-bold
                      mt-2
                      ${
                        isUp
                          ? "text-red-500"
                          : isDown
                          ? "text-blue-500"
                          : "text-gray-400"
                      }
                    `}
                  >
                   {`${isUp ? "▲ " : isDown ? "▼ " : ""}${Math.abs(
  item.change
).toFixed(2)}`}
                  </p>
                </a>
              );
            })}

            {exchangeItems.length === 0 && (
              <div className="col-span-full bg-white border border-gray-200 rounded-3xl p-5 text-sm text-gray-400 text-center">
                환율 정보를 불러오지 못했습니다.
              </div>
            )}
          </div>
        </section>

{/* 시장지표 보드 */}
<section className="mt-2">
  <div className="flex items-end justify-between gap-3 mb-3">
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 pl-3">
      <h2 className="text-lg font-black text-gray-900">
        오늘의 시장지표
      </h2>

      <p className="text-xs text-gray-400 font-bold">
        네이버 증권 기준
      </p>
    </div>

    <button
      onClick={fetchMarket}
      className="
        h-9
        px-3
        rounded-xl
        bg-white
        border
        border-gray-200
        text-xs
        font-bold
        text-gray-500
        flex
        items-center
        gap-1.5
        hover:bg-gray-50
        transition
        cursor-default
      "
    >
      <RefreshCw
        className={`w-3.5 h-3.5 ${
          marketLoading ? "animate-spin" : ""
        }`}
      />
      새로고침
    </button>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {marketItems.map((item) => {
      const isUp = item.direction === "up";
      const isDown = item.direction === "down";

      return (
<a
  key={item.label}
  href={MARKET_LINKS[item.label]}
  target="_blank"
  rel="noopener noreferrer"
  className="
            block
            bg-gray-50
            border
            border-gray-200
            rounded-3xl
            p-5
            shadow-sm
            hover:shadow-xl
            hover:-translate-y-0.5
            transition-all
            duration-200
            mb-4
            cursor-default
          "
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-gray-400">
              {item.label}
            </p>
          </div>

          <p className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
{formatMarketValue(item)}
          </p>

          <p
            className={`
              text-base
              font-bold
              mt-2
              ${
                isUp
                  ? "text-red-500"
                  : isDown
                  ? "text-blue-500"
                  : "text-gray-400"
              }
            `}
          >
{`${isUp ? "▲ " : isDown ? "▼ " : ""}${formatMarketChange(item)}`}
          </p>
        </a>
      );
    })}

    {marketItems.length === 0 && (
      <div className="col-span-full bg-white border border-gray-200 rounded-3xl p-5 text-sm text-gray-400 text-center">
        시장지표를 불러오지 못했습니다.
      </div>
    )}
  </div>
</section>

      </div>

      {/* 하단 고정 메뉴 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a
            href="https://naver.me/xsZ8mk7H"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            className="py-3 flex flex-col items-center gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            className="py-3 flex flex-col items-center gap-1"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
      {/* 메모 수정 팝업 */}
{selectedMemo && (
  <div
    onMouseMove={(e) => {
      if (!memoEditDragRef.current.isDragging) return;
      const d = memoEditDragRef.current;
      setMemoEditPos({ x: d.originX + e.clientX - d.startX, y: d.originY + e.clientY - d.startY });
    }}
    onMouseUp={() => { memoEditDragRef.current.isDragging = false; }}
    onMouseLeave={() => { memoEditDragRef.current.isDragging = false; }}
    className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4"
  >
    <div
      style={{ transform: `translate(${memoEditPos.x}px, ${memoEditPos.y}px)` }}
      onMouseDown={(e) => {
        if (window.innerWidth < 768) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, input, textarea")) return;
        memoEditDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, originX: memoEditPos.x, originY: memoEditPos.y };
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 수정</h2>
        <div className="flex items-center gap-2">
          {memoColorOptions.map((color) => (
            <button key={color.value} type="button"
              onClick={() => { changeMemoColor(selectedMemo.id, color.value); setSelectedMemo({ ...selectedMemo, color: color.value }); }}
              className={`w-7 h-7 rounded-full border transition hover:scale-105 ${selectedMemo.color === color.value ? "ring-2 ring-gray-400 ring-offset-2" : ""} ${color.className}`}
            />
          ))}
          <button onClick={() => { setSelectedMemo(null); setMemoEditPos({ x: 0, y: 0 }); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <input value={selectedMemo.title}
        onChange={(e) => setSelectedMemo({ ...selectedMemo, title: e.target.value })}
        placeholder="메모 제목" className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3" />
      <textarea value={selectedMemo.content}
        onChange={(e) => setSelectedMemo({ ...selectedMemo, content: e.target.value })}
        placeholder="메모 내용을 입력하세요" className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5" />
      <div className="flex gap-3">
        <button onClick={() => deleteMemo(selectedMemo.id)}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default">삭제</button>
        <button onClick={() => {
          saveMemos(memos.map(m => m.id === selectedMemo.id ? { ...m, title: selectedMemo.title, content: selectedMemo.content, updatedAt: new Date().toISOString() } : m));
          setSelectedMemo(null);
        }} className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default">완료</button>
      </div>
    </div>
  </div>
)}

{contextMenu && (
  <>
    <div className="fixed inset-0 z-[1999]" onClick={() => setContextMenu(null)} />
    <div style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32"
      onPointerDown={(e) => e.stopPropagation()}>
      <button onClick={() => { const t = memos.find(m => m.id === contextMenu.id); if (t) { setMemoEditPos({ x: 0, y: 0 }); requestAnimationFrame(() => setSelectedMemo(t)); } setContextMenu(null); }}
        className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default text-left">수정</button>
      <button onClick={() => { deleteMemo(contextMenu.id); setContextMenu(null); }}
        className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-default text-left border-t border-gray-100">삭제</button>
    </div>
  </>
)}

{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">메모 삭제</h2>
      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">선택한 메모를 삭제하시겠습니까?</p>
      <div className="flex gap-3 mt-6">
        <button onClick={() => { setDeleteMemoId(null); setDeleteMemoConfirmOpen(false); }}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default">취소</button>
        <button onClick={confirmDeleteMemo}
          className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default">삭제</button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}