import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";

export const runtime = "nodejs";

const privateNoStore = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]/photo">,
) {
  const student = await getActiveStudent();
  if (!student) {
    return Response.json(
      { error: "Inicia sesión con tu cuenta institucional." },
      { status: 401, headers: privateNoStore },
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
    select: { photo: { select: { data: true } } },
  });

  if (!listing?.photo) {
    return Response.json(
      { error: "No encontramos la foto de esta publicación." },
      { status: 404, headers: privateNoStore },
    );
  }

  const image = new Uint8Array(listing.photo.data);
  return new Response(image, {
    headers: {
      ...privateNoStore,
      "Content-Type": "image/webp",
      "Content-Length": String(image.byteLength),
    },
  });
}
