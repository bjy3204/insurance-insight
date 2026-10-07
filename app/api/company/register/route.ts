import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const attempts = new Map<string, { count: number; until: number }>();
export async function GET() {
  try {
    const source = await notion.dataSources.retrieve({ data_source_id: process.env.NOTION_COMPANY_DATABASE_ID! });
    return NextResponse.json(Object.fromEntries(Object.entries(source.properties).map(([name, property]) => [name, property.type])));
  } catch { return NextResponse.json({ error: "등록 양식을 확인하지 못했습니다." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  const upload = new URL(request.url).searchParams.get("action") === "upload";
  const key = `${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}:${upload}`;
  const entry = attempts.get(key);
  if (entry && entry.until > Date.now() && entry.count >= (upload ? 40 : 5)) return NextResponse.json({ error: "잠시 후 다시 신청해 주세요." }, { status: 429 });
  if (attempts.size > 1000) for (const [id, value] of attempts) if (value.until < Date.now()) attempts.delete(id);
  attempts.set(key, { count: entry && entry.until > Date.now() ? entry.count + 1 : 1, until: entry && entry.until > Date.now() ? entry.until : Date.now() + 600_000 });
  try {
    if (upload) {
      const file = (await request.formData()).get("file");
      if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) return NextResponse.json({ error: "JPG·PNG·WebP·GIF 이미지를 파일당 5MB 이하로 첨부해 주세요." }, { status: 400 });
      const created = await notion.fileUploads.create({ mode: "single_part", filename: file.name, content_type: file.type });
      const sent = await notion.fileUploads.send({ file_upload_id: created.id, file: { filename: file.name, data: file } });
      if (sent.status !== "uploaded") throw new Error("upload failed");
      return NextResponse.json({ id: sent.id });
    }
    const data = await request.json();
    const fields = ["이름", "연락처", "지역", "회사명", "조직명", "조직소개"];
    if (fields.some(name => typeof data[name] !== "string" || !data[name].trim() || data[name].length > (name === "조직소개" ? 10000 : 200))) return NextResponse.json({ error: "필수 항목을 확인해 주세요." }, { status: 400 });
    if (data.website && (typeof data.website !== "string" || data.website.length > 2000 || !/^https?:\/\//i.test(data.website))) return NextResponse.json({ error: "홈페이지 주소는 https:// 또는 http://로 시작해야 합니다." }, { status: 400 });
    if (!Array.isArray(data.images) || data.images.length > 20 || data.images.some((id: unknown) => typeof id !== "string" || !/^[\da-f-]{36}$/i.test(id))) return NextResponse.json({ error: "첨부 이미지를 확인해 주세요." }, { status: 400 });
    const source = await notion.dataSources.retrieve({ data_source_id: process.env.NOTION_COMPANY_DATABASE_ID! });
    const properties: Record<string, any> = { 승인: { checkbox: false } };
    const richText = (text: string) => (text.match(/[\s\S]{1,2000}/g) || []).map(content => ({ text: { content } }));
    for (const name of fields) {
      const type = source.properties[name]?.type;
      const value = data[name].trim();
      if (type === "title" || type === "rich_text") properties[name] = { [type]: richText(value) };
      else if (type === "phone_number" || type === "url") properties[name] = { [type]: value };
      else throw new Error("unsupported property");
    }
    const websiteName = ["홈페이지 URL", "홈페이지URL", "홈페이지"].find(name => source.properties[name]);
    if (websiteName && data.website) {
      const type = source.properties[websiteName].type;
      properties[websiteName] = type === "url" ? { url: data.website.trim() } : { rich_text: richText(data.website.trim()) };
    }
    if (data.images.length) properties["소개 이미지"] = { files: data.images.map((id: string, index: number) => ({ name: `소개 이미지 ${index + 1}`, type: "file_upload", file_upload: { id } })) };
    await notion.pages.create({ parent: { data_source_id: process.env.NOTION_COMPANY_DATABASE_ID! }, properties });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: upload ? "이미지를 업로드하지 못했습니다. 다시 시도해 주세요." : "신청을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 }); }
}
