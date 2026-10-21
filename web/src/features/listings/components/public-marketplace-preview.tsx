import Link from "next/link";
import { PublicPreviewMotion } from "./public-preview-motion";

type PublicFeature = "messages" | "publish" | "listings";

function PreviewSymbols() {
  return (<svg aria-hidden="true" focusable="false" className="public-preview-symbols">
  <symbol id="public-preview-i-store" viewBox="0 0 24 24"><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9"/><path d="M3 10l1.6-5.2A1 1 0 0 1 5.55 4h12.9a1 1 0 0 1 .95.8L21 10"/><path d="M3 10c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2"/><path d="M9 20v-5h6v5"/></symbol>
  <symbol id="public-preview-i-message" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol>
  <symbol id="public-preview-i-plus-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></symbol>
  <symbol id="public-preview-i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></symbol>
  <symbol id="public-preview-i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></symbol>
  <symbol id="public-preview-i-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></symbol>
  <symbol id="public-preview-i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
  <symbol id="public-preview-i-lock" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
  <symbol id="public-preview-i-phone-off" viewBox="0 0 24 24"><path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-4.5-4.5A19.8 19.8 0 0 1 3.6 5.6 2 2 0 0 1 5.6 3.4h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1z"/><path d="m2 2 20 20"/></symbol>
  <symbol id="public-preview-i-file-check" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></symbol>
  <symbol id="public-preview-i-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></symbol>
  <symbol id="public-preview-i-plus" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></symbol>
  <symbol id="public-preview-i-shirt" viewBox="0 0 24 24"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></symbol>
  <symbol id="public-preview-i-book" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></symbol>
  <symbol id="public-preview-i-bag" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></symbol>
  <symbol id="public-preview-i-pencil" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></symbol>
  <symbol id="public-preview-i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></symbol>
  <symbol id="public-preview-i-send" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></symbol>
  <symbol id="public-preview-i-check-check" viewBox="0 0 24 24"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></symbol>
  <symbol id="public-preview-i-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
</svg>);
}

export function PublicLandingPanel({ universityName }: { universityName: string }) {
  return <PublicPreviewMotion kind="home"><PreviewSymbols /><section className="hero-panel">
        <div className="hero-copy">
          <h1 id="inicio-title"><span>Tu campus. </span><span>Tu mercadito.</span></h1>
          <p className="hero-lede">Compra y vende entre estudiantes de {universityName}.</p>
          <div className="hero-actions">
            <Link className="button-primary" href="/ingresar?returnTo=%2Fmercadito">Entrar al mercadito<svg className="icon" aria-hidden="true"><use href="#public-preview-i-arrow-right"/></svg></Link>
          </div>
          <p className="hero-note"><svg className="icon" aria-hidden="true"><use href="#public-preview-i-lock"/></svg><span>El catálogo se abre con tu cuenta institucional.</span></p>
        </div>
        <section className="hero-visual" id="como-funciona" aria-labelledby="como-funciona-title">
          <div className="app-mock hero-mock">
            <div className="mock-top" aria-hidden="true">
              <span className="mock-brand"><span className="mock-logo"><svg className="icon"><use href="#public-preview-i-store"/></svg></span>Mercadito</span>
              <span className="mock-campus">{universityName}</span>
            </div>
            <div className="journey-head">
              <h2 id="como-funciona-title">Así funciona</h2>
              <p>Entra, encuentra y conversa.</p>
            </div>
            <ol className="flow">
              <li className="flow-item" data-flow-item>
                <span className="flow-marker" aria-hidden="true">1</span>
                <div className="flow-card">
                  <div className="flow-copy">
                    <h3>Entra</h3>
                    <p>Usa tu cuenta institucional.</p>
                  </div>
                  <div className="flow-ui" aria-hidden="true">
                    <div className="flow-auth">
                      <span className="flow-icon"><svg className="icon"><use href="#public-preview-i-lock"/></svg></span>
                      <span className="flow-auth-copy"><strong>Entra con tu cuenta</strong><span>Acceso institucional {universityName}</span></span>
                      <span className="mini-primary">Entrar</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flow-item" data-flow-item>
                <span className="flow-marker" aria-hidden="true">2</span>
                <div className="flow-card">
                  <div className="flow-copy">
                    <h3>Encuentra o publica</h3>
                    <p>Explora productos o publica los tuyos.</p>
                  </div>
                  <div className="flow-ui" aria-hidden="true">
                    <div className="flow-head"><strong>Nueva publicación</strong><span>Ropa</span></div>
                    <div className="mini-thumbs">
                      <span className="mini-thumb"><svg className="icon"><use href="#public-preview-i-shirt"/></svg></span>
                      <span className="mini-thumb tint-sand"><svg className="icon"><use href="#public-preview-i-book"/></svg></span>
                      <span className="mini-thumb tint-blue"><svg className="icon"><use href="#public-preview-i-bag"/></svg></span>
                      <span className="mini-thumb mini-add"><svg className="icon"><use href="#public-preview-i-plus"/></svg></span>
                    </div>
                    <div className="mini-fields">
                      <span className="mini-field"><span>Título</span><strong>Sudadera azul</strong></span>
                      <span className="mini-field"><span>Precio</span><strong>$250.00</strong></span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="flow-item" data-flow-item>
                <span className="flow-marker" aria-hidden="true">3</span>
                <div className="flow-card flow-chat-card">
                  <div className="flow-copy">
                    <h3>Conversa</h3>
                    <p>Acuerda la entrega por chat. Los pagos se realizan fuera de Mercadito.</p>
                  </div>
                  <div className="flow-ui" aria-hidden="true">
                    <div className="flow-chat-head">
                      <span className="mini-thumb sm"><svg className="icon"><use href="#public-preview-i-shirt"/></svg></span>
                      <div><strong>Sudadera azul</strong><span>$250.00</span></div>
                      <span className="mini-tag">Compras</span>
                    </div>
                    <div className="mini-bubbles">
                      <span className="mini-bubble">¿Sigue disponible?</span>
                      <span className="mini-bubble out">Sí, en buen estado.</span>
                    </div>
                    <div className="mini-composer"><span>Escribe un mensaje…</span><svg className="icon"><use href="#public-preview-i-send"/></svg></div>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </section></PublicPreviewMotion>;
}

