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
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Monitor,
  ArrowLeft,
  Newspaper,
  MessageCircle,
  Settings,
  
  Star,
  
} from "lucide-react";
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

type Company = {
  id: string;
  name: string;
  image: string;
  link: string;
  browser: string;
};

type InsuranceTab = "nonlife" | "life";
type ManageMode = "favorite" | "sort";

function CompanyCard({
  company,
  type,
  favorite,
  showStar = false,
  onToggleFavorite,
  disableLink = false,
}: {
  company: Company;
  type: InsuranceTab;
  favorite?: boolean;
  showStar?: boolean;
  onToggleFavorite?: () => void;
  disableLink?: boolean;
}) {
  const CardTag: any = disableLink ? "div" : "a";

  return (
    <CardTag
      href={disableLink ? undefined : company.link}
      target={disableLink ? undefined : "_blank"}
      rel={disableLink ? undefined : "noopener noreferrer"}
      className="
        group relative bg-white rounded-3xl h-36 md:h-40 px-3 md:px-5
        border border-gray-200 shadow-sm transition-all duration-200
        flex items-center justify-center animate-in fade-in zoom-in-95
        cursor-default
        hover:-translate-y-1 hover:border-gray-300 hover:shadow-md
      "
    >
      {showStar && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="
            absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full
            flex items-center justify-center
            hover:bg-gray-100 hover:ring-1 hover:ring-gray-200
            transition cursor-default
          "
        >
          <Star
            className={`w-5 h-5 transition ${
              favorite
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 fill-gray-300"
            }`}
          />
        </button>
      )}

      <img
        src={company.browser === "chrome" ? "/icons/chrome.png" : "/icons/edge.png"}
        alt={company.browser}
        className="
          absolute top-3 left-3 w-6.5 h-6.5 md:w-7 md:h-7 opacity-100 scale-100
          md:opacity-0 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100
          transition-all duration-300
        "
        draggable="false"
      />

      <img
        src={`/logos/${type}/${company.image}`}
        alt={company.name}
        className="
          max-w-[160px] max-h-[62px] md:max-w-[180px] md:max-h-[72px]
          object-contain select-none transition-all duration-300
        "
        draggable="false"
      />
    </CardTag>
  );
}

function SortableCompanyCard({
  company,
  type,
  starActive = false,
  showStar = false,
  onToggleFavorite,
  disabled = false,
}: {
  company: Company;
  type: InsuranceTab;
  starActive?: boolean;
  showStar?: boolean;
  onToggleFavorite?: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: company.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-default"
    >
      <div
        className={`
          group relative bg-white rounded-3xl h-36 md:h-40 px-3 md:px-5
          border border-gray-200 shadow-sm flex items-center justify-center
          transition-all duration-200 cursor-default
          animate-in fade-in zoom-in-95
          ${
            isDragging
              ? "z-50 shadow-2xl scale-[1.02]"
              : "hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
          }
        `}
      >
        {showStar && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="
              absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full
              flex items-center justify-center
              hover:bg-gray-100 hover:ring-1 hover:ring-gray-200
              transition cursor-default
            "
          >
            <Star
              className={`w-5 h-5 transition ${
                starActive
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 fill-gray-300"
              }`}
            />
          </button>
        )}

        <img
          src={company.browser === "chrome" ? "/icons/chrome.png" : "/icons/edge.png"}
          alt={company.browser}
          className="absolute top-3 left-3 w-6.5 h-6.5 md:w-7 md:h-7 opacity-100 transition-all duration-300"
          draggable="false"
        />

        <img
          src={`/logos/${type}/${company.image}`}
          alt={company.name}
          className="max-w-[160px] max-h-[62px] md:max-w-[180px] md:max-h-[72px] object-contain select-none"
          draggable="false"
        />
      </div>
    </div>
  );
}

