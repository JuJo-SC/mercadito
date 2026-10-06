import { prisma } from "@/lib/prisma";

export async function findConversationForStudent(
  conversationId: string,
  studentId: string,
  universityId: string,
) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      universityId,
      OR: [{ buyerId: studentId }, { sellerId: studentId }],
      university: { status: "ACTIVE", isDemo: false },
      listing: { isDemo: false },
      buyer: { role: "STUDENT", status: "ACTIVE", isDemo: false },
      seller: { role: "STUDENT", status: "ACTIVE", isDemo: false },
    },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      listing: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          condition: true,
          status: true,
        },
      },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
  });
}
