import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
function reader(student) {
  const queries = [];
  const output = ts.transpileModule(readFileSync(new URL("../src/features/auth/lib/private-profile.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: (key) => key.endsWith("require-student") ? { getActiveStudent: async () => student } : { prisma: { studentPrivateProfile: { findUnique: async (query) => { queries.push(query); return { fullName: student.id === "maria" ? "María Isabel López García" : "Carlos Alberto Méndez Ruiz" }; } } } } });
  return { read: exports.getOwnPrivateProfile, queries };
}
test("two sessions can only read their own names regardless of supplied IDs", async () => {
  const maria = reader({ id: "maria" }); const carlos = reader({ id: "carlos" });
  assert.equal((await maria.read("carlos")).fullName, "María Isabel López García");
  assert.equal((await carlos.read("maria")).fullName, "Carlos Alberto Méndez Ruiz");
  assert.equal(maria.queries[0].where.userId, "maria");
  assert.equal(carlos.queries[0].where.userId, "carlos");
});
test("anonymous session cannot read a private profile", async () => {
  const anonymous = reader(null);
  assert.equal(await anonymous.read(), null);
  assert.equal(anonymous.queries.length, 0);
});
