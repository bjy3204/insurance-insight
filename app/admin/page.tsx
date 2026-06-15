"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import MemoStickers from "@/app/components/MemoStickers";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  UserPlus,
  Pencil,
  NotebookPen,
  Eye,
  EyeOff,
  Pin,
} from "lucide-react";

// --- 기존 회원 타입 ---
type Profile = {
  id: string;
  nickname: string | null;
  instagram_id: string | null;
  status: string | null;
  role: string | null;
  created_at: string | null;
  linked_subscriber_id: string | null;
  kakao_connected: boolean | null;
};

// --- 구독자 타입 ---
type Subscriber = {
  id: string;
  subscriber_id: string;
  name: string;
  data_room: string;
  video_room: string;
  pay_app: boolean;
  pay_app_code: string;
  memo: string;
  status: string;
  created_at: string;
  is_checked: boolean;
};

type SubscriberMonthly = {
  id: string;
  subscriber_id: string;
  month_key: string;
  status: string;
  created_at: string;
  subscribers: Subscriber;
};

const STATUS_LABEL: Record<string, string> = {
  approved: "승인",
  pending: "대기",
  rejected: "거절",
};

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
};

function SortableMemoCard({ memo, children }: { memo: MemoItem; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: memo.id, disabled: memo.pinned });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : 1 }} {...attributes} {...listeners} className={memo.pinned ? "" : "touch-none"}>
      {children}
    </div>
  );
}

function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  const pages = Array.from(
    { length: end - start + 1 },
    (_, i) => start + i
  );

  return (
    <div className="sticky bottom-0 z-30 -mx-5 mt-4 bg-gray-50/95 backdrop-blur px-5 py-3 flex justify-center">
      <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm bg-white shadow-sm">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-10 px-4 bg-white text-gray-500 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer whitespace-nowrap"
        >
          이전
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-10 min-w-10 px-3 border-l border-gray-200 cursor-pointer ${
              page === p
                ? "bg-slate-800 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-10 px-4 border-l border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer whitespace-nowrap"
        >
          다음
        </button>
      </div>
    </div>
  );
}


type MemoItem = {
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




export default function AdminPage() {
  const { authUser, authLoading, authStatus, memos, saveMemos } = useAuth();
  const router = useRouter();

  // --- 탭 상태 ---
   const [adminTab, setAdminTab] = useState<"members" | "subscribers" | "notices">("members");

// 공지 카테고리 타입
type NoticeCategory = { id: string; name: string; color: string; };
type NoticeDB = {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  is_popup: boolean;
  is_pinned: boolean;
  popup_start_date: string | null;
  popup_end_date: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  created_at: string;
};


// 공지 상태
const [noticeCategories, setNoticeCategories] = useState<NoticeCategory[]>([]);
const [noticesDB, setNoticesDB] = useState<NoticeDB[]>([]);
const [noticeForm, setNoticeForm] = useState({
  title: "",
  content: "",
  category_id: "",
  is_popup: false,
  is_pinned: false,
  popup_start_date: "",
  popup_end_date: "",
  image_url: "",
  image_urls: [] as string[],
});

const [imageUploading, setImageUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const [noticeFormOpen, setNoticeFormOpen] = useState(false);
const [editingNotice, setEditingNotice] = useState<NoticeDB | null>(null);
const [catForm, setCatForm] = useState({ name: "", color: "blue" });
const [noticeSaving, setNoticeSaving] = useState(false);

const [noticeDatePickerOpen, setNoticeDatePickerOpen] =
  useState<null | "start" | "end">(null);
const [noticePickerYear, setNoticePickerYear] = useState(new Date().getFullYear());
const [noticePickerMonth, setNoticePickerMonth] = useState(new Date().getMonth());

  // --- 기존 회원 관리 상태 ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileSubSearch, setProfileSubSearch] = useState("");
  const [profileSubPayFilter, setProfileSubPayFilter] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const [subCurrentPage, setSubCurrentPage] = useState(1);
const SUB_PAGE_SIZE = 50;

  // --- 구독자 관리 상태 ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<SubscriberMonthly[]>([]);
  const [missingData, setMissingData] = useState<Subscriber[]>([]);
  const [subSearch, setSubSearch] = useState("");
  
const [saveTargetYear, setSaveTargetYear] = useState(new Date().getFullYear());
const [saveTargetMonth, setSaveTargetMonth] = useState(new Date().getMonth() + 1);
const [savingMonthly, setSavingMonthly] = useState(false);


// 전체 구독자 팝업 필터/정렬
const [allSubPayFilter, setAllSubPayFilter] = useState(false);
const [allSubSort, setAllSubSort] =
  useState<"name" | "date" | "checked-desc" | "checked-asc">("date");

// 월별 리스트 필터/정렬
const [monthlyPayFilter, setMonthlyPayFilter] = useState(false);
const [monthlySort, setMonthlySort] = useState<"name" | "date">("date");


  // 팝업 상태
  const [isSubPopupOpen, setIsSubPopupOpen] = useState(false);
  const [isAllSubPopupOpen, setIsAllSubPopupOpen] = useState(false);
  const [isSelectPopupOpen, setIsSelectPopupOpen] = useState(false);
  
  // 삭제 확인 팝업 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);
  
  // 폼 상태
  const [subForm, setSubForm] = useState({
    id: "",
    subscriber_id: "",
    name: "",
    data_room: "",
    video_room: "",
    pay_app: false,
    pay_app_code: "",
    memo: "",
  });

  const openNoticeDatePicker = (type: "start" | "end") => {
  const value =
    type === "start"
      ? noticeForm.popup_start_date
      : noticeForm.popup_end_date;

  if (value) {
    const [y, m] = value.split("-").map(Number);
    setNoticePickerYear(y);
    setNoticePickerMonth(m - 1);
  }

  setNoticeDatePickerOpen(type);
};

  // 전체 구독자 팝업 상태
  const [allSubscribers, setAllSubscribers] = useState<Subscriber[]>([]);
  const [allSubTab, setAllSubTab] = useState<"all" | "active" | "canceled">("all");
  const [allSubSearch, setAllSubSearch] = useState("");

  // 월별 추가 선택 팝업 검색
  const [selectSearch, setSelectSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

const handleMemoDragEnd = (event: any) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const activeMemo = memos.find(m => m.id === active.id);
  const overMemo = memos.find(m => m.id === over.id);
  if (!activeMemo || !overMemo) return;
  if (activeMemo.pinned || overMemo.pinned) return;
  const pinnedMemos = memos.filter(m => m.pinned);
  const normalMemos = memos.filter(m => !m.pinned);
  const oldIndex = normalMemos.findIndex(m => m.id === active.id);
  const newIndex = normalMemos.findIndex(m => m.id === over.id);
  saveMemos([...pinnedMemos, ...arrayMove(normalMemos, oldIndex, newIndex)]);
};



const [isMemoOpen, setIsMemoOpen] = useState(false);
const [isPencilOpen, setIsPencilOpen] = useState(false);
const [memoSearch, setMemoSearch] = useState("");
const [memoPage, setMemoPage] = useState(1);
const [memoTitle, setMemoTitle] = useState("");
const [memoContent, setMemoContent] = useState("");
const [memoColor, setMemoColor] = useState<MemoItem["color"]>("white");
const [memoAddOpen, setMemoAddOpen] = useState(false);
const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
const [deleteMemoConfirmOpen, setDeleteMemoConfirmOpen] = useState(false);
const [deleteMemoId, setDeleteMemoId] = useState<string | null>(null);
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);


const [memoAddPopupPos, setMemoAddPopupPos] = useState({ x: 0, y: 0 });
const [memoEditPopupPos, setMemoEditPopupPos] = useState({ x: 0, y: 0 });
const memoAddDragRef = useRef({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
const memoEditDragRef = useRef({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });



  // 드래그 이동 state
const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const dragStart = useRef({ x: 0, y: 0 });


  // --- 날짜 계산 ---
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

useEffect(() => {
  const handleClick = () => setIsPencilOpen(false);
  if (isPencilOpen) window.addEventListener("click", handleClick);
  return () => window.removeEventListener("click", handleClick);
}, [isPencilOpen]);

useEffect(() => {
  const handleMemoContext = (e: Event) => {
    const { x, y, id } = (e as CustomEvent).detail;
    setContextMenu({ x, y, id });
  };
  const handleMemoDetail = (e: Event) => {
    const id = (e as CustomEvent).detail;
    const target = memos.find((m: MemoItem) => m.id === id);
    if (target) openMemoEdit(target);
  };
  window.addEventListener("open-memo-context-menu", handleMemoContext);
  window.addEventListener("open-memo-detail", handleMemoDetail);
  return () => {
    window.removeEventListener("open-memo-context-menu", handleMemoContext);
    window.removeEventListener("open-memo-detail", handleMemoDetail);
  };
}, [memos]);

useEffect(() => {
  const closeContextMenu = () => setContextMenu(null);
  window.addEventListener("pointerdown", closeContextMenu);
  return () => window.removeEventListener("pointerdown", closeContextMenu);
}, []);


  // --- 관리자 체크 및 데이터 로드 ---
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (data?.role !== "admin") {
        router.replace("/");
        return;
      }

                    Promise.all([fetchProfiles(), fetchSubscribers(), fetchAllSubscribers(), loadNoticeData()]).then(() => setLoading(false));





      
    };

    checkAdmin();
  }, [authUser, authLoading, currentMonth]);

  // --- 기존 회원 관리 함수 ---
  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nickname, instagram_id, status, role, created_at, linked_subscriber_id, kakao_connected")
      .order("created_at", { ascending: false });
    setProfiles((data as Profile[]) || []);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    if (selectedProfile?.id === id) {
      setSelectedProfile((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
    setUpdating(null);
  };

  // --- 공지사항 관리 함수 ---
  const loadNoticeData = async () => {
    const { data: cats } = await supabase.from("notice_categories").select("*").order("created_at");
    if (cats) setNoticeCategories(cats);
    const { data: nts } = await supabase.from("notices_db").select("*").order("created_at", { ascending: false });
    if (nts) setNoticesDB(nts);
  };

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  setImageUploading(true);

  try {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("notice-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("notice-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    setNoticeForm((prev: any) => ({
      ...prev,
      image_urls: [...(prev.image_urls || []), ...uploadedUrls],
      image_url: uploadedUrls[0] || prev.image_url,
    }));
  } catch (error) {
    console.error("Error uploading image:", error);
    alert("이미지 업로드에 실패했습니다.");
  } finally {
    setImageUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  const saveNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;
    setNoticeSaving(true);
        if (editingNotice) {
      await supabase.from("notices_db").update({
        title: noticeForm.title, content: noticeForm.content,
        category_id: noticeForm.category_id || null,
        is_popup: noticeForm.is_popup,
        is_pinned: noticeForm.is_pinned,
        popup_start_date: noticeForm.popup_start_date || null,
        popup_end_date: noticeForm.popup_end_date || null,
        image_url: noticeForm.image_url || null,
        image_urls: noticeForm.image_urls || [],
      }).eq("id", editingNotice.id);
    } else {
      await supabase.from("notices_db").insert({
        title: noticeForm.title, content: noticeForm.content,
        category_id: noticeForm.category_id || null,
        is_popup: noticeForm.is_popup,
        is_pinned: noticeForm.is_pinned,
        popup_start_date: noticeForm.popup_start_date || null,
        popup_end_date: noticeForm.popup_end_date || null,
        image_url: noticeForm.image_url || null,
        image_urls: noticeForm.image_urls || [],
      });
    }

    setNoticeForm({
  title: "",
  content: "",
  category_id: "",
  is_popup: false,
  is_pinned: false,
  popup_start_date: "",
  popup_end_date: "",
  image_url: "",
  image_urls: [],
});

    setNoticeFormOpen(false);
    setEditingNotice(null);
    setNoticeSaving(false);
    loadNoticeData();
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("공지를 삭제하시겠습니까?")) return;
    await supabase.from("notices_db").delete().eq("id", id);
    loadNoticeData();
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) return;
    await supabase.from("notice_categories").insert({ name: catForm.name, color: catForm.color });
    setCatForm({ name: "", color: "blue" });
    loadNoticeData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("카테고리를 삭제하시겠습니까?")) return;
    await supabase.from("notice_categories").delete().eq("id", id);
    loadNoticeData();
  };

  // --- 구독자 관리 함수 ---
  const fetchSubscribers = async () => {
    const { data: currentData } = await supabase
      .from("subscriber_monthly")
      .select("*, subscribers(*)")
      .eq("month_key", monthKey)
      .order("created_at", { ascending: false });

    const { data: prevData } = await supabase
      .from("subscriber_monthly")
      .select("*, subscribers(*)")
      .eq("month_key", prevMonthKey)
      .eq("status", "active");

    const currentSubIds = new Set(currentData?.map((d) => d.subscriber_id));
    const missing = prevData
      ?.filter((d) => !currentSubIds.has(d.subscriber_id))
      .map((d) => d.subscribers as unknown as Subscriber) || [];

    setMonthlyData((currentData as unknown as SubscriberMonthly[]) || []);
    setMissingData(missing);
  };

  const fetchAllSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setAllSubscribers((data as Subscriber[]) || []);
  };

  const toggleSubscriberCheck = async (sub: Subscriber) => {
  const nextChecked = !sub.is_checked;

  setAllSubscribers((prev) =>
    prev.map((s) =>
      s.id === sub.id ? { ...s, is_checked: nextChecked } : s
    )
  );

  const { error } = await supabase
    .from("subscribers")
    .update({ is_checked: nextChecked })
    .eq("id", sub.id);

  if (error) {
    alert("체크 저장에 실패했습니다.");
    fetchAllSubscribers();
  }
};

