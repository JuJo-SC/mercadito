import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UniversityRegistrationForm } from "@/components/university-registration-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getActiveStudent } from "@/lib/require-student";
import { countUnreadMessagesForStudent } from "@/lib/conversations";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage() {
  const student = await getActiveStudent();
  const unreadMessageCount = student
    ? await countUnreadMessagesForStudent(student.id, student.universityId)
    : 0;
  const applicationIntakeEnabled =
    process.env.ENABLE_UNIVERSITY_APPLICATIONS === "true";

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} unreadMessageCount={unreadMessageCount} />
      <main className="form-page page-width">
        <Link className="back-link" href="/">
          <ArrowRight aria-hidden="true" size={16} />
          Volver al mercadito
        </Link>
        <div className="form-intro">
          <h1>Hagamos espacio para tu comunidad.</h1>
          <p>
            {applicationIntakeEnabled
              ? "Comparte los datos de tu universidad. El equipo revisará la solicitud y coordinará la integración institucional antes de habilitar el acceso estudiantil."
              : "Cada universidad tendrá un espacio propio y acceso institucional. La recepción de solicitudes se abrirá cuando publiquemos el aviso de privacidad y el canal de atención."}
          </p>
        </div>
        <UniversityRegistrationForm enabled={applicationIntakeEnabled} />
        {applicationIntakeEnabled ? (
          <p className="form-footnote">
            En esta etapa se solicitan datos de la universidad y una persona de
            contacto. No agregues datos personales de alumnos.
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
