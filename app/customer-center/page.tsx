"use client";

import { useState } from "react";


import {
  ArrowLeft,
  Phone,
  Search,
  Home,
  Printer,
  MapPin,
  Mail,
} from "lucide-react";

const nonlifeCompanies = [
  {
    name: "DB손해보험",
    logo: "/logos/customer-nonlife/db.png",
    claim: "https://www.idbins.com/pc/bizxpress/ct/dc/FWCUSV1301.shtm",
    claimPdf: "/claims/nonlife/db.pdf",
    phone: "1588-0100",
    fax: "0505-181-4862",
    zipcode: "54966",
    address: "전북 전주시 완산구 서원로 99, 전주우체국 사서함 15호 DB손해보험 사고접수팀",
  },
  {
    name: "삼성화재",
    logo: "/logos/customer-nonlife/samsung.png",
    claim: "https://www.samsungfire.com/v2/html/claim/01/C_010_030_001.html",
    claimPdf: "/claims/nonlife/samsung.pdf",
    phone: "1588-5114",
    fax: "0505-162-0872",
    zipcode: "07275",
    address: "서울 영등포구 영등포로5길 19, 동아프라임밸리 504호 삼성화재 장기보험접수팀",
  },
  {
    name: "한화손해보험",
    logo: "/logos/customer-nonlife/hanhwa.png",
    claim: "https://www.hwgeneralins.com/fplaza/compensation/receipt01.do",
    claimPdf: "/claims/nonlife/hanhwa.pdf",
    phone: "1566-8000",
    fax: "0505-779-1004",
    zipcode: "04386",
    address: "서울시 용산구 한강대로 38길 35, 태승빌딩 4층 장기보험접수팀",
  },
  {
    name: "현대해상",
    logo: "/logos/customer-nonlife/hyundai.png",
    claim: "https://www.hi.co.kr/serviceAction.do?menuId=100631",
    claimPdf: "/claims/nonlife/hyundai.pdf",
    phone: "1588-5656",
    fax: "0507-162-0872",
    zipcode: "07275",
    address: "서울 영등포구 영등포로5길 19, 동아프라임밸리 504호 삼성화재 장기보험접수팀",
  },
  {
    name: "메리츠화재",
    logo: "/logos/customer-nonlife/meritz.png",
    claim: "https://www.meritzfire.com/compensation/longterm-insurance/request-document.do#!/",
    claimPdf: "/claims/nonlife/meritz.pdf",
    phone: "1566-7711",
    fax: "0505-021-3400",
    zipcode: "14623",
    address: "경기도 부천시 원미구 송내대로 80, 6층 사고접수파트",
  },
  {
    name: "롯데손해보험",
    logo: "/logos/customer-nonlife/lotte.png",
    claim: "https://lotteins.co.kr/web/C/D/C/cdc_claim_0502.jsp",
    claimPdf: "/claims/nonlife/lotte.pdf",
    phone: "1588-3344",
    fax: "0504-800-0700",
    zipcode: "07254",
    address: "서울특별시 영등포구 버드나루로2길 7(영등포동2가) 흥국생명빌딩 9층 접수담당자",
  },
  {
    name: "KB손해보험",
    logo: "/logos/customer-nonlife/kb.png",
    claim: "https://www.kbinsure.co.kr/CG205020001.ec",
    claimPdf: "/claims/nonlife/kb.pdf",
    phone: "1544-0114",
    fax: "0505-136-6500",
    zipcode: "04027",
    address: "서울시 마포구 양화로 19(합정동) KB손해보험 합정빌딩 19층 인보험사고접수센터",
  },
  {
    name: "MG손해보험",
    logo: "/logos/customer-nonlife/mg.png",
    claim: "https://www.yebyeol.co.kr/RW031010DM.scp?menuId=MN0501020",
    claimPdf: "/claims/nonlife/mg.pdf",
    phone: "1588-5959",
    fax: "0505-088-1646",
    zipcode: "07294",
    address: "서울시 영등포구 문래북로 56, 하스오토메이션코리아 6층 예별손해보험(주) 장기보험금 접수처",
  },
  {
    name: "NH농협손해보험",
    logo: "/logos/customer-nonlife/nh.png",
    claim: "https://www.nhfire.co.kr/customer/bilgdcm/retrieveBilgDcmList.nhfire",
    claimPdf: "/claims/nonlife/nh.pdf",
    phone: "1644-9000",
    fax: "0505-060-7000",
    zipcode: "03736",
    address: "서울특별시 서대문구 경기대로58, 경기빌딩 503호 농협손해보험 사고접수팀",
  },
  {
    name: "하나손해보험",
    logo: "/logos/customer-nonlife/hana.png",
    claim: "https://www.hanainsure.co.kr/w/claim/healthReward/rewardDocCarGuide",
    claimPdf: "/claims/nonlife/hana.pdf",
    phone: "1566-3000",
    fax: "0504-3764-0765",
    zipcode: "03137",
    address: "서울 종로구 창경궁로 117(하나손해보험빌딩, 인의동) 6층 장기일반 보상접수센터",
  },
  {
    name: "흥국화재",
    logo: "/logos/customer-nonlife/heungkuk.png",
    claim: "https://www.heungkukfire.co.kr/FRW/compensation/accidentDocInfo.do",
    claimPdf: "/claims/nonlife/heungkuk.pdf",
    phone: "1688-1688",
    fax: "0504-800-0700",
    zipcode: "07254",
    address: "서울특별시 영등포구 버드나루로2길 7(영등포동2가) 흥국생명빌딩 9층 접수담당자",
  },
  {
    name: "AIG손해보험",
    logo: "/logos/customer-nonlife/aig.png",
    claim: "https://www.aig.co.kr/wm/content.html?contentId=DPWMS406&menuId=MS406",
    claimPdf: "/claims/nonlife/aig.pdf",
    phone: "1544-2792",
    fax: "02-2011-4607",
    zipcode: "57987",
    address: "전남 순천시 순천우체국사서함 28",
  },
  {
    name: "라이나손해보험",
    logo: "/logos/customer-nonlife/lina.png",
    claim: "https://www.chubb.com/kr-kr/claims/report-a-claim.html",
    claimPdf: "/claims/nonlife/lina.pdf",
    phone: "1566-5800",
    fax: "02-6742-3992",
    zipcode: "03187",
    address: "서울시 종로구 종로 6 광화문우체국 사서함 386(서린동)",
  },
];
const lifeCompanies = [
  {
    name: "교보생명",
    logo: "/logos/customer-life/kyobolife.png",
    claim: "https://www.kyobo.com/dgt/web/customer/support/need-papers/list",
    claimPdf: "/claims/life/kyobolife.pdf",
    phone: "1588-1001",
    fax: "고객센터 문의",
    zipcode: "07291",
    address:
      "서울시 영등포구 영등포로 96 교보생명빌딩, 6층 교보생명 사고보험금 우편청구 담당자 앞",
  },

  {
    name: "신한라이프",
    logo: "/logos/customer-life/shinhanlife.png",
    claim: "https://www.shinhanlife.co.kr/hp/cdhf0020t02.do",
    claimPdf: "/claims/life/shinhanlife.pdf",
    phone: "1588-5580",
    fax: "고객센터 문의",
    zipcode: "04535",
    address:
      "서울특별시 중구 소공로 70 서울중앙우체국 사서함 160호 신한라이프 보험금접수 담당자 앞",
  },

  {
    name: "메트라이프",
    logo: "/logos/customer-life/metlifelife.png",
    claim: "https://cyber.metlife.co.kr/claim/requiredDocumentNotice",
    claimPdf: "/claims/life/metlifelife.pdf",
    phone: "1588-9600",
    fax: "02-3469-9428",
    zipcode: "06211",
    address:
      "서울특별시 강남구 테헤란로 316 메트라이프타워 클레임서비스팀",
  },

  {
    name: "삼성생명",
    logo: "/logos/customer-life/samsunglife.png",
    claim: "https://www.samsunglife.com/individual/mysamsunglife/insurance/internet/MDP-MYINT020110M",
    claimPdf: "/claims/life/samsunglife.pdf",
    phone: "1588-3114",
    fax: "고객센터 문의",
    zipcode: "",
    address: "부산우체국 사서함 189 삼성생명 사고보험금 접수 담당",
  },

  {
    name: "KDB생명",
    logo: "/logos/customer-life/kdblife.png",
    claim: "https://www.kdblife.co.kr/ajax.do?scrId=HCSCT006M01P",
    claimPdf: "/claims/life/kdblife.pdf",
    phone: "1588-4040",
    fax: "02-2669-7939",
    zipcode: "07261",
    address:
      "서울시 영등포구 양산로 91, 리드원지식산업센터 210호 파란손해사정 KDB생명 우편청구 담당자(앞)",
  },

  {
    name: "KB라이프",
    logo: "/logos/customer-life/kblife.png",
    claim: "https://www.kblife.co.kr/customer-center/informRequiredDocument.do",
    claimPdf: "/claims/life/kblife.pdf",
    phone: "1588-3374",
    fax: "02-6220-9912",
    zipcode: "06253",
    address:
      "서울시 강남구 강남대로 298 KB라이프생명 고객플라자 보험금접수 담당자 앞",
  },

  {
    name: "흥국생명",
    logo: "/logos/customer-life/heungkuklife.png",
    claim: "https://www.heungkuklife.co.kr/jsps/front/help/customer_require_tab.jsp",
    claimPdf: "/claims/life/heungkuklife.pdf",
    phone: "1588-2288",
    fax: "고객센터 문의",
    zipcode: "07254",
    address:
      "서울특별시 영등포구 버드나루로 2길7(영등포동2가) 2층 흥국생명 사고접수센터",
  },

  {
    name: "DB생명",
    logo: "/logos/customer-life/dblife.png",
    claim: "https://www.idblife.com/support/guide/acbf_clm",
    claimPdf: "/claims/life/dblife.pdf",
    phone: "1588-3131",
    fax: "0505-129-3134",
    zipcode: "04799",
    address:
      "서울시 성동구 아차산로 17길 48, SK V1 401호 DB생명 보험금 접수 담당자",
  },

  {
    name: "동양생명",
    logo: "/logos/customer-life/dongyanglife.png",
    claim: "https://www.myangel.co.kr/indvins/acctClapdClmNtc",
    claimPdf: "/claims/life/dongyanglife.pdf",
    phone: "1577-1004",
    fax: "02-3289-4517",
    zipcode: "28510",
    address:
      "충청북도 청주시 상당구 상당로 126 수협은행 덕일빌딩 2층 동양생명 접수처",
  },

  {
    name: "ABL생명",
    logo: "/logos/customer-life/abllife.png",
    claim: "https://www.abllife.co.kr/st/custDesk/insSrvcGudn/acdtInsmClamGudn/acdtInsmClamGudn3?page=index",
    claimPdf: "/claims/life/abllife.pdf",
    phone: "1588-6500",
    fax: "02-3299-5544",
    zipcode: "03116",
    address:
      "서울특별시 종로구 종로400, 8층(숭인동, ABL타워) 사고보험금담당자",
  },

  {
    name: "IBK연금보험",
    logo: "/logos/customer-life/ibklife.png",
    claim: "https://www.ibki.co.kr/process/HP_CSCETR_POSN_DOC_INS_LIST?bltb_cod=SC000014&sctn=in&TAB=in",
    claimPdf: "/claims/life/ibklife.pdf",
    phone: "1577-4117",
    fax: "02-2270-1577",
    zipcode: "04511",
    address:
      "서울 중구 칠패로 37, 17층 IBK연금보험 고객서비스부",
  },

  {
    name: "라이나생명",
    logo: "/logos/customer-life/linalife.png",
    claim: "https://www.lina.co.kr/cyber/accident-insurance/document-zero",
    claimPdf: "/claims/life/linalife.pdf",
    phone: "1588-0058",
    fax: "02-6944-1200",
    zipcode: "03156",
    address:
      "서울특별시 종로구 삼봉로 48 (청진동 188) 라이나타워 18층 보험금심사팀",
  },

  {
    name: "한화생명",
    logo: "/logos/customer-life/hanhwalife.png",
    claim: "https://www.hanwhalife.com/static/main/myPage/insurance/accident/document/MY_INAPADC_T10000.jsp",
    claimPdf: "/claims/life/hanhwalife.pdf",
    phone: "1588-6363",
    fax: "고객센터 문의",
    zipcode: "04513",
    address:
      "서울시 중구 세종대로 39, 서울 상공회의소 6층 한화생명 사고보험금 우편청구 심사담당자 앞",
  },

  {
    name: "하나생명",
    logo: "/logos/customer-life/hanalife.png",
    claim: "https://www.hanalife.co.kr/csc/accidentGuideRenew/accidentPaymentDocument.do",
    claimPdf: "/claims/life/hanalife.pdf",
    phone: "1577-1112",
    fax: "고객센터 문의",
    zipcode: "04538",
    address:
      "서울특별시 중구 을지로 66 하나생명 보험금 접수 담당",
  },

  {
    name: "미래에셋생명",
    logo: "/logos/customer-life/miraeassetlife.png",
    claim: "https://life.miraeasset.com/home/index.do#MO-HO-030501-010000",
    claimPdf: "/claims/life/miraeassetlife.pdf",
    phone: "1588-0220",
    fax: "고객센터 문의",
    zipcode: "07208",
    address:
      "서울시 영등포구 선유로49길 23, 아이에스비즈타워 2차 12층 에이원손해사정 미래에셋생명팀",
  },

  {
    name: "NH농협생명",
    logo: "/logos/customer-life/nhlife.png",
    claim: "https://www.nhlife.co.kr/ho/cc/HOCC0010M00.nhl",
    claimPdf: "/claims/life/nhlife.pdf",
    phone: "1544-4000",
    fax: "02-6971-6040",
    zipcode: "04156",
    address:
      "서울특별시 마포구 마포대로 89 서울마포우체국 사서함 13호 NH농협생명 지급심사 정보입력팀(미래)",
  },

  {
    name: "AIA생명",
    logo: "/logos/customer-life/aialife.png",
    claim: "https://www.aia.co.kr/ko/customer-support/customer-guide/forms/claims.html",
    claimPdf: "/claims/life/aialife.pdf",
    phone: "1588-9898",
    fax: "02-2021-4540",
    zipcode: "04511",
    address:
      "서울시 중구 통일로 2길 16(순화동 216) AIA타워 25층 AIA생명 보험금팀",
  },

  {
    name: "처브라이프",
    logo: "/logos/customer-life/chubblife.png",
    claim: "https://www.chubblife.co.kr/front/ctmcenter/insurance/listDocu.do",
    claimPdf: "/claims/life/chubblife.pdf",
    phone: "1599-4600",
    fax: "02-3480-7801",
    zipcode: "06162",
    address:
      "서울특별시 강남구 테헤란로 401, 11층 (삼성동, 남경센타) 처브라이프생명 보험금지급팀",
  },

  {
    name: "BNP파리바 카디프생명",
    logo: "/logos/customer-life/cardiflife.png",
    claim: "https://www.cardif.co.kr/mycardif/ch/agt/chagt001.do",
    claimPdf: "/claims/life/cardiflife.pdf",
    phone: "1688-1118",
    fax: "02-3788-8939",
    zipcode: "04637",
    address:
      "서울특별시 영등포구 국회대로 612 7층, 11층 BNP파리바 카디프생명 보험금 담당자 앞",
  },

  {
    name: "푸본현대생명",
    logo: "/logos/customer-life/fubonlife.png",
    claim: "https://www.fubonhyundai.com/#CUSI070100000000",
    claimPdf: "/claims/life/fubonlife.pdf",
    phone: "1577-3311",
    fax: "0505-106-0311",
    zipcode: "07327",
    address:
      "서울시 영등포구 여의나루로57 푸본현대생명 보험금팀",
  },

  {
    name: "iM라이프",
    logo: "/logos/customer-life/imlife.png",
    claim: "https://www.imlifeins.co.kr/BB/BB_D010.do",
    claimPdf: "/claims/life/imlife.pdf",
    phone: "1588-4770",
    fax: "0505-083-5420",
    zipcode: "07261",
    address:
      "서울특별시 영등포구 양산로 91 리드원지식산업센터 3층 310호 iM라이프생명보험 보험금 접수센터",
  },
];
const mutualCompanies = [
  {
    name: "우체국보험",
    logo: "/logos/customer-mutual/epost.png",
    claim: "https://epostlife.go.kr/PYIMRD0002.do",
    phone: "1599-0100",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "MG새마을금고",
    logo: "/logos/customer-mutual/mg.png",
    claim: "https://insure.kfcc.co.kr/#/PGE_IHG_00039",
    phone: "1599-9010",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "신협",
    logo: "/logos/customer-mutual/cu.png",
    claim: "https://openbank.cu.co.kr/",
    phone: "1544-3030",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "수협",
    logo: "/logos/customer-mutual/suhyup.png",
    claim: "https://www.suhyup-bank.com/",
    phone: "1588-4119",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "THE K 손해보험",
    logo: "/logos/customer-mutual/thek.png",
    claim: "https://www.ktcu.or.kr/PPW-CSA-100101",
    phone: "1577-3993",
    fax: "",
zipcode: "",
address: "",
  },
];

