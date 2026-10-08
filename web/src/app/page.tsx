import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { activeUniversityName, getActiveCommunity } from "@/features/community/lib/active-community";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { getLandingProducts } from "@/features/listings/lib/landing-products";
import { LandingProducts } from "@/features/listings/components/landing-products";
import { LandingFeatureGuide } from "@/components/public-feature-guide";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const student = await getActiveStudent();
  if (student) redirect("/mercadito");
  const [community, products] = await Promise.all([getActiveCommunity(), getLandingProducts()]);

  return (
    <>
      <SiteHeader publicGuide />
      <main className="landing-home">
        <div className="landing-intro page-width">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-copy">
            <h1 id="landing-title">Tu campus. Tu mercadito.</h1>
            <p className="landing-description">Compra y vende entre estudiantes de {activeUniversityName}.</p>
          </div>
          <Link className="button-ink" href="/ingresar?returnTo=%2Fmercadito">
            Entrar al mercadito <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        <LandingProducts products={products} />
        </div>

        <section className="landing-how page-width" id="como-funciona" aria-labelledby="how-title">
          <div className="landing-section-heading">
            <h2 id="how-title">Así funciona</h2>
          </div>
          <LandingFeatureGuide />
          <ol className="landing-steps">
            <li>
              <h3>Entra</h3>
              <p>{community?.isTest ? "Usa tu cuenta autorizada de prueba." : "Usa tu cuenta institucional."}</p>
            </li>
            <li>
              <h3>Encuentra</h3>
              <p>Explora productos o publica los tuyos.</p>
            </li>
            <li>
              <h3>Conversa</h3>
              <p>Acuerda la entrega por chat. Los pagos se realizan fuera de Mercadito.</p>
            </li>
          </ol>
        </section>

        {community?.isTest && (
          <p className="landing-test-disclosure page-width">
            {activeUniversityName} es un campus de prueba. Los productos marcados como ejemplo son ficticios.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
