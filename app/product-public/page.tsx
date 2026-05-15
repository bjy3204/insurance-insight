"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Building2,
  ArrowLeft,
  Search,
  Newspaper,
  MessageCircle,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";

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

export default function ProductPublicPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("nonlife");

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
        <div className="bg-white rounded-2xl border border-gray-300 px-4 py-3 flex items-center gap-3 mb-5">
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
    md:max-h-66
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
  md:px-6
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
    </main>
  );
}