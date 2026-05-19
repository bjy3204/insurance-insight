"use client";

import { useState, useEffect, useRef } from "react";

import Link from "next/link";

import {
  Building2,
  ArrowLeft,
  Search,
  Newspaper,
  MessageCircle,
  BookOpen,
    FileText,
  X,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";
import { PRESS } from "./press";

const nonlifeCompanies = [
  ["DB손해보험", "db.png", "https://www.idbins.com/FWMAIV1534.do", "1588-0100"],
  ["삼성화재", "samsung.png", "https://www.samsungfire.com/vh/page/VH.HPIF0103.do", "1588-5114"],
  ["한화손해보험", "hanhwa.png", "https://www.hwgeneralins.com/notice/ir/main.do", "1566-8000"],
  ["현대해상", "hyundai.png", "https://www.hi.co.kr/serviceAction.do?menuId=100932", "1588-5656"],
  ["메리츠화재", "meritz.png", "https://www.meritzfire.com", "1566-7711"],
  ["롯데손해보험", "lotte.png", "https://www.lotteins.co.kr/index2.jsp", "1588-3344"],
  ["KB손해보험", "kb.png", "https://www.kbinsure.co.kr/CG802030001.ecs", "1544-0114"],
  ["MG손해보험", "mg.png", "https://www.yebyeol.co.kr/PB031210DM.scp?menuId=MN0803006", "1588-5959"],
  ["NH농협손해보험", "nh.png", "https://www.nhfire.co.kr/announce/productAnnounce/retrieveInsuranceProductsAnnounce.nhfire", "1644-9000"],
  ["하나손해보험", "hana.png", "https://www.hanainsure.co.kr/w/disclosure/product/saleProduct", "1566-3000"],
  ["흥국화재", "heungkuk.png", "https://www.heungkukfire.co.kr/FRW/announce/insGoodsGongsiSale.do", "1688-1688"],
  ["AIG손해보험", "aig.png", "https://www.aig.co.kr/wo/dpwot001.html?menuId=MS702", "1544-2792"],
  ["라이나손해보험", "lina.png", "https://www.chubb.com/kr-kr/disclosure/product.html", "1566-5800"],
];

const lifeCompanies = [
  ["교보생명", "kyobolife.png", "https://www.kyobo.com/dgt/web/product-official/all-product/search", "1588-1001"],
  ["신한라이프", "shinhanlife.png", "https://www.shinhanlife.co.kr/hp/cdhi0030.do", "1588-5580"],
  ["메트라이프", "metlifelife.png", "https://brand.metlife.co.kr/pn/paReal/insuProductDisclMain.do", "1588-9600"],
  ["삼성생명", "samsunglife.png", "https://www.samsunglife.com/individual/products/disclosure/sales/PDO-PRPRI010110M", "1588-3114"],
  ["KDB생명", "kdblife.png", "https://www.kdblife.com/ajax.do?scrId=HDLMA000M00P", "1588-4040"],
  ["KB라이프", "kblife.png", "https://www.kblife.co.kr/customer-common/productList.do", "1588-3374"],
  ["흥국생명", "heungkuklife.png", "https://www.heungkuklife.co.kr/front/public/saleProduct.do", "1588-2288"],
  ["DB생명", "dblife.png", "https://www.idblife.com/notice/product/sale", "1588-3131"],
  ["동양생명", "dongyanglife.png", "https://pbano.myangel.co.kr/paging/WE_AC_WEPAAP020100L", "1577-1004"],
  ["ABL생명", "abllife.png", "https://www.abllife.co.kr/st/pban/prdtPban/whlPrdt/whlPrdt1/whlPrdt11?page=index", "1588-6500"],
  ["IBK연금보험", "ibklife.png", "https://www.ibki.co.kr/process/HP_PBANO_PDT_SP_INDV", "1577-4117"],
  ["라이나생명", "linalife.png", "https://www.lina.co.kr/disclosure/product-public-announcement/product-on-sales?key=0", "1588-0058"],
  ["한화생명", "hanhwalife.png", "https://www.hanwhalife.com/main/disclosure/main/DF_0000000_P00000.do", "1588-6363"],
  ["하나생명", "hanalife.png", "https://www.hanalife.co.kr/anm/product/allProduct.do?status=on", "1577-1112"],
  ["미래에셋생명", "miraeassetlife.png", "https://life.miraeasset.com/micro/disclosure/product/PC-HO-080301-000000.do", "1588-0220"],
  ["NH농협생명", "nhlife.png", "https://www.nhlife.co.kr/ho/ig/HOIG0000M00.nhl", "1544-4000"],
  ["AIA생명", "aialife.png", "https://www.aia.co.kr/ko/disclosure/our-products/disclosing-process.html", "1588-9898"],
  ["처브라이프", "chubblife.png", "https://www.chubblife.co.kr/front/official/sale/listSale.do", "1599-4600"],
  ["BNP파리바 카디프생명", "cardiflife.png", "https://www.cardif.co.kr/disclosure/papag101.do", "1688-1118"],
  ["푸본현대생명", "fubonlife.png", "https://www.fubonhyundai.com/#CUSI150102010101", "1577-3311"],
  ["iM라이프", "imlife.png", "https://www.imlifeins.co.kr/BA/BA_A020.do", "1588-4770"],
];

const mutualCompanies = [
  ["우체국보험", "epost.png", "https://epostlife.go.kr/ASDSGD0101.do", "1599-0100"],
  ["MG새마을금고", "mg.png", "https://insure.kfcc.co.kr/#/PGE_IHJ_00003", "1599-9010"],
  ["신협", "cu.png", "https://openbank.cu.co.kr/", "1544-3030"],
  ["수협", "suhyup.png", "https://www.suhyup-bank.com/", "1588-4119"],
  ["THE K 손해보험", "thek.png", "https://www.ktcu.or.kr/PPW-FIC-800100", "1577-3993"],
];

const etcCompanies = [
  ["Carrot", "carrot.png", "https://www.hwgeneralins.com/notice/ir/main.do", "1566-0300"],
  ["AXA", "axa.png", "https://www.axa.co.kr/AsianPlatformInternet/html/axacms/common/intro/disclosure/insurance/index.html", "1588-5114"],
  ["카카오페이손해보험", "kakaopay.png", "https://kakaopayinscorp.co.kr/disclosure/goods", "1544-0022"],
  ["신한EZ손해보험", "shinhanez.png", "https://www.shinhanez.co.kr/static/pub/PUB20000T01.html", "1544-2580"],
];
const termsDictionary = [
  {
    title: "보험계약체결",
    subtitle: "고지의무 · 고지사항 · 계약해지 제한",
    pages: [
      {
        page: 1,
        title: "보험계약의 체결과 고지의무",
        body: `◎ 보험계약자 또는 피보험자가 보험계약 체결 당시에 보험자에 대하여 중요한 사항을 고지하거나 부실고지를 하지 아니할 의무

◎ 고지의무는 보험계약의 선의성과 윤리성에 기인한 것`,
      },

      {
        page: 2,
        title: "고지의무의 법적성질",
        body: `◎ 법적성질`,
        table: [
          [
            "자기의무",
            "보험계약자 등이 이 의무를 위반한 경우 계약이 해지될 수 있고 이를 방지하기 위한 의무",
          ],

          [
            "간접의무",
            "보험계약의 체결을 위한 전제요건으로서의 간접의무",
          ],

          [
            "법정의무",
            "상법 제651조에 규정된 법률상의 의무",
          ],
        ],
      },

      {
        page: 3,
        title: "고지의무 내용 : 당사자",
        body: `◎ 고지의무자
보험계약자
피보험자
대리인

◎ 고지의 상대방
보험자
그 대리인`,
        table: [
          ["계약대리점", "계약체결권 및 고지수령권이 모두 있음"],

          ["보험의", "계약체결권은 없으나 고지수령권은 있음"],
        ],
      },

      {
        page: 4,
        title: "고지의무 내용 : 고지사항",
        body: `◎ 중요한 사항

보험계약의 체결 여부에 중대한 영향을 미치는 사항

예)
보험사고의 발생사실, 기왕증, 현재증, 나이, 직업 등

보험자가 제시한 질문표는 중요한 사항으로 추정함`,
      },

      {
        page: 5,
        title: "고지의무 위반 : 요건",
        body: `◎ 요건`,
        table: [
          [
            "주관적 요건",
            "고지의무 위반에 대하여 고의 또는 중대한 과실",
          ],

          [
            "객관적 요건",
            "중요사항의 불고지 또는 부실고지가 있어야 함",
          ],

          ["증명책임", "주장하는 자, 즉 보험자"],
        ],
      },

      {
        page: 6,
        title: "고지의무 위반 : 효과",
        body: `◎ 보험계약의 해지

원칙적으로 보험계약의 해지는 일방의 의사표시로 가능

해지의 상대방은 보험계약자 또는 그 대리인

피보험자나 보험수익자는 계약당사자가 아니므로 해지상대방이 아님

보험계약이 해지된 경우 보험료전액 또는 해지환급금을 청구할 수 있음

고지의무위반과 보험사고 사이에 인과관계가 있을 때에는 보험계약 해지 전의 보험금 지급에 대해 반환 청구 가능`,
      },

      {
        page: 7,
        title: "보험계약 해지의 제한",
        body: `제척기간의 경과

고지의무위반 사실을 안 날로 1월, 계약 체결일로부터 3년

보험자 또는 그 대리인이 중요한 사항을 알았거나 중대한 과실로 알지 못한 경우

보험사고와 고지의무위반 사이에 인과관계가 부존재하는 때에도 보험계약자가 이를 증명한 경우`,
      },
    ],
  },

  {
    title: "보험금 청구",
    subtitle: "계약관계자 · 보험금 지급 · 면책사유",
    pages: [
      {
        page: 1,
        title: "보험계약관계자의 개관",
        body: `◎ 보험자

보험사업의 주체로서 보험을 인수하는 자로서 보험사고가 발생한 경우 보험금을 지급할 의무를 지는 자

◎ 보험계약자

보험계약관계에서 보험자와 자기의 이름으로 보험계약을 체결하고 보험료지급의무를 부담하는 자`,
      },

      {
        page: 2,
        title: "계약당사자 이외의 자",
        body: `◎ 피보험자`,
        table: [
          [
            "손해보험",
            "피보험이익의 주체로서 보험사고의 발생으로 생긴 재산상의 손해보상을 받을 권리를 갖는 자",
          ],

          [
            "생명보험",
            "보험사고 발생의 객체가 되는 자 · 보험에 들어진 자",
          ],
        ],
      },

      {
        page: 3,
        title: "보험금의 지급",
        body: `◎ 방법

보험금의 지급방법은 금전으로 지급하는 것이 원칙이며 당사자의 특약에 따라 현물 또는 기타의 급여로서도 할 수 있음

◎ 시기

보험사고발생의 통지를 받은 후 지체없이 보험금액을 정하고 10일 이내에 지급함

보험금의 청구를 신의성실의 원칙에 반하여 시기적으로 하는 경우에는 보험금 청구가 제한될 수 있음`,
      },

      {
        page: 4,
        title: "면책사유",
        body: `◎ 요건

보험사고가 보험계약자 또는 피보험자, 보험수익자의 고의 또는 중대한 과실로 인하여 발생된 경우

보험사고가 전쟁 기타의 변란으로 생긴 때

보험분쟁 약관에서 정한 면책사유

면책약관은 보험계약자 또는 피보험자나 보험수익자의 불이익으로 변경하지 않는 범위 내에서 유효`,
      },
    ],
  },

  {
    title: "보험금 조사",
    subtitle: "지급사유 조사 · 사기청구 · 과다청구",
    pages: [
      {
        page: 1,
        title: "보험의 기본 원리",
        body: `◎ 보험의 기본 원리`,
        table: [
          [
            "대수의 법칙",
            "사건의 발생확률은 관찰의 횟수를 늘려가면 일정한 발생확률이 나오고 이 확률은 대개 비슷하게 되는 것",
          ],

          [
            "수지상등의 원칙",
            "보험계약자가 납입하는 보험료의 총액과 보험회사가 지급하는 보험금 및 지출비용의 총액이 동일한 금액이 되도록 하는 것",
          ],
        ],
      },

      {
        page: 2,
        title: "보험금 지급사유의 조사",
        body: `보험계약자 등이 보험금 지급청구를 하였을 때 보험금 지급청구에 대한 내용과 보험계약에서 정하고 있는 보험금 지급사유의 일치성을 조사하여야 함

보험금 지급사유에 해당하는 경우에 한하여 보험금을 지급함`,
      },

      {
        page: 3,
        title: "사기청구 조사",
        body: `보험금을 편취할 목적으로 보험사고를 조작하거나 의도적으로 발생시키는 행위

허위사고, 방화, 고의상해 등이 포함될 수 있음`,
      },

      {
        page: 4,
        title: "과다청구 조사",
        body: `실제 손해보다 과다하게 보험금을 청구하는 경우

치료비, 차량수리비 등을 부풀리는 사례 포함`,
      },
    ],
  },

  {
    title: "의료자문",
    subtitle: "의료자문 필요성 · 동의 · 제3자 판단",
    pages: [
      {
        page: 1,
        title: "의료자문을 통한 보험금 지급여부 판단",
        body: `보험금 청구서 및 관련 서류 등의 검토를 통해 보험금 청구가 이루어짐

보험계약상의 문제 또는 보험금 지급 여부의 결정이 어려운 경우 의료자문 실시`,
      },

      {
        page: 2,
        title: "의료자문",
        body: `보험자가 자문기관에 환자의 의무기록 및 영상 등 정보를 제공하고 이에 대한 의학적 소견을 받는 행위`,
      },

      {
        page: 3,
        title: "의료자문의 동의",
        body: `피보험자 등과 보험자가 보험금 지급사유에 대해 합의하지 못할 때는 제3자의 의견을 들을 수 있음

의료비용은 보험자가 부담`,
      },
    ],
  },

  {
    title: "판례 · 사례",
    subtitle: "고지의무 · 자살면책 · 설명의무",
    pages: [
      {
        page: 1,
        title: "고지의무 위반과 보험금 지급",
        body: `보험자는 고지의무 위반 사실과 보험사고 발생 사이 인과관계를 불문하고 계약 해지 가능

다만 인과관계가 없는 경우 보험금은 지급해야 함`,
      },

      {
        page: 2,
        title: "자살 면책 판례",
        body: `자유로운 의사결정을 할 수 없는 상태에서 발생한 자살은 면책사유에서 제외될 수 있음

심신상실 상태 여부 등을 종합적으로 판단`,
      },

      {
        page: 3,
        title: "설명의무 판례",
        body: `보험설계사가 중요한 사항을 설명하지 않은 경우 손해배상 책임 발생 가능

보험회사의 사용자 책임 인정 가능`,
      },
    ],
  },
];
export default function ProductPublicPage() {
 
 const [termsOpen, setTermsOpen] = useState(false);
const [selectedTerm, setSelectedTerm] = useState<any>(null);
const [pressOpen, setPressOpen] = useState(false);
const [selectedPress, setSelectedPress] = useState<any>(null);
const [pressSearch, setPressSearch] = useState("");
const [pressPage, setPressPage] = useState(1);
const [showPressDot, setShowPressDot] = useState(false);
const [readPressIds, setReadPressIds] = useState<number[]>([]);

const [selectedItem, setSelectedItem] = useState(0);
const [pressPopupPos, setPressPopupPos] = useState({ x: 0, y: 0 });
const [termPopupPos, setTermPopupPos] = useState({ x: 0, y: 0 });

const pressDragRef = useRef({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
const termDragRef = useRef({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

const movePopup = (
  e: React.MouseEvent,
  type: "press" | "term"
) => {
  const drag = type === "press" ? pressDragRef.current : termDragRef.current;
  if (!drag.isDragging) return;

  const nextPos = {
    x: drag.originX + e.clientX - drag.startX,
    y: drag.originY + e.clientY - drag.startY,
  };

  if (type === "press") {
    setPressPopupPos(nextPos);
  } else {
    setTermPopupPos(nextPos);
  }
};

const stopPopupMove = () => {
  pressDragRef.current.isDragging = false;
  termDragRef.current.isDragging = false;
};
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("nonlife");
  useEffect(() => {
    const savedReadPressIds = localStorage.getItem("readPressIds");

if (savedReadPressIds) {
  setReadPressIds(JSON.parse(savedReadPressIds));
}
  const savedVersion = localStorage.getItem("press-version");

  if (savedVersion !== PRESS.version) {
    setShowPressDot(true);
  }
}, []);

  const currentCompanies =
    tab === "nonlife"
      ? nonlifeCompanies
      : tab === "life"
      ? lifeCompanies
      : tab === "mutual"
      ? mutualCompanies
      : etcCompanies;

  const allCompanies = [
    ...nonlifeCompanies,
    ...lifeCompanies,
    ...mutualCompanies,
    ...etcCompanies,
  ];
const sortedPress = [...PRESS.items].sort(
  (a, b) =>
    new Date(b.date.replace(/\./g, "-")).getTime() -
    new Date(a.date.replace(/\./g, "-")).getTime()
);

const filteredPress = sortedPress.filter((item) =>
  `${item.title} ${item.date} ${item.source} ${item.body}`
    .toLowerCase()
    .includes(pressSearch.toLowerCase())
);

const PRESS_PER_PAGE = 10;

const totalPressPages = Math.ceil(filteredPress.length / PRESS_PER_PAGE);

const paginatedPress = filteredPress.slice(
  (pressPage - 1) * PRESS_PER_PAGE,
  pressPage * PRESS_PER_PAGE
);

  const filteredCompanies =
    search.trim() !== ""
      ? allCompanies.filter(([name]) =>
          name.toLowerCase().includes(search.toLowerCase())
        )
      : currentCompanies;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Building2 className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  상품공시실
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                보험사별 상품공시실 바로가기
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3 mb-5">
          <Search className="w-5 h-5 text-gray-400" />

          <input
            placeholder="보험사명을 검색하세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-200 rounded-2xl p-1 mb-7 gap-1">
          <button
            onClick={() => setTab("nonlife")}
            className={`rounded-xl py-3 text-sm md:text-base font-bold ${
              tab === "nonlife"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            손해보험
          </button>

          <button
            onClick={() => setTab("life")}
            className={`rounded-xl py-3 text-sm md:text-base font-bold ${
              tab === "life"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            생명보험
          </button>

          <button
            onClick={() => setTab("mutual")}
            className={`rounded-xl py-3 text-sm md:text-base font-bold ${
              tab === "mutual"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            공제보험
          </button>

          <button
            onClick={() => setTab("etc")}
            className={`rounded-xl py-3 text-sm md:text-base font-bold ${
              tab === "etc"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            기타보험
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-9">
          {filteredCompanies.map(([name, image, link, phone]) => {
            let logoPath = "";

            if (mutualCompanies.some((item) => item[0] === name)) {
              logoPath = `/logos/product-mutual/${image}`;
            } else if (etcCompanies.some((item) => item[0] === name)) {
              logoPath = `/logos/product-etc/${image}`;
            } else if (lifeCompanies.some((item) => item[0] === name)) {
              logoPath = `/logos/product-life/${image}`;
            } else {
              logoPath = `/logos/product-nonlife/${image}`;
            }

            return (
  <div
  key={name}
  className="
  bg-white
  rounded-3xl
  h-36 md:h-40
  px-3 md:px-5
  border
  border-gray-200
  shadow-sm
  flex
  items-center
  justify-center
  transition-all
  duration-200
  
"
  >
                <div className="flex flex-col items-center justify-center">

  <img
  src={logoPath}
  alt={name}
  className="
    max-w-[150px]
    max-h-[62px]
    md:max-w-[160px]
    md:max-h-[66px]
    object-contain
    mb-4
  "
/>

 <a
  href={link}
  target="_blank"
  rel="noopener noreferrer"
  className="
  cursor-pointer
  px-10
  md:px-5.5
  py-2.5
  rounded-xl
  bg-gray-800
  text-white
  text-[11px]
  md:text-sm
  font-medium
  whitespace-nowrap
  transition-all
  duration-200
  active:scale-[0.97]
  hover:bg-gray-200
"
>
  <span className="hidden md:inline">
  상품공시실 바로가기
</span>

<span className="inline md:hidden">
  상품공시실
</span>
</a>

</div>

                
              </div>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a
            href="https://naver.me/xsZ8mk7H"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a
            href="https://open.kakao.com/o/gD7ej63h"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a
            href="https://www.instagram.com/g__tree_/"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex flex-col items-center gap-1"
          >
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
      
     {/* 약관 사전 아이콘 */}
<button
  onClick={() => setTermsOpen(!termsOpen)}
  className="
    fixed
    left-6
    bottom-24
    z-40
    w-14
    h-14
    rounded-full
    bg-gray-800
    shadow-lg
    hover:shadow-2xl
    hover:-translate-y-0.5
    transition-all
    duration-200
  
    flex
    items-center
    justify-center
  "
>
  <BookOpen className="w-6 h-6 text-white" />

 
</button>

{/* 메뉴 */}
{termsOpen && (
  <div
    onClick={() => setTermsOpen(false)}
    className="fixed inset-0 z-40"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        fixed
        left-6
        bottom-40
        z-40
        bg-white
        border
        border-gray-200
        shadow-xl
        rounded-2xl
        p-3
        flex
        flex-col
        gap-2
        w-64
      "
    >
    {termsDictionary.map((item) => (
      <button
        key={item.title}
        onClick={() => {
          setSelectedTerm(item);

setSelectedItem(0);
setTermsOpen(false);
        }}
        className="w-full px-4 py-3 rounded-xl bg-gray-100 text-left hover:bg-blue-50 hover:text-blue-600 transitionr"
      >
        <p className="text-sm font-bold text-gray-800">{item.title}</p>
        <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
      </button>
    ))}
    <button
  onClick={() => {
  setPressOpen(true);
  setTermsOpen(false);
  setSelectedPress(null);
  setPressSearch("");

  localStorage.setItem("press-version", PRESS.version);
  setShowPressDot(false);
}}
  className="
    w-full
    px-4
    py-3
    rounded-xl
    bg-white
    border
    border-gray-200
    text-left
    hover:border-blue-300
    hover:bg-blue-50
    transition
    cursor-pointer
  "
>
  <div className="flex items-center gap-2">
  <p className="text-sm font-bold text-gray-800">
    보도자료
  </p>

  
</div>

  <p className="text-xs text-gray-400 mt-1">
    금융위 보도자료 모음
  </p>
</button>
      </div>
  </div>
)}

{/* 보도자료 팝업 */}
{pressOpen && (
  <div
    onMouseMove={(e) => movePopup(e, "press")}
    onMouseUp={stopPopupMove}
    onMouseLeave={stopPopupMove}
    
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        transform: `translate(${pressPopupPos.x}px, ${pressPopupPos.y}px)`,
      }}
      className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[85vh] flex flex-col"
    >

      <div
  onMouseDown={(e) => {
  if (window.innerWidth < 768) return;

  pressDragRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    originX: pressPopupPos.x,
    originY: pressPopupPos.y,
  };
}}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          보도자료
        </div>

        <button
  onClick={() => {
    setPressOpen(false);
    setSelectedPress(null);
    setPressPopupPos({ x: 0, y: 0 });
  }}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!selectedPress ? (
        <>
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                value={pressSearch}
                onChange={(e) => {
  setPressSearch(e.target.value);
  setPressPage(1);
}}
                placeholder="보도자료 검색"
                className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
  <div className="overflow-y-auto flex-1 p-4">
    <table className="w-full table-fixed text-sm">
      <thead>
  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
          <th className="py-3 w-20">번호</th>
          <th className="py-3 text-center">제목</th>
          <th className="py-3 w-32">출처</th>
          <th className="py-3 w-32">날짜</th>
        </tr>
      </thead>

      <tbody>
        {paginatedPress.map((item, index) => (
          <tr
            key={item.id}
            onClick={() => {
  setSelectedPress(item);

  const nextReadPressIds = Array.from(
    new Set([...readPressIds, item.id])
  );

  setReadPressIds(nextReadPressIds);
  localStorage.setItem(
    "readPressIds",
    JSON.stringify(nextReadPressIds)
  );
}}
            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
          >
            <td className="py-4 text-center text-gray-700 border-b border-gray-100">
              {filteredPress.length -
                ((pressPage - 1) * PRESS_PER_PAGE + index)}
            </td>

            <td className="py-4 font-medium text-gray-800 border-b border-gray-100 overflow-hidden">
  <div className="flex items-center gap-2 overflow-hidden">
  <span className="truncate">
    {item.title}
  </span>

  {!readPressIds.includes(item.id) && (
    <span className="shrink-0 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-600">
      NEW
    </span>
  )}
</div>
</td>

            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
              {item.source}
            </td>

            <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
              {item.date}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {totalPressPages > 1 && (
    <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
      <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
        <button
          onClick={() => setPressPage((p) => Math.max(1, p - 1))}
          disabled={pressPage === 1}
          className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
        >
          이전
        </button>

        {Array.from({
  length: Math.min(totalPressPages, 10),
}).map((_, index) => {
          const page = index + 1;

          return (
            <button
              key={page}
              onClick={() => setPressPage(page)}
              className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                pressPage === page
                  ? "bg-slate-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() =>
            setPressPage((p) => Math.min(totalPressPages, p + 1))
          }
          disabled={pressPage === totalPressPages}
          className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
        >
          다음
        </button>
      </div>
    </div>
  )}
</div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5">
  <h2 className="text-2xl font-black text-gray-900 break-keep leading-snug">
    {selectedPress.title}
  </h2>

  <p className="text-sm text-gray-400 mt-2">
    {selectedPress.date} · {selectedPress.source}
  </p>

  <div className="border-t border-gray-200 mt-4 pt-3 break-keep text-[15px] leading-[1.8] text-gray-700">
    {selectedPress.pdfs && (
      <div className="flex flex-wrap gap-3 mb-4">
        {selectedPress.pdfs.map((pdf: string, index: number) => (
          <a
            key={index}
            href={pdf}
            download
            className="
              inline-flex
              items-center
              gap-1.5
              text-sm
              text-gray-500
              underline
              underline-offset-2
              hover:text-gray-700
              transition
            "
          >
            <FileText className="w-4 h-4" />
            PDF 다운로드
            {selectedPress.pdfs.length > 1 && ` ${index + 1}`}
          </a>
        ))}
      </div>
    )}

    <div className="whitespace-pre-line">
      {selectedPress.body}
    </div>
    {selectedPress.pdfs?.[0] && (
  <div className="mt-6">
    <iframe
      src={selectedPress.pdfs[0]}
      className="
        w-full
        h-[900px]
        rounded-2xl
        border
        border-gray-200
      "
    />
    <p className="text-xs text-gray-400 mt-2">
  일부 모바일 환경에서는 PDF 미리보기가 지원되지 않을 수 있습니다.
</p>
  </div>
)}
  </div>
</div>

          <div className="border-t border-gray-200 p-4 text-center">
            <button
              onClick={() => setSelectedPress(null)}
              className="
  px-5
  py-3
  rounded-xl
  bg-gray-700
  text-white
  text-sm
  font-bold
  cursor-pointer
  hover:bg-gray-600
  transition
"
            >
              목록으로
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
{/* 팝업 */}
{selectedTerm && (
  <div
    onMouseMove={(e) => movePopup(e, "term")}
    onMouseUp={stopPopupMove}
    onMouseLeave={stopPopupMove}
    
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        transform: `translate(${termPopupPos.x}px, ${termPopupPos.y}px)`,
      }}
      className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
    >
      <div
  onMouseDown={(e) => {
  if (window.innerWidth < 768) return;

  termDragRef.current = {
    isDragging: true,
    startX: e.clientX,
    startY: e.clientY,
    originX: termPopupPos.x,
    originY: termPopupPos.y,
  };
}}
  className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between"
>
        <div className="font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {selectedTerm.title}
        </div>

        <button
  onClick={() => {
    setSelectedTerm(null);
    setTermPopupPos({ x: 0, y: 0 });
  }}
          className="
  cursor-pointer
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  hover:bg-white/10
  transition
"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto">
        

        {(() => {
  const filteredPages = selectedTerm.pages;

  const item = filteredPages[selectedItem];

  if (!item) {
    return (
      <div className="text-center text-sm text-gray-400 py-10">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <>
    

      {/* 내용 */}
      <div className="rounded-2xl border border-gray-200 px-5 py-4 mb-5">
        <h3 className="text-lg font-black text-gray-900 mb-3">
          {item.title}
        </h3>

        <div
  className="
    text-[15px]
    text-gray-700
    leading-[1.8]
    whitespace-break-spaces
    break-keep
    tracking-[-0.01em]
  "
>
  {item.body}
</div>

{/* 표 */}
{item.table && (
  <div className="overflow-hidden rounded-2xl border border-gray-200 mt-5">
    <table className="w-full text-sm">
      <tbody>
        {item.table.map((row: any, index: number) => (
          <tr
            key={index}
            className="border-b border-gray-200 last:border-b-0"
          >
            <td
  className="
    bg-gray-50
    px-4
    py-3
    font-bold
    text-gray-900
    w-28
    md:w-36
    align-top
    border-r
    border-gray-200
  "
>
              {row[0]}
            </td>

            <td
  className="
    px-4
    py-3
    text-gray-700
    leading-[1.7]
    break-keep
  "
>
              {row[1]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
      </div>
       {/* 소주제 버튼 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filteredPages.map((sub: any, index: number) => (
          <button
            key={index}
            onClick={() => setSelectedItem(index)}
            className={`
              px-4
              py-2
              rounded-xl
              text-sm
              font-semibold
              transition
              cursor-pointer
              ${
                selectedItem === index
                  ? "bg-slate-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {sub.title}
          </button>
        ))}
      </div>
    </>
    
  );
})()}
      </div>
    </div>
  </div>
)}
    </main>
  );
}