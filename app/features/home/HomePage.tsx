"use client";

import styles from "./HomePage.module.css";
import ResourceExplorer from "@/app/components/ResourceExplorer";
import { useHomeController } from "./hooks/useHomeController";
import FortuneWidget from "./components/FortuneWidget";
import MainHeader from "./components/MainHeader";
import DashboardCards from "./components/dashboard/DashboardCards";
import MainMenuGrid from "./components/MainMenuGrid";
import ProfileSettingsDialog from "./components/ProfileSettingsDialog";
import MenuContextMenu from "./components/MenuContextMenu";
import MemberButton from "./components/MemberButton";
import MemberMenu from "./components/MemberMenu";
import QuickMenuPanel from "./components/QuickMenuPanel";
import MainFooter from "./components/MainFooter";
import MenuEditFooter from "./components/MenuEditFooter";
import MenuLinkAlert from "./components/MenuLinkAlert";
import DeleteMenuDialog from "./components/DeleteMenuDialog";
import QuickMenuSelectionDialog from "./components/QuickMenuSelectionDialog";
import QuickMenuLimitDialog from "./components/QuickMenuLimitDialog";
import DeleteQuickMenuDialog from "./components/DeleteQuickMenuDialog";
import SaveMenuDialog from "./components/SaveMenuDialog";

import PasswordResultDialog from "./components/PasswordResultDialog";
import PopupNoticeDialog from "./components/PopupNoticeDialog";
import ContactDialog from "./components/ContactDialog";
import NoticeDialog from "./components/NoticeDialog";
import MenuSortDialog from "./components/MenuSortDialog";
import MenuAddDialog from "./components/MenuAddDialog";



import HospitalDialog from "./components/HospitalDialog";
import DiseaseDialog from "./components/DiseaseDialog";
import BankRatesDialog from "./components/BankRatesDialog";
import NpsTableModal from "@/app/components/NpsTableModal";
import LifeExpectancyDialog from "./components/LifeExpectancyDialog";
import PressDialog from "./components/PressDialog";
import PersonalSpacePinDialog from "./components/PersonalSpacePinDialog";
export default function HomePage() {
const controller = useHomeController();
const { authStatus, authRole, resourceOpen, setResourceOpen } = controller;
return ((
    <>
    <main className={styles.page}>

        <FortuneWidget controller={controller} />

      
      {/* 헤더 */}
      <MainHeader controller={controller} />
      
            {/* 메인 */}
      <MainMenuGrid controller={controller} />
      <DashboardCards controller={controller} />

      <ProfileSettingsDialog controller={controller} />

<MenuContextMenu controller={controller} />

      {/* 앱처럼 사용하기 */}
      {/* 앱처럼 사용하기 */}


      {/* 모바일 메세지 버튼 */}


<MemberButton controller={controller} />

<MemberMenu controller={controller} />
<QuickMenuPanel controller={controller} />

    


      {/* 하단 고정 */}
      <MainFooter controller={controller} />

<MenuEditFooter controller={controller} />

<MenuLinkAlert controller={controller} />

<DeleteMenuDialog controller={controller} />

<QuickMenuSelectionDialog controller={controller} />

<QuickMenuLimitDialog controller={controller} />

<DeleteQuickMenuDialog controller={controller} />

<SaveMenuDialog controller={controller} />



<PasswordResultDialog controller={controller} />

      {/* 공지 팝업 */}
      <PopupNoticeDialog controller={controller} />

      {/* 메세지 모달 */}
      <ContactDialog controller={controller} />
            {/* 공지사항 팝업 */}
      <NoticeDialog controller={controller} />

{/* 메뉴 정렬 팝업 */}
<MenuSortDialog controller={controller} />

{/* 메뉴 추가 팝업 */}
<MenuAddDialog controller={controller} />

      {/* 메모장 팝업 */}
      

              {/* 메모 추가 팝업 */}
      

            {/* 메모 상세 팝업 */}
      

      

      <HospitalDialog controller={controller} />

<DiseaseDialog controller={controller} />

<BankRatesDialog controller={controller} />

{controller.npsTableOpen && <NpsTableModal onClose={() => controller.setNpsTableOpen(false)} />}

<LifeExpectancyDialog controller={controller} />
<PressDialog controller={controller} />

      {/* 개인공간 PIN 팝업 */}
      <PersonalSpacePinDialog controller={controller} />

                                        </main>

          {resourceOpen && (
        <ResourceExplorer onClose={() => setResourceOpen(false)} authStatus={authStatus} authRole={authRole} />
      )}

 {/* 환율 변환기 (승인 구독자 전용 - 컴포넌트 내부에서 권한 체크) */}

       

    </>
    ));
}
