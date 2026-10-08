import Link from "next/link";
import { ArrowRight, BookOpen, Check, Pencil, Shirt, ShoppingBag } from "lucide-react";

const publicFeatures = {
  messages: {
    label: "Mensajes",
    description: "Habla con compradores y vendedores y acuerda la entrega. Comparte tu teléfono solo si lo deseas.",
    destination: "/mensajes",
  },
  publish: {
    label: "Publicar",
    description: "Vende lo que ya no usas, ropa que no te quedó o productos de tu emprendimiento, según el reglamento.",
    destination: "/publicar",
  },
  listings: {
    label: "Mis publicaciones",
    description: "Consulta tus artículos, edita tus publicaciones y actualiza su estado.",
    destination: "/mis-avisos",
  },
} as const;

export type PublicFeature = keyof typeof publicFeatures;

function FeatureExample({ feature }: { feature: PublicFeature }) {
  return (
    <span className={"feature-example feature-example-" + feature} aria-hidden="true">
      {feature === "messages" ? (
        <>
          <span className="example-message">¿Sigue disponible?</span>
          <span className="example-message example-message-reply">Sí, ¿nos vemos mañana? <Check size={12} /></span>
        </>
      ) : feature === "publish" ? (
        <>
          <span className="example-product"><Shirt size={24} strokeWidth={1.6} /><span>Ropa</span></span>
          <span className="example-product"><BookOpen size={24} strokeWidth={1.6} /><span>Libros</span></span>
          <span className="example-product"><ShoppingBag size={24} strokeWidth={1.6} /><span>Tu negocio</span></span>
        </>
      ) : (
        <>
          <span className="example-listing-photo"><BookOpen size={24} strokeWidth={1.6} /></span>
          <span className="example-listing-copy"><span>Libro de cálculo</span><span className="example-listing-status">En venta</span></span>
          <Pencil size={15} strokeWidth={1.7} />
        </>
      )}
    </span>
  );
}

export function PublicFeatureDetails({ feature }: { feature: PublicFeature }) {
  return (
    <>
      <span className="public-feature-description">{publicFeatures[feature].description}</span>
      <FeatureExample feature={feature} />
    </>
  );
}

export function LandingFeatureGuide() {
  return (
    <div className="landing-feature-guide">
      {(Object.keys(publicFeatures) as PublicFeature[]).map((feature) => (
        <Link
          className="landing-feature-link"
          href={"/ingresar?returnTo=" + encodeURIComponent(publicFeatures[feature].destination)}
          key={feature}
        >
          <strong>{publicFeatures[feature].label}<ArrowRight size={16} aria-hidden="true" /></strong>
          <PublicFeatureDetails feature={feature} />
        </Link>
      ))}
      <p className="feature-example-note">Ejemplos ilustrativos. Entra para usar estas funciones.</p>
    </div>
  );
}
