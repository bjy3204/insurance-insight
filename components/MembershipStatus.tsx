export default function MembershipStatus({ status, rectangular = false }: { status?: string | null; rectangular?: boolean }) {
  const state = status === "pending" ? { label: "승인대기", color: "border-amber-200 bg-amber-50 text-amber-700" }
    : status === "rejected" || status === "blocked" ? { label: "승인보류", color: "border-red-200 bg-red-50 text-red-600" }
    : status === "payment_error" ? { label: "결제오류", color: "border-orange-200 bg-orange-50 text-orange-700" }
    : null;
  if (!state) return null;
  return <span data-membership-status="true" className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap border text-xs font-semibold ${rectangular ? "h-9 rounded-lg px-3" : "h-7 rounded-full px-2.5"} ${state.color}`}>{state.label}</span>;
}
