import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("./customer-form-fields.ts", import.meta.url), "utf8");
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { formatCustomerBirth, customerGender, formatCustomerPhone, formatCustomerDate, withCustomerClaimDefaults, withContractDefaults, customerNameStartsWith, updateContractDraft } = module.exports;

test("birth input retains only seven digits and derives gender without accepting the full identifier", () => {
  assert.equal(formatCustomerBirth("9609012"), "960901-2");
  assert.equal(formatCustomerBirth("960901-2123456"), "960901-2");
  assert.equal(formatCustomerBirth("000101"), "000101");
  assert.equal(formatCustomerBirth(""), "");
  assert.equal(customerGender("960901-2"), "여");
  assert.equal(customerGender("000101-3"), "남");
  assert.equal(customerGender("000101"), "");
});

test("phone input formats mobile, Seoul and twelve-digit contact numbers", () => {
  assert.equal(formatCustomerPhone("01012345678"), "010-1234-5678");
  assert.equal(formatCustomerPhone("02-1234-5678"), "02-1234-5678");
  assert.equal(formatCustomerPhone("021234"), "02-1234");
  assert.equal(formatCustomerPhone("050512345678"), "0505-1234-5678");
  assert.equal(formatCustomerPhone(""), "");
});

test("renewal date accepts digits, inserts hyphens progressively and limits input to eight digits", () => {
  assert.equal(formatCustomerDate("20261015"), "2026-10-15");
  assert.equal(formatCustomerDate("2026-10-15"), "2026-10-15");
  assert.equal(formatCustomerDate("20261"), "2026-1");
  assert.equal(formatCustomerDate("202610"), "2026-10");
  assert.equal(formatCustomerDate("2026101"), "2026-10-1");
  assert.equal(formatCustomerDate("202610151234"), "2026-10-15");
  assert.equal(formatCustomerDate("2026-10-"), "2026-10");
  assert.equal(formatCustomerDate(""), "");
});

test("claim defaults use the latest customer details and preserve independently entered values", () => {
  const draft = { name: "고객", birth: "960901-2", accountOwner: "  ", accountBirth: "" };
  const result = withCustomerClaimDefaults(draft);
  assert.equal(result.accountOwner, "고객");
  assert.equal(result.accountBirth, "960901");
  assert.equal(draft.accountBirth, "");
  assert.equal(withCustomerClaimDefaults({ ...draft, name: "변경된 이름" }).accountOwner, "변경된 이름");
  const explicit = withCustomerClaimDefaults({ ...draft, accountOwner: "다른 예금주", accountBirth: "001010-3" });
  assert.equal(explicit.accountOwner, "다른 예금주");
  assert.equal(explicit.accountBirth, "001010");
  assert.equal(withCustomerClaimDefaults({}).accountOwner, "");
});

test("contracts default only missing dates and insured details, without changing entered values", () => {
  const blank = { owner: "계약자", ownerBirth: "960901-2", date: " ", insured: "", insuredBirth: "" };
  const result = withContractDefaults(blank, "2026-10-15");
  assert.equal(result.date, "2026-10-15");
  assert.equal(result.insured, "계약자");
  assert.equal(result.insuredBirth, "960901");
  const explicit = withContractDefaults({ ...blank, date: "2025-01-01", sameInsured: "false", insured: "다른 사람", insuredBirth: "001010-3" }, "2026-10-15");
  assert.equal(explicit.date, "2025-01-01");
  assert.equal(explicit.insured, "다른 사람");
  assert.equal(explicit.insuredBirth, "001010");
  assert.equal(withContractDefaults({ ...blank, owner: "바뀐 이름" }, "2026-10-16").insured, "바뀐 이름");
});
test("customer prefix suggestions support initials and preserve namesakes as separate records", () => {
  const people = [{name:"배지연",birth:"960901-2"},{name:"배지연",birth:"001010-4"},{name:"배지수",birth:"950101-2"},{name:"박민수",birth:"900101-1"},{name:"김배지",birth:"900101-1"}];
  assert.equal(people.filter(p=>customerNameStartsWith(p.name,"ㅂ")).length,4);
  assert.equal(people.filter(p=>customerNameStartsWith(p.name,"배지")).length,3);
  assert.equal(people.filter(p=>customerNameStartsWith(p.name,"배지연")).length,2);
  assert.equal(people.filter(p=>customerNameStartsWith(p.name,"ㅂㅈ")).length,3);
  assert.equal(customerNameStartsWith("김배지","배지"),false);
  assert.equal(customerNameStartsWith("배지연",""),false);
});

test("same insured defaults on, switches off on either edited field, and relinks when checked", () => {
  const draft = { owner: "계약자", ownerBirth: "960901-2" };
  assert.equal(withContractDefaults(draft, "2026-10-15").sameInsured, "true");
  let edited = updateContractDraft(draft, "insured", "피보험자");
  assert.equal(edited.sameInsured, "false");
  assert.equal(edited.insuredBirth, "");
  edited = updateContractDraft(edited, "owner", "다른 계약자");
  assert.equal(withContractDefaults(edited, "").insured, "피보험자");
  const birthEdited = updateContractDraft(draft, "insuredBirth", "001010-3");
  assert.equal(birthEdited.sameInsured, "false");
  assert.equal(birthEdited.insured, "");
  const unchecked = updateContractDraft(draft, "sameInsured", "false");
  assert.equal(unchecked.insured, "");
  assert.equal(unchecked.insuredBirth, "");
  const checked = updateContractDraft(edited, "sameInsured", "true");
  assert.equal(withContractDefaults(checked, "").insured, "다른 계약자");
  const cleared = updateContractDraft(draft, "insuredBirth", "");
  assert.equal(withContractDefaults(cleared, "").insuredBirth, "");
});

test('six-digit births exclude the gender suffix and vehicle lists retain legacy and multiple records', () => {
 const {shortCustomerBirth,customerVehicles,emptyCustomerVehicle,parseCustomerVehicles}=module.exports;
 assert.equal(shortCustomerBirth('960901-2'),'960901');
 const legacy=customerVehicles({vehicleNumber:'12가3456',insurer:'기존보험사'});
 assert.equal(legacy[0].vehicleNumber,'12가3456');
 const multiple=[legacy[0],{...emptyCustomerVehicle(),vehicleNumber:'34나5678',renewal:'2027-01-01'}];
 const read=customerVehicles({vehicles:JSON.stringify(multiple)});
 assert.equal(read.length,2);assert.equal(read[1].vehicleNumber,'34나5678');assert.equal(read[1].renewal,'2027-01-01');
 assert.throws(()=>parseCustomerVehicles('[{"vehicleNumber":42}]'));
});
