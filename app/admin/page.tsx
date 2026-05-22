"use client";

import { useState, useEffect } from "react";
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
  Shield,
  X,
} from "lucide-react";

type Profile = {
  id: string;
  nickname: string | null;
  instagram_id: string | null;
  status: string | null;
  role: string | null;
  created_at: string | null;
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



export default function AdminPage() {
  const { authUser, authLoading } = useAuth();


  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  

  const [currentPage, setCurrentPage] = useState(1);
const PAGE_SIZE = 12;

  // 관리자 접근 제한
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

    await fetchProfiles();
    setLoading(false);
  };

    checkAdmin();
}, [authUser, authLoading]);



 const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, instagram_id, status, role, created_at")
    .order("created_at", { ascending: false });

  console.log("fetchProfiles data:", data);
  console.log("fetchProfiles error:", error);

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

  const filtered = profiles.filter((p) => {
    const matchSearch =
      !search ||
      (p.nickname || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.instagram_id || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
const pagedProfiles = filtered.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);


  const counts = {
    all: profiles.length,
    pending: profiles.filter((p) => p.status === "pending").length,
    approved: profiles.filter((p) => p.status === "approved").length,
    rejected: profiles.filter((p) => p.status === "rejected").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">관리자</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">회원 관리 및 승인 처리</p>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 py-6">
        {/* 통계 카드 */}
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
                  {counts[key as keyof typeof counts]}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition px-4 py-3 flex items-center gap-3 mb-5">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            placeholder="닉네임 또는 인스타그램 아이디로 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full outline-none text-sm bg-transparent"
          />
          {search && (
            <button
             onClick={() => { setSearch(""); setCurrentPage(1); }}
              className="text-gray-400 hover:text-gray-600 cursor-default shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 회원 목록 */}
        {filtered.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-sm text-gray-400">
            회원이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pagedProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition cursor-default"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-black text-gray-900">
                      {profile.nickname || "(닉네임 없음)"}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {profile.instagram_id ? `@${profile.instagram_id}` : "인스타 없음"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        STATUS_COLOR[profile.status || ""] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[profile.status || ""] || profile.status || "-"}
                    </span>
                    {profile.role === "admin" && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-800 text-white">
                        관리자
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  가입일: {formatDate(profile.created_at)}
                </p>

                {profile.role !== "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(profile.id, "approved");
                      }}
                      disabled={profile.status === "approved" || updating === profile.id}
                      className="flex-1 h-9 rounded-xl text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 transition cursor-default"
                    >
                      승인
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(profile.id, "pending");
                      }}
                      disabled={profile.status === "pending" || updating === profile.id}
                      className="flex-1 h-9 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-40 transition cursor-default"
                    >
                      대기
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(profile.id, "rejected");
                      }}
                      disabled={profile.status === "rejected" || updating === profile.id}
                      className="flex-1 h-9 rounded-xl text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 transition cursor-default"
                    >
                      거절
                    </button>
                  </div>
                )}

                {profile.role === "admin" && (
                  <div className="flex items-center justify-center h-9">
                    <span className="text-sm font-bold text-blue-500">관리자 계정</span>
                  </div>
                )}
              </div>
            ))}
                   </div>
        )}

        {(

          <div className="flex justify-center  pt-80 pb-10">
            <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-default"
              >
                이전
              </button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border-l border-gray-200 cursor-default ${
                      currentPage === page
                        ? "bg-slate-800 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border-l border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:text-gray-300 cursor-default"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </section>


      

      {/* 회원 상세 팝업 */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl cursor-default"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">회원 정보</h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-default"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 mb-1">닉네임</p>
                <p className="text-sm font-bold text-gray-700">
                  {selectedProfile.nickname || "(없음)"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 mb-1">인스타그램</p>
                <p className="text-sm font-bold text-gray-700">
                  {selectedProfile.instagram_id
                    ? `@${selectedProfile.instagram_id}`
                    : "(없음)"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 mb-1">가입일</p>
                <p className="text-sm font-bold text-gray-700">
                  {formatDate(selectedProfile.created_at)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 mb-1">현재 상태</p>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    STATUS_COLOR[selectedProfile.status || ""] ||
                    "bg-gray-100 text-gray-500"
                  }`}
                >
                  {STATUS_LABEL[selectedProfile.status || ""] ||
                    selectedProfile.status ||
                    "-"}
                </span>
              </div>
            </div>

            {selectedProfile.role !== "admin" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selectedProfile.id, "approved")}
                  disabled={
                    selectedProfile.status === "approved" ||
                    updating === selectedProfile.id
                  }
                  className="flex-1 h-11 rounded-xl text-sm font-bold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 transition cursor-default"
                >
                  승인
                </button>
                <button
                  onClick={() => updateStatus(selectedProfile.id, "pending")}
                  disabled={
                    selectedProfile.status === "pending" ||
                    updating === selectedProfile.id
                  }
                  className="flex-1 h-11 rounded-xl text-sm font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-40 transition cursor-default"
                >
                  대기
                </button>
                <button
                  onClick={() => updateStatus(selectedProfile.id, "rejected")}
                  disabled={
                    selectedProfile.status === "rejected" ||
                    updating === selectedProfile.id
                  }
                  className="flex-1 h-11 rounded-xl text-sm font-bold bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40 transition cursor-default"
                >
                  거절
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}