import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/features/auth/auth";
import { activeUniversityName, getActiveCommunity } from "@/features/community/lib/active-community";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { SiteFooter, SiteHeader } from "@/components/site-header";

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

  const unreadMessageCount = await unreadMessageCountPromise;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} universityName={student?.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="form-page page-width">
        <Link className="back-link" href="/">
          <ArrowRight aria-hidden="true" size={16} />
          Volver al mercadito
        </Link>
        <div className="form-intro">
          <h1>Entra al mercadito de {activeUniversityName}.</h1>
          <p>
            Publica, explora y conversa dentro de la comunidad de {activeUniversityName}.
            Solo las cuentas autorizadas pueden acceder al catálogo.
          </p>
        </div>

        {community?.isTest ? (
          <p className="demo-banner auth-test-note" role="note">
            <span className="demo-mark" aria-hidden="true">P</span>
            {activeUniversityName} es un campus de prueba. Usa una cuenta de
            prueba y datos ficticios; no hay un proveedor institucional conectado.
          </p>
        ) : null}

        {student ? (
          <section className="auth-notice" role="status">
            <p className="auth-notice-title">Tu sesión está activa.</p>
            <p>Tu cuenta pertenece a la comunidad de {activeUniversityName}.</p>
            <Link className="button-ink" href="/mercadito">
              Ir a mi mercadito
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </section>
        ) : community ? (
          <section className="auth-panel">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>{community.isTest ? "Usa tu cuenta de prueba" : "Usa tu cuenta institucional"}</h2>
            </div>
            <p>
              {community.isTest
                ? `Se abrirá el acceso de ${activeUniversityName} con las cuentas de prueba proporcionadas para este recorrido.`
                : `Se abrirá el acceso institucional de ${activeUniversityName}. Mercadito no recibe tu contraseña.`}
            </p>
            <form action={startInstitutionalLogin}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button className="button-ink form-submit" type="submit">
                Continuar con {activeUniversityName}
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </form>
          </section>
        ) : (
          <section className="auth-notice">
            <p className="auth-notice-title">El acceso a {activeUniversityName} está en preparación.</p>
            <p>Vuelve más tarde. El catálogo estará disponible cuando se habilite el acceso de esta comunidad.</p>
          </section>
        )}

        <p className="form-footnote">
          Los productos y las conversaciones de {activeUniversityName} solo están disponibles para las cuentas autorizadas de esta comunidad.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
