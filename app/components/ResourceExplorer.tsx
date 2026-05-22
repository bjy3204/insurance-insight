"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  X,
  FolderOpen,
  Folder,
  Upload,
  Trash2,
  FolderPlus,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StorageItem {
  name: string;
  id?: string | null;
  metadata?: { size?: number; mimetype?: string } | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  isFolder?: boolean;
}

interface ResourceExplorerProps {
  onClose: () => void;
  authStatus?: string | null;
  authRole?: string | null;
}


export default function ResourceExplorer({ onClose, authStatus, authRole }: ResourceExplorerProps) {
  const isAdmin = authRole === "admin";

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [size, setSize] = useState({ width: 900, height: 600 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderTree, setFolderTree] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<StorageItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StorageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialized) {
      const w = Math.min(900, window.innerWidth - 40);
      const h = Math.min(600, window.innerHeight - 100);
      setSize({ width: w, height: h });
      setPos({ x: Math.max(20, (window.innerWidth - w) / 2), y: Math.max(20, (window.innerHeight - h) / 2) });
      setInitialized(true);
    }
  }, [initialized]);

  const onMouseDownDrag = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, .no-drag")) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y)),
        });
      }
      if (resizing.current) {
        setSize({
          width: Math.max(500, Math.min(1400, resizeStart.current.w + (e.clientX - resizeStart.current.x))),
          height: Math.max(400, Math.min(900, resizeStart.current.h + (e.clientY - resizeStart.current.y))),
        });
      }
    };
    const onMouseUp = () => { dragging.current = false; resizing.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [size]);

  const onMouseDownResize = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    e.preventDefault(); e.stopPropagation();
  }, [size]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const prefix = currentPath.length > 0 ? currentPath.join("/") + "/" : "";
    const { data } = await supabase.storage.from("resources").list(prefix, { limit: 200, sortBy: { column: "name", order: "asc" } });
    const filtered = (data || []).filter((item) => item.name !== ".keep");
    const folders = filtered.filter((item) => !item.metadata || item.id === null).map((item) => ({ ...item, isFolder: true }));
    const files = filtered.filter((item) => item.metadata && item.id !== null).map((item) => ({ ...item, isFolder: false }));
    setItems([...folders, ...files]);
    setLoading(false);
  }, [currentPath]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const loadFolderTree = useCallback(async () => {
    const { data } = await supabase.storage.from("resources").list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
    const folders = (data || []).filter((item) => (!item.metadata || item.id === null) && item.name !== ".keep").map((item) => item.name);
    setFolderTree(folders);
  }, []);

  useEffect(() => { loadFolderTree(); }, [loadFolderTree]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const folderPath = currentPath.length > 0 ? currentPath.join("/") + "/" + newFolderName.trim() + "/.keep" : newFolderName.trim() + "/.keep";
    await supabase.storage.from("resources").upload(folderPath, new Blob([""]), { upsert: false });
    setNewFolderName(""); setShowNewFolder(false);
    await loadItems(); await loadFolderTree();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const filePath = currentPath.length > 0 ? currentPath.join("/") + "/" + file.name : file.name;
      await supabase.storage.from("resources").upload(filePath, file, { upsert: true });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadItems();
  };

  const handleDelete = async (item: StorageItem) => {
    const itemPath = currentPath.length > 0 ? currentPath.join("/") + "/" + item.name : item.name;
    if (item.isFolder) {
      const { data: innerFiles } = await supabase.storage.from("resources").list(itemPath, { limit: 200 });
      if (innerFiles && innerFiles.length > 0) await supabase.storage.from("resources").remove(innerFiles.map((f) => itemPath + "/" + f.name));
      await supabase.storage.from("resources").remove([itemPath + "/.keep"]);
    } else {
      await supabase.storage.from("resources").remove([itemPath]);
    }
    setDeleteConfirm(null); await loadItems(); await loadFolderTree();
  };

  const handleDownload = async (item: StorageItem) => {
    const filePath = currentPath.length > 0 ? currentPath.join("/") + "/" + item.name : item.name;
    const { data } = await supabase.storage.from("resources").createSignedUrl(filePath, 60);
    if (!data?.signedUrl) { alert("다운로드 링크 생성 실패"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl; a.download = item.name; a.target = "_blank"; a.click();
  };

  const handlePreview = async (item: StorageItem) => {
    if (item.isFolder) { setCurrentPath([...currentPath, item.name]); return; }
    const filePath = currentPath.length > 0 ? currentPath.join("/") + "/" + item.name : item.name;
    const mime = item.metadata?.mimetype || "";
    const isImage = mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.name);
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(item.name);
    if (isImage || isPdf) {
      const { data } = await supabase.storage.from("resources").createSignedUrl(filePath, 300);
      if (data?.signedUrl) { setPreviewUrl(data.signedUrl); setSelectedFile(item); setPreviewOpen(true); return; }
    }
    handleDownload(item);
  };

  const getFileIcon = (item: StorageItem) => {
    const name = item.name.toLowerCase();
    const mime = item.metadata?.mimetype || "";
    if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (/\.pdf$/.test(name)) return <FileText className="w-8 h-8 text-red-400" />;
    if (/\.(xlsx|xls|csv)$/.test(name)) return <FileText className="w-8 h-8 text-green-500" />;
    if (/\.(pptx|ppt)$/.test(name)) return <FileText className="w-8 h-8 text-orange-400" />;
    if (/\.(docx|doc)$/.test(name)) return <FileText className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  if (authStatus !== "approved") return null;

    return (
    <>
      <div className="fixed inset-0 z-[9990] bg-black/30 md:hidden" onClick={onClose} />
      <div
        style={
          typeof window !== "undefined" && window.innerWidth < 768
            ? { position: "fixed", inset: 0, zIndex: 9999 }
            : { position: "fixed", left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex: 9999 }
        }
        className="bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
        onMouseDown={onMouseDownDrag}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white cursor-move select-none">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-gray-800 text-base">구독자 전용 자료실</span>
          </div>
          <div className="flex items-center gap-2 no-drag">
            {isAdmin && (
              <>
                <button onClick={() => setShowNewFolder(!showNewFolder)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition cursor-default">
                  <FolderPlus className="w-4 h-4" /><span className="hidden sm:inline">폴더 추가</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold transition cursor-default disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="hidden sm:inline">{uploading ? "업로드 중..." : "파일 업로드"}</span>
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              </>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-default">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {showNewFolder && (
          <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 border-b border-blue-100 no-drag">
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="폴더 이름 입력 (한글 가능)" className="flex-1 px-3 py-2 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
            <button onClick={createFolder} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition cursor-default">만들기</button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition cursor-default">취소</button>
          </div>
        )}

        <div className="flex items-center gap-1 px-5 py-2 border-b border-gray-100 bg-gray-50 text-sm no-drag overflow-x-auto">
          <button onClick={() => setCurrentPath([])} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-semibold cursor-default shrink-0">
            <Home className="w-3.5 h-3.5" /><span>홈</span>
          </button>
          {currentPath.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <button onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))} className="text-blue-500 hover:text-blue-700 font-semibold cursor-default">{segment}</button>
            </div>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden no-drag">
          <div className="hidden md:flex flex-col w-48 border-r border-gray-100 bg-gray-50 overflow-y-auto py-3 px-2 shrink-0">
            <button onClick={() => setCurrentPath([])} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-default mb-1 ${currentPath.length === 0 ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              <Home className="w-4 h-4" />전체 자료
            </button>
            {folderTree.map((folder) => (
              <button key={folder} onClick={() => setCurrentPath([folder])} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-default ${currentPath[0] === folder ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
                {currentPath[0] === folder ? <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" /> : <Folder className="w-4 h-4 text-yellow-500 shrink-0" />}
                <span className="truncate">{folder}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FolderOpen className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm">{isAdmin ? "파일을 업로드하거나 폴더를 만들어 보세요." : "아직 자료가 없습니다."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item) => (
                  <div key={item.name} className="relative group flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 bg-white hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer select-none" onClick={() => handlePreview(item)}>
                    <div className="w-14 h-14 flex items-center justify-center">
                      {item.isFolder ? <FolderOpen className="w-12 h-12 text-yellow-400" /> : getFileIcon(item)}
                    </div>
                    <span className="text-xs text-center text-gray-700 font-medium leading-tight line-clamp-2 w-full break-all">{item.name}</span>
                    {!item.isFolder && item.metadata?.size && <span className="text-[10px] text-gray-400">{formatSize(item.metadata.size)}</span>}
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 items-center justify-center transition hidden group-hover:flex cursor-default">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {!item.isFolder && (
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-400 hover:text-blue-600 items-center justify-center transition hidden group-hover:flex cursor-default">
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block absolute bottom-0 right-0 w-6 h-6 cursor-se-resize" onMouseDown={onMouseDownResize} style={{ zIndex: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-1 right-1 text-gray-300">
            <path d="M14 2L2 14M14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {previewOpen && selectedFile && previewUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-800 truncate text-sm">{selectedFile.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedFile)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition cursor-default">
                  <Download className="w-4 h-4" />다운로드
                </button>
                <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-default">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50">
              {(selectedFile.metadata?.mimetype?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(selectedFile.name)) ? (
                <img src={previewUrl} alt={selectedFile.name} className="max-w-full max-h-[70vh] rounded-2xl shadow object-contain" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded-2xl border-0" title={selectedFile.name} />
              )}
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <p className="text-gray-800 font-bold text-center mb-2">{deleteConfirm.isFolder ? "폴더" : "파일"} 삭제</p>
            <p className="text-gray-500 text-sm text-center mb-6">
              <span className="font-semibold text-gray-700">"{deleteConfirm.name}"</span>을(를) 삭제하시겠습니까?
              {deleteConfirm.isFolder && <span className="block text-red-400 text-xs mt-1">폴더 안의 모든 파일이 삭제됩니다.</span>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition cursor-default">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition cursor-default">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
