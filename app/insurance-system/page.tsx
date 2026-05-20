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
  X,
  NotebookPen,
  Pin,
  Eye,
  EyeOff,
  Plus,
  Search,
  Pencil,
  
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

type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

function SortableMemoCard({
  memo,
  children,
}: {
  memo: MemoItem;
  children: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: memo.id,
    disabled: memo.pinned,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      className={memo.pinned ? "" : "touch-none"}
    >
      {children}
    </div>
  );
}

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

  const [memoOpen, setMemoOpen] = useState(false);
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [memoSearch, setMemoSearch] = useState("");
  const [memoPage, setMemoPage] = useState(1);
    const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [memoColor, setMemoColor] =
    useState<MemoItem["color"]>("white");
  const [memoAddOpen, setMemoAddOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
const [manageSaveConfirmOpen, setManageSaveConfirmOpen] = useState(false);

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

  

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState<null | {
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>(null);

const [memoAddPopupPosition, setMemoAddPopupPosition] = useState({
  x: 0,
  y: 0,
});

const [memoAddDragInfo, setMemoAddDragInfo] = useState<null | {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}>(null);  

  const [memoEditPopupPosition, setMemoEditPopupPosition] = useState({
  x: 0,
  y: 0,
});

const [memoEditDragInfo, setMemoEditDragInfo] = useState<null | {
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
    const syncMemos = () => {
      const savedMemos = localStorage.getItem("personalMemos");
      setMemos(savedMemos ? JSON.parse(savedMemos) : []);
    };

    syncMemos();

    window.addEventListener("memo-storage-updated", syncMemos);
    window.addEventListener("storage", syncMemos);

    return () => {
      window.removeEventListener("memo-storage-updated", syncMemos);
      window.removeEventListener("storage", syncMemos);
    };
  }, []);

  useEffect(() => {
    const openMemoDetail = (event: any) => {
      const memoId = event.detail;

      const savedMemos = localStorage.getItem("personalMemos");
      if (!savedMemos) return;

      const parsedMemos: MemoItem[] = JSON.parse(savedMemos);
      const targetMemo = parsedMemos.find((memo) => memo.id === memoId);

      if (!targetMemo) return;

      setMemos(parsedMemos);
      setSelectedMemo(targetMemo);
    };

    window.addEventListener("open-memo-detail", openMemoDetail);

    return () => {
      window.removeEventListener("open-memo-detail", openMemoDetail);
    };
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

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!memoAddDragInfo) return;

    setMemoAddPopupPosition({
      x: memoAddDragInfo.originX + e.clientX - memoAddDragInfo.startX,
      y: memoAddDragInfo.originY + e.clientY - memoAddDragInfo.startY,
    });
  };

  const handleMouseUp = () => {
    setMemoAddDragInfo(null);
  };

  if (memoAddDragInfo) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [memoAddDragInfo]);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!memoEditDragInfo) return;

    setMemoEditPopupPosition({
      x: memoEditDragInfo.originX + e.clientX - memoEditDragInfo.startX,
      y: memoEditDragInfo.originY + e.clientY - memoEditDragInfo.startY,
    });
  };

  const handleMouseUp = () => {
    setMemoEditDragInfo(null);
  };

  if (memoEditDragInfo) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [memoEditDragInfo]);

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

   setManageSaveConfirmOpen(true);
    
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

  const saveMemos = (nextMemos: MemoItem[]) => {
    setMemos(nextMemos);
    localStorage.setItem("personalMemos", JSON.stringify(nextMemos));
    window.dispatchEvent(new Event("memo-storage-updated"));
  };

  const addMemo = () => {
    const now = new Date().toISOString();

    const newMemo: MemoItem = {
      id: crypto.randomUUID(),
      title: memoTitle.trim(),
      content: memoContent.trim(),
      pinned: false,
      visible: false,
      color: memoColor,
      createdAt: now,
      updatedAt: now,
    };

    saveMemos([newMemo, ...memos]);
    setMemoPage(1);
    setMemoTitle("");
setMemoContent("");
setMemoColor("white");
setMemoAddOpen(false);
  };

  const updateSelectedMemo = () => {
    if (!selectedMemo) return;

    const nextMemos = memos.map((memo) =>
      memo.id === selectedMemo.id
        ? { ...selectedMemo, updatedAt: new Date().toISOString() }
        : memo
    );

    saveMemos(nextMemos);
    setSelectedMemo(null);
  };

  const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  const nextMemos = memos.map((memo) =>
    memo.id === id
      ? {
          ...memo,
          color,
          updatedAt: new Date().toISOString(),
        }
      : memo
  );

  saveMemos(nextMemos);
};

