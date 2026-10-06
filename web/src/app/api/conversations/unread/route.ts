import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { getActiveStudent } from "@/features/auth/lib/require-student";

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const excludeConversationId = new URL(request.url).searchParams.get("exclude") ?? undefined;
  const unreadMessageCount = await countUnreadMessagesForStudent(
    student.id,
    student.universityId,
    excludeConversationId,
  );

  return Response.json({ unreadMessageCount }, { headers: privateNoStore });
}
