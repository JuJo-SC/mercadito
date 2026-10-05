"use client";

import Link from "next/link";
import { ImageIcon, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Product = {
  id: string; title: string; image: string | null; price: string; isDemo: boolean;
};

export function LandingProducts({ products }: { products: Product[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || products.length < 2) return;
    let frame = 0;
    let previous = 0;
    let position = viewport.current?.scrollLeft ?? 0;
    const tick = (now: number) => {
      const element = viewport.current;
      const width = group.current?.offsetWidth ?? 0;
      if (element && width && previous && !interacting.current && !document.hidden) {
        position += Math.min(now - previous, 50) * 0.025;
        if (position >= width) position -= width;
        element.scrollLeft = position;
      } else if (element) {
        position = element.scrollLeft;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, reducedMotion, products.length]);

  const renderProduct = (product: Product, duplicate = false) => (
    <Link
      key={product.id}
      className="landing-product"
      href="/ingresar?returnTo=%2Fmercadito"
      prefetch={false}
      tabIndex={duplicate ? -1 : 0}
      aria-label={`${product.title}, ${product.price}${product.isDemo ? ", producto de ejemplo" : ""}. Entrar para continuar`}
    >
      <div className="landing-product-photo">
        {product.image ? (
          // Inline thumbnails keep original photos behind authenticated routes.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.title} width={440} height={330} draggable={false} />
        ) : <ImageIcon aria-hidden="true" size={32} strokeWidth={1.5} />}
        {product.isDemo && <span className="landing-product-example">Ejemplo</span>}
      </div>
      <div className="landing-product-info">
        <h3>{product.title}</h3>
        <p>{product.price}<span>MXN</span></p>
      </div>
    </Link>
  );

  return (
    <section className="landing-products page-width" aria-labelledby="preview-title">
      <div className="landing-products-heading">
        <h2 id="preview-title">Descubre lo que hay</h2>
        {products.length > 1 && !reducedMotion && (
          <button className="landing-motion-toggle" type="button" onClick={() => setPaused(!paused)}
            aria-label={paused ? "Reanudar movimiento de productos" : "Pausar movimiento de productos"}
            aria-pressed={paused}>
            {paused ? <Play aria-hidden="true" size={15} /> : <Pause aria-hidden="true" size={15} />}
            <span>{paused ? "Reanudar" : "Pausar"}</span>
          </button>
        )}
      </div>
      {products.length ? (
        <div ref={viewport} className="landing-product-viewport" tabIndex={0} aria-label="Productos. Desliza para ver más."
          onPointerEnter={(event) => { if (event.pointerType === "mouse") interacting.current = true; }}
          onPointerLeave={() => { interacting.current = false; }}
          onPointerDown={(event) => { if (event.pointerType !== "mouse") setPaused(true); }}
          onFocusCapture={() => { interacting.current = true; }}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) interacting.current = false; }}>
          <div className="landing-product-track">
            <div className="landing-product-group" ref={group}>{products.map((product) => renderProduct(product))}</div>
            {products.length > 1 && !reducedMotion && (
              <div className="landing-product-group" aria-hidden="true">{products.map((product) => renderProduct(product, true))}</div>
            )}
          </div>
        </div>
      ) : <p className="landing-preview-empty">Aún no hay productos publicados. Vuelve pronto para descubrir las novedades.</p>}
      <p className="landing-preview-note">Elige un producto e inicia sesión para continuar.</p>
    </section>
  );
}
