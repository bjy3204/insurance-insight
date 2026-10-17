import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { parseCustomerVehicles } from "@/app/my-page/customer-form-fields";
import { disclosureMemo, parseDisclosure, parseMedicalHistories, serializeDisclosure } from "@/app/my-page/customer-disclosure";
import { parseConsultations, parseConsultationRecords, serializeConsultations } from "@/app/my-page/customer-consultations";
import { parseCustomerChecklist, parseCustomerSchedules, serializeCustomerChecklist } from "@/app/my-page/customer-checklist";

export type CustomerValues = Record<string, string>;
export type StoredCustomer = CustomerValues & { id: string; name: string; birth: string; createdAt: string };
export type StoredContract = CustomerValues & { id: string; customerId: string; createdAt: string };

function encryptionKey() {
  const encoded = process.env.CUSTOMER_DATA_ENCRYPTION_KEY;
  if (!encoded || !/^[a-f0-9]{64}$/i.test(encoded)) throw new Error("customer_encryption_not_configured");
  return Buffer.from(encoded, "hex");
}
export function sealCustomerData(value: CustomerValues, owner: string, kind: string, id: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`${owner}:${kind}:${id}:v1`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function openCustomerData(payload: string, owner: string, kind: string, id: string): CustomerValues {
  const bytes = Buffer.from(payload, "base64url");
  if (bytes.length < 29) throw new Error("invalid_customer_payload");
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(`${owner}:${kind}:${id}:v1`));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8"));
}

const customerFields = ["category", "name", "birth", "phone", "carrier", "job", "email", "address", "memo", "medicalInsurer", "medicalJoined", "medicalGeneration", "medicalMaturity", "accountOwner", "accountBirth", "bank", "accountNumber", "vehicleNumber", "vehicleType", "renewal", "insurer", "driver", "discount", "vehicles", "disclosure", "consultations", "checklist", "consentConfirmed"];
const contractFields = ["owner", "ownerBirth", "insured", "insuredBirth", "sameInsured", "date", "maturity", "insurer", "premium", "product", "immunity", "reduction", "memo", "consentConfirmed"];
export function validateCustomerValues(input: unknown, kind: "customer" | "contract"): CustomerValues {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("입력 내용을 확인해 주세요");
  const source = input as Record<string, unknown>, values: CustomerValues = {};
  for (const field of kind === "customer" ? customerFields : contractFields) {
    if (source[field] === undefined) continue;
    if (typeof source[field] !== "string" || source[field].length > (field === "vehicles" || field === "consultations" || field === "checklist" || field === "disclosure" ? 200000 : field === "memo" ? 6000 : 300)) throw new Error("입력 내용이 너무 길거나 올바르지 않습니다");
    values[field] = source[field].trim();
  }
  const name = kind === "customer" ? "name" : "owner", birth = kind === "customer" ? "birth" : "ownerBirth";
  if (!values[name] || !(kind === "customer" ? /^\d{6}-[1-8]$/ : /^\d{6}$/).test(values[birth] || "")) throw new Error(kind === "customer" ? "이름과 생년월일 7자리를 확인해 주세요" : "계약자 이름과 생년월일 6자리를 확인해 주세요");
  for (const field of ["birth", "accountBirth", "ownerBirth", "insuredBirth"]) {
    if (values[field] && !(field === "birth" ? /^\d{6}-[1-8]$/ : /^\d{6}$/).test(values[field])) throw new Error(field === "birth" ? "고객 생년월일은 7자리로 입력해 주세요" : "생년월일은 6자리로 입력해 주세요");
  }
  if (values.vehicles !== undefined) {
    try { values.vehicles = JSON.stringify(parseCustomerVehicles(values.vehicles)); } catch { throw new Error("차량정보를 확인해 주세요"); }
  }
  if(values.disclosure !== undefined) {
    try {values.disclosure=serializeDisclosure(parseDisclosure(values.disclosure),disclosureMemo(values.disclosure),parseMedicalHistories(values.disclosure));}catch{throw new Error("알릴의무 내용을 확인해 주세요");}
  }
  if(values.consultations!==undefined){
    try{values.consultations=serializeConsultations(parseConsultations(values.consultations),parseConsultationRecords(values.consultations));}catch{throw new Error("상담일지의 날짜·시간·내용을 확인해 주세요");}
  }
  if(values.checklist!==undefined){
    try{values.checklist=serializeCustomerChecklist(parseCustomerChecklist(values.checklist),parseCustomerSchedules(values.checklist));}catch{throw new Error("체크리스트의 예정일과 내용을 확인해 주세요");}
  }
  if (values.consentConfirmed !== "true") throw new Error("개인정보 수집·이용 확인을 체크해 주세요");
  return values;
}
