import assert from "node:assert/strict";
import test from "node:test";
import { submitMessageOnEnter } from "../src/features/conversations/lib/submit-message-on-enter.ts";

function press(overrides = {}, sending = false) {
  let prevented = false;
  let submissions = 0;
  const event = {
    key: "Enter",
    shiftKey: false,
    repeat: false,
    nativeEvent: { isComposing: false, keyCode: 13 },
    currentTarget: { value: "¿Sigue disponible?", form: { requestSubmit() { submissions++; } } },
    preventDefault() { prevented = true; },
    ...overrides,
  };
  submitMessageOnEnter(event, sending);
  return { prevented, submissions };
}

test("Enter submits through the form without inserting a newline", () => {
  assert.deepEqual(press(), { prevented: true, submissions: 1 });
});

test("Shift+Enter and composition keep their native editing behavior", () => {
  for (const overrides of [
    { shiftKey: true },
    { key: "a" },
    { nativeEvent: { isComposing: true, keyCode: 13 } },
    { nativeEvent: { isComposing: false, keyCode: 229 } },
  ]) assert.deepEqual(press(overrides), { prevented: false, submissions: 0 });
});

test("held Enter, pending requests, and blank messages do not submit or insert newlines", () => {
  assert.deepEqual(press({ repeat: true }), { prevented: true, submissions: 0 });
  assert.deepEqual(press({}, true), { prevented: true, submissions: 0 });
  for (const value of ["", "   ", "\n "]) {
    assert.deepEqual(press({ currentTarget: { value, form: { requestSubmit() { assert.fail("Blank message submitted"); } } } }), { prevented: true, submissions: 0 });
  }
});
