import Link from "next/link";
import { TaskPageHeading } from "@/components/task-page-heading";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listConversationsForStudent } from "@/lib/conversations";
import { getActiveStudent } from "@/lib/require-student";
import { ConversationInbox } from "@/components/conversation-inbox";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const student = await getActiveStudent();
  if (!student) redirect("/ingresar?returnTo=%2Fmensajes");

  const [university, conversations] = await Promise.all([
    prisma.university.findUnique({
      where: { id: student.universityId },
      select: { name: true, isTest: true },
    }),
    listConversationsForStudent(student.id, student.universityId),
  ]);

  const unreadMessageCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  return (
    <>
      <SiteHeader signedIn userName={student.name} universityName={student.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="messages-page page-width task-page">
        <TaskPageHeading title="Mensajes" testCampus={Boolean(university?.isTest)}>
          <p>Retoma cada intercambio desde la publicación que lo inició. Puedes coordinar aquí y decidir con la otra persona si continúan por otro medio.</p>
          {university?.isTest ? <p>Campus de prueba {university.name}. Escribe solo mensajes ficticios.</p> : null}
          <p>Mercadito no procesa ni resguarda pagos. Cualquier pago se acuerda fuera de la plataforma.</p>
          <Link className="back-link" href="/mercadito"><ArrowRight aria-hidden="true" size={16} />Volver al mercadito</Link>
        </TaskPageHeading>

        <ConversationInbox
          initialConversations={conversations}
          currentUserId={student.id}
        />
      </main>
      <SiteFooter />
    </>
  );
}
