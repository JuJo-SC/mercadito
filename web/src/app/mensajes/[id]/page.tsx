import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findConversationForStudent } from "@/lib/conversation-access";
import { getActiveStudent } from "@/lib/require-student";
import { countUnreadMessagesForStudent } from "@/lib/conversations";
import { MessageThread } from "@/components/message-thread";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

type MessagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: MessagePageProps) {
  const { id } = await params;
  const student = await getActiveStudent();
  if (!student) {
    redirect("/ingresar?returnTo=" + encodeURIComponent("/mensajes/" + id));
  }
  const conversation = await findConversationForStudent(
    id,
    student.id,
    student.universityId,
  );
  if (!conversation) notFound();

  const [latest, university, unreadMessageCount] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sequence: "desc" },
      take: 80,
      select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    }),
    prisma.university.findUnique({
      where: { id: student.universityId },
      select: { name: true, isTest: true },
    }),
    countUnreadMessagesForStudent(student.id, student.universityId, conversation.id),
  ]);
  const otherStudentName =
    conversation.buyerId === student.id
      ? conversation.seller.name ?? "Estudiante"
      : conversation.buyer.name ?? "Estudiante";
  const conditionNames: Record<string, string> = {
    NEW: "Nuevo",
    LIKE_NEW: "Como nuevo",
    GOOD: "Buen estado",
    FAIR: "Con detalles",
  };

  return (
    <>
      <SiteHeader signedIn userName={student.name} universityName={student.university.name} unreadMessageCount={unreadMessageCount} excludeUnreadConversationId={conversation.id} />
      {university?.isTest ? (
        <p className="demo-banner page-width thread-test-note" role="note">
          <span className="demo-mark" aria-hidden="true">P</span>
          Campus de prueba {university.name}. Usa solo mensajes ficticios.
        </p>
      ) : null}
      <MessageThread
        conversationId={conversation.id}
        currentUserId={student.id}
        otherStudentName={otherStudentName}
        listing={{
          id: conversation.listing.id,
          title: conversation.listing.title,
          price: conversation.listing.price.toNumber(),
          currency: conversation.listing.currency,
          condition: conditionNames[conversation.listing.condition] ?? "Condición no indicada",
          status: conversation.listing.status,
        }}
        initialMessages={latest.reverse().map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
          readAt: message.readAt?.toISOString() ?? null,
        }))}
      />
      <SiteFooter />
    </>
  );
}
