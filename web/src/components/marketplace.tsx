"use client";

import { useRef, useState } from "react";
import { StartConversationForm } from "@/components/start-conversation-form";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Camera,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Search,
} from "lucide-react";

type SortMode = "RECENT" | "INTEREST";

type University = {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  isTest: boolean;
};

type MarketplaceListing = {
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
  seller: { id: string; name: string | null };
};

type MarketplaceProps = {
  university: University;
  initialListings: MarketplaceListing[];
  initialTotal: number;
  initialSort: SortMode;
  hasInterestSignals: boolean;
  currentUserId: string;
};

const categories = [
  { id: "ALL", label: "Todos" },
  { id: "FOOD", label: "Comida" },
  { id: "CLOTHING", label: "Ropa" },
  { id: "TECHNOLOGY", label: "Tecnología" },
  { id: "HOME", label: "Hogar" },
  { id: "ACCESSORIES", label: "Accesorios" },
  { id: "BOOKS", label: "Libros" },
  { id: "SERVICES", label: "Servicios" },
  { id: "OTHER", label: "Otros" },
];

const categoryNames: Record<string, string> = {
  FOOD: "Comida",
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

function formatListingDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value)).replace(".", "");
}

export function Marketplace({
  university,
  initialListings,
  initialTotal,
  initialSort,
  hasInterestSignals: initialHasInterestSignals,
  currentUserId,
}: MarketplaceProps) {
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialTotal > initialListings.length);
  const [nextCursor, setNextCursor] = useState(initialListings.at(-1)?.id ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortMode, setSortMode] = useState<SortMode>(initialSort);
  const [hasInterestSignals, setHasInterestSignals] = useState(initialHasInterestSignals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentRequest = useRef<AbortController | null>(null);

  async function loadListings(
    nextQuery: string,
    nextCategory: string,
    nextSort: SortMode,
    options: { append?: boolean; cursor?: string } = {},
  ) {
    const append = options.append ?? false;
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    if (append) {
      setLoadingMore(true);
      setLoadMoreError("");
    } else {
      setLoading(true);
      setLoadingMore(false);
      setError("");
      setLoadMoreError("");
    }

    const params = new URLSearchParams({
      university: university.slug,
      sort: nextSort,
    });
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "ALL") params.set("category", nextCategory);
    if (options.cursor) params.set("cursor", options.cursor);

    try {
      const response = await fetch("/api/listings?" + params.toString(), {
        signal: controller.signal,
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            total?: number;
            listings?: MarketplaceListing[];
            hasMore?: boolean;
            nextCursor?: string | null;
            sortMode?: SortMode;
            hasInterestSignals?: boolean;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos cargar las publicaciones.");
      }

      const incoming = payload?.listings ?? [];
      if (append) {
        setListings((current) => {
          const seen = new Set(current.map((listing) => listing.id));
          return [...current, ...incoming.filter((listing) => !seen.has(listing.id))];
        });
      } else {
        setListings(incoming);
      }
      setTotal(payload?.total ?? 0);
      setHasMore(payload?.hasMore ?? false);
      setNextCursor(payload?.nextCursor ?? null);
      setSortMode(payload?.sortMode ?? nextSort);
      setHasInterestSignals(payload?.hasInterestSignals ?? false);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      const message =
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar las publicaciones. Intenta de nuevo.";
      if (append) setLoadMoreError(message);
      else setError(message);
    } finally {
      if (currentRequest.current === controller) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery);
    void loadListings(draftQuery, category, sortMode);
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    void loadListings(query, nextCategory, sortMode);
  }

  function selectSort(nextSort: SortMode) {
    if (nextSort === sortMode) return;
    void loadListings(query, category, nextSort);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setCategory("ALL");
    void loadListings("", "ALL", sortMode);
  }

  function loadMoreListings() {
    if (!nextCursor || !hasMore || loadingMore) return;
    void loadListings(query, category, sortMode, { append: true, cursor: nextCursor });
  }

  const hasActiveFilters = Boolean(query.trim()) || category !== "ALL";

  return (
    <section className="marketplace-section campus-marketplace page-width" id="productos">
      <header className="campus-marketplace-header">
        <div>
          <h1>Mercadito de tu campus.</h1>
          <p className="campus-name">{university.name}</p>
        </div>
        <div className="campus-marketplace-actions">
          <p>
            Pregunta por chat. La entrega y cualquier pago se acuerdan fuera de Mercadito.
          </p>
          <Link className="button-ink" href="/publicar">
            Publicar un producto
            <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      {university.isTest ? (
        <p className="demo-banner campus-test-banner" role="note">
          <span className="demo-mark" aria-hidden="true">P</span>
          UMAN es un campus de prueba. Recorre publicaciones de ejemplo mientras conoces el mercadito.
        </p>
      ) : null}

      <div className="listing-heading">
        <div>
          <h2>Encuentra algo para tu día.</h2>
          <p>
            {total} {total === 1 ? "publicación" : "publicaciones"}
          </p>
        </div>
      </div>

      <form className="search-form" role="search" onSubmit={submitSearch}>
        <label htmlFor="market-search">Buscar publicaciones</label>
        <div className="search-row">
          <div className="search-input-wrap">
            <Search aria-hidden="true" size={19} strokeWidth={1.7} />
            <input
              id="market-search"
              name="q"
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Comida, ropa, libros, tecnología…"
              autoComplete="off"
            />
          </div>
          <button className="search-submit" type="submit" disabled={loading}>
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      <div className="marketplace-filters">
        <div className="category-tabs" role="group" aria-label="Filtrar por categoría">
          {categories.map((item) => (
            <button
              className={category === item.id ? "category-tab is-selected" : "category-tab"}
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => selectCategory(item.id)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="sort-controls" role="group" aria-label="Ordenar publicaciones">
          <span>Ordenar</span>
          <button
            className={sortMode === "INTEREST" ? "sort-button is-selected" : "sort-button"}
            type="button"
            aria-pressed={sortMode === "INTEREST"}
            onClick={() => selectSort("INTEREST")}
            disabled={loading || !hasInterestSignals}
          >
            Con más interés
          </button>
          <button
            className={sortMode === "RECENT" ? "sort-button is-selected" : "sort-button"}
            type="button"
            aria-pressed={sortMode === "RECENT"}
            onClick={() => selectSort("RECENT")}
            disabled={loading}
          >
            Más recientes
          </button>
        </div>
      </div>

      <p className="sort-context" aria-live="polite">
        {sortMode === "INTEREST"
          ? "Ordenados por conversaciones iniciadas; el contenido de los mensajes no se muestra."
          : hasInterestSignals
            ? "Ordenados por fecha de publicación."
            : "Aún no hay suficiente actividad para marcar tendencias; mostramos lo más reciente."}
      </p>

      {error ? (
        <div className="result-message result-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="text-action"
            onClick={() => void loadListings(query, category, sortMode)}
          >
            Intentar de nuevo
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      ) : loading ? (
        <div className="result-message" aria-live="polite">
          <span className="loading-rule" />
          <p>Buscando publicaciones…</p>
        </div>
      ) : listings.length ? (
        <>
          <div className="product-grid" aria-live="polite">
            {listings.map((listing) => (
              <details className="product-card" key={listing.id}>
                <summary className="product-card-summary">
                  <span className="product-card-media">
                    {listing.imageUrl ? (
                      <img
                        className="product-card-image"
                        src={listing.imageUrl}
                        alt={"Foto de " + listing.title}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="product-card-no-image">
                        <Camera aria-hidden="true" size={25} strokeWidth={1.5} />
                        <span>Sin foto todavía</span>
                      </span>
                    )}
                    {listing.imageUrl ? (
                      <span className="product-card-photo-count">1 foto</span>
                    ) : null}
                    {listing.isDemo ? (
                      <span className="product-card-demo">Ejemplo</span>
                    ) : null}
                  </span>
                  <span className="product-card-copy">
                    <span className="product-card-meta">
                      <span className="product-card-category">
                        {categoryNames[listing.category] ?? "Otros"}
                      </span>
                      <span className="product-card-separator" aria-hidden="true">·</span>
                      <span className="product-card-condition">
                        {conditionNames[listing.condition] ?? "Condición no indicada"}
                      </span>
                    </span>
                    <span className="product-card-title">{listing.title}</span>
                    <span className="product-card-price">
                      {formatPrice(listing.price, listing.currency)}
                    </span>
                    <span className="product-card-seller">
                      Por {listing.seller.name ?? "Estudiante"}
                    </span>
                    <span className="product-card-disclosure">
                      <span className="product-disclosure-closed">Ver publicación</span>
                      <span className="product-disclosure-open">Ocultar detalles</span>
                      <ChevronDown aria-hidden="true" size={17} strokeWidth={1.8} />
                    </span>
                  </span>
                </summary>
                <div className="product-expanded">
                  <div className="product-description">
                    <p>{listing.description}</p>
                    {listing.isDemo ? (
                      <span className="product-demo-note">
                        Publicación ficticia de demostración.
                      </span>
                    ) : null}
                  </div>
                  <div className="product-contact">
                    <dl className="product-details">
                      <div>
                        <dt>Publicado por</dt>
                        <dd>{listing.seller.name ?? "Estudiante"}</dd>
                      </div>
                      <div>
                        <dt>Fecha de publicación</dt>
                        <dd>{formatListingDate(listing.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Precio indicado</dt>
                        <dd>{formatPrice(listing.price, listing.currency)}</dd>
                      </div>
                    </dl>
                    <StartConversationForm
                      listingId={listing.id}
                      sellerId={listing.seller.id}
                      sellerName={listing.seller.name ?? "Estudiante"}
                      currentUserId={currentUserId}
                      signedIn
                      isDemo={listing.isDemo}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
          {hasMore ? (
            <div className="product-pagination" aria-busy={loadingMore}>
              <p className="product-pagination-count" aria-live="polite" aria-atomic="true">
                Mostrando {listings.length} de {total} publicaciones
              </p>
              <button
                className="button-ink"
                type="button"
                onClick={loadMoreListings}
                disabled={loadingMore || !nextCursor}
              >
                {loadingMore ? "Cargando…" : "Cargar más publicaciones"}
                <ArrowDown aria-hidden="true" size={17} strokeWidth={1.8} />
              </button>
            </div>
          ) : null}
          {loadMoreError ? (
            <div className="result-message result-error" role="alert">
              <p>{loadMoreError}</p>
              <button
                type="button"
                className="text-action"
                onClick={loadMoreListings}
              >
                Intentar de nuevo
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="result-message empty-message" role="status">
          <p>
            {hasActiveFilters
              ? "No encontramos publicaciones con esos filtros."
              : "Todavía no hay publicaciones en este campus."}
          </p>
          <div className="empty-message-actions">
            {hasActiveFilters ? (
              <button type="button" className="text-action" onClick={clearFilters}>
                Quitar filtros
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            ) : (
              <Link className="text-action" href="/publicar">
                Crear la primera publicación
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
