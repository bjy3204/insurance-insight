"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

type VariantType = "full" | "label" | "menu";
type ModeType = "login" | "signup";

function AuthPopup({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  signupNickname,
  setSignupNickname,
  signupInstagram,
  setSignupInstagram,
  onClose,
  onLogin,
onSignup,
onResetPassword,
}: {
  mode: ModeType;
  setMode: React.Dispatch<React.SetStateAction<ModeType>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  signupNickname: string;
  setSignupNickname: React.Dispatch<React.SetStateAction<string>>;
  signupInstagram: string;
  setSignupInstagram: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onResetPassword: () => void;
}) {
  return (
    <div
      className="fixed z-[9999] bg-black/40"
      style={{
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full
          max-w-sm
          rounded-2xl
          bg-white
          p-6
          shadow-xl
          cursor-default
        "
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "login" ? "로그인" : "회원가입"}
          </h2>

          <button
            onClick={onClose}
             className="
    w-9
    h-9
    rounded-full
    flex
    items-center
    justify-center
    text-gray-400
    hover:bg-gray-100
    hover:text-gray-600
    transition
    cursor-pointer
  "
>
  <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          로그인기능은 보험나무 구독자만 이용가능합니다 !
          <br />
          회원가입 하신 후 DM 또는 카카오톡으로 인스타그램 아이디를 보내 주세요 😄
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="닉네임"
                value={signupNickname}
                onChange={(e) => setSignupNickname(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />

              <input
                type="text"
                placeholder="인스타 아이디"
                value={signupInstagram}
                onChange={(e) => setSignupInstagram(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />
            </>
          )}

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <input
  type="password"
  placeholder="비밀번호"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && mode === "login") onLogin();
  }}
  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
/>

          <button
            onClick={mode === "login" ? onLogin : onSignup}
            className="h-11 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 cursor-pointer"
          >
            {mode === "login" ? "로그인하기" : "회원가입하기"}
          </button>

          {mode === "login" && (
  <button
    onClick={onResetPassword}
    className="w-full text-center text-[13px] font-bold text-gray-500 hover:text-gray-900 cursor-pointer relative top-1"
  >
    비밀번호를 잊으셨나요?
  </button>
)}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              계정이 없으신가요?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-bold text-gray-900  hover:text-blue-600 cursor-pointer"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-gray-900  hover:text-blue-600 cursor-pointer"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthButton({
  variant = "full",
  user,
  nickname,
  status,
  createdAt,
  onAuthChange,
  onMenuClose,
}: {
  variant?: VariantType;
  user?: any;
  nickname?: string | null;
  status?: string | null;
  createdAt?: string | null;
  onAuthChange?: () => void | Promise<void>;
  onMenuClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  const userEmail = user?.email ?? null;

  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signupNickname, setSignupNickname] = useState("");
  const [signupInstagram, setSignupInstagram] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  
  
const handleLogin = async () => {
  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("로그인에 실패했습니다.");
    return;
  }

    setAuthOpen(false);
  setEmail("");
  setPassword("");
  onMenuClose?.();
};

 

const handleResetPassword = async () => {
  if (!email.trim()) {
    alert("비밀번호를 재설정할 이메일을 입력해주세요.");
    return;
  }

    const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo: `${window.location.origin}/reset-password`,
    }
  );


  if (error) {
    alert("비밀번호 재설정 메일 발송에 실패했습니다.");
    return;
  }

  alert("비밀번호 재설정 메일을 발송했습니다. 이메일을 확인해주세요.");
};

  const handleSignup = async () => {
    if (!signupNickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (!signupInstagram.trim()) {
      alert("인스타그램 아이디를 입력해주세요.");
      return;
    }

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
  id: userId,
  nickname: signupNickname.trim(),
  instagram_id: signupInstagram.trim(),
  status: "pending",
  role: "user",
});

      if (profileError) {
        alert("회원정보 저장에 실패했습니다.");
        return;
      }
    }

    alert("회원가입이 완료되었습니다. 관리자 승인 후 저장 기능을 이용할 수 있습니다.");

    setMode("login");
    setSignupNickname("");
    setSignupInstagram("");
    setEmail("");
    setPassword("");
  };

  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("로그아웃에 실패했습니다.");
    return;
  }

    setAuthOpen(false);
  setEmail("");
  setPassword("");
  setSignupNickname("");
  setSignupInstagram("");
  onMenuClose?.();
};


  const getGradeEmoji = (date: string | null) => {
    if (!date) return "🌰";

    const 가입일 = new Date(date);
    const 현재 = new Date();

    const diffDays = Math.floor(
      (현재.getTime() - 가입일.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays >= 365 * 2) return "🌳";
    if (diffDays >= 365) return "🍒";
    if (diffDays >= 180) return "🌾";
    if (diffDays >= 90) return "🪴";
    if (diffDays >= 30) return "🌱";

    return "🌰";
  };

  const renderStatusBadge = () => {
    if (status === "pending") {
      return (
        <span className="rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-bold text-yellow-700 border border-yellow-100">
          승인대기
        </span>
      );
    }

    if (status === "blocked") {
      return (
        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 border border-red-100">
          승인보류
        </span>
      );
    }

    return null;
  };

  const popup =
    mounted && authOpen
      ? createPortal(
          <AuthPopup
            mode={mode}
            setMode={setMode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            signupNickname={signupNickname}
            setSignupNickname={setSignupNickname}
            signupInstagram={signupInstagram}
            setSignupInstagram={setSignupInstagram}
            onClose={() => setAuthOpen(false)}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onResetPassword={handleResetPassword}
          />,
          document.body
        )
      : null;

  if (variant === "label") {
    return (
      <div className="hidden md:flex items-center gap-2">
        {userEmail && (
          <>
            <span
  className="
    px-3
    h-8
    rounded-full
    bg-sky-50
    border
    border-sky-100
   text-[11px]
    font-semibold
    text-sky-700
    flex
    items-center
    justify-center
    transition
    hover:-translate-y-[1px]
    hover:shadow-md
  "
>
              {getGradeEmoji(createdAt ?? null)} {nickname || "회원"} 님
            </span>

            {renderStatusBadge()}
          </>
        )}
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <>
        {userEmail ? (
  <button
    onPointerDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleLogout();
    }}
            className="
              block
              w-full
              px-4
              py-3
              text-center
              text-sm
              font-bold
              text-gray-700
              hover:bg-gray-50
              cursor-default
            "
          >
            로그아웃
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode("login");
              setAuthOpen(true);
            }}
            className="
              block
              w-full
              px-4
              py-3
              text-center
              text-sm
              font-bold
              text-gray-700
              hover:bg-gray-50
              cursor-default
            "
          >
            로그인
          </button>
        )}

        {popup}
      </>
    );
  }

  return (
    <>
      {userEmail ? (
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              {getGradeEmoji(createdAt ?? null)} {nickname || "회원"}
            </span>

            {renderStatusBadge()}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="
              h-9
              px-4
              rounded-xl
              border
              border-gray-300
              bg-white
              text-sm
              font-bold
              text-gray-700
              hover:bg-gray-50
            "
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMode("login");
            setAuthOpen(true);
          }}
          className="
            h-9
            px-4
            rounded-xl
            border
            border-gray-300
            bg-white
            text-sm
            font-bold
            text-gray-700
            hover:bg-gray-50
          "
        >
          로그인
        </button>
      )}

      {popup}
    </>
  );
}