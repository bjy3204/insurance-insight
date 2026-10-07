import { createClient } from "@supabase/supabase-js";
import { MESSAGE_TYPES, type MessageType } from "@/lib/ai-messages/types";
import { MESSAGE_INSTRUCTIONS, buildMessageInput } from "@/lib/ai-messages/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;
const recentRequests = new Map<string, number>();
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return reply({ error: "로그인 후 이용해 주세요." }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return reply({ error: "회원 확인을 잠시 이용할 수 없습니다." }, 503);
  try {
    const client = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return reply({ error: "다시 로그인해 주세요." }, 401);
    const { data: profile, error: profileError } = await client.from("profiles").select("status").eq("id", user.id).maybeSingle();
    if (profileError) return reply({ error: "회원 확인을 잠시 이용할 수 없습니다." }, 503);
    if (profile?.status !== "approved") return reply({ error: "승인회원만 이용할 수 있습니다." }, 403);

    const raw = await request.text();
    if (raw.length > 1000) return reply({ error: "요청 내용이 너무 깁니다." }, 400);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: "요청 내용을 확인해 주세요." }, 400); }
    if (!body || typeof body !== "object" || !MESSAGE_TYPES.some(type => type.id === body.messageType)) return reply({ error: "메시지 종류를 선택해 주세요." }, 400);
    const renewalDate = typeof body.renewalDate === "string" && /^(?:\d{4}-)?\d{1,2}-\d{1,2}$/.test(body.renewalDate) ? body.renewalDate : "";
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) return reply({ error: "AI 연결 전이라 기본 문구를 준비했어요.", code: "NOT_CONFIGURED" }, 503);
    const now = Date.now();
    for (const [id, time] of recentRequests) if (now - time > 60000) recentRequests.delete(id);
    if (now - (recentRequests.get(user.id) || 0) < 5000) return reply({ error: "잠시 후 다시 생성해 주세요." }, 429);
    recentRequests.set(user.id, now);
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
    if (!/^gemini-[a-z0-9.-]+$/.test(model)) return reply({ error: "AI 연결 설정을 확인해 주세요." }, 503);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(22000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: MESSAGE_INSTRUCTIONS }] },
        contents: [{ role: "user", parts: [{ text: buildMessageInput({ messageType: body.messageType as MessageType, renewalDate }) }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048, responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: { type: "object", properties: { paragraphs: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 } }, required: ["paragraphs"], additionalProperties: false } } } },
      }),
    });
    if (!response.ok) return reply({ error: response.status === 429 ? "AI 사용량이 많아 기본 문구를 준비했어요." : "AI 연결이 원활하지 않아 기본 문구를 준비했어요." }, 503);
    const result = await response.json();
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason !== "STOP") return reply({ error: "AI 문장을 완성하지 못해 기본 문구를 준비했어요." }, 503);
    const text = candidate.content?.parts?.filter((part: { text?: string; thought?: boolean }) => !part.thought && typeof part.text === "string").map((part: { text: string }) => part.text).join("");
    let parsed;
    try { parsed = JSON.parse(text || ""); } catch { return reply({ error: "AI 문장을 확인하지 못해 기본 문구를 준비했어요." }, 503); }
    if (!Array.isArray(parsed.paragraphs) || parsed.paragraphs.length < 2 || parsed.paragraphs.length > 3 || parsed.paragraphs.some((p: unknown) => typeof p !== "string" || !p.trim() || p.length > 600)) return reply({ error: "AI 문장 형식이 맞지 않아 기본 문구를 준비했어요." }, 503);
    const paragraphs = parsed.paragraphs.map((p: string) => p.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
    if (paragraphs.join("").length < 60 || paragraphs.join("").length > 800) return reply({ error: "AI 문장 길이가 맞지 않아 기본 문구를 준비했어요." }, 503);
    const lines = paragraphs.join("\n").split("\n").map((line: string) => line.trim()).filter(Boolean);
    const textBody = lines.join(" ");
    if ((textBody.match(/!/g) || []).length !== 1 || !lines[0]?.endsWith("!") || !lines.at(-1)?.endsWith("😊") || /안내|확인|절차|서류/.test(lines.at(-1) || "")) return reply({ error: "기본 문구를 준비했어요." }, 503);
    if ((textBody.match(/바랍니다/g) || []).length > 1 || /의료기관|검진기관|예방접종|(?:컨디션|안전|회복|몸 상태).{0,10}(?:먼저입니다|가장 중요합니다)|답장|회신|확인해 두겠습니다|준비해 (?:두|놓)겠습니다|주십시오|연락하겠습니다|함께\s*(?:살펴|확인).*드리겠습니다/.test(textBody)) return reply({ error: "기본 문구를 준비했어요." }, 503);
    if (/(?:정리|확인|준비).{0,12}(?:두었|뒀|놓았|놓겠|두겠)|(?:도와|도움).{0,8}드리겠습니다/.test(textBody)) return reply({ error: "기본 문구를 준비했어요." }, 503);
    if (["after_hospital", "after_discharge", "surgery", "after_accident"].includes(body.messageType) && lines.filter((line: string) => /보험|청구|서류|절차/.test(line)).length > 1) return reply({ error: "기본 문구를 준비했어요." }, 503);
    const endings = lines.map((line: string) => line.replace(/[!？?\s\p{Emoji_Presentation}\uFE0F]+$/gu, "").match(/(?:바랍니다|좋겠습니다|응원합니다|안내하겠습니다|안내해 드리겠습니다|연락드리겠습니다|감사드립니다|인사드립니다|전합니다)$/u)?.[0]).filter(Boolean);
    if (new Set(endings).size !== endings.length) return reply({ error: "기본 문구를 준비했어요." }, 503);
    const contactCategories = ["policy_check", "car_renewal", "after_hospital", "after_discharge", "surgery", "after_accident"];
    if (!contactCategories.includes(body.messageType) && /연락.{0,10}(?:주시|주셔|주시면|주세요)|안전을 확보/.test(textBody)) return reply({ error: "기본 문구를 준비했어요." }, 503);
    const greetingCategory = ["daily_check", "morning", "longtime", "birthday", "boknal", "newyear_holiday", "chuseok", "christmas", "yearend", "newyear", "spring", "summer", "autumn", "winter"].includes(body.messageType);
    if (greetingCategory && /보험|보장|증권|상담|갱신/.test(textBody)) return reply({ error: "기본 문구를 준비했어요." }, 503);
    const wishes = lines.filter((line: string) => /행복|웃음|기쁨|좋은 일|평안|건강|빛나/.test(line) && /바랍니다|기원|희망|응원/.test(line));
    if (lines.length < 4 || lines.length > 6 || new Set(lines).size !== lines.length || /어요|네요|주세요|할게요|하세요/.test(textBody) || wishes.length > 2 || /중복.*보장|부족.*보장|보험료.*부담/.test(textBody)) return reply({ error: "AI 문장을 다듬는 대신 기본 문구를 준비했어요." }, 503);
    if (["after_hospital", "after_discharge", "surgery", "after_accident"].includes(body.messageType) && !lines.some((line: string) => /청구/.test(line) && /연락/.test(line))) return reply({ error: "기본 문구를 준비했어요." }, 503);
    return reply({ paragraphs });
  } catch {
    return reply({ error: "AI 응답이 늦어 기본 문구를 준비했어요." }, 503);
  }
}
