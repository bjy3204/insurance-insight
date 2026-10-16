export const MAX_CUSTOMERS = 30;
export const PAGE_TITLES = ["보험가입증서", "청구서류", "고객센터", "명의 리스트 1", "명의 리스트 2", "명의 리스트 3", "고객 약속", "보험 전문가", "감사 인사"];
export const TEMPLATES = {
  family: { label: "가정의달", titles: PAGE_TITLES, promise: 7, advisor: 8 },
  summer: { label: "여름휴가철", titles: ["보험가입증서", "고객센터", "여행 체크리스트", "증상별 진료과 1", "증상별 진료과 2", "긴급 전화번호부", "고객 약속", "보험 전문가", "감사 인사"], promise: 7, advisor: 8 },
  driver: { label: "운전자보험", titles: ["보험가입증서", "청구서류", "차량 경고등 1", "차량 경고등 2", "교통사고 대처법", "고객센터", "고객 약속", "보험 전문가", "감사 인사"], promise: 7, advisor: 8 },
  care: { label: "재가보험", titles: ["보험가입증서", "청구서류", "고객센터", "재가급여 종류", "시설급여 종류", "복지용구 1", "복지용구 2", "고객 약속", "보험 전문가", "감사 인사"], promise: 8, advisor: 9 },
  pet: { label: "펫보험", titles: ["보험가입증서", "반려동물 카드", "반려견 나이표", "반려묘 나이표", "청구서류", "고객센터", "고객 약속", "보험 전문가", "약속 증서"], promise: 7, advisor: 8 },
};
export type TemplateId = keyof typeof TEMPLATES;
export function isTemplateId(value: string): value is TemplateId { return Object.hasOwn(TEMPLATES, value); }
export type Advisor = { name: string; company: string; phone: string; fax?: string };
export type PetKind = "dog" | "cat";
export function templatePages(category: TemplateId, petKind: PetKind = "dog") {
  return TEMPLATES[category].titles.map((title, index) => ({ page: index + 1, title })).filter(item => category !== "pet" || item.page !== (petKind === "dog" ? 4 : 3));
}
export type PetDecoration = { kind: PetKind; src: string };
export function petDecorationHtml(page: number, category: TemplateId, pet?: PetDecoration) {
  if (category !== "pet" || page !== 2 || !pet?.src) return "";
  // The title's ink center is y=549 on the 2000px source page.
  // Align the visible artwork, compensating for each PNG's transparent margins.
  const artworkCenter = pet.kind === "cat" ? 47.875 : 51.5;
  return `<img class="insert-pet-icon" alt="${pet.kind === "cat" ? "고양이" : "강아지"}" src="${escapeHtml(pet.src)}" style="position:absolute;left:30.8%;top:27.45%;transform:translateY(-${artworkCenter}%);width:5.4%;height:auto;object-fit:contain">`;
}
export function customerNames(value: string) {
  return value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
}
export function printJobs(names: string[], pages: number[], category: TemplateId = "family", petKind?: PetKind) {
  if (!names.length || names.length > MAX_CUSTOMERS) throw new Error(`고객 이름을 1~${MAX_CUSTOMERS}명 입력해 주세요.`);
  if (names.some(name => name.length > 30)) throw new Error("고객 이름은 30자 이내로 입력해 주세요.");
  const selected = [...new Set(pages)].sort((a, b) => a - b);
  if (!selected.length || selected.some(page => !Number.isInteger(page) || page < 1 || page > TEMPLATES[category].titles.length)) throw new Error("인쇄할 페이지를 선택해 주세요.");
  const printable = category === "pet" && petKind ? selected.filter(page => templatePages(category, petKind).some(item => item.page === page)) : selected;
  if (!printable.length) throw new Error("인쇄할 페이지를 선택해 주세요.");
  return names.flatMap(customer => printable.map(page => ({ customer, page })));
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
export function overlayHtml(page: number, customer: string, advisor: Advisor, category: TemplateId = "family") {
  const text = (value: string, x: number, y: number, width: number, size: number, weight = 500, left = false, numeric = false) => {
    const units = Array.from(value).reduce((sum, character) => sum + (numeric ? /[0-9]/.test(character) ? 0.56 : /[\s()+.\-]/.test(character) ? 0.32 : 1 : 1), 0);
    const fittedSize = Math.min(size, width / Math.max(1, units));
    return `<span class="insert-text" style="left:${x}%;top:${y}%;width:${width}%;font-size:${fittedSize}cqw;font-weight:${weight};justify-content:${left ? "flex-start" : "center"}">${escapeHtml(value)}</span>`;
  };
  let result = "";
  if (page === 1) result += text(customer, 21.5, 22.4, 27.5, 8.3, 700);
  if (page === TEMPLATES[category].promise) result += text(customer, 12, 12.5, 20.3, 4.3, 700);
  if ((category === "family" || category === "summer" || category === "driver") && page === 9) result += text(customer, 26.5, 15, 26.5, 4.5, 500);
  if (category === "care" && page === 10) result += text(customer, 20.7, 19.5, 35, 5.5);
  if (category === "pet" && page === 9) result += text(customer, 21, 63.4, 27, 5);
  if (page === TEMPLATES[category].advisor) {
    result += text(advisor.name, 10, 7.1, 22, 4.6, 700);
    result += text(advisor.company, 14.5, 97.1, 22, 2.5, 500, true);
    result += text(advisor.phone, 45, 97.1, 22, 2.5, 500, true, true);
    result += text(advisor.fax || "", 76, 97.1, 21, 2.5, 500, true, true);
  }
  return result;
}
export const sheetCss = `.insert-sheet{position:relative;container-type:inline-size;aspect-ratio:210/297;background:white;overflow:hidden}.insert-sheet>img{display:block;width:100%;height:100%;object-fit:fill}.insert-text{position:absolute;display:flex;align-items:center;justify-content:center;line-height:1.15;white-space:nowrap;color:#222;transform:translateY(-50%);font-family:Arial,"Malgun Gothic",sans-serif;letter-spacing:-.04em}`;
export function printDocument(jobs: ReturnType<typeof printJobs>, images: Record<number, string>, advisor: Advisor, category: TemplateId = "family", pet?: PetDecoration) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>증권 속지 인쇄</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}${sheetCss}.insert-sheet{width:210mm;height:297mm;break-after:page;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}.insert-sheet:last-child{break-after:auto;page-break-after:auto}</style></head><body>${jobs.map(job => `<article class="insert-sheet"><img alt="" src="${escapeHtml(images[job.page] || "")}">${overlayHtml(job.page, job.customer, advisor, category)}${petDecorationHtml(job.page, category, pet)}</article>`).join("")}</body></html>`;
}
