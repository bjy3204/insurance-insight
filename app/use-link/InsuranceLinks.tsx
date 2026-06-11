"use client";
import Image from "next/image";

type Props = {
  search: string;
};

const links = [
      {
    title: "진료정보 열람",
    icon: "/Insurancelink/medical-records.png",
    desc: "개인 진료정보 조회",
    url: "https://www.hira.or.kr/rb/diag/selectMyDiagInfmList.do?pgmid=HIRAA070001000600",
  },
    {
    title: "보험료 비교공시",
    icon: "/Insurancelink/insurance-premium.png",
    desc: "보험료 비교 공시",
    url: "https://kpub.knia.or.kr/productDisc/lostHealth/lostHealthDisclosure.do",
  },
    {
    title: "실손24",
    icon: "/Insurancelink/silson24.png",
    desc: "실손보험 청구 서비스",
    url: "https://www.silson24.or.kr/claim/web/",
  },
    {
    title: "숨은보험금 찾기",
    icon: "/Insurancelink/hidden-insurance.png",
    desc: "숨은 보험금 조회",
    url: "https://cont.insure.or.kr/cont_web/intro.do",
  },
      {
    title: "건축물 대장 조회",
    icon: "/Insurancelink/building-register.png",
    desc: "건축물대장 열람",
    url: "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=15000000098&HighCtgCD=A02004002&Mcode=10205",
  },
    {
    title: "승강기정보 열람",
    icon: "/Insurancelink/elevator-info.png",
    desc: "승강기 검사정보 조회",
    url: "https://www.elevator.go.kr/opn/MainPage.do",
  },
  {
    title: "할인할증요인 조회",
    icon: "/Insurancelink/discount-surcharge.png",
    desc: "자동차보험 할인·할증 요인 조회",
    url: "https://prem.kidi.or.kr:1443/",
  },
  {
    title: "과실비율정보포털",
    icon: "/Insurancelink/fault-ratio.png",
    desc: "교통사고 과실비율 확인",
    url: "https://accident.knia.or.kr/",
  },

  {
    title: "병원·약국 찾기",
    icon: "/Insurancelink/hospital-pharmacy.png",
    desc: "병원 및 약국 검색",
    url: "https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030002010000#a",
  },

  {
    title: "금융감독원 보도자료",
    icon: "/Insurancelink/press-release.png",
    desc: "최신 보도자료 확인",
    url: "https://www.fsc.go.kr/no010102",
  },
  {
    title: "금융감독원 분쟁사례",
    icon: "/Insurancelink/dispute-cases.png",
    desc: "보험·금융 분쟁 사례",
    url: "https://www.fss.or.kr/fss/job/fncCnflCase/list.do?menuNo=200516",
  },
  {
    title: "통계자료실",
    icon: "/Insurancelink/medical-statistics.png",
    desc: "의료정보 통계자료",
    url: "https://www.hira.or.kr/bbsDummy.do?pgmid=HIRAA020045010000",
  },
  {
  title: "비급여 정보 포털",
  icon: "/Insurancelink/non-covered.png",
  desc: "비급여 진료비 정보",
  url: "https://www.nhis.or.kr/nbinfo/index.do",
},
{
  title: "치매시설정보",
  icon: "/Insurancelink/dementia-facility.png",
  desc: "치매시설 정보 조회",
  url: "https://ansim.nid.or.kr/service/facility_list.aspx",
},
];

export default function InsuranceLinks({ search }: Props) {
  const filtered = links.filter(
    (item) =>
      item.title.includes(search) ||
      item.desc.includes(search)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filtered.map((item) => (
<a
  key={item.title}
  href={item.url}
  target="_blank"
  rel="noopener noreferrer"
  className="
    bg-white
    rounded-3xl
    border
    border-gray-200
    p-4
    shadow-sm
    transition-all
    duration-200
    cursor-default
    hover:-translate-y-1
    hover:border-gray-300
    hover:shadow-md
  "
>
<div className="mb-4 flex justify-center">
<div className="bg-slate-50 rounded-2xl px-1 py-2">
  <Image
    src={item.icon}
    alt={item.title}
    width={240}
    height={80}
    className="w-full h-auto object-contain"
  />
</div>
</div>

<div className="text-left px-2">
  <h3 className="text-[13] font-black text-gray-900">
    {item.title}
  </h3>

  <p className="text-sm text-gray-500 mt-1">
    {item.desc}
  </p>
</div>
        </a>
      ))}
    </div>
  );
}