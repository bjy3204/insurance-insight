"use client";

import { useEffect, useState } from "react";

export default function ExchangeIndexBar() {
  const [exchange, setExchange] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/naver-exchange").then((res) => res.json()),
      fetch("/api/market").then((res) => res.json()),
    ])
      .then(([exchangeData, marketData]) => {
        setExchange(exchangeData);
        setMarket(marketData);
      })
      .catch(() => {
        setExchange(null);
        setMarket(null);
      });
  }, []);

  const exchangeItems = exchange?.items || [];
  const marketItems = market?.items || [];

  const items = [...exchangeItems, ...marketItems];

  if (items.length === 0) {
    return (
      <div className="hidden md:block max-w-[1500px] mx-auto px-5 mb-22">
        <div className="rounded-2xl px-4 py-3 text-center text-sm text-block-500">
          환율 정보를 불러오지 못했습니다.
        </div>
      </div>
    );
  }

  const formatValue = (item: any) => {
    if (item.label === "국내 금 (원/g)") {
      return `${Math.round(item.value).toLocaleString()}원`;
    }

    if (item.label === "은 (USD/OZS)") {
      return item.value.toLocaleString("ko-KR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    if (item.label === "코스피" || item.label === "코스닥") {
      return item.value.toLocaleString("ko-KR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return `${Math.round(item.value).toLocaleString()}원`;
  };

  return (
   <div className="hidden md:block max-w-[1500px] mx-auto px-10 mb-22">
      <div
  onClick={() => window.location.href = "/today-news"}
  className="rounded-2xl px-4 py-3 hover:bg-gray-50 transition"
>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-600 cursor-default">
          <span className="font-bold text-gray-800">
            실시간 지표
          </span>

          {items.map((item: any) => (
            <span key={item.label}>
              {item.label}{" "}
              <b className="text-gray-900">
                {formatValue(item)}
              </b>
            </span>
          ))}

          <span className="text-[13px] text-gray-400">
            네이버 증권 기준
          </span>
        </div>
      </div>
    </div>
  );
}
