import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { uatDisplayName } from "../src/features/auth/lib/uat-display-name.ts";

function setup({ status = "ACTIVE", name = "Estudiante UAT", session = null } = {}) {
  let config;
  const updates = [];
  const university = { id: "uat-id", slug: "uat", status: "ACTIVE", isDemo: false };
  const localUser = { id: "local-user", name, universityId: university.id, role: "STUDENT", status, isDemo: false, university };
  const prisma = {
    user: { findUnique: async () => localUser, update: async (value) => { updates.push(value); return { ...localUser, ...value.data }; } },
    account: { findUnique: async () => ({ userId: "local-user" }) },
  };
  const modules = {
    "next-auth": { default: (value) => { config = value; return { auth: async () => session }; } },
    "next-auth/providers/keycloak": { default: (value) => value },
    "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
    "@/lib/prisma": { prisma },
    "@/features/auth/lib/university-identity": { resolveActiveStudent: async () => university },
    "@/features/community/lib/active-community": { activeUniversitySlug: "uat" },
    "@/features/auth/lib/uat-display-name": { uatDisplayName },
  };
  const source = readFileSync(new URL("../src/features/auth/auth.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { exports: {}, require: (key) => { assert.ok(modules[key], key); return modules[key]; }, process: { env: { AUTH_KEYCLOAK_ID: "fixture", AUTH_KEYCLOAK_SECRET: "fixture", AUTH_KEYCLOAK_ISSUER: "https://fixture.test" } } });
  return { config, updates, university };
}

function signInInput(claim = "María L.") {
  return { user: { id: "local-user" }, account: { provider: "keycloak", providerAccountId: "portal-subject" }, profile: { sub: "portal-subject", uat_display_name: claim } };
}

test("existing eligible account replaces generic label after portal verification", async () => {
  const { config, updates } = setup();
  const input = signInInput();
  assert.equal(await config.callbacks.signIn(input), true);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].where.id, "local-user");
  assert.equal(updates[0].data.name, "María L.");
  assert.equal(input.user.name, "María L.");
});

test("missing name and denied accounts cannot overwrite a verified name", async () => {
  const missing = setup({ name: "María L." });
  assert.equal(await missing.config.callbacks.signIn(signInInput(null)), true);
  assert.equal(missing.updates.length, 0);
  const denied = setup({ status: "SUSPENDED" });
  assert.equal(await denied.config.callbacks.signIn(signInInput()), false);
  assert.equal(denied.updates.length, 0);
});

test("new UAT profile uses only the reduced claim and does not accept full profile names", async () => {
  const { config } = setup();
  const profile = await config.providers[0].profile({ sub: "portal-subject", uat_display_name: "María L.", name: "MARÍA ISABEL LÓPEZ GARCÍA", email: "private@fixture.test" });
  assert.equal(profile.name, "María L.");
  assert.equal(profile.email, null);
  const unknown = await config.providers[0].profile({ sub: "portal-subject", name: "Unverified Full Name" });
  assert.equal(unknown.name, "Estudiante UAT");
});
