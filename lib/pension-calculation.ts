import tables from "@/app/pension-calculator/data/nps-tables.json";

export type PensionInput = { tab: "retire" | "pension" | "lump" | "nps"; currentAge: string; pensionStartAge: string; pensionYears: string; savingYears: string; monthly: string; targetPension: string; rate: string; npsPremium: string };
// Monthly deposits and withdrawals occur at month end; nominal annual rate / 12.
export function calculatePension(input: PensionInput) {
  const current = Number(input.currentAge || 0), startAge = Number(input.pensionStartAge || 0);
  const receiveYears = Number(input.pensionYears || 0), saveYears = Number(input.savingYears || 0);
  const monthlySave = Number(input.monthly || 0) * 10000, target = Number(input.targetPension || 0) * 10000;
  const monthlyRate = Number(input.rate || 0) / 1200;
  const savingMonths = Math.max(input.tab === "retire" ? startAge - current : saveYears, 0) * 12;
  const pensionMonths = Math.max(receiveYears, 0) * 12;
  const fvFactor = monthlyRate === 0 ? savingMonths : Math.expm1(savingMonths * Math.log1p(monthlyRate)) / monthlyRate;
  const pvFactor = monthlyRate === 0 ? pensionMonths : -Math.expm1(-pensionMonths * Math.log1p(monthlyRate)) / monthlyRate;
  const needRetireMoney = target * pvFactor;
  const requiredMonthlySaving = fvFactor > 0 ? needRetireMoney / fvFactor : 0;
  const lumpTotal = monthlySave * fvFactor;
  const pensionTotal = lumpTotal * Math.pow(1 + monthlyRate, Math.max((startAge - current - saveYears) * 12, 0));
  const estimatedMonthlyPension = pvFactor > 0 ? pensionTotal / pvFactor : 0;
  const premium = Number(input.npsPremium || 0);
  const exactIncome = tables.oldAge.find(row => row.premium === premium)?.income;
  const incomeBase = premium > 0 ? exactIncome ?? Math.min(6590000, Math.max(410000, Math.floor(premium * 100 / 9.5 / 1000 + 1e-9) * 1000)) : 0;
  function tableValue(rows: { income: number; [key: string]: number }[], key: string) {
    if (!incomeBase) return 0;
    const highIndex = rows.findIndex(row => row.income >= incomeBase);
    const high = rows[highIndex < 0 ? rows.length - 1 : highIndex];
    const low = rows[Math.max(0, highIndex - 1)];
    const amount = high.income === low.income ? high[key] : low[key] + (high[key] - low[key]) * (incomeBase - low.income) / (high.income - low.income);
    return Math.round(amount / 10) * 10;
  }
  let error = "";
  const fields = input.tab === "nps" ? [input.npsPremium] : input.tab === "lump" ? [input.currentAge, input.monthly, input.savingYears, input.rate] : input.tab === "retire" ? [input.currentAge, input.pensionStartAge, input.pensionYears, input.targetPension, input.rate] : [input.currentAge, input.pensionStartAge, input.pensionYears, input.monthly, input.savingYears, input.rate];
  if (fields.some(value => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))) error = "입력값을 확인해 주세요";
  else if ((input.tab === "retire" || input.tab === "pension") && input.currentAge && input.pensionStartAge && startAge <= current) error = "연금 개시 나이는 현재 나이보다 높게 입력해 주세요";
  else if (input.tab === "pension" && input.currentAge && input.pensionStartAge && input.savingYears && current + saveYears > startAge) error = "저축 종료 시점이 연금 개시보다 늦습니다. 저축기간이나 연금 개시 나이를 조정해 주세요";
  else if ((input.tab === "retire" || input.tab === "pension") && input.pensionYears && receiveYears <= 0) error = "연금 수령기간은 1년 이상 입력해 주세요";
  else if ((input.tab === "pension" || input.tab === "lump") && input.savingYears && saveYears <= 0) error = "저축기간은 1년 이상 입력해 주세요";
  else if (input.tab === "nps" && input.npsPremium && (premium < 38950 || premium > 626050)) error = "월 납입보험료는 총 보험료 기준 38,950원~626,050원으로 입력해 주세요";
  else if (![needRetireMoney, requiredMonthlySaving, lumpTotal, pensionTotal, estimatedMonthlyPension].every(Number.isFinite)) error = "입력값이 너무 큽니다. 금액과 기간을 확인해 주세요";
  return { error, current, startAge, receiveYears, pensionEndAge: startAge + receiveYears, savingEndAge: current + saveYears, needRetireMoney, requiredMonthlySaving, pensionTotal, estimatedMonthlyPension, lumpTotal,
    nps: { incomeBase, oldAge: [10, 20, 30].map(years => ({ years, amount: tableValue(tables.oldAge, `year${years}`) })),
      disability: ["grade1", "grade2", "grade3", "grade4Lump"].map((key, index) => ({ label: ["장애 1급", "장애 2급", "장애 3급", "장애 4급(일시금)"][index], amount: tableValue(tables.disability, key) })),
      survivor: ["under10", "between10And20", "year20"].map((key, index) => ({ label: ["10년 미만 가입", "10년~20년 미만", "20년 가입"][index], amount: tableValue(tables.survivor, key) })) } };
}
