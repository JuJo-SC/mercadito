import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findConversationForStudent } from "@/lib/conversation-access";
import { getActiveStudent } from "@/lib/require-student";
import { MessageThread } from "@/components/message-thread";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

type MessagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: MessagePageProps) {
  const student = await getActiveStudent();
  if (!student) redirect("/ingresar?returnTo=%2Fmensajes");

  const { id } = await params;
  const conversation = await findConversationForStudent(
    id,
    student.id,
    student.universityId,
  );
  if (!conversation) notFound();

  const [latest, university] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 80,
      select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    }),
    prisma.university.findUnique({
      where: { id: student.universityId },
      select: { name: true, isTest: true },
    }),
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
      <SiteHeader signedIn userName={student.name} />
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
