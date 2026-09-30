import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { MAX_LISTING_PHOTOS } from "@/lib/listing-photo-limits";

export const runtime = "nodejs";

const privateNoStore = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

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

  const rawPosition = new URL(request.url).searchParams.get("position") ?? "0";
  const position = Number(rawPosition);
  if (!Number.isInteger(position) || position < 0 || position >= MAX_LISTING_PHOTOS) {
    return Response.json(
      { error: "No encontramos esa foto de la publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

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
        { OR: [{ status: "PUBLISHED" }, { sellerId: student.id }] },
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

  const image = new Uint8Array(photo.data);
  return new Response(image, {
    headers: {
      ...privateNoStore,
      "Content-Type": photo.mimeType,
      "Content-Length": String(image.byteLength),
    },
  });
}
