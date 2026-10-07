import type { MessageType } from "./types";
import { PREPARED_MESSAGES } from "./prepared";

export function generateFallbackMessage(type: MessageType, customerName: string, agentName: string, _date: Date, extraInfo?: string): string {
  if (type === "childrens_day" || type === "parents_day") return "";
  const body = [...PREPARED_MESSAGES[type]];
  if (type === "car_renewal" && extraInfo && /^(?:\d{4}-)?\d{1,2}-\d{1,2}$/.test(extraInfo)) {
    const [month, day] = extraInfo.split("-").slice(-2);
    body[0] = "자동차보험 갱신일은 " + Number(month) + "월 " + Number(day) + "일입니다!";
  }
  const paragraphBreak = Math.ceil(body.length / 2);
  return [customerName.trim() ? customerName.trim() + " 고객님" : "고객님", body.slice(0, paragraphBreak).join("\n"), body.slice(paragraphBreak).join("\n"), agentName.trim()].filter(Boolean).join("\n\n");
}
