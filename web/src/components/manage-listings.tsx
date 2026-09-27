"use client";

import Link from "next/link";
import { useState } from "react";

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
    { label: "Marcar vendido", status: "SOLD" },
    { label: "Archivar", status: "ARCHIVED" },
  ],
  RESERVED: [
    { label: "Volver a publicar", status: "PUBLISHED" },
    { label: "Marcar vendido", status: "SOLD" },
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
    timeZone: "UTC",
  }).format(new Date(value));
}

export function ManageListings({ initialListings }: { initialListings: ManagedListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changeStatus(listing: ManagedListing, status: ListingStatus) {
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
        throw new Error(result?.error ?? "No pudimos actualizar el aviso. Intenta de nuevo.");
      }

      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, status } : item)),
      );
      setMessage("“" + listing.title + "” ahora está " + statusLabels[status].toLowerCase() + ".");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos actualizar el aviso. Intenta de nuevo.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (listings.length === 0) {
    return (
      <section className="seller-empty" aria-labelledby="seller-empty-title">
        <h2 id="seller-empty-title">El índice todavía está en blanco.</h2>
        <p>Tu primer clasificado empieza con un título que se entienda al leerlo en la lista.</p>
        <Link className="button-ink" href="/publicar">Publicar un artículo</Link>
      </section>
    );
  }

  return (
    <>
      <p className="seller-feedback" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </p>
      {error ? <p className="seller-error" role="alert">{error}</p> : null}
      <ol className="seller-listing-index" aria-label="Tus avisos">
        {listings.map((listing, index) => (
          <li className="seller-listing-entry" key={listing.id} aria-busy={pendingId === listing.id}>
            <div className="seller-listing-heading">
              <div>
                <div className="seller-listing-state-line">
                  <span className={"seller-status seller-status-" + listing.status.toLowerCase()}>
                    {statusLabels[listing.status]}
                  </span>
                  <span>Creado el {formatDate(listing.createdAt)}</span>
                </div>
                <h3 id={"seller-listing-" + index}>{listing.title}</h3>
              </div>
              <strong>{formatPrice(listing.price)}</strong>
            </div>
            <p className="seller-listing-description">{listing.description}</p>
            <p className="seller-listing-meta">
              <span>{categoryLabels[listing.category] ?? "Otros"}</span>
              <span aria-hidden="true">·</span>
              <span>{conditionLabels[listing.condition] ?? "Condición no especificada"}</span>
            </p>
            <div className="seller-listing-actions" role="group" aria-label={"Acciones para " + listing.title}>
              {statusActions[listing.status].map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={pendingId !== null}
                  aria-label={action.label + ": " + listing.title}
                  onClick={() => void changeStatus(listing, action.status)}
                >
                  {pendingId === listing.id ? "Guardando…" : action.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
