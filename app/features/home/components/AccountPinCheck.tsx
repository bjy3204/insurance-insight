"use client";
import ClearableSearchInput from "@/app/components/ClearableSearchInput";
import type { HomeController } from "../hooks/useHomeController";

type Props = Pick<HomeController, "pinCheckPassword" | "setPinCheckPassword" | "pinCheckResult" | "handleCheckPin">;
export default function AccountPinCheck({ controller, divider = true }: { controller: Props; divider?: boolean }) {
  return <div className={divider ? "border-t border-gray-100 pt-3" : ""}>
    <p className="mb-2 text-sm font-bold text-gray-500">개인공간 비밀번호 확인</p>
    <div className="flex gap-2">
      <ClearableSearchInput onClear={() => controller.setPinCheckPassword("")} data-ui-field="true" aria-label="개인공간 비밀번호 확인용 회원가입 비밀번호" type="password" autoComplete="current-password" placeholder="회원가입 비밀번호 입력" value={controller.pinCheckPassword} onChange={event => controller.setPinCheckPassword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void controller.handleCheckPin(); } }} className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"/>
      <button data-account-pin-confirm="true" data-action-height="44" type="button" onClick={() => void controller.handleCheckPin()} className="h-11 shrink-0 cursor-pointer rounded-xl bg-gray-900 px-4 text-sm font-bold text-white transition-colors hover:bg-gray-800">확인</button>
    </div>
    {controller.pinCheckResult && <p role="status" className="mt-2 text-center text-sm font-semibold text-blue-600">{controller.pinCheckResult}</p>}
  </div>;
}
