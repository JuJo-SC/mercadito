import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/features/auth/auth";
import { activeUniversitySlug, getActiveCommunity } from "@/features/community/lib/active-community";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { SiteHeader } from "@/components/site-header";
import { SignInSessionCleaner } from "./sign-in-cleaner";

import { isUatLoginEnabled } from "@/features/auth/lib/uat-access";
import "./sign-in.css";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

function safeReturnTo(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
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

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const student = await getActiveStudent();

  if (student) {
    redirect(returnTo);
  }

  const community = await getActiveCommunity();
  const isUat = activeUniversitySlug === "uat";
  const accessReady = !isUat || isUatLoginEnabled();

  if (community && accessReady) {
    await signIn("keycloak", { redirectTo: returnTo });
  }

  return (
    <>
      <SignInSessionCleaner />
      <SiteHeader signedIn={false} />
      <main className="form-page page-width sign-in-page">
        <Link className="back-link" href="/">
          <ArrowRight aria-hidden="true" size={16} />
          Volver al mercadito
        </Link>
        <div className="sign-in-content">
          <section className="sign-in-card" aria-labelledby="sign-in-title">
            <span className="sign-in-symbol" aria-hidden="true">
              <LockKeyhole size={25} strokeWidth={1.7} />
            </span>
            <h1 id="sign-in-title">Acceso en preparación</h1>
            <p>Vuelve más tarde para iniciar sesión con tu cuenta institucional.</p>
          </section>
        </div>
      </main>
    </>
  );
}
