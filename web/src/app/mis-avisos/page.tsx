import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { countUnreadMessagesForStudent } from "@/features/conversations/lib/conversations";
import { ManageListings } from "@/features/listings/components/manage-listings";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const student = await getActiveStudent();
  if (!student) redirect("/ingresar?returnTo=%2Fmis-avisos");

  const unreadMessageCountPromise = student
    ? countUnreadMessagesForStudent(student.id, student.universityId)
    : Promise.resolve(0);

  const listings = student
    ? await prisma.listing.findMany({
        where: {
          sellerId: student.id,
          universityId: student.universityId,
          isDemo: false,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          condition: true,
          status: true,
          createdAt: true,
          photos: { select: { position: true }, orderBy: { position: "asc" }, take: 1 },
        },
      })
    : [];

  const unreadMessageCount = await unreadMessageCountPromise;
  const serializedListings = listings.map(({ photos, ...listing }) => ({
    ...listing,
    photoUrl: photos[0] ? "/api/listings/" + encodeURIComponent(listing.id) + "/photo?position=" + photos[0].position : null,
    price: listing.price.toNumber(),
    createdAt: listing.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} universityName={student?.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="seller-page page-width task-page">
        {student ? (
          <section className="seller-inventory" aria-label="Publicaciones propias">
            <ManageListings initialListings={serializedListings} />
          </section>
        ) : (
          <section className="auth-notice">
            <p className="auth-notice-title">Tus publicaciones pertenecen a tu cuenta.</p>
            <p>Inicia sesión con la cuenta institucional para consultar lo que publicaste.</p>
            <Link className="button-ink" href="/ingresar?returnTo=%2Fmis-avisos">
              Acceso institucional
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
