import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { ListingForm } from "@/components/listing-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";

type PublishPageProps = {
  searchParams: Promise<{ demo?: string | string[]; editar?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const params = await searchParams;
  const editRequested = params.editar !== undefined;
  const editId = typeof params.editar === "string" ? params.editar.trim() : "";
  const demoMode = params.demo === "1" && !editRequested;
  const student = demoMode ? null : await getActiveStudent();
  const university = student
    ? await prisma.university.findFirst({
        where: { id: student.universityId, status: "ACTIVE", isDemo: false },
        select: { name: true, isTest: true },
      })
    : null;
  const editableListing = editRequested && editId && student
    ? await prisma.listing.findFirst({
        where: {
          id: editId,
          sellerId: student.id,
          universityId: student.universityId,
          isDemo: false,
          university: { status: "ACTIVE", isDemo: false },
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          condition: true,
          status: true,
        },
      })
    : null;
  const editLoginHref = editRequested && editId
    ? `/ingresar?returnTo=${encodeURIComponent(`/publicar?editar=${encodeURIComponent(editId)}`)}`
    : "/ingresar";
  const loginAvailable = demoMode
    ? false
    : university
      ? true
      : (await prisma.university.count({
          where: { status: "ACTIVE", isDemo: false },
        })) > 0;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} />
      <main className="form-page page-width publish-page">
        <Link className="back-link" href={editRequested ? "/mis-avisos" : demoMode ? "/publicar" : "/"}>
          <ArrowRight aria-hidden="true" size={16} />
          {editRequested ? "Volver a Mis avisos" : demoMode ? "Salir del recorrido" : "Volver a los avisos"}
        </Link>
        <div className="form-intro">
          <h1>
            {demoMode
              ? "Arma un clasificado para tu campus."
              : editRequested
                ? "Ajusta el aviso de tu campus."
                : "Prepara un aviso para tu campus."}
          </h1>
          <p>
            {demoMode
              ? "Recorre los pasos de publicación y revisa cómo se verá tu artículo en la gaceta."
              : editRequested
                ? "Corrige los datos del artículo. Guardar conserva su disponibilidad actual."
                : "Describe el artículo con claridad. Solo estudiantes activos de tu universidad podrán ver esta publicación."}
          </p>
        </div>

        {student && university?.isTest ? (
          <p className="demo-banner publish-demo-note" role="note">
            <span className="demo-mark" aria-hidden="true">P</span>
            Estás en el campus de prueba UMAN. Usa datos ficticios; las cuentas
            activas de UMAN podrán ver el aviso.
          </p>
        ) : null}

        {demoMode ? (
          <>
            <p className="demo-banner publish-demo-note" role="note">
              <span className="demo-mark" aria-hidden="true">D</span>
              Recorrido de demostración. Lo que escribas no se envía ni se guarda.
            </p>
            <ListingForm universityName="Comunidad de demostración" demo />
          </>
        ) : editRequested && student && university && editableListing ? (
          <ListingForm
            key={editableListing.id}
            universityName={university.name}
            listing={{
              ...editableListing,
              price: editableListing.price.toNumber(),
            }}
          />
        ) : editRequested && student ? (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <h2>No encontramos ese aviso en tu campus.</h2>
            </div>
            <p>Revisa tus avisos y vuelve a intentarlo desde la cuenta con la que lo publicaste.</p>
            <div className="form-actions">
              <Link className="button-ink" href="/mis-avisos">
                Ir a Mis avisos
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </section>
        ) : editRequested ? (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>Inicia sesión para revisar este aviso.</h2>
            </div>
            <p>Usa la cuenta institucional con la que publicaste el artículo para editarlo.</p>
            <div className="form-actions">
              <Link className="button-ink" href={editLoginHref}>
                Acceso institucional
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </section>
        ) : student && university ? (
          <ListingForm key="new" universityName={university.name} />
        ) : (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>La publicación requiere acceso institucional.</h2>
            </div>
            <p>
              {loginAvailable
                ? "Inicia sesión con la cuenta de una universidad integrada para publicar dentro de tu comunidad."
                : "Todavía no hay una universidad conectada. Puedes recorrer la demostración sin publicar ni guardar datos."}
            </p>
            <div className="form-actions">
              <Link className="button-ink" href="/publicar?demo=1">
                Probar el flujo
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className="text-action" href="/ingresar">
                Acceso institucional
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
