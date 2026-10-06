import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { Marketplace } from "@/features/listings/components/marketplace";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const student = await getActiveStudent();
  if (!student) redirect("/ingresar?returnTo=%2Fmercadito");

  const university = await prisma.university.findFirst({
    where: { id: student.universityId, status: "ACTIVE", isDemo: false },
    select: { id: true, name: true, slug: true, isDemo: true, isTest: true },
  });
  if (!university) redirect("/ingresar");

  const where = { universityId: university.id, status: "PUBLISHED" as const };
  const listingSelect = {
    id: true,
    title: true,
    description: true,
    price: true,
    currency: true,
    category: true,
    condition: true,
    imageUrl: true,
    photos: { select: { position: true }, orderBy: { position: "asc" as const } },
    isDemo: true,
    createdAt: true,
    seller: { select: { id: true, name: true } },
    _count: { select: { conversations: true } },
  };

  const [total, recentListings, interestListings, unreadMessageCount] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 24,
      select: listingSelect,
    }),
    prisma.listing.findMany({
      where,
      orderBy: [
        { conversations: { _count: "desc" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: 24,
      select: listingSelect,
    }),
    countUnreadMessagesForStudent(student.id, student.universityId),
  ]);

  const hasInterestSignals = interestListings.some((listing) => listing._count.conversations > 0);
  const initialSort = hasInterestSignals ? "INTEREST" : "RECENT";
  const initialListings = hasInterestSignals ? interestListings : recentListings;

  return (
    <>
      <SiteHeader
        signedIn
        userName={student.name}
        universityName={student.university.name}
        unreadMessageCount={unreadMessageCount}
      />
      <main>
        <Marketplace
          university={university}
          initialTotal={total}
          initialListings={initialListings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price.toNumber(),
            currency: listing.currency,
            category: listing.category,
            condition: listing.condition,
            imageUrls: listing.photos.map(
              ({ position }) => `/api/listings/${encodeURIComponent(listing.id)}/photo?position=${position}`,
            ),
            isDemo: listing.isDemo,
            createdAt: listing.createdAt.toISOString(),
            seller: listing.seller,
          }))}
          initialSort={initialSort}
          hasInterestSignals={hasInterestSignals}
          currentUserId={student.id}
        />
      </main>
      <SiteFooter />
    </>
  );
}
