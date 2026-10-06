import { prisma } from "@/lib/prisma";

type MessageRequestScope = {
  conversationId?: string;
  listingId?: string;
  universityId?: string;
};

type StoredMessageRequest = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export type MessageRequestReplay =
  | { kind: "replayed"; message: StoredMessageRequest }
  | { kind: "conflict" };

export async function findMessageRequestReplay(
  clientRequestId: string | undefined,
  senderId: string,
  body: string,
  scope: MessageRequestScope,
): Promise<MessageRequestReplay | null> {
  if (!clientRequestId) return null;

  const stored = await prisma.message.findUnique({
    where: { clientRequestId },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      body: true,
      readAt: true,
      createdAt: true,
      conversation: { select: { listingId: true, universityId: true } },
    },
  });
  if (!stored) return null;

  const matches =
    stored.senderId === senderId &&
    stored.body === body &&
    (!scope.conversationId || stored.conversationId === scope.conversationId) &&
    (!scope.listingId || stored.conversation.listingId === scope.listingId) &&
    (!scope.universityId || stored.conversation.universityId === scope.universityId);

  if (!matches) return { kind: "conflict" };

  return {
    kind: "replayed",
    message: {
      id: stored.id,
      conversationId: stored.conversationId,
      senderId: stored.senderId,
      body: stored.body,
      readAt: stored.readAt,
      createdAt: stored.createdAt,
    },
  };
}

export function prismaErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}
