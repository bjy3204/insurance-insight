import { BedDouble, CarFront, HeartPulse, PawPrint, Stethoscope } from "lucide-react";
import { getDefaultClaimText, type ClaimKind, type ClaimNoticeText } from "./claim-notices";

function Tooth({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4c-3-3-8-1-8 3 0 3 2 5 2 8 0 3 1 6 3 6 2 0 1-7 3-7s1 7 3 7c2 0 3-3 3-6 0-3 2-5 2-8 0-4-5-6-8-3Z" /><path d="M9 3c1 1 3 2 5 2" /></svg>;
}
const icons = { hospital: BedDouble, surgery: HeartPulse, outpatient: Stethoscope, "car-injury": CarFront, pet: PawPrint, dental: Tooth };
const palettes = {
  hospital: { background: "#f3f3f1", accent: "#777f72" },
  surgery: { background: "#e1effa", accent: "#6e91ae" },
  outpatient: { background: "#e5eee6", accent: "#6c8c73" },
  "car-injury": { background: "#eee7f4", accent: "#857192" },
  pet: { background: "#f4eadb", accent: "#a18a62" },
  dental: { background: "#f4e5e8", accent: "#aa7c86" },
};

export default function ClaimNoticePaper({ kind, customerName, content, signature, fontFamily, textColor, signatureColor, text }: {
  kind: ClaimKind; customerName: string; content: string; signature: string;
  fontFamily: string; textColor: string; signatureColor: string; text?: ClaimNoticeText;
}) {
  const copy = text ?? { ...getDefaultClaimText(kind), documents: content };
  const Icon = icons[kind];
  const lines = copy.documents.split("\n").map(line => line.trim()).filter(Boolean);
  // 항목 수와 글자 길이에 맞춰 서류명이 종이 안에 들어오도록 조절합니다.
  const compact = lines.length > 4 || lines.some(line => line.length > 45);
  const rowFont = compact ? 17 : 21;
  const palette = palettes[kind];
  const accentColor = textColor.toLowerCase() === "#4a4a4a" ? palette.accent : textColor;
  const title = copy.title.replace(/\s*\n\s*/g, " ");
  const titleFont = Math.min(35, 620 / Math.max(title.replace(/\s/g, "").length, 1));
  return (
    <div style={{ position: "absolute", inset: 0, background: palette.background, padding: 35, fontFamily, color: textColor }}>
      <div style={{ position: "absolute", inset: 35, background: "#ffffff", transform: "translate(3px, 3px) rotate(-0.35deg)", boxShadow: "0 2px 5px #00000012" }} />
      <article style={{ position: "relative", height: "100%", padding: "27px 36px", display: "flex", flexDirection: "column", background: "#ffffff", border: "1px solid #eeeeee", boxShadow: "1px 2px 5px #0000000b" }}>
        <header style={{ position: "relative", paddingBottom: 14, borderBottom: "1px solid #606760" }}>
          <p style={{ fontSize: 28, lineHeight: 1.4, margin: "0 0 10px", overflowWrap: "anywhere", paddingRight: 78 }}>{customerName.trim() ? `${customerName.trim()} 고객님` : "고객님"}</p>
          <h2 style={{ fontSize: titleFont, fontWeight: 700, lineHeight: 1.35, letterSpacing: -1.1, margin: 0, whiteSpace: "nowrap" }}>{title}</h2>
          <div style={{ position: "absolute", right: 0, top: -3, width: 58, height: 58, borderRadius: "50%", border: `1px solid ${palette.background}`, display: "flex", alignItems: "center", justifyContent: "center", color: palette.accent }}><Icon size={32} strokeWidth={1.5} /></div>
        </header>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: "10px 0 12px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{copy.introduction}</p>
        <div style={{ borderTop: "1px solid #deded8", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {lines.map((line, index) => {
            const numbered = line.match(/^(\d{1,3})[.)]?\s+(.*)$/);
            const documentText = numbered ? numbered[2] : line;
            return <div key={index} style={{ display: "flex", alignItems: "center", gap: 18, flex: 1, minHeight: 0, padding: "9px 0", borderBottom: "1px solid #deded8" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 24, color: accentColor, width: 30, flexShrink: 0 }}>{numbered ? numbered[1] : String(index + 1).padStart(2, "0")}</span>
              <div style={{ fontSize: Math.min(rowFont, 570 / Math.max(documentText.length, 1)), lineHeight: 1.45, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{documentText}</div>
            </div>;
          })}
        </div>
        <footer style={{ paddingTop: 23, flexShrink: 0 }}>
          <p style={{ fontSize: Math.min(15, 600 / Math.max(copy.additional.length, 1)), letterSpacing: -0.5, color: accentColor, whiteSpace: "nowrap", lineHeight: 1.65, margin: "0 0 5px" }}>{copy.additional}</p>
          <p style={{ fontSize: 17, letterSpacing: -0.5, lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{copy.closing}</p>
          <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", color: signatureColor, overflowWrap: "anywhere" }}>{signature}</div>
        </footer>
      </article>
    </div>
  );
}
