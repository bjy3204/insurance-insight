"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert("비밀번호 변경에 실패했습니다.");
      return;
    }

    alert("비밀번호가 변경되었습니다.");

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-black text-center text-gray-900">
          비밀번호 재설정
        </h1>

        <p className="mt-2 text-sm text-center text-gray-500">
          새 비밀번호를 입력해주세요.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="password"
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="h-11 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? "변경 중..."
              : "비밀번호 변경하기"}
          </button>
        </div>
      </div>
    </main>
  );
}