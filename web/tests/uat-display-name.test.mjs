import assert from "node:assert/strict";
import test from "node:test";
import { uatDisplayName, uatPrivateName } from "../src/features/auth/lib/uat-display-name.ts";

test("uses only the reduced portal claim and preserves accents", () => {
  assert.equal(uatDisplayName({ uat_display_name: "María L.", name: "Other full name" }), "María L.");
  assert.equal(uatDisplayName({ uat_display_name: "José" }), "José");
});

test("refuses full names, markup, matrícula and editable standard names", () => {
  for (const value of ["María Isabel López", "<img src=x>", "123456", "Ana L.\nInjected", [], {}, null]) {
    assert.equal(uatDisplayName({ uat_display_name: value }), null);
  }
  assert.equal(uatDisplayName({ name: "Editable Name", given_name: "Editable" }), null);
});

test("compound given names use their own public claim", () => {
  assert.equal(uatDisplayName({ uat_display_name: "María Isabel L." }), "María Isabel L.");
  assert.equal(uatDisplayName({ uat_display_name: "Carlos Alberto M." }), "Carlos Alberto M.");
  assert.equal(uatPrivateName({ uat_private_name: "María Isabel López García" }), "María Isabel López García");
  assert.equal(uatPrivateName({ name: "Unverified Name" }), null);
});
