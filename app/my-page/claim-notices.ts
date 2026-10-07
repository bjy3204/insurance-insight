// 기본 서류는 app/claim-docs/page.tsx의 해당 청구 항목을 기준으로 합니다.
export const claimNotices = [
  { id: "hospital", label: "입원", title: "입원 보험금", content: "입퇴원확인서 (질병코드 필수)\n진료비 영수증\n진료비 세부내역서" },
  { id: "surgery", label: "수술", title: "수술 보험금", content: "진단서 또는 진료확인서 (질병코드 필수)\n수술확인서" },
  { id: "outpatient", label: "통원", title: "통원 보험금", content: "진단서 또는 진료확인서 (질병코드 필수)\n진료비 영수증\n진료비 세부내역서\n약제비 영수증" },
  { id: "car-injury", label: "자부상", title: "자동차부상치료비", content: "진단서\n지급결의서\n교통사고사실확인원 (경찰 신고 시)" },
  { id: "pet", label: "펫", title: "펫 보험금", content: "진료비 영수증\n진료비 세부내역서\n초진차트 (또는 진료기록부)\n수술기록지 (수술시)" },
  { id: "dental", label: "치아", title: "치아 보험금", content: "치과치료확인서\n치과진료기록부 사본\n치료 전/후 파노라마 X-ray 사진" },
] as const;

export type ClaimKind = (typeof claimNotices)[number]["id"];
export function getClaimNotice(id: string) {
  return claimNotices.find(item => item.id === id) ?? claimNotices[0];
}

export type ClaimNoticeText = {
  title: string;
  introduction: string;
  documents: string;
  additional: string;
  closing: string;
};

export function getDefaultClaimText(id: string): ClaimNoticeText {
  const notice = getClaimNotice(id);
  return {
    title: `${notice.title} 청구 서류 안내`,
    introduction: "보험금 청구에 필요한 서류를 안내드립니다",
    documents: notice.content.split("\n").map((line, index) => `${String(index + 1).padStart(2, "0")} ${line}`).join("\n"),
    additional: "보험사 및 가입한 보장에 따라 추가 서류가 필요할 수 있습니다",
    closing: "서류 준비에 궁금한 점이 있으시면 연락해 주세요 !",
  };
}

export function readClaimText(id: string, stored: string | null): ClaimNoticeText {
  const defaults = getDefaultClaimText(id);
  if (stored == null) return defaults;
  try {
    const value = JSON.parse(stored);
    if (value && value.version === 1) {
      return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof value[key] === "string" ? value[key] : fallback])) as ClaimNoticeText;
    }
  } catch { /* 기존 서류 목록만 저장한 내용도 이어서 불러옵니다. */ }
  return { ...defaults, documents: stored };
}

export function formatClaimContent(text: ClaimNoticeText): string {
  return `${text.title}\n${text.introduction}\n\n${text.documents}\n\n${text.additional}\n${text.closing}`;
}

export function readClaimContent(id: string, stored: string | null): string {
  if (stored != null) {
    try {
      const value = JSON.parse(stored);
      if (value?.version === 2 && typeof value.content === "string") return formatClaimContent(parseClaimContent(updateClaimDefaults(id, normalizeClaimPunctuation(value.content))));
    } catch { /* 이전에 저장한 서류 목록을 아래에서 변환합니다. */ }
  }
  return updateClaimDefaults(id, normalizeClaimPunctuation(formatClaimContent(readClaimText(id, stored))));
}

export function updateClaimDefaults(id: string, content: string): string {
  const text = parseClaimContent(content);
  const oldHospital = "01 진단서 또는 입퇴원확인서 (질병코드 필수)\n02 진료비 영수증\n03 진료비 세부내역서";
  const oldCar = "01 지급결의서\n02 진단서\n03 교통사고사실확인원 (경찰 신고 시)";
  if ((id === "hospital" && text.documents === oldHospital) || (id === "car-injury" && text.documents === oldCar)) {
    return formatClaimContent({ ...text, documents: getDefaultClaimText(id).documents });
  }
  return content;
}

export function normalizeClaimPunctuation(content: string): string {
  return content.replace(/\./g, "").replace(/[ \t]*!/g, " !");
}

export function parseClaimContent(content: string): ClaimNoticeText {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n[ \t]*\n/);
  if (blocks.length >= 5) {
    return { title: blocks[0], introduction: blocks[1], documents: blocks.slice(2, -2).join("\n"), additional: blocks.at(-2) ?? "", closing: blocks.at(-1) ?? "" };
  }
  // 빈 줄을 지워도 입력한 문장은 모두 미리보기에 남도록 합니다.
  const lines = content.split("\n").filter(line => line.trim());
  if (lines.length >= 5) return { title: lines[0], introduction: lines[1], documents: lines.slice(2, -2).join("\n"), additional: lines.at(-2) ?? "", closing: lines.at(-1) ?? "" };
  return { title: lines[0] ?? "", introduction: lines[1] ?? "", documents: lines.slice(2).join("\n"), additional: "", closing: "" };
}
