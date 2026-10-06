"use client";

import { useState } from "react";
import { Bell, Settings, User, X } from "lucide-react";
import SiteHeader from "@/app/components/SiteHeader";
import AuthButton from "@/components/AuthButton";
import { noticeVersion } from "@/app/notice/notices";
import type { HomeController } from "../hooks/useHomeController";
import styles from "../HomePage.module.css";

export default function DesktopHeader({ controller: c }: { controller: HomeController }) {
  const [installHelp, setInstallHelp] = useState(false);
  const authProps = { user: c.authUser, nickname: c.authNickname, status: c.authStatus, createdAt: c.authCreatedAt, onAuthChange: c.refreshAuth, onMenuClose: () => c.setUserMenuOpen(false) };
  return <div className={styles.desktopOnly}><SiteHeader variant="main">
    <div className={styles.desktopHeader}>
      <div className={styles.counters}><div><span>TODAY</span><strong>{c.today.toLocaleString()}</strong></div><div><span>TOTAL</span><strong>{c.total.toLocaleString()}</strong></div></div>
      <div className={styles.headerLogo}><h1>보험인사이트</h1><p>보험설계사 업무 통합 플랫폼</p></div>
      <div className={styles.headerActions}>
        {c.authLoading ? <span className="h-8 w-24 rounded-full bg-gray-100 animate-pulse" /> : c.authUser ? <div className={styles.headerMember}>
          <button className={styles.nickname} aria-label="구독자료" aria-disabled={c.authStatus !== "approved"} onClick={e => { e.stopPropagation(); c.setUserMenuOpen(false); c.setSettingOpen(false); if (c.authStatus === "approved") c.setResourceOpen(true); }}><AuthButton variant="label" {...authProps} /></button>
        </div> : <div className={styles.headerAuth}><AuthButton variant="menu" {...authProps} /></div>}
        <button className={styles.headerIcon} aria-label="공지사항" onClick={e => { e.stopPropagation(); localStorage.setItem("noticeRead", noticeVersion.toString()); localStorage.setItem("seen_db_notice_ids", JSON.stringify(c.dbNotices.map(n => n.id))); c.setHasUpdate(false); c.setSelectedNotice(null); c.resetPopupPosition("notice"); c.setNoticeOpen(true); c.setUserMenuOpen(false); c.setSettingOpen(false); }}><Bell />{c.hasUpdate && <i />}</button>
        <div className={styles.headerMember}>
          <button className={styles.headerIcon} aria-label="설정" aria-expanded={c.settingOpen} onClick={e => { e.stopPropagation(); c.setSettingOpen(!c.settingOpen); c.setUserMenuOpen(false); }}><Settings /></button>
          {c.settingOpen && <div className={styles.headerDropdown} onClick={e => e.stopPropagation()}>
            <button onClick={() => { c.resetPopupPosition("menuAdd"); c.setMenuAddOpen(true); c.setMemoOpen(false); c.setMenuSortOpen(false); c.setSelectedPersonalMenuId(""); c.setEditIconOpen(false); c.setMenuManageMode("sort"); c.setSettingOpen(false); }}>메뉴 추가</button>
            <button onClick={() => { c.setTempMenus(c.menus); c.setTempPersonalMenus(c.personalMenus); c.setTempQuickMenuKeys(c.quickMenuKeys); c.setTempHiddenMenuIds(c.hiddenMenuIds); c.setSelectedPersonalMenuId(""); c.setEditIconOpen(false); c.setMenuManageMode("sort"); c.resetPopupPosition("menuSort"); c.setMenuSortOpen(true); c.setMemoOpen(false); c.setMenuAddOpen(false); c.setSettingOpen(false); }}>메뉴 변경</button>
            <button onClick={async () => { c.setSettingOpen(false); if (c.deferredPrompt) { c.deferredPrompt.prompt(); const result = await c.deferredPrompt.userChoice; if (result.outcome === "accepted") { c.setShowInstall(false); c.setDeferredPrompt(null); } } else setInstallHelp(true); }}>바로가기 만들기</button>
          </div>}
        </div>
        {!c.authLoading && c.authUser && <div className={styles.headerMember}>
          <button className={styles.headerIcon} aria-label="회원 메뉴" aria-expanded={c.userMenuOpen} onClick={e => { e.stopPropagation(); c.setUserMenuOpen(!c.userMenuOpen); c.setSettingOpen(false); }}><User /></button>
          {c.userMenuOpen && <div className={styles.headerDropdown} onClick={e => e.stopPropagation()}>
            <button onClick={() => { c.setEditNickname(c.authNickname || ""); c.setEditInstagram(c.authInstagram || ""); c.setCurrentPassword(""); c.setNewPassword(""); c.setNewPasswordConfirm(""); c.setProfileSettingOpen(true); c.setUserMenuOpen(false); }}>개인설정</button>
            <AuthButton variant="menu" {...authProps} />
          </div>}
        </div>}
      </div>
    </div>
  </SiteHeader>{installHelp && <div className={styles.installOverlay} onClick={() => setInstallHelp(false)}><div role="dialog" aria-modal="true" aria-label="바로가기 만들기" onClick={e => e.stopPropagation()}><button data-popup-close="true" aria-label="닫기" onClick={() => setInstallHelp(false)}><X size={20} /></button><h2>바로가기 만들기</h2><p>크롬 또는 엣지의 브라우저 메뉴에서 ‘앱 설치’ 또는 ‘바로가기 만들기’를 선택해 주세요.</p><button onClick={() => setInstallHelp(false)}>확인</button></div></div>}</div>;
}
