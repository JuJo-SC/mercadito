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
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("q")?.trim().slice(0, 80);
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

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 24,
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
    }),
  ]);

  return Response.json({
    university: { id: university.id, name: university.name, slug: university.slug },
    page,
    pageSize: 24,
    total,
    listings: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price.toNumber(),
      currency: listing.currency,
      category: listing.category,
      condition: listing.condition,
      imageUrl: listing.photo ? `/api/listings/${encodeURIComponent(listing.id)}/photo` : null,
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
    const parsed = createListingSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      price: typeof rawPrice === "string" && rawPrice.trim() ? Number(rawPrice) : Number.NaN,
      category: formData.get("category"),
      condition: formData.get("condition"),
      publish: formData.get("publish") !== "false",
    });
    if (!parsed.success) {
      return Response.json(
        { error: "Revisa el título, la descripción, el precio y la categoría." },
        { status: 400, headers: privateNoStore },
      );
    }
    photo = await parseListingPhoto(formData);

    const { publish, ...content } = parsed.data;
    const listing = await prisma.$transaction(async (transaction) => {
      const created = await transaction.listing.create({
        data: {
          ...content,
          imageUrl: null,
          status: publish ? "PUBLISHED" : "DRAFT",
          universityId: student.universityId,
          sellerId: student.id,
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
          isDemo: true,
          createdAt: true,
        },
      });
      if (photo) {
        await transaction.listingPhoto.create({
          data: { listingId: created.id, ...photo },
        });
      }
      return created;
    });

    return Response.json(
      {
        listing: {
          ...listing,
          price: listing.price.toNumber(),
          imageUrl: photo ? `/api/listings/${encodeURIComponent(listing.id)}/photo` : null,
        },
      },
      { status: 201, headers: privateNoStore },
    );
  } catch (error) {
    if (error instanceof ListingPhotoInputError) {
      return Response.json({ error: error.message }, { status: error.status, headers: privateNoStore });
    }
    return Response.json(
      { error: "No pudimos publicar el aviso. Intenta de nuevo." },
      { status: 503, headers: privateNoStore },
    );
  }
}
