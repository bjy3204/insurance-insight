"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSign, Check, CreditCard, Sprout } from "lucide-react";
import styles from "./SubscriptionCheckout.module.css";

export default function SubscriptionCheckout({ amount, enabled = false }: { amount: number; enabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const instagramId = new FormData(event.currentTarget).get("instagramId");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/payapp/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, instagramId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "결제창을 열지 못했습니다.");
      window.location.assign(result.url);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "다시 시도해 주세요."); setBusy(false); }
  }
  const money = amount.toLocaleString("ko-KR");
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}><Sprout size={23} strokeWidth={1.8} />보험인사이트</Link></header>
    <div className={styles.content}>
      {!enabled && <p className={styles.preview}>디자인 미리보기 · 실제 결제는 아직 연결되지 않았습니다</p>}
      <section className={styles.card}>
        <div className={styles.intro}><span className={styles.badge}>보험나무 정기구독</span><h1>보험 업무를<br />조금 더 가볍게.</h1><p>보험나무 자료와 보험인사이트를<br />하나의 구독으로 만나보세요.</p></div>
        <div className={styles.price}><span>월 구독료</span><div><strong>{money}</strong><b>원</b><small>/ 월</small></div></div>
        <div className={styles.benefits}><span><Check size={16} />보험나무 자료 구독</span><span><Check size={16} />결제 후 보험인사이트 가입·연결</span></div>
        <form className={styles.form} onSubmit={checkout}>
          <label className={styles.phoneLabel} htmlFor="subscription-instagram">인스타그램 아이디</label>
          <div className={styles.phone}><AtSign size={18} /><input id="subscription-instagram" name="instagramId" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="인스타그램 아이디를 입력해 주세요" required /></div>
          <button type="submit" disabled={!enabled || busy}>{busy ? "결제창 여는 중…" : "구독 결제하기"}</button>
          {!enabled && <p className={styles.notReady}>페이앱 연동 준비 중입니다.</p>}
          {error && <p role="alert" className={styles.notReady}>{error}</p>}
        </form>
        <div className={styles.details}><span><CreditCard size={15} />카드·휴대폰 결제</span><p>결제 완료 후 연결된 보험인사이트 링크로 회원가입하시면 빠르게 승인됩니다.</p></div>
      </section>
      <footer className={styles.footer}>보험나무 · 보험인사이트</footer>
    </div>
  </main>;
}

