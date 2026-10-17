"use client";

import { useEffect, useRef, useState } from "react";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";

type ConfirmationOptions = { title?: string; confirmLabel?: string };
type Request = { options?: ConfirmationOptions; message: string; resolve: (answer: boolean) => void };
let enqueue: ((request: Request) => void) | null = null;

export function confirmAction(message: string, options?: ConfirmationOptions): Promise<boolean> {
  return new Promise(resolve => {
    if (!enqueue) { resolve(false); return; }
    enqueue({ message, options, resolve });
  });
}

export default function ConfirmationHost() {
  const queue = useRef<Request[]>([]);
  const [current, setCurrent] = useState<Request | null>(null);
  useEffect(() => {
    const requests = queue.current;
    const add = (request: Request) => {
      requests.push(request);
      if (requests.length === 1) setCurrent(request);
    };
    enqueue = add;
    return () => {
      if (enqueue === add) enqueue = null;
      requests.splice(0).forEach(request => request.resolve(false));
    };
  }, []);
  const answer = (value: boolean) => {
    const request = queue.current.shift();
    request?.resolve(value);
    setCurrent(queue.current[0] || null);
  };
  if (!current) return null;
  const deleting = current.message.includes("삭제");
  return <DashboardDialog confirmation title={current.options?.title ?? (deleting ? "삭제 확인" : "변경 확인")} onClose={() => answer(false)}>
    <p style={{ whiteSpace: "pre-line" }}>{current.message}</p>
    <div><button data-popup-action="true" type="button" onClick={() => answer(false)}>취소</button><button data-popup-action="true" type="button" onClick={() => answer(true)}>{current.options?.confirmLabel ?? (deleting ? "삭제" : "확인")}</button></div>
  </DashboardDialog>;
}
