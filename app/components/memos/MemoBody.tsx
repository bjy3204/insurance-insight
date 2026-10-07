"use client";
import { useEffect, useState } from "react";
import { decodeMemo, encodeMemo, plainMemoHtml, type MemoItem } from "@/lib/memos/model";
import { memoHtmlText, sanitizeMemoHtml } from "@/lib/memos/html";

export default function MemoBody({ memo, onChange, className = "" }: { memo: MemoItem; onChange?: (content: string) => Promise<void>; className?: string }) {
  const document = decodeMemo(memo);
  const [html, setHtml] = useState(() => plainMemoHtml(document.text));
  useEffect(() => { setHtml(document.html ? sanitizeMemoHtml(document.html) : plainMemoHtml(document.text)); }, [memo.content]);
  return <div className={`memo-rich-body ql-editor ${className}`} dangerouslySetInnerHTML={{ __html: html }} onClick={async event => {
    const item = (event.target as HTMLElement).closest<HTMLLIElement>('li[data-list="checked"],li[data-list="unchecked"]');
    if (!item || !onChange) return;
    event.stopPropagation();
    const old = item.getAttribute("data-list");
    item.setAttribute("data-list", old === "checked" ? "unchecked" : "checked");
    const nextHtml = sanitizeMemoHtml(event.currentTarget.innerHTML);
    try { await onChange(encodeMemo({ ...document, html: nextHtml, text: memoHtmlText(nextHtml) })); setHtml(nextHtml); }
    catch { item.setAttribute("data-list", old!); }
  }} />;
}
