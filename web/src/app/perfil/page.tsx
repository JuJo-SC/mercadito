import Link from "next/link";
import { TaskPageHeading } from "@/components/task-page-heading";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getOwnPrivateProfile } from "@/features/auth/lib/private-profile";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import "./profile.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi perfil", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const own = await getOwnPrivateProfile();
  if (!own) redirect("/ingresar?returnTo=%2Fperfil");
  const { student, fullName } = own;
  const unread = await countUnreadMessagesForStudent(student.id, student.universityId);
  return <>
    <SiteHeader signedIn userName={student.name} universityName={student.university.name} unreadMessageCount={unread} />
    <main className="private-profile page-width task-page">
      <TaskPageHeading title="Mi perfil" description="Tu información, con la privacidad clara.">
        <p>Tu identidad en {student.university.name}. Tu nombre público identifica tus publicaciones y conversaciones; tu nombre completo solo aparece para ti.</p>
        <Link className="text-action" href="/mercadito">Volver al mercadito</Link>
      </TaskPageHeading>
      <section aria-labelledby="profile-public-name">
        <h2 id="profile-public-name">Así te ven los demás</h2>
        <p className="profile-display-name">{student.name ?? "Estudiante"}</p>
        <p>Este nombre identifica tus publicaciones y tus conversaciones.</p>
      </section>
      <section aria-labelledby="profile-faculty">
        <h2 id="profile-faculty">Facultad</h2>
        <p>{student.facultyName ?? "Pendiente de actualizar desde UAT. Cierra sesión y vuelve a entrar para consultar este dato."}</p>
        <p>Se muestra junto a tus publicaciones para orientar a los compradores.</p>
      </section>
      <section aria-labelledby="profile-private-name">
        <h2 id="profile-private-name">Solo para ti</h2>
        {fullName ? <details className="profile-private-details">
          <summary>Ver mi nombre completo</summary>
          <p className="profile-full-name">{fullName}</p>
          <p>Este nombre viene del portal UAT y solo aparece en tu perfil privado.</p>
        </details> : <p>Para actualizar tu nombre desde el portal, cierra sesión y vuelve a entrar con tu cuenta UAT.</p>}
      </section>
    </main>
  </>;
}
