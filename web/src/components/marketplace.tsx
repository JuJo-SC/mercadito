"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Search,
} from "lucide-react";

type University = {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  isTest: boolean;
};

type ListingNotice = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  imageUrl: string | null;
  isDemo: boolean;
  createdAt: string;
  seller: { name: string | null };
};

type MarketplaceProps = {
  university: University | null;
  initialListings: ListingNotice[];
  canSignIn: boolean;
  applicationIntakeEnabled: boolean;
};

const categories = [
  { id: "ALL", label: "Todos" },
  { id: "BOOKS", label: "Libros" },
  { id: "TECHNOLOGY", label: "Tecnología" },
  { id: "HOME", label: "Hogar" },
  { id: "CLOTHING", label: "Ropa" },
  { id: "ACCESSORIES", label: "Accesorios" },
  { id: "SERVICES", label: "Servicios" },
  { id: "OTHER", label: "Otros" },
];

const categoryNames: Record<string, string> = {
  BOOKS: "Libros",
  TECHNOLOGY: "Tecnología",
  HOME: "Hogar",
  CLOTHING: "Ropa",
  ACCESSORIES: "Accesorios",
  SERVICES: "Servicios",
  OTHER: "Otros",
};

const conditionNames: Record<string, string> = {
  NEW: "Nuevo",
  LIKE_NEW: "Como nuevo",
  GOOD: "Buen estado",
  FAIR: "Con detalles",
};

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return "$" + price.toFixed(2);
  }
}

function formatNoticeDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value)).replace(".", "");
}

