"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  FileText,
  Newspaper,
  MessageCircle,
  Hospital,
  X,
} from "lucide-react";
import HospitalInfoPopup from "./hospital-info";
import { FaInstagram } from "react-icons/fa";

const tabs = [
  "공통",
  "실손의료비",
  "수술",
  "골절/화상/응급",
  "치매/간병",
  "태아",
  "사망/장해",
  "운전자",
  "치아",
  "배상/누수",
  "펫",
  "기타",
] as const;

type Tab = (typeof tabs)[number];

const claimDocs = {
  공통: [
    {
      title: "본인 청구",
      items: [
        "보험금 청구서",
        "신분증 사본",
      ],
    },

    {
      title: "대리인(가족) 청구",
      items: [
        "위임장 (인감 날인)",
        "위임자 인감증명서 (또는 본인서명사실확인서)",
        "대리인 신분증",
        "가족관계증명서",
      ],
    },
  ],

  실손의료비: [
    {
      title: "입원",
      items: [
        "진단서 또는 입퇴원확인서 (질병코드 필수)",
        "진료비 영수증",
        "진료비 세부내역서",
      ],
    },

    {
      title: "통원",
      items: [
        "진단서 또는 진료확인서 (질병코드 필수)",
        "진료비 영수증",
        "진료비 세부내역서",
        "약제비 영수증",
      ],
    },
  ],

  수술: [
    {
      title: "1~5종 수술비",
      items: [
        "수술확인서",
      ],
    },

    {
      title: "N대 수술비",
      items: [
        "진단서 또는 진료확인서 (질병코드 필수)",
        "수술확인서",
      ],
    },
  ],

  "골절/화상/응급": [
    {
      title: "골절 진단비",
      items: [
        "진단서",
        "영상검사결과지 (CT, MRI, X-ray)",
      ],
    },

    {
      title: "화상 진단비",
      items: [
        "진단서 (심재성 2도 이상 여부 기재 필수)",
        "응급처치 기록지",
      ],
    },

    {
      title: "응급실 내원비",
      items: [
        "응급실 내원 확인서",
        "진료비 영수증",
      ],
    },
  ],

  "치매/간병": [
    {
      title: "치매 진단비",
      items: [
        "진단서 (CDR 척도 점수 기재 필수)",
        "CDR 검사 결과지",
        "뇌 영상 검사(MRI/CT) 판독지",
        "MMSE(간이정신상태) 검사 결과지",
      ],
    },

    {
      title: "간병인 (지원/사용)",
      items: [
        "간병인 사용 영수증",
        "간병인 자격증 사본 또는 사업자등록증",
        "간병 사실 확인서 (업체 양식)",
      ],
    },
  ],

  태아: [
    {
      title: "출생 / 선천이상",
      items: [
        "출생증명서",
        "등본",
        "진단서",
        "입퇴원확인서",
      ],
    },

    {
      title: "유산 / 사산",
      items: [
        "진단서 또는 사산증명서",
        "의무기록사본",
      ],
    },

    {
      title: "응급 제왕절개",
      items: [
        "진단서 (응급 사유 기재)",
        "수술확인서",
        "진료비 영수증 및 세부내역서",
      ],
    },
  ],

  "사망/장해": [
    {
      title: "사망 보험금",
      items: [
        "사망진단서 (시체검안서) 원본",
        "피보험자 기본증명서",
        "가족관계증명서",
        "상속인 전원 인감증명서, 위임장, 신분증",
      ],
    },

    {
      title: "후유장해",
      items: [
        "후유장해 진단서",
        "사고 입증 서류 및 초진차트",
        "영상 CD (MRI, CT 등)",
      ],
    },
  ],

  운전자: [
    {
      title: "자동차부상치료비",
      items: [
        "지급결의서",
        "진단서",
        "교통사고사실확인원 (경찰 신고 시)",
      ],
    },

    {
      title: "교통사고처리지원금",
      items: [
        "교통사고사실확인원",
        "피해자 진단서 또는 사망진단서",
        "형사합의서 원본",
      ],
    },

    {
      title: "변호사선임비용",
      items: [
        "교통사고사실확인원",
        "판결문, 공소장, 변호사가 발행한 세금계산서",
        "구속명장 또는 사건처분증명원",
        "재소 또는 출소증명원",
      ],
    },

    {
      title: "벌금",
      items: [
        "교통사고사실확인원",
        "벌금납부 영수증",
        "약식명령문 또는 법원 판결문",
      ],
    },

    {
      title: "면허정지/취소 위로금",
      items: [
        "교통사고사실확인원",
        "운전경력증명서",
        "면허정지확인원 (교육 이수 후)",
        "면허취소확인원",
      ],
    },
  ],

  치아: [
    {
      title: "치아",
      items: [
        "치과치료확인서",
        "치과진료기록부 사본",
        "치료 전/후 파노라마 X-ray 사진",
      ],
    },
  ],

  "배상/누수": [
    {
      title: "일상생활배상책임",
      items: [
        "사고경위서 (자필, 6하원칙)",
        "등본 (거주지 확인)",
        "피해 입증 사진 (파손 부위)",
        "수리비 견적서 및 영수증",
        "피해자 통장사본",
      ],
    },

    {
      title: "급배수시설 누출손해",
      items: [
        "사고경위서",
        "기술소견서 (필수: 누수 원인이 노후가 아닌 사고임을 입증)",
        "수리비 견적서 및 영수증",
        "공사 전/중/후 사진",
      ],
    },
  ],

  펫: [
    {
      title: "통원 / 입원 / 수술",
      items: [
        "진료비 영수증",
        "진료비 세부내역서",
        "초진차트 (또는 진료기록부)",
        "수술기록지 (수술시)",
      ],
    },
  ],

  기타: [
    {
      title: "독감 / 대상포진",
      items: [
        "진단명/코드 기재된 서류 (처방전, 확인서 등)",
        "진료비 계산서",
        "(독감) 독감 검사 결과지",
      ],
    },

    {
      title: "고혈압 / 당뇨 / 통풍",
      items: [
        "처방전 (질병코드 포함)",
        "진료비 계산서",
        "(통풍) 요산 수치 검사 결과지",
      ],
    },
  ],
};


