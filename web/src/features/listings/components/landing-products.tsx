import { ImageIcon } from "lucide-react";

type Product = {
  id: string; title: string; image: string | null; price: string; isDemo: boolean;
};

export function LandingProducts({ products }: { products: Product[] }) {
  return (
    <section className="landing-products" aria-labelledby="preview-title">
      <div className="landing-products-heading">
        <h2 id="preview-title">Descubre lo que hay</h2>
      </div>
      {products.length ? (
        <div className="landing-product-grid">
          {products.map((product) => (
            <a key={product.id} className="landing-product" href="/ingresar?returnTo=%2Fmercadito"
              aria-label={product.title + ", " + product.price + (product.isDemo ? ", producto de ejemplo" : "") + ". Entrar para continuar"}>
              <div className="landing-product-photo">
                {product.image ? (
                  // Las miniaturas públicas mantienen las fotos originales detrás del acceso.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.title} width={440} height={330} loading="lazy" decoding="async" />
                ) : <ImageIcon aria-hidden="true" size={32} strokeWidth={1.5} />}
                {product.isDemo && <span className="landing-product-example">Ejemplo</span>}
              </div>
              <div className="landing-product-info">
                <p>{product.price}<span>MXN</span></p>
                <h3>{product.title}</h3>
              </div>
            </a>
          ))}
        </div>
      ) : <p className="landing-preview-empty">Aún no hay productos publicados. Vuelve pronto para descubrir las novedades.</p>}
      <p className="landing-preview-note">Elige un producto e inicia sesión para continuar.</p>
    </section>
  );
}