const toggleAllSubscriberChecks = async () => {
  const targetIds = filteredAllSubs.map((s) => s.id)

  if (targetIds.length === 0) return

  const allChecked = filteredAllSubs.every((s) => s.is_checked)
  const nextChecked = !allChecked

  setAllSubscribers((prev) =>
    prev.map((s) =>
      targetIds.includes(s.id)
        ? { ...s, is_checked: nextChecked }
        : s
    )
  )

  const { error } = await supabase
    .from("subscribers")
    .update({ is_checked: nextChecked })
    .in("id", targetIds)

  if (error) {
    alert("전체 체크 저장에 실패했습니다.")
    fetchAllSubscribers()
  }
}

  const openSubPopup = (sub?: Subscriber) => {
    if (sub) {
      setSubForm({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        name: sub.name,
        data_room: sub.data_room || "",
        video_room: sub.video_room || "",
        pay_app: sub.pay_app,
        pay_app_code: sub.pay_app_code || "",
        memo: sub.memo || "",
      });
    } else {
      setSubForm({ id: "", subscriber_id: "", name: "", data_room: "", video_room: "", pay_app: false, pay_app_code: "", memo: "" });

    }
    setIsSubPopupOpen(true);
  };

  const saveSubscriber = async () => {
    if (!subForm.subscriber_id) return alert("아이디를 입력해주세요.");

    if (!subForm.id) {
      await supabase.from("subscribers").insert({
        subscriber_id: subForm.subscriber_id,
        name: subForm.name,
        data_room: subForm.data_room,
        video_room: subForm.video_room,
        pay_app: subForm.pay_app,
         pay_app_code: subForm.pay_app_code,
        memo: subForm.memo,
        status: "active",
      });
    } else {
      await supabase.from("subscribers").update({
        subscriber_id: subForm.subscriber_id,
        name: subForm.name,
        data_room: subForm.data_room,
        video_room: subForm.video_room,
        pay_app: subForm.pay_app,
         pay_app_code: subForm.pay_app_code,
        memo: subForm.memo,
      }).eq("id", subForm.id);
    }

    setIsSubPopupOpen(false);
    fetchAllSubscribers();
    fetchSubscribers();
  };

const saveActiveSubscribersToMonth = async () => {
  const targetMonthKey = `${saveTargetYear}-${String(saveTargetMonth).padStart(2, "0")}`;

console.log(
  allSubscribers.reduce((acc: Record<string, number>, sub) => {
    const key = sub.status || "null";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})
);


 const activeSubscribers = allSubscribers.filter(
  (sub) => sub.status !== "canceled"
);

  if (activeSubscribers.length === 0) {
    alert("저장할 구독중 구독자가 없습니다.");
    return;
  }

  const ok = confirm(
    `${saveTargetYear}년 ${saveTargetMonth}월에 구독중 ${activeSubscribers.length}명을 저장할까요?\n이미 등록된 구독자는 자동으로 건너뜁니다.`
  );

  if (!ok) return;

  setSavingMonthly(true);

  const rows = activeSubscribers.map((sub) => ({
    subscriber_id: sub.id,
    month_key: targetMonthKey,
    status: "active",
  }));

  const { data, error } = await supabase
    .from("subscriber_monthly")
    .upsert(rows, {
      onConflict: "subscriber_id,month_key",
      ignoreDuplicates: true,
    })
    .select();

  setSavingMonthly(false);

  if (error) {
    console.error(error);
    alert("월별 구독자 저장에 실패했습니다.");
    return;
  }

  await fetchSubscribers();

  alert(
    `${saveTargetYear}년 ${saveTargetMonth}월 저장 완료\n신규 저장: ${data?.length || 0}명\n기존 등록자는 자동 제외되었습니다.`
  );
};


  const addToMonthly = async (subId: string) => {
    const { data: existing } = await supabase
      .from("subscriber_monthly")
      .select("id")
      .eq("subscriber_id", subId)
      .eq("month_key", monthKey)
      .maybeSingle();

    if (!existing) {
      await supabase.from("subscriber_monthly").insert({
        subscriber_id: subId,
        month_key: monthKey,
        status: "active",
      });
    } else {
      await supabase.from("subscriber_monthly").update({ status: "active" }).eq("id", existing.id);
    }
    
    setIsSelectPopupOpen(false);
    fetchSubscribers();
  };

  const addMissingToCurrent = async (sub: Subscriber) => {
    await addToMonthly(sub.id);
  };

  // [취소] - 이번 달 명단에서만 제거
  const deleteFromMonthly = async (monthlyId: string) => {
    await supabase.from("subscriber_monthly").delete().eq("id", monthlyId);
    fetchSubscribers();
  };

  // [해지] - 구독 취소 처리 (마스터 상태 변경)
  const cancelSubscriber = async (subId: string) => {
    await supabase.from("subscribers").update({ status: "canceled" }).eq("id", subId);
    await supabase.from("subscriber_monthly").update({ status: "canceled" }).eq("subscriber_id", subId).eq("month_key", monthKey);
    fetchSubscribers();
    fetchAllSubscribers();
  };

  // [복구] - 해지된 구독자 다시 활성화
  const restoreSubscriber = async (subId: string) => {
    await supabase.from("subscribers").update({ status: "active" }).eq("id", subId);
    fetchAllSubscribers();
    fetchSubscribers();
  };

  // [삭제] - DB에서 완전 삭제 (팝업 열기)
  const confirmDelete = (subId: string) => {
    setTargetToDelete(subId);
    setDeleteConfirmOpen(true);
  };

  // [삭제] - 실제 삭제 실행
  const executeDelete = async () => {
    if (!targetToDelete) return;
    await supabase.from("subscribers").delete().eq("id", targetToDelete);
    setDeleteConfirmOpen(false);
    setTargetToDelete(null);
    fetchAllSubscribers();
    fetchSubscribers();
  };

  const handleDragStart = (e: React.MouseEvent) => {
  setIsDragging(true);
  dragStart.current = { x: e.clientX - popupPos.x, y: e.clientY - popupPos.y };
};
const handleDragMove = (e: React.MouseEvent) => {
  if (!isDragging) return;
  setPopupPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
};
const handleDragEnd = () => setIsDragging(false);




