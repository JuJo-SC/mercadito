import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStudent } from "@/lib/require-student";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const categories = ["Comida", "Ropa", "Tecnología", "Hogar", "Accesorios", "Servicios"];

export default async function Home() {
  const student = await getActiveStudent();
  if (student) redirect("/mercadito");

  const hasUniversities = (await prisma.university.count({
    where: { status: "ACTIVE", isDemo: false },
  })) > 0;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="landing-hero page-width" aria-labelledby="landing-title">
          <div className="landing-copy">
            <h1 id="landing-title">Compra y vende dentro de tu universidad.</h1>
            <p className="landing-description">
              Encuentra comida, ropa, tecnología y cosas para tu día a día,
              ofrecidas por estudiantes de tu mismo campus.
            </p>
            <div className="landing-actions">
              {hasUniversities ? (
                <Link className="button-ink" href="/ingresar?returnTo=%2Fmercadito">
                  Entrar a mi mercadito
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              ) : (
                <Link className="button-ink" href="/universidades">
                  Conocer las universidades
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              )}
              <Link className="text-action" href="#como-funciona">
                Así funciona
                <ArrowDown aria-hidden="true" size={16} strokeWidth={1.8} />
              </Link>
            </div>
            <p className="landing-payment-note">
              Las preguntas se hacen por chat; cualquier pago se acuerda fuera de Mercadito.
            </p>
          </div>

          <aside className="landing-catalog-sheet" aria-label="Categorías del mercadito">
            <div className="landing-sheet-heading">
              <h2>Categorías del campus</h2>
            </div>
            <ul className="landing-category-list">
              {categories.map((category) => (
                <li key={category}>
                  <strong>{category}</strong>
                  <span aria-hidden="true"><ArrowUpRight size={15} strokeWidth={1.8} /></span>
                </li>
              ))}
            </ul>
            <p className="landing-sheet-foot">
              De estudiante a estudiante. Cerca, claro y en comunidad.
            </p>
          </aside>
        </section>

        <section className="landing-how page-width" id="como-funciona" aria-labelledby="how-title">
          <div className="landing-section-heading">
            <h2 id="how-title">Tu universidad marca el lugar.</h2>
            <p>Entras a tu comunidad y exploras productos y servicios de estudiantes.</p>
          </div>
          <ol className="landing-steps">
            <li>
              <span>01</span>
              <h3>Entra con tu cuenta institucional</h3>
              <p>Mercadito identifica la universidad asociada a tu acceso.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Explora y compara</h3>
              <p>Busca por nombre o categoría; revisa el precio y la condición.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Habla y acuerda</h3>
              <p>Pregunta por chat y define con la otra persona cómo hacer el intercambio.</p>
            </li>
          </ol>
        </section>

        <section className="landing-university page-width">
          <div>
            <h2>Podemos preparar su espacio.</h2>
          </div>
          <Link className="landing-integration-link" href="/universidades">
            Conocer la integración
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
