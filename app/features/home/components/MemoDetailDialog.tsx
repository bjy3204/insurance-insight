"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoDetailDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, memos, saveMemos, startPopupDrag, getPopupStyle, selectedMemo, setSelectedMemo, setSaveConfirmType, memoColorOptions, changeMemoColor, deleteMemo } = controller;
return (<></>);
}
