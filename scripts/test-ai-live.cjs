require("@next/env").loadEnvConfig(process.cwd());
const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");
const modules = {};
function load(file) {
  if (modules[file]) return modules[file];
  const exports = {};
  const context = { exports, Date, Intl, require(name) {
    if (name === "./types") return load("lib/ai-messages/types.ts");
    if (name === "./prepared") return load("lib/ai-messages/prepared.ts");
    throw new Error("Unexpected module");
  }};
  vm.createContext(context);
  vm.runInContext(ts.transpile(fs.readFileSync(file, "utf8"), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), context);
  return modules[file] = exports;
}
async function main() {
  const { MESSAGE_INSTRUCTIONS, buildMessageInput } = load("lib/ai-messages/prompt.ts");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
  const payload = {
    systemInstruction: { parts: [{ text: MESSAGE_INSTRUCTIONS }] },
    contents: [{ role: "user", parts: [{ text: buildMessageInput({ messageType: "daily_check" }) }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
      responseFormat: { text: {
        mimeType: "APPLICATION_JSON",
        schema: { type: "object", properties: { paragraphs: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 } }, required: ["paragraphs"], additionalProperties: false },
      }},
    },
  };
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY.trim() },
    signal: AbortSignal.timeout(22000),
    body: JSON.stringify(payload),
  });
  console.log("Gemini HTTP status: " + response.status);
  const data = await response.json();
  if (!response.ok) {
    console.log("Provider error status: " + (data.error?.status || "unknown"));
    // Only known diagnostics are printed; never provider URLs, keys or account data.
    const message = data.error?.message || "";
    for (const diagnostic of ["not found", "Unknown name", "API key not valid", "quota", "not supported"]) {
      if (message.toLowerCase().includes(diagnostic.toLowerCase())) console.log("Diagnostic: " + diagnostic);
    }
    process.exitCode = 1;
    return;
  }
  const candidate = data.candidates?.[0];
  console.log("Finish reason: " + candidate?.finishReason);
  const text = candidate?.content?.parts?.filter(part => !part.thought && part.text).map(part => part.text).join("");
  const parsed = JSON.parse(text || "");
  console.log("Generated paragraphs: " + JSON.stringify(parsed.paragraphs));
}
main().catch(error => { console.log("Probe failed: " + error.name); process.exitCode = 1; });
