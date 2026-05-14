"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PiggyBank,
  Newspaper,
  MessageCircle,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";

type TabType = "retire" | "pension" | "lump" | "nps";

export default function PensionCalculatorPage() {
  const [tab, setTab] = useState<TabType>("retire");

  const [currentAge, setCurrentAge] = useState("");
  const [pensionStartAge, setPensionStartAge] = useState("");
  const [pensionYears, setPensionYears] = useState("");
  const [targetPension, setTargetPension] = useState("");

  const [monthly, setMonthly] = useState("");
  const [savingYears, setSavingYears] = useState("");
  const [rate, setRate] = useState("");

  const [npsPremium, setNpsPremium] = useState("");

  const formatKoreanMoney = (won: number) => {
    const man = Math.round(won / 10000);
    const eok = Math.floor(man / 10000);
    const rest = man % 10000;

    if (eok > 0 && rest > 0) return `${eok.toLocaleString()}억 ${rest.toLocaleString()}만원`;
    if (eok > 0) return `${eok.toLocaleString()}억원`;

    return `${man.toLocaleString()}만원`;
  };

  const formatWon = (won: number) => {
  return (Math.round(won / 1000) * 1000).toLocaleString();
};

  const result = useMemo(() => {
    const current = Number(currentAge || 0);
    const startAge = Number(pensionStartAge || 0);
    const receiveYears = Number(pensionYears || 0);
    const saveYears = Number(savingYears || 0);

    const monthlySave = Number(monthly || 0) * 10000;
    const targetMonthlyPension = Number(targetPension || 0) * 10000;

    const annualRate = Number(rate || 0) / 100;
    const monthlyRate = annualRate / 12;

    const savingMonths =
  tab === "retire"
    ? Math.max(startAge - current, 0) * 12
    : Math.max(saveYears, 0) * 12;
const inputSavingMonths = savingMonths;
const retireMonths = Math.max(startAge - current, 0) * 12;
const pensionMonths = receiveYears * 12;

    const pensionFactor =
      monthlyRate === 0
        ? pensionMonths
        : (1 - Math.pow(1 + monthlyRate, -pensionMonths)) / monthlyRate;

    const needRetireMoney = targetMonthlyPension * pensionFactor;


    const savingFactorForRetire =
      monthlyRate === 0
        ? savingMonths
        : (Math.pow(1 + monthlyRate, savingMonths) - 1) / monthlyRate;

    const requiredMonthlySaving =
  savingFactorForRetire === 0
    ? 0
    : needRetireMoney / savingFactorForRetire;

    const lumpTotal =
      monthlyRate === 0
        ? monthlySave * inputSavingMonths
        : monthlySave *
          ((Math.pow(1 + monthlyRate, inputSavingMonths) - 1) / monthlyRate);

    const monthsBetweenSavingEndAndPensionStart = Math.max(
  retireMonths - inputSavingMonths,
  0
);

const pensionTotal =
  lumpTotal * Math.pow(1 + monthlyRate, monthsBetweenSavingEndAndPensionStart);

    const estimatedMonthlyPension =
      pensionFactor === 0 ? 0 : pensionTotal / pensionFactor;

    const nps = Number(npsPremium || 0);

const NPS_A_VALUE = 3193511;

// 2026년 5월 현재 기준
const NPS_MIN_INCOME = 400000;
const NPS_MAX_INCOME = 6370000;
const NPS_RATE = 0.09;


const incomeBase = Math.min(
  Math.max(nps / NPS_RATE, NPS_MIN_INCOME),
  NPS_MAX_INCOME
);

const calcNpsBase = (years: number) => {
  const months = years * 12;
  const over20Months = Math.max(months - 240, 0);

  return (
    1.29 *
    (NPS_A_VALUE + incomeBase) *
    (1 + (0.05 * over20Months) / 12)
  );
};

const calcOldAge = (years: number) => {
  if (years < 10) return 0;

  const months = years * 12;

  const paymentRate = Math.min(
    0.5 + ((months - 120) * 5) / 12 / 100,
    1
  );

  return (calcNpsBase(years) * paymentRate) / 12;
};

    return {
      current,
      startAge,
      receiveYears,
      pensionEndAge: startAge + receiveYears,
      savingEndAge: current + saveYears,

      needRetireMoney,
      requiredMonthlySaving,

      pensionTotal,
      estimatedMonthlyPension,

      lumpTotal,

      nps: {
        incomeBase,
        oldAge: [
          { years: 10, amount: calcOldAge(10) },
          { years: 20, amount: calcOldAge(20) },
          { years: 30, amount: calcOldAge(30) },
        ],
        disability: [
  { label: "장애 1급", amount: (calcNpsBase(20) * 1) / 12 },
  { label: "장애 2급", amount: (calcNpsBase(20) * 0.8) / 12 },
  { label: "장애 3급", amount: (calcNpsBase(20) * 0.6) / 12 },
  { label: "장애 4급(일시금)", amount: calcNpsBase(20) * 2.25 },
],
survivor: [
  { label: "10년 미만 가입", amount: (calcNpsBase(1) * 0.4) / 12 },
  { label: "10년~20년 미만", amount: (calcNpsBase(15) * 0.5) / 12 },
  { label: "20년 가입", amount: (calcNpsBase(20) * 0.6) / 12 },
],
      },
    };
  }, [
    tab,
    currentAge,
    pensionStartAge,
    pensionYears,
    targetPension,
    monthly,
    savingYears,
    rate,
    npsPremium,
  ]);

  const description = {
    retire:
      "희망하는 월 연금액을 입력하시면 필요한 은퇴자금과 매월 저축해야 하는 금액을 계산할 수 있습니다.",
    pension:
      "저축금액과 저축기간을 기준으로 연금개시 시점의 예상 월 연금액을 계산할 수 있습니다.",
    lump:
      "매월 저축 가능한 금액과 저축기간을 입력하시면 은퇴시점에 얼마나 모이는지 알 수 있습니다.",
    nps:
      "월 납입보험료를 기준으로 국민연금 예상 수령액을 간편하게 확인할 수 있습니다.",
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white border-b border-black shadow-sm">
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
                <PiggyBank className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">
                  연금 계산기
                </h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                노후 연금 · 은퇴자금 계산
              </p>
            </div>

            <div className="w-11 h-11" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <TopButton active={tab === "retire"} onClick={() => setTab("retire")}>
            은퇴설계
          </TopButton>

          <TopButton active={tab === "pension"} onClick={() => setTab("pension")}>
            연금액
          </TopButton>

          <TopButton active={tab === "lump"} onClick={() => setTab("lump")}>
            목돈
          </TopButton>

          <TopButton active={tab === "nps"} onClick={() => setTab("nps")}>
            국민연금
          </TopButton>
        </div>

        <div className="text-center text-sm text-gray-500 leading-relaxed mb-5">
          {description[tab]}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-5">
          {tab === "retire" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="희망 월 연금액" value={targetPension} setValue={setTargetPension} unit="만원" />
              <InputBox label="연금개시 나이" value={pensionStartAge} setValue={setPensionStartAge} unit="세" />
              <InputBox label="연금 수령기간" value={pensionYears} setValue={setPensionYears} unit="년" />
              <InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "pension" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="매월 저축금액" value={monthly} setValue={setMonthly} unit="만원" />
              <InputBox label="저축기간" value={savingYears} setValue={setSavingYears} unit="년" />
<InputBox label="연금개시 나이" value={pensionStartAge} setValue={setPensionStartAge} unit="세" />
<InputBox label="연금 수령기간" value={pensionYears} setValue={setPensionYears} unit="년" />
<InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "lump" && (
            <>
              <InputBox label="현재나이" value={currentAge} setValue={setCurrentAge} unit="세" />
              <InputBox label="매월 저축금액" value={monthly} setValue={setMonthly} unit="만원" />
              <InputBox label="저축기간" value={savingYears} setValue={setSavingYears} unit="년" />
              <InputBox label="매년 평균 수익률" value={rate} setValue={setRate} unit="%" decimal />
            </>
          )}

          {tab === "nps" && (
            <InputBox
              label="월 납입보험료"
              value={npsPremium}
              setValue={setNpsPremium}
              unit="원"
            />
          )}

          {tab !== "nps" && (
            <>
              <div className="bg-blue-50 rounded-3xl p-7 text-center mt-6">
                {tab === "retire" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      현재가치 기준으로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(targetPension || 0).toLocaleString()}만원
                      </span>
                      의 연금을
                      <br />
                      <span className="font-semibold">{pensionStartAge}세</span>
                      부터{" "}
                      <span className="font-semibold">{pensionYears}년</span>간
                      받으려면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.needRetireMoney)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      <span className="font-semibold">{pensionStartAge}세</span>
                      시점까지 준비되어 있어야 하며,
                      <br />
                      매월{" "}
                      <span className="text-blue-600 font-semibold">
                        {formatKoreanMoney(result.requiredMonthlySaving)}
                      </span>
                      씩 저축해야 합니다.
                    </p>
                  </>
                )}

                {tab === "pension" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      연 <span className="font-semibold">{rate}%</span>의
                      수익률로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(monthly || 0).toLocaleString()}만원
                      </span>
                      씩{" "}
                      <span className="font-semibold">{savingYears}년</span>{" "}
                      동안 저축하면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.pensionTotal)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      <span className="font-semibold">{pensionStartAge}세</span>
 연금개시 시점에 모이며,
