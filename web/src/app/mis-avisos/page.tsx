import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { countUnreadMessagesForStudent } from "@/lib/conversations";
import { ManageListings } from "@/components/manage-listings";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const student = await getActiveStudent();
  const unreadMessageCountPromise = student
    ? countUnreadMessagesForStudent(student.id, student.universityId)
    : Promise.resolve(0);
  const university = student
    ? await prisma.university.findUnique({
        where: { id: student.universityId },
        select: { name: true, isTest: true },
      })
    : null;
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
        },
      })
    : [];

  const unreadMessageCount = await unreadMessageCountPromise;
  const serializedListings = listings.map((listing) => ({
    ...listing,
    price: listing.price.toNumber(),
    createdAt: listing.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader signedIn={Boolean(student)} userName={student?.name} universityName={student?.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="form-page page-width seller-page">
        <Link className="back-link" href="/">
          <ArrowRight aria-hidden="true" size={16} />
          Volver al mercadito
        </Link>
        <div className="form-intro">
          <h1>Tus publicaciones, a tu ritmo.</h1>
          <p>
            Solo estudiantes activos de tu campus pueden verlos. Actualiza su estado desde aquí.
          </p>
          {student ? (
            <Link className="text-action seller-new-listing" href="/publicar">
              Crear otra publicación
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          ) : null}
        </div>

        {student && university?.isTest ? (
          <p className="demo-banner publish-demo-note" role="note">
            <span className="demo-mark" aria-hidden="true">P</span>
            Campus de prueba {university.name}. Usa datos ficticios.
          </p>
        ) : null}

        {student ? (
          <section className="seller-inventory" aria-labelledby="seller-inventory-title">
            <div className="seller-inventory-heading">
              <h2 id="seller-inventory-title">Tu índice</h2>
              <p>{listings.length} {listings.length === 1 ? "publicación" : "publicaciones"}</p>
            </div>
            <ManageListings initialListings={serializedListings} />
          </section>
        ) : (
          <section className="auth-notice">
            <p className="auth-notice-title">Tus publicaciones pertenecen a tu cuenta.</p>
            <p>Inicia sesión con la cuenta institucional para consultar lo que publicaste.</p>
            <Link className="button-ink" href="/ingresar">
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
