"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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
  CheckSquare,
  Search,
  LayoutGrid,
  List,
  XCircle,
  ArrowDownToLine,
  ArrowUpDown,
} from "lucide-react";

interface DisplayItem {
  storageName: string;
  displayName: string;
  isFolder: boolean;
  size?: number;
  mimetype?: string;
  folderPath?: string; // 검색 결과에서 어느 폴더에 있는지 표시용
}

interface FolderRecord {
  id: string;
  path: string;
  display_name: string;
  parent_path: string;
}

interface FileRecord {
  id: string;
  storage_path: string;
  display_name: string;
  folder_path: string;
  mime_type?: string;
  size_bytes?: number;
}

interface ResourceExplorerProps {
  onClose: () => void;
  authStatus?: string | null;
  authRole?: string | null;
}

type ViewMode = "grid" | "list";
type SortKey = "name" | "size" | "type";
type SortDir = "asc" | "desc";

export default function ResourceExplorer({ onClose, authStatus, authRole }: ResourceExplorerProps) {
  const isAdmin = authRole === "admin";

  // 팝업 위치/크기
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 900, height: 620 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // 탐색 상태
  const [currentPath, setCurrentPath] = useState<{ path: string; displayName: string }[]>([]);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderRecords, setFolderRecords] = useState<FolderRecord[]>([]);
  const [fileRecords, setFileRecords] = useState<FileRecord[]>([]);

  // 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DisplayItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  // 뷰 모드 + 정렬
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // 선택 / 미리보기 / 삭제
  const [selectedFile, setSelectedFile] = useState<DisplayItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DisplayItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [folderDownloading, setFolderDownloading] = useState<string | null>(null);
  const [allDownloading, setAllDownloading] = useState(false);

  // 초기 위치 설정
  useEffect(() => {
    if (!initialized) {
      const w = Math.min(900, window.innerWidth - 40);
      const h = Math.min(620, window.innerHeight - 100);
      setSize({ width: w, height: h });
      setPos({ x: Math.max(20, (window.innerWidth - w) / 2), y: Math.max(20, (window.innerHeight - h) / 2) });
      setInitialized(true);
    }
  }, [initialized]);

  // 드래그 이동
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

  const getCurrentStoragePrefix = useCallback(() => {
    if (currentPath.length === 0) return "";
    return currentPath.map(p => p.path).join("/") + "/";
  }, [currentPath]);

  const getCurrentParentPath = useCallback(() => {
    if (currentPath.length === 0) return "";
    return currentPath.map(p => p.path).join("/");
  }, [currentPath]);

  // 정렬
  const sortItems = useCallback((list: DisplayItem[]): DisplayItem[] => {
    return [...list].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      let cmp = 0;
      if (sortKey === "name") cmp = a.displayName.localeCompare(b.displayName, "ko", { numeric: true, sensitivity: "base" });
      else if (sortKey === "size") cmp = (a.size || 0) - (b.size || 0);
      else if (sortKey === "type") cmp = getFileType(a).localeCompare(getFileType(b), "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // DB 레코드 로드
  const loadRecords = useCallback(async () => {
    const [{ data: folders }, { data: files }] = await Promise.all([
      supabase.from("resource_folders").select("*").order("display_name", { ascending: true }),
      supabase.from("resource_files").select("*").order("display_name", { ascending: true }),
    ]);
    setFolderRecords((folders as FolderRecord[]) || []);
    setFileRecords((files as FileRecord[]) || []);
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 현재 폴더 아이템 로드
  const loadItems = useCallback(async () => {
    setLoading(true);
    const parentPath = getCurrentParentPath();

    const subFolders = folderRecords.filter(f => f.parent_path === parentPath);
    const folderItems: DisplayItem[] = subFolders.map(f => ({
      storageName: f.path.split("/").pop() || f.path,
      displayName: f.display_name,
      isFolder: true,
    }));

    const currentFiles = fileRecords.filter(f => f.folder_path === parentPath);
    const fileItems: DisplayItem[] = currentFiles.map(f => ({
      storageName: f.storage_path.split("/").pop() || f.storage_path,
      displayName: f.display_name,
      isFolder: false,
      size: f.size_bytes,
      mimetype: f.mime_type,
    }));

    setItems([...folderItems, ...fileItems]);
    setSelectedItems(new Set());
    setLoading(false);
  }, [getCurrentParentPath, folderRecords, fileRecords]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    setSelectedItems(new Set());
    setSelectMode(false);
  }, [currentPath]);

  // 검색
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const q = query.trim().toLowerCase();

    const matchedFolders: DisplayItem[] = folderRecords
      .filter(f => f.display_name.toLowerCase().includes(q))
      .map(f => ({
        storageName: f.path.split("/").pop() || f.path,
        displayName: f.display_name,
        isFolder: true,
        folderPath: f.parent_path || "홈",
      }));

    const matchedFiles: DisplayItem[] = fileRecords
      .filter(f => f.display_name.toLowerCase().includes(q))
      .map(f => {
        const folderRecord = folderRecords.find(fr => fr.path === f.folder_path);
        const folderDisplayName = folderRecord ? folderRecord.display_name : (f.folder_path ? f.folder_path : "홈");
        return {
          storageName: f.storage_path.split("/").pop() || f.storage_path,
          displayName: f.display_name,
          isFolder: false,
          size: f.size_bytes,
          mimetype: f.mime_type,
          folderPath: folderDisplayName,
          _storagePath: f.storage_path,
        } as DisplayItem & { _storagePath: string };
      });

    setSearchResults([...matchedFolders, ...matchedFiles]);
    setSearching(false);
  }, [folderRecords, fileRecords]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // 폴더 생성
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const timestamp = Date.now();
    const safePath = `folder_${timestamp}`;
    const parentPath = getCurrentParentPath();
    const fullPath = parentPath ? `${parentPath}/${safePath}` : safePath;
    const keepPath = `${fullPath}/.keep`;

    const { error: uploadError } = await supabase.storage
      .from("resources")
      .upload(keepPath, new Blob([""], { type: "text/plain" }), { upsert: true });

    if (uploadError) { alert("폴더 생성 실패: " + uploadError.message); return; }

    const { error: dbError } = await supabase.from("resource_folders").insert({
      path: fullPath,
      display_name: newFolderName.trim(),
      parent_path: parentPath,
    });

    if (dbError) { alert("폴더 DB 저장 실패: " + dbError.message); return; }

    setNewFolderName("");
    setShowNewFolder(false);
    await loadRecords();
  };

  // 파일 업로드
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const prefix = getCurrentStoragePrefix();
    const parentPath = getCurrentParentPath();

    for (const file of Array.from(files)) {
      const timestamp = Date.now() + Math.floor(Math.random() * 1000);
      const ext = file.name.includes(".") ? "." + file.name.split(".").pop()!.toLowerCase() : "";
      const safeName = `file_${timestamp}${ext}`;
      const filePath = prefix + safeName;

      const { error } = await supabase.storage.from("resources").upload(filePath, file, { upsert: true });
      if (error) { console.error("upload error:", error.message); continue; }

      await supabase.from("resource_files").insert({
        storage_path: filePath,
        display_name: file.name,
        folder_path: parentPath,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadRecords();
  };

  // 단일 삭제
  const handleDelete = async (item: DisplayItem) => {
    const prefix = getCurrentStoragePrefix();
    const parentPath = getCurrentParentPath();

    if (item.isFolder) {
      const fullPath = parentPath ? `${parentPath}/${item.storageName}` : item.storageName;
      const { data: innerFiles } = await supabase.storage.from("resources").list(fullPath, { limit: 200 });
      if (innerFiles && innerFiles.length > 0) {
        await supabase.storage.from("resources").remove(innerFiles.map(f => `${fullPath}/${f.name}`));
      }
      await supabase.storage.from("resources").remove([`${fullPath}/.keep`]);
      await supabase.from("resource_folders").delete().eq("path", fullPath);
      await supabase.from("resource_files").delete().like("folder_path", `${fullPath}%`);
    } else {
      const filePath = prefix + item.storageName;
      await supabase.storage.from("resources").remove([filePath]);
      await supabase.from("resource_files").delete().eq("storage_path", filePath);
    }

    setDeleteConfirm(null);
    await loadRecords();
  };

  // 다중 삭제
  const handleBulkDelete = async () => {
    const prefix = getCurrentStoragePrefix();
    const parentPath = getCurrentParentPath();
    const toDelete = (searchResults || items).filter(item => selectedItems.has(item.storageName));

    for (const item of toDelete) {
      if (item.isFolder) {
        const fullPath = parentPath ? `${parentPath}/${item.storageName}` : item.storageName;
        const { data: innerFiles } = await supabase.storage.from("resources").list(fullPath, { limit: 200 });
        if (innerFiles && innerFiles.length > 0) {
          await supabase.storage.from("resources").remove(innerFiles.map(f => `${fullPath}/${f.name}`));
        }
        await supabase.storage.from("resources").remove([`${fullPath}/.keep`]);
        await supabase.from("resource_folders").delete().eq("path", fullPath);
        await supabase.from("resource_files").delete().like("folder_path", `${fullPath}%`);
      } else {
        const filePath = prefix + item.storageName;
        await supabase.storage.from("resources").remove([filePath]);
        await supabase.from("resource_files").delete().eq("storage_path", filePath);
      }
    }

    setBulkDeleteConfirm(false);
    setSelectMode(false);
    await loadRecords();
  };

  // 다중 다운로드 (선택된 파일들)
  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    const prefix = getCurrentStoragePrefix();
    const displayItems = searchResults || items;
    const toDownload = displayItems.filter(item => selectedItems.has(item.storageName) && !item.isFolder);
    for (const item of toDownload) {
      const fileRec = fileRecords.find(f => f.display_name === item.displayName && f.storage_path.endsWith(item.storageName));
      const filePath = fileRec ? fileRec.storage_path : prefix + item.storageName;
      const { data } = await supabase.storage.from("resources").createSignedUrl(filePath, 60);
      if (data?.signedUrl) {
        await downloadBlob(data.signedUrl, item.displayName);
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setBulkDownloading(false);
  };

  // 현재 폴더 전체 파일 다운로드 (리스트 헤더 버튼)
  const handleAllDownload = async () => {
    setAllDownloading(true);
    const prefix = getCurrentStoragePrefix();
    const parentPath = getCurrentParentPath();
    // 현재 폴더의 파일만 (하위 폴더 제외)
    const filesToDownload = fileRecords.filter(f => f.folder_path === parentPath);
    if (filesToDownload.length === 0) {
      alert("다운로드할 파일이 없습니다.");
      setAllDownloading(false);
      return;
    }
    for (const file of filesToDownload) {
      const { data } = await supabase.storage.from("resources").createSignedUrl(file.storage_path, 60);
      if (data?.signedUrl) {
        await downloadBlob(data.signedUrl, file.display_name);
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setAllDownloading(false);
  };

  // 폴더 전체 다운로드 (폴더 버튼)
  const handleFolderDownload = async (item: DisplayItem) => {
    const parentPath = getCurrentParentPath();
    const fullPath = parentPath ? `${parentPath}/${item.storageName}` : item.storageName;
    setFolderDownloading(item.storageName);

    const allFiles = fileRecords.filter(f =>
      f.folder_path === fullPath || f.folder_path.startsWith(fullPath + "/")
    );

    if (allFiles.length === 0) {
      alert("폴더에 다운로드할 파일이 없습니다.");
      setFolderDownloading(null);
      return;
    }

    for (const file of allFiles) {
      const { data } = await supabase.storage.from("resources").createSignedUrl(file.storage_path, 60);
      if (data?.signedUrl) {
        await downloadBlob(data.signedUrl, file.display_name);
        await new Promise(r => setTimeout(r, 400));
      }
    }

    setFolderDownloading(null);
  };

  // 파일 Blob 다운로드 헬퍼 (새 탭 열림 방지)
  const downloadBlob = async (signedUrl: string, fileName: string) => {
    try {
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // fetch 실패 시 fallback
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = fileName;
      a.target = "_blank";
      a.click();
    }
  };

  // 단일 다운로드
  const handleDownload = async (item: DisplayItem) => {
    const prefix = getCurrentStoragePrefix();
    const fileRec = fileRecords.find(f => f.display_name === item.displayName && f.storage_path.endsWith(item.storageName));
    const filePath = fileRec ? fileRec.storage_path : prefix + item.storageName;
    const { data } = await supabase.storage.from("resources").createSignedUrl(filePath, 60);
    if (!data?.signedUrl) { alert("다운로드 링크 생성 실패"); return; }
    await downloadBlob(data.signedUrl, item.displayName);
  };

  // 미리보기 / 폴더 이동
  const handlePreview = async (item: DisplayItem) => {
    if (selectMode) { toggleSelect(item.storageName); return; }
    if (item.isFolder) {
      if (searchResults) {
        const folderRec = folderRecords.find(f => f.display_name === item.displayName);
        if (folderRec) {
          const pathParts = folderRec.path.split("/");
          const newPath: { path: string; displayName: string }[] = [];
          let accumulated = "";
          for (const part of pathParts) {
            accumulated = accumulated ? `${accumulated}/${part}` : part;
            const rec = folderRecords.find(f => f.path === accumulated);
            newPath.push({ path: part, displayName: rec ? rec.display_name : part });
          }
          setCurrentPath(newPath);
          clearSearch();
          return;
        }
      }
      setCurrentPath([...currentPath, { path: item.storageName, displayName: item.displayName }]);
      return;
    }
    const prefix = getCurrentStoragePrefix();
    const fileRec = fileRecords.find(f => f.display_name === item.displayName && f.storage_path.endsWith(item.storageName));
    const filePath = fileRec ? fileRec.storage_path : prefix + item.storageName;
    const mime = item.mimetype || "";
    const isImage = mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item.displayName);
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(item.displayName);
    if (isImage || isPdf) {
      const { data } = await supabase.storage.from("resources").createSignedUrl(filePath, 300);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setSelectedFile(item);
        setPreviewOpen(true);
        return;
      }
    }
    handleDownload(item);
  };

  const toggleSelect = (name: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    const displayItems = searchResults || items;
    if (selectedItems.size === displayItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(displayItems.map(i => i.storageName)));
  };

  const getFileIcon = (item: DisplayItem, large = false) => {
    const name = item.displayName.toLowerCase();
    const mime = item.mimetype || "";
    const cls = large ? "w-10 h-10" : "w-8 h-8";
    if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return <ImageIcon className={`${cls} text-blue-400`} />;
    if (/\.pdf$/.test(name)) return <FileText className={`${cls} text-red-400`} />;
    if (/\.(xlsx|xls|csv)$/.test(name)) return <FileText className={`${cls} text-green-500`} />;
    if (/\.(pptx|ppt)$/.test(name)) return <FileText className={`${cls} text-orange-400`} />;
    if (/\.(docx|doc)$/.test(name)) return <FileText className={`${cls} text-blue-500`} />;
    return <File className={`${cls} text-gray-400`} />;
  };

  const getFileType = (item: DisplayItem) => {
    const name = item.displayName.toLowerCase();
    const mime = item.mimetype || "";
    if (mime.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "이미지";
    if (/\.pdf$/.test(name)) return "PDF";
    if (/\.(xlsx|xls)$/.test(name)) return "엑셀";
    if (/\.csv$/.test(name)) return "CSV";
    if (/\.(pptx|ppt)$/.test(name)) return "PPT";
    if (/\.(docx|doc)$/.test(name)) return "Word";
    if (item.isFolder) return "폴더";
    return "파일";
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  const getFolderFileCount = (item: DisplayItem) => {
    const parentPath = getCurrentParentPath();
    const fullPath = parentPath ? `${parentPath}/${item.storageName}` : item.storageName;
    return fileRecords.filter(f => f.folder_path === fullPath || f.folder_path.startsWith(fullPath + "/")).length;
  };

  const rootFolders = folderRecords.filter(f => f.parent_path === "");
  const rawDisplayItems = searchResults !== null ? searchResults : items;
  const displayItems = sortItems(rawDisplayItems);
  const selectedFileCount = displayItems.filter(i => selectedItems.has(i.storageName) && !i.isFolder).length;
  const selectedCount = selectedItems.size;
  const currentFolderFileCount = fileRecords.filter(f => f.folder_path === getCurrentParentPath()).length;

  const SortButton = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-0.5 text-xs font-semibold cursor-default hover:text-blue-600 transition ${sortKey === k ? "text-blue-600" : "text-gray-500"}`}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-blue-500" : "text-gray-300"}`} />
      {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

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
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white cursor-move select-none shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-gray-800 text-base">구독자 전용 자료실</span>
          </div>
          <div className="flex items-center gap-2 no-drag">
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedItems(new Set()); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-default ${selectMode ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{selectMode ? "선택 취소" : "선택"}</span>
            </button>
            {isAdmin && (
              <>
                <button onClick={() => setShowNewFolder(!showNewFolder)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition cursor-pointer">
                  <FolderPlus className="w-4 h-4" /><span className="hidden sm:inline">폴더 추가</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="hidden sm:inline">{uploading ? "업로드 중..." : "파일 업로드"}</span>
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              </>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── 검색창 ── */}
        <div className="px-5 py-2.5 border-b border-gray-100 bg-white shrink-0 no-drag">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="파일명 또는 폴더명 검색..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-default">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── 선택 모드 액션 바 ── */}
        {selectMode && (
          <div className="flex items-center gap-2 px-5 py-2 bg-blue-50 border-b border-blue-100 no-drag shrink-0">
            <button onClick={selectAll} className="text-xs text-blue-600 font-semibold hover:underline cursor-default">
              {selectedItems.size === displayItems.length ? "전체 해제" : "전체 선택"}
            </button>
            <span className="text-xs text-gray-500">{selectedCount}개 선택됨</span>
            <div className="ml-auto flex items-center gap-2">
              {selectedFileCount > 0 && (
                <button onClick={handleBulkDownload} disabled={bulkDownloading} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition cursor-pointer disabled:opacity-50">
                  {bulkDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {selectedFileCount}개 다운로드
                </button>
                
              )}
              {isAdmin && selectedCount > 0 && (
                <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition cursor-default">
                  <Trash2 className="w-3 h-3" />{selectedCount}개 삭제
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 폴더 이름 입력 ── */}
        {showNewFolder && (
          <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 border-b border-blue-100 no-drag shrink-0">
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="폴더 이름 입력 (한글 가능)" className="flex-1 px-3 py-2 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" autoFocus />
            <button onClick={createFolder} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition cursor-default">만들기</button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition cursor-default">취소</button>
          </div>
        )}

        {/* ── 경로 표시 + 뷰 전환 ── */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 bg-gray-50 shrink-0 no-drag">
          <div className="flex items-center gap-1 text-sm overflow-x-auto">
            {searchResults !== null ? (
              <span className="text-gray-500 text-xs">
                검색 결과: <span className="font-semibold text-blue-600">"{searchQuery}"</span> ({searchResults.length}건)
              </span>
            ) : (
              <>
                <button onClick={() => setCurrentPath([])} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-semibold cursor-default shrink-0">
                  <Home className="w-3.5 h-3.5" /><span>홈</span>
                </button>
                {currentPath.map((segment, idx) => (
                  <div key={idx} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <button onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))} className="text-blue-500 hover:text-blue-700 font-semibold cursor-default">{segment.displayName}</button>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <button onClick={() => setViewMode("grid")} className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-default ${viewMode === "grid" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`} title="그리드 보기">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-default ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`} title="리스트 보기">
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 본문 ── */}
        <div className="flex flex-1 overflow-hidden no-drag">
          {/* 사이드바 */}
          <div className="hidden md:flex flex-col w-48 border-r border-gray-100 bg-gray-50 overflow-y-auto py-3 px-2 shrink-0">
            <button onClick={() => { setCurrentPath([]); clearSearch(); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-default mb-1 ${currentPath.length === 0 && !searchResults ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              <Home className="w-4 h-4" />전체 자료
            </button>
            {rootFolders.map((folder) => (
              <button key={folder.id} onClick={() => { setCurrentPath([{ path: folder.path, displayName: folder.display_name }]); clearSearch(); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition cursor-default ${currentPath[0]?.path === folder.path && !searchResults ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
                {currentPath[0]?.path === folder.path && !searchResults ? <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" /> : <Folder className="w-4 h-4 text-yellow-500 shrink-0" />}
                <span className="truncate">{folder.display_name}</span>
              </button>
            ))}
          </div>

          {/* 파일 목록 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                {searchResults !== null ? (
                  <><Search className="w-12 h-12 mb-2 opacity-40" /><p className="text-sm">검색 결과가 없습니다.</p></>
                ) : (
                  <><FolderOpen className="w-12 h-12 mb-2 opacity-40" /><p className="text-sm">{isAdmin ? "파일을 업로드하거나 폴더를 만들어 보세요." : "아직 자료가 없습니다."}</p></>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* ── 그리드 보기 ── */
              <div className="p-4">
                {/* 정렬 옵션 */}
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="text-xs text-gray-400">정렬:</span>
                  <SortButton label="이름" k="name" />
                  <SortButton label="크기" k="size" />
                  <SortButton label="종류" k="type" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {displayItems.map((item) => {
                    const isSelected = selectedItems.has(item.storageName);
                    const isFolderDownloading = folderDownloading === item.storageName;
                    return (
                      <div
                        key={item.storageName}
                        className={`relative group flex flex-col items-center gap-2 p-3 rounded-2xl border transition cursor-default select-none ${
                          isSelected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-300" : "border-gray-100 bg-white hover:bg-blue-50 hover:border-blue-200"
                        }`}
                        onClick={() => handlePreview(item)}
                      >
                        {(selectMode || isSelected) && (
                          <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        )}
                        <div className="w-14 h-14 flex items-center justify-center">
                          {item.isFolder
                            ? (isFolderDownloading ? <Loader2 className="w-12 h-12 text-blue-400 animate-spin" /> : <FolderOpen className="w-12 h-12 text-yellow-400" />)
                            : getFileIcon(item, true)}
                        </div>
                        <span className="text-xs text-center text-gray-700 font-medium leading-tight line-clamp-2 w-full break-all">{item.displayName}</span>
                        {!item.isFolder && item.size && <span className="text-[10px] text-gray-400">{formatSize(item.size)}</span>}
                        {item.isFolder && <span className="text-[10px] text-gray-400">{getFolderFileCount(item)}개 파일</span>}
                        {searchResults !== null && item.folderPath && (
                          <span className="text-[10px] text-blue-400 truncate w-full text-center">{item.folderPath}</span>
                        )}
                        {/* 폴더 전체 다운로드 버튼 */}
                        {item.isFolder && !selectMode && (
                          <button onClick={(e) => { e.stopPropagation(); handleFolderDownload(item); }} disabled={isFolderDownloading} className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-400 hover:text-blue-600 items-center justify-center transition hidden group-hover:flex cursor-pointer disabled:opacity-50" title="폴더 전체 다운로드">
                            <ArrowDownToLine className="w-3 h-3" />
                          </button>
                        )}
                        {isAdmin && !selectMode && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 items-center justify-center transition hidden group-hover:flex cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {!item.isFolder && !selectMode && (
                          <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-400 hover:text-blue-600 items-center justify-center transition hidden group-hover:flex cursor-pointer">
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── 리스트 보기 ── */
              <div className="bg-white">
                {/* 헤더 행 */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 select-none">
                  <span className="w-8"></span>
                  <div className="pl-2"><SortButton label="이름" k="name" /></div>
                  <div className="w-20 text-right hidden sm:block"><SortButton label="종류" k="type" /></div>
                  <div className="w-20 text-right hidden sm:block"><SortButton label="크기" k="size" /></div>
                  {/* 작업 헤더: 전체 다운로드 + 선택 다운로드 버튼 */}
                  <div className="w-auto flex items-center justify-end gap-1.5 no-drag">
                    {/* 선택 다운로드 (선택 모드 + 파일 선택됐을 때) */}
                    {selectMode && selectedFileCount > 0 && (
                      <button
                        onClick={handleBulkDownload}
                        disabled={bulkDownloading}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition cursor-pointer disabled:opacity-50"
                        title="선택 파일 다운로드"
                      >
                        {bulkDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        <span className="hidden sm:inline">{selectedFileCount}개</span>
                      </button>
                    )}
                    {/* 전체 다운로드 */}
                    {!selectMode && currentFolderFileCount > 0 && searchResults === null && (
                      <button
                        onClick={handleAllDownload}
                        disabled={allDownloading}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="현재 폴더 전체 다운로드"
                      >
                        {allDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                        <span className="hidden sm:inline">전체</span>
                      </button>
                    )}
                    <span className="text-xs font-semibold text-gray-500">작업</span>
                  </div>
                </div>
                {displayItems.map((item, idx) => {
                  const isSelected = selectedItems.has(item.storageName);
                  const isFolderDownloading = folderDownloading === item.storageName;
                  return (
                    <div
                      key={item.storageName}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 transition cursor-default select-none border-b border-gray-50 last:border-0 ${
                        isSelected ? "bg-blue-50" : idx % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50/50 hover:bg-blue-50"
                      }`}
                      onClick={() => handlePreview(item)}
                    >
                      {/* 아이콘 / 체크박스 */}
                      <div className="w-8 flex items-center justify-center">
                        {selectMode ? (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        ) : (
                          item.isFolder
                            ? (isFolderDownloading ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <Folder className="w-5 h-5 text-yellow-400" />)
                            : getFileIcon(item)
                        )}
                      </div>
                      {/* 파일명 */}
                      <div className="min-w-0 pl-2">
                        <span className="text-sm text-gray-700 font-medium truncate block">{item.displayName}</span>
                        {item.isFolder && <span className="text-[11px] text-gray-400">{getFolderFileCount(item)}개 파일</span>}
                        {searchResults !== null && item.folderPath && (
                          <span className="text-[11px] text-blue-400">{item.folderPath}</span>
                        )}
                      </div>
                      {/* 종류 */}
                      <span className="w-20 text-right text-xs text-gray-400 hidden sm:block">{getFileType(item)}</span>
                      {/* 크기 */}
                      <span className="w-20 text-right text-xs text-gray-400 hidden sm:block">{item.isFolder ? `${getFolderFileCount(item)}개` : formatSize(item.size)}</span>
                      {/* 작업 버튼 */}
                      <div className="w-auto flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {item.isFolder && (
                          <button onClick={() => handleFolderDownload(item)} disabled={isFolderDownloading} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 items-center justify-center transition hidden group-hover:flex cursor-pointer" title="폴더 전체 다운로드">
                            {isFolderDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {!item.isFolder && (
                          <button onClick={() => handleDownload(item)} className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-400 hover:text-blue-600 flex items-center justify-center transition cursor-pointer" title="다운로드">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setDeleteConfirm(item)} className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition cursor-pointer" title="삭제">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 리사이즈 핸들 */}
        <div className="hidden md:block absolute bottom-0 right-0 w-6 h-6 cursor-se-resize" onMouseDown={onMouseDownResize} style={{ zIndex: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-1 right-1 text-gray-300">
            <path d="M14 2L2 14M14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── 미리보기 팝업 ── */}
      {previewOpen && selectedFile && previewUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-800 truncate text-sm">{selectedFile.displayName}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedFile)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition cursor-pointer">
                  <Download className="w-4 h-4" />다운로드
                </button>
                <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center px-0 py-7 bg-gray-50">
              {(selectedFile.mimetype?.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(selectedFile.displayName)) ? (
                <img
                  src={previewUrl}
                  alt={selectedFile.displayName}
                  className="max-w-[90%] max-h-[80vh] rounded-2xl shadow object-contain"
                />
              ) : (
                <iframe src={previewUrl} className="w-full h-[70vh] rounded-2xl border-0" title={selectedFile.displayName} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 단일 삭제 확인 ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <p className="text-gray-800 font-bold text-center mb-2">{deleteConfirm.isFolder ? "폴더" : "파일"} 삭제</p>
            <p className="text-gray-500 text-sm text-center mb-6">
              <span className="font-semibold text-gray-700">"{deleteConfirm.displayName}"</span>을(를) 삭제하시겠습니까?
              {deleteConfirm.isFolder && <span className="block text-red-400 text-xs mt-1">폴더 안의 모든 파일이 삭제됩니다.</span>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition cursor-pointer">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition cursor-pointer">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 다중 삭제 확인 ── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <p className="text-gray-800 font-bold text-center mb-2">선택 항목 삭제</p>
            <p className="text-gray-500 text-sm text-center mb-6">
              선택한 <span className="font-semibold text-gray-700">{selectedCount}개</span> 항목을 삭제하시겠습니까?
              <span className="block text-red-400 text-xs mt-1">삭제된 파일은 복구할 수 없습니다.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition cursor-default">취소</button>
              <button onClick={handleBulkDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition cursor-pointer">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}