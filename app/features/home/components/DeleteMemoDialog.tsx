"use client";

import type { HomeController } from "../hooks/useHomeController";
export default function DeleteMemoDialog({ controller }: { controller: HomeController }) {
const { deleteMemoConfirmOpen, setDeleteMemoConfirmOpen, setDeleteMemoId, confirmDeleteMemo } = controller;
return (<></>);
}
