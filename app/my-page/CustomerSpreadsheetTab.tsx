"use client";
import {useState,useEffect,useRef} from 'react';
import {Trash2} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {chooseCustomerTemplate} from '@/lib/google/customer-sheet-picker';
export default function CustomerTab({ spreadsheetUrl, onSaveUrl, basePath="/my-page" }: { basePath?: "/my-page"|"/notion-crm"|"/personal-space"; spreadsheetUrl: string | null; onSaveUrl: (url: string) => Promise<void> }) {
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setCustomerMessage] = useState("");
  const setMessage = (value: string) => {
    setCustomerMessage(value);
    if (new URLSearchParams(window.location.search).get("tab") === "calendar") window.dispatchEvent(new CustomEvent("insurance-sheet-calendar-error", { detail: value }));
  };
  const [pickerPending, setPickerPending] = useState(false);
  const pickerStarted = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google_sheet");
    if (!status) return;
    if (status === "ready") {
      setMessage("");
      params.delete("google_sheet");
      window.history.replaceState(null, "", `${window.location.pathname}?${params}${window.location.hash}`);
      return;
    }
    if (status === "picker") {
      if (pickerStarted.current) return;
      pickerStarted.current = true;
      setPickerPending(true);
      params.delete("google_sheet");
      window.history.replaceState(null, "", `${window.location.pathname}?${params}${window.location.hash}`);
      void selectTemplate();
      return;
    }
    const messages: Record<string, string> = {
      cancelled: "구글 연결을 취소했습니다 다시 시도할 수 있습니다",
      expired: "연결 시간이 만료되었습니다 다시 시작해 주세요",
      template: "원본 시트를 복사할 권한이 없습니다 관리자의 원본 시트·앱 접근 설정 확인이 필요합니다",
      template_app_access: "구글에서 원본 시트에 대한 앱 접근 승인이 필요하다고 응답했습니다 최초 원본 시트 선택 단계가 필요합니다",
      template_not_found: "구글 앱에서 원본 시트에 접근하지 못했습니다 원본 공유 설정과 앱의 파일 접근 승인을 확인해야 합니다",
      storage_full: "구글 드라이브 용량이 부족해 사본을 만들지 못했습니다",
      drive_disabled: "구글 프로젝트에서 Google Drive API를 활성화해야 합니다",
      permission: "시트 생성 권한을 확인하지 못했습니다 구글 권한 동의 후 다시 시도해 주세요",
      copy_error: "시트를 복사하지 못했습니다 구글 드라이브 용량과 원본 접근 권한을 확인해 주세요",
      save_error: "시트 연결 정보를 저장하지 못했습니다 다시 시도해 주세요",
      error: "구글 연결에 실패했습니다 잠시 후 다시 시도해 주세요",
    };
    setMessage(messages[status] ?? messages.error);
    params.delete("google_sheet");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}${window.location.hash}`);
  }, []);

  async function selectTemplate() {
    setConnecting(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("보험인사이트에 먼저 로그인해 주세요");
      const headers = { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
      const configResponse = await fetch("/api/google/customer-sheet?action=picker", { headers, cache: "no-store" });
      const config = await configResponse.json();
      if (!configResponse.ok) {
        if (configResponse.status === 401) setPickerPending(false);
        throw new Error(config.error || "구글 선택창을 준비하지 못했습니다");
      }
      const fileId = await chooseCustomerTemplate(config);
      const response = await fetch("/api/google/customer-sheet", { method: "POST", headers, body: JSON.stringify({ action: fileId ? "picker-complete" : "picker-cancel", fileId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "시트 생성에 실패했습니다");
      if (!fileId) { setPickerPending(false); setMessage("시트 선택을 취소했습니다"); return; }
      window.location.assign(result.tab === "calendar" ? basePath+"?tab=calendar" : basePath+"?tab=customer");
    } catch (error) { setMessage(error instanceof Error ? error.message : "시트 생성에 실패했습니다"); }
    finally { setConnecting(false); }
  }

  const connectGoogle = async () => {
    if (pickerPending) { await selectTemplate(); return; }
    setConnecting(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("보험인사이트에 먼저 로그인해 주세요");
      const response = await fetch("/api/google/customer-sheet", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "구글 연결을 시작하지 못했습니다");
      if (result.existing) { window.location.assign(basePath+"?tab=customer"); return; }
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "구글 연결을 시작하지 못했습니다");
      setConnecting(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/edit?rm=minimal&embedded=true`;
  };

  const embedUrl = spreadsheetUrl ? getEmbedUrl(spreadsheetUrl ) : null;

  const removeSheet = async () => {
    setSaving(true);
    try {
      await onSaveUrl("");
      setRemoveConfirmOpen(false);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "시트를 화면에서 없애지 못했습니다 다시 시도해 주세요");
    } finally { setSaving(false); }
  };

  return (
    <div className="w-full">
      {!embedUrl && <div className="flex items-start justify-start">
          <button data-action-height="44" onClick={connectGoogle} disabled={connecting} className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {connecting ? "연결중" : "내 고객관리 시트 만들기"}
          </button>
      </div>}
      {message && <p role="status" className="mb-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
           {embedUrl && (
        <iframe
          title="내 고객관리 스프레드시트"
          src={embedUrl}
          className="personal-grid w-full rounded-2xl border border-gray-200 shadow"
          style={{ height: "85vh" }}
          frameBorder="0"
          allowFullScreen
        />
      )}
           
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {embedUrl && (
          <button data-action-height="44" type="button" onClick={() => { setMessage(""); setRemoveConfirmOpen(true); }}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-xl bg-red-50 px-4 text-xs font-bold text-red-500 transition hover:bg-red-100 cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />시트 없애기
          </button>
        )}
      </div>


      

      {removeConfirmOpen && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!saving) setRemoveConfirmOpen(false); }}
          onKeyDown={event => { if (event.key === "Escape" && !saving) { event.stopPropagation(); setRemoveConfirmOpen(false); } }}>
          <div data-confirm-dialog="true" data-popup-small="true" role="alertdialog" aria-modal="true" aria-labelledby="remove-customer-sheet-title"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <h3 id="remove-customer-sheet-title" className="font-bold text-gray-900">시트를 삭제할까요?</h3>
            <p>연결된 시트를 삭제하시겠습니까?</p>
            {message && <p role="alert" className="mt-3 text-sm text-red-500">{message}</p>}
            <div className="mt-5 flex gap-3">
              <button data-popup-action="true" data-action-height="44" type="button" autoFocus disabled={saving} onClick={() => setRemoveConfirmOpen(false)} className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50 cursor-pointer">취소</button>
              <button data-action-height="44" type="button" disabled={saving} onClick={removeSheet} className="h-11 flex-1 rounded-2xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer">{saving ? "삭제중" : "삭제"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
