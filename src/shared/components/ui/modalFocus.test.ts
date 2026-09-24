/**
 * Modal focus trap helpers.
 * 실행: npm run test:modal-focus
 */
import assert from 'node:assert/strict';
import { getFocusableElements, trapTabKey } from './modalFocus';

function stubRoot(ids: string[]) {
  const nodes = ids.map((id) => ({
    id,
    tabIndex: 0,
    hasAttribute: () => false,
    offsetParent: {},
    focus() {
      focused = id;
    },
  }));
  return {
    querySelectorAll: () => nodes,
    focus() {
      focused = 'root';
    },
  } as unknown as HTMLElement;
}

let focused = '';

function run() {
  focused = '';
  const empty = stubRoot([]);
  assert.deepEqual(getFocusableElements(empty), []);

  const root = stubRoot(['first', 'mid', 'last']);
  const items = getFocusableElements(root);
  assert.equal(items.length, 3);
  assert.equal(items[0].id, 'first');

  let prevented = false;
  trapTabKey(
    { key: 'Enter', preventDefault() { prevented = true; } } as KeyboardEvent,
    root
  );
  assert.equal(prevented, false);

  trapTabKey(
    { key: 'Tab', preventDefault() { prevented = true; } } as KeyboardEvent,
    empty
  );
  assert.equal(prevented, true);
  assert.equal(focused, 'root');

  console.log('modalFocus.test.ts: ok');
}

run();
