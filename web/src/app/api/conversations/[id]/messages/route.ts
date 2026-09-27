import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findConversationForStudent } from "@/lib/conversation-access";
import { getActiveStudent } from "@/lib/require-student";

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

type MessageRecord = {
  id: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export async function GET(
  request: Request,
  context: RouteContext<"/api/conversations/[id]/messages">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const { id } = await context.params;
  const conversation = await findConversationForStudent(
    id,
    student.id,
    student.universityId,
  );
  if (!conversation) {
    return Response.json(
      { error: "No encontramos esta conversación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const url = new URL(request.url);
  const afterId = url.searchParams.get("after")?.trim();
  let messages: MessageRecord[];
  if (afterId) {
    const anchor = await prisma.message.findFirst({
      where: { id: afterId, conversationId: conversation.id },
      select: { id: true, sequence: true },
    });
    if (!anchor) {
      return Response.json(
        { error: "Recarga la conversación para continuar." },
        { status: 400, headers: privateNoStore },
      );
    }
    messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        sequence: { gt: anchor.sequence },
      },
      orderBy: { sequence: "asc" },
      take: 60,
      select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    });
  } else {
    const latest = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sequence: "desc" },
      take: 80,
      select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    });
    messages = latest.reverse();
  }

  return Response.json(
    { messages },
    { headers: privateNoStore },
  );
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/conversations/[id]/messages">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const { id } = await context.params;
  const conversation = await findConversationForStudent(
    id,
    student.id,
    student.universityId,
  );
  if (!conversation) {
    return Response.json(
      { error: "No encontramos esta conversación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Escribe un mensaje de hasta 2,000 caracteres." },
      { status: 400, headers: privateNoStore },
    );
  }

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.message.create({
      data: {
        conversationId: conversation.id,
        senderId: student.id,
        body: parsed.data.body,
      },
      select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    });
    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  return Response.json({ message }, { status: 201, headers: privateNoStore });
}
