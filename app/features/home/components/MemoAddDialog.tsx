"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoAddDialog({ controller }: { controller: HomeController }) {
const { authUser, authStatus, memoTitle, setMemoTitle, memoContent, setMemoContent, memoColor, setMemoColor, memoAddOpen, setMemoAddOpen, memoColorOptions, addMemo } = controller;
return (<></>);
}
