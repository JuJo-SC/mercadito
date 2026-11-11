"use server";

import { signIn, signOut } from "@/features/auth/auth";

function safeReturnTo(value: string | undefined): string {
  if (!value || typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/mercadito";
  }

  try {
    const destination = new URL(value, "https://mercadito.invalid");
    if (destination.origin !== "https://mercadito.invalid") return "/mercadito";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/mercadito";
  }
}

export async function startInstitutionalLogin(returnTo = "/mercadito") {
  await signOut({ redirect: false });
  await signIn("keycloak", { redirectTo: safeReturnTo(returnTo) });
}