const getMemoColorClass = (color: MemoItem["color"]) => {
  if (color === "blue") return "bg-blue-50 border-blue-100";
  if (color === "yellow") return "bg-yellow-50 border-yellow-100";
  if (color === "red") return "bg-red-50 border-red-100";
  if (color === "clear") return "bg-white/40 border-gray-200";
  return "bg-white border-gray-200";
};

const memoColorOptions: { value: MemoItem["color"]; className: string }[] = [
  { value: "white", className: "bg-white border-gray-300 hover:bg-gray-50" },
  { value: "blue", className: "bg-blue-50 border-blue-100 hover:bg-blue-100" },
  { value: "yellow", className: "bg-yellow-50 border-yellow-100 hover:bg-yellow-100" },
  { value: "red", className: "bg-red-50 border-red-100 hover:bg-red-100" },
  { value: "clear", className: "border-gray-300 bg-[length:10px_10px] bg-[position:0_0,5px_5px] bg-[image:linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,white_25%,white_75%,#e5e7eb_75%,#e5e7eb)] hover:brightness-95" },
];

const changeMemoColor = (id: string, color: MemoItem["color"]) => {
  saveMemos(memos.map(m => m.id === id ? { ...m, color, updatedAt: new Date().toISOString() } : m));
};

const addMemo = () => {
  const now = new Date().toISOString();
  const newMemo: MemoItem = {
    id: crypto.randomUUID(),
    title: memoTitle.trim(),
    content: memoContent.trim(),
    pinned: false,
    visible: false,
    color: memoColor,
    createdAt: now,
    updatedAt: now,
  };
  saveMemos([newMemo, ...memos]);
  setMemoPage(1); setMemoTitle(""); setMemoContent(""); setMemoColor("white"); setMemoAddOpen(false);
};




const updateMemo = () => {
  if (!selectedMemo) return;
  saveMemos(memos.map(m => m.id === selectedMemo.id ? { ...m, title: memoTitle, content: memoContent, updatedAt: new Date().toISOString() } : m));
  setSelectedMemo(null); setMemoTitle(""); setMemoContent("");
};

const deleteMemo = (id: string) => {
  setDeleteMemoId(id);
  setDeleteMemoConfirmOpen(true);
};

const confirmDeleteMemo = () => {
  if (!deleteMemoId) return;
  saveMemos(memos.filter(m => m.id !== deleteMemoId));
  setSelectedMemo(null); setDeleteMemoId(null); setDeleteMemoConfirmOpen(false);
};


const toggleMemoVisible = (id: string) => {
  saveMemos(memos.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
};

const toggleMemoPinned = (id: string) => {
  saveMemos(memos.map(m => m.id === id ? { ...m, pinned: !m.pinned, updatedAt: new Date().toISOString() } : m));
};


const moveMemoPopup = (e: React.MouseEvent, type: "memoAdd" | "memoEdit") => {
  const drag = type === "memoAdd" ? memoAddDragRef.current : memoEditDragRef.current;
  if (!drag.isDragging) return;
  const next = { x: drag.originX + e.clientX - drag.startX, y: drag.originY + e.clientY - drag.startY };
  if (type === "memoAdd") setMemoAddPopupPos(next); else setMemoEditPopupPos(next);
};

const stopMemoPopupMove = () => {
  memoAddDragRef.current.isDragging = false;
  memoEditDragRef.current.isDragging = false;
};

const openMemoEdit = (memo: MemoItem) => {
  setSelectedMemo(null);
  memoEditDragRef.current = { isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
  setMemoEditPopupPos({ x: 0, y: 0 });
  requestAnimationFrame(() => { setSelectedMemo(memo); });
};

const filteredMemos = memos
  .filter(memo => `${memo.title} ${memo.content}`.toLowerCase().includes(memoSearch.toLowerCase()))
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return memos.findIndex(m => m.id === a.id) - memos.findIndex(m => m.id === b.id);
  });


const MEMOS_PER_PAGE = 6;
const totalMemoPages = Math.max(1, Math.ceil(filteredMemos.length / MEMOS_PER_PAGE));
const pagedMemos = filteredMemos.slice((memoPage - 1) * MEMOS_PER_PAGE, memoPage * MEMOS_PER_PAGE);


const getLinkedSubscriber = (profile: Profile) => {
  if (!profile.linked_subscriber_id) return null;

  return allSubscribers.find(
    (sub) => sub.id === profile.linked_subscriber_id
  );
};

const linkProfileToSubscriber = async (
  profileId: string,
  subscriberId: string
) => {
  const { error } = await supabase
    .from("profiles")
    .update({ linked_subscriber_id: subscriberId })
    .eq("id", profileId);

  if (error) {
    alert("구독자 연결에 실패했습니다.");
    return;
  }

  setProfiles((prev) =>
    prev.map((p) =>
      p.id === profileId
        ? { ...p, linked_subscriber_id: subscriberId }
        : p
    )
  );

  setSelectedProfile((prev) =>
  prev
    ? { ...prev, linked_subscriber_id: subscriberId }
    : prev
);
  
};

