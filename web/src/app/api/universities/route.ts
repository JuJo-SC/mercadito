import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";

export const runtime = "nodejs";

export async function GET() {
  const student = await getActiveStudent();
  const universities = await prisma.university.findMany({
    where: student
      ? { id: student.universityId, status: "ACTIVE", isDemo: false }
      : { status: "ACTIVE", isDemo: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isDemo: true,
    },
  });

  return Response.json({ universities });
}
