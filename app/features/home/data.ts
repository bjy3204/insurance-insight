import { FileText, Calculator, Monitor, Phone, Building2, FolderOpen, CircleDollarSign, Landmark, PiggyBank, Briefcase, Link2, User, Globe, Send, BookOpen, LibraryBig } from "lucide-react";

export type MemoItem = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
};

export const defaultMenus = [
   {
  id: "customer-manage",
  title: "개인공간",
  desc: "일정  · 고객관리 · AI 메시지",
  icon: User,
  link: "/my-page",
  isDefault: true,
},
{
  id: "subscriber-folder",
  title: "구독자료 폴더",
  desc: "비밀번호 : 8080",
  icon: LibraryBig,
  link: "https://naver.me/GuCQV09i",
  approvedOnly: true,
},
  {
    id: "insurance-system",
    title: "보험사전산",
    desc: "보험사별 전산 바로가기",
    icon: Monitor,
    link: "/insurance-system",
  },
  {
    id: "customer-center",
    title: "고객센터",
    desc: "고객센터 · 팩스번호 · 등기주소 안내",
    icon: Phone,
    link: "/customer-center",
  },

  {
    id: "product-public",
    title: "상품공시실",
    desc: "보험사별 상품공시실 바로가기",
    icon: Building2,
    link: "/product-public",
  },
  {
    id: "claim-docs",
    title: "청구서류",
    desc: "보험금 청구서류 안내",
    icon: FileText,
    link: "/claim-docs",
  },

  {
  id: "auto-claim",
  title: "보험금 청구",
  desc: "무료 청구 프로그램 (추천인코드 TREE)",
  icon: Send,
  link: "https://openarena.co.kr/autoclaim/login",
},

  {
    id: "insurance-folder",
    title: "보험인사이트 폴더",
    desc: "비밀번호 : 카카오톡 공지",
    icon: FolderOpen,
    link: "https://naver.me/FWTmVFQz",
  },
{
  id: "sales-book",
  title: "세일즈북",
  desc: "상담 세일즈북 자료",
  icon: BookOpen,
  link: "/sales-book",
},

  {
    id: "calculator",
    title: "실비계산기",
    desc: "세대별 실손보험금 계산기",
    icon: Calculator,
    link: "/calculator",
  },
  {
    id: "money-value",
    title: "화폐가치계산기",
    desc: "시간의 경과에 따른 화폐가치 계산",
    icon: CircleDollarSign,
    link: "/money-value",
  },
  {
    id: "saving-calculator",
    title: "예금·적금 계산기",
    desc: "단리 · 복리 만기금액 계산",
    icon: Landmark,
    link: "/saving-calculator",
  },
  {
    id: "pension-calculator",
    title: "연금계산기",
    desc: "은퇴자금 · 연금액 · 국민연금 계산",
    icon: PiggyBank,
    link: "/pension-calculator",
  },
  /*
  {
    id: "lecture",
    title: "강의일정",
    desc: "보험업계 강의 일정 공유 플랫폼",
    icon: CalendarDays,
    link: "/lecture",
  },
  */
  {
    id: "job",
    title: "채용공고",
    desc: "보험 조직 채용공고",
    icon: Briefcase,
    link: "/job",
  },
  
    {
  id: "use-link",
  title: "바로가기",
  desc: "보험 업무에 필요한 바로가기",
  icon: Link2,
  link: "/use-link",
},
];

export const personalMenuIcons = {
  globe: Globe,
  folder: FolderOpen,
  file: FileText,
  calculator: Calculator,
  briefcase: Briefcase,
  user: User,
};

export type NpsTableTab = "노령연금" | "장애연금" | "유족연금";

export type PersonalMenuIconKey = keyof typeof personalMenuIcons;

export type PersonalMenuItem = {
  id: string;
  title: string;
  desc: string;
  link: string;
  iconKey: PersonalMenuIconKey;
  isPersonal: true;
};

export type MenuItem = {
  id: string;
  title: string;
  desc: string;
  link: string;
  icon: any;
  iconKey?: PersonalMenuIconKey;
  isPersonal?: boolean;
  approvedOnly?: boolean;
};
