import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./subscriber-links.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports });
const { normalizeInstagramId, findSubscriberLinks, subscriberLinkCandidates } = module.exports;
const member = (id, instagram_id, linked_subscriber_id = null) => ({ id, instagram_id, linked_subscriber_id });
const subscriber = (id, subscriber_id) => ({ id, subscriber_id });
test('identity comparison ignores case, leading @ and outside spaces, but preserves internal characters', () => {
  assert.equal(normalizeInstagramId('  @User.Name_1  '), 'user.name_1');
  assert.equal(normalizeInstagramId(null), '');
  assert.notEqual(normalizeInstagramId('user.name'), normalizeInstagramId('username'));
});
test('only a unique matching member and subscriber are connected', () => {
  const links = findSubscriberLinks([member('m1', ' @Tree ')], [subscriber('s1', 'tree')]);
  assert.equal(links.length, 1);
  assert.equal(links[0].profileId, 'm1');
  assert.equal(links[0].subscriberId, 's1');
  assert.equal(findSubscriberLinks([member('m1', 'tree'), member('m2', '@TREE')], [subscriber('s1', 'tree')]).length, 0);
  assert.equal(findSubscriberLinks([member('m1', 'tree')], [subscriber('s1', 'tree'), subscriber('s2', '@Tree')]).length, 0);
});
test('existing manual connections and occupied subscribers are never reassigned', () => {
  assert.equal(findSubscriberLinks([member('m1', 'tree', 'old')], [subscriber('s1', 'tree')]).length, 0);
  assert.equal(findSubscriberLinks([member('m1', 'tree'), member('m2', 'other', 's1')], [subscriber('s1', 'tree')]).length, 0);
  assert.equal(findSubscriberLinks([member('m1', '')], [subscriber('s1', '')]).length, 0);
});
test('recommendations detect punctuation differences and show name evidence without changing automatic matching', () => {
  const memberData = { ...member('m1', 'one_loca_hyun'), nickname: '김효진' };
  const rows = [{ ...subscriber('s1', 'one_loca-hyun'), name: '김효진' }, { ...subscriber('s2', 'unrelated'), name: '박다른' }];
  const result = subscriberLinkCandidates(memberData, rows);
  assert.equal(result.length, 1);
  assert.equal(result[0].reason, '기호·언더바 차이');
  assert.equal(result[0].nameMatches, true);
  assert.equal(findSubscriberLinks([memberData], rows).length, 0);
  assert.equal(subscriberLinkCandidates(member('m2', 'cjh__no1'), [subscriber('s3', 'cjh_no1')]).length, 1);
  assert.equal(subscriberLinkCandidates(member('m3', ''), [subscriber('s4', '___')]).length, 0);
});