export default function InsuranceSystemPage() {
  const [tab, setTab] = useState<InsuranceTab>("nonlife");
  const [settingOpen, setSettingOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageMode, setManageMode] = useState<ManageMode>("favorite");
  const [manageTab, setManageTab] = useState<InsuranceTab>("nonlife");

  const [nonlifeItems, setNonlifeItems] = useState<Company[]>(nonlifeCompanies);
  const [lifeItems, setLifeItems] = useState<Company[]>(lifeCompanies);

  const [tempNonlifeItems, setTempNonlifeItems] = useState<Company[]>(nonlifeCompanies);
  const [tempLifeItems, setTempLifeItems] = useState<Company[]>(lifeCompanies);

  const [nonlifeFavorites, setNonlifeFavorites] = useState<string[]>([]);
  const [lifeFavorites, setLifeFavorites] = useState<string[]>([]);
  const [tempNonlifeFavorites, setTempNonlifeFavorites] = useState<string[]>([]);
  const [tempLifeFavorites, setTempLifeFavorites] = useState<string[]>([]);

  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState<null | {
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  const sortByFavorites = (items: Company[], favorites: string[]) => {
    return [...items].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);

      if (aFav !== bFav) return aFav ? -1 : 1;
      return 0;
    });
  };

  useEffect(() => {
    const savedNonlifeOrder = localStorage.getItem("nonlife-order");
    const savedLifeOrder = localStorage.getItem("life-order");
    const savedNonlifeFavorites = localStorage.getItem("nonlife-favorites");
    const savedLifeFavorites = localStorage.getItem("life-favorites");

    const parsedNonlifeFavorites = savedNonlifeFavorites
      ? JSON.parse(savedNonlifeFavorites)
      : [];

    const parsedLifeFavorites = savedLifeFavorites
      ? JSON.parse(savedLifeFavorites)
      : [];

    setNonlifeFavorites(parsedNonlifeFavorites);
    setLifeFavorites(parsedLifeFavorites);
    setTempNonlifeFavorites(parsedNonlifeFavorites);
    setTempLifeFavorites(parsedLifeFavorites);

    if (savedNonlifeOrder) {
      const order = JSON.parse(savedNonlifeOrder);

      const sorted = order
        .map((id: string) => nonlifeCompanies.find((item) => item.id === id))
        .filter(Boolean);

      const missing = nonlifeCompanies.filter((item) => !order.includes(item.id));
      const nextItems = [...sorted, ...missing] as Company[];

      setNonlifeItems(nextItems);
      setTempNonlifeItems(nextItems);
    }

    if (savedLifeOrder) {
      const order = JSON.parse(savedLifeOrder);

      const sorted = order
        .map((id: string) => lifeCompanies.find((item) => item.id === id))
        .filter(Boolean);

      const missing = lifeCompanies.filter((item) => !order.includes(item.id));
      const nextItems = [...sorted, ...missing] as Company[];

      setLifeItems(nextItems);
      setTempLifeItems(nextItems);
    }
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setSettingOpen(false);
    };

    if (settingOpen) {
      window.addEventListener("click", handleClick);
    }

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [settingOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo) return;

      setPopupPosition({
        x: dragInfo.originX + e.clientX - dragInfo.startX,
        y: dragInfo.originY + e.clientY - dragInfo.startY,
      });
    };

    const handleMouseUp = () => {
      setDragInfo(null);
    };

    if (dragInfo) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragInfo]);

  const getCurrentItems = (targetTab: InsuranceTab) =>
    targetTab === "nonlife" ? nonlifeItems : lifeItems;

  const getCurrentFavorites = (targetTab: InsuranceTab) =>
    targetTab === "nonlife" ? nonlifeFavorites : lifeFavorites;

  const getTempItems = (targetTab: InsuranceTab) =>
    targetTab === "nonlife" ? tempNonlifeItems : tempLifeItems;

  const getTempFavorites = (targetTab: InsuranceTab) =>
    targetTab === "nonlife" ? tempNonlifeFavorites : tempLifeFavorites;

  const currentItems = useMemo(() => {
    return sortByFavorites(getCurrentItems(tab), getCurrentFavorites(tab));
  }, [tab, nonlifeItems, lifeItems, nonlifeFavorites, lifeFavorites]);

  const tempCurrentItems = useMemo(() => {
    return sortByFavorites(getTempItems(manageTab), getTempFavorites(manageTab));
  }, [
    manageTab,
    tempNonlifeItems,
    tempLifeItems,
    tempNonlifeFavorites,
    tempLifeFavorites,
  ]);

  const openManagePopup = (mode: ManageMode) => {
    setManageMode(mode);
    setManageTab(tab);
    setTempNonlifeItems(nonlifeItems);
    setTempLifeItems(lifeItems);
    setTempNonlifeFavorites(nonlifeFavorites);
    setTempLifeFavorites(lifeFavorites);
    setPopupPosition({ x: 0, y: 0 });
    setManageOpen(true);
    setSettingOpen(false);
  };

  const cancelManageChanges = () => {
  setTempNonlifeItems(nonlifeItems);
  setTempLifeItems(lifeItems);
  setTempNonlifeFavorites(nonlifeFavorites);
  setTempLifeFavorites(lifeFavorites);
};



  const closeManagePopup = () => {
  cancelManageChanges();
  setManageOpen(false);
};

  const saveManageChanges = () => {
    setNonlifeItems(tempNonlifeItems);
    setLifeItems(tempLifeItems);
    setNonlifeFavorites(tempNonlifeFavorites);
    setLifeFavorites(tempLifeFavorites);

    localStorage.setItem(
      "nonlife-order",
      JSON.stringify(tempNonlifeItems.map((item) => item.id))
    );
    localStorage.setItem(
      "life-order",
      JSON.stringify(tempLifeItems.map((item) => item.id))
    );
    localStorage.setItem("nonlife-favorites", JSON.stringify(tempNonlifeFavorites));
    localStorage.setItem("life-favorites", JSON.stringify(tempLifeFavorites));

   
    setSaveConfirmOpen(true);
  };

  const toggleTempFavorite = (companyId: string) => {
    if (manageTab === "nonlife") {
      setTempNonlifeFavorites((prev) =>
        prev.includes(companyId)
          ? prev.filter((id) => id !== companyId)
          : [companyId, ...prev]
      );
      return;
    }

    setTempLifeFavorites((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [companyId, ...prev]
    );
  };

  const handleTempSortDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (manageTab === "nonlife") {
      setTempNonlifeItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });

      return;
    }

    setTempLifeItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleFavoriteDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  if (manageTab === "nonlife") {
    setTempNonlifeItems((items) => {
      const favoriteIds = tempNonlifeFavorites;
      const favoriteItems = items.filter((item) =>
        favoriteIds.includes(item.id)
      );
      const normalItems = items.filter(
        (item) => !favoriteIds.includes(item.id)
      );

      const oldIndex = favoriteItems.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = favoriteItems.findIndex(
        (item) => item.id === over.id
      );

      return [...arrayMove(favoriteItems, oldIndex, newIndex), ...normalItems];
    });

    return;
  }

  setTempLifeItems((items) => {
    const favoriteIds = tempLifeFavorites;
    const favoriteItems = items.filter((item) =>
      favoriteIds.includes(item.id)
    );
    const normalItems = items.filter(
      (item) => !favoriteIds.includes(item.id)
    );

    const oldIndex = favoriteItems.findIndex(
      (item) => item.id === active.id
    );
    const newIndex = favoriteItems.findIndex(
      (item) => item.id === over.id
    );

    return [...arrayMove(favoriteItems, oldIndex, newIndex), ...normalItems];
  });
};

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white border-b border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="
                absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl
                border border-gray-300 bg-white flex items-center justify-center
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
                오른쪽 상단 설정에서 즐겨찾기와 위치변경을 설정하세요
              </p>
            </div>

            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 ${
                settingOpen ? "z-[1000]" : "z-40"
              }`}
            >
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingOpen(!settingOpen);
                  }}
                  className={`
                    w-10 h-10 rounded-full border border-gray-200 shadow-sm
                    flex items-center justify-center transition cursor-default
                    ${settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}
                  `}
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                </button>

                {settingOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute right-0 top-12 z-[999] w-40 rounded-2xl
                      bg-white border border-gray-200 shadow-xl overflow-hidden
                    "
                  >
                    <button
                      onClick={() => openManagePopup("favorite")}
                      className="
                        block w-full text-left px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-gray-50 transition cursor-default
                      "
                    >
                      즐겨찾기
                    </button>

                    <button
                      onClick={() => openManagePopup("sort")}
                      className="
                        block w-full text-left px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-gray-50 transition border-t
                        border-gray-100 cursor-default
                      "
                    >
                      위치변경
                    </button>
                  </div>
                )}
              </div>
            </div>
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

        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 place-items-stretch">
         {currentItems.map((company) => (
  <CompanyCard
  key={company.id}
  company={company}
  type={tab}
  showStar={getCurrentFavorites(tab).includes(company.id)}
  favorite={getCurrentFavorites(tab).includes(company.id)}
  onToggleFavorite={() => {
    if (tab === "nonlife") {
      const next = nonlifeFavorites.filter((id) => id !== company.id);
      setNonlifeFavorites(next);
      localStorage.setItem("nonlife-favorites", JSON.stringify(next));
      return;
    }

    const next = lifeFavorites.filter((id) => id !== company.id);
    setLifeFavorites(next);
    localStorage.setItem("life-favorites", JSON.stringify(next));
  }}
/>
))}
        </div>
      </div>

      {manageOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4">
          <div
            style={{
              transform: `translate(${popupPosition.x}px, ${popupPosition.y}px)`,
            }}
            className="
              bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden
              h-[86vh] lg:h-[78vh] flex flex-col
            "
          >
            <div
              onMouseDown={(e) => {
                setDragInfo({
                  startX: e.clientX,
                  startY: e.clientY,
                  originX: popupPosition.x,
                  originY: popupPosition.y,
                });
              }}
              className="
                bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center
                justify-between cursor-default select-none
              "
            >
              <div className="font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {manageMode === "favorite" ? "즐겨찾기 설정" : "메뉴 위치 변경"}
              </div>

              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={closeManagePopup}
                className="
                  px-4 h-9 rounded-xl bg-white/10 text-sm font-bold
                  hover:bg-white/20 transition cursor-default
                "
              >
                닫기
              </button>
            </div>

            <div className="px-5 pt-5">
              <p className="text-sm text-gray-500 leading-relaxed break-keep mb-4">
                {manageMode === "favorite"
                  ? "자주 사용하는 보험사를 별표로 선택하면 상단에 먼저 표시됩니다."
                  : "보험사 카드를 드래그해 원하는 순서로 변경하세요."}
              </p>

              <div className="grid grid-cols-2 bg-gray-200 rounded-2xl p-1">
                <button
                  onClick={() => setManageTab("nonlife")}
                  className={`rounded-xl py-3 font-bold transition ${
                    manageTab === "nonlife"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  손해보험
                </button>

                <button
                  onClick={() => setManageTab("life")}
                  className={`rounded-xl py-3 font-bold transition ${
                    manageTab === "life"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  생명보험
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
            {manageMode === "favorite" && (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleFavoriteDragEnd}
  >
    <SortableContext
      items={tempCurrentItems
        .filter((item) => getTempFavorites(manageTab).includes(item.id))
        .map((item) => item.id)}
      strategy={rectSortingStrategy}
    >
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 place-items-stretch">
        {tempCurrentItems.map((company) => {
          const isFavorite = getTempFavorites(manageTab).includes(company.id);

          if (isFavorite) {
            return (
              <SortableCompanyCard
                key={company.id}
                company={company}
                type={manageTab}
                showStar
                starActive
                disabled={false}
                onToggleFavorite={() => toggleTempFavorite(company.id)}
              />
            );
          }

          return (
            <CompanyCard
              key={company.id}
              company={company}
              type={manageTab}
              showStar
              disableLink
              favorite={false}
              onToggleFavorite={() => toggleTempFavorite(company.id)}
            />
          );
        })}
      </div>
    </SortableContext>
  </DndContext>
)}

              {manageMode === "sort" && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleTempSortDragEnd}
                >
                  <SortableContext
                    items={getTempItems(manageTab)
  .filter((item) => !getTempFavorites(manageTab).includes(item.id))
  .map((item) => item.id)}
                  >
                    <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 place-items-stretch">
                     {getTempItems(manageTab)
  .filter((company) => getTempFavorites(manageTab).includes(company.id))
  .map((company) => (
    <CompanyCard
  key={company.id}
  company={company}
  type={manageTab}
  showStar
  disableLink
  favorite
  onToggleFavorite={() => toggleTempFavorite(company.id)}
/>
  ))}

{getTempItems(manageTab)
  .filter((company) => !getTempFavorites(manageTab).includes(company.id))
  .map((company) => (
    <SortableCompanyCard
  key={company.id}
  company={company}
  type={manageTab}
  disabled={false}
/>
  ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-4 flex gap-3 justify-center">
              <button
                onClick={cancelManageChanges}
                className="
                  w-32 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm
                  font-bold hover:bg-gray-200 transition cursor-default
                "
              >
                취소
              </button>

              <button
                onClick={saveManageChanges}
                className="
                  w-32 h-12 rounded-2xl bg-gray-800 text-white text-sm
                  font-bold hover:bg-gray-700 transition cursor-default
                "
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {saveConfirmOpen && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
            

            <h2 className="text-xl font-black text-gray-900">저장 완료</h2>

            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              변경한 설정이 저장되었습니다.
            </p>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setSaveConfirmOpen(false)}
                className="
                  w-32 h-12 rounded-2xl bg-gray-800 text-white text-sm
                  font-bold hover:bg-gray-700 transition cursor-default
                "
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

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
