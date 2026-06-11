"use client";

import { useEffect, useState } from "react";

type Props = {
  search: string;
};

type PolicyItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  department: string;
  image: string;
  link: string;
};

export default function PolicyBriefing({ search }: Props) {
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolicyNews = async () => {
      const res = await fetch("/api/policy-briefing");
      const data = await res.json();

      setItems(data.items ?? []);
      setLoading(false);
    };

    loadPolicyNews();
  }, []);

  const filtered = items.filter((item) =>
    `${item.title} ${item.subtitle} ${item.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-20 text-sm text-gray-400">
        정책브리핑을 불러오는 중입니다
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-sm text-gray-400">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filtered.map((item) => (
<div
  key={item.id}
  className="
    bg-white rounded-3xl border border-gray-200 shadow-sm
    overflow-hidden transition-all duration-200 cursor-default
    hover:-translate-y-1 hover:border-gray-300 hover:shadow-md
  "
>
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                이미지 없음
              </div>
            )}
          </div>

         <div className="p-5">
  <h3 className="text-base font-black text-gray-900 leading-snug line-clamp-2">
    {item.title}
  </h3>

  <div className="mt-2 text-xs text-gray-400">
    {item.date}
  </div>

  <div className="mt-1 text-xs text-gray-400">
    {item.department}
  </div>

           <a
  href={item.link}
  target="_blank"
  rel="noopener noreferrer"
  className="
    inline-flex items-center rounded-xl bg-blue-50 text-blue-600
    px-4 py-2 text-sm font-bold mt-4 cursor-pointer
    transition hover:bg-blue-100
  "
>
  원문보기
</a>
          </div>
        </div>
      ))}
    </div>
  );
}