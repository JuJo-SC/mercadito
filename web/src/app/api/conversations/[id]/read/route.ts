import { prisma } from "@/lib/prisma";
import { findConversationForStudent } from "@/features/conversations/lib/conversation-access";
import { getActiveStudent } from "@/features/auth/lib/require-student";

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

export async function POST(
  _request: Request,
  context: RouteContext<"/api/conversations/[id]/read">,
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

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: student.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return Response.json({ marked: true }, { headers: privateNoStore });
}
