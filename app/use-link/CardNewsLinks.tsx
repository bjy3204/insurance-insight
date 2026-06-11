"use client";
import Image from "next/image";

type Props = {
  search: string;
};

const links = [
  {
    title: "금융위원회",
    icon: "/CardNews/fsc.png",
    desc: "금융정책 및 금융뉴스",
    url: "https://www.fsc.go.kr/no040101?curPage=1",
  },
  {
    title: "알기쉬운 금융",
    icon: "/CardNews/fsc.png",
    desc: "금융위원회 카드뉴스",
    url: "https://www.fsc.go.kr/edu/cardnews",
  },
  {
    title: "질병관리청",
    icon: "/CardNews/kdca.png",
    desc: "건강·질병 카드뉴스",
    url: "https://www.kdca.go.kr/kdca/2853/subview.do",
  },
  {
    title: "보건복지부",
    icon: "/CardNews/mohw.png",
    desc: "보건복지 카드뉴스",
    url: "https://www.mohw.go.kr/gallery.es?mid=a10410020000&bid=0005",
  },
  {
    title: "국가건강정보포털",
    icon: "/CardNews/kdca.png",
    desc: "건강정보 카드뉴스",
    url: "https://health.kdca.go.kr/healthinfo/biz/health/ntcnInfo/healthSourc/cardNews/cardNewsMain.do",
  },
  {
    title: "국토교통부",
    icon: "/CardNews/molit.png",
    desc: "부동산·교통 정책뉴스",
    url: "https://www.molit.go.kr/USR/NEWS/m_71/lst.jsp",
  },
  {
    title: "고용노동부",
    icon: "/CardNews/moel.png",
    desc: "고용·노동 카드뉴스",
    url: "https://www.moel.go.kr/news/cardinfo/list.do",
  },
  {
    title: "행정안전부",
    icon: "/CardNews/mois.png",
    desc: "생활안전 카드뉴스",
    url: "https://www.mois.go.kr/frt/bbs/type002/commonSelectBoardList.do?bbsId=BBSMSTR_000000000205",
  },
  {
    title: "기획재정부",
    icon: "/CardNews/moef.png",
    desc: "경제정책 카드뉴스",
    url: "https://mofe.go.kr/nw/mosfnw/cardNews.do?menuNo=4040600&pageIndex=1",
  },
];

export default function CardNewsLinks({ search }: Props) {
  const filtered = links.filter(
    (item) =>
      item.title.includes(search) ||
      item.desc.includes(search)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filtered.map((item) => (
       <a
  key={item.title}
  href={item.url}
  target="_blank"
  rel="noopener noreferrer"
  className="
    bg-white
    rounded-3xl
    border
    border-gray-200
    p-4
    shadow-sm
    transition-all
    duration-200
    cursor-default
    hover:-translate-y-1
    hover:border-gray-300
    hover:shadow-md
  "
>
         <div className="mb-4 flex justify-center">
         <div className="bg-[#FFFDF5] rounded-2xl px-1 py-2">
           <Image
             src={item.icon}
             alt={item.title}
             width={240}
             height={80}
             className="w-full h-auto object-contain"
           />
         </div>
         </div>
         
         <div className="text-left px-2">
           <h3 className="text-[13] font-black text-gray-900">
             {item.title}
           </h3>
         
           <p className="text-sm text-gray-500 mt-1">
             {item.desc}
           </p>
         </div>
                 </a>
               ))}
             </div>
           );
         }