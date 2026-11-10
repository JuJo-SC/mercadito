import Link from "next/link";
import { ArrowRight, Check, Lock, Tag } from "lucide-react";

export function PublicLandingPanel({ universityName }: { universityName: string }) {
  return (
    <div className="public-landing-clean">
      {/* Hero principal */}
      <section className="hero-clean">
        <div className="hero-copy">
          <h1 id="inicio-title">
            <span>Tu campus.</span>
            <span className="brand-accent">Tu mercadito.</span>
          </h1>
          <p className="hero-lede">
            Compra y vende entre estudiantes de {universityName}.
          </p>
          <div className="hero-actions">
            <Link
              className="button-primary hero-cta"
              href="/ingresar?returnTo=%2Fmercadito"
            >
              <span>Entrar al mercadito</span>
              <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
            </Link>
          </div>
          <p className="hero-note">
            <Lock aria-hidden="true" size={14} strokeWidth={2} />
            <span>Solo estudiantes pueden entrar al mercadito</span>
          </p>
        </div>
      </section>

      {/* Así funciona: 3 tarjetas visuales */}
      <section className="how-it-works-clean" aria-label="Cómo funciona">
        <div className="section-divider">
          <span className="divider-line" />
          <span className="divider-label">Así funciona</span>
          <span className="divider-line" />
        </div>

        <div className="how-cards-grid">
          {/* Tarjeta 1: Acceso institucional */}
          <article className="how-card">
            <div className="how-illustration anim-float">
              <div className="id-card-sim">
                <div className="id-avatar">UAT</div>
                <div className="id-lines">
                  <div className="id-line strong" />
                  <div className="id-line" />
                  <div className="id-line short" />
                </div>
              </div>
              <div className="verified-badge anim-pulse">
                <Check aria-hidden="true" size={12} strokeWidth={3} />
              </div>
            </div>
            <h3>Acceso institucional</h3>
            <p>Solo estudiantes verificados</p>
          </article>

          {/* Tarjeta 2: Compra y venta directa */}
          <article className="how-card">
            <div className="how-illustration anim-float-delayed">
              <div className="items-sim">
                <span className="item-badge" title="Ropa">👕</span>
                <span className="item-badge primary" title="Libros">📚</span>
                <span className="item-badge" title="Artículos">🎧</span>
              </div>
              <span className="no-fee-tag">
                <Tag aria-hidden="true" size={11} strokeWidth={2} />
                Sin comisiones
              </span>
            </div>
            <h3>Compra y venta directa</h3>
            <p>Encuentra o publica artículos variados</p>
          </article>

          {/* Tarjeta 3: Ponte de acuerdo por chat */}
          <article className="how-card">
            <div className="how-illustration anim-float-delayed-2">
              <div className="chat-bubbles-sim">
                <div className="chat-bubble left">
                  <span>¿Dónde nos vemos para la entrega? 💬</span>
                </div>
                <div className="chat-bubble right">
                  <span>¡Te veo a las 2 pm en el punto acordado! 👍</span>
                </div>
              </div>
            </div>
            <h3>Ponte de acuerdo por chat</h3>
            <p>Mensajéate para definir la entrega</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export function PublicFeaturePanel({ feature }: { feature: "messages" | "publish" | "listings" }) {
  const titles = {
    messages: "Mensajes entre estudiantes",
    publish: "Publicar en el mercadito",
    listings: "Tus publicaciones",
  };
  return (
    <div className="public-landing-clean">
      <section className="hero-clean">
        <div className="hero-copy">
          <h1 id="intro-title">
            <span>{titles[feature]}</span>
          </h1>
          <p className="hero-lede">
            Inicia sesión con tu cuenta institucional para acceder a esta sección.
          </p>
          <div className="hero-actions">
            <Link className="button-primary hero-cta" href={`/ingresar?returnTo=%2F${feature === "listings" ? "mis-avisos" : feature}`}>
              <span>Entrar al mercadito</span>
              <ArrowRight aria-hidden="true" size={18} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
