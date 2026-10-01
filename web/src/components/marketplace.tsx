"use client";

import { useEffect, useRef, useState } from "react";
import { StartConversationForm } from "@/components/start-conversation-form";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Search,
  Store,
  X,
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
  imageUrls: string[];
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
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (!selectedListing) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      rootOverflow: root.style.overflow,
      rootScrollBehavior: root.style.scrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    root.style.scrollBehavior = "auto";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.paddingRight = previous.bodyPaddingRight;
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = previous.rootScrollBehavior;
    };
  }, [selectedListing]);

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

  function openListing(listing: MarketplaceListing) {
    setSelectedListing(listing);
    setSelectedPhotoIndex(0);
    if (detailDialogRef.current && !detailDialogRef.current.open) {
      detailDialogRef.current.showModal();
    }
  }

  function moveSelectedPhoto(direction: -1 | 1) {
    if (!selectedListing || selectedListing.imageUrls.length < 2) return;
    setSelectedPhotoIndex((current) =>
      (current + direction + selectedListing.imageUrls.length) % selectedListing.imageUrls.length,
    );
  }

  const hasActiveFilters = Boolean(query.trim()) || category !== "ALL";

  return (
    <section className="marketplace-section campus-marketplace page-width" id="productos">
      <header className="campus-marketplace-header">
        <div>
          <h1>Mercadito</h1>
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
        <p className="demo-banner campus-test-banner campus-test-banner-top" role="note">
          <span className="demo-mark" aria-hidden="true">P</span>
          UMAN es un campus de prueba. Recorre publicaciones de ejemplo mientras conoces el mercadito.
        </p>
      ) : null}

      <div className="marketplace-layout">
        <aside className="marketplace-sidebar" aria-label="Mercadito, campus y filtros">
          <div className="marketplace-sidebar-identity">
            <h1 className="marketplace-sidebar-title">
              <Link className="brand-lockup marketplace-sidebar-brand" href="/" aria-label="Mercadito, inicio">
                <span className="brand-symbol" aria-hidden="true">
                  <Store aria-hidden="true" size={21} strokeWidth={1.9} />
                </span>
                <span className="brand-name">Mercadito</span>
              </Link>
            </h1>
            <p className="campus-name">{university.name}</p>
          </div>
          {university.isTest ? (
            <p className="demo-banner campus-test-banner campus-test-banner-sidebar" role="note">
              <span className="demo-mark" aria-hidden="true">P</span>
              UMAN es un campus de prueba. Recorre publicaciones de ejemplo mientras conoces el mercadito.
            </p>
          ) : null}
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
            <div className="marketplace-category-section">
              <h2 className="marketplace-sidebar-heading">Categorías</h2>
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
          <div className="marketplace-sidebar-publish">
            <Link className="button-ink" href="/publicar">
              Publicar un producto
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
            </Link>
            <p className="marketplace-sidebar-disclosure">
              Pregunta por chat. La entrega y cualquier pago se acuerdan fuera de Mercadito.
            </p>
          </div>
        </aside>
        <div className="marketplace-results">
          <div className="listing-heading">
            <div>
              <h2>Encuentra algo para tu día.</h2>
              <p>
                {total} {total === 1 ? "publicación" : "publicaciones"}
              </p>
            </div>
          </div>

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
                  <button
                    className="product-card"
                    key={listing.id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Ver publicación: ${listing.title}, ${formatPrice(listing.price, listing.currency)}`}
                    onClick={() => openListing(listing)}
                  >
                    <span className="product-card-media">
                      {listing.imageUrls[0] ? (
                        <img
                          className="product-card-image"
                          src={listing.imageUrls[0]}
                          alt={"Foto de " + listing.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="product-card-no-image">
                          <Camera aria-hidden="true" size={28} strokeWidth={1.6} />
                          <span>Sin foto</span>
                        </span>
                      )}
                      {listing.imageUrls.length ? (
                        <span className="product-card-photo-count">
                          <Camera aria-hidden="true" size={13} strokeWidth={2} />
                          {listing.imageUrls.length} {listing.imageUrls.length === 1 ? "foto" : "fotos"}
                        </span>
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
                        Ver detalles
                        <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                      </span>
                    </span>
                  </button>
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

        </div>
      </div>

      <dialog
        ref={detailDialogRef}
        className="listing-detail-dialog"
        aria-labelledby="listing-detail-title"
        onClose={() => {
          setSelectedListing(null);
          setSelectedPhotoIndex(0);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        {selectedListing ? (
          <div className="listing-detail-shell">
            <button
              className="listing-detail-close"
              type="button"
              aria-label="Cerrar detalles"
              onClick={() => detailDialogRef.current?.close()}
            >
              <X aria-hidden="true" size={19} strokeWidth={1.9} />
            </button>
            <div className="listing-detail-gallery" aria-label="Fotos del producto">
              {selectedListing.imageUrls.length ? (
                <>
                  <div className="listing-detail-image-wrap">
                    <img
                      key={selectedListing.imageUrls[selectedPhotoIndex]}
                      src={selectedListing.imageUrls[selectedPhotoIndex]}
                      alt={`Foto ${selectedPhotoIndex + 1} de ${selectedListing.title}`}
                      decoding="async"
                    />
                    {selectedListing.imageUrls.length > 1 ? (
                      <div className="listing-gallery-arrows">
                        <button
                          type="button"
                          aria-label="Ver foto anterior"
                          onClick={() => moveSelectedPhoto(-1)}
                        >
                          <ChevronLeft aria-hidden="true" size={20} />
                        </button>
                        <button
                          type="button"
                          aria-label="Ver foto siguiente"
                          onClick={() => moveSelectedPhoto(1)}
                        >
                          <ChevronRight aria-hidden="true" size={20} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {selectedListing.imageUrls.length > 1 ? (
                    <div className="listing-gallery-pagination">
                      <span aria-live="polite">
                        {selectedPhotoIndex + 1} de {selectedListing.imageUrls.length} fotos
                      </span>
                      <div role="group" aria-label="Elegir foto">
                        {selectedListing.imageUrls.map((_, index) => (
                          <button
                            className={index === selectedPhotoIndex ? "is-selected" : ""}
                            key={index}
                            type="button"
                            aria-label={`Mostrar foto ${index + 1} de ${selectedListing.imageUrls.length}`}
                            aria-pressed={index === selectedPhotoIndex}
                            onClick={() => setSelectedPhotoIndex(index)}
                          >
                            <span aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="listing-detail-no-image">
                  <Camera aria-hidden="true" size={36} strokeWidth={1.5} />
                  <span>Este artículo aún no tiene fotos.</span>
                </div>
              )}
            </div>
            <div className="listing-detail-info">
              <div className="listing-detail-meta">
                <span>{categoryNames[selectedListing.category] ?? "Otros"}</span>
                <span aria-hidden="true">·</span>
                <span>{conditionNames[selectedListing.condition] ?? "Condición no indicada"}</span>
              </div>
              <h2 id="listing-detail-title">{selectedListing.title}</h2>
              <p className="listing-detail-price">
                {formatPrice(selectedListing.price, selectedListing.currency)}
              </p>
              <dl className="listing-detail-facts">
                <div>
                  <dt>Condición</dt>
                  <dd>{conditionNames[selectedListing.condition] ?? "No indicada"}</dd>
                </div>
                <div>
                  <dt>Publicado por</dt>
                  <dd>{selectedListing.seller.name ?? "Estudiante"}</dd>
                </div>
                <div>
                  <dt>Fecha de publicación</dt>
                  <dd>{formatListingDate(selectedListing.createdAt)}</dd>
                </div>
                <div>
                  <dt>Campus</dt>
                  <dd>{university.name}</dd>
                </div>
              </dl>
              <section className="listing-detail-description">
                <h3>Descripción</h3>
                <p>{selectedListing.description}</p>
              </section>
              {selectedListing.isDemo ? (
                <p className="listing-detail-demo-note" role="note">
                  Publicación ficticia de demostración. No representa una oferta real.
                </p>
              ) : null}
              <div className="listing-detail-contact">
                <StartConversationForm
                  listingId={selectedListing.id}
                  sellerId={selectedListing.seller.id}
                  sellerName={selectedListing.seller.name ?? "Estudiante"}
                  currentUserId={currentUserId}
                  signedIn
                  isDemo={selectedListing.isDemo}
                />
                <p>La entrega y cualquier pago se acuerdan fuera de Mercadito.</p>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
