import { prisma } from "@/lib/prisma";

export async function listConversationsForStudent(
  studentId: string,
  universityId: string,
) {
  const conversations = await prisma.conversation.findMany({
    where: {
      universityId,
      OR: [{ buyerId: studentId }, { sellerId: studentId }],
      university: { status: "ACTIVE", isDemo: false },
      listing: { isDemo: false },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      updatedAt: true,
      buyerId: true,
      listing: {
        select: { id: true, title: true, price: true, currency: true, status: true },
      },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  const ids = conversations.map((conversation) => conversation.id);
  const unreadGroups = ids.length
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: ids },
          senderId: { not: studentId },
          readAt: null,
        },
        _count: { _all: true },
      })
    : [];
  const unreadByConversation = new Map(
    unreadGroups.map((group) => [group.conversationId, group._count._all]),
  );

  return conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      updatedAt: conversation.updatedAt.toISOString(),
      listing: {
        id: conversation.listing.id,
        title: conversation.listing.title,
        price: conversation.listing.price.toNumber(),
        currency: conversation.listing.currency,
        status: conversation.listing.status,
      },
      otherStudentName:
        conversation.buyerId === studentId
          ? conversation.seller.name ?? "Estudiante"
          : conversation.buyer.name ?? "Estudiante",
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.body,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    };
  });
}
