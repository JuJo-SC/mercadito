import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

async function startInstitutionalLogin() {
  "use server";
  await signIn("keycloak", { redirectTo: "/" });
}

export default async function SignInPage() {
  const student = await getActiveStudent();
  const availableUniversity = student
    ? true
    : (await prisma.university.count({
        where: { status: "ACTIVE", isDemo: false },
      })) > 0;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} />
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
