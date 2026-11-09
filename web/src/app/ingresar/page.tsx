import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn, signOut } from "@/features/auth/auth";
import { activeUniversitySlug, getActiveCommunity } from "@/features/community/lib/active-community";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { SiteHeader } from "@/components/site-header";

import { getUatPrivacyUrl, isUatLoginEnabled } from "@/features/auth/lib/uat-access";
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

async function startInstitutionalLogin(formData: FormData) {
  "use server";
  await signOut({ redirect: false });
  await signIn("keycloak", { redirectTo: safeReturnTo(formData.get("returnTo")?.toString()) });
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const student = await getActiveStudent();
  const unreadMessageCountPromise = student
    ? countUnreadMessagesForStudent(student.id, student.universityId)
    : Promise.resolve(0);
  const community = await getActiveCommunity();
  const isUat = activeUniversitySlug === "uat";
  const accessReady = !isUat || isUatLoginEnabled();
  const privacyUrl = isUat ? getUatPrivacyUrl() : null;

  const unreadMessageCount = await unreadMessageCountPromise;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} universityName={student?.university.name} unreadMessageCount={unreadMessageCount} />
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
            {student ? (
              <>
                <h1 id="sign-in-title">Tu sesión está activa</h1>
                <p>Ya puedes explorar, publicar y conversar con tu comunidad.</p>
                <Link className="button-ink" href="/mercadito">
                  Ir al mercadito
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </>
            ) : community && accessReady ? (
              <>
                <h1 id="sign-in-title">Entra al mercadito</h1>
                <p>Inicia sesión con tu cuenta institucional para explorar, publicar y conversar con tu comunidad.</p>
                {community.isTest ? (
                  <p className="sign-in-test-note" role="note">Entorno de prueba: usa una cuenta de prueba y datos ficticios.</p>
                ) : null}
                <form action={startInstitutionalLogin}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button className="button-ink" type="submit">
                    Iniciar sesión
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                </form>
                {privacyUrl ? (
                  <p className="sign-in-privacy"><a href={privacyUrl}>Aviso de privacidad</a></p>
                ) : null}
              </>
            ) : (
              <>
                <h1 id="sign-in-title">Acceso en preparación</h1>
                <p>Vuelve más tarde para iniciar sesión con tu cuenta institucional.</p>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
