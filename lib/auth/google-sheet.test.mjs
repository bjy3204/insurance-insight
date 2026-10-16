import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextRequest } = require("next/server");
const env = { ...process.env, GOOGLE_SHEETS_STATE_SECRET: "test-secret", GOOGLE_SHEETS_CLIENT_ID: "123-test-client", GOOGLE_SHEETS_CLIENT_SECRET: "test-client-secret", GOOGLE_PICKER_API_KEY: "test-picker-key", SUPABASE_SERVICE_ROLE_KEY: "test-service" };
function load(path, overrides = {}, fetch = globalThis.fetch) {
  const module = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => overrides[name] || require(name), process: { env }, Buffer, Date, URL, URLSearchParams, AbortSignal, fetch });
  return module.exports;
}
const cookies = load("./google-sheet-state.ts");
const membership = load("./membership.ts");

test("calendar connection authorizes the existing personal sheet and never copies a template", async () => {
  let persisted = null;
  const settings = { customer_url: "https://docs.google.com/spreadsheets/d/personal-sheet/edit" };
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: "member" } } }) },
    from: table => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "profiles" ? { nickname: "name", instagram_id: "instagram" } : settings }) }) }) }),
  };
  const route = load("../../app/api/google/customer-sheet/route.ts", {
    "@/lib/auth/google-sheet-state": cookies,
    "@/lib/auth/membership": membership,
    "@/lib/google/sheet-connection": { saveSheetConnection: async (...args) => { persisted = args; return true; }, spreadsheetIdFromUrl: value => /\/d\/([\w-]+)/.exec(value || "")?.[1] || null },
    "@supabase/supabase-js": { createClient: () => db },
  }, async url => {
    if (String(url).includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "access", refresh_token: "refresh", expires_in: 3600 });
    assert.match(String(url), /drive\/v3\/files\/personal-sheet\?fields=id/);
    return Response.json({ id: "personal-sheet" });
  });
  const post = (body, cookie = "") => route.POST(new NextRequest("https://example.test/api/google/customer-sheet", { method: "POST", headers: { origin: "https://example.test", authorization: "Bearer member-token", cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  const start = await post({ action: "calendar-connect" });
  const url = new URL((await start.json()).url);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("scope"), "https://www.googleapis.com/auth/drive.file");
  const callback = await route.GET(new NextRequest(`https://example.test/api/google/customer-sheet?code=test&state=${url.searchParams.get("state")}`, { headers: { cookie: `customer-sheet-state=${start.cookies.get("customer-sheet-state").value}` } }));
  assert.match(callback.headers.get("location"), /tab=calendar&google_sheet=picker/);
  const cookie = `customer-sheet-picker=${callback.cookies.get("customer-sheet-picker").value}`;
  assert.equal((await post({ action: "picker-complete", fileId: "wrong-sheet" }, cookie)).status, 400);
  const response = await post({ action: "picker-complete", fileId: "personal-sheet" }, cookie);
  assert.equal((await response.json()).tab, "calendar");
  assert.equal(persisted[0], "member");
  assert.equal(persisted[1], "personal-sheet");
  assert.equal(persisted[2].refreshToken, "refresh");
});
test("Google state rejects tampering and expiration", () => {
  const state = { userId: "member", state: "state", verifier: "pkce", expires: Date.now() + 60000 };
  const sealed = cookies.sealSheetState(state);
  assert.equal(cookies.readSheetState(sealed).userId, "member");
  assert.equal(cookies.readSheetState(`bad${sealed}`), null);
  assert.equal(cookies.readSheetState(cookies.sealSheetState({ ...state, expires: 1 })), null);
});

test("Picker fallback binds the temporary Google token to its member and only copies the fixed template", async () => {
  let permitted = false, saved = "", googleCalls = 0;
  const db = {
    auth: { getUser: async token => ({ data: { user: { id: token === "other-token" ? "other-member" : "member" } }, error: null }) },
    from: table => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "profiles" ? { nickname: "name", instagram_id: "instagram" } : { customer_url: saved }, error: null }) }) }),
      upsert: async value => { assert.equal(value.user_id, "member"); saved = value.customer_url; return { error: null }; },
    }),
  };
  const route = load("../../app/api/google/customer-sheet/route.ts", {
    "@/lib/auth/google-sheet-state": cookies,
    "@/lib/google/sheet-connection": { saveSheetConnection: async () => true, spreadsheetIdFromUrl: value => /\/d\/([\w-]+)/.exec(value || "")?.[1] || null },
    "@/lib/auth/membership": membership,
    "@supabase/supabase-js": { createClient: () => db },
  }, async url => {
    googleCalls++;
    if (String(url).includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "temporary-google-token" });
    if (String(url).includes("/copy?")) return permitted ? Response.json({ id: "private-copy" }) : Response.json({ error: { errors: [{ reason: "appNotAuthorizedToFile" }] } }, { status: 403 });
    return Response.json({ files: [] });
  });
  const post = (body = {}, cookie = "", token = "member-token") => route.POST(new NextRequest("https://example.test/api/google/customer-sheet", { method: "POST", headers: { origin: "https://example.test", authorization: `Bearer ${token}`, cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  const start = await post();
  const url = new URL((await start.json()).url);
  const callback = await route.GET(new NextRequest(`https://example.test/api/google/customer-sheet?code=test&state=${url.searchParams.get("state")}`, { headers: { cookie: `customer-sheet-state=${start.cookies.get("customer-sheet-state").value}` } }));
  assert.match(callback.headers.get("location"), /google_sheet=picker/);
  assert.equal(saved, "");
  const ticket = callback.cookies.get("customer-sheet-picker");
  assert.ok(ticket.httpOnly);
  const cookie = `customer-sheet-picker=${ticket.value}`;
  const config = token => route.GET(new NextRequest("https://example.test/api/google/customer-sheet?action=picker", { headers: { authorization: `Bearer ${token}`, cookie } }));
  assert.equal((await config("other-token")).status, 401);
  const response = await config("member-token");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.accessToken, "temporary-google-token");
  assert.equal(data.appId, "123");
  const calls = googleCalls;
  assert.equal((await post({ action: "picker-complete", fileId: "unrelated-private-file" }, cookie)).status, 400);
  assert.equal((await post({ action: "picker-complete", fileId: data.templateId }, cookie, "other-token")).status, 401);
  assert.equal(googleCalls, calls);
  permitted = true;
  const finished = await post({ action: "picker-complete", fileId: data.templateId }, cookie);
  assert.equal(finished.status, 200);
  assert.equal(finished.cookies.get("customer-sheet-picker").maxAge, 0);
  assert.equal(saved, "https://docs.google.com/spreadsheets/d/private-copy/edit");
});

test("copy recovers within an attempt but creates a fresh template copy after disconnect", async () => {
  let saved = "", copies = 0, existingFile = "", existingAttempt = "", saveFails = false, googleCalls = 0;
  const db = {
    auth: { getUser: async token => ({ data: { user: token === "member-token" ? { id: "member" } : null }, error: null }) },
    from: table => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "profiles" ? { nickname: "name", instagram_id: "instagram" } : { customer_url: saved }, error: null }) }) }),
      upsert: async value => { assert.equal(value.user_id, "member"); if (!saveFails) saved = value.customer_url; return { error: saveFails ? {} : null }; },
    }),
  };
  const route = load("../../app/api/google/customer-sheet/route.ts", {
    "@/lib/auth/google-sheet-state": cookies,
    "@/lib/google/sheet-connection": { saveSheetConnection: async () => true, spreadsheetIdFromUrl: value => /\/d\/([\w-]+)/.exec(value || "")?.[1] || null },
    "@/lib/auth/membership": membership,
    "@supabase/supabase-js": { createClient: () => db },
  }, async (url, options) => {
    googleCalls++;
    const address = String(url);
    if (address.includes("oauth2.googleapis.com/token")) {
      assert.ok(options.body.get("code_verifier"));
      return Response.json({ access_token: "temporary-google-token" });
    }
    if (address.includes("/copy?")) {
      copies++;
      const body = JSON.parse(options.body);
      assert.equal(body.parents[0], "root");
      assert.equal(body.permissions, undefined);
      existingFile = `private-copy-${copies}`;
      existingAttempt = body.appProperties.insuranceInsightCreation;
      return Response.json({ id: existingFile });
    }
    const query = new URL(address).searchParams.get("q") || "";
    return Response.json({ files: existingFile && query.includes(existingAttempt) ? [{ id: existingFile }] : [] });
  });
  const post = (token, origin = "https://example.test") => route.POST(new NextRequest("https://example.test/api/google/customer-sheet", { method: "POST", headers: { origin, ...(token ? { authorization: `Bearer ${token}` } : {}) } }));
  assert.equal((await post("")).status, 401);
  assert.equal((await post("member-token", "https://evil.test")).status, 403);
  const start = await post("member-token");
  const url = new URL((await start.json()).url);
  assert.equal(url.searchParams.get("scope"), "https://www.googleapis.com/auth/drive.file");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  const cookie = `customer-sheet-state=${start.cookies.get("customer-sheet-state").value}`;
  const callback = state => route.GET(new NextRequest(`https://example.test/api/google/customer-sheet?code=test&state=${state}`, { headers: { cookie } }));
  assert.match((await callback("wrong-state")).headers.get("location"), /expired/);
  assert.equal(googleCalls, 0);
  saveFails = true;
  assert.match((await callback(url.searchParams.get("state"))).headers.get("location"), /save_error/);
  assert.equal(copies, 1);
  saveFails = false;
  assert.equal((await callback(url.searchParams.get("state"))).headers.get("location"), "https://example.test/my-page?tab=customer");
  assert.equal(copies, 1);
  assert.equal(saved, "https://docs.google.com/spreadsheets/d/private-copy-1/edit");
  assert.equal((await (await post("member-token")).json()).existing, true);
  saved = ""; // The user removes the embed, while their old Drive file remains.
  const fresh = await post("member-token");
  const freshUrl = new URL((await fresh.json()).url);
  const recreated = await route.GET(new NextRequest(`https://example.test/api/google/customer-sheet?code=new-code&state=${freshUrl.searchParams.get("state")}`, { headers: { cookie: `customer-sheet-state=${fresh.cookies.get("customer-sheet-state").value}` } }));
  assert.equal(recreated.headers.get("location"), "https://example.test/my-page?tab=customer");
  assert.equal(copies, 2);
  assert.equal(saved, "https://docs.google.com/spreadsheets/d/private-copy-2/edit");
});
