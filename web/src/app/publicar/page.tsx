import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { ListingForm } from "@/components/listing-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const student = await getActiveStudent();
  const university = student
    ? await prisma.university.findFirst({
        where: { id: student.universityId, status: "ACTIVE", isDemo: false },
        select: { name: true },
      })
    : null;
  const loginAvailable = university
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
          Volver a los avisos
        </Link>
        <div className="form-intro">
          <h1>Publica un aviso para tu campus.</h1>
          <p>
            Describe el artículo con claridad. Solo estudiantes activos de tu
            universidad podrán ver esta publicación.
          </p>
        </div>

        {student && university ? (
          <ListingForm universityName={university.name} />
        ) : (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>El acceso estudiantil es necesario.</h2>
            </div>
            <p>
              {loginAvailable
                ? "Inicia con la cuenta institucional de una universidad integrada para publicar dentro de tu comunidad."
                : "Primero debe integrarse una universidad con su proveedor de identidad institucional."}
            </p>
            <div className="form-actions">
              <Link className="button-ink" href="/ingresar">
                {loginAvailable ? "Iniciar sesión" : "Ver acceso institucional"}
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="text-action" href="/universidades">
                Solicitar integración
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
