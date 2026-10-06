"use client";

import { ChevronLeft, ChevronRight, ImageIcon, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Product = {
  id: string; title: string; image: string | null; price: string; isDemo: boolean;
};

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia("(min-width: 761px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function LandingProducts({ products }: { products: Product[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 761px)").matches,
    () => false,
  );
  const [activeIndex, setActiveIndex] = useState(0);
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
    if (desktop) {
      const timer = window.setInterval(() => {
        if (!interacting.current && !document.hidden) {
          setActiveIndex((index) => (index + 1) % products.length);
        }
      }, 5000);
      return () => window.clearInterval(timer);
    }
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
  }, [paused, reducedMotion, products.length, desktop]);

  const renderProduct = (product: Product, duplicate = false) => (
    <a
      key={product.id}
      className="landing-product"
      href="/ingresar?returnTo=%2Fmercadito"
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
    </a>
  );

  return (
    <section className="landing-products" aria-labelledby="preview-title">
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
      {products.length && desktop ? (
        <div className="landing-product-showcase"
          onPointerEnter={() => { interacting.current = true; }}
          onPointerLeave={() => { interacting.current = false; }}
          onFocusCapture={() => { interacting.current = true; }}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) interacting.current = false; }}>
          <div className="landing-single-product" key={products[activeIndex % products.length].id}>
            {renderProduct(products[activeIndex % products.length])}
          </div>
          {products.length > 1 && (
            <div className="landing-product-controls">
              <button type="button" className="landing-motion-toggle" aria-label="Producto anterior"
                onClick={() => setActiveIndex((index) => (index - 1 + products.length) % products.length)}>
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <span aria-label={`Producto ${activeIndex + 1} de ${products.length}`}>
                {activeIndex + 1} / {products.length}
              </span>
              <button type="button" className="landing-motion-toggle" aria-label="Siguiente producto"
                onClick={() => setActiveIndex((index) => (index + 1) % products.length)}>
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </div>
          )}
        </div>
      ) : products.length ? (
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
