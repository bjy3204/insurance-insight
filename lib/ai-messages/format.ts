/** Keep the greeting and signature separate; read related sentences as paragraphs. */
export function formatMessageParagraphs(message: string, agentName: string): string {
  const lines = splitMessageLines(message);
  if (lines.length < 4) return message.trim();

  const greeting = lines.shift()!;
  const signature = agentName.trim() && lines.at(-1) === agentName.trim() ? lines.pop() : undefined;
  const seen = new Set<string>();
  let wishes = 0;
  const unique = lines.filter(line => {
    const key = line.replace(/[.!?。…]+$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    if (/중복.*보장|부족.*보장|보장.*부족|보험료.*부담|보험증권.*여러|증권.*보기.*정리/.test(line)) return false;
    if (/행복|웃음|좋은 일|평안/.test(line) && /바랍|바랄|보내|가득|함께|좋겠/.test(line)) {
      wishes++;
      if (wishes > 1) return false;
    }
    return true;
  });
  const maxBodyLines = 10 - 1 - (signature ? 1 : 0);
  lines.splice(0, lines.length, ...unique.slice(0, maxBodyLines));
  const paragraphs: string[] = [];
  const count = Math.max(1, Math.floor(lines.length / 3));
  const size = Math.floor(lines.length / count);
  const remainder = lines.length % count;
  let offset = 0;
  for (let i = 0; i < count; i++) {
    const length = size + (i < remainder ? 1 : 0);
    paragraphs.push(lines.slice(offset, offset + length).map(line => /[.!?。…]$/.test(line) ? line : `${line}.`).join("\n"));
    offset += length;
  }
  return formatDisplayMessage([greeting, ...paragraphs, signature].filter(Boolean).join("\n\n"));
}

export function splitMessageLines(message: string): string[] {
  return message.split(/\n+|(?<=[.!?])\s+(?=[가-힣A-Za-z])/).map(line => line.trim()).filter(Boolean);
}

export function formatDisplayMessage(message: string): string {
  return message.trim();
}

export function composeMessage(paragraphs: string[], customerName: string, agentName: string) {
  return formatDisplayMessage([customerName.trim() ? `${customerName.trim()} 고객님` : "고객님", ...paragraphs.map(p => splitMessageLines(p).join("\n")), agentName.trim()].filter(Boolean).join("\n\n"));
}