const deleteMemo = (id: string) => {
  setDeleteMemoId(id);
  setDeleteMemoConfirmOpen(true);
};

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;

  const nextMemos = memos.filter((memo) => memo.id !== deleteMemoId);

  saveMemos(nextMemos);
  setSelectedMemo(null);
  setDeleteMemoId(null);
  setDeleteMemoConfirmOpen(false);
};

  const toggleMemoVisible = (id: string) => {
    saveMemos(
      memos.map((memo) =>
        memo.id === id ? { ...memo, visible: !memo.visible } : memo
      )
    );
  };

  const toggleMemoPinned = (id: string) => {
    saveMemos(
      memos.map((memo) =>
        memo.id === id
          ? { ...memo, pinned: !memo.pinned, updatedAt: new Date().toISOString() }
          : memo
      )
    );
  };

  const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const activeMemo = memos.find((memo) => memo.id === active.id);
  const overMemo = memos.find((memo) => memo.id === over.id);

  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;

  const pinnedMemos = memos.filter((memo) => memo.pinned);
  const normalMemos = memos.filter((memo) => !memo.pinned);

  const oldIndex = normalMemos.findIndex((memo) => memo.id === active.id);
  const newIndex = normalMemos.findIndex((memo) => memo.id === over.id);

  const reorderedNormalMemos = arrayMove(normalMemos, oldIndex, newIndex);

  saveMemos([...pinnedMemos, ...reorderedNormalMemos]);
};

    const memoColorOptions: {
    value: MemoItem["color"];
    className: string;
  }[] = [
    {
      value: "white",
      className: "bg-white border-gray-300 hover:bg-gray-50",
    },
    {
      value: "blue",
      className: "bg-blue-50 border-blue-100 hover:bg-blue-100",
    },
    {
      value: "yellow",
      className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100",
    },
    {
      value: "red",
      className: "bg-red-50 border-red-100 hover:bg-red-100",
    },
    {
      value: "clear",
      className:
        "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95",
    },
  ];

  

   const filteredMemos = memos
    .filter((memo) =>
      `${memo.title} ${memo.content}`
        .toLowerCase()
        .includes(memoSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      return (
        memos.findIndex((memo) => memo.id === a.id) -
        memos.findIndex((memo) => memo.id === b.id)
      );
    });

    const MEMOS_PER_PAGE = 6;

const totalMemoPages = Math.max(
  1,
  Math.ceil(filteredMemos.length / MEMOS_PER_PAGE)
);

const pagedMemos = filteredMemos.slice(
  (memoPage - 1) * MEMOS_PER_PAGE,
  memoPage * MEMOS_PER_PAGE
);
     

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
                      onClick={() => {
                        setMemoOpen(true);
                        setManageOpen(false);
                        setSettingOpen(false);
                      }}
                      className="
                        hidden md:block w-full text-center px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-gray-50 transition cursor-default
                      "
                    >
                      메모장
                    </button>

                    <button
                      onClick={() => openManagePopup("favorite")}
                                           className="
                        block w-full text-center로 px-4 py-3 text-sm font-bold
                        text-gray-700 hover:bg-gray-50 transition border-t
                        border-gray-100 cursor-default
                      "
                    >
                      즐겨찾기
                    </button>

                    <button
                      onClick={() => openManagePopup("sort")}
                      className="
                        block w-full text-center px-4 py-3 text-sm font-bold
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
  if (window.innerWidth < 768) return;

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
    w-9
    h-9
    rounded-full
    flex
    items-center
    justify-center
    text-white
    hover:bg-white/10
    hover:cursor-pointer
    transition
  "
