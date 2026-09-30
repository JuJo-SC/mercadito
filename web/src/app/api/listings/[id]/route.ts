import { z } from "zod";
import { ListingCategory, type ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import {
  ListingPhotoInputError,
  parseListingMultipart,
  parseListingPhotos,
} from "@/lib/listing-photo";
import { MAX_LISTING_PHOTOS } from "@/lib/listing-photo-limits";

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

function listingPhotoUrl(id: string, position: number) {
  return `/api/listings/${encodeURIComponent(id)}/photo?position=${position}`;
}

function readKeptPhotoPositions(formData: FormData) {
  const value = formData.get("keepPhotoPositions");
  if (value === null) return formData.get("removePhoto") === "true" ? [] : null;
  if (typeof value !== "string") {
    throw new ListingPhotoInputError("No pudimos leer las fotos que quieres conservar.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new ListingPhotoInputError("No pudimos leer las fotos que quieres conservar.");
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length > MAX_LISTING_PHOTOS ||
    parsed.some((position) => !Number.isInteger(position) || position < 0 || position >= MAX_LISTING_PHOTOS) ||
    new Set(parsed).size !== parsed.length
  ) {
    throw new ListingPhotoInputError("Elige hasta 5 fotos válidas para la publicación.");
  }
  return parsed as number[];
}

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
      photos: { select: { position: true }, orderBy: { position: "asc" } },
      isDemo: true,
      createdAt: true,
      university: { select: { name: true, slug: true, isDemo: true } },
      seller: { select: { name: true } },
    },
  });

  if (!listing) {
    return Response.json(
      { error: "No encontramos esta publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  if (!listing.university.isDemo) {
    const student = await getActiveStudent();
    if (!student || student.universityId !== listing.universityId) {
      return Response.json(
        { error: "No encontramos esta publicación." },
        { status: 404, headers: privateNoStore },
      );
    }
  }

  const { photos, ...listingData } = listing;
  return Response.json({
    listing: {
      ...listingData,
      imageUrls: photos.map(({ position }) => listingPhotoUrl(listing.id, position)),
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
  let photos: Awaited<ReturnType<typeof parseListingPhotos>> = [];
  let keepPhotoPositions: number[] | null = null;
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
    photos = await parseListingPhotos(formData);
    keepPhotoPositions = readKeptPhotoPositions(formData);
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
    select: {
      updatedAt: true,
      photos: { select: { position: true }, orderBy: { position: "asc" } },
    },
  });

  if (!listing) {
    return Response.json(
      { error: "No encontramos esa publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const storedPositions = new Set(listing.photos.map(({ position }) => position));
  if (keepPhotoPositions?.some((position) => !storedPositions.has(position))) {
    return Response.json(
      { error: "Las fotos cambiaron mientras editabas. Recarga la publicación e inténtalo de nuevo." },
      { status: 409, headers: privateNoStore },
    );
  }
  const keptPhotos = listing.photos.filter(({ position }) =>
    keepPhotoPositions === null || keepPhotoPositions.includes(position),
  );
  if (keptPhotos.length + photos.length > MAX_LISTING_PHOTOS) {
    return Response.json(
      { error: "Una publicación puede tener hasta 5 fotos. Quita alguna para agregar otras." },
      { status: 400, headers: privateNoStore },
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

    await transaction.listingPhoto.deleteMany({
      where: {
        listingId: id,
        ...(keptPhotos.length ? { position: { notIn: keptPhotos.map(({ position }) => position) } } : {}),
      },
    });
    if (keptPhotos.length) {
      await transaction.listingPhoto.updateMany({
        where: { listingId: id },
        data: { position: { increment: MAX_LISTING_PHOTOS } },
      });
      for (const [position, photo] of keptPhotos.entries()) {
        await transaction.listingPhoto.update({
          where: {
            listingId_position: {
              listingId: id,
              position: photo.position + MAX_LISTING_PHOTOS,
            },
          },
          data: { position },
        });
      }
    }
    if (photos.length) {
      await transaction.listingPhoto.createMany({
        data: photos.map(({ position, ...photo }) => ({
          listingId: id,
          position: keptPhotos.length + position,
          ...photo,
        })),
      });
    }
    return result;
  });

  if (changed.count !== 1) {
    return Response.json(
      { error: "La publicación cambió mientras la editabas. Recarga y vuelve a intentar." },
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
      photos: { select: { position: true }, orderBy: { position: "asc" } },
    },
  });

  if (!updatedListing) {
    return Response.json(
      { error: "No encontramos esa publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const { photos: updatedPhotos, ...updatedListingData } = updatedListing;
  return Response.json({
    listing: {
      ...updatedListingData,
      imageUrls: updatedPhotos.map(({ position }) => listingPhotoUrl(id, position)),
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
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Elige un estado válido para la publicación." },
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
    select: { status: true },
  });

  if (!listing) {
    return Response.json(
      { error: "No encontramos esa publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const nextStatus = parsed.data.status;
  if (!allowedTransitions[listing.status].includes(nextStatus)) {
    return Response.json(
      { error: "Ese cambio ya no está disponible. Recarga tus publicaciones e inténtalo de nuevo." },
      { status: 409, headers: privateNoStore },
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
      { error: "El estado cambió en otra pestaña. Recarga tus publicaciones e inténtalo de nuevo." },
      { status: 409, headers: privateNoStore },
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
    return Response.json(
      { error: "No encontramos esa publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  return Response.json(
    { listing: { ...updatedListing, price: updatedListing.price.toNumber() } },
    { headers: privateNoStore },
  );
}