<br />
<span className="font-semibold">{pensionYears}년</span>
 동안 받을 예상 월 연금은{" "}
                      <span className="text-blue-600 font-semibold">
                        {formatKoreanMoney(result.estimatedMonthlyPension)}
                      </span>
                      입니다.
                    </p>
                  </>
                )}

                {tab === "lump" && (
                  <>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed">
                      연 <span className="font-semibold">{rate}%</span>의
                      수익률로
                      <br />
                      매월{" "}
                      <span className="font-semibold">
                        {Number(monthly || 0).toLocaleString()}만원
                      </span>
                      씩{" "}
                      <span className="font-semibold">{savingYears}년</span>{" "}
                      동안 저축하면
                    </p>

                    <ResultAmount value={formatKoreanMoney(result.lumpTotal)} />

                    <p className="text-gray-700 text-lg font-medium leading-relaxed mt-5">
                      은퇴시점에 모입니다.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-3xl p-8 mt-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute left-[40px] top-[40px] bottom-[40px] w-[2px] bg-gray-300" />

                    {tab === "retire" && (
                      <>
                        <TimelineItem
  age={`${currentAge}세`}
  title="현재 나이"
  desc={
    <>
      은퇴 준비 시작
      <br />
      매월{" "}
      <span className="text-blue-600 font-semibold">
        {formatKoreanMoney(result.requiredMonthlySaving)}
      </span>{" "}
      저축
    </>
  }
/>
                        <TimelineItem
                          age={`${pensionStartAge}세`}
                          title="연금 개시"
                          desc={
                            <>
                              필요 자금{" "}
                              <span className="text-blue-600 font-semibold">
                                {formatKoreanMoney(result.needRetireMoney)}
                              </span>
                            </>
                          }
                        />
                       <TimelineItem
  age={`${result.pensionEndAge}세`}
  title="연금 종료"
  desc={
    <>
      매월{" "}
      <span className="text-blue-600 font-semibold">
        {Number(targetPension || 0).toLocaleString()}만원
      </span>
      씩{" "}
      <span className="text-blue-600 font-semibold">
        {pensionYears}
      </span>
      년 수령
    </>
  }
  last
/>
                      </>
                    )}

                    {tab === "pension" && (
  <>
    <TimelineItem
      age={`${currentAge}세`}
      title="현재 나이"
      desc="저축 시작"
    />

    <TimelineItem
      age={`${result.savingEndAge}세`}
      title="저축 종료"
      desc={
        <>
          저축 완료 자산{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.lumpTotal)}
          </span>
        </>
      }
    />

    <TimelineItem
      age={`${pensionStartAge}세`}
      title="연금 개시"
      desc={
        <>
          연금개시 자산{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.pensionTotal)}
          </span>
          <br />
          월{" "}
          <span className="text-blue-600 font-semibold">
            {formatKoreanMoney(result.estimatedMonthlyPension)}
          </span>{" "}
          수령
        </>
      }
    />

    <TimelineItem
      age={`${result.pensionEndAge}세`}
      title="연금 종료"
      desc={
        <>
          <span className="text-blue-600 font-semibold">
            {pensionYears}
          </span>
          년 수령
        </>
      }
      last
    />
  </>
)}

                    {tab === "lump" && (
                      <>
                        <TimelineItem
                          age={`${currentAge}세`}
                          title="현재 나이"
                          desc="저축 시작"
                        />
                        <TimelineItem
                          age={`${result.savingEndAge}세`}
                          title="저축 종료"
                          desc={
                            <>
                              예상 목돈{" "}
                              <span className="text-blue-600 font-semibold">
                                {formatKoreanMoney(result.lumpTotal)}
                              </span>
                            </>
                          }
                          last
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "nps" && (
            <div className="space-y-5 mt-6">
              <div className="bg-blue-50 rounded-3xl p-7 text-center">
                <p className="text-gray-700 text-lg font-medium leading-relaxed">
                  월 납입보험료{" "}
                  <span className="font-semibold">
                    {formatWon(Number(npsPremium || 0))}원
                  </span>
                  기준
                  <br />
                  추정 소득기준은{" "}
                  <span className="text-blue-600 font-semibold">
                    {formatWon(result.nps.incomeBase)}원
                  </span>
                  입니다.
                </p>
              </div>

              <SectionTitle title="노령연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.nps.oldAge.map((item) => (
                  <NpsCard
                    key={item.years}
                    label={`${item.years}년 가입`}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              <SectionTitle title="장애연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {result.nps.disability.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>

              <SectionTitle title="유족연금" desc="월 지급예상액" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.nps.survivor.map((item) => (
                  <NpsCard
                    key={item.label}
                    label={item.label}
                    value={formatWon(item.amount)}
                    unit="원"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-xs text-gray-500 leading-relaxed">
  {tab === "nps" ? (
    <>
      국민연금은 2026년 A값과 기준소득월액을 기준으로 단순 계산한 값입니다.
      실제 수령액은 가입 이력, 재평가율, 부양가족연금액, 제도 변경에 따라
      달라질 수 있습니다.
    </>
  ) : (
    <>
      계산값은 입력값과 일반적인 산식에 따른 간편 추정 결과입니다.
      실제 금융상품 수익률, 세금, 수수료 등에 따라 실제 금액과 다를 수 있습니다.
    </>
  )}
</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a href="https://naver.me/xsZ8mk7H" className="py-3 flex flex-col items-center gap-1">
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>

          <a href="https://open.kakao.com/o/gD7ej63h" className="py-3 flex flex-col items-center gap-1">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>

          <a href="https://www.instagram.com/g__tree_/" className="py-3 flex flex-col items-center gap-1">
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
    </main>
  );
}

function ResultAmount({ value }: { value: string }) {
  return (
    <div className="mt-5">
      <span className="text-5xl font-black text-blue-600">{value}</span>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

function NpsCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
      <p className="text-sm font-bold text-gray-500 mb-2">{label}</p>
      <p className="text-xl font-semibold text-black">
        {value}
        <span className="text-sm font-medium text-gray-700 ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}

function TopButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        h-12 rounded-2xl font-bold text-sm transition
        ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
      `}
    >
      {children}
    </button>
  );
}

function InputBox({
  label,
  value,
  setValue,
  unit,
  decimal,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  unit: string;
  decimal?: boolean;
}) {
  return (
    <div className="mb-5">
      <label className="text-lg font-black text-gray-800 mb-3 block">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          value={
  decimal
    ? value
    : value
    ? Number(String(value).replaceAll(",", "")).toLocaleString()
    : ""
}
          onChange={(e) => {
            const raw = e.target.value.replaceAll(",", "");
            setValue(
              decimal
                ? raw.replace(/[^0-9.]/g, "")
                : raw.replace(/[^0-9]/g, "")
            );
          }}
          className="
            w-full h-16 rounded-2xl border border-gray-200
            px-5 pr-20 text-lg font-bold outline-none
            focus:ring-2 focus:ring-blue-500
          "
        />

        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
          {unit}
        </span>
      </div>
    </div>
  );
}

function TimelineItem({
  age,
  title,
  desc,
  last,
}: {
  age: string;
  title: string;
  desc: ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`relative flex items-center gap-5 ${last ? "" : "pb-10"}`}>
      <div
        className="
          w-20 h-20 rounded-full border-4 border-white
          bg-blue-600 text-white flex items-center
          justify-center text-xl font-black shadow-lg
        "
      >
        {age}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm min-w-[220px]">
        <p className="text-gray-500 font-bold text-sm">{title}</p>
        <p className="text-lg font-medium text-gray-900 mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}