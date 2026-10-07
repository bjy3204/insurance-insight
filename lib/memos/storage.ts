import type { SupabaseClient } from "@supabase/supabase-js";
import { decodeMemo, encodeMemo, type MemoItem } from "./model";

// A hidden import ledger prevents an intentionally deleted imported memo from reappearing.
const LEDGER_TITLE = "__insurance_insight_memo_imports_v1__";
export async function stableMemoId(owner: string, source: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`insurance-insight-memo:${owner}:${source}`)));
  bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function memoFromRow(row: any): MemoItem {
  return { id: row.id, title: row.title || "", content: row.content || "", pinned: !!row.pinned, visible: !!row.visible, color: row.color || "white", x: row.x, y: row.y, createdAt: row.created_at, updatedAt: row.updated_at || row.created_at };
}
export function memoToRow(memo: MemoItem, owner: string) {
  return { id: memo.id, user_id: owner, title: memo.title, content: memo.content, pinned: memo.pinned, visible: memo.visible, color: memo.color || "white", x: memo.x, y: memo.y, created_at: memo.createdAt, updated_at: memo.updatedAt };
}
export async function loadMemberMemos(client: SupabaseClient, owner: string): Promise<MemoItem[]> {
  const [outside, inside] = await Promise.all([
    client.from("user_memos").select("*").eq("user_id", owner).order("created_at", { ascending: false }),
    client.from("cm_private_memos").select("*").eq("user_id", owner).order("created_at", { ascending: false }),
  ]);
  if (outside.error || inside.error) throw outside.error || inside.error;
  const ledgerId = await stableMemoId(owner, "import-ledger");
  const ledger = (outside.data || []).find(row => row.id === ledgerId && row.title === LEDGER_TITLE);
  let imported: string[] = [];
  if (ledger) {
    const manifest = JSON.parse(ledger.content);
    if (!Array.isArray(manifest.imported) || manifest.imported.some((id: unknown) => typeof id !== "string")) throw new Error("메모 이관 기록을 확인하지 못했습니다.");
    imported = manifest.imported;
  }
  const records = (outside.data || []).filter(row => row.id !== ledgerId);
  const pending = (inside.data || []).filter(row => !imported.includes(row.id));
  const copies: MemoItem[] = [];
  for (const row of pending) {
    const id = await stableMemoId(owner, `cm_private_memos:${row.id}`);
    // A retry after a ledger failure never overwrites a copied/edited memo.
    if (records.some(record => record.id === id)) continue;
    const original = memoFromRow(row);
    copies.push({ ...original, id, visible: false, content: encodeMemo({ ...decodeMemo(original), sourceId: row.id }) });
  }
  if (copies.length) {
    const { error } = await client.from("user_memos").upsert(copies.map(memo => memoToRow(memo, owner)), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }
  if (pending.length) {
    const { error } = await client.from("user_memos").upsert({ id: ledgerId, user_id: owner, title: LEDGER_TITLE, content: JSON.stringify({ version: 1, imported: [...new Set([...imported, ...pending.map(row => row.id)])] }), visible: false, pinned: false, color: "white", updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
  }
  // The old cm_private_memos rows are retained as the original copy.
  return [...records.map(memoFromRow), ...copies];
}
export async function persistMemberMemos(client: SupabaseClient, owner: string, previous: MemoItem[], next: MemoItem[]) {
  const ids = new Set(next.map(memo => memo.id));
  const changed = next.filter(memo => JSON.stringify(previous.find(old => old.id === memo.id)) !== JSON.stringify(memo));
  if (changed.length) {
    const { error } = await client.from("user_memos").upsert(changed.map(memo => memoToRow(memo, owner)), { onConflict: "id" });
    if (error) throw error;
  }
  // Delete only rows this session actually loaded, never unseen rows from another device.
  const removed = previous.filter(memo => !ids.has(memo.id)).map(memo => memo.id);
  if (removed.length) {
    const { error } = await client.from("user_memos").delete().eq("user_id", owner).in("id", removed);
    if (error) throw error;
  }
}
