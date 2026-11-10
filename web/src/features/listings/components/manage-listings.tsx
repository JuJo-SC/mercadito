"use client";

import Link from "next/link";
import { DismissibleDetails } from "@/components/dismissible-details";
import { useRef, useState } from "react";
import { Archive, Bookmark, Check, MoreHorizontal, Pencil, Plus, RotateCcw } from "lucide-react";
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
  PUBLISHED: "En venta",
  RESERVED: "Apartado",
  SOLD: "Vendido",
  ARCHIVED: "Archivado",
};

const categoryLabels: Record<string, string> = {
  FOOD: "Alimentos",
  BOOKS: "Libros y material académico",
  TECHNOLOGY: "Dispositivos electrónicos",
  HOME: "Decoración y artículos de oficina u hogar",
  CLOTHING: "Ropa",
  ACCESSORIES: "Accesorios y complementos",
  SERVICES: "Servicios",
  OTHER: "Otros",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nuevo",
  LIKE_NEW: "Usado · Como nuevo",
  GOOD: "Usado · Buen estado",
  FAIR: "Usado · Con detalles",
};

const statusActions: Record<ListingStatus, { label: string; status: ListingStatus }[]> = {
  DRAFT: [{ label: "Publicar", status: "PUBLISHED" }, { label: "Archivar", status: "ARCHIVED" }],
  PUBLISHED: [
    { label: "Apartar producto", status: "RESERVED" },
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
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export function ManageListings({ initialListings }: { initialListings: ManagedListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [filter, setFilter] = useState<"all" | "PUBLISHED" | "RESERVED" | "SOLD">("all");
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

  const counts = {
    all: listings.length,
    PUBLISHED: listings.filter((l) => l.status === "PUBLISHED").length,
    RESERVED: listings.filter((l) => l.status === "RESERVED").length,
    SOLD: listings.filter((l) => l.status === "SOLD").length,
  };

  const tabs: { id: "all" | "PUBLISHED" | "RESERVED" | "SOLD"; label: string; count: number; dotClass?: string }[] = [
    { id: "all", label: "Todas", count: counts.all },
    { id: "PUBLISHED", label: "En venta", count: counts.PUBLISHED, dotClass: "seller-dot-published" },
    { id: "RESERVED", label: "Apartadas", count: counts.RESERVED, dotClass: "seller-dot-reserved" },
    { id: "SOLD", label: "Vendidas", count: counts.SOLD, dotClass: "seller-dot-sold" },
  ];

  const visibleListings = listings.filter((listing) => {
    if (filter === "all") return true;
    return listing.status === filter;
  });

  return (
    <div className="seller-management">
      <div className="seller-inventory-header">
        <div className="seller-inventory-title-group">
          <h1>Mis publicaciones</h1>
          <div className="seller-filter-tabs" role="tablist" aria-label="Filtrar publicaciones por estado">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                className={"seller-filter-pill" + (filter === tab.id ? " is-active" : "")}
                onClick={() => setFilter(tab.id)}
              >
                {tab.dotClass ? <span className={"seller-tab-dot " + tab.dotClass} /> : null}
                <span>{tab.label}</span>
                <span className="seller-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="seller-inventory-action">
          <Link className="button-ink seller-publish-btn" href="/publicar">
            <Plus aria-hidden="true" size={16} /> Publicar
          </Link>
        </div>
      </div>

      <p className="seller-feedback" role="status" aria-live="polite" aria-atomic="true">{message}</p>
      {error ? <p className="seller-error" role="alert">{error}</p> : null}

      {listings.length === 0 ? (
        <section className="seller-empty" aria-labelledby="seller-empty-title">
          <h2 id="seller-empty-title">Todavía no tienes publicaciones.</h2>
          <p>Crea tu primera publicación con un título fácil de reconocer.</p>
          <Link className="button-ink" href="/publicar">Crear una publicación</Link>
        </section>
      ) : visibleListings.length === 0 ? (
        <div className="seller-empty-filtered">
          <p>No tienes publicaciones en este estado.</p>
        </div>
      ) : (
        <ol className="seller-product-list" aria-label="Listado de publicaciones">
          {visibleListings.map((listing) => (
            <li
              className={"seller-product-entry" + (listing.status === "SOLD" ? " is-sold" : "")}
              key={listing.id}
              aria-busy={pendingId === listing.id}
            >
              <div className="seller-product-thumb-box">
                <ProductThumbnail photoUrl={listing.photoUrl} title={listing.title} />
                {listing.status === "SOLD" ? (
                  <span className="seller-sold-overlay" aria-hidden="true">Vendido</span>
                ) : null}
              </div>

              <div className="seller-product-content">
                <div className="seller-product-top">
                  <div className="seller-product-state">
                    <span className={"seller-status seller-status-" + listing.status.toLowerCase()}>
                      {listing.status === "PUBLISHED" ? <span className="seller-status-indicator" /> : null}
                      {listing.status === "RESERVED" ? <Bookmark aria-hidden="true" size={12} /> : null}
                      {listing.status === "SOLD" ? <Check aria-hidden="true" size={12} /> : null}
                      {statusLabels[listing.status]}
                    </span>
                    <time dateTime={listing.createdAt}>{formatDate(listing.createdAt)}</time>
                  </div>
                  <h3>{listing.title}</h3>
                  <p className="seller-product-meta">
                    {categoryLabels[listing.category] ?? "Otros"} · {conditionLabels[listing.condition] ?? "Condición no especificada"}
                  </p>
                </div>

                <div className="seller-product-bottom">
                  <strong className="seller-product-price">{formatPrice(listing.price)}</strong>
                  <div className="seller-product-actions" role="group" aria-label={"Acciones para " + listing.title}>
                    <Link
                      href={"/publicar?editar=" + encodeURIComponent(listing.id)}
                      className="seller-action-icon-btn"
                      aria-label={"Editar: " + listing.title}
                      title="Editar"
                    >
                      <Pencil aria-hidden="true" size={15} />
                    </Link>

                    <DismissibleDetails className="seller-more-actions">
                      <summary
                        className="seller-action-icon-btn"
                        aria-label={"Más opciones para " + listing.title}
                        title="Más opciones"
                      >
                        <MoreHorizontal aria-hidden="true" size={16} />
                      </summary>
                      <div className="seller-action-menu">
                        {statusActions[listing.status].map((action) => {
                          const Icon =
                            action.status === "SOLD"
                              ? Check
                              : action.status === "RESERVED"
                                ? Bookmark
                                : action.status === "ARCHIVED"
                                  ? Archive
                                  : RotateCcw;
                          return (
                            <button
                              key={action.status}
                              type="button"
                              disabled={pendingId !== null}
                              className={
                                action.status === "SOLD" || action.status === "PUBLISHED"
                                  ? "seller-action-primary"
                                  : ""
                              }
                              aria-label={action.label + ": " + listing.title}
                              onClick={() => void changeStatus(listing, action.status)}
                            >
                              <Icon aria-hidden="true" size={15} />
                              {pendingId === listing.id ? "Guardando…" : action.label}
                            </button>
                          );
                        })}
                      </div>
                    </DismissibleDetails>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}