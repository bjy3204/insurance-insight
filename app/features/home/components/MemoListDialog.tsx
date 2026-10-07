"use client";

import { X, NotebookPen, Pin, Eye, EyeOff, Plus, Search, Pencil } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableMemoCard from "../components/SortableMemoCard";
import type { HomeController } from "../hooks/useHomeController";
export default function MemoListDialog({ controller }: { controller: HomeController }) {
const { sensors, memoOpen, setMemoOpen, startPopupDrag, getPopupStyle, memoSearch, setMemoSearch, memoPage, setMemoPage, setMemoAddOpen, setSelectedMemo, setContextMenu, totalMemoPages, pagedMemos, getMemoColorClass, toggleMemoVisible, toggleMemoPinned, handleMemoDragEnd } = controller;
return (<></>);
}
