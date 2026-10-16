import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("./personal-menu-order.ts", import.meta.url), "utf8");
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { normalizePersonalMenuOrder, reorderPersonalMenu, PERSONAL_MENU_GROUPS } = module.exports;
const defaults = ["home", "customer-management", "coverage-analysis", "policy-inserts", "customer", "ai", "notice", "calendar", "memo", "diary", "shortcut:kakao", "shortcut:mysite", "shortcut:spreadsheet"];

test("moves preserve group boundaries and fixed menu positions", () => {
  const moved = Array.from(reorderPersonalMenu(defaults, "customer", "customer-management"));
  assert.deepEqual(moved.slice(1, 5), ["customer", "customer-management", "coverage-analysis", "policy-inserts"]);
  assert.deepEqual(moved.slice(5), defaults.slice(5));
  assert.equal(moved[0], "home");
  assert.equal(reorderPersonalMenu(defaults, "notice", "calendar"), defaults);
  assert.equal(reorderPersonalMenu(defaults, "notice", "customer-management"), defaults);
  assert.equal(reorderPersonalMenu(defaults, "home", "customer"), defaults);
  assert.equal(reorderPersonalMenu(defaults, "memo", "unknown"), defaults);
});
test("shortcut order is independent of tabs and survives save/load normalization", () => {
  const moved = Array.from(reorderPersonalMenu(defaults, "shortcut:spreadsheet", "shortcut:kakao"));
  assert.deepEqual(moved.slice(0, 10), defaults.slice(0, 10));
  assert.deepEqual(moved.slice(10), ["shortcut:spreadsheet", "shortcut:kakao", "shortcut:mysite"]);
  assert.deepEqual(Array.from(normalizePersonalMenuOrder(JSON.parse(JSON.stringify(moved)), defaults)), moved);
});
test("legacy orders retain their order, while missing menus are restored and duplicates ignored", () => {
  const restored = Array.from(normalizePersonalMenuOrder(["memo", "memo", "customer", "removed-menu", 123], defaults));
  assert.deepEqual(restored.slice(0, 2), ["memo", "customer"]);
  assert.equal(new Set(restored).size, defaults.length);
  assert.ok(restored.includes("customer-management"));
  assert.ok(restored.includes("policy-inserts"));
  assert.deepEqual(Array.from(normalizePersonalMenuOrder(null, defaults)), defaults);
});

test("customer tools and communication menus belong to separate categories", () => {
  assert.deepEqual(Array.from(PERSONAL_MENU_GROUPS[0].ids), ["customer-management", "coverage-analysis", "policy-inserts", "customer"]);
  assert.deepEqual(Array.from(PERSONAL_MENU_GROUPS[1].ids), ["ai", "notice"]);
  assert.deepEqual(Array.from(reorderPersonalMenu(defaults, "notice", "ai")).slice(5, 7), ["notice", "ai"]);
});
