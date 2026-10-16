"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import CustomerLookup from "./CustomerLookup";
import { withCustomerClaimDefaults, withContractDefaults, updateContractDraft, shortCustomerBirth } from "./customer-form-fields";
import CustomerEntryDialog, { type CustomerEntryKind, type CustomerEntryValues } from "./CustomerEntryDialog";
import styles from "./CustomerManagementTab.module.css";
import { supabase } from "@/lib/supabase";
import type { StoredCustomer, StoredContract } from "@/lib/customer-records";
import type { CustomerRecord } from "./customer-lookup-model";
import DashboardDialog from "@/app/features/home/components/dashboard/DashboardDialog";

function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default function CustomerManagementTab() {
  const [dialog, setDialog] = useState<CustomerEntryKind | null>(null);
  const [editing, setEditing] = useState<CustomerRecord | StoredContract | null>(null);
  const [deleting, setDeleting] = useState<CustomerRecord | null>(null), [deleteError, setDeleteError] = useState("");
  const [customerDraft, setCustomer] = useState<CustomerEntryValues>({});
  const customer = withCustomerClaimDefaults(customerDraft);
  const [deletingContract,setDeletingContract]=useState<StoredContract|null>(null);
  const [contractDraft, setContract] = useState<CustomerEntryValues>({});
  const contract = withContractDefaults(contractDraft, today());
  const [customers, setCustomers] = useState<StoredCustomer[]>([]);
  const [contracts, setContracts] = useState<StoredContract[]>([]);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(""), [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);
  const reorderingRef = useRef(false);
  const [reordering, setReordering] = useState(false), [reorderError, setReorderError] = useState("");
  const submissionId = useRef<string | null>(null);
  const close = useCallback(() => { if (!savingRef.current) { setDialog(null); setEditing(null); setSaveError(""); } }, []);
  const closeDelete = useCallback(() => { if (!savingRef.current) { setDeleting(null); setDeleteError(""); } }, []);
  const request = useCallback(async (body?: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("다시 로그인해 주세요.");
    const response = await fetch("/api/customers", { method: body ? "POST" : "GET", cache: "no-store", headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "요청을 처리하지 못했습니다.");
    return result;
  }, []);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const run = ++generation.current;
    setLoading(true); setError("");
    try { const result = await request(); if (run === generation.current) { setCustomers(result.customers); setContracts(result.contracts); } }
    catch (error) { if (run === generation.current) setError(error instanceof Error ? error.message : "고객정보를 불러오지 못했습니다."); }
    finally { if (run === generation.current) setLoading(false); }
  }, [request]);
  useEffect(() => {
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") { ++generation.current; setCustomers([]); setContracts([]); setCustomer({}); setContract({}); setDialog(null); setEditing(null); setDeleting(null); setDeletingContract(null); if (event === "SIGNED_IN") setTimeout(() => void load(), 0); }
    });
    const refresh=()=>{if(!savingRef.current)void load();};window.addEventListener("customer-schedules-updated",refresh);
    return () => { ++generation.current; subscription.unsubscribe();window.removeEventListener("customer-schedules-updated",refresh); };
  }, [load]);
  const save = async () => {
    if (!dialog || savingRef.current) return;
    setSaveError("");
    const owners = customers.filter(record => record.name === contract.owner && shortCustomerBirth(record.birth) === shortCustomerBirth(contract.ownerBirth || ""));
    if (dialog === "contract" && owners.length !== 1) { setSaveError("계약자와 생년월일이 일치하는 고객을 먼저 등록하거나 선택해 주세요."); return; }
    savingRef.current = true; setSaving(true);
    const run = generation.current;
    submissionId.current ??= crypto.randomUUID();
    try {
      const result = await request({ recordId: editing?.id || submissionId.current, ...(editing ? { action: "update", revision: Number(editing.revision) } : {}), kind: dialog, values: dialog === "customer" ? customer : contract, ...(dialog === "contract" ? { customerId: owners[0].id } : {}) });
      if (run !== generation.current) return;
      submissionId.current = null;
      if (dialog === "customer") { setCustomers(previous => editing ? previous.map(record => record.id === result.record.id ? result.record : record) : [...previous, result.record]); setCustomer({}); }
      else { setContracts(previous => editing?previous.map(record=>record.id===result.record.id?result.record:record):[...previous, result.record]); setContract({}); }
      setDialog(null); setEditing(null);
    } catch (error) { if (run === generation.current) setSaveError(error instanceof Error ? error.message : "저장하지 못했습니다."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const reorder = async (ids: string[]) => {
    if (reorderingRef.current || savingRef.current) return;
    reorderingRef.current = true; setReordering(true); setReorderError("");
    const previous = customers, run = generation.current;
    const positions = new Map(ids.map((id, index) => [id, String(index)]));
    setCustomers(rows => rows.map(row => ({ ...row, sortOrder: positions.get(row.id) ?? row.sortOrder })));
    try { await request({ action: "reorder", ids }); }
    catch (error) { if (run === generation.current) { setCustomers(previous); setReorderError(error instanceof Error ? error.message : "순서를 저장하지 못했습니다."); } }
    finally { reorderingRef.current = false; setReordering(false); }
  };
  const deleteCustomer = async () => {
    if (!deleting || savingRef.current) return;
    savingRef.current = true; setSaving(true); setDeleteError("");
    const run = generation.current;
    try {
      await request({ action: "delete", recordId: deleting.id, revision: Number(deleting.revision) });
      if (run !== generation.current) return;
      setCustomers(rows => rows.filter(row => row.id !== deleting.id));
      setContracts(rows => rows.filter(row => row.customerId !== deleting.id));
      setDeleting(null);
    } catch (error) { if (run === generation.current) setDeleteError(error instanceof Error ? error.message : "삭제하지 못했습니다."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const deleteContract=async()=>{
    if(!deletingContract||savingRef.current)return;
    savingRef.current=true;setSaving(true);setDeleteError("");const run=generation.current;
    try{await request({action:"delete",kind:"contract",recordId:deletingContract.id,revision:Number(deletingContract.revision)});if(run!==generation.current)return;setContracts(rows=>rows.filter(row=>row.id!==deletingContract.id));setDeletingContract(null);}
    catch(error){if(run===generation.current)setDeleteError(error instanceof Error?error.message:"삭제하지 못했습니다.");}
    finally{savingRef.current=false;setSaving(false);}
  };
  const saveCustomerSection = async (record: CustomerRecord, field: "disclosure" | "consultations" | "checklist", value: string) => {
    if(savingRef.current||reorderingRef.current)throw new Error("저장이 끝난 뒤 다시 시도해 주세요.");
    savingRef.current=true;setSaving(true);
    const run=generation.current;
    try {
      const result=await request({action:"update",kind:"customer",recordId:record.id,revision:Number(record.revision),values:withCustomerClaimDefaults({...record,[field]:value})});
      if(run!==generation.current)throw new Error("로그인 상태가 변경되었습니다.");
      setCustomers(previous=>previous.map(customer=>customer.id===record.id?result.record:customer));
    } finally {savingRef.current=false;setSaving(false);}
  };
  return <section className="min-h-[70vh] space-y-3">
    <div className={`${styles.header} flex flex-wrap items-center justify-end gap-3`}>
      <h2 className="mr-auto flex items-center gap-3 text-xl font-bold"><Users className="h-7 w-7 text-blue-500" />고객관리</h2>
      <div className={`${styles.actions} flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3`}>
        <button type="button" disabled={loading || !!error || reordering || saving} onClick={() => { submissionId.current = null; setEditing(null); setSaveError(""); setContract({}); setDialog("contract"); }} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold cursor-pointer sm:px-5 sm:text-sm">계약추가</button>
        <button type="button" disabled={loading || !!error || reordering || saving} onClick={() => { submissionId.current = null; setEditing(null); setCustomer({}); setSaveError(""); setDialog("customer"); }} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3 text-xs font-bold text-white cursor-pointer sm:px-5 sm:text-sm">고객추가</button>
      </div>
    </div>
    {error && <div role="alert" className="flex items-center gap-3 text-sm text-red-600">{error}<button type="button" onClick={() => void load()} className="underline cursor-pointer">다시 시도</button></div>}
    {reorderError && <p role="alert" className="text-sm text-red-600">{reorderError}</p>}
    <div aria-busy={loading}><CustomerLookup onEditContract={record=>{if(savingRef.current||reorderingRef.current)return;setEditing(record);setContract({...record});setSaveError("");setDialog("contract");}} onDeleteContract={record=>{if(savingRef.current||reorderingRef.current)return;setDeletingContract(record);setDeleteError("");}} customers={customers} contracts={contracts} onSaveChecklist={(record,value)=>saveCustomerSection(record,"checklist",value)} onSaveDisclosure={(record,value)=>saveCustomerSection(record,"disclosure",value)} onSaveConsultations={(record,value)=>saveCustomerSection(record,"consultations",value)} onDelete={record => { if (reorderingRef.current || savingRef.current) return; setDeleting(record); setDeleteError(""); }} onReorder={ids => void reorder(ids)} reorderDisabled={loading || saving || reordering} onEdit={record => { if (reorderingRef.current || savingRef.current) return; setEditing(record); setCustomer({ ...record }); setSaveError(""); setDialog("customer"); }} /></div>
    {dialog && <CustomerEntryDialog kind={dialog} editing={!!editing} customers={customers} values={dialog === "customer" ? customer : contract} saving={saving} error={saveError} onSubmit={save} onChange={(field, value) => { submissionId.current = null; setSaveError(""); if (dialog === "customer") setCustomer(previous => ({ ...previous, [field]: value })); else setContract(previous => updateContractDraft(previous, field, value)); }} onClose={close} />}
    {deletingContract&&<DashboardDialog confirmation title="계약을 삭제할까요?" onClose={()=>{if(!savingRef.current)setDeletingContract(null);}}><p>선택한 계약을 삭제하시겠습니까?</p>{deleteError&&<p role="alert" className="text-sm text-red-600">{deleteError}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={()=>setDeletingContract(null)} className="h-11 rounded-xl bg-gray-100 px-5 text-sm font-bold cursor-pointer">취소</button><button type="button" disabled={saving} onClick={()=>void deleteContract()} className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-white cursor-pointer">{saving?"삭제 중":"삭제"}</button></div></DashboardDialog>}
    {deleting && <DashboardDialog confirmation title="고객을 삭제할까요?" onClose={closeDelete}>
      <div><p className="text-sm text-gray-600">등록된 계약도 함께 삭제됩니다.</p>{deleteError && <p role="alert" className="mt-3 text-sm text-red-600">{deleteError}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={closeDelete} className="h-11 rounded-xl bg-gray-100 px-5 text-sm font-bold cursor-pointer">취소</button><button type="button" disabled={saving} onClick={() => void deleteCustomer()} className="h-11 rounded-xl bg-red-500 px-5 text-sm font-bold text-white cursor-pointer disabled:opacity-40">{saving ? "삭제 중" : "삭제"}</button></div>
      </div>
    </DashboardDialog>}
  </section>;
}
