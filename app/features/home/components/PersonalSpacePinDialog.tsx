"use client";

import { Delete as KeypadBackspace, X, Users } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function PersonalSpacePinDialog({ controller }: { controller: HomeController }) {
const { authStatus, cmPinOpen, setCmPinOpen, cmPinState, cmPinStep, cmPinInput, cmPinConfirm, cmPinError, handleCmKeypad } = controller;
return (<>{cmPinOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[344px] mx-4 px-8 pt-10 pb-8">
<button data-icon-only="true" data-popup-close="true"
  onClick={() => setCmPinOpen(false)}
  className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
>
  <X className="w-4 h-4 text-gray-500" />
</button>

            {cmPinState === "not-approved" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h2 data-popup-heading="true" className="text-xl font-bold text-gray-800 mb-2">{authStatus === "payment_error" ? "결제오류" : "승인 회원 전용"}</h2>
                <p className="text-sm text-gray-500 mb-6">{authStatus === "payment_error" ? <>정기결제에 오류가 발생했습니다<br />결제 상태를 확인하거나 관리자에게 문의해 주세요</> : <>선택한 메뉴는 승인된 회원만 이용 가능합니다<br />로그인 후 승인을 받으세요</>}</p>
                <button data-popup-action="true" data-action-height="48" onClick={() => setCmPinOpen(false)}
                  className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition cursor-pointer">확인</button>
              </div>
            )}

            {cmPinState === "no-pin" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 data-popup-heading="true" className="text-xl font-bold text-gray-800 mb-1">{cmPinStep === "enter" ? "PIN 설정" : "PIN 확인"}</h2>
                <p className="text-sm text-gray-500 mb-5">{cmPinStep === "enter" ? "개인공간 전용 4자리 PIN을 설정해주세요" : "PIN을 한 번 더 입력해주세요"}</p>
                <div className="flex justify-center gap-3 mb-5">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${(cmPinStep === "enter" ? cmPinInput : cmPinConfirm).length > i ? "bg-blue-600 border-blue-600" : "border-gray-300"}`} />
                  ))}
                </div>
                {cmPinError && <p className="text-xs text-red-500 mb-3">{cmPinError}</p>}
                <div data-numeric-keypad="true" className="grid grid-cols-3 gap-2 mb-3">
                  {["1","2","3","4","5","6","7","8","9"].map((n) => (
                    <button key={n} onClick={() => handleCmKeypad(n)} className="py-4 rounded-2xl bg-gray-50 text-[18px] font-medium hover:bg-gray-100 transition cursor-pointer">{n}</button>
                  ))}
                  <div />
                  <button onClick={() => handleCmKeypad("0")} className="py-4 rounded-2xl bg-gray-50 text-[18px] font-medium hover:bg-gray-100 transition cursor-pointer">0</button>
                  <button onClick={() => handleCmKeypad("del")} className="py-4 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                    <KeypadBackspace size={18} role="img" aria-label="한 자리 지우기" />
                  </button>
                </div>
                <button onClick={() => setCmPinOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer">돌아가기</button>
              </div>
            )}

            {cmPinState === "locked" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 data-popup-heading="true" className="text-xl font-bold text-gray-800 mb-1">PIN 입력</h2>
                <p className="text-sm text-gray-500 mb-5">개인공간 4자리 PIN을 입력해주세요</p>
                <div className="flex justify-center gap-3 mb-5">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${cmPinInput.length > i ? "bg-blue-600 border-blue-600" : "border-gray-300"}`} />
                  ))}
                </div>
                {cmPinError && <p className="text-xs text-red-500 mb-3">{cmPinError}</p>}
                <div data-numeric-keypad="true" className="grid grid-cols-3 gap-2 mb-3">
                  {["1","2","3","4","5","6","7","8","9"].map((n) => (
                    <button key={n} onClick={() => handleCmKeypad(n)} className="py-4 rounded-2xl bg-gray-50 text-[18px] font-medium hover:bg-gray-100 transition cursor-pointer">{n}</button>
                  ))}
                  <div />
                  <button onClick={() => handleCmKeypad("0")} className="py-4 rounded-2xl bg-gray-50 text-[18px] font-medium hover:bg-gray-100 transition cursor-pointer">0</button>
                  <button onClick={() => handleCmKeypad("del")} className="py-4 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer">
                    <KeypadBackspace size={18} role="img" aria-label="한 자리 지우기" />
                  </button>
                </div>
                
              </div>
            )}

          </div>
        </div>
      )}</>);
}
