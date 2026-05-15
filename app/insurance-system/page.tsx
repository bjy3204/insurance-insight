"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, ArrowLeft, Newspaper, MessageCircle } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const nonlifeCompanies = [
  { id: "db", name: "DB손해보험", image: "db.png", link: "https://www.mdbins.com/chrome.html?ver=202512040353", browser: "chrome" },
  { id: "samsung", name: "삼성화재", image: "samsung.png", link: "https://login.samsungfire.com/nl/p/login/ui/SPGENLP00000", browser: "edge" },
  { id: "hanhwa", name: "한화손해보험", image: "hanhwa.png", link: "https://portal.hwgeneralins.com/3rdParty/loginFormPage_v2.jsp?NONCE=iwmKuN0CUA%2Be9S3zIn4WzShJvbqEpDaiGYgQbkuYULVCWnFwGDlI37sAMYCCoH82mUV6NkYAA14Ehyn8ITphPw%3D%3D&UURL=https%3A%2F%2Fportal.hwgeneralins.com%2Fnls3%2Ffcs", browser: "edge" },
  { id: "hyundai", name: "현대해상", image: "hyundai.png", link: "https://sp.hi.co.kr/websquare/websquare.html?w2xPath=/common/xml/Login.xml", browser: "chrome" },
  { id: "meritz", name: "메리츠화재", image: "meritz.png", link: "https://nsso.meritzfire.com/LoginServer/loginFormPageMulti.jsp?InitechEamNoCacheNonce=uY7zsJiF8iacBw6j2o0O8Q%3D%3D", browser: "edge" },
  { id: "lotte", name: "롯데손해보험", image: "lotte.png", link: "https://lottero.lotteins.co.kr/ncrmwebroot/webfw/html/nawlogon.jsp", browser: "edge" },
  { id: "kb", name: "KB손해보험", image: "kb.png", link: "https://nsales.kbinsure.co.kr/eus/ch/ch_index.jsp", browser: "chrome" },
  { id: "mg", name: "MG손해보험", image: "mg.png", link: "https://mganet.mggeneralins.com/jsp/browserGuide.jsp", browser: "edge" },
  { id: "nh", name: "NH농협손해보험", image: "nh.png", link: "https://ss.nhfire.co.kr/smartweb_prj/index_t.jsp", browser: "chrome" },
  { id: "hana", name: "하나손해보험", image: "hana.png", link: "https://sfa.saleshana.com/wq/login", browser: "chrome" },
  { id: "heungkuk", name: "흥국화재", image: "heungkuk.png", link: "https://sales.heungkukfire.co.kr/#/login", browser: "edge" },
  { id: "aig", name: "AIG손해보험", image: "aig.png", link: "https://sso.aig.co.kr/gaLogin/gaLogin.jsp", browser: "chrome" },
  { id: "lina", name: "라이나손해보험", image: "lina.png", link: "https://ga.linagi.com/html/gap/GA/GAZ911M0.html", browser: "edge" },
];

const lifeCompanies = [
  { id: "kyobo", name: "교보생명", image: "kyobolife.png", link: "https://sso.kyobo.com:5443/3rdParty/certLoginFormPage.jsp?NONCE=gHk6ZGplEtsGtgsWoWcsZiwKOusJ92LVIE5EwYXVwOhoZxPrj252WxrKKoSxo6HUgCeo5B4colEB6NCbweS2Qw%3D%3D&UURL=https%3A%2F%2Fsso.kyobo.com%3A5443%2Fnls3%2Ffcs", browser: "edge" },
  { id: "shinhan", name: "신한라이프", image: "shinhanlife.png", link: "https://ga.shinhanlife.co.kr:11043/colomga010m.msv", browser: "edge" },
  { id: "metlife", name: "메트라이프", image: "metlifelife.png", link: "https://metplus.metlife.co.kr/WebCubeSetup.html", browser: "chrome" },
  { id: "samsunglife", name: "삼성생명", image: "samsunglife.png", link: "https://connectplus.samsunglife.com:10443/gasso/login?contextType=external", browser: "chrome" },
  { id: "kdb", name: "KDB생명", image: "kdblife.png", link: "https://kss.kdblife.co.kr/Install/x_installAX.html", browser: "chrome" },
  { id: "kblife", name: "KB라이프", image: "kblife.png", link: "https://sfa.kblife.co.kr/scr/m/sfa-login?request=sfaLogin", browser: "edge" },
  { id: "heungkuklife", name: "흥국생명", image: "heungkuklife.png", link: "https://sales.heungkuklife.co.kr/", browser: "edge" },
  { id: "dblife", name: "DB생명", image: "dblife.png", link: "https://etopia.idblife.com/", browser: "edge" },
  { id: "dongyang", name: "동양생명", image: "dongyanglife.png", link: "https://1004.myangel.co.kr/colgnsf001m.wqv", browser: "chrome" },
  { id: "abl", name: "ABL생명", image: "abllife.png", link: "https://ga.abllife.co.kr/ui2/login/login.jsp", browser: "edge" },
  { id: "ibk", name: "IBK연금보험", image: "ibklife.png", link: "https://sf.ibki.co.kr/websquare/websquare.html?w2xPath=/ui/SF/CO/SFCO100M01.xml", browser: "edge" },
  { id: "linalife", name: "라이나생명", image: "linalife.png", link: "https://ga.lina.co.kr/html/gap/GA/GAZ911M0.html", browser: "edge" },
  { id: "hanhwalife", name: "한화생명", image: "hanhwalife.png", link: "https://hmp.hanwhalife.com/online/solutions/websquare/websquare.html?w2xPath=/online/ui/uv/gmn/uvgmn010mvw.xml", browser: "chrome" },
  { id: "hanalife", name: "하나생명", image: "hanalife.png", link: "https://ga.hanalife.co.kr/solutions/pluginfree/jsp/nppfs.install.jsp", browser: "chrome" },
  { id: "miraeasset", name: "미래에셋생명", image: "miraeassetlife.png", link: "https://www.loveageplan.com/websquare/websquare.jsp?w2xPath=/view/lap/ui/lg/lga/PLGA010M00.xml", browser: "edge" },
  { id: "nhlife", name: "NH농협생명", image: "nhlife.png", link: "https://sfa.nhlife.co.kr:8443/websquare/websquare.jsp", browser: "edge" },
  { id: "aia", name: "AIA생명", image: "aialife.png", link: "https://imap.aia.co.kr/NBSE/aiaone/", browser: "edge" },
  { id: "chubb", name: "처브라이프", image: "chubblife.png", link: "https://esmart.chubblife.co.kr/index.do", browser: "edge" },
  { id: "cardif", name: "카디프생명", image: "cardiflife.png", link: "https://ga.cardif.co.kr/login/loginForm.do", browser: "edge" },
  { id: "fubon", name: "푸본현대생명", image: "fubonlife.png", link: "https://ez.fubonhyundai.com/wsOnl/index.jsp", browser: "edge" },
  { id: "imlife", name: "iM라이프", image: "imlife.png", link: "https://fgs.dgbfnlife.com:8443/", browser: "edge" },
];

