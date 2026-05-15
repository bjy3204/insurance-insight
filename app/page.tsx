"use client";

import { useEffect, useState } from "react";

import {
  FileText,
  Calculator,
  Monitor,
  Phone,
  Building2,
  FolderOpen,
  Newspaper,
  MessageCircle,
  X,
  Megaphone,
  CircleDollarSign,
  Landmark,
  PiggyBank,
} from "lucide-react";

import { FaInstagram } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import { notices, noticeVersion } from "./notice/notices";

const menus = [
  
  {
    title: "보험사전산",
    desc: "보험사별 전산 바로가기",
    icon: Monitor,
    link: "/insurance-system",
  },
  {
    title: "고객센터",
    desc: "고객센터 · 팩스번호 · 등기주소 안내",
    icon: Phone,
    link: "/customer-center",
  },
  {
    title: "상품공시실",
    desc: "보험사별 상품공시실 바로가기",
    icon: Building2,
    link: "/product-public",
  },
  {
    title: "청구서류",
    desc: "보험금 청구서류 안내",
    icon: FileText,
    link: "/claim-docs",
  },
  {
    title: "실비계산기",
    desc: "세대별 실손보험금 계산기",
    icon: Calculator,
    link: "/calculator",
  },

  {
  title: "화폐가치계산기",
  desc: "시간의 경과에 따른 화폐가치 계산",
  icon: CircleDollarSign,
  link: "/money-value",
},
{
  title: "예금·적금 계산기",
  desc: "단리 · 복리 만기금액 계산",
  icon: Landmark,
  link: "/saving-calculator",
},
{
  title: "연금계산기",
  desc: "은퇴자금 · 연금액 · 국민연금 계산",
  icon: PiggyBank,
  link: "/pension-calculator",
},
{
    title: "보험인사이트 폴더",
    desc: "보험 자료 모음",
    icon: FolderOpen,
    link: "https://naver.me/FWTmVFQz",
  },
];

export default function Home() {
  const [today, setToday] = useState(0);
  const [total, setTotal] = useState(0);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
const [noticePage, setNoticePage] = useState(1);
const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [fixMessage, setFixMessage] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [contact, setContact] = useState("");
  const noticesPerPage = 10;
const totalNoticePages = Math.ceil(notices.length / noticesPerPage);

const pagedNotices = notices.slice(
  (noticePage - 1) * noticesPerPage,
  noticePage * noticesPerPage
);

const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone;

  if (isStandalone) {
    setShowInstall(false);
  } else {
    setShowInstall(true);
  }

  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstall(true);
  };

  window.addEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );

  const fetchVisitor = async (hit = false) => {
    try {
    const res = await fetch(`/api/visitor${hit ? "?hit=1" : ""}`, {
      cache: "no-store",
    });

    const data = await res.json();

    setToday(data.today || 0);
    setTotal(data.total || 0);
  } catch (error) {
    console.log(error);
  }
};

    const todayKey = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Seoul",
});
const visited = localStorage.getItem("visitedDate");

if (visited !== todayKey) {
  fetchVisitor(true);
  localStorage.setItem("visitedDate", todayKey);
} else {
  fetchVisitor(false);
}
    const savedVersion = localStorage.getItem("noticeRead");