const unlinkProfileSubscriber = async (profileId: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({ linked_subscriber_id: null })
    .eq("id", profileId);

  if (error) {
    alert("구독자 연결 해제에 실패했습니다.");
    return;
  }

  setProfiles((prev) =>
    prev.map((p) =>
      p.id === profileId
        ? { ...p, linked_subscriber_id: null }
        : p
    )
  );

  setSelectedProfile((prev) =>
  prev
    ? { ...prev, linked_subscriber_id: null }
    : prev
);
};

  // --- 렌더링용 데이터 필터링 ---
  const filteredProfiles = profiles.filter((p) => {
    const matchSearch = !search || (p.nickname || "").toLowerCase().includes(search.toLowerCase()) || (p.instagram_id || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const pagedProfiles = filteredProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / PAGE_SIZE));

  const activeMonthly = monthlyData
  .filter(d => d.status === "active" && (d.subscribers.name.includes(subSearch) || d.subscribers.subscriber_id.includes(subSearch)) && (!monthlyPayFilter || d.subscribers.pay_app))
  .sort((a, b) => {
    if (monthlySort === "name") return a.subscribers.name.localeCompare(b.subscribers.name, "ko", { numeric: true });
    return new Date(b.subscribers.created_at).getTime() - new Date(a.subscribers.created_at).getTime();
  });
const pagedActiveMonthly = activeMonthly.slice(
  (subCurrentPage - 1) * SUB_PAGE_SIZE,
  subCurrentPage * SUB_PAGE_SIZE
);

const subTotalPages = Math.max(
  1,
  Math.ceil(activeMonthly.length / SUB_PAGE_SIZE)
);

  const canceledMonthly = monthlyData.filter(d => d.status === "canceled");

  const filteredAllSubs = allSubscribers
  .filter(s => {
    const matchTab = allSubTab === "all" || s.status === allSubTab;
   const keyword = allSubSearch.trim().toLowerCase();

const matchSearch =
  keyword === "" ||
  s.name?.toLowerCase().includes(keyword) ||
  s.subscriber_id?.toLowerCase().includes(keyword) ||
  s.data_room?.toLowerCase().includes(keyword) ||
  s.video_room?.toLowerCase().includes(keyword) ||
  s.pay_app_code?.toLowerCase().includes(keyword);
    const matchPay = !allSubPayFilter || s.pay_app;
    return matchTab && matchSearch && matchPay;
  })
 .sort((a, b) => {
  if (allSubSort === "name") {
    return a.name.localeCompare(b.name, "ko", { numeric: true });
  }

  if (allSubSort === "checked-desc") {
    return Number(b.is_checked) - Number(a.is_checked);
  }

  if (allSubSort === "checked-asc") {
    return Number(a.is_checked) - Number(b.is_checked);
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});

  // 선택 팝업용 필터링 (현재 달에 이미 등록된 사람은 제외, 해지자 제외)
  const currentMonthlySubIds = new Set(monthlyData.map(d => d.subscriber_id));
  const availableToSelect = allSubscribers.filter(s => 
    s.status !== "canceled" && 
    !currentMonthlySubIds.has(s.id) &&
    (s.name.includes(selectSearch) || s.subscriber_id.includes(selectSearch))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const isNewThisMonth = (dateStr: string) => {
    return dateStr.startsWith(monthKey);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24 relative">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
         <div className="relative flex items-center justify-center">
  <Link href="/" className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center">
    <ArrowLeft className="w-5 h-5 text-black" />
  </Link>
  <div className="text-center">
    <div className="flex items-center justify-center gap-2">
      <Settings className="w-7 h-7 text-blue-600" />
      <h1 className="text-2xl font-black text-gray-900">관리자 페이지</h1>
    </div>
    <p className="text-sm text-gray-500 mt-1">승인 회원 및 구독자 관리</p>
  </div>

  {/* 연필 아이콘 + 드롭다운 */}
  <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${isPencilOpen ? "z-[1000]" : "z-40"}`}>
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsPencilOpen(!isPencilOpen); }}
        className={`w-10 h-10 rounded-full border border-gray-200 shadow-sm hidden md:flex items-center justify-center transition cursor-default ${isPencilOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
      >
        <Pencil className="w-5 h-5 text-gray-400" />
      </button>

      {isPencilOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-12 z-[999] w-40 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden"
        >
           <button
            onClick={() => { setIsMemoOpen(true); setIsPencilOpen(false); }}
            className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default"
          >
            메모장
          </button>
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent("open-calculator")); setIsPencilOpen(false); }}
            className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 cursor-default"
          >
            계산기
          </button>
        </div>

      )}
    </div>
  </div>
</div>

        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">
        {/* 꽉 차는 탭 메뉴 */}
        <div className="w-full flex bg-gray-200 p-1 rounded-2xl mb-7">
          <button
            onClick={() => setAdminTab("members")}
            className={`flex-1 py-3.5 text-sm md:text-base font-bold rounded-xl transition ${
              adminTab === "members" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            승인 회원 관리
          </button>
                    <button
            onClick={() => setAdminTab("subscribers")}
            className={`flex-1 py-3.5 text-sm md:text-base font-bold rounded-xl transition ${
              adminTab === "subscribers" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            구독자 관리
          </button>
          <button
            onClick={() => { setAdminTab("notices"); loadNoticeData(); }}
            className={`flex-1 py-3.5 text-sm md:text-base font-bold rounded-xl transition ${
              adminTab === "notices" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            공지사항
          </button>
        </div>


        {/* ==================== 회원 관리 탭 ==================== */}
        {adminTab === "members" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { key: "all", label: "전체", icon: Users, color: "text-gray-700" },
                { key: "pending", label: "대기", icon: Clock, color: "text-yellow-600" },
                { key: "approved", label: "승인", icon: CheckCircle, color: "text-green-600" },
                { key: "rejected", label: "거절", icon: XCircle, color: "text-red-500" },
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => { setFilterStatus(key); setCurrentPage(1); }}
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition cursor-default hover:shadow-md ${
                    filterStatus === key ? "border-blue-400 shadow-md" : "border-gray-200"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-400">{label}</p>
                    <p className="text-xl font-black text-gray-900">
                      {key === "all" ? profiles.length : profiles.filter((p) => p.status === key).length}
                    </p>
                  </div>
                </button>
              ))}
            </div>

          <div className="mb-5 flex flex-col gap-3">
  <button
    onClick={() => {
      fetchAllSubscribers();
      setIsAllSubPopupOpen(true);
    }}
    className="md:hidden w-full h-11 rounded-2xl bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2"
  >
    <List className="w-4 h-4" />
    구독자 전체 보기
  </button>

  <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3">
    <Search className="w-5 h-5 text-gray-400 shrink-0" />
    <input
      placeholder="닉네임 또는 인스타그램 아이디로 검색"
      value={search}
      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
      className="w-full outline-none text-sm bg-transparent"
    />
  </div>
</div>

            {filteredProfiles.length === 0 ? (
              <div className="flex justify-center items-center py-20 text-sm text-gray-400">회원이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {pagedProfiles.map((profile) => {
  const linkedSub = getLinkedSubscriber(profile);

  return (
                  <div key={profile.id} onClick={() => setSelectedProfile(profile)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition cursor-default">
                    <div className="flex items-start justify-between mb-3">
                      <div>
<div className="flex items-center gap-1.5 flex-wrap">
  <p className="text-base font-black text-gray-900">{profile.nickname || "(닉네임 없음)"}</p>
  {profile.kakao_connected && (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
      카카오
    </span>
  )}
</div>
<p className="text-sm text-gray-400 mt-0.5">{profile.instagram_id ? `@${profile.instagram_id}` : "인스타 없음"}</p>

                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[profile.status || ""] || "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABEL[profile.status || ""] || profile.status || "-"}
                        </span>
                        {linkedSub?.status === "canceled" && (
  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600">
    해지
  </span>
)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">가입일: {formatDate(profile.created_at)}</p>
                    {profile.role !== "admin" && (
                      <div className="flex gap-2">
                       <button
  onClick={(e) => {
    e.stopPropagation();
    updateStatus(profile.id, "approved");
  }}
  disabled={profile.status === "approved"}
  className={`flex-1 h-9 rounded-xl text-xs font-bold transition ${
    profile.status === "approved"
      ? "bg-green-100 text-green-700 cursor-default"
      : "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
  }`}
>
  승인
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    updateStatus(profile.id, "pending");
  }}
  disabled={profile.status === "pending"}
  className={`flex-1 h-9 rounded-xl text-xs font-bold transition ${
    profile.status === "pending"
      ? "bg-yellow-100 text-yellow-700 cursor-default"
      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 cursor-pointer"
  }`}
>
  대기
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    updateStatus(profile.id, "rejected");
  }}
  disabled={profile.status === "rejected"}
  className={`flex-1 h-9 rounded-xl text-xs font-bold transition ${
    profile.status === "rejected"
      ? "bg-red-100 text-red-500 cursor-default"
      : "bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer"
  }`}
>
  거절
</button>
                      </div>
                    )}
                     </div>
  );
})}
              </div>
            )}
        <AdminPagination
  page={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
          </>
        )}

               {/* ==================== 공지사항 탭 ==================== */}
        {adminTab === "notices" && (
          <div className="space-y-6">

            {/* 카테고리 관리 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-black text-gray-900 mb-4">카테고리 관리</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {noticeCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50">
                    <span className={`w-3 h-3 rounded-full ${
cat.color === "blue" ? "bg-blue-400" :
cat.color === "yellow" ? "bg-yellow-400" :
cat.color === "red" ? "bg-red-400" :
cat.color === "green" ? "bg-green-400" :
cat.color === "gray" ? "bg-gray-300" :
"bg-orange-400"
                    }`} />
                    <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                    <button onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2 items-center">
                  <input
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="카테고리 이름"
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
                  />
                  <div className="hidden sm:flex gap-1.5">
                    {["blue","yellow","red","green","orange","gray"].map((c) => (
                      <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                        className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                          c === "blue" ? "bg-blue-400" : c === "yellow" ? "bg-yellow-400" :
                         c === "red" ? "bg-red-400" :
c === "green" ? "bg-green-400" :
c === "gray" ? "bg-gray-300" :
"bg-orange-400"
                        } ${catForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                  <button onClick={saveCategory} className="sm:hidden h-10 px-4 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition cursor-pointer shrink-0">추가</button>
                </div>
                <div className="flex sm:hidden gap-1.5 items-center">
                  {["blue","yellow","red","green","orange","gray"].map((c) => (
                    <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition cursor-pointer ${
                        c === "blue" ? "bg-blue-400" : c === "yellow" ? "bg-yellow-400" :
                       c === "red" ? "bg-red-400" :
c === "green" ? "bg-green-400" :
c === "gray" ? "bg-gray-300" :
"bg-orange-400"
                      } ${catForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                    />
                  ))}
                </div>
                <button onClick={saveCategory} className="hidden sm:block h-10 px-4 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition cursor-pointer shrink-0">추가</button>
              </div>
            </div>

            {/* 공지 작성/수정 */}
            {noticeFormOpen ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-black text-gray-900 mb-4">{editingNotice ? "공지 수정" : "공지 작성"}</h3>
                <div className="space-y-3">
                  <input
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    placeholder="제목"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
                  />
                  <select
                    value={noticeForm.category_id}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category_id: e.target.value })}
                    className="w-full h-11 pl-4 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white "
                  >
                    <option value="">카테고리 선택 (선택사항)</option>
                    {noticeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  
<div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
  <ReactQuill
    theme="snow"
    value={noticeForm.content}
    onChange={(value) =>
      setNoticeForm({
        ...noticeForm,
        content: value,
      })
    }
    modules={{
      toolbar: [
        [{ size: [] }],
        ["bold", "italic", "underline"],
        [{ color: [] }],
        [{ align: [] }],
        ["link"],
      ],
    }}
  />
</div>

<div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
<input
  type="file"
  accept="image/*"
  multiple
  onChange={handleImageUpload}
  ref={fileInputRef}
  className="hidden"
/>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
                      >
                        {imageUploading ? "업로드 중..." : "이미지 첨부"}
                      </button>
                      {noticeForm.image_urls.length > 0 && (
                        <button
                          onClick={() => setNoticeForm(prev => ({ ...prev, image_url: "", image_urls: [] }))}
                          className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition cursor-pointer"
                        >
                          이미지 삭제
                        </button>
                      )}
                    </div>
                   {noticeForm.image_urls.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
    {noticeForm.image_urls.map((url, index) => (
      <div
        key={url}
        className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
      >
        <img
          src={url}
          alt={`첨부 이미지 ${index + 1}`}
          className="w-full h-50 object-cover"
        />

        <button
          type="button"
          onClick={() =>
            setNoticeForm((prev) => {
              const nextUrls = prev.image_urls.filter((_, i) => i !== index);

              return {
                ...prev,
                image_urls: nextUrls,
                image_url: nextUrls[0] || "",
              };
            })
          }
          className="absolute right-2 top-2 w-7 h-7 rounded-full bg-black/50 text-white text-xs font-bold cursor-pointer hover:bg-black/70 transition"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}
                  </div>
                  <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noticeForm.is_popup}
                      onChange={(e) => setNoticeForm({ ...noticeForm, is_popup: e.target.checked })}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-bold text-gray-700">팝업 표시</span>
                  </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noticeForm.is_pinned}
                      onChange={(e) => setNoticeForm({ ...noticeForm, is_pinned: e.target.checked })}
                      className="w-4 h-4 rounded cursor-pointer accent-orange-500"
                    />
                    <span className="text-sm font-bold text-orange-600">공지 고정</span>
                  </label>
                  </div>

                  {noticeForm.is_popup && (
  <div className="flex gap-2 items-center pl-2 sm:pl-6 relative">
    {(["start", "end"] as const).map((type, index) => {
      const value =
        type === "start"
          ? noticeForm.popup_start_date
          : noticeForm.popup_end_date;

      return (
        <div key={type} className="flex items-center gap-2 relative">
          {index === 1 && <span className="text-gray-400">~</span>}

<span className="hidden sm:inline text-xs font-bold text-gray-500">
  {type === "start" ? "시작일" : "종료일"}
</span>

          <button
            type="button"
            onClick={() => openNoticeDatePicker(type)}
          className="h-9 px-2 sm:px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white flex items-center justify-between gap-2"
          >
            <span className={value ? "text-gray-800" : "text-gray-400"}>
              {value || "연도-월-일"}
            </span>
            <Calendar className="w-4 h-4 text-gray-500" />
          </button>

          {noticeDatePickerOpen === type && (
            <>
              <div
                className="fixed inset-0 z-[99]"
                onClick={() => setNoticeDatePickerOpen(null)}
              />

              <div className="absolute top-11 left-0 z-[100] w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (noticePickerMonth === 0) {
                        setNoticePickerMonth(11);
                        setNoticePickerYear(noticePickerYear - 1);
                      } else {
                        setNoticePickerMonth(noticePickerMonth - 1);
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
                  >
                    ‹
                  </button>

                  <span className="text-sm font-bold text-gray-800">
                    {noticePickerYear}년 {noticePickerMonth + 1}월
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (noticePickerMonth === 11) {
                        setNoticePickerMonth(0);
                        setNoticePickerYear(noticePickerYear + 1);
                      } else {
                        setNoticePickerMonth(noticePickerMonth + 1);
                      }
                    }}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                    <div
                      key={d}
                      className={`text-center text-xs font-bold py-1 ${
                        i === 0
                          ? "text-red-400"
                          : i === 6
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {(() => {
                    const firstDow = new Date(
                      noticePickerYear,
                      noticePickerMonth,
                      1
                    ).getDay();

                    const daysInMonth = new Date(
                      noticePickerYear,
                      noticePickerMonth + 1,
                      0
                    ).getDate();

                    const cells = [];

                    for (let i = 0; i < firstDow; i++) {
                      cells.push(<div key={`empty-${i}`} />);
                    }

                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${noticePickerYear}-${String(
                        noticePickerMonth + 1
                      ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

                      const isSelected = value === dateStr;
                      const dow = new Date(
                        noticePickerYear,
                        noticePickerMonth,
                        d
                      ).getDay();

                      cells.push(
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setNoticeForm({
                              ...noticeForm,
                              [type === "start"
                                ? "popup_start_date"
                                : "popup_end_date"]: dateStr,
                            });
                            setNoticeDatePickerOpen(null);
                          }}
                          className={`h-9 w-full rounded-xl text-sm font-medium transition ${
                            isSelected
                              ? "bg-gray-800 text-white"
                              : "hover:bg-gray-100"
                          } ${
                            !isSelected && dow === 0 ? "text-red-400" : ""
                          } ${
                            !isSelected && dow === 6 ? "text-blue-400" : ""
                          } ${
                            !isSelected && dow !== 0 && dow !== 6
                              ? "text-gray-700"
                              : ""
                          }`}
                        >
                          {d}
                        </button>
                      );
                    }

                    return cells;
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      );
    })}
  </div>
)}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setNoticeFormOpen(false); setEditingNotice(null); setNoticeForm({
  title: "",
  content: "",
  category_id: "",
  is_popup: false,
  is_pinned: false,
  popup_start_date: "",
  popup_end_date: "",
  image_url: "",
  image_urls: [],
});
 }}
                      className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-pointer">취소</button>
                    <button onClick={saveNotice} disabled={noticeSaving}
                      className="flex-1 h-11 rounded-xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer disabled:opacity-50">
                      {noticeSaving ? "저장 중..." : (editingNotice ? "수정 완료" : "등록")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setNoticeFormOpen(true)}
                className="w-full h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-pointer flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> 새 공지 작성
              </button>
            )}

            {/* 공지 목록 */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900">등록된 공지 ({noticesDB.length})</h3>
              </div>
              {noticesDB.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">등록된 공지가 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {noticesDB.map((notice) => {
                    const cat = noticeCategories.find((c) => c.id === notice.category_id);
                    return (
                      <div key={notice.id} className="px-5 py-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {cat && (
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              cat.color === "blue" ? "bg-blue-100 text-blue-600" :
cat.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
cat.color === "red" ? "bg-red-100 text-red-600" :
cat.color === "green" ? "bg-emerald-100 text-emerald-700" :
cat.color === "gray" ? "bg-gray-100 text-gray-500" :
"bg-orange-100 text-orange-600"
                              }`}>{cat.name}</span>
                            )}
                            {notice.is_popup && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-600">팝업</span>
                            )}
                            {notice.is_popup && notice.popup_start_date && (
                              <span className="text-[11px] text-gray-400">{notice.popup_start_date} ~ {notice.popup_end_date || "∞"}</span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-sm truncate">{notice.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(notice.created_at).toLocaleString("ko-KR")}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => {
                            setEditingNotice(notice);
                          setNoticeForm({
  title: notice.title,
  content: notice.content,
  category_id: notice.category_id || "",
  is_popup: notice.is_popup,
  is_pinned: notice.is_pinned || false,
  popup_start_date: notice.popup_start_date || "",
  popup_end_date: notice.popup_end_date || "",
  image_url: notice.image_url || "",
  image_urls: notice.image_urls || [],
});

                            setNoticeFormOpen(true);
                          }} className="h-8 px-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition cursor-pointer">수정</button>
                          <button onClick={() => deleteNotice(notice.id)} className="h-8 px-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition cursor-pointer">삭제</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 구독자 관리 탭 ==================== */}
        {adminTab === "subscribers" && (

          <div className="flex flex-col lg:flex-row gap-6">
            {/* 왼쪽: 메인 구독자 리스트 */}
            <div className="flex-1">
              {/* 꽉 차는 월 이동 및 검색 헤더 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-200 rounded-full transition">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
  <Calendar className="w-5 h-5 text-blue-600" />
  <select
    value={currentMonth.getFullYear()}
    onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}
    className="text-xl font-black text-gray-900 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition"
  >
    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
      <option key={year} value={year}>{year}년</option>
    ))}
  </select>
  <select
    value={currentMonth.getMonth() + 1}
    onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value) - 1, 1))}
    className="text-xl font-black text-gray-900 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition"
  >
    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
      <option key={month} value={month}>{month}월</option>
    ))}
  </select>
</div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsSelectPopupOpen(true)} className="p-2 border border-gray-200 bg-white text-gray-300 hover:bg-gray-100 hover:text-gray-500 rounded-full transition cursor-pointer" title="이번 달 명단에 추가">
                      <Plus className="w-6 h-6" />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-200 rounded-full transition">
                      <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                </div>



                <div className="mx-4 my-3 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      fetchAllSubscribers();
                      setIsAllSubPopupOpen(true);
                    }}
                    className="md:hidden w-full h-11 rounded-2xl bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    구독자 전체 보기
                  </button>

                  <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3">
                    <Search className="w-5 h-5 text-gray-400 shrink-0" />
                    <input
                      placeholder="이번 달 구독자 이름 또는 아이디 검색"
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="w-full outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 한 줄 리스트 형식 (테이블 스타일) */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
               <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
  <h3 className="font-bold text-gray-800">현재 구독자 ({activeMonthly.length}명)</h3>
  <div className="flex items-center gap-2">
    <button
      onClick={() => setMonthlyPayFilter(v => !v)}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${monthlyPayFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
    >
      P 페이앱만
    </button>
    <button
      onClick={() => setMonthlySort(v => v === "name" ? "date" : "name")}
      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
    >
      {monthlySort === "name" ? "이름순" : "등록순"}
    </button>
  </div>
</div>

                
               {/* 리스트 헤더 */}
<div className="hidden md:flex items-center py-3 px-5 border-b border-gray-200 bg-gray-50/80 text-xs font-bold text-gray-500">
 <div style={{minWidth: "180px", maxWidth: "180px"}} className="flex items-center gap-1.5">
  <span className="opacity-0 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">P</span>
  <span className="opacity-0 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">N</span>
  <span>아이디</span>
  <span className="text-blue-500 ml-1">{activeMonthly.filter(d => d.subscribers.subscriber_id).length}</span>
</div>

<div style={{minWidth: "180px"}}>이름 <span className="text-blue-500 ml-1">{activeMonthly.filter(d => d.subscribers.name).length}</span></div>

  <div style={{minWidth: "150px"}}>
  페이앱 코드 <span className="text-blue-500 ml-1">
    {activeMonthly.filter(d => d.subscribers.pay_app_code).length}
  </span>
</div>
  <div style={{minWidth: "160px"}}>영상방 <span className="text-blue-500 ml-1">{activeMonthly.filter(d => d.subscribers.video_room).length}</span></div>
  <div style={{minWidth: "110px"}}>등록날짜</div>
  <div className="flex-1 text-center">관리</div>
</div>



                {/* 리스트 바디 */}
                <div className="divide-y divide-gray-100">
                  {activeMonthly.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">등록된 구독자가 없습니다.</div>
                  ) : (
                    pagedActiveMonthly.map((item: SubscriberMonthly) => (
                     <div key={item.id} className="flex flex-col md:flex-row md:items-center py-3 px-5 hover:bg-blue-50/30 transition gap-2 md:gap-0">
                      <div
  style={{ minWidth: "180px", maxWidth: "180px" }}
  className="text-sm text-gray-500 flex items-center gap-1.5"
  title={item.subscribers.subscriber_id}
>
  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${item.subscribers.pay_app ? "bg-blue-100 text-blue-600" : "opacity-0"}`}>P</span>
  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${isNewThisMonth(item.subscribers.created_at) ? "bg-red-500 text-white" : "opacity-0"}`}>N</span>
  <span className="truncate">{item.subscribers.subscriber_id}</span>
</div>

<div
  style={{ minWidth: "190px", maxWidth: "190px" }}
  className="font-medium text-gray-900 overflow-hidden"
>
  <span className="truncate block max-w-[150px]" title={item.subscribers.name}>{item.subscribers.name}</span>
</div>


<div style={{minWidth: "150px"}} className="text-sm text-gray-600 truncate" title={item.subscribers.pay_app_code}>
  {item.subscribers.pay_app_code || "-"}
</div>
<div style={{minWidth: "150px"}} className="text-sm text-gray-600 truncate" title={item.subscribers.video_room}>{item.subscribers.video_room || "-"}</div>
<div style={{minWidth: "110px"}} className="text-xs text-gray-400">{formatDate(item.subscribers.created_at)}</div>

                        
                        <div className="shrink-0 flex items-center justify-end gap-1.5 mt-2 md:mt-0 ml-auto">
  <button onClick={() => openSubPopup(item.subscribers)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">수정</button>
  <button onClick={() => deleteFromMonthly(item.id)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">취소</button>
  <button onClick={() => cancelSubscriber(item.subscribers.id)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer">해지</button>
</div>

                      </div>
                    ))
                  )}
                </div>
              </div>

<AdminPagination
  page={subCurrentPage}
  totalPages={subTotalPages}
  onPageChange={setSubCurrentPage}
/>

              {/* 해지자 리스트 */}
              {canceledMonthly.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-red-100 bg-red-50/50">
                    <h3 className="font-bold text-red-500">이번 달 해지자 ({canceledMonthly.length}명)</h3>
                  </div>
                  <div className="divide-y divide-red-50">
                    {canceledMonthly.map((item) => (
                      <div key={item.id} className="flex items-center py-3 px-5 bg-red-50/20 opacity-70">
                        <div className="w-28 text-sm text-gray-500 truncate">{item.subscribers.subscriber_id}</div>
                        <div className="w-28 font-bold text-gray-900 line-through truncate">{item.subscribers.name}</div>
                        <div className="flex-1 text-right text-xs font-bold text-red-500">해지됨</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 누락된 구독자 카드 */}
            <div className="w-full lg:w-64 shrink-0">

              <div className="bg-yellow-50 rounded-3xl border border-yellow-200 p-5 sticky top-28">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-bold text-yellow-800">이번 달 누락된 구독자</h3>
                </div>
                <p className="text-xs text-yellow-700 mb-4">저번 달에는 있었으나 이번 달에 아직 등록되지 않은 목록입니다.</p>
                
                <div className="space-y-2 max-h-[1000px] overflow-y-auto pr-1">
                  {missingData.length === 0 ? (
                    <div className="text-center py-6 text-sm text-yellow-600/70">누락된 구독자가 없습니다.</div>
                  ) : (
                    missingData.map((sub) => (
                      <div key={sub.id} className="bg-white rounded-xl p-3 shadow-sm border border-yellow-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{sub.name}</p>
                          <p className="text-[10px] text-gray-400">{sub.subscriber_id}</p>
                        </div>
                        <button onClick={() => addMissingToCurrent(sub)} className="text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition">
                          추가
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedProfile && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
    onClick={() => {
      setSelectedProfile(null);
      setProfileSubSearch("");
      setProfileSubPayFilter(false);
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-xl h-[620px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            구독자 연결
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {selectedProfile.nickname || "닉네임 없음"} ·{" "}
            {selectedProfile.instagram_id
              ? `@${selectedProfile.instagram_id}`
              : "인스타 없음"}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProfile(null);
            setProfileSubSearch("");
            setProfileSubPayFilter(false);
          }}
          className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={profileSubSearch}
            onChange={(e) => setProfileSubSearch(e.target.value)}
            placeholder="아이디 또는 이름으로 구독자 검색"
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>

        <div className="flex items-center justify-end mb-3">
  <button
    onClick={() => setProfileSubPayFilter((v) => !v)}
    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
      profileSubPayFilter
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    P 페이앱만
  </button>
</div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl">
          {allSubscribers
           .filter((sub) => {
  const q = profileSubSearch.toLowerCase().trim();
  const matchPay = !profileSubPayFilter || sub.pay_app;

  if (!q) return matchPay;

  const matchSearch =
    sub.subscriber_id.toLowerCase().includes(q) ||
    sub.name.toLowerCase().includes(q) ||
    (sub.pay_app_code || "").toLowerCase().includes(q);

  return matchPay && matchSearch;
})

            .sort((a, b) => {
  const aLinked =
    selectedProfile?.linked_subscriber_id === a.id ? 1 : 0;

  const bLinked =
    selectedProfile?.linked_subscriber_id === b.id ? 1 : 0;

  return bLinked - aLinked;
})
            .map((sub) => {
              const isLinked =
                selectedProfile.linked_subscriber_id === sub.id;

             return (
  <div
    key={sub.id}
    className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition ${
      isLinked ? "bg-blue-50" : "bg-white"
    }`}
  >
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-black text-gray-900 truncate">
          {sub.subscriber_id}
        </p>

        {sub.pay_app && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold shrink-0">
            P
          </span>
        )}

        {sub.status === "canceled" && (
          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold shrink-0">
            해지
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 truncate">
        이름: {sub.name || "-"}
      </p>

      <p className="text-xs text-gray-400 truncate mt-0.5">
        페이앱 코드: {sub.pay_app_code || "-"}
      </p>
    </div>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();

        if (isLinked) {
          unlinkProfileSubscriber(selectedProfile.id);
        } else {
          linkProfileToSubscriber(selectedProfile.id, sub.id);
        }
      }}
      className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 transition cursor-pointer ${
        isLinked
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {isLinked ? "연결됨" : "선택"}
    </button>
  </div>
);
            })}
        </div>
      </div>
    </div>
  </div>
)}

      {/* 구독자 전체 보기 플로팅 버튼 */}
{(adminTab === "subscribers" || adminTab === "members") && (
  <button
    onClick={() => { fetchAllSubscribers(); setIsAllSubPopupOpen(true); }}
   className="hidden md:flex fixed bottom-8 left-8 z-40 bg-slate-800 text-white px-5 py-3 rounded-full shadow-xl items-center gap-2 hover:bg-slate-700 transition hover:-translate-y-1"
  >
    <List className="w-5 h-5" />
    <span className="font-bold text-sm">구독자 전체 보기</span>

        </button>
      )}

      {/* ==================== 팝업 1: 월별 리스트에 추가할 사람 선택 ==================== */}
      {isSelectPopupOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4" onClick={() => setIsSelectPopupOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl flex flex-col max-h-[80vh]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">이번 달 명단에 추가</h2>
              <button onClick={() => setIsSelectPopupOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-2.5 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder="이름 또는 아이디 검색" value={selectSearch} onChange={(e) => setSelectSearch(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {availableToSelect.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">추가할 수 있는 구독자가 없습니다.  
</div>
              ) : (
                availableToSelect.map((sub) => (
                  <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 transition cursor-pointer" onClick={() => addToMonthly(sub.id)}>
                    <div className="flex items-center gap-2 min-w-0">
  <p className="font-bold text-gray-900 text-sm truncate">
    {sub.name}
  </p>

  <p className="text-xs text-gray-400 truncate">
    {sub.subscriber_id}
  </p>
</div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 팝업 2: 구독자 마스터 정보 등록/수정 ==================== */}
      {isSubPopupOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4" onClick={() => setIsSubPopupOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{subForm.id ? "구독자 정보 수정" : "새 구독자 마스터 등록"}</h2>
              <button onClick={() => setIsSubPopupOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">아이디</label>
                  <input value={subForm.subscriber_id} onChange={(e) => setSubForm({...subForm, subscriber_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="아이디 입력" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">이름</label>
                  <input value={subForm.name} onChange={(e) => setSubForm({...subForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="이름 입력" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">자료방</label>
                  <input value={subForm.data_room} onChange={(e) => setSubForm({...subForm, data_room: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="자료방 이름" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">영상방</label>
                  <input value={subForm.video_room} onChange={(e) => setSubForm({...subForm, video_room: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="영상방 이름" />
                </div>
              </div>

              <button
                onClick={() => setSubForm({...subForm, pay_app: !subForm.pay_app})}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${subForm.pay_app ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
              >
                {subForm.pay_app ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-gray-400" />}
                <span className="font-bold text-sm">페이앱 결제</span>
              </button>

              {subForm.pay_app && (
  <div>
    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">페이앱 코드</label>
    <input
      value={subForm.pay_app_code}
      onChange={(e) => setSubForm({...subForm, pay_app_code: e.target.value})}
      className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
      placeholder="페이앱 코드 입력"
    />
  </div>
)}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">메모</label>
                <textarea value={subForm.memo} onChange={(e) => setSubForm({...subForm, memo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none h-24" placeholder="메모를 입력하세요" />
              </div>

              <button onClick={saveSubscriber} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-sm">
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 팝업 3: 구독자 전체 목록 (마스터 관리) ==================== */}
      {isAllSubPopupOpen && (
        <div
  className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-3"
  onMouseMove={handleDragMove}
  onMouseUp={handleDragEnd}
  onClick={(e) => { if (e.target === e.currentTarget) setIsAllSubPopupOpen(false); }}
>
          <div
  onClick={(e) => e.stopPropagation()}
  style={{ transform: typeof window !== "undefined" && window.innerWidth >= 768 ? `translate(${popupPos.x}px, ${popupPos.y}px)` : "none" }}
  className="w-full max-w-5xl h-[88vh] rounded-3xl bg-white shadow-xl flex flex-col overflow-hidden"
>
            <div
  className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50 select-none"
  onMouseDown={handleDragStart}
>
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-gray-700" />
                <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">
  구독자 전체 목록 (마스터)
</h2>
              </div>
             
             {/* CSV 업로드 버튼 */}
<div className="hidden md:flex items-center gap-2">
  <select
    value={saveTargetYear}
    onChange={(e) => setSaveTargetYear(Number(e.target.value))}
    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white"
  >
    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
      <option key={year} value={year}>
        {year}년
      </option>
    ))}
  </select>

  <select
    value={saveTargetMonth}
    onChange={(e) => setSaveTargetMonth(Number(e.target.value))}
    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white"
  >
    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
      <option key={month} value={month}>
        {month}월
      </option>
    ))}
  </select>

  <button
    onClick={saveActiveSubscribersToMonth}
    disabled={savingMonthly}
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
  >
    {savingMonthly ? "저장 중..." : "구독중 저장"}
  </button>
</div>

             
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={() => openSubPopup()} className="hidden md:flex items-center gap-1.5 md:gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-700 transition">
                  <UserPlus className="w-4 h-4" />
                  새 구독자 등록
                </button>
                <button onClick={() => setIsAllSubPopupOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 transition  cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 md:p-6 flex-1 flex flex-col overflow-hidden bg-white">
                
              {/* 탭 3개 및 검색창 */}
              <div className="mb-2">
                <div className="flex bg-gray-200 p-1 rounded-xl w-full  mb-3">
  <button onClick={() => setAllSubTab("all")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${allSubTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
    전체목록 <span className="text-xs font-black ml-1">{allSubscribers.length}</span>
  </button>
  <button onClick={() => setAllSubTab("active")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${allSubTab === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>
    구독중 <span className="text-xs font-black ml-1">{allSubscribers.filter(s => s.status === "active").length}</span>
  </button>
  <button onClick={() => setAllSubTab("canceled")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${allSubTab === "canceled" ? "bg-white text-red-500 shadow-sm" : "text-gray-500"}`}>
    해지 <span className="text-xs font-black ml-1">{allSubscribers.filter(s => s.status === "canceled").length}</span>
  </button>
</div>

                <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-2.5 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input placeholder="이름 또는 아이디 검색" value={allSubSearch} onChange={(e) => setAllSubSearch(e.target.value)} className="w-full outline-none text-sm" />
                                </div>
                {/* 필터/정렬 버튼 */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setAllSubPayFilter(v => !v)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${allSubPayFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    P 페이앱만
                  </button>
                  <button
                    onClick={() => setAllSubSort(v => v === "name" ? "date" : "name")}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  >
                    {allSubSort === "name" ? "이름순" : "등록순"}
                  </button>
                
<button
  onClick={() =>
    setAllSubSort((v) =>
      v === "checked-desc" ? "checked-asc" : "checked-desc"
    )
  }
  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
    allSubSort === "checked-desc" || allSubSort === "checked-asc"
      ? "bg-blue-600 text-white"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`}
>
  {allSubSort === "checked-desc"
    ? "체크순 ↑"
    : allSubSort === "checked-asc"
    ? "체크순 ↓"
    : "체크순"}
</button>

<button
  onClick={() => openSubPopup()}
  className="md:hidden ml-auto flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
>
  <UserPlus className="w-3 h-3" />
  등록
</button>
</div>
                
              </div>

              {/* 한 줄 리스트 형식 (테이블 스타일) */}

              <div className="flex-1 overflow-hidden flex flex-col border border-gray-200 rounded-2xl">
                {/* 리스트 헤더 */}
                <div className="hidden md:flex items-center py-3 px-5 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500">
                 <div className="w-36 flex items-center gap-2">
  <button
    onClick={toggleAllSubscriberChecks}
    className="shrink-0 cursor-pointer"
  >
    {filteredAllSubs.length > 0 &&
    filteredAllSubs.every((s) => s.is_checked) ? (
      <CheckSquare className="w-4 h-4 text-blue-600" />
    ) : (
      <Square className="w-4 h-4 text-gray-400" />
    )}
  </button>

  <span>아이디</span>
</div>
                  <div className="w-50">이름</div>
                  <div className="w-40">페이앱 코드</div>
                  <div className="w-40">영상방</div>
                  <div className="w-30">등록날짜</div>
                  <div className="flex-1 text-center">관리</div>
                </div>

                {/* 리스트 바디 */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {filteredAllSubs.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
                  ) : (
                    filteredAllSubs.map((sub) => (
                      <div key={sub.id} className={`flex flex-col md:flex-row md:items-center py-3 px-3 md:px-5 hover:bg-gray-50 transition gap-1 md:gap-0 ${sub.status === "canceled" ? "opacity-60 bg-gray-50/50" : ""}`}>
                        <div
  className="md:w-36 text-xs md:text-sm text-gray-500 flex items-center gap-2 truncate"
  title={sub.subscriber_id}
>
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleSubscriberCheck(sub);
    }}
    className="shrink-0 cursor-pointer"
  >
    {sub.is_checked ? (
      <CheckSquare className="w-4 h-4 text-blue-600" />
    ) : (
      <Square className="w-4 h-4 text-gray-400" />
    )}
  </button>

  <span className="truncate">
    {sub.subscriber_id}
  </span>
</div>
                        <div className="md:w-50 font-medium text-gray-900 flex items-center gap-1.5">
                          <span className={`truncate ${sub.status === "canceled" ? "line-through" : ""}`} title={sub.name}>{sub.name}</span>
                          {sub.pay_app && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">P</span>}
                        </div>
                        <div className="md:w-40 text-xs md:text-sm text-gray-600 truncate" title={sub.pay_app_code}>{sub.pay_app_code || "-"}</div>
                        <div className="md:w-40 text-xs md:text-sm text-gray-600 truncate" title={sub.video_room}>{sub.video_room || "-"}</div>
                        <div className="md:w-25 text-xs text-gray-400">{formatDate(sub.created_at)}</div>
                        
                        <div className="flex items-center justify-end gap-1.5 -translate-y-8 -mb-7 ml-auto md:translate-y-0 md:mb-0 md:shrink-0">
                          <button onClick={() => openSubPopup(sub)} className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer">수정</button>
                          {sub.status === "active" ? (
                            <button onClick={() => cancelSubscriber(sub.id)} className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer">해지</button>
                          ) : (
                            <button onClick={() => restoreSubscriber(sub.id)} className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition cursor-pointer">복구</button>
                          )}
                          <button onClick={() => confirmDelete(sub.id)} className="text-xs font-bold px-3 py-1.5 bg-gray-800 text-white hover:bg-gray-900 rounded-lg transition cursor-pointer">삭제</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 팝업 4: 삭제 확인 팝업 ==================== */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <h2 className="text-xl font-black text-gray-900">
              구독자 삭제
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">
              선택한 구독자를 완전히 삭제하시겠습니까?  

              (이 작업은 되돌릴 수 없습니다)
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setTargetToDelete(null);
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default"
              >
                취소
              </button>

              <button
                onClick={executeDelete}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
{/* 메모장 팝업 */}
{isMemoOpen && (
  <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden h-[86vh] lg:h-[78vh] flex flex-col">
      <div className="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
        <div className="font-bold flex items-center gap-2"><NotebookPen className="w-5 h-5" />메모장</div>
        <button onClick={() => setIsMemoOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={memoSearch} onChange={(e) => setMemoSearch(e.target.value)} placeholder="메모 검색" className="w-full h-12 rounded-2xl border border-gray-200 pl-11 pr-4 text-sm outline-none focus:border-gray-400" />
        </div>
        <button onClick={() => { setMemoTitle(""); setMemoContent(""); setMemoAddPopupPos({ x: 0, y: 0 }); setMemoAddOpen(true); }} className="h-12 px-5 rounded-2xl bg-gray-800 text-white text-sm font-bold flex items-center gap-2 cursor-default">
          <Plus className="w-4 h-4" />추가
        </button>
      </div>
            <div className="flex-1 overflow-y-auto p-4">
        {filteredMemos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 py-20">저장된 메모가 없습니다.</div>
        ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMemoDragEnd}>
              <SortableContext items={pagedMemos.filter(m => !m.pinned).map(m => m.id)} strategy={rectSortingStrategy}>
                {pagedMemos.map((memo) => (
                  <SortableMemoCard key={memo.id} memo={memo}>
                    <div onDoubleClick={() => openMemoEdit(memo)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, id: memo.id }); }} className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition cursor-default ${getMemoColorClass(memo.color)}`}>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-gray-900 break-keep">{memo.title || ""}</h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line break-keep">{memo.content}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleMemoVisible(memo.id); }} className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${memo.visible ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                      {memo.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleMemoPinned(memo.id); }} className={`w-10 h-10 rounded-full flex items-center justify-center border transition cursor-default ${memo.pinned ? "bg-gray-800 border-gray-800 text-white hover:bg-gray-700 hover:border-gray-700" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openMemoEdit(memo); }} className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition cursor-default">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                                 </div>
                  </SortableMemoCard>
                ))}
              </SortableContext>
            </DndContext>
          </div>

        )}
      </div>
      <div className="flex justify-center pt-4 pb-4 shrink-0 border-t border-gray-100">
        <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
          <button onClick={() => setMemoPage((p) => Math.max(1, p - 1))} disabled={memoPage === 1} className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer">이전</button>
          {Array.from({ length: Math.min(totalMemoPages, 10) }).map((_, index) => {
            const page = index + 1;
            return (
              <button key={page} onClick={() => setMemoPage(page)} className={`px-4 py-2 border-l border-gray-200 cursor-pointer ${memoPage === page ? "bg-slate-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>{page}</button>
            );
          })}
          <button onClick={() => setMemoPage((p) => Math.min(totalMemoPages, p + 1))} disabled={memoPage === totalMemoPages} className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-pointer">다음</button>
        </div>
      </div>
    </div>
  </div>
)}


{memoAddOpen && (
  <div onMouseMove={(e) => moveMemoPopup(e, "memoAdd")} onMouseUp={stopMemoPopupMove} onMouseLeave={stopMemoPopupMove} onClick={() => setMemoAddOpen(false)} className="fixed inset-0 z-[1400] bg-black/40 flex items-center justify-center p-4">
    <div style={{ transform: `translate(${memoAddPopupPos.x}px, ${memoAddPopupPos.y}px)` }} onMouseDown={(e) => { if (window.innerWidth < 768) return; const target = e.target as HTMLElement; if (target.closest("button") || target.closest("input") || target.closest("textarea")) return; memoAddDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, originX: memoAddPopupPos.x, originY: memoAddPopupPos.y }; }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 추가</h2>
        <div className="flex items-center gap-2 min-w-0">
          {memoColorOptions.map((color) => (
            <button key={color.value} type="button" onClick={() => setMemoColor(color.value)} className={`w-7 h-7 rounded-full border transition hover:scale-105 ${memoColor === color.value ? "ring-2 ring-gray-400 ring-offset-2" : ""} ${color.className}`} />
          ))}
          <button onClick={() => setMemoAddOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <input value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} placeholder="메모 제목" className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm outline-none mb-3" />
      <textarea value={memoContent} onChange={(e) => setMemoContent(e.target.value)} placeholder="메모 내용을 입력하세요" className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5" />
      <div className="flex gap-3">
        <button onClick={() => setMemoAddOpen(false)} className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default">취소</button>
        <button onClick={addMemo} className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default">저장</button>
      </div>
    </div>
  </div>
)}


{/* 메모 수정 팝업 */}
{selectedMemo && (
  <div onMouseMove={(e) => moveMemoPopup(e, "memoEdit")} onMouseUp={stopMemoPopupMove} onMouseLeave={stopMemoPopupMove} className="fixed inset-0 z-[1300] bg-black/40 flex items-center justify-center p-4">
    <div style={{ transform: `translate(${memoEditPopupPos.x}px, ${memoEditPopupPos.y}px)` }} onMouseDown={(e) => { if (window.innerWidth < 768) return; const target = e.target as HTMLElement; if (target.closest("button") || target.closest("input") || target.closest("textarea")) return; memoEditDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, originX: memoEditPopupPos.x, originY: memoEditPopupPos.y }; }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 cursor-default">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-gray-900">메모 수정</h2>
        <div className="flex items-center gap-2">
          {memoColorOptions.map((color) => (
            <button key={color.value} type="button" onClick={() => { changeMemoColor(selectedMemo.id, color.value); setSelectedMemo({ ...selectedMemo, color: color.value }); }} className={`w-7 h-7 rounded-full border transition hover:scale-105 ${selectedMemo.color === color.value ? "ring-2 ring-gray-400 ring-offset-2" : ""} ${color.className}`} />
          ))}
          <button onClick={() => { setSelectedMemo(null); setMemoEditPopupPos({ x: 0, y: 0 }); memoEditDragRef.current = { isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 }; }} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <input value={selectedMemo.title} onChange={(e) => setSelectedMemo({ ...selectedMemo, title: e.target.value })} placeholder="메모 제목" className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-bold outline-none mb-3" />
      <textarea value={selectedMemo.content} onChange={(e) => setSelectedMemo({ ...selectedMemo, content: e.target.value })} placeholder="메모 내용을 입력하세요" className="w-full h-56 rounded-2xl border border-gray-200 p-4 text-sm outline-none resize-none mb-5" />
      <div className="flex gap-3">
        <button onClick={() => deleteMemo(selectedMemo.id)} className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-500 transition cursor-default">삭제</button>
        <button onClick={() => { saveMemos(memos.map(m => m.id === selectedMemo.id ? { ...m, title: selectedMemo.title, content: selectedMemo.content, updatedAt: new Date().toISOString() } : m)); setSelectedMemo(null); }} className="flex-1 h-12 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-700 transition cursor-default">완료</button>
      </div>
    </div>
  </div>
)}

{contextMenu && (
  <>
    <div className="fixed inset-0 z-[1999]" onClick={() => setContextMenu(null)} />
    <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-[2000] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-32" onPointerDown={(e) => e.stopPropagation()}>

             <button onClick={() => { const target = memos.find((m: MemoItem) => m.id === contextMenu!.id); if (target) openMemoEdit(target); setContextMenu(null); }} className="w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default text-left">수정</button>
        <button onClick={() => { deleteMemo(contextMenu!.id); setContextMenu(null); }} className="w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-default text-left border-t border-gray-100">삭제</button>
    </div>
  </>
)}


{deleteMemoConfirmOpen && (
  <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black text-gray-900">메모 삭제</h2>
      <p className="text-sm text-gray-500 leading-relaxed mt-2 break-keep">선택한 메모를 삭제하시겠습니까?</p>
      <div className="flex gap-3 mt-6">
        <button onClick={() => { setDeleteMemoId(null); setDeleteMemoConfirmOpen(false); }} className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition cursor-default">취소</button>
        <button onClick={confirmDeleteMemo} className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition cursor-default">삭제</button>
      </div>
       </div>
  </div>
)}






         <MemoStickers />
    </main>
  );
}

