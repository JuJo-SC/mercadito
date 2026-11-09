import assert from "node:assert/strict";
import test from "node:test";
import { uatFaculty } from "../src/features/auth/lib/uat-faculty.ts";

test("accepts only a bounded faculty name from its dedicated claim", () => {
  assert.equal(uatFaculty({ uat_faculty_name: "Facultad de Enfermería" }), "Facultad de Enfermería");
  assert.equal(uatFaculty({ faculty: "Untrusted", Id_DES: 12 }), null);
  for (const value of ["12", "<script>", "x".repeat(181), [], null]) assert.equal(uatFaculty({ uat_faculty_name: value }), null);
});