if (savedVersion != noticeVersion.toString()) {
  setHasUpdate(true);
}
  return () => {
  window.removeEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt
  );
};
}, []);

  const sendMessage = async () => {
  if (!fixMessage.trim() && !addMessage.trim()) {
    alert("수정할 내용 또는 추가하고 싶은 내용을 입력해주세요.");
    return;
  }

  try {
    await emailjs.send(
      "service_qowldus",
      "template_7hs4byh",
      {
        fixMessage,
        addMessage,
        contact,
      },
      "1aQRC4TK_8wwBgPgw"
    );

    alert("메세지가 전송되었습니다.");

    setFixMessage("");
    setAddMessage("");
    setContact("");
    setOpen(false);

  } catch (error) {
  console.log(error);

  alert("메세지 전송에 실패했습니다.");
}
};

  return (
    <main className="min-h-screen bg-gray-100 pb-28 md:pb-40 lg:pb-18">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-[1500px] mx-auto px-5 py-6">
          <div className="relative flex items-center justify-center md:justify-center">

  {/* 모바일 TODAY */}{showInstall && (
  <div className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2">
    <button
      onClick={async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();

          const result = await deferredPrompt.userChoice;

          if (result.outcome === "accepted") {
            setShowInstall(false);
            setDeferredPrompt(null);
          }

          return;
        }

        alert(
          "크롬 또는 엣지에서 브라우저 메뉴 → 앱 설치를 눌러주세요."
        );
      }}
      className="
        px-4
        h-12
        rounded-2xl
        border
        border-gray-300
        bg-white
        flex
        items-center
        justify-center
        text-sm
        font-semibold
        text-gray-800
        shadow-sm
        hover:bg-gray-50
        transition
      "
    >
      바로가기 만들기
    </button>
  </div>
)}
  <div className="absolute left-0 top-1/2 -translate-y-1/2 md:hidden">
    <div className="text-center">
      <p className="text-[10px] leading-none text-gray-400 font-bold">
        TODAY
      </p>

      <p className="text-sm font-black text-blue-600 mt-1">
        {today.toLocaleString()}
      </p>
    </div>
  </div>

  {/* 로고 */}
  <div className="text-center">
    <h1 className="text-2xl font-black text-blue-600">
      보험인사이트
    </h1>

    <p className="text-sm text-gray-500 mt-1">
      보험설계사 업무 통합 플랫폼
    </p>
  </div>

  {/* 모바일 TOTAL */}
  <div className="absolute right-0 top-1/2 -translate-y-1/2 md:hidden">
    <div className="text-center">
      <p className="text-[10px] leading-none text-gray-400 font-bold">
        TOTAL
      </p>

      <p className="text-sm font-black text-gray-900 mt-1">
        {total.toLocaleString()}
      </p>
    </div>
  </div>

  {/* PC 방문자 카운터 */}
  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
    <div className="flex items-center gap-5 text-center">
      <div>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TODAY
        </p>

        <p className="text-base font-black text-blue-600 mt-1">
          {today.toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-[10px] leading-none text-gray-400 font-bold">
          TOTAL
        </p>

        <p className="text-base font-black text-gray-900 mt-1">
          {total.toLocaleString()}
        </p>
      </div>
    </div>
  </div>

          </div>
        </div>
      </header>

      {/* 메인 */}
      <div className="max-w-[1500px] mx-auto px-5 py-8 sm:p-10 md:pb-32 lg:pb-10">
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {menus.map((menu) => {
            const Icon = menu.icon;

            return (
              <a
  key={menu.title}
  href={menu.link}
  target={
    menu.title === "보험인사이트 폴더"
      ? "_blank"
      : "_self"
  }
  rel="noopener noreferrer"
                className="
  bg-white
  p-7
  sm:p-8
  rounded-3xl
  shadow
  hover:shadow-xl
  hover:-translate-y-1
  transition
  min-h-[190px]
"
              >
                <Icon className="w-10 h-10 text-blue-600 mb-4" />

                <h2 className="text-lg font-bold">{menu.title}</h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed break-keep">
  {menu.desc}
</p>
              </a>
            );
                   })}
        </div>
      </div>

      {/* 앱처럼 사용하기 */}
      {/* 앱처럼 사용하기 */}
{showInstall &&
  /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent) && (
        <div className="max-w-[1500px] mx-auto px-5 -mt-3 mb-16 md:hidden">
          <button
            onClick={async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShowInstall(false);
      setDeferredPrompt(null);
    }

    return;
  }

  alert(
    "홈화면에 추가 후 앱처럼 사용하세요 !\n\n사파리 또는 크롬에서 열기\n\n모바일: 공유 또는 메뉴 버튼 → 홈 화면에 추가\n\nPC: 브라우저 메뉴 → 앱 설치"
  );
}}
            className="
              w-full
              bg-white
              border
              border-gray-200
              rounded-2xl
              px-4
              py-3
              flex
              items-center
              justify-center
              gap-2
              text-sm
              shadow-sm
            "
          >
            <span className="font-semibold text-gray-800">
  앱처럼 사용하기
</span>
          </button>
        </div>
      )}

<button
  onClick={() => {
    localStorage.setItem("noticeRead", noticeVersion.toString());
    setHasUpdate(false);
    setSelectedNotice(null);
    setNoticeOpen(true);
  }}
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
    flex
    items-center
    justify-center
    hover:shadow-2xl
hover:-translate-y-0.5
transition-all
duration-200
cursor-pointer
  "
>
  <Megaphone className="w-6 h-6 text-white" />

  {hasUpdate && (
    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" />
  )}
