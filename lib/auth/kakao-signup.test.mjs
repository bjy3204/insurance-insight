import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextRequest } = require("next/server");
const env = { ...process.env, KAKAO_SIGNUP_COOKIE_SECRET: "temporary-test-key", KAKAO_REST_API_KEY: "test-app" };
function load(path, overrides = {}, fetch = globalThis.fetch) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => overrides[name] || require(name), process: { env }, Buffer, Date, URL, URLSearchParams, AbortSignal, fetch });
  return module.exports;
}
const cookies = load("./kakao-signup-cookie.ts");
const membership = load("./membership.ts");
const expires = Date.now() + 60000;
test("temporary authentication tickets reject tampering and expiration", () => {
  const sealed = cookies.sealKakaoTicket({ expires, idToken: "pending-only" });
  assert.equal(cookies.readKakaoTicket(sealed).idToken, "pending-only");
  assert.equal(cookies.readKakaoTicket("bad" + sealed), null);
  assert.equal(cookies.readKakaoTicket(cookies.sealKakaoTicket({ expires: 1 })), null);
});

test("provider authentication stays pending until a completed member explicitly commits", async () => {
  let createdClients = 0, links = 0, hasProfile = false, completeProfile = false, alreadyLinked = false;
  const route = load("../../app/api/auth/kakao/signup/route.ts", {
    "@/lib/auth/kakao-signup-cookie": cookies,
    "@/lib/auth/membership": membership,
    "@supabase/supabase-js": { createClient: () => {
      createdClients++;
      return {
        auth: {
          setSession: async () => ({ error: null }),
          getUser: async () => ({ data: { user: { id: "member", identities: alreadyLinked ? [{ provider: "kakao" }] : [] } }, error: null }),
          linkIdentity: async () => { links++; return { data: { session: null }, error: null }; },
        },
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: hasProfile ? { id: "member", nickname: completeProfile ? "member-name" : null, instagram_id: completeProfile ? "member-instagram" : null } : null, error: null }) }) }),
          update: () => ({ eq: async () => ({ error: null }) }),
        }),
      };
    } },
  }, async url => new Response(JSON.stringify(String(url).includes("oauth/token") ? { id_token: "id-token", access_token: "provider-token" } : { id: 123 }), { status: 200 }));
  const post = (body, cookie = "") => new NextRequest("https://example.test/api/auth/kakao/signup", { method: "POST", headers: { origin: "https://example.test", "Content-Type": "application/json", cookie }, body: JSON.stringify(body) });
  const start = await route.POST(post({ action: "start" }));
  assert.equal(start.status, 200);
  const url = new URL((await start.json()).url);
  const stateValue = start.cookies.get("kakao-signup-state").value;
  const callback = await route.GET(new NextRequest(`https://example.test/api/auth/kakao/signup?code=test&state=${url.searchParams.get("state")}`, { headers: { cookie: `kakao-signup-state=${stateValue}` } }));
  const ticketValue = callback.cookies.get("kakao-signup-ticket").value;
  assert.equal(createdClients, 0);
  assert.equal(links, 0);
  const cookie = `kakao-signup-ticket=${ticketValue}`;
  const commit = { action: "commit", access_token: "member-token", refresh_token: "member-refresh" };
  assert.equal((await route.POST(post(commit, cookie))).status, 403);
  assert.equal(links, 0);
  hasProfile = true;
  assert.equal((await route.POST(post(commit, cookie))).status, 403);
  assert.equal(links, 0);
  completeProfile = true; alreadyLinked = true;
  assert.equal((await route.POST(post(commit, cookie))).status, 409);
  assert.equal(links, 0);
  alreadyLinked = false;
  assert.equal((await route.POST(post(commit, cookie))).status, 200);
  assert.equal(links, 1);
});
