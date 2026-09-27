import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const registrationSchema = z.object({
  name: z.string().trim().min(3).max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(3)
    .max(60),
  websiteUrl: z.url().max(240),
  contactName: z.string().trim().min(2).max(100),
  contactEmail: z.email().trim().toLowerCase().max(254),
  privacyAccepted: z.literal(true),
});

export async function POST(request: Request) {
  if (process.env.ENABLE_UNIVERSITY_APPLICATIONS !== "true") {
    return Response.json(
      { error: "El registro de universidades aún no está habilitado." },
      { status: 503 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Revisa los datos del formulario e intenta de nuevo." },
      { status: 400 },
    );
  }

  const { privacyAccepted: _privacyAccepted, ...data } = parsed.data;
  void _privacyAccepted;

  try {
    const application = await prisma.universityApplication.create({
      data: {
        ...data,
        privacyAcceptedAt: new Date(),
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return Response.json(
      {
        message: "Recibimos la solicitud de registro de la universidad.",
        application,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Ya existe una solicitud o comunidad con esos datos." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "No pudimos registrar la solicitud en este momento." },
      { status: 503 },
    );
  }
}
