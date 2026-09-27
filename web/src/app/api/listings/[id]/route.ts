import { z } from "zod";
import { ListingCategory, type ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import {
  ListingPhotoInputError,
  parseListingMultipart,
  parseListingPhoto,
} from "@/lib/listing-photo";

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
      photo: { select: { listingId: true } },
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

  const { photo, ...listingData } = listing;
  return Response.json({
    listing: {
      ...listingData,
      imageUrl: photo ? `/api/listings/${encodeURIComponent(listing.id)}/photo` : null,
      price: listing.price.toNumber(),
    },
  }, { headers: privateNoStore });
}


export async function PUT(
  request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const { id } = await context.params;
  let content: z.infer<typeof editListingSchema>;
  let photo: Awaited<ReturnType<typeof parseListingPhoto>> = null;
  let removePhoto = false;
  try {
    const formData = await parseListingMultipart(request);
    const rawPrice = formData.get("price");
    const parsed = editListingSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      price: typeof rawPrice === "string" && rawPrice.trim() ? Number(rawPrice) : Number.NaN,
      category: formData.get("category"),
      condition: formData.get("condition"),
    });
    if (!parsed.success) {
      return Response.json(
        { error: "Revisa el título, la descripción, el precio y la categoría." },
        { status: 400, headers: privateNoStore },
      );
    }
    content = parsed.data;
    photo = await parseListingPhoto(formData);
    removePhoto = formData.get("removePhoto") === "true";
    if (photo && removePhoto) {
      return Response.json(
        { error: "Elige entre reemplazar la foto o quitarla." },
        { status: 400, headers: privateNoStore },
      );
    }
  } catch (error) {
    if (error instanceof ListingPhotoInputError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: privateNoStore },
      );
    }
    return Response.json(
      { error: "No pudimos leer el formulario. Intenta de nuevo." },
      { status: 400, headers: privateNoStore },
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
    return Response.json(
      { error: "No encontramos ese aviso." },
      { status: 404, headers: privateNoStore },
    );
  }

  const changed = await prisma.$transaction(async (transaction) => {
    const result = await transaction.listing.updateMany({
      where: {
        id,
        sellerId: student.id,
        universityId: student.universityId,
        isDemo: false,
        updatedAt: listing.updatedAt,
        university: { status: "ACTIVE", isDemo: false },
      },
      data: content,
    });
    if (result.count !== 1) return result;

    if (photo) {
      await transaction.listingPhoto.upsert({
        where: { listingId: id },
        create: { listingId: id, ...photo },
        update: photo,
      });
    } else if (removePhoto) {
      await transaction.listingPhoto.deleteMany({ where: { listingId: id } });
    }
    return result;
  });

  if (changed.count !== 1) {
    return Response.json(
      { error: "El aviso cambió mientras lo editabas. Recarga y vuelve a intentar." },
      { status: 409, headers: privateNoStore },
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
      photo: { select: { listingId: true } },
    },
  });

  if (!updatedListing) {
    return Response.json(
      { error: "No encontramos ese aviso." },
      { status: 404, headers: privateNoStore },
    );
  }

  const { photo: updatedPhoto, ...updatedListingData } = updatedListing;
  return Response.json({
    listing: {
      ...updatedListingData,
      imageUrl: updatedPhoto ? `/api/listings/${encodeURIComponent(id)}/photo` : null,
      price: updatedListing.price.toNumber(),
    },
  }, { headers: privateNoStore });
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
