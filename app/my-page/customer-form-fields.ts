export const CUSTOMER_CATEGORIES = ["지인", "소개", "가족", "DB", "SNS", "인하우스", "산모교실"] as const;
export const CUSTOMER_BANKS = ["국민은행", "신한은행", "우리은행", "하나은행", "농협", "기업은행", "부산은행", "경남은행", "대구은행", "광주은행", "전북은행", "제주은행", "수협", "산업은행", "씨티은행", "SC제일은행", "카카오뱅크", "케이뱅크", "토스뱅크", "농축협", "새마을금고", "우체국"] as const;
export const CUSTOMER_INSURERS = ["삼성화재", "현대해상", "DB손해", "KB손해", "메리츠화재", "한화손해", "흥국화재", "롯데손해", "AXA", "하나손해", "캐롯"] as const;

export function formatCustomerBirth(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 7);
  return digits.length > 6 ? `${digits.slice(0, 6)}-${digits[6]}` : digits;
}
export const shortCustomerBirth = (value: string) => value.replace(/\D/g, "").slice(0, 6);
export const VEHICLE_FIELDS = ["vehicleNumber", "vehicleType", "renewal", "insurer", "driver", "discount"] as const;
export type CustomerVehicle = Record<(typeof VEHICLE_FIELDS)[number], string>;
export const emptyCustomerVehicle = (): CustomerVehicle => ({ vehicleNumber:"", vehicleType:"", renewal:"", insurer:"", driver:"", discount:"" });
export function parseCustomerVehicles(serialized: string): CustomerVehicle[] {
  const list: unknown = JSON.parse(serialized);
  if (!Array.isArray(list) || list.length < 1 || list.length > 100) throw new Error("차량정보를 확인해 주세요.");
  return list.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("차량정보를 확인해 주세요.");
    const result = emptyCustomerVehicle();
    for (const key of VEHICLE_FIELDS) {
      const value = (item as Record<string, unknown>)[key] ?? "";
      if (typeof value !== "string" || value.length > 300) throw new Error("차량정보를 확인해 주세요.");
      result[key] = value.trim();
    }
    return result;
  });
}
export function customerVehicles(values: Record<string, string>): CustomerVehicle[] {
  if (values.vehicles) {
    try { return parseCustomerVehicles(values.vehicles); } catch { /* Older records retain their original single-vehicle fields. */ }
  }
  const vehicle = emptyCustomerVehicle();
  for (const key of VEHICLE_FIELDS) vehicle[key] = values[key] || "";
  return [vehicle];
}
export function customerGender(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 7 ? Number(digits[6]) % 2 ? "남" : "여" : "";
}
export function formatCustomerPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  if (digits.startsWith("02")) {
    const phone = digits.slice(0, 10);
    return phone.length <= 2 ? phone : phone.length <= 6 ? `${phone.slice(0, 2)}-${phone.slice(2)}` : `${phone.slice(0, 2)}-${phone.slice(2, -4)}-${phone.slice(-4)}`;
  }
  if (digits.startsWith("050") && digits.length === 12) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  const phone = digits.slice(0, 11);
  return phone.length <= 3 ? phone : phone.length <= 7 ? `${phone.slice(0, 3)}-${phone.slice(3)}` : `${phone.slice(0, 3)}-${phone.slice(3, -4)}-${phone.slice(-4)}`;
}

export function formatCustomerDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length <= 4 ? digits : digits.length <= 6 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function withCustomerClaimDefaults(values: Record<string, string>): Record<string, string> {
  return {
    ...values,
    accountOwner: values.accountOwner?.trim() ? values.accountOwner : values.name || "",
    accountBirth: shortCustomerBirth(values.accountBirth?.trim() ? values.accountBirth : values.birth || ""),
  };
}

export function withContractDefaults(values: Record<string, string>, today: string): Record<string, string> {
  const sameInsured = values.sameInsured !== "false";
  return {
    ...values,
    ownerBirth: shortCustomerBirth(values.ownerBirth || ""),
    date: values.date?.trim() ? values.date : today,
    sameInsured: String(sameInsured),
    insured: sameInsured ? values.owner || "" : values.insured || "",
    insuredBirth: shortCustomerBirth(sameInsured ? values.ownerBirth || "" : values.insuredBirth || ""),
  };
}

export type CustomerIdentity = { name: string; birth: string };
const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export function customerNameStartsWith(name: string, query: string) {
  const search = [...query.trim().toLocaleLowerCase()];
  const letters = [...name.trim().toLocaleLowerCase()];
  return search.length > 0 && search.every((letter, index) => {
    const actual = letters[index];
    if (!actual) return false;
    const syllable = actual.charCodeAt(0) - 0xac00;
    return letter === actual || initials.includes(letter) && syllable >= 0 && syllable < 11172 && initials[Math.floor(syllable / 588)] === letter;
  });
}

export function updateContractDraft(previous: Record<string, string>, field: string, value: string): Record<string, string> {
  if (field === "sameInsured" && value === "true") return { ...previous, sameInsured: "true", insured: "", insuredBirth: "" };
  if (field === "insured" || field === "insuredBirth" || field === "sameInsured") {
    const cleared: Record<string, string> = previous.sameInsured !== "false" ? { insured: "", insuredBirth: "" } : {};
    return { ...previous, ...cleared, sameInsured: "false", [field]: value };
  }
  return { ...previous, [field]: value };
}
