"use client";
import {useEffect,useState} from 'react';
import {LayoutGrid,ArrowLeft,BriefcaseBusiness,Newspaper,MessageCircle} from 'lucide-react';
import {FaInstagram} from 'react-icons/fa';
import WorkTools from './WorkTools';
import MemoStickers from '@/app/components/MemoStickers';
import SiteFooter from '@/app/components/SiteFooter';
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';
export default function UseLinkPage(){
 const [settingOpen,setSettingOpen]=useState(false);
 useEffect(()=>{if(!settingOpen)return;const close=()=>setSettingOpen(false);window.addEventListener('click',close);return()=>window.removeEventListener('click',close);},[settingOpen]);
  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header data-page-header="true" className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="relative flex items-center justify-center">
            <a data-icon-only="true" data-header-control="true" href="/" className="absolute left-0 w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-black" />
            </a>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <BriefcaseBusiness className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-black text-gray-900">업무도구</h1>
              </div>
              
            </div>
            <div
  className={`absolute right-0 top-1/2 -translate-y-1/2 ${
    settingOpen ? "z-[1000]" : "z-40"
  }`}
>
  <div className="relative">
    <button data-icon-only="true" data-header-control="true"
      onClick={(e) => {
        e.stopPropagation();
        setSettingOpen(!settingOpen);
      }}
      className={`
        w-10 h-10 rounded-full border border-gray-200 shadow-sm
        flex items-center justify-center transition cursor-default
        ${settingOpen ? "bg-gray-100" : "bg-white hover:bg-gray-50"}
      `}
    >
      <LayoutGrid className="w-5 h-5 text-gray-400" />
    </button>

    {settingOpen && (
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          absolute right-0 top-12 z-[999] w-40 rounded-2xl
          bg-white border border-gray-200 shadow-xl overflow-hidden
        "
      >
        <button
          onClick={() => {
            window.dispatchEvent(new Event("open-memo-manager"));
            setSettingOpen(false);
          }}
          className="
            block w-full text-center px-4 py-3 text-sm font-bold
            text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer
          "
        >
          메모장
        </button>

        <HeaderUtilityItems onClose={() => setSettingOpen(false)} />
      </div>
    )}
  </div>
</div>
          </div>
        </div>
      </header>

      <section data-page-content="true" className="max-w-7xl mx-auto px-5 py-6">

        <WorkTools/>

      </section>

      <>
        <SiteFooter desktopOnly />
        <div data-page-fixed-footer="true" className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <a href="https://naver.me/xsZ8mk7H" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <Newspaper className="w-5 h-5" />
            <span className="text-sm">보험사별 소식지</span>
          </a>
          <a href="https://open.kakao.com/o/gD7ej63h" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">보험인사이트 카카오톡</span>
          </a>
          <a href="https://www.instagram.com/g__tree_/" target="_blank" rel="noopener noreferrer" className="py-3 flex flex-col items-center gap-1">
            <FaInstagram className="w-5 h-5" />
            <span className="text-sm">보험나무 인스타그램</span>
          </a>
        </div>
      </div>
      </>


<MemoStickers />

      {/* 메모 수정 팝업 */}
      

      {/* 삭제 확인 팝업 */}
      
    </main>
  );
}
