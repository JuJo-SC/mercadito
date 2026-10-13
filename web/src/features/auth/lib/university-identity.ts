import type { University } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { activeUniversitySlug } from "@/features/community/lib/active-community";

import { isUatLoginEnabled } from "@/features/auth/lib/uat-access";

type IdentityProfile = Record<string, unknown>;

function claimText(profile: IdentityProfile, name: string): string | null {
  const value = profile[name];
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return null;
}

export async function resolveActiveStudent(
  profile: IdentityProfile,
): Promise<University | null> {
  const identityKey = claimText(profile, "university_id");
  if (!identityKey) return null;

  const university = await prisma.university.findUnique({
    where: { identityKey },
  });

  if (
    !university ||
    university.status !== "ACTIVE" ||
    university.slug !== activeUniversitySlug ||
    university.isDemo ||
    (university.slug === "uat" && !isUatLoginEnabled()) ||
    !university.studentStatusClaim ||
    university.studentStatusValue === null
  ) {
    return null;
  }

  const studentStatus = claimText(profile, university.studentStatusClaim);
  if (studentStatus !== university.studentStatusValue) return null;

  const subject = claimText(profile, "sub");
  if (!subject) return null;

  return university;
}
