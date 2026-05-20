"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Newspaper,
  MessageCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

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
const [query, setQuery] = useState("전체");
const [searchInput, setSearchInput] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeDate, setExchangeDate] = useState("");
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);

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

      const res = await fetch("/api/exchange", {
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
 fetchNews("전체");
  fetchExchange();
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
    <div className="flex whitespace-nowrap animate-[tickerMove_50s_linear_infinite] hover:[animation-play-state:paused]">
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
  <div
  className="
    px-0
    py-0
    overflow-hidden
  "
>
    {weatherItems.length === 0 ? (
      <div className="text-sm text-gray-400 text-center py-1">
        날씨 정보를 불러오지 못했습니다.
      </div>
    ) : (
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
            <div className="flex items-center gap-2 pl-3">
  <h2 className="text-lg font-black text-gray-900">
    오늘의 환율
  </h2>

  <p className="text-xs text-gray-400 font-bold">
    기준일 {exchangeDate || "-"}
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
                <div
                  key={item.label}
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

                    <span
                      className={`
                        text-sm
                        leading-none
                        font-black
                        ${
                          isUp
                            ? "text-red-500"
                            : isDown
                            ? "text-blue-500"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {isUp ? "▲" : isDown ? "▼" : "-"}
                    </span>
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
                   {`${isUp ? "+ " : isDown ? "- " : ""}${Math.abs(
  item.change
).toFixed(2)}`}
                  </p>
                </div>
              );
            })}

            {exchangeItems.length === 0 && (
              <div className="col-span-full bg-white border border-gray-200 rounded-3xl p-5 text-sm text-gray-400 text-center">
                환율 정보를 불러오지 못했습니다.
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
    </main>
  );
}