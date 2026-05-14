"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Building2,
  ArrowLeft,
  Newspaper,
  MessageCircle,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";

const nonlifeCompanies = [
  [
    "DB손해보험",
    "db.png",
    "https://www.idbins.com/FWMAIV1534.do",
  ],

  [
    "삼성화재",
    "samsung.png",
    "https://www.samsungfire.com/vh/page/VH.HPIF0103.do",
  ],

  [
    "한화손해보험",
    "hanhwa.png",
    "https://www.hwgeneralins.com/notice/ir/main.do",
  ],

  [
    "현대해상",
    "hyundai.png",
    "https://www.hi.co.kr/serviceAction.do?menuId=100932",
  ],

  [
    "메리츠화재",
    "meritz.png",
    "https://www.meritzfire.com",
  ],

  [
    "롯데손해보험",
    "lotte.png",
    "https://www.lotteins.co.kr/index2.jsp",
  ],

  [
    "KB손해보험",
    "kb.png",
    "https://www.kbinsure.co.kr/CG802030001.ecs",
  ],

  [
    "MG손해보험",
    "mg.png",
    "https://www.yebyeol.co.kr/PB031210DM.scp?menuId=MN0803006",
  ],

  [
    "NH농협손해보험",
    "nh.png",
    "https://www.nhfire.co.kr/announce/productAnnounce/retrieveInsuranceProductsAnnounce.nhfire",
  ],

  [
    "하나손해보험",
    "hana.png",
    "https://www.hanainsure.co.kr/w/disclosure/product/saleProduct",
  ],

  [
    "흥국화재",
    "heungkuk.png",
    "https://www.heungkukfire.co.kr/FRW/announce/insGoodsGongsiSale.do",
  ],

  [
    "AIG손해보험",
    "aig.png",
    "https://www.aig.co.kr/wo/dpwot001.html?menuId=MS702",
  ],

  [
    "라이나손해보험",
    "lina.png",
    "https://www.chubb.com/kr-kr/disclosure/product.html",
  ],
];

const lifeCompanies = [
  [
    "교보생명",
    "kyobolife.png",
    "https://www.kyobo.com/dgt/web/product-official/all-product/search",
  ],

  [
    "신한라이프",
    "shinhanlife.png",
    "https://www.shinhanlife.co.kr/hp/cdhi0030.do",
  ],

  [
    "메트라이프",
    "metlifelife.png",
    "https://brand.metlife.co.kr/pn/paReal/insuProductDisclMain.do",
  ],

  [
    "삼성생명",
    "samsunglife.png",
    "https://www.samsunglife.com/individual/products/disclosure/sales/PDO-PRPRI010110M",
  ],

  [
    "KDB생명",
    "kdblife.png",
    "https://www.kdblife.com/ajax.do?scrId=HDLMA000M00P",
  ],

  [
    "KB라이프",
    "kblife.png",
    "https://www.kblife.co.kr/customer-common/productList.do",
  ],

  [
    "흥국생명",
    "heungkuklife.png",
    "https://www.heungkuklife.co.kr/front/public/saleProduct.do",
  ],

  [
    "DB생명",
    "dblife.png",
    "https://www.idblife.com/notice/product/sale",
  ],

  [
    "동양생명",
    "dongyanglife.png",
    "https://pbano.myangel.co.kr/paging/WE_AC_WEPAAP020100L",
  ],

  [
    "ABL생명",
    "abllife.png",
    "https://www.abllife.co.kr/st/pban/prdtPban/whlPrdt/whlPrdt1/whlPrdt11?page=index",
  ],

  [
    "IBK연금보험",
    "ibklife.png",
    "https://www.ibki.co.kr/process/HP_PBANO_PDT_SP_INDV",
  ],

  [
    "라이나생명",
    "linalife.png",
    "https://www.lina.co.kr/disclosure/product-public-announcement/product-on-sales?key=0",
  ],

  [
    "한화생명",
    "hanhwalife.png",
    "https://www.hanwhalife.com/main/disclosure/main/DF_0000000_P00000.do",
  ],

  [
    "하나생명",
    "hanalife.png",
    "https://www.hanalife.co.kr/anm/product/allProduct.do?status=on",
  ],

  [
    "미래에셋생명",
    "miraeassetlife.png",
    "https://life.miraeasset.com/micro/disclosure/product/PC-HO-080301-000000.do",
  ],

  [
    "NH농협생명",
    "nhlife.png",
    "https://www.nhlife.co.kr/ho/ig/HOIG0000M00.nhl",
  ],

  [
    "AIA생명",
    "aialife.png",
    "https://www.aia.co.kr/ko/disclosure/our-products/disclosing-process.html",
  ],

  [
    "처브라이프",
    "chubblife.png",
    "https://www.chubblife.co.kr/front/official/sale/listSale.do",
  ],

  [
    "BNP파리바 카디프생명",
    "cardiflife.png",
    "https://www.cardif.co.kr/disclosure/papag101.do",
  ],

  [
    "푸본현대생명",
    "fubonlife.png",
    "https://www.fubonhyundai.com/#CUSI150102010101",
  ],

  [
    "iM라이프",
    "imlife.png",
    "https://www.imlifeins.co.kr/BA/BA_A020.do",
  ],
];

export default function ProductPublicPage() {
  const [tab, setTab] = useState("nonlife");

  return (
    <main className="min-h-screen bg-gray-100 pb-20">

      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">

          <div className="flex items-center justify-between">

            {/* 뒤로가기 */}
            <Link
              href="/"
              className="
                w-11
                h-11
                rounded-xl
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

            {/* 제목 */}
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

            {/* 오른쪽 균형 */}
            <div className="w-11 h-11" />

          </div>

        </div>
      </header>

      <div className="w-full px-6 py-6 max-w-7xl mx-auto">

        {/* 탭 */}
        <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1 mb-7">

          <button
            onClick={() => setTab("nonlife")}
            className={`rounded-xl py-3 font-bold transition ${
              tab === "nonlife"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            손해보험
          </button>

          <button
            onClick={() => setTab("life")}
            className={`rounded-xl py-3 font-bold transition ${
              tab === "life"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            생명보험
          </button>

        </div>

        {/* 카드 영역 */}
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-6 justify-items-center">

          {tab === "nonlife" &&
            nonlifeCompanies.map(([name, image, link]) => (
              <a
                key={name}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  bg-white
                  rounded-2xl
                  overflow-hidden
                  shadow
                  hover:shadow-lg
                  transition
                  w-full
                  max-w-[200px]
                "
              >
                <img
                  src={`/logos/product-nonlife/${image}`}
                  alt={name}
                  className="w-full object-cover select-none"
                  draggable="false"
                />
              </a>
            ))}

          {tab === "life" &&
            lifeCompanies.map(([name, image, link]) => (
              <a
                key={name}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  bg-white
                  rounded-2xl
                  overflow-hidden
                  shadow
                  hover:shadow-lg
                  transition
                  w-full
                  max-w-[200px]
                "
              >
                <img
                  src={`/logos/product-life/${image}`}
                  alt={name}
                  className="w-full object-cover select-none"
                  draggable="false"
                />
              </a>
            ))}

        </div>

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