export type MemoItem = {
  id: string; title: string; content: string; pinned: boolean; visible: boolean;
  color?: "white" | "blue" | "yellow" | "red" | "clear";
  x?: number; y?: number; createdAt: string; updatedAt: string;
};
export type MemoDocument = {
  version: 1; text: string; html?: string; background: string; opacity: number;
  category: "work" | "personal"; sourceId?: string;
  stickerSize?: { width: number; height: number };
};
const PREFIX = "[insurance-insight:memo:v1]";
export const MEMO_BACKGROUNDS = { white: "#ffffff", blue: "#edf5ff", yellow: "#fffbe5", red: "#ffedf4", clear: "#ffffff" };
export function decodeMemo(memo: Pick<MemoItem, "content" | "color">): MemoDocument {
  if (memo.content.startsWith(PREFIX)) {
    try {
      const data = JSON.parse(memo.content.slice(PREFIX.length));
      if (data.version === 1 && typeof data.text === "string") return {
        version: 1, text: data.text, html: typeof data.html === "string" ? data.html : undefined,
        background: /^#[\da-f]{6}$/i.test(data.background) ? data.background : "#ffffff",
        opacity: typeof data.opacity === "number" ? Math.max(0, Math.min(1, data.opacity)) : 1,
        category: data.category === "personal" ? "personal" : "work", sourceId: data.sourceId,
        ...(Number.isFinite(data.stickerSize?.width) && Number.isFinite(data.stickerSize?.height) ? { stickerSize: { width: Math.max(200, Math.min(1600, data.stickerSize.width)), height: Math.max(140, Math.min(1200, data.stickerSize.height)) } } : {}),
      };
    } catch { /* Preserve malformed legacy content as plain text. */ }
  }
  return { version: 1, text: memo.content, background: MEMO_BACKGROUNDS[memo.color || "white"], opacity: memo.color === "clear" ? 0.4 : 1, category: "work" };
}
export const encodeMemo = (document: MemoDocument) => PREFIX + JSON.stringify(document);
export function memoBackground(document: MemoDocument) {
  const hex = document.background.slice(1);
  return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${document.opacity})`;
}
export function escapeMemoText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export const plainMemoHtml = (text: string) => text.split("\n").map(line => `<p>${escapeMemoText(line) || "<br>"}</p>`).join("");
