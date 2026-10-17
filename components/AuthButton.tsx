"use client";

import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import AuthNotice from "./AuthNotice";
import { authErrorMessage } from "@/lib/auth/error-message";

import { hasCompletedMembership } from "@/lib/auth/membership";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import Image from "next/image";

type VariantType = "full" | "label" | "menu" | "compact";
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
onKakaoLogin,
  signupKakao, onStartKakaoSignup, onClearKakaoSignup, completingKakao, completingSignup, signupBusy,
}: {
  signupKakao: boolean;
  onStartKakaoSignup: () => void;
  onClearKakaoSignup: () => void;
  completingKakao: boolean;
  completingSignup: boolean;
  signupBusy: boolean;
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
  onKakaoLogin: (type: "login" | "signup") => void;
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
          max-h-[calc(100dvh-32px)]
          overflow-y-auto
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

          <button data-icon-only="true" data-popup-close="true"
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
  로그인기능은 보험나무 구독자만 이용가능합니다 😄

  <br />
<span className="text-blue-500 font-bold">
  {mode === "login"
    ? "구독하신 후 아래 회원가입을 먼저 진행해주세요 !"
    : "구독자 확인을 위해 인스타아이디를 정확히 입력해 주세요 !"}
</span>
</div>

        <div className="space-y-3">
          {mode === "signup" && (
            <>
              <ClearableSearchInput onClear={() => setSignupNickname("")}
                type="text"
                placeholder="닉네임"
                value={signupNickname}
                onChange={(e) => setSignupNickname(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
              />

              <ClearableSearchInput onClear={() => setSignupInstagram("")}
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
            readOnly={mode === "signup" && completingSignup}
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
          />

          <ClearableSearchInput onClear={() => setPassword("")}
  type="password"
  placeholder="비밀번호"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && mode === "login") onLogin();
  }}
  className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
/>

          {mode === "signup" && (
            completingKakao ? <div className="rounded-xl bg-yellow-50 p-3 text-sm text-gray-700">카카오 연결됨 · 이메일과 비밀번호로도 로그인할 수 있습니다</div> :
            <div className="space-y-2">
              <button type="button" disabled={signupBusy || signupKakao} onClick={onStartKakaoSignup} className="h-11 w-full rounded-xl bg-[#FEE500] text-sm font-bold text-[#191919] cursor-pointer disabled:cursor-default">
                {signupKakao ? "카카오 연결됨 (가입 시 확정)" : "카카오 연결하기"}
              </button>
              {signupKakao && <button type="button" onClick={onClearKakaoSignup} className="w-full text-xs text-gray-500 cursor-pointer">연결 없이 가입하기</button>}
            </div>
          )}
          <button
            disabled={signupBusy}
            onClick={mode === "login" ? onLogin : onSignup}
            className="h-11 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 cursor-pointer"
          >
            {mode === "login" ? "로그인하기" : "회원가입하기"}
          </button>

{mode === "login" && (
 <button
  onClick={() => onKakaoLogin("login")}
  className="
    h-11
    w-full
    rounded-xl
    bg-[#FEE500]
    text-sm
    font-bold
    text-[#191919]
    cursor-pointer
    transition
    hover:bg-[#f6dc00]
  "
>
  카카오 로그인
</button>
)}



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
  hideStatus = false,
  user,
  nickname,
  status,
  createdAt,
  onAuthChange,
  onMenuClose,
}: {
  variant?: VariantType;
  hideStatus?: boolean;
  user?: any;
  nickname?: string | null;
  status?: string | null;
  createdAt?: string | null;
  onAuthChange?: () => void | Promise<void>;
  onMenuClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => setNotice(message);

  const userEmail = user?.email ?? null;

  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<ModeType>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signupKakao, setSignupKakao] = useState(false);
  const [completingKakao, setCompletingKakao] = useState(false);
  const [completingSignup, setCompletingSignup] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupNickname, setSignupNickname] = useState("");
  const [signupInstagram, setSignupInstagram] = useState("");

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const kakaoResult = params.get("kakao_signup");
    const complete = params.get("complete_signup") === "1";
    if (complete || kakaoResult) {
      params.delete("complete_signup"); params.delete("kakao_signup");
      window.history.replaceState(null, "", window.location.pathname + (params.size ? `?${params}` : ""));
      setMode("signup"); setAuthOpen(true);
      try {
        const draft = JSON.parse(sessionStorage.getItem("signup-kakao-draft") || "null");
        if (draft && draft.expires > Date.now()) {
          setEmail(draft.email || ""); setSignupNickname(draft.nickname || ""); setSignupInstagram(draft.instagram || "");
        }
      } catch { /* A stale draft is optional. */ }
      if (kakaoResult === "error") showNotice("카카오 인증을 완료하지 못했습니다 다시 시도하거나 연결 없이 가입해 주세요");
      void fetch("/api/auth/kakao/signup", { cache: "no-store" }).then(response => response.json()).then(result => setSignupKakao(result.ready === true)).catch(() => setSignupKakao(false));
      if (complete) void supabase.auth.getUser().then(({ data: { user: current } }) => {
        if (current) {
          setCompletingSignup(true);
          setCompletingKakao(!!current.identities?.some(identity => identity.provider === "kakao"));
          setEmail(current.email || "");
          setSignupNickname(current.user_metadata?.signup_nickname || "");
          setSignupInstagram(current.user_metadata?.signup_instagram || "");
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!authOpen || mode !== "signup" || completingKakao) return;
    let active = true;
    void fetch("/api/auth/kakao/signup", { cache: "no-store" })
      .then(response => response.json())
      .then(result => { if (active) setSignupKakao(result.ready === true); })
      .catch(() => { if (active) setSignupKakao(false); });
    return () => { active = false; };
  }, [authOpen, mode, completingKakao]);

  
  
const handleLogin = async () => {
  if (!email || !password) {
    showNotice("이메일과 비밀번호를 입력해주세요");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showNotice(authErrorMessage(error, "로그인에 실패했습니다 잠시 후 다시 시도해 주세요"));
    return;
  }

const { data: { user: signedIn } } = await supabase.auth.getUser();
if (signedIn) {
  const { data: profile, error: lookupError } = await supabase.from("profiles").select("id, nickname, instagram_id, role").eq("id", signedIn.id).maybeSingle();
  if (lookupError) { showNotice("회원정보를 확인하지 못했습니다"); return; }
  if (!hasCompletedMembership(profile)) {
    showNotice("회원가입을 진행해 주세요");
    setCompletingSignup(true);
    setCompletingKakao(!!signedIn.identities?.some(identity => identity.provider === "kakao"));
    setSignupNickname(signedIn.user_metadata?.signup_nickname || "");
    setSignupInstagram(signedIn.user_metadata?.signup_instagram || "");
    setMode("signup");
    return;
  }
}
setAuthOpen(false);
setEmail("");
setPassword("");

await onAuthChange?.();

onMenuClose?.();
};

const handleKakaoLogin = async (
  type: "login" | "signup"
) => {
  localStorage.setItem("kakao_auth_mode", type);

  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    showNotice(authErrorMessage(error));
  }
};

const handleResetPassword = async () => {
  if (!email.trim()) {
    showNotice("비밀번호를 재설정할 이메일을 입력해주세요");
    return;
  }

    const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo: `${window.location.origin}/reset-password`,
    }
  );


  if (error) {
    showNotice("비밀번호 재설정 메일 발송에 실패했습니다");
    return;
  }

  showNotice("비밀번호 재설정 메일을 발송했습니다 이메일을 확인해주세요");
};

  const clearKakaoSignup = async () => {
    setSignupKakao(false);
    sessionStorage.removeItem("signup-kakao-draft");
    await fetch("/api/auth/kakao/signup", { method: "DELETE" }).catch(() => {});
  };
  const startKakaoSignup = async () => {
    if (signupBusy) return;
    setSignupBusy(true);
    try {
      const response = await fetch("/api/auth/kakao/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "카카오 인증을 시작하지 못했습니다");
      // Never persist the password across the provider redirect.
      sessionStorage.setItem("signup-kakao-draft", JSON.stringify({ email, nickname: signupNickname, instagram: signupInstagram, expires: Date.now() + 900000 }));
      setPassword("");
      window.location.assign(result.url);
    } catch (error) { showNotice(authErrorMessage(error, "카카오 인증을 시작하지 못했습니다")); }
    finally { setSignupBusy(false); }
  };

  const handleSignup = async () => {
    if (signupBusy) return;
    if (!signupNickname.trim() || !signupInstagram.trim() || !email.trim() || !password) {
      showNotice("닉네임, 인스타그램 아이디, 이메일, 비밀번호를 입력해주세요"); return;
    }
    if (password.length < 6) { showNotice("비밀번호는 6자 이상 입력해주세요"); return; }
    setSignupBusy(true);
    let membershipSaved = false;
    try {
      let userId: string | undefined;
      let connected = false;
      if (completingSignup) {
        const { data: { user: current }, error } = await supabase.auth.getUser();
        if (error || !current || current.email !== email.trim()) throw new Error("인증이 만료되었습니다 기존 로그인 방법으로 다시 로그인해 주세요");
        const { data: existing, error: lookupError } = await supabase.from("profiles").select("id, nickname, instagram_id, role, status").eq("id", current.id).maybeSingle();
        if (lookupError) throw lookupError;
        if (hasCompletedMembership(existing) || (existing && existing.status !== "pending")) throw new Error("이미 회원가입한 계정입니다 로그인해 주세요");
        connected = current.identities?.filter(identity => identity.provider === "kakao").length === 1;
        if (completingKakao && !connected) throw new Error("연결된 카카오 계정을 확인할 수 없습니다");
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
        userId = current.id;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { signup_nickname: signupNickname.trim(), signup_instagram: signupInstagram.trim(), signup_link_kakao: signupKakao } } });
        if (error) throw error;
        if (!data.user || data.user.identities?.length === 0) throw new Error("이미 등록된 이메일입니다 기존 로그인 방법으로 로그인해 주세요");
        userId = data.user.id;
        if (!data.session) { showNotice("이메일 인증 후 회원가입을 완료해 주세요"); return; }
      }
      const { error: profileError } = await supabase.rpc("complete_email_signup", {
        p_nickname: signupNickname.trim(), p_instagram: signupInstagram.trim(),
      });
      if (profileError) throw profileError;
      membershipSaved = true;
      setPassword("");
      await onAuthChange?.();
      if (signupKakao && !connected) {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/auth/kakao/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "commit", access_token: session?.access_token, refresh_token: session?.refresh_token }) });
        const result = await response.json();
        if (!response.ok) {
          showNotice(`회원가입은 완료되었습니다 ${authErrorMessage({message:result.error}, "카카오 연결은 계정설정에서 다시 진행해 주세요")}`);
          setAuthOpen(false); setCompletingSignup(false); setCompletingKakao(false);
          await clearKakaoSignup();
          return;
        }
        if (result.session) await supabase.auth.setSession(result.session);
        await onAuthChange?.();
      }
      await clearKakaoSignup();
      showNotice("회원가입이 완료되었습니다 관리자 승인 후 저장 기능을 이용할 수 있습니다");
      setAuthOpen(false);
      setCompletingKakao(false);
      setCompletingSignup(false);
      setSignupKakao(false);
      setSignupNickname(""); setSignupInstagram(""); setEmail("");
    } catch (error) {
      if (membershipSaved) {
        showNotice("회원가입은 완료되었습니다 카카오 연결 상태는 계정설정에서 확인해 주세요");
        setAuthOpen(false);
        await clearKakaoSignup();
      } else {
        showNotice(authErrorMessage(error, "회원가입에 실패했습니다 다시 시도해 주세요"));
      }
    } finally { setSignupBusy(false); }
  };

  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    showNotice("로그아웃에 실패했습니다");
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
    if (status === "payment_error") {
      return <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 border border-orange-100">결제오류</span>;
    }
    if (status === "pending") {
      return (
        <span className="rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-bold text-yellow-700 border border-yellow-100">
          승인대기
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 border border-red-100">
          승인보류
        </span>
      );
    }

    return null;
  };

  const authPopup =
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
            onClose={() => { setAuthOpen(false); void clearKakaoSignup(); }}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onResetPassword={handleResetPassword}
            onKakaoLogin={handleKakaoLogin}
            signupKakao={signupKakao} onStartKakaoSignup={startKakaoSignup} onClearKakaoSignup={() => { void clearKakaoSignup(); }}
            completingKakao={completingKakao} completingSignup={completingSignup} signupBusy={signupBusy}
          />,
          document.body
        )
      : null;

  const popup = <>{authPopup}{mounted && notice && createPortal(<AuthNotice message={notice} onClose={() => setNotice("")}/>, document.body)}</>;

  if (variant === "compact") {
    return <>
      <div data-compact-auth="true" className="flex items-center gap-2">
        {userEmail ? <button type="button" onClick={handleLogout} className="px-3 h-9 border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">로그아웃</button> : <>
          <button type="button" onClick={() => { setMode("login"); setAuthOpen(true); }} className="px-3 h-9 border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">로그인</button>
          <button type="button" onClick={() => { setMode("signup"); setAuthOpen(true); }} className="px-3 h-9 border border-gray-200 bg-white text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">회원가입</button>
        </>}
      </div>
      {popup}
    </>;
  }

  if (variant === "label") {
    return (
      <div className="hidden md:flex items-center gap-2">
        {userEmail && (
          <>
            <span
  className="
    px-3
    h-[28px]
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
    hover:-translate-y-[0.5px]
    hover:shadow-md
    cursor-default
  "
>
              {getGradeEmoji(createdAt ?? null)} {nickname || "회원"} 님
            </span>

            {!hideStatus && renderStatusBadge()}
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
  <div>
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

    <button
      onClick={(e) => {
        e.stopPropagation();
        setMode("signup");
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
        border-t
        border-gray-100
        hover:bg-blue-50
        cursor-default
      "
    >
      회원가입
    </button>
  </div>
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
