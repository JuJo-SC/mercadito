import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  const { id } = await context.params;
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      university: { status: "ACTIVE" },
    },
    select: {
      id: true,
      universityId: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      category: true,
      condition: true,
      imageUrl: true,
      isDemo: true,
      createdAt: true,
      university: { select: { name: true, slug: true, isDemo: true } },
      seller: { select: { name: true } },
    },
  });

  if (!listing) {
    return Response.json({ error: "No encontramos este artículo." }, { status: 404 });
  }

  if (!listing.university.isDemo) {
    const student = await getActiveStudent();
    if (!student || student.universityId !== listing.universityId) {
      return Response.json({ error: "No encontramos este artículo." }, { status: 404 });
    }
  }

  return Response.json({
    listing: { ...listing, price: listing.price.toNumber() },
  });
}
