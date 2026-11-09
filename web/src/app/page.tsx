import { redirect } from "next/navigation";
import { activeUniversityName, getActiveCommunity } from "@/features/community/lib/active-community";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { PublicLandingPanel } from "@/features/listings/components/public-marketplace-preview";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const student = await getActiveStudent();
  if (student) redirect("/mercadito");
  const community = await getActiveCommunity();
  return <>
    <SiteHeader />
    <main className="public-page">
      <PublicLandingPanel universityName={activeUniversityName} />
      {community?.isTest && <p className="public-test-note">{activeUniversityName} es un campus de prueba. Usa solo datos ficticios.</p>}
    </main>
    <SiteFooter />
  </>;
}
