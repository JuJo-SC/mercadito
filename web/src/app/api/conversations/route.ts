import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { listConversationsForStudent } from "@/features/conversations/lib/conversations";
import { findMessageRequestReplay, prismaErrorCode } from "@/features/conversations/lib/message-idempotency";

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

const startConversationSchema = z.object({
  listingId: z.string().trim().min(1).max(191),
  body: z.string().trim().min(1).max(2000),
  clientRequestId: z.string().uuid().optional(),
});

export async function GET() {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const conversations = await listConversationsForStudent(
    student.id,
    student.universityId,
  );
  return Response.json(
    { conversations },
    { headers: privateNoStore },
  );
}

export async function POST(request: Request) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Escribe un mensaje de hasta 2,000 caracteres." },
      { status: 400, headers: privateNoStore },
    );
  }

  const { listingId, body: firstMessage, clientRequestId } = parsed.data;
  const replayScope = { listingId, universityId: student.universityId };
  const existingMessage = await findMessageRequestReplay(
    clientRequestId,
    student.id,
    firstMessage,
    replayScope,
  );
  if (existingMessage?.kind === "conflict") {
    return Response.json(
      { error: "Esta solicitud ya se usó para otro mensaje. Recarga la publicación antes de intentarlo de nuevo." },
      { status: 409, headers: privateNoStore },
    );
  }
  if (existingMessage?.kind === "replayed") {
    return Response.json(
      {
        conversationId: existingMessage.message.conversationId,
        messageId: existingMessage.message.id,
      },
      { status: 200, headers: privateNoStore },
    );
  }

  let result: Awaited<ReturnType<typeof createConversationMessage>>;
  try {
    result = await createConversationMessage({
      listingId,
      body: firstMessage,
      clientRequestId,
      studentId: student.id,
      universityId: student.universityId,
    });
  } catch (error) {
    const errorCode = prismaErrorCode(error);
    if (clientRequestId && (errorCode === "P2002" || errorCode === "P2034")) {
      const replay = await findMessageRequestReplay(
        clientRequestId,
        student.id,
        firstMessage,
        replayScope,
      );
      if (replay?.kind === "replayed") {
        return Response.json(
          { conversationId: replay.message.conversationId, messageId: replay.message.id },
          { status: 200, headers: privateNoStore },
        );
      }
      if (replay?.kind === "conflict") {
        return Response.json(
          { error: "Esta solicitud ya se usó para otro mensaje. Recarga la publicación antes de intentarlo de nuevo." },
          { status: 409, headers: privateNoStore },
        );
      }
    }
    if (errorCode === "P2034") {
      return Response.json(
        { error: "La publicación cambió mientras escribías. Recarga y vuelve a intentar." },
        { status: 409, headers: privateNoStore },
      );
    }
    throw error;
  }

  if (result.kind === "unavailable") {
    return Response.json(
      { error: "Esta publicación ya no está disponible para iniciar una conversación." },
      { status: 404, headers: privateNoStore },
    );
  }
  if (result.kind === "own") {
    return Response.json(
      { error: "No puedes iniciar una conversación sobre tu propia publicación." },
      { status: 400, headers: privateNoStore },
    );
  }
  if (result.kind === "conflict") {
    return Response.json(
      { error: "Esta publicación cambió de vendedor. Recarga la página e inténtalo de nuevo." },
      { status: 409, headers: privateNoStore },
    );
  }

  return Response.json(
    { conversationId: result.conversationId, messageId: result.messageId },
    { status: 201, headers: privateNoStore },
  );
}

async function createConversationMessage({
  listingId,
  body,
  clientRequestId,
  studentId,
  universityId,
}: {
  listingId: string;
  body: string;
  clientRequestId?: string;
  studentId: string;
  universityId: string;
}) {
  return prisma.$transaction(
    async (transaction) => {
      const listing = await transaction.listing.findFirst({
        where: {
          id: listingId,
          universityId,
          status: "PUBLISHED",
          isDemo: false,
          university: { status: "ACTIVE", isDemo: false },
          seller: { role: "STUDENT", status: "ACTIVE", isDemo: false },
        },
        select: { id: true, universityId: true, sellerId: true },
      });

      if (!listing) return { kind: "unavailable" as const };
      if (listing.sellerId === studentId) return { kind: "own" as const };

      const conversation = await transaction.conversation.upsert({
        where: {
          listingId_buyerId: {
            listingId: listing.id,
            buyerId: studentId,
          },
        },
        create: {
          universityId: listing.universityId,
          listingId: listing.id,
          buyerId: studentId,
          sellerId: listing.sellerId,
        },
        update: {},
        select: { id: true, sellerId: true },
      });

      if (conversation.sellerId !== listing.sellerId) {
        return { kind: "conflict" as const };
      }

      const message = await transaction.message.create({
        data: {
          conversationId: conversation.id,
          senderId: studentId,
          body,
          clientRequestId,
        },
        select: { id: true },
      });
      await transaction.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return {
        kind: "created" as const,
        conversationId: conversation.id,
        messageId: message.id,
      };
    },
    { isolationLevel: "Serializable" },
  );
}
