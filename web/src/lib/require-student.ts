import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getActiveStudent() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  return prisma.user.findFirst({
    where: {
      id,
      role: "STUDENT",
      status: "ACTIVE",
      isDemo: false,
      university: { status: "ACTIVE", isDemo: false },
    },
    select: {
      id: true,
      name: true,
      universityId: true,
      role: true,
      status: true,
    },
  });
}
