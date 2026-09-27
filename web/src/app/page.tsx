import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { countUnreadMessagesForStudent } from "@/lib/conversations";
import { Marketplace } from "@/components/marketplace";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const student = await getActiveStudent();
  const unreadMessageCountPromise = student
    ? countUnreadMessagesForStudent(student.id, student.universityId)
    : Promise.resolve(0);
  const universities = await prisma.university.findMany({
    where: student
      ? { id: student.universityId, status: "ACTIVE", isDemo: false }
      : { status: "ACTIVE", isDemo: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, isDemo: true, isTest: true },
    take: 1,
  });
  const university = universities[0] ?? null;
  const unreadMessageCount = await unreadMessageCountPromise;
  const initialListings = university
    ? await prisma.listing.findMany({
        where: { universityId: university.id, status: "PUBLISHED" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 24,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          category: true,
          condition: true,
          imageUrl: true,
          photo: { select: { listingId: true } },
          isDemo: true,
          createdAt: true,
          seller: { select: { id: true, name: true } },
        },
      })
    : [];
  const initialTotal = university
    ? await prisma.listing.count({
        where: { universityId: university.id, status: "PUBLISHED" },
      })
    : 0;
  const realUniversityCount = student
    ? 0
    : await prisma.university.count({
        where: { status: "ACTIVE", isDemo: false },
      });

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} unreadMessageCount={unreadMessageCount} />
      <main>
        <Marketplace
          university={university}
          initialTotal={initialTotal}
          initialListings={initialListings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price.toNumber(),
            currency: listing.currency,
            category: listing.category,
            condition: listing.condition,
            imageUrl: listing.photo
              ? `/api/listings/${encodeURIComponent(listing.id)}/photo`
              : null,
            isDemo: listing.isDemo,
            createdAt: listing.createdAt.toISOString(),
            seller: listing.seller,
          }))}
          canSignIn={realUniversityCount > 0}
          applicationIntakeEnabled={
            process.env.ENABLE_UNIVERSITY_APPLICATIONS === "true"
          }
          currentUserId={student?.id ?? null}
          signedIn={Boolean(student)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
