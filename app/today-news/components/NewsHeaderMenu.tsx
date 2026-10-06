"use client";

import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import HeaderUtilityItems from '@/app/components/HeaderUtilityItems';
import MemoManager from '@/app/components/MemoManager';

export default function NewsHeaderMenu() {
  const [open,setOpen] = useState(false);
  const [memoOpen,setMemoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event:PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event:KeyboardEvent) => { if(event.key==='Escape') setOpen(false); };
    document.addEventListener('pointerdown',closeOutside);
    document.addEventListener('keydown',closeEscape);
    return () => {
      document.removeEventListener('pointerdown',closeOutside);
      document.removeEventListener('keydown',closeEscape);
    };
  },[open]);
  return <>
    <div ref={menuRef} className={`absolute right-0 top-1/2 -translate-y-1/2 ${open?'z-[1000]':'z-40'}`}>
      <button type="button" data-header-control="true" aria-label="도구 메뉴" aria-expanded={open} aria-controls="news-header-tools" onClick={()=>setOpen(value=>!value)}><Menu /></button>
      {open && <div id="news-header-tools" className="absolute right-0 top-12 w-40 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
        <button type="button" onClick={()=>{setOpen(false);setMemoOpen(true);}} className="block w-full text-center px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-default">메모장</button>
        <HeaderUtilityItems onClose={()=>setOpen(false)} />
      </div>}
    </div>
    {memoOpen && <MemoManager open={memoOpen} onClose={()=>setMemoOpen(false)} />}
  </>;
}
