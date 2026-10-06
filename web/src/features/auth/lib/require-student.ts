import { auth } from "@/features/auth/auth";
import { prisma } from "@/lib/prisma";
import { activeUniversitySlug } from "@/features/community/lib/active-community";

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
      university: { slug: activeUniversitySlug, status: "ACTIVE", isDemo: false },
    },
    select: {
      id: true,
      name: true,
      universityId: true,
      role: true,
      status: true,
      university: {
        select: { name: true },
      },
    },
  });
}
