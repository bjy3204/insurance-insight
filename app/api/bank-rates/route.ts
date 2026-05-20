import { NextResponse } from "next/server";

const API_KEY = process.env.FINLIFE_API_KEY;

const BANK_LOGOS: Record<string, string> = {
  "국민은행": "kb",
  "신한은행": "shinhan",
  "우리은행": "woori",
  "하나은행": "hana",
  "농협은행주식회사": "nh",
  "중소기업은행": "ibk",
  "SC제일은행": "sc",
  "수협은행": "suhyup",
  "주식회사 카카오뱅크": "kakao",
  "주식회사 케이뱅크": "kbank",
  "토스뱅크 주식회사": "toss",
};

const BANK_NAMES: Record<string, string> = {
  "국민은행": "KB국민은행",
  "신한은행": "신한은행",
  "우리은행": "우리은행",
  "하나은행": "하나은행",
  "농협은행주식회사": "NH농협은행",
  "중소기업은행": "IBK기업은행",
  "SC제일은행": "SC제일은행",
  "수협은행": "수협은행",
  "주식회사 카카오뱅크": "카카오뱅크",
  "주식회사 케이뱅크": "케이뱅크",
  "토스뱅크 주식회사": "토스뱅크",
};

const BANK_URLS: Record<string, string> = {
  "국민은행": "https://obank.kbstar.com",
  "신한은행": "https://www.shinhan.com",
  "우리은행": "https://www.wooribank.com",
  "하나은행": "https://www.kebhana.com",
  "농협은행주식회사": "https://banking.nonghyup.com",
  "중소기업은행": "https://www.ibk.co.kr",
  "SC제일은행": "https://www.standardchartered.co.kr",
  "수협은행": "https://www.suhyup-bank.com",
  "주식회사 카카오뱅크": "https://www.kakaobank.com",
  "주식회사 케이뱅크": "https://www.kbanknow.com",
  "토스뱅크 주식회사": "https://www.tossbank.com",
};

const BANK_HOVERS: Record<string, string> = {
  "국민은행": "hover:bg-yellow-50",
  "신한은행": "hover:bg-blue-50",
  "우리은행": "hover:bg-sky-50",
  "하나은행": "hover:bg-emerald-50",
  "농협은행주식회사": "hover:bg-yellow-50",
  "중소기업은행": "hover:bg-blue-50",
  "SC제일은행": "hover:bg-cyan-50",
  "수협은행": "hover:bg-sky-50",
  "주식회사 카카오뱅크": "hover:bg-yellow-50",
  "주식회사 케이뱅크": "hover:bg-purple-50",
  "토스뱅크 주식회사": "hover:bg-blue-50",
};

const TARGET_BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행주식회사",
  "중소기업은행",
  "SC제일은행",
  "수협은행",
  "주식회사 카카오뱅크",
  "주식회사 케이뱅크",
  "토스뱅크 주식회사",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month") || "12";

    const url =
      `https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json` +
      `?auth=${API_KEY}&topFinGrpNo=020000&pageNo=1`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    const data = await res.json();

    const baseList = data.result.baseList;
    const optionList = data.result.optionList;

    const filtered = optionList.filter(
      (item: any) => item.save_trm === month
    );

const targetBaseList = baseList.filter((base: any) =>
  TARGET_BANKS.includes(base.kor_co_nm)
);

    const mapped = filtered.map((item: any) => {
      const bank = targetBaseList.find(
        (base: any) =>
          base.fin_prdt_cd === item.fin_prdt_cd &&
          base.fin_co_no === item.fin_co_no
      );

      return {
        name: BANK_NAMES[bank?.kor_co_nm] || bank?.kor_co_nm || "",
        logo:
          BANK_LOGOS[bank?.kor_co_nm] || "",
        rate: item.intr_rate
          ? `${Number(item.intr_rate).toFixed(2)}%`
          : "-",
        month,
        baseMonth: data.result.baseList?.[0]?.dcls_month || "",
        url: BANK_URLS[bank?.kor_co_nm] || "",
hover: BANK_HOVERS[bank?.kor_co_nm] || "hover:bg-gray-50",
      };
    });

    const cleaned = mapped.filter((item: any) => item.name && item.logo);

    const uniqueBanks = cleaned.filter(
      (item: any, index: number, self: any[]) =>
        index ===
        self.findIndex(
          (t) => t.name === item.name
        )
    );

    return NextResponse.json(uniqueBanks);
  } catch (error) {
    return NextResponse.json(
      {
        error: "API 호출 실패",
      },
      { status: 500 }
    );
  }
}