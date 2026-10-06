import { getActiveCommunity } from "@/features/community/lib/active-community";

export const runtime = "nodejs";

export async function GET() {
  const community = await getActiveCommunity();
  return Response.json(
    { universities: community ? [community] : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
