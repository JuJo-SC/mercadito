import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { activeUniversityName, getActiveCommunity } from "@/lib/active-community";
import { getActiveStudent } from "@/lib/require-student";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const categories = ["Comida", "Ropa", "Tecnología", "Hogar", "Accesorios", "Servicios"];

export default async function Home() {
  const student = await getActiveStudent();
  if (student) redirect("/mercadito");

  const community = await getActiveCommunity();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="landing-hero page-width" aria-labelledby="landing-title">
          <div className="landing-copy">
            <h1 id="landing-title">El mercadito de {activeUniversityName}.</h1>
            <p className="landing-description">
              Encuentra comida, ropa, tecnología y cosas para tu día a día,
              ofrecidas por estudiantes de {activeUniversityName}.
            </p>
            <div className="landing-actions">
              <Link className="button-ink" href="/ingresar?returnTo=%2Fmercadito">
                Entrar a {activeUniversityName}
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
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
              <h2>Encuentra en {activeUniversityName}</h2>
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
            <h2 id="how-title">Una comunidad, tu campus.</h2>
            <p>Explora, publica y conversa con estudiantes de {activeUniversityName}. El catálogo requiere una cuenta autorizada.</p>
          </div>
          <ol className="landing-steps">
            <li>
              <span>01</span>
              <h3>{community?.isTest ? "Entra con tu cuenta de prueba" : "Entra con tu cuenta institucional"}</h3>
              <p>El acceso está reservado a las cuentas autorizadas de {activeUniversityName}.</p>
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

        {community?.isTest ? (
          <section className="landing-university page-width" aria-label="Comunidad de prueba">
            <div>
              <h2>{activeUniversityName} está en prueba.</h2>
              <p>Estamos probando la experiencia con cuentas y datos ficticios. Estas cuentas no verifican matrícula real.</p>
            </div>
            <Link className="landing-integration-link" href="/ingresar?returnTo=%2Fmercadito">
              Acceder a la prueba
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
