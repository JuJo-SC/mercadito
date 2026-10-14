import { getActiveStudent } from "@/features/auth/lib/require-student";
import { prisma } from "@/lib/prisma";

// Ownership always comes from the active session; this function accepts no target user ID.
export async function getOwnPrivateProfile() {
  const student = await getActiveStudent();
  if (!student) return null;
  const profile = await prisma.studentPrivateProfile.findUnique({
    where: { userId: student.id }, select: { fullName: true },
  });
  return { student, fullName: profile?.fullName ?? null };
}
