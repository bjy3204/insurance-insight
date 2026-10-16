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
const { normalizePersonalMenuOrder, reorderPersonalMenu } = module.exports;
const defaults = ["home", "customer-management", "customer", "ai", "notice", "calendar", "memo", "diary", "shortcut:kakao", "shortcut:mysite", "shortcut:spreadsheet"];

test("moves preserve group boundaries and fixed menu positions", () => {
  const moved = Array.from(reorderPersonalMenu(defaults, "notice", "customer-management"));
  assert.deepEqual(moved.slice(1, 5), ["notice", "customer-management", "customer", "ai"]);
  assert.deepEqual(moved.slice(5), defaults.slice(5));
  assert.equal(moved[0], "home");
  assert.equal(reorderPersonalMenu(defaults, "notice", "calendar"), defaults);
  assert.equal(reorderPersonalMenu(defaults, "home", "customer"), defaults);
  assert.equal(reorderPersonalMenu(defaults, "memo", "unknown"), defaults);
});
test("shortcut order is independent of tabs and survives save/load normalization", () => {
  const moved = Array.from(reorderPersonalMenu(defaults, "shortcut:spreadsheet", "shortcut:kakao"));
  assert.deepEqual(moved.slice(0, 8), defaults.slice(0, 8));
  assert.deepEqual(moved.slice(8), ["shortcut:spreadsheet", "shortcut:kakao", "shortcut:mysite"]);
  assert.deepEqual(Array.from(normalizePersonalMenuOrder(JSON.parse(JSON.stringify(moved)), defaults)), moved);
});
test("legacy orders retain their order, while missing menus are restored and duplicates ignored", () => {
  const restored = Array.from(normalizePersonalMenuOrder(["memo", "memo", "customer", "removed-menu", 123], defaults));
  assert.deepEqual(restored.slice(0, 2), ["memo", "customer"]);
  assert.equal(new Set(restored).size, defaults.length);
  assert.ok(restored.includes("customer-management"));
  assert.deepEqual(Array.from(normalizePersonalMenuOrder(null, defaults)), defaults);
});
