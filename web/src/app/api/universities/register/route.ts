export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { error: "Mercadito está habilitado para una sola universidad. El registro de otras comunidades está cerrado." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