>
  <X className="w-5 h-5" />
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

      {manageSaveConfirmOpen && (
  <div className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">저장 완료</h2>

      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
        변경한 설정이 저장되었습니다.
      </p>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => {
            setManageSaveConfirmOpen(false);
            setManageOpen(false);
          }}
          className="w-32 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default"
        >
          확인
        </button>
      </div>
    </div>
  </div>
)}


      {memoOpen && (
  <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2">
          <NotebookPen className="w-5 h-5" />
          메모장
        </div>

        <button
          onClick={() => setMemoOpen(false)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:cursor-pointer transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={memoSearch}
            onChange={(e) => {
              setMemoSearch(e.target.value);
              setMemoPage(1);
            }}
            placeholder="메모 검색"
            className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <button
          onClick={() => {
            setMemoAddPopupPosition({ x: 0, y: 0 });
            setMemoAddDragInfo(null);
            setMemoAddOpen(true);
          }}
          className="h-12 px-5 rounded-2xl bg-gray-800 text-white text-sm font-bold flex items-center gap-2 cursor-default"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
          {filteredMemos.length === 0 ? (
            <div className="col-span-full h-full flex items-center justify-center text-sm text-gray-400">
              저장된 메모가 없습니다.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMemoDragEnd}
            >
              <SortableContext
                items={pagedMemos
                  .filter((memo) => !memo.pinned)
                  .map((memo) => memo.id)}
                strategy={rectSortingStrategy}
              >
                {pagedMemos.map((memo) => (
                  <SortableMemoCard key={memo.id} memo={memo}>
                    <div
                      onDoubleClick={() => {
                        setMemoEditPopupPosition({ x: 0, y: 0 });
                        setMemoEditDragInfo(null);
                        setSelectedMemo(memo);
                      }}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition cursor-default"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-gray-900 break-keep">
                            {memo.title || ""}
                          </h3>

                          <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">
                            {memo.content}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoVisible(memo.id);
                            }}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                              ${
                                memo.visible
                                  ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }
                            `}
                          >
                            {memo.visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemoPinned(memo.id);
                            }}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default
                              ${
                                memo.pinned
                                  ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700"
                                  : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }
                            `}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemoEditPopupPosition({ x: 0, y: 0 });
                              setMemoEditDragInfo(null);
                              setSelectedMemo(memo);
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-default"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SortableMemoCard>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
        <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
          <button
            onClick={() => setMemoPage((p) => Math.max(1, p - 1))}
            disabled={memoPage === 1}
            className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
          >
            이전
          </button>

          {Array.from({ length: Math.min(totalMemoPages, 10) }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                onClick={() => setMemoPage(page)}
                className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${
                  memoPage === page
                    ? "bg-slate-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setMemoPage((p) => Math.min(totalMemoPages, p + 1))}
            disabled={memoPage === totalMemoPages}
            className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </div>
)}

                  {memoAddOpen && (
        <div
          onClick={() => setMemoAddOpen(false)}
          className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4"
        >
          <div
  style={{
    transform: `translate(${memoAddPopupPosition.x}px, ${memoAddPopupPosition.y}px)`,
  }}
  onMouseDown={(e) => {
    if (window.innerWidth < 768) return;

    const target = e.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return;
    }

    setMemoAddDragInfo({
      startX: e.clientX,
      startY: e.clientY,
      originX: memoAddPopupPosition.x,
      originY: memoAddPopupPosition.y,
    });
  }}
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">
                메모 추가
              </h2>

              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setMemoColor(color.value)}
                    className={`
                      w-7
                      h-7
                      rounded-full
                      border
                      transition
                      hover:scale-105
                      ${
                        memoColor === color.value
                          ? "ring-2 ring-gray-400 ring-offset-2"
                          : ""
                      }
                      ${color.className}
                    `}
                  />
                ))}

                <button
                  onClick={() => {
  setMemoAddOpen(false);
  setMemoAddPopupPosition({ x: 0, y: 0 });
  setMemoAddDragInfo(null);
}}
                  className="
                    w-9
                    h-9
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-gray-400
                    hover:bg-gray-100
                    transition
                    cursor-pointer
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input
              value={memoTitle}
              onChange={(e) => setMemoTitle(e.target.value)}
              placeholder="메모 제목"
              className="
                w-full
                h-12
                rounded-2xl
                border
                border-gray-200
                px-4
                text-sm
                outline-none
                mb-3
              "
            />

            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              className="
                w-full
                h-56
                rounded-2xl
                border
                border-gray-200
                p-4
                text-sm
                outline-none
                resize-none
                mb-5
              "
            />

            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMemoAddOpen(false)}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-100
                  text-gray-700
                  text-sm
                  font-bold
                  hover:bg-gray-200
                  transition
                  cursor-default
                "
              >
                취소
              </button>

              <button
                onClick={() => {
  addMemo();
  setMemoAddOpen(false);
  
}}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-800
                  text-white
                  text-sm
                  font-bold
                  hover:bg-gray-700
                  transition
                  cursor-default
                "
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

                  {selectedMemo && (
  <div className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4">
    <div
  style={{
    transform: `translate(${memoEditPopupPosition.x}px, ${memoEditPopupPosition.y}px)`,
  }}
  onMouseDown={(e) => {
    if (window.innerWidth < 768) return;

    const target = e.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea")
    ) {
      return;
    }

    setMemoEditDragInfo({
      startX: e.clientX,
      startY: e.clientY,
      originX: memoEditPopupPosition.x,
      originY: memoEditPopupPosition.y,
    });
  }}
  onClick={(e) => e.stopPropagation()}
  className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default"
>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">
                메모 수정
              </h2>

              <div className="flex items-center gap-2">
                {memoColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      changeMemoColor(selectedMemo.id, color.value);

                      setSelectedMemo({
                        ...selectedMemo,
                        color: color.value,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className={`
                      w-7
                      h-7
                      rounded-full
                      border
                      transition
                      hover:scale-105
                      ${
                        selectedMemo.color === color.value
                          ? "ring-2 ring-gray-400 ring-offset-2"
                          : ""
                      }
                      ${color.className}
                    `}
                  />
                ))}

                <button
                  onClick={() => {
  setSelectedMemo(null);
  setMemoEditPopupPosition({ x: 0, y: 0 });
  setMemoEditDragInfo(null);
}}
                  className="
                    w-9
                    h-9
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-gray-400
                    hover:bg-gray-100
                    transition
                    cursor-pointer
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <input
              value={selectedMemo.title}
              onChange={(e) =>
                setSelectedMemo({
                  ...selectedMemo,
                  title: e.target.value,
                })
              }
              className="
                w-full
                h-12
                rounded-2xl
                border
                border-gray-200
                px-4
                text-sm
                font-bold
                outline-none
                mb-3
              "
            />

            <textarea
              value={selectedMemo.content}
              onChange={(e) =>
                setSelectedMemo({
                  ...selectedMemo,
                  content: e.target.value,
                })
              }
              className="
                w-full
                h-56
                rounded-2xl
                border
                border-gray-200
                p-4
                text-sm
                outline-none
                resize-none
                mb-5
              "
            />

            <p className="-mt-4 mb-3 text-xs text-gray-400 leading-relaxed break-keep">
              ※ 메모는 브라우저 캐시 삭제 또는 기기 변경 시 삭제될 수 있습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => deleteMemo(selectedMemo.id)}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-100
                  text-gray-600
                  text-sm
                  font-bold
                  hover:bg-red-50
                  hover:text-red-500
                  transition
                  cursor-default
                "
              >
                삭제
              </button>

              <button
                onClick={() => {
                  const nextMemos = memos.map((memo) =>
                    memo.id === selectedMemo.id
                      ? {
                          ...selectedMemo,
                          updatedAt: new Date().toISOString(),
                        }
                      : memo
                  );

                  saveMemos(nextMemos);
setSelectedMemo(null);

                }}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-800
                  text-white
                  text-sm
                  font-bold
                  hover:bg-gray-700
                  transition
                  cursor-default
                "
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

            {deleteMemoConfirmOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">
              메모 삭제
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              선택한 메모를 삭제하시겠습니까?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteMemoId(null);
                  setDeleteMemoConfirmOpen(false);
                }}
                className="
                  flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700
                  text-sm font-bold hover:bg-gray-200 transition cursor-default
                "
              >
                취소
              </button>

              <button
                onClick={confirmDeleteMemo}
                className="
                  flex-1 h-12 rounded-2xl bg-red-500 text-white
                  text-sm font-bold hover:bg-red-600 transition cursor-default
                "
              >
                삭제
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
