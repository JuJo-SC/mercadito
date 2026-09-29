"use client";

import { useRef, useState } from "react";
import { StartConversationForm } from "@/components/start-conversation-form";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
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
  seller: { id: string; name: string | null };
};

type MarketplaceProps = {
  university: University;
  initialListings: ListingNotice[];
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

function formatNoticeDate(value: string) {
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
            listings?: ListingNotice[];
            hasMore?: boolean;
            nextCursor?: string | null;
            sortMode?: SortMode;
            hasInterestSignals?: boolean;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No pudimos cargar los artículos.");
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
          : "No pudimos cargar los artículos. Intenta de nuevo.";
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
    <section className="marketplace-section campus-marketplace page-width" id="avisos">
      <header className="campus-marketplace-header">
        <div>
          <h1>Artículos de tu campus.</h1>
          <p className="campus-name">{university.name}</p>
        </div>
        <div className="campus-marketplace-actions">
          <p>
            Pregunta por chat. La entrega y cualquier pago se acuerdan fuera de Mercadito.
          </p>
          <Link className="button-ink" href="/publicar">
            Publicar un artículo
            <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      {university.isTest ? (
        <p className="demo-banner campus-test-banner" role="note">
          <span className="demo-mark" aria-hidden="true">P</span>
          UMAN es un campus de prueba. Usa artículos ficticios mientras recorres el mercadito.
        </p>
      ) : null}

      <div className="listing-heading">
        <div>
          <h2>Encuentra algo para tu día.</h2>
          <p>
            {total} {total === 1 ? "artículo" : "artículos"} publicados en {university.name}
          </p>
        </div>
      </div>

      <form className="search-form" role="search" onSubmit={submitSearch}>
        <label htmlFor="market-search">Buscar artículos</label>
        <div className="search-row">
          <div className="search-input-wrap">
            <Search aria-hidden="true" size={19} strokeWidth={1.7} />
            <input
              id="market-search"
              name="q"
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Comida, ropa, tecnología…"
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
        <div className="sort-controls" role="group" aria-label="Ordenar artículos">
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
          <p>Buscando artículos…</p>
        </div>
      ) : listings.length ? (
        <>
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
                      {listing.isDemo ? <span className="notice-demo">Ejemplo</span> : null}
                    </span>
                  </span>
                  <span className="notice-seller">{listing.seller.name ?? "Estudiante"}</span>
                  <span className="notice-price">
                    {formatPrice(listing.price, listing.currency)}
                  </span>
                  <span className="notice-disclosure">
                    <span>Ver</span>
                    <ChevronDown aria-hidden="true" size={17} strokeWidth={1.8} />
                  </span>
                </summary>
                <div className="notice-expanded">
                  <div className="notice-description">
                    {listing.imageUrl ? (
                      <img
                        className="notice-photo"
                        src={listing.imageUrl}
                        alt={"Foto de " + listing.title}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
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
                  <StartConversationForm
                    listingId={listing.id}
                    sellerId={listing.seller.id}
                    sellerName={listing.seller.name ?? "Estudiante"}
                    currentUserId={currentUserId}
                    signedIn
                    isDemo={listing.isDemo}
                  />
                </div>
              </details>
            ))}
          </div>
          {hasMore ? (
            <div className="notice-pagination" aria-busy={loadingMore}>
              <p className="notice-pagination-count" aria-live="polite" aria-atomic="true">
                Mostrando {listings.length} de {total} artículos
              </p>
              <button
                className="button-ink"
                type="button"
                onClick={loadMoreListings}
                disabled={loadingMore || !nextCursor}
              >
                {loadingMore ? "Cargando…" : "Cargar más artículos"}
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
              ? "No encontramos artículos con esos filtros."
              : "Todavía no hay artículos publicados en este campus."}
          </p>
          <div className="empty-message-actions">
            {hasActiveFilters ? (
              <button type="button" className="text-action" onClick={clearFilters}>
                Quitar filtros
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            ) : (
              <Link className="text-action" href="/publicar">
                Publicar el primer artículo
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
