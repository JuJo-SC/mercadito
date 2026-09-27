import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { countUnreadMessagesForStudent } from "@/lib/conversations";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

function safeReturnTo(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }

  try {
    const destination = new URL(value, "https://mercadito.invalid");
    if (destination.origin !== "https://mercadito.invalid") return "/";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
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
  const availableUniversity = student
    ? true
    : (await prisma.university.count({
        where: { status: "ACTIVE", isDemo: false },
      })) > 0;
  const testUniversity = student
    ? null
    : await prisma.university.findFirst({
        where: { status: "ACTIVE", isDemo: false, isTest: true },
        orderBy: { name: "asc" },
        select: { name: true },
      });

  const unreadMessageCount = await unreadMessageCountPromise;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} unreadMessageCount={unreadMessageCount} />
      <main className="form-page page-width">
        <Link className="back-link" href="/">
          <ArrowRight aria-hidden="true" size={16} />
          Volver al mercadito
        </Link>
        <div className="form-intro">
          <h1>Tu universidad abre la puerta.</h1>
          <p>
            El acceso se comprueba con la identidad institucional y pertenece a
            una sola comunidad universitaria.
          </p>
        </div>

        {testUniversity ? (
          <p className="demo-banner auth-test-note" role="note">
            <span className="demo-mark" aria-hidden="true">P</span>
            {testUniversity.name} es un campus de prueba. Usa una cuenta de
            prueba y datos ficticios; no hay un proveedor institucional conectado.
          </p>
        ) : null}

        {student ? (
          <section className="auth-notice" role="status">
            <p className="auth-notice-title">Tu sesión institucional está activa.</p>
            <p>Ya puedes publicar y explorar los avisos de tu comunidad.</p>
            <Link className="button-ink" href="/">
              Ir a los avisos
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </section>
        ) : availableUniversity ? (
          <section className="auth-panel">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>Inicia con la cuenta de tu campus</h2>
            </div>
            <p>
              Se abrirá el proveedor institucional que tiene registrada tu
              universidad. Mercadito no recibe tu contraseña.
            </p>
            <form action={startInstitutionalLogin}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button className="button-ink form-submit" type="submit">
                Continuar con mi universidad
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </form>
          </section>
        ) : (
          <section className="auth-notice">
            <p className="auth-notice-title">
              La primera integración universitaria está pendiente.
            </p>
            <p>
              Cuando una universidad configure su identidad institucional, sus
              alumnos podrán entrar desde aquí. Mientras tanto puedes solicitar
              integrar tu campus.
            </p>
            <Link className="button-ink" href="/universidades">
              Solicitar integración
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </section>
        )}

        <p className="form-footnote">
          Los avisos de campus reales solo aparecen después de verificar la
          pertenencia a esa comunidad.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