function CompanyCard({ company, type }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: company.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <a
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      href={company.link}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group
        relative
        w-full
        h-[150px]
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        cursor-grab
        active:cursor-grabbing
        transition-all
        duration-300
        flex
        items-center
        justify-center
        hover:-translate-y-1
        hover:border-gray-300
        hover:[box-shadow:inset_0_3px_14px_rgba(0,0,0,0.11),0_10px_20px_rgba(0,0,0,0.06)]
      "
    >
      <img
        src={
          company.browser === "chrome"
            ? "/icons/chrome.png"
            : "/icons/edge.png"
        }
        alt={company.browser}
        className="
          absolute
          top-3
          left-3
          w-6
          h-6
          opacity-0
          scale-90
          transition-all
          duration-300
          group-hover:opacity-100
          group-hover:scale-100
        "
        draggable="false"
      />

      <img
        src={`/logos/${type}/${company.image}`}
        alt={company.name}
        className="
          max-w-[180px]
          max-h-[90px]
          object-contain
          select-none
          transition-all
          duration-300
          group-hover:scale-[0.98]
        "
        draggable="false"
      />
    </a>
  );
}

export default function InsuranceSystemPage() {
  const [tab, setTab] = useState("nonlife");

  const [nonlifeItems, setNonlifeItems] = useState(nonlifeCompanies);
  const [lifeItems, setLifeItems] = useState(lifeCompanies);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    const savedNonlife = localStorage.getItem("nonlife-order");
    const savedLife = localStorage.getItem("life-order");

    if (savedNonlife) {
      const order = JSON.parse(savedNonlife);

      const sorted = order
        .map((id: string) => nonlifeCompanies.find((item) => item.id === id))
        .filter(Boolean);

      const missing = nonlifeCompanies.filter(
        (item) => !order.includes(item.id)
      );

      setNonlifeItems([...sorted, ...missing]);
    }

    if (savedLife) {
      const order = JSON.parse(savedLife);

      const sorted = order
        .map((id: string) => lifeCompanies.find((item) => item.id === id))
        .filter(Boolean);

      const missing = lifeCompanies.filter(
        (item) => !order.includes(item.id)
      );

      setLifeItems([...sorted, ...missing]);
    }
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (tab === "nonlife") {
      const oldIndex = nonlifeItems.findIndex((item) => item.id === active.id);
      const newIndex = nonlifeItems.findIndex((item) => item.id === over.id);

      const updated = arrayMove(nonlifeItems, oldIndex, newIndex);

      setNonlifeItems(updated);
      localStorage.setItem(
        "nonlife-order",
        JSON.stringify(updated.map((item) => item.id))
      );
    }

    if (tab === "life") {
      const oldIndex = lifeItems.findIndex((item) => item.id === active.id);
      const newIndex = lifeItems.findIndex((item) => item.id === over.id);

      const updated = arrayMove(lifeItems, oldIndex, newIndex);

      setLifeItems(updated);
      localStorage.setItem(
        "life-order",
        JSON.stringify(updated.map((item) => item.id))
      );
    }
  };

  const currentItems = tab === "nonlife" ? nonlifeItems : lifeItems;

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
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

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Monitor className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  보험사 전산
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                전산 카드를 드래그해 원하는 위치로 이동해 보세요 !
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentItems.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-y-5 gap-x-8 place-items-stretch">
              {currentItems.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  type={tab === "nonlife" ? "nonlife" : "life"}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

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