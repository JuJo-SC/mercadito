"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Archive, Check, Pencil, Bookmark, RotateCcw } from "lucide-react";
import { ProductThumbnail } from "@/features/listings/components/product-thumbnail";

type ListingStatus = "DRAFT" | "PUBLISHED" | "RESERVED" | "SOLD" | "ARCHIVED";

type ManagedListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: ListingStatus;
  createdAt: string;
  photoUrl: string | null;
};

const statusLabels: Record<ListingStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  RESERVED: "Apartado",
  SOLD: "Vendido",
  ARCHIVED: "Archivado",
};

const categoryLabels: Record<string, string> = {
  BOOKS: "Libros y apuntes",
  TECHNOLOGY: "Tecnología",
  HOME: "Hogar",
  CLOTHING: "Ropa",
  ACCESSORIES: "Accesorios",
  SERVICES: "Servicios",
  OTHER: "Otros",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nuevo",
  LIKE_NEW: "Como nuevo",
  GOOD: "Buen estado",
  FAIR: "Con detalles",
};

const statusActions: Record<ListingStatus, { label: string; status: ListingStatus }[]> = {
  DRAFT: [{ label: "Publicar", status: "PUBLISHED" }, { label: "Archivar", status: "ARCHIVED" }],
  PUBLISHED: [
    { label: "Apartar", status: "RESERVED" },
    { label: "Marcar como vendido", status: "SOLD" },
    { label: "Archivar", status: "ARCHIVED" },
  ],
  RESERVED: [
    { label: "Quitar apartado", status: "PUBLISHED" },
    { label: "Marcar como vendido", status: "SOLD" },
    { label: "Archivar", status: "ARCHIVED" },
  ],
  SOLD: [
    { label: "Volver a publicar", status: "PUBLISHED" },
    { label: "Archivar", status: "ARCHIVED" },
  ],
  ARCHIVED: [{ label: "Volver a publicar", status: "PUBLISHED" }],
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export function ManageListings({ initialListings }: { initialListings: ManagedListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  async function changeStatus(listing: ManagedListing, status: ListingStatus) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setPendingId(listing.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/listings/" + listing.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "No pudimos actualizar la publicación. Intenta de nuevo.");
      }

      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, status } : item)),
      );
      setMessage("“" + listing.title + "” ahora está " + statusLabels[status].toLowerCase() + ".");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos actualizar la publicación. Intenta de nuevo.",
      );
    } finally {
      requestInFlight.current = false;
      setPendingId(null);
    }
  }

  if (listings.length === 0) {
    return (
      <section className="seller-empty" aria-labelledby="seller-empty-title">
        <h2 id="seller-empty-title">Todavía no tienes publicaciones.</h2>
        <p>Crea tu primera publicación con un título fácil de reconocer.</p>
        <Link className="button-ink" href="/publicar">Crear una publicación</Link>
      </section>
    );
  }

  const groups = [
    { id: "active", title: "En venta", statuses: ["PUBLISHED", "RESERVED"] },
    { id: "drafts", title: "Borradores", statuses: ["DRAFT"] },
    { id: "archived", title: "Archivadas", statuses: ["ARCHIVED"] },
    { id: "sold", title: "Vendidas", statuses: ["SOLD"] },
  ].map((group) => ({ ...group, listings: listings.filter((listing) => group.statuses.includes(listing.status)) }))
    .filter((group) => group.listings.length > 0);

  return (
    <>
      <p className="seller-feedback" role="status" aria-live="polite" aria-atomic="true">{message}</p>
      {error ? <p className="seller-error" role="alert">{error}</p> : null}
      <p className="seller-reservation-help">Apartar pausa la publicación mientras acuerdas la entrega. Puedes quitar el apartado cuando quieras.</p>
      {groups.map((group) => (
        <section className="seller-product-group" key={group.id} aria-labelledby={"seller-group-" + group.id}>
          <div className="seller-product-group-heading">
            <h2 id={"seller-group-" + group.id}>{group.title}</h2>
            <span>{group.listings.length}</span>
          </div>
          <ol className="seller-product-list" aria-label={group.title}>
            {group.listings.map((listing) => (
              <li className="seller-product-entry" key={listing.id} aria-busy={pendingId === listing.id}>
                <div className="seller-product-summary">
                  <ProductThumbnail photoUrl={listing.photoUrl} title={listing.title} />
                  <div className="seller-product-content">
                    <div className="seller-product-state">
                      <span className={"seller-status seller-status-" + listing.status.toLowerCase()}>{statusLabels[listing.status]}</span>
                      <time dateTime={listing.createdAt}>{formatDate(listing.createdAt)}</time>
                    </div>
                    <h3>{listing.title}</h3>
                    <strong className="seller-product-price">{formatPrice(listing.price)}</strong>
                    <p className="seller-product-meta">{categoryLabels[listing.category] ?? "Otros"} · {conditionLabels[listing.condition] ?? "Condición no especificada"}</p>
                  </div>
                </div>
                <p className="seller-product-description">{listing.description}</p>
                <div className="seller-product-actions" role="group" aria-label={"Acciones para " + listing.title}>
                  <Link href={"/publicar?editar=" + encodeURIComponent(listing.id)} aria-label={"Editar contenido: " + listing.title}>
                    <Pencil aria-hidden="true" size={16} />Editar
                  </Link>
                  {statusActions[listing.status].map((action) => {
                    const Icon = action.status === "SOLD" ? Check : action.status === "RESERVED" ? Bookmark : action.status === "ARCHIVED" ? Archive : RotateCcw;
                    return (
                      <button key={action.status} type="button" disabled={pendingId !== null}
                        className={action.status === "SOLD" || action.status === "PUBLISHED" ? "seller-action-primary" : ""}
                        aria-label={action.label + ": " + listing.title}
                        onClick={() => void changeStatus(listing, action.status)}>
                        <Icon aria-hidden="true" size={16} />
                        {pendingId === listing.id ? "Guardando…" : action.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
