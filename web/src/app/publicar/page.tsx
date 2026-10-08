import { PublicFeatureIntro } from "@/components/public-feature-guide";
import Link from "next/link";
import { TaskPageHeading } from "@/components/task-page-heading";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { ListingForm } from "@/features/listings/components/listing-form";
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
  if (!student && !demoMode && !editRequested) return <PublicFeatureIntro feature="publish" />;
  const unreadMessageCountPromise = student
    ? countUnreadMessagesForStudent(student.id, student.universityId)
    : Promise.resolve(0);
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
          photos: { select: { position: true }, orderBy: { position: "asc" } },
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

  const unreadMessageCount = await unreadMessageCountPromise;

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} universityName={student?.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="form-page page-width publish-page task-page">
        <TaskPageHeading
          title={demoMode ? "Probar publicación" : editRequested ? "Editar publicación" : "Publicar producto"}
          testCampus={Boolean(student && university?.isTest)}
          demo={demoMode}
        >
          <p>
            {demoMode
              ? "Recorre los pasos de publicación y revisa cómo se verá tu publicación en el mercadito."
              : editRequested
                ? "Corrige los datos de la publicación. Guardar conserva su disponibilidad actual."
                : "Describe lo que ofreces con claridad. Solo estudiantes activos de tu universidad podrán ver esta publicación."}
          </p>
          {student && university?.isTest ? <p>Estás en el campus de prueba UMAN. Usa datos ficticios; las cuentas activas de UMAN podrán ver la publicación.</p> : null}
          {demoMode ? <p>Recorrido de demostración. Lo que escribas no se envía ni se guarda.</p> : null}
          <Link className="back-link" href={editRequested ? "/mis-avisos" : demoMode ? "/publicar" : student ? "/mercadito" : "/"}>
            <ArrowRight aria-hidden="true" size={16} />
            {editRequested ? "Volver a Mis publicaciones" : demoMode ? "Salir del recorrido" : student ? "Volver al mercadito" : "Volver al inicio"}
          </Link>
        </TaskPageHeading>

        {demoMode ? (
          <>
            <ListingForm universityName="Comunidad de demostración" demo />
          </>
        ) : editRequested && student && university && editableListing ? (
          <ListingForm
            key={editableListing.id}
            universityName={university.name}
            listing={{
              id: editableListing.id,
              title: editableListing.title,
              description: editableListing.description,
              price: editableListing.price.toNumber(),
              category: editableListing.category,
              condition: editableListing.condition,
              status: editableListing.status,
              imageUrls: editableListing.photos.map(
                ({ position }) => `/api/listings/${encodeURIComponent(editableListing.id)}/photo?position=${position}`,
              ),
            }}
          />
        ) : editRequested && student ? (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <h2>No encontramos esa publicación en tu campus.</h2>
            </div>
            <p>Revisa tus publicaciones y vuelve a intentarlo desde la cuenta con la que lo publicaste.</p>
            <div className="form-actions">
              <Link className="button-ink" href="/mis-avisos">
                Ir a Mis publicaciones
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </section>
        ) : editRequested ? (
          <section className="auth-notice">
            <div className="auth-panel-heading">
              <LockKeyhole aria-hidden="true" size={22} strokeWidth={1.7} />
              <h2>Inicia sesión para editar esta publicación.</h2>
            </div>
            <p>Usa la cuenta institucional con la que publicaste este producto para editarlo.</p>
            <div className="form-actions">
              <Link className="button-ink" href={editLoginHref}>
                Acceso institucional
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </section>
        ) : student && university ? (
          <ListingForm key="new" universityName={university.name} studentId={student.id} />
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
