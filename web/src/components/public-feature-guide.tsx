import Link from "next/link";
import { ArrowRight, BookOpen, Camera, CheckCheck, Pencil, Send, Shirt, ShoppingBag } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";

const features = {
  messages: {
    title: "Ponte de acuerdo por aquí.",
    description: "Chatea con compradores y vendedores para preguntar por un producto y acordar la entrega.",
    note: "No necesitas compartir tu teléfono. Si ambos lo desean, pueden continuar por otro medio.",
    destination: "/mensajes",
    action: "Entrar a Mensajes",
    caption: "Ejemplo de una conversación sobre un producto.",
  },
  publish: {
    title: "Eso que tienes puede encontrar otro dueño.",
    description: "Publica lo que ya no usas, ropa que no te quedó o productos de tu emprendimiento.",
    note: "Todo de acuerdo con el reglamento del mercadito.",
    destination: "/publicar",
    action: "Entrar para publicar",
    caption: "Ejemplos de lo que puedes ofrecer.",
  },
  listings: {
    title: "Todo lo que publicas, en un solo lugar.",
    description: "Consulta tus artículos, edita sus detalles y actualiza su disponibilidad.",
    note: "Ten a la mano lo que sigue en venta, lo que apartaste y lo que ya vendiste.",
    destination: "/mis-avisos",
    action: "Entrar a Mis publicaciones",
    caption: "Ejemplo de cómo se organizan tus artículos.",
  },
} as const;

type PublicFeature = keyof typeof features;

function MessagesExample() {
  return (
    <div className="feature-demo-chat" aria-hidden="true">
      <div className="feature-demo-toolbar"><strong>Mensajes</strong><span>Compras · Ventas</span></div>
      <div className="feature-demo-chat-product">
        <span className="feature-demo-thumbnail"><Shirt size={34} strokeWidth={1.5} /></span>
        <div><strong>Sudadera azul</strong><span>$250.00</span></div>
      </div>
      <div className="feature-demo-bubbles">
        <p className="feature-demo-bubble">¡Hola! ¿Sigue disponible?</p>
        <p className="feature-demo-bubble is-reply">Sí, está en buen estado.<CheckCheck size={15} /></p>
        <p className="feature-demo-bubble">¿Nos vemos mañana a la salida?</p>
        <p className="feature-demo-bubble is-reply">¡Va! Nos ponemos de acuerdo por aquí.<CheckCheck size={15} /></p>
      </div>
      <div className="feature-demo-composer"><span>Escribe un mensaje…</span><Send size={19} /></div>
    </div>
  );
}

function PublishExample() {
  return (
    <div className="feature-demo-publish" aria-hidden="true">
      <div className="feature-demo-toolbar"><strong>Tu próxima publicación</strong><Camera size={20} /></div>
      <div className="feature-demo-products">
        <div className="feature-demo-product"><span><Shirt size={58} strokeWidth={1.35} /></span><strong>Ropa</strong><small>Que encuentre a quién le quede</small></div>
        <div className="feature-demo-product"><span><BookOpen size={58} strokeWidth={1.35} /></span><strong>Libros y más</strong><small>Lo que ya no necesitas</small></div>
        <div className="feature-demo-product"><span><ShoppingBag size={58} strokeWidth={1.35} /></span><strong>Tu emprendimiento</strong><small>Hecho por ti, para tu comunidad</small></div>
      </div>
      <div className="feature-demo-publish-summary"><Camera size={20} /><span>Fotos, una descripción y tu precio.</span></div>
    </div>
  );
}

function ListingsExample() {
  const rows = [
    { title: "Libro de cálculo", price: "$120.00", status: "En venta", Icon: BookOpen },
    { title: "Sudadera azul", price: "$250.00", status: "Apartado", Icon: Shirt },
    { title: "Bolsa de tela", price: "$95.00", status: "Vendido", Icon: ShoppingBag },
  ];
  return (
    <div className="feature-demo-listings" aria-hidden="true">
      <div className="feature-demo-toolbar"><strong>Mis publicaciones</strong><span>3 artículos</span></div>
      {rows.map(({ title, price, status, Icon }, index) => (
        <div className="feature-demo-listing" key={title}>
          <span className="feature-demo-thumbnail"><Icon size={34} strokeWidth={1.5} /></span>
          <div className="feature-demo-listing-copy"><strong>{title}</strong><span>{price}</span><span className={"feature-demo-status status-" + index}>{status}</span></div>
          <Pencil size={18} strokeWidth={1.7} />
        </div>
      ))}
    </div>
  );
}

export function PublicFeatureIntro({ feature }: { feature: PublicFeature }) {
  const content = features[feature];
  return (
    <>
      <SiteHeader />
      <main className={"feature-intro page-width feature-intro-" + feature}>
        <div className="feature-intro-copy">
          <h1>{content.title}</h1>
          <p className="feature-intro-description">{content.description}</p>
          <p className="feature-intro-note">{content.note}</p>
          <div className="feature-intro-actions">
            <Link className="button-ink" href={"/ingresar?returnTo=" + encodeURIComponent(content.destination)}>
              {content.action}<ArrowRight size={18} aria-hidden="true" />
            </Link>
            {feature === "publish" && <Link className="text-action" href="/publicar?demo=1">Probar publicación<ArrowRight size={16} aria-hidden="true" /></Link>}
          </div>
        </div>
        <figure className="feature-intro-visual">
          {feature === "messages" ? <MessagesExample /> : feature === "publish" ? <PublishExample /> : <ListingsExample />}
          <figcaption>{content.caption} Datos ilustrativos.</figcaption>
        </figure>
      </main>
      <SiteFooter />
    </>
  );
}
