import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url), ts = require('typescript'), module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./useSubscriberKeyboard.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module, exports: module.exports, require: name => name === 'react' ? {} : require(name) });
const { subscriberShortcut } = module.exports;
const space = { ctrlKey: true, shiftKey: true, altKey: false, code: 'Space', key: ' ', repeat: false, isComposing: false };
test('check shortcut is allowed for exactly one visible subscriber and cannot select all', () => {
  assert.equal(subscriberShortcut(space, 1), 'check-one');
  for (const count of [0, 2, 300, 616]) assert.equal(subscriberShortcut(space, count), 'ignore');
});
test('held keys and IME composition cannot repeatedly execute check or registration', () => {
  assert.equal(subscriberShortcut({ ...space, repeat: true }, 1), null);
  assert.equal(subscriberShortcut({ ...space, isComposing: true }, 1), null);
  assert.equal(subscriberShortcut({ ...space, ctrlKey: false }, 1), null);
  assert.equal(subscriberShortcut({ ...space, shiftKey: false }, 1), null);
});
test('new subscriber accepts main keyboard plus and keypad plus', () => {
  assert.equal(subscriberShortcut({ ...space, code: 'Equal', key: '+' }, 0), 'new');
  assert.equal(subscriberShortcut({ ...space, code: 'NumpadAdd', key: '+' }, 12), 'new');
});

function keyboardHarness(count = 2) {
  let focus = null, handler, checked = 0, created = 0;
  const effects = [];
  class Node {
    constructor(kind, action) { this.kind = kind; this.dataset = { subscriberAction: action }; this.textContent = action; this.clicks = 0; }
    focus() { focus = this; }
    select() { this.selected = true; }
    click() { this.clicks++; }
    closest(selector) { return selector === '[data-subscriber-row]' ? this.row : this.kind === 'button' ? this : null; }
  }
  const search = new Node('search'), all = new Node('button', 'all');
  const rows = Array.from({ length: count }, () => {
    const row = new Node('row');
    row.buttons = ['check', 'edit', 'status', 'delete'].map(action => { const button = new Node('button', action); button.row = row; return button; });
    row.querySelector = () => row.buttons[0]; row.querySelectorAll = () => row.buttons;
    return row;
  });
  const document = { addEventListener: (_, callback) => { handler = callback; }, removeEventListener: () => {} };
  const compiled = ts.transpileModule(readFileSync(new URL('./useSubscriberKeyboard.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const m = { exports: {} };
  vm.runInNewContext(compiled, { module: m, exports: m.exports, document, HTMLElement: Node, window: { confirm: () => false }, require: () => ({ useRef: value => ({ current: value }), useEffect: callback => effects.push(callback) }) });
  const refs = m.exports.default({ open: true, blocked: false, editorOpen: false, editorId: '', count, newSubscriber: () => { created++; }, checkOnly: async () => { checked++; } });
  refs.searchRef.current = search;
  refs.listRef.current = { querySelectorAll: () => rows, contains: row => rows.includes(row) };
  effects.forEach(callback => callback());
  const press = (key, extra = {}) => { let prevented = false; handler({ key, code: key === ' ' ? 'Space' : key, target: focus, ctrlKey: false, shiftKey: false, altKey: false, repeat: false, isComposing: false, preventDefault: () => { prevented = true; }, stopPropagation: () => {}, ...extra }); return prevented; };
  return { rows, all, search, press, focus: () => focus, checked: () => checked, created: () => created };
}
test('down from search skips the header and arrows stay within individual subscriber actions', () => {
  const h = keyboardHarness();
  h.press('ArrowDown'); assert.equal(h.focus(), h.rows[0].buttons[0]);
  h.press('ArrowRight'); assert.equal(h.focus(), h.rows[0].buttons[1]);
  h.press('ArrowDown'); assert.equal(h.focus(), h.rows[1].buttons[1]);
  h.press('ArrowLeft'); assert.equal(h.focus(), h.rows[1].buttons[0]);
  h.press(' '); assert.equal(h.rows[1].buttons[0].clicks, 1);
  assert.equal(h.all.clicks, 0);
  h.press('Escape'); assert.equal(h.focus(), h.search); assert.equal(h.search.selected, true);
});
test('space executes only the focused individual action and ignores key repeat', () => {
  const h = keyboardHarness(); h.press('ArrowDown');
  h.press(' ', { repeat: true }); assert.equal(h.rows[0].buttons[0].clicks, 0);
  h.press('ArrowRight'); h.press('ArrowRight'); h.press(' ');
  assert.equal(h.rows[0].buttons[2].clicks, 0); // rejected status confirmation
  assert.equal(h.all.clicks, 0);
});
test('up from the first result returns to search after checking, without reaching the select-all header', () => {
  const h = keyboardHarness();
  h.press('ArrowDown'); h.press(' ');
  assert.equal(h.rows[0].buttons[0].clicks, 1);
  h.press('ArrowUp');
  assert.equal(h.focus(), h.search);
  assert.equal(h.search.selected, true);
  assert.equal(h.all.clicks, 0);
});
test('up after checking any result returns to search, and up in search never jumps back into the list', () => {
  const h = keyboardHarness(3);
  h.press('ArrowDown'); h.press('ArrowDown'); h.press(' ');
  assert.equal(h.rows[1].buttons[0].clicks, 1);
  h.press('ArrowUp'); assert.equal(h.focus(), h.search);
  h.press('ArrowUp'); assert.equal(h.focus(), h.search);
  assert.equal(h.all.clicks, 0);
});
test('single-result hotkey calls check-only once; multiple and empty results never call it', async () => {
  for (const count of [0, 1, 2]) {
    const h = keyboardHarness(count);
    h.press(' ', { ctrlKey: true, shiftKey: true });
    await Promise.resolve();
    assert.equal(h.checked(), count === 1 ? 1 : 0);
    assert.equal(h.all.clicks, 0);
  }
});
