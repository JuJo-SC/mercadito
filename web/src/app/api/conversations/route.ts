import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { listConversationsForStudent } from "@/lib/conversations";

export const runtime = "nodejs";

const startConversationSchema = z.object({
  listingId: z.string().trim().min(1).max(191),
  body: z.string().trim().min(1).max(2000),
});

export async function GET() {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const conversations = await listConversationsForStudent(
    student.id,
    student.universityId,
  );
  return Response.json(
    { conversations },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Escribe un mensaje de hasta 2,000 caracteres." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const listing = await prisma.listing.findFirst({
    where: {
      id: parsed.data.listingId,
      universityId: student.universityId,
      status: "PUBLISHED",
      isDemo: false,
      university: { status: "ACTIVE", isDemo: false },
      seller: { role: "STUDENT", status: "ACTIVE", isDemo: false },
    },
    select: { id: true, universityId: true, sellerId: true },
  });

  if (!listing) {
    return Response.json(
      { error: "Este artículo ya no está disponible para iniciar una conversación." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (listing.sellerId === student.id) {
    return Response.json(
      { error: "No puedes iniciar una conversación sobre tu propio aviso." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await prisma.$transaction(async (transaction) => {
    const conversation = await transaction.conversation.upsert({
      where: {
        listingId_buyerId: {
          listingId: listing.id,
          buyerId: student.id,
        },
      },
      create: {
        universityId: listing.universityId,
        listingId: listing.id,
        buyerId: student.id,
        sellerId: listing.sellerId,
      },
      update: {},
      select: { id: true, sellerId: true },
    });

    if (conversation.sellerId !== listing.sellerId) {
      return { conflict: true as const };
    }

    const message = await transaction.message.create({
      data: {
        conversationId: conversation.id,
        senderId: student.id,
        body: parsed.data.body,
      },
      select: { id: true },
    });
    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return {
      conflict: false as const,
      conversationId: conversation.id,
      messageId: message.id,
    };
  });

  if (result.conflict) {
    return Response.json(
      { error: "Este aviso cambió de vendedor. Recarga la página e inténtalo de nuevo." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { conversationId: result.conversationId, messageId: result.messageId },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
