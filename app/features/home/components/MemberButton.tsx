"use client";

import { User } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function MemberButton({ controller }: { controller: HomeController }) {
const { userMenuOpen, setUserMenuOpen, userBtnPos, userBtnDragRef, hasUpdate, startUserBtnDrag } = controller;
return (<><button
  onPointerDown={startUserBtnDrag}
  onClick={(e) => {
    e.stopPropagation();
    if (userBtnDragRef.current?.moved) return;
    setUserMenuOpen(!userMenuOpen);
  }}
  style={{
    transform: `translate(${userBtnPos.x}px, ${userBtnPos.y}px)`,
  }}
  className="
    md:hidden
    fixed
    left-6
    bottom-24
    z-[9999]
    w-14
    h-14
    rounded-full
    bg-gray-800
    shadow-lg
    flex
    items-center
    justify-center
    hover:shadow-2xl

    touch-none
  "
>
  <User className="w-6 h-6 text-white" />
  {hasUpdate && (
    <span className="absolute right-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-red-500" />
  )}
</button></>);
}