const panels = {
  messages: () => (<section className="intro-panel">
        <div className="intro-copy">
          <h1 id="mensajes-title">Ponte de acuerdo por aquí.</h1>
          <p className="intro-lede">Chatea con compradores y vendedores para preguntar por un producto y acordar la entrega.</p>
          <div className="note-strip">
            <svg className="icon" aria-hidden="true"><use href="#public-preview-i-phone-off"/></svg>
            <p>No necesitas compartir tu teléfono. Si ambos lo desean, pueden continuar por otro medio.</p>
          </div>
        </div>
        <div className="intro-visual" aria-hidden="true">
          <div className="app-mock chat-mock">
            <div className="mock-head">
              <strong>Mensajes</strong>
              <span className="context-switch"><strong>Compras</strong> · <span>Ventas</span></span>
            </div>
            <div className="chat-product">
              <span className="product-thumb"><svg className="icon"><use href="#public-preview-i-shirt"/></svg></span>
              <span className="product-copy"><strong>Sudadera azul</strong><span>$250.00</span></span>
              <svg className="icon"><use href="#public-preview-i-chevron-right"/></svg>
            </div>
            <div className="chat-body">
              <p className="bubble">¡Hola! ¿Sigue disponible?</p>
              <p className="bubble out">Sí, está en buen estado.<span className="ticks"><svg className="icon"><use href="#public-preview-i-check-check"/></svg></span></p>
              <p className="bubble">¿Nos vemos mañana a la salida?</p>
              <p className="bubble out">¡Va! Nos ponemos de acuerdo por aquí.<span className="ticks"><svg className="icon"><use href="#public-preview-i-check-check"/></svg></span></p>
            </div>
            <div className="composer">
              <span className="composer-input">Escribe un mensaje…</span>
              <span className="composer-send"><svg className="icon"><use href="#public-preview-i-send"/></svg></span>
            </div>
          </div>
        </div>
      </section>),
  publish: () => (<section className="intro-panel">
        <div className="intro-copy">
          <h1 id="publicar-title">Eso que tienes puede encontrar otro dueño.</h1>
          <p className="intro-lede">Publica lo que ya no usas, ropa que no te quedó o productos de tu emprendimiento.</p>
          <div className="note-strip">
            <svg className="icon" aria-hidden="true"><use href="#public-preview-i-file-check"/></svg>
            <p>Todo de acuerdo con el reglamento del mercadito.</p>
          </div>
        </div>
        <div className="intro-visual">
          <div className="app-mock publish-mock" aria-hidden="true">
            <div className="mock-head">
              <strong>Nueva publicación</strong>
              <span>Borrador</span>
            </div>
            <div className="publish-body">
              <div data-assemble>
                <div className="form-label"><strong>Fotos</strong><span>Hasta 5 · La primera será la principal</span></div>
                <div className="photo-grid">
                  <span className="photo-tile"><svg className="icon"><use href="#public-preview-i-shirt"/></svg></span>
                  <span className="photo-tile tint-sand"><svg className="icon"><use href="#public-preview-i-book"/></svg></span>
                  <span className="photo-tile tint-blue"><svg className="icon"><use href="#public-preview-i-bag"/></svg></span>
                  <span className="photo-tile photo-add"><svg className="icon"><use href="#public-preview-i-plus"/></svg>Añadir</span>
                </div>
              </div>
              <div className="mock-field" data-assemble>
                <span className="label">Título</span>
                <span className="mock-input">Sudadera azul</span>
              </div>
              <div className="mock-field" data-assemble>
                <span className="label">Descripción</span>
                <span className="mock-input is-textarea">Talla M, poco uso.</span>
              </div>
              <div className="mock-row" data-assemble>
                <div className="mock-field"><span className="label">Precio</span><span className="mock-input">$250.00</span></div>
                <div className="mock-field"><span className="label">Categoría</span><span className="mock-input">Ropa</span></div>
              </div>
              <div className="publish-foot" data-assemble>
                <span className="hint">Ropa, libros y emprendimientos.</span>
                <span className="mini-primary">Publicar</span>
              </div>
            </div>
          </div>
        </div>
      </section>),
  listings: () => (<section className="intro-panel">
        <div className="intro-copy">
          <h1 id="mis-publicaciones-title">Todo lo que publicas, en un solo lugar.</h1>
          <p className="intro-lede">Consulta tus artículos, edita sus detalles y actualiza su disponibilidad.</p>
          <div className="note-strip">
            <svg className="icon" aria-hidden="true"><use href="#public-preview-i-grid"/></svg>
            <p>Ten a la mano lo que sigue en venta, lo que apartaste y lo que ya vendiste.</p>
          </div>
        </div>
        <div className="intro-visual" aria-hidden="true">
          <div className="app-mock listings-mock">
            <div className="mock-head">
              <strong>Mis publicaciones</strong>
              <span>3 artículos</span>
            </div>
            <div className="listing-list">
              <div className="listing-row">
                <span className="product-thumb listing tint-sand"><svg className="icon"><use href="#public-preview-i-book"/></svg></span>
                <span className="listing-copy"><strong>Libro de cálculo</strong><span className="price">$120.00</span><span className="status status-sale">En venta</span></span>
                <span className="row-actions"><span className="edit-button"><svg className="icon"><use href="#public-preview-i-pencil"/></svg><span>Editar</span></span><span className="more-button"><svg className="icon"><use href="#public-preview-i-more"/></svg></span></span>
              </div>
              <div className="listing-row">
                <span className="product-thumb listing"><svg className="icon"><use href="#public-preview-i-shirt"/></svg></span>
                <span className="listing-copy"><strong>Sudadera azul</strong><span className="price">$250.00</span><span className="status status-hold">Apartado</span></span>
                <span className="row-actions"><span className="edit-button"><svg className="icon"><use href="#public-preview-i-pencil"/></svg><span>Editar</span></span><span className="more-button"><svg className="icon"><use href="#public-preview-i-more"/></svg></span></span>
              </div>
              <div className="listing-row">
                <span className="product-thumb listing tint-blue"><svg className="icon"><use href="#public-preview-i-bag"/></svg></span>
                <span className="listing-copy"><strong>Bolsa de tela</strong><span className="price">$95.00</span><span className="status status-sold">Vendido</span></span>
                <span className="row-actions"><span className="edit-button"><svg className="icon"><use href="#public-preview-i-pencil"/></svg><span>Editar</span></span><span className="more-button"><svg className="icon"><use href="#public-preview-i-more"/></svg></span></span>
              </div>
            </div>
          </div>
        </div>
      </section>),
};

export function PublicFeaturePanel({ feature }: { feature: PublicFeature }) {
  const Panel = panels[feature];
  return <PublicPreviewMotion kind={feature}><PreviewSymbols /><Panel /></PublicPreviewMotion>;
}