export default function ClaimDocsPage() {
  const [tab, setTab] = useState<Tab>("공통");
  const [hospitalOpen, setHospitalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gray-100 pb-24">

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
                <FileText className="w-7 h-7 text-blue-600" />

                <h1 className="text-2xl font-black text-gray-900">
                  청구서류
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                보험금 청구서류 안내
              </p>

            </div>

            {/* 오른쪽 균형 */}
            <div className="w-11 h-11" />

          </div>

        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">

        {/* 탭 */}
<div className="overflow-x-auto mb-7">
  <div className="grid grid-cols-12 bg-gray-200 rounded-2xl p-1 gap-1 min-w-[1180px]">
    {tabs.map((item) => (
      <button
        key={item}
        onClick={() => setTab(item)}
        className={`
          rounded-xl
          py-3
          font-bold
          text-sm
          whitespace-nowrap
          transition
          ${
            tab === item
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600"
          }
        `}
      >
        {item}
      </button>
    ))}
  </div>
</div>
        {/* 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {claimDocs[tab]?.map((doc) => (
            <div
              key={doc.title}
              className="
                bg-white
                rounded-3xl
                border
                border-gray-200
                shadow-sm
                p-6
              "
            >

              <h2 className="text-xl font-black text-blue-600 mb-5">
                {doc.title}
              </h2>

              <ol className="space-y-3 text-gray-800">

                {doc.items.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-3 font-semibold leading-relaxed"
                  >
                    <span className="text-blue-600 shrink-0">
                      {index + 1}.
                    </span>

                    <span>{item}</span>
                  </li>
                ))}

              </ol>

            </div>
          ))}

        </div>

      </section>
{/* 병원정보 버튼 */}
<button
  onClick={() => setHospitalOpen(true)}
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
  <Hospital className="w-6 h-6 text-white" />
</button>
<HospitalInfoPopup
  open={hospitalOpen}
  onClose={() => setHospitalOpen(false)}
/>
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