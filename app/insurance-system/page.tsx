"use client";

import { useState } from "react";
import Link from "next/link";
import { Monitor, ArrowLeft, Newspaper, MessageCircle } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const nonlifeCompanies = [
  ["DB손해보험", "db.png", "https://www.mdbins.com/chrome.html?ver=202512040353"],
  ["삼성화재", "samsung.png", "https://login.samsungfire.com/nl/p/login/ui/SPGENLP00000"],
  ["한화손해보험", "hanhwa.png", "https://portal.hwgeneralins.com/3rdParty/loginFormPage_v2.jsp?NONCE=iwmKuN0CUA%2Be9S3zIn4WzShJvbqEpDaiGYgQbkuYULVCWnFwGDlI37sAMYCCoH82mUV6NkYAA14Ehyn8ITphPw%3D%3D&UURL=https%3A%2F%2Fportal.hwgeneralins.com%2Fnls3%2Ffcs"],
  ["현대해상", "hyundai.png", "https://sp.hi.co.kr/websquare/websquare.html?w2xPath=/common/xml/Login.xml"],
  ["메리츠화재", "meritz.png", "https://nsso.meritzfire.com/LoginServer/loginFormPageMulti.jsp?InitechEamNoCacheNonce=uY7zsJiF8iacBw6j2o0O8Q%3D%3D"],
  ["롯데손해보험", "lotte.png", "https://lottero.lotteins.co.kr/ncrmwebroot/webfw/html/nawlogon.jsp"],
  ["KB손해보험", "kb.png", "https://nsales.kbinsure.co.kr/eus/ch/ch_index.jsp"],
  ["MG손해보험", "mg.png", "https://mganet.mggeneralins.com/jsp/browserGuide.jsp"],
  ["NH농협손해보험", "nh.png", "https://ss.nhfire.co.kr/smartweb_prj/index_t.jsp"],
  ["하나손해보험", "hana.png", "https://sfa.saleshana.com/wq/login"],
  ["흥국화재", "heungkuk.png", "https://sales.heungkukfire.co.kr/#/login"],
  ["AIG손해보험", "aig.png", "https://sso.aig.co.kr/gaLogin/gaLogin.jsp"],
  ["라이나손해보험", "lina.png", "https://ga.linagi.com/html/gap/GA/GAZ911M0.html"],
];

const lifeCompanies = [
  ["교보생명", "kyobolife.png", "https://sso.kyobo.com:5443/3rdParty/certLoginFormPage.jsp?NONCE=gHk6ZGplEtsGtgsWoWcsZiwKOusJ92LVIE5EwYXVwOhoZxPrj252WxrKKoSxo6HUgCeo5B4colEB6NCbweS2Qw%3D%3D&UURL=https%3A%2F%2Fsso.kyobo.com%3A5443%2Fnls3%2Ffcs"],
  ["신한라이프", "shinhanlife.png", "https://ga.shinhanlife.co.kr:11043/colomga010m.msv"],
  ["메트라이프", "metlifelife.png", "https://metplus.metlife.co.kr/WebCubeSetup.html"],
  ["삼성생명", "samsunglife.png", "https://connectplus.samsunglife.com:10443/gasso/login?contextType=external"],
  ["KDB생명", "kdblife.png", "https://kss.kdblife.co.kr/Install/x_installAX.html"],
  ["KB라이프", "kblife.png", "https://sfa.kblife.co.kr/scr/m/sfa-login?request=sfaLogin"],
  ["흥국생명", "heungkuklife.png", "https://sales.heungkuklife.co.kr/"],
  ["DB생명", "dblife.png", "https://etopia.idblife.com/"],
  ["동양생명", "dongyanglife.png", "https://1004.myangel.co.kr/colgnsf001m.wqv"],
  ["ABL생명", "abllife.png", "https://ga.abllife.co.kr/ui2/login/login.jsp"],
  ["IBK연금보험", "ibklife.png", "https://sf.ibki.co.kr/websquare/websquare.html?w2xPath=/ui/SF/CO/SFCO100M01.xml"],
  ["라이나생명", "linalife.png", "https://ga.lina.co.kr/html/gap/GA/GAZ911M0.html"],
  ["한화생명", "hanhwalife.png", "https://hmp.hanwhalife.com/online/solutions/websquare/websquare.html?w2xPath=/online/ui/uv/gmn/uvgmn010mvw.xml"],
  ["하나생명", "hanalife.png", "https://ga.hanalife.co.kr/solutions/pluginfree/jsp/nppfs.install.jsp"],
  ["미래에셋생명", "miraeassetlife.png", "https://www.loveageplan.com/websquare/websquare.jsp?w2xPath=/view/lap/ui/lg/lga/PLGA010M00.xml"],
  ["NH농협생명", "nhlife.png", "https://sfa.nhlife.co.kr:8443/websquare/websquare.jsp"],
  ["AIA생명", "aialife.png", "https://imap.aia.co.kr/NBSE/aiaone/"],
  ["처브라이프", "chubblife.png", "https://esmart.chubblife.co.kr/index.do"],
  ["카디프생명", "cardiflife.png", "https://ga.cardif.co.kr/login/loginForm.do"],
  ["푸본현대생명", "fubonlife.png", "https://ez.fubonhyundai.com/wsOnl/index.jsp"],
  ["iM라이프", "imlife.png", "https://fgs.dgbfnlife.com:8443/"],
];

export default function InsuranceSystemPage() {
  const [tab, setTab] = useState("nonlife");

  return (
    <main className="min-h-screen bg-gray-100 pb-20">

     {/* 헤더 */}
<header className="bg-white border-b border-black shadow-sm">
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
          <Monitor className="w-7 h-7 text-blue-600" />

          <h1 className="text-2xl font-black text-gray-900">
            보험사 전산
          </h1>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          보험사별 전산 바로가기
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
                  src={`/logos/nonlife/${image}`}
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
                  src={`/logos/life/${image}`}
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