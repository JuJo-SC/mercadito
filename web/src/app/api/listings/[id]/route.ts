import { z } from "zod";
import { ListingCategory, type ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";

const updateListingSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "RESERVED", "SOLD", "ARCHIVED"]),
});

const editListingSchema = z.object({
  title: z.string().trim().min(4).max(90),
  description: z.string().trim().min(10).max(2000),
  price: z.number().finite().min(0).max(1000000),
  category: z.enum(ListingCategory),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]),
});

const allowedTransitions: Record<ListingStatus, readonly ListingStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["RESERVED", "SOLD", "ARCHIVED"],
  RESERVED: ["PUBLISHED", "SOLD", "ARCHIVED"],
  SOLD: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["PUBLISHED"],
};

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

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
    return Response.json(
      { error: "No encontramos este artículo." },
      { status: 404, headers: privateNoStore },
    );
  }

  if (!listing.university.isDemo) {
    const student = await getActiveStudent();
    if (!student || student.universityId !== listing.universityId) {
      return Response.json(
        { error: "No encontramos este artículo." },
        { status: 404, headers: privateNoStore },
      );
    }
  }

  return Response.json({
    listing: { ...listing, price: listing.price.toNumber() },
  }, { headers: privateNoStore });
}


export async function PUT(
  request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json({ error: "Inicia sesión con tu cuenta institucional." }, { status: 401 });
  }

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = editListingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Revisa el título, la descripción, el precio y la categoría." },
      { status: 400 },
    );
  }

  const listing = await prisma.listing.findFirst({
    where: {
      id,
      sellerId: student.id,
      universityId: student.universityId,
      isDemo: false,
      university: { status: "ACTIVE", isDemo: false },
    },
    select: { updatedAt: true },
  });

  if (!listing) {
    return Response.json({ error: "No encontramos ese aviso." }, { status: 404 });
  }

  const changed = await prisma.listing.updateMany({
    where: {
      id,
      sellerId: student.id,
      universityId: student.universityId,
      isDemo: false,
      updatedAt: listing.updatedAt,
      university: { status: "ACTIVE", isDemo: false },
    },
    data: parsed.data,
  });

  if (changed.count !== 1) {
    return Response.json(
      { error: "El aviso cambió mientras lo editabas. Recarga y vuelve a intentar." },
      { status: 409 },
    );
  }

  const updatedListing = await prisma.listing.findFirst({
    where: {
      id,
      sellerId: student.id,
      universityId: student.universityId,
      isDemo: false,
      university: { status: "ACTIVE", isDemo: false },
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      category: true,
      condition: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!updatedListing) {
    return Response.json({ error: "No encontramos ese aviso." }, { status: 404 });
  }

  return Response.json({
    listing: { ...updatedListing, price: updatedListing.price.toNumber() },
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json({ error: "Inicia sesión con tu cuenta institucional." }, { status: 401 });
  }

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Elige un estado válido para el aviso." }, { status: 400 });
  }

  const listing = await prisma.listing.findFirst({
    where: {
      id,
      sellerId: student.id,
      universityId: student.universityId,
      isDemo: false,
      university: { status: "ACTIVE", isDemo: false },
    },
    select: { status: true },
  });

  if (!listing) {
    return Response.json({ error: "No encontramos ese aviso." }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (!allowedTransitions[listing.status].includes(nextStatus)) {
    return Response.json(
      { error: "Ese cambio ya no está disponible. Recarga tus avisos e inténtalo de nuevo." },
      { status: 409 },
    );
  }

  const changed = await prisma.listing.updateMany({
    where: {
      id,
      sellerId: student.id,
      universityId: student.universityId,
      isDemo: false,
      status: listing.status,
      university: { status: "ACTIVE", isDemo: false },
    },
    data: { status: nextStatus },
  });

  if (changed.count !== 1) {
    return Response.json(
      { error: "El estado cambió en otra pestaña. Recarga tus avisos e inténtalo de nuevo." },
      { status: 409 },
    );
  }

  const updatedListing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      category: true,
      condition: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!updatedListing) {
    return Response.json({ error: "No encontramos ese aviso." }, { status: 404 });
  }

  return Response.json({
    listing: { ...updatedListing, price: updatedListing.price.toNumber() },
  });
}
