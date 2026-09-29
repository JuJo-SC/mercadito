import { createHash } from "node:crypto";
import { z } from "zod";
import { ListingCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import {
  ListingPhotoInputError,
  parseListingMultipart,
  parseListingPhoto,
} from "@/lib/listing-photo";

export const runtime = "nodejs";

const privateNoStore = { "Cache-Control": "private, no-store" };

const createListingSchema = z.object({
  title: z.string().trim().min(4).max(90),
  description: z.string().trim().min(10).max(2000),
  price: z.number().finite().min(0).max(1000000),
  category: z.enum(ListingCategory),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]),
  publish: z.boolean().default(true),
  submissionId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("university")?.trim().toLowerCase();
  if (!slug) {
    return Response.json(
      { error: "Indica la universidad que quieres explorar." },
      { status: 400, headers: privateNoStore },
    );
  }

  const university = await prisma.university.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, name: true, slug: true, isDemo: true },
  });

  if (!university) {
    return Response.json(
      { error: "No encontramos esa comunidad." },
      { status: 404, headers: privateNoStore },
    );
  }

  if (!university.isDemo) {
    const student = await getActiveStudent();
    if (!student || student.universityId !== university.id) {
      return Response.json(
        { error: "No encontramos esa comunidad." },
        { status: 404, headers: privateNoStore },
      );
    }
  }

  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const cursorId = url.searchParams.get("cursor")?.trim();
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("q")?.trim().slice(0, 80);
  const requestedSort = url.searchParams.get("sort") === "INTEREST" ? "INTEREST" : "RECENT";
  const validCategory = Object.values(ListingCategory).includes(
    category as ListingCategory,
  );

  const where = {
    universityId: university.id,
    status: "PUBLISHED" as const,
    ...(validCategory ? { category: category as ListingCategory } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, interestedListingCount] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.count({
      where: {
        ...where,
        conversations: { some: { universityId: university.id } },
      },
    }),
  ]);
  const hasInterestSignals = interestedListingCount > 0;
  const sortMode = requestedSort === "INTEREST" && hasInterestSignals
    ? "INTEREST"
    : "RECENT";

  const cursorAnchor = cursorId
    ? await prisma.listing.findFirst({
        where: { id: cursorId, universityId: university.id },
        select: { id: true, createdAt: true },
      })
    : null;
  if (cursorId && !cursorAnchor) {
    return Response.json(
      { error: "Actualiza las publicaciones para continuar." },
      { status: 400, headers: privateNoStore },
    );
  }

  const recentWhere = cursorAnchor
    ? {
        ...where,
        AND: [
          {
            OR: [
              { createdAt: { lt: cursorAnchor.createdAt } },
              { createdAt: cursorAnchor.createdAt, id: { lt: cursorAnchor.id } },
            ],
          },
        ],
      }
    : where;

  const listings = await prisma.listing.findMany({
    where: sortMode === "INTEREST" ? where : recentWhere,
    ...(sortMode === "INTEREST" && cursorId
      ? { cursor: { id: cursorId }, skip: 1 }
      : {}),
    orderBy: sortMode === "INTEREST"
      ? [
          { conversations: { _count: "desc" } },
          { createdAt: "desc" },
          { id: "desc" },
        ]
      : [{ createdAt: "desc" }, { id: "desc" }],
    skip: sortMode === "INTEREST"
      ? cursorId ? 1 : (page - 1) * 24
      : cursorAnchor ? undefined : (page - 1) * 24,
    take: cursorId ? 25 : 24,
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
  });

  const pageListings = listings.slice(0, 24);
  const hasMore = pageListings.length > 0 && (cursorId ? listings.length > 24 : page * 24 < total);
  const nextCursor = hasMore ? pageListings.at(-1)?.id ?? null : null;

  return Response.json({
    university: { id: university.id, name: university.name, slug: university.slug },
    page,
    pageSize: 24,
    total,
    hasMore,
    nextCursor,
    sortMode,
    hasInterestSignals,
    listings: pageListings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price.toNumber(),
      currency: listing.currency,
      category: listing.category,
      condition: listing.condition,
      imageUrl: listing.photo ? "/api/listings/" + encodeURIComponent(listing.id) + "/photo" : null,
      isDemo: listing.isDemo,
      createdAt: listing.createdAt,
      seller: listing.seller,
    })),
  }, { headers: privateNoStore });
}
export async function POST(request: Request) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  let formData: FormData;
  let photo: Awaited<ReturnType<typeof parseListingPhoto>>;
  try {
    formData = await parseListingMultipart(request);
    const rawPrice = formData.get("price");
    const rawSubmissionId = formData.get("submissionId");
    const parsed = createListingSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      price: typeof rawPrice === "string" && rawPrice.trim() ? Number(rawPrice) : Number.NaN,
      category: formData.get("category"),
      condition: formData.get("condition"),
      publish: formData.get("publish") !== "false",
      submissionId: typeof rawSubmissionId === "string" ? rawSubmissionId : undefined,
    });
    if (!parsed.success) {
      return Response.json(
        { error: "Revisa el título, la descripción, el precio y la categoría." },
        { status: 400, headers: privateNoStore },
      );
    }
    photo = await parseListingPhoto(formData);

    const { publish, submissionId, ...content } = parsed.data;
    const submissionHash = createHash("sha256")
      .update(JSON.stringify({ ...content, publish }))
      .update("\0")
      .update(photo?.data ?? new Uint8Array())
      .digest("hex");

    const result = await prisma.$transaction(async (transaction) => {
      const createData = {
        ...content,
        imageUrl: null,
        status: publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
        universityId: student.universityId,
        sellerId: student.id,
      };
      const select = {
        id: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        category: true,
        condition: true,
        status: true,
        isDemo: true,
        createdAt: true,
      } as const;

      if (submissionId) {
        const inserted = await transaction.listing.createMany({
          data: [{ ...createData, submissionId, submissionHash }],
          skipDuplicates: true,
        });
        const stored = await transaction.listing.findUnique({
          where: {
            sellerId_submissionId: {
              sellerId: student.id,
              submissionId,
            },
          },
          select: { ...select, submissionHash: true, photo: { select: { listingId: true } } },
        });
        if (!stored) throw new Error("The listing submission could not be retrieved.");

        const { submissionHash: storedHash, photo: storedPhoto, ...listing } = stored;
        if (storedHash !== submissionHash) return { kind: "conflict" as const };
        if (inserted.count === 0) return { kind: "replayed" as const, listing, hasPhoto: Boolean(storedPhoto) };

        if (photo) {
          await transaction.listingPhoto.create({
            data: { listingId: listing.id, ...photo },
          });
        }
        return { kind: "created" as const, listing, hasPhoto: Boolean(photo) };
      }

      const created = await transaction.listing.create({ data: createData, select });
      if (photo) {
        await transaction.listingPhoto.create({
          data: { listingId: created.id, ...photo },
        });
      }
      return { kind: "created" as const, listing: created, hasPhoto: Boolean(photo) };
    });

    if (result.kind === "conflict") {
      return Response.json(
        { error: "Este intento ya tiene una publicación con otros datos. Revisa Mis publicaciones antes de volver a publicar." },
        { status: 409, headers: privateNoStore },
      );
    }

    return Response.json(
      {
        listing: {
          ...result.listing,
          price: result.listing.price.toNumber(),
          imageUrl: result.hasPhoto
            ? "/api/listings/" + encodeURIComponent(result.listing.id) + "/photo"
            : null,
        },
      },
      {
        status: result.kind === "created" ? 201 : 200,
        headers: privateNoStore,
      },
    );
  } catch (error) {
    if (error instanceof ListingPhotoInputError) {
      return Response.json({ error: error.message }, { status: error.status, headers: privateNoStore });
    }
    return Response.json(
      { error: "No pudimos completar la publicación. Intenta de nuevo. Intenta de nuevo." },
      { status: 503, headers: privateNoStore },
    );
  }
}