export function Marketplace({
  university,
  initialListings,
  canSignIn,
  applicationIntakeEnabled,
}: MarketplaceProps) {
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialListings.length);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentRequest = useRef<AbortController | null>(null);

  async function loadListings(nextQuery: string, nextCategory: string) {
    if (!university) return;
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ university: university.slug });
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "ALL") params.set("category", nextCategory);

    try {
      const response = await fetch("/api/listings?" + params.toString(), {
        signal: controller.signal,
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; total?: number; listings?: ListingNotice[] }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos cargar los avisos.");
      }
      setListings(payload?.listings ?? []);
      setTotal(payload?.total ?? 0);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los avisos. Intenta de nuevo.",
      );
    } finally {
      if (currentRequest.current === controller) setLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery);
    void loadListings(draftQuery, category);
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    void loadListings(query, nextCategory);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setCategory("ALL");
    void loadListings("", "ALL");
  }

  return (
    <>
      <section className="lead-section page-width" aria-labelledby="lead-title">
        <div className="lead-copy">
          <h1 id="lead-title">
            Lo que ya no usas puede servirle a alguien más.
          </h1>
          <p>
            Un mercadito hecho para encontrar y publicar artículos dentro de
            una comunidad universitaria.
          </p>
          <div className="lead-actions">
            <a className="button-ink" href="#avisos">
              Explorar avisos
              <ArrowDown aria-hidden="true" size={17} strokeWidth={1.8} />
            </a>
            <Link className="text-action" href="/publicar">
              Publicar un artículo
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <aside className="lead-print" aria-label="La gaceta del campus">
          <div className="print-registration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className="print-title">EN COMÚN</h2>
          <p>Una hoja abierta a lo que la comunidad comparte.</p>
          <div className="print-rules" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <a className="print-link" href="#avisos">
            Ir al índice
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </a>
        </aside>
      </section>

      <section className="marketplace-section page-width" id="avisos">
        <div className="campus-line">
          <div>
            <p className="campus-name">
              {university?.name ?? "Mercadito universitario"}
            </p>
            <p className="campus-access">
              {university?.isDemo
                ? "Edición de demostración"
                : university?.isTest
                  ? "Campus de prueba"
                  : university
                    ? "Comunidad universitaria"
                    : "Aún no hay comunidades activas"}
            </p>
          </div>
          {canSignIn ? (
            <Link className="campus-login" href="/ingresar">
              Entrar con mi universidad
              <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
            </Link>
          ) : null}
        </div>

        {university?.isDemo ? (
          <p className="demo-banner" role="note">
            <span className="demo-mark" aria-hidden="true">D</span>
            Estos avisos son ejemplos ficticios para mostrar cómo funciona el
            mercadito.
          </p>
        ) : university?.isTest ? (
          <p className="demo-banner" role="note">
            <span className="demo-mark" aria-hidden="true">P</span>
            UMAN es un campus de prueba. Usa artículos ficticios; los avisos
            serán visibles para otras cuentas activas de esta comunidad.
          </p>
        ) : null}

        <div className="listing-heading">
          <div>
            <h2>Avisos recientes</h2>
            <p>
              {total} {total === 1 ? "aviso" : "avisos"} en{" "}
              {university?.name ?? "tu comunidad"}
            </p>
          </div>
          <Link className="publish-link" href="/publicar">
            Publicar un aviso
            <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </Link>
        </div>

        <form className="search-form" role="search" onSubmit={submitSearch}>
          <label htmlFor="market-search">Buscar en los avisos</label>
          <div className="search-row">
            <div className="search-input-wrap">
              <Search aria-hidden="true" size={19} strokeWidth={1.7} />
              <input
                id="market-search"
                name="q"
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Libros, tecnología, ropa…"
                autoComplete="off"
              />
            </div>
            <button className="search-submit" type="submit" disabled={loading || !university}>
              {loading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </form>

        <div className="category-tabs" role="group" aria-label="Filtrar por categoría">
          {categories.map((item) => (
            <button
              className={
                category === item.id ? "category-tab is-selected" : "category-tab"
              }
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => selectCategory(item.id)}
              disabled={!university || loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="result-message result-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="text-action"
              onClick={() => void loadListings(query, category)}
            >
              Intentar de nuevo
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        ) : loading ? (
          <div className="result-message" aria-live="polite">
            <span className="loading-rule" />
            <p>Buscando avisos…</p>
          </div>
        ) : listings.length ? (
          <div className="notice-index" aria-live="polite">
            <div className="notice-columns" aria-hidden="true">
              <span>Índice</span>
              <span>Artículo y condición</span>
              <span>Publicado por</span>
              <span>Precio</span>
              <span />
            </div>
            {listings.map((listing, index) => (
              <details className="notice-entry" key={listing.id}>
                <summary className="notice-summary">
                  <span className="notice-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="notice-main">
                    <span className="notice-title">{listing.title}</span>
                    <span className="notice-meta">
                      <span>{categoryNames[listing.category] ?? "Otros"}</span>
                      <span className="meta-separator" aria-hidden="true">·</span>
                      <span>{conditionNames[listing.condition] ?? "Condición no indicada"}</span>
                      {listing.isDemo ? (
                        <span className="notice-demo">Ejemplo</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="notice-seller">
                    {listing.seller.name ?? "Estudiante"}
                  </span>
                  <span className="notice-price">
                    {formatPrice(listing.price, listing.currency)}
                  </span>
                  <span className="notice-disclosure">
                    <span>Leer</span>
                    <ChevronDown aria-hidden="true" size={17} strokeWidth={1.8} />
                  </span>
                </summary>
                <div className="notice-expanded">
                  <div className="notice-description">
                    <p>{listing.description}</p>
                    {listing.isDemo ? (
                      <span className="notice-demo-note">
                        Publicación ficticia de demostración.
                      </span>
                    ) : null}
                  </div>
                  <dl className="notice-details">
                    <div>
                      <dt>Publicado por</dt>
                      <dd>{listing.seller.name ?? "Estudiante"}</dd>
                    </div>
                    <div>
                      <dt>Fecha del aviso</dt>
                      <dd>{formatNoticeDate(listing.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Precio indicado</dt>
                      <dd>{formatPrice(listing.price, listing.currency)}</dd>
                    </div>
                  </dl>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="result-message empty-message" role="status">
            <p>
              {university
                ? "No encontramos avisos con esos filtros."
                : "Todavía no hay una comunidad para mostrar."}
            </p>
            <button type="button" className="text-action" onClick={clearFilters}>
              {university ? "Quitar filtros" : "Actualizar"}
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        )}

        <section className="university-invitation" aria-labelledby="invitation-title">
          <div>
            <h2>¿Tu universidad todavía no aparece?</h2>
            <p>
              {applicationIntakeEnabled
                ? "Comparte sus datos y el equipo revisará la integración antes de habilitar el acceso estudiantil."
                : "La recepción de solicitudes se abrirá cuando publiquemos el aviso de privacidad y el canal de atención."}
            </p>
          </div>
          <Link className="invitation-link" href="/universidades">
            {applicationIntakeEnabled
              ? "Solicitar integración"
              : "Conocer la integración"}
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </Link>
        </section>
      </section>
    </>
  );
}