</button>
      {/* 메세지 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed
          right-6
          bottom-24
          z-40
          bg-blue-600
          text-white
          px-5
          py-4
          rounded-2xl
          shadow-lg
          font-bold
        "
      >
        보험나무에게 메세지 보내기
      </button>

      {/* 하단 고정 */}
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

      {/* 메세지 모달 */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                보험나무에게 메세지 보내기
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                수정이 필요한 부분이나
                <br />
                추가하고 싶은 기능이 있다면 편하게 남겨주세요.
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700 mb-2">
                수정할 내용
              </p>

              <textarea
                value={fixMessage}
                onChange={(e) => setFixMessage(e.target.value)}
                placeholder="예) 고객센터 팩스번호 수정 부탁드립니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

            <div className="mb-5">
              <p className="text-sm font-bold text-gray-700 mb-2">
                추가하고 싶은 내용
              </p>

              <textarea
                value={addMessage}
                onChange={(e) => setAddMessage(e.target.value)}
                placeholder="예) 새로운 기능이 추가되면 좋겠습니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="연락처 또는 이름 (선택사항)"
              className="
                w-full
                border
                border-gray-200
                rounded-2xl
                p-4
                outline-none
                mb-6
              "
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-gray-100
                  font-bold
                  text-gray-700
                "
              >
                취소
              </button>

              <button
                onClick={sendMessage}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-blue-600
                  text-white
                  font-bold
                "
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}
            {/* 공지사항 팝업 */}
      {noticeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[85vh] lg:h-[65vh] flex flex-col">
            <div className="bg-gray-800 text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div className="font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                공지사항
              </div>

              <button
  onClick={() => setNoticeOpen(false)}
  className="cursor-pointer"
>
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedNotice ? (
  <div className="flex flex-col flex-1 min-h-0">

    {/* 모바일 카드형 */}
    <div className="p-4 space-y-2 md:hidden overflow-y-auto flex-1">
      {pagedNotices.map((notice) => (
        <button
          key={notice.id}
          onClick={() => setSelectedNotice(notice)}
          className="
  w-full
  text-left
  bg-white
  border
  border-gray-200
  rounded-2xl
  p-3
  hover:bg-gray-50
  transition
"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400">
              NO. {notice.id}
            </span>

            <span
              className={`
                px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap
                ${
                  notice.category === "업데이트"
                    ? "bg-blue-100 text-blue-600"
                    : notice.category === "강의안내"
                    ? "bg-yellow-100 text-yellow-700"
                    : notice.category === "OPEN"
                    ? "bg-emerald-100 text-emerald-700 px-3"
                    : "bg-orange-100 text-orange-600"
                }
              `}
            >
              {notice.category}
            </span>
          </div>

          <div className="font-bold text-gray-900 leading-tight break-keep">
            {notice.title}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {notice.date}
          </div>
        </button>
      ))}
    </div>

    {/* PC 테이블형 */}
    <div className="hidden md:block p-4 overflow-y-auto flex-1">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="bg-gray-50 rounded-xl overflow-hidden">
          <tr>
            <th className="py-3 w-20">번호</th>
            <th className="py-3">제목</th>
            <th className="py-3 w-36">날짜</th>
          </tr>
        </thead>

        <tbody>
          {pagedNotices.map((notice) => (
            <tr
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="
                border-b
                border-gray-100
                hover:bg-gray-50
                cursor-pointer
                transition
              "
            >
              <td className="py-4 text-center text-gray-700 border-b border-gray-100">
                {notice.id}
              </td>

              <td className="py-4 font-medium border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span>{notice.title}</span>

                  <span
                    className={`
                      px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap
                      ${
                        notice.category === "업데이트"
                          ? "bg-blue-100 text-blue-600"
                          : notice.category === "강의안내"
                          ? "bg-yellow-100 text-yellow-700"
                          : notice.category === "OPEN"
                          ? "bg-emerald-100 text-emerald-700 px-3"
                          : "bg-orange-100 text-orange-600"
                      }
                    `}
                  >
                    {notice.category}
                  </span>
                </div>
              </td>

              <td className="py-4 text-center text-gray-500 text-xs border-b border-gray-100">
                {notice.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* 페이지네이션 */}
    <div className="flex justify-center pt-4 pb-4 shrink-0">
      <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
        <button
          onClick={() => setNoticePage((p) => Math.max(1, p - 1))}
          disabled={noticePage === 1}
          className="px-4 py-2 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer"
        >
          이전
        </button>

        {Array.from({ length: totalNoticePages }).map((_, index) => {
          const page = index + 1;

          return (
            <button
              key={page}
              onClick={() => setNoticePage(page)}
              className={`px-4 py-2 border-l border-gray-200 hover:bg-slate-600 cursor-pointer ${
                noticePage === page
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
            setNoticePage((p) => Math.min(totalNoticePages, p + 1))
          }
          disabled={noticePage === totalNoticePages}
          className="px-4 py-2 border-l hover:bg-gray-50 disabled:text-gray-300 cursor-pointer"
        >
          다음
        </button>
      </div>
    </div>

  </div>
) : (
              <div className="px-6 md:px-10 pt-4 pb-6 flex-1 min-h-0 flex flex-col">

  <div className="overflow-y-auto flex-1">
    <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-snug break-keep">
      {selectedNotice.title}
    </h2>

    <p className="text-xs md:text-sm text-gray-500 mt-2">
      작성일: {selectedNotice.date}
    </p>

    <div className="border-t border-gray-200 mt-3 pt-2 pb-6 whitespace-pre-line text-[15px] leading-6 text-gray-800 break-keep">
      {selectedNotice.content}
    </div>
  </div>

  <div className="border-t border-gray-200 pt-4 text-center shrink-0">
    <button
      onClick={() => setSelectedNotice(null)}
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
  hover:shadow-md
 
  transition-all
  duration-200
"
    >
      목록으로
    </button>
  </div>

</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}