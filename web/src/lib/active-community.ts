import { cache } from "react";
import { prisma } from "@/lib/prisma";

// A single configured campus is admitted; the data model remains campus-scoped.
export const activeUniversitySlug =
  (process.env.ACTIVE_UNIVERSITY_SLUG ?? "uman").trim().toLowerCase();
export const activeUniversityName =
  process.env.ACTIVE_UNIVERSITY_NAME?.trim() || activeUniversitySlug.toUpperCase();

export const getActiveCommunity = cache(async () =>
  prisma.university.findFirst({
    where: { slug: activeUniversitySlug, status: "ACTIVE", isDemo: false },
    select: { id: true, name: true, slug: true, isDemo: true, isTest: true },
  }),
);