const etcCompanies = [
  {
    name: "Carrot",
    logo: "/logos/customer-etc/carrot.png",
    claim:
      "https://www.carrotins.com/desktop/reward/claim/guide/",
    phone: "1566-0300",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "AXA",
    logo: "/logos/customer-etc/axa.png",
    claim: "https://www.axa.co.kr/cui/cmk/cl/CMKCLL02M01.html",
    phone: "1588-5114",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "카카오페이손해보험",
    logo: "/logos/customer-etc/kakaopay.png",
    claim: "https://kakaopayinscorp.co.kr/",
    phone: "1544-0022",
    fax: "",
zipcode: "",
address: "",
  },

  {
    name: "신한EZ손해보험",
    logo: "/logos/customer-etc/shinhanez.png",
    claim: "https://www.shinhanez.co.kr/static/man/MAIN0000M01.html",
    phone: "1544-2580",
    fax: "",
zipcode: "",
address: "",
  },
];

export default function CustomerCenterPage() {
  const [search, setSearch] = useState("");
const [tab, setTab] = useState("nonlife");
const [selectedCompany, setSelectedCompany] = useState<any>(null);

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
    ? allCompanies.filter((company) =>
        company.name
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : currentCompanies;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">

     {/* 헤더 */}
<header className="sticky top-0 z-50 bg-white border-b shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-6">

    <div className="flex items-center justify-between">

      <a
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
</a>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Phone className="w-7 h-7 text-blue-600" />

          <h1 className="text-2xl font-black text-gray-900">
            보험사 고객센터
          </h1>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          고객센터 · 팩스번호 · 등기주소 안내
        </p>
      </div>

      <div className="w-11 h-11" />

    </div>

  </div>
</header>

      <section className="max-w-7xl mx-auto px-5 py-6">

        {/* 검색 */}
        <div className="bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 mb-5">
          <Search className="w-5 h-5 text-gray-400" />

          <input
            placeholder="보험사명을 검색하세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>

        {/* 탭 */}
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

        {/* 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {filteredCompanies.map((company) => (
            <div
              key={company.name}
              className="
                bg-white
                rounded-3xl
                p-5
                border
                border-gray-200
                shadow-sm
              "
            >

              {/* 상단 */}
              <div className="flex items-center justify-between mb-5">

                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-32 h-12 object-contain"
                />

                <div className="flex items-center gap-2">

  {/* 청구사이트 */}
  <a
    href={company.claim}
    target="_blank"
    title="청구서류 사이트"
    className="
      w-11
      h-11
      text-black
      flex
      items-center
      justify-center
      shrink-0
    "
  >
    <Home className="w-5 h-5" />
  </a>

  

</div>

              </div>

              {/* 고객센터 */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-5">

                <p className="text-sm text-gray-500 mb-1">
                  고객센터
                </p>

                <div className="flex items-center justify-between gap-3">

                  <p className="text-3xl font-black text-blue-600">
                    {company.phone}
                  </p>

                  <a
                    href={`tel:${company.phone}`}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-blue-600
                      px-4
                      py-3
                      text-white
                      text-sm
                      font-bold
                      shrink-0
                    "
                  >
                    <Phone className="w-4 h-4" />
                    전화걸기
                  </a>

                </div>

              </div>

              {/* 정보 */}
<div className="space-y-5">

  {company.fax && (
    <div className="flex gap-3">
      <Printer className="w-5 h-5 text-gray-400 mt-1 shrink-0" />

      <div>
        <p className="text-sm text-gray-400 mb-1">
          팩스번호
        </p>

        <p className="text-lg font-bold text-gray-800">
          {company.fax}
        </p>
      </div>
    </div>
  )}

  {company.address && (
  <>
    <div className="flex gap-3">
      <MapPin className="w-5 h-5 text-gray-400 mt-1 shrink-0" />

      <div>
        <p className="text-sm text-gray-400 mb-1">
          주소
        </p>

        <p className="text-base font-semibold text-gray-800 leading-relaxed min-h-[96px]">
          ({company.zipcode}) {company.address}
        </p>
      </div>
    </div>

    <button
      onClick={() => setSelectedCompany(company)}
      className="
        w-full
        h-12
        rounded-xl
        bg-gray-50
        text-gray-700
        text-sm
        font-bold
        flex
        items-center
        justify-center
        transition-all
        duration-200
        hover:bg-gray-100
        hover:shadow-md
        hover:-translate-y-0.5
      "
    >
      청구서
    </button>
  </>
)}

</div>

            </div>
          ))}

        </div>

      </section>
{/* 청구서 팝업 */}
{selectedCompany && (
  <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">

    <div className="bg-white w-full max-w-5xl h-[92vh] rounded-xl overflow-hidden shadow-2xl">

      {/* 상단 */}
      <div className="h-14 border-b flex items-center justify-between px-5">

        <p className="text-sm font-semibold text-gray-900">
          {selectedCompany.name}
        </p>

        <button
          onClick={() => setSelectedCompany(null)}
          className="text-3xl font-light text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

      </div>

      {/* 내용 */}
      <div className="h-[calc(92vh-56px)] overflow-y-auto px-6 py-7">

        

        {/* PDF */}
        <iframe
          src={selectedCompany.claimPdf}
          className="w-full h-[1200px] rounded-lg border-0"
        />

      </div>

    </div>

  </div>
)}
    </main>
  );
}