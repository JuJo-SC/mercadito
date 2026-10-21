import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PublicFeaturePanel } from "@/features/listings/components/public-marketplace-preview";

type PublicFeature = "messages" | "publish" | "listings";

export function PublicFeatureIntro({ feature }: { feature: PublicFeature }) {
  return <>
    <SiteHeader />
    <main className="public-page"><PublicFeaturePanel feature={feature} /></main>
    <SiteFooter />
  </>;
}
