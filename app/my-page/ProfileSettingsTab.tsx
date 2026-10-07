"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function ProfileSettingsTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { authUser, authNickname, authInstagram, refreshAuth } = useAuth();
  const [nickname, setNickname] = useState(authNickname || "");
  const [instagram, setInstagram] = useState(authInstagram || "");
  const [pinPassword, setPinPassword] = useState("");
  const [pinResult, setPinResult] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<"save" | "pin" | "kakao" | null>(null);
  const [notice, setNotice] = useState("");
  const inputClass = "h-11 w-full min-w-0 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-blue-400 disabled:opacity-50";
  const buttonClass = "h-11 rounded-xl px-4 text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-default transition";

  useEffect(() => { setNickname(authNickname || ""); }, [authNickname]);
  useEffect(() => { setInstagram(authInstagram || ""); }, [authInstagram]);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUserIdentities().then(({ data }) => {
      if (!cancelled) setConnected(!!data?.identities.some(identity => identity.provider === "kakao"));
    });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const checkPin = async () => {
    if (busy || !authUser?.email || !pinPassword) return;
    setBusy("pin"); setPinResult("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: authUser.email, password: pinPassword });
      if (error) { setPinResult("회원가입 비밀번호가 올바르지 않습니다."); return; }
      const { data, error: pinError } = await supabase.from("customer_settings").select("pin_plain").eq("user_id", authUser.id).maybeSingle();
      setPinResult(pinError ? "개인공간 비밀번호를 확인하지 못했습니다." : data?.pin_plain ? `개인공간 비밀번호: ${data.pin_plain}` : "설정된 개인공간 비밀번호가 없습니다.");
    } catch { setPinResult("확인하지 못했습니다. 다시 시도해 주세요."); }
    finally { setPinPassword(""); setBusy(null); }
  };

  const save = async () => {
    if (busy || !authUser?.email) return;
    setNotice("");
    if (!nickname.trim()) { setNotice("닉네임을 입력해 주세요."); return; }
    const changingPassword = !!(currentPassword || newPassword || confirmation);
    if (changingPassword && (!currentPassword || newPassword.length < 6 || newPassword !== confirmation)) {
      setNotice(!currentPassword ? "현재 비밀번호를 입력해 주세요." : newPassword.length < 6 ? "새 비밀번호는 6자 이상 입력해 주세요." : "새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setBusy("save");
    let passwordChanged = false;
    try {
      if (changingPassword) {
        const { error: checkError } = await supabase.auth.signInWithPassword({ email: authUser.email, password: currentPassword });
        if (checkError) { setNotice("현재 비밀번호가 일치하지 않습니다."); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { setNotice("비밀번호를 변경하지 못했습니다. 다시 확인해 주세요."); return; }
        passwordChanged = true;
        setCurrentPassword(""); setNewPassword(""); setConfirmation("");
      }
      const { error } = await supabase.from("profiles").update({ nickname: nickname.trim(), instagram_id: instagram.trim() }).eq("id", authUser.id);
      if (error) { setNotice(passwordChanged ? "비밀번호는 변경됐지만 프로필을 저장하지 못했습니다. 다시 저장해 주세요." : "프로필을 저장하지 못했습니다. 다시 시도해 주세요."); return; }
      await refreshAuth();
      await onSaved();
      setNotice("저장되었습니다.");
    } catch { setNotice(passwordChanged ? "비밀번호는 변경됐습니다. 프로필 저장 상태를 다시 확인해 주세요." : "저장하지 못했습니다. 다시 시도해 주세요."); }
    finally { setBusy(null); }
  };

  const toggleKakao = async () => {
    if (busy || !authUser?.id) return;
    if (connected && !window.confirm("카카오 연결을 해제하시겠습니까?")) return;
    setBusy("kakao"); setNotice("");
    try {
      if (!connected) {
        const { error } = await supabase.auth.linkIdentity({ provider: "kakao", options: { redirectTo: `${window.location.origin}/auth/callback` } });
        if (error) setNotice("카카오 연결을 시작하지 못했습니다. 다시 시도해 주세요.");
        return;
      }
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) { setNotice("카카오 연결 정보를 확인하지 못했습니다."); return; }
      const identity = data?.identities.find(item => item.provider === "kakao");
      if (!identity) { setNotice("카카오 연결 정보를 찾을 수 없습니다."); return; }
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
      if (unlinkError) { setNotice("카카오 연결을 해제하지 못했습니다. 다른 로그인 수단이 연결돼 있는지 확인해 주세요."); return; }
      setConnected(false);
      const { error: profileError } = await supabase.from("profiles").update({ kakao_connected: false }).eq("id", authUser.id);
      setNotice(profileError ? "카카오 연결은 해제됐지만 프로필 상태를 갱신하지 못했습니다." : "카카오 연결이 해제되었습니다.");
      await refreshAuth();
    } catch { setNotice("카카오 연결 설정을 변경하지 못했습니다. 다시 시도해 주세요."); }
    finally { setBusy(null); }
  };

  return <section className="personal-grid bg-white p-5 md:p-6 space-y-5">
    <h2 className="text-base font-bold text-gray-900">계정 설정</h2>
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-500">현재 이메일</span>
      <span className="text-sm font-semibold text-gray-700 break-all">{authUser?.email}</span>
    </div>
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-600">닉네임<input disabled={!!busy} value={nickname} onChange={e => setNickname(e.target.value)} autoComplete="nickname" className={inputClass + " mt-2"} /></label>
      <label className="block text-sm font-semibold text-gray-600">인스타그램 아이디<input disabled={!!busy} value={instagram} onChange={e => setInstagram(e.target.value)} className={inputClass + " mt-2"} /></label>
    </div>
    <div className="border-t border-gray-100 pt-4">
      <label htmlFor="personal-pin-password" className="block text-sm font-semibold text-gray-600 mb-2">개인공간 비밀번호 확인</label>
      <div className="flex gap-2"><input id="personal-pin-password" type="password" autoComplete="current-password" disabled={!!busy} value={pinPassword} onChange={e => { setPinPassword(e.target.value); setPinResult(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void checkPin(); } }} placeholder="회원가입 비밀번호 입력" className={inputClass + " flex-1"} /><button type="button" onClick={checkPin} disabled={!!busy || !pinPassword} className={buttonClass + " shrink-0 bg-gray-900 text-white hover:bg-gray-800"}>{busy === "pin" ? "확인 중" : "확인"}</button></div>
      {pinResult && <p role="status" className="mt-2 text-sm text-blue-600">{pinResult}</p>}
    </div>
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-600">회원가입 비밀번호 변경</h3>
      <input aria-label="현재 비밀번호" autoComplete="current-password" disabled={!!busy} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" className={inputClass} />
      <input aria-label="새 비밀번호" autoComplete="new-password" disabled={!!busy} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="새 비밀번호" className={inputClass} />
      <input aria-label="새 비밀번호 확인" autoComplete="new-password" disabled={!!busy} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="새 비밀번호 확인" className={inputClass} />
    </div>
    <div className="border-t border-gray-100 pt-4"><h3 className="mb-2 text-sm font-semibold text-gray-600">카카오 로그인</h3><button type="button" onClick={toggleKakao} disabled={!!busy} className={buttonClass + (connected ? " w-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : " w-full bg-[#FEE500] text-gray-900 hover:bg-[#f6dc00]")}>{busy === "kakao" ? "처리 중..." : connected ? "카카오 연결 해제" : "카카오 연결하기"}</button></div>
    {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
    <button type="button" onClick={save} disabled={!!busy} className={buttonClass + " w-full bg-gray-900 text-white hover:bg-gray-800"}>{busy === "save" ? "저장 중..." : "계정 설정 저장"}</button>
  </section>;
}
