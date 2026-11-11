import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { MAX_LISTING_PHOTOS } from "@/features/listings/lib/listing-photo-limits";

export const runtime = "nodejs";

const privateNoStore = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

const cacheHeaders = {
  "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

type CachedThumb = {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
};

const thumbnailCache = new Map<string, CachedThumb>();
const MAX_THUMBNAIL_CACHE = 250;

export async function GET(
  request: Request,
  context: RouteContext<"/api/listings/[id]/photo">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
    );
  }

  const url = new URL(request.url);
  const rawPosition = url.searchParams.get("position") ?? "0";
  const position = Number(rawPosition);
  if (!Number.isInteger(position) || position < 0 || position >= MAX_LISTING_PHOTOS) {
    return Response.json(
      { error: "No encontramos esa foto de la publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const rawVariant = url.searchParams.get("variant") ?? url.searchParams.get("size");
  const variant = rawVariant === "thumb" ? "thumb" : "full";

  const { id } = await context.params;
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      universityId: student.universityId,
      university: { status: "ACTIVE", isDemo: false },
      AND: [
        {
          OR: [
            { isDemo: false },
            { isDemo: true, university: { isTest: true } },
          ],
        },
        {
          OR: [
            { status: "PUBLISHED" },
            { sellerId: student.id },
            // Buyers retain the product reference in their existing conversations.
            { isDemo: false, conversations: { some: {
              buyerId: student.id,
              universityId: student.universityId,
            } } },
          ],
        },
      ],
    },
    select: {
      photos: {
        where: { position },
        select: { data: true, mimeType: true },
        take: 1,
      },
    },
  });

  const photo = listing?.photos[0];
  if (!photo) {
    return Response.json(
      { error: "No encontramos esa foto de la publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  let imageData: Uint8Array<ArrayBuffer>;
  let mimeType = photo.mimeType;

  if (variant === "thumb") {
    const cacheKey = `${id}:${position}`;
    const cached = thumbnailCache.get(cacheKey);

    if (cached) {
      imageData = cached.data;
      mimeType = cached.mimeType;
    } else {
      try {
        const thumbBuffer = await sharp(photo.data)
          .rotate()
          .resize({
            width: 480,
            height: 480,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        imageData = new Uint8Array(thumbBuffer.buffer, thumbBuffer.byteOffset, thumbBuffer.byteLength);
        mimeType = "image/webp";

        if (thumbnailCache.size >= MAX_THUMBNAIL_CACHE) {
          const oldestKey = thumbnailCache.keys().next().value;
          if (oldestKey) thumbnailCache.delete(oldestKey);
        }
        thumbnailCache.set(cacheKey, { data: imageData, mimeType });
      } catch {
        imageData = new Uint8Array(photo.data);
      }
    }
  } else {
    imageData = new Uint8Array(photo.data);
  }

  const etag = `W/"${id}-${position}-${variant}-${imageData.byteLength}"`;
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ...cacheHeaders,
        ETag: etag,
      },
    });
  }

  return new Response(imageData as BodyInit, {
    status: 200,
    headers: {
      ...cacheHeaders,
      ETag: etag,
      "Content-Type": mimeType,
      "Content-Length": String(imageData.byteLength),
    },
  });
}
