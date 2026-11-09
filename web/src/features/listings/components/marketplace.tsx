"use client";

import { useEffect, useRef, useState } from "react";
import { ListingDetailDialog } from "@/features/listings/components/listing-detail-dialog";
import { formatPrice, type MarketplaceListing } from "@/features/listings/lib/listing-presentation";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,

  Camera,
  Search,
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
  { id: "FOOD", label: "Alimentos" },
  { id: "BOOKS", label: "Libros y material académico" },
  { id: "TECHNOLOGY", label: "Dispositivos electrónicos" },
  { id: "HOME", label: "Decoración y artículos de oficina u hogar" },
  { id: "CLOTHING", label: "Ropa" },
  { id: "ACCESSORIES", label: "Accesorios y complementos" },
  { id: "OTHER", label: "Otros" },
];

const categoryNames: Record<string, string> = {
  FOOD: "Alimentos",
  BOOKS: "Libros y material académico",
  TECHNOLOGY: "Dispositivos electrónicos",
  HOME: "Decoración y artículos de oficina u hogar",
  CLOTHING: "Ropa",
  ACCESSORIES: "Accesorios y complementos",
  SERVICES: "Servicios",
  OTHER: "Otros",
};

export function Marketplace({
  university,
  initialListings,
  initialTotal,
  initialSort,
  hasInterestSignals: initialHasInterestSignals,
  currentUserId,
}: MarketplaceProps) {
  const [listings, setListings] = useState(initialListings);
  const [hasMore, setHasMore] = useState(initialTotal > initialListings.length);
  const [nextCursor, setNextCursor] = useState(initialListings.at(-1)?.id ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const filterDialogRef = useRef<HTMLDialogElement>(null);
  const showFilterResults = useRef(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setMobileFilters(media.matches);
      if (!media.matches) {
        filterDialogRef.current?.close();
        setFiltersOpen(false);
      }
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const dialog = filterDialogRef.current;
    if (mobileFilters && filtersOpen && dialog && !dialog.open) dialog.showModal();
    if (!filtersOpen && dialog?.open) dialog.close();
  }, [filtersOpen, mobileFilters]);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortMode, setSortMode] = useState<SortMode>(initialSort);
  const [hasInterestSignals, setHasInterestSignals] = useState(initialHasInterestSignals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentRequest = useRef<AbortController | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    if (!selectedListing && !filtersOpen) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const filterToggle = filterToggleRef.current;
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
      window.scrollTo(0, showFilterResults.current ? 0 : scrollY);
      showFilterResults.current = false;
      if (filtersOpen) filterToggle?.focus({ preventScroll: true });
      root.style.scrollBehavior = previous.rootScrollBehavior;
    };
  }, [selectedListing, filtersOpen]);

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

  function closeFilters(revealResults = false) {
    showFilterResults.current = filtersOpen && revealResults;
    setFiltersOpen(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery);
    void loadListings(draftQuery, category, sortMode);
    closeFilters(true);
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
  }

  const activeFilterCount = Number(Boolean(query.trim())) + Number(category !== "ALL");
  const hasActiveFilters = activeFilterCount > 0;

  const filterContent = (
    <>
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

      <details className="filter-information">
        <summary>Información del mercadito</summary>
        <p className="sort-context" aria-live="polite">
          {sortMode === "INTEREST"
            ? "Ordenados por conversaciones iniciadas; el contenido de los mensajes no se muestra."
            : hasInterestSignals
              ? "Ordenados por fecha de publicación."
              : "Aún no hay suficiente actividad para marcar tendencias; mostramos lo más reciente."}
        </p>
        <p className="marketplace-sidebar-disclosure">
          Pregunta por chat. La entrega y cualquier pago se acuerdan fuera de Mercadito.
        </p>
      </details>
      <div className="marketplace-filter-actions">
        {hasActiveFilters ? (
          <button className="marketplace-filter-reset" type="button" onClick={clearFilters} disabled={loading}>
            Limpiar filtros
          </button>
        ) : null}
        <button className="marketplace-filter-done" type="button" onClick={() => closeFilters(true)}>
          Ver productos
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    </>
  );

  return (
    <section className="marketplace-section campus-marketplace page-width" id="productos" aria-labelledby="marketplace-title">

      {university.isTest ? (
        <p className="demo-banner campus-test-banner campus-test-banner-top" role="note">
          <span className="demo-mark" aria-hidden="true">P</span>
          UMAN es un campus de prueba. Recorre publicaciones de ejemplo mientras conoces el mercadito.
        </p>
      ) : null}

      <div className="marketplace-layout">
        <aside className="marketplace-sidebar" aria-label="Filtros de publicaciones">
          <button
            className="marketplace-filter-toggle"
            ref={filterToggleRef}
            type="button"
            aria-label="Buscar y filtrar"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-controls="marketplace-filter-panel"
            onClick={() => setFiltersOpen(true)}
          >
            <Search aria-hidden="true" size={19} strokeWidth={1.7} />
            <span>Filtros</span>
            {activeFilterCount > 0 ? (
              <span className="marketplace-filter-count" aria-label={activeFilterCount + " filtros activos"}>
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          {mobileFilters ? (
            <dialog
              ref={filterDialogRef}
              className="marketplace-filter-panel marketplace-filter-drawer"
              id="marketplace-filter-panel"
              aria-labelledby="marketplace-filter-title"
              onCancel={(event) => { event.preventDefault(); closeFilters(); }}
              onClose={() => setFiltersOpen(false)}
              onClick={(event) => { if (event.target === event.currentTarget) closeFilters(); }}
            >
              <div className="marketplace-filter-drawer-content">
                <div className="marketplace-filter-header">
                  <h2 id="marketplace-filter-title">Buscar y filtrar</h2>
                  <button type="button" aria-label="Cerrar filtros" onClick={() => closeFilters()} autoFocus>
                    <X aria-hidden="true" size={21} strokeWidth={1.7} />
                  </button>
                </div>
                {filterContent}
              </div>
            </dialog>
          ) : (
            <div className="marketplace-filter-panel" id="marketplace-filter-panel" role="region" aria-label="Buscar y filtrar publicaciones">
              {filterContent}
            </div>
          )}
        </aside>
        <div className="marketplace-results">
          <h1 className="sr-only" id="marketplace-title">Explorar publicaciones</h1>

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
                        // eslint-disable-next-line @next/next/no-img-element -- Fotos privadas requieren la sesión del navegador, sin proxy de optimización.
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
                      {listing.imageUrls.length > 1 ? (
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
                      <span className="product-card-price">{formatPrice(listing.price, listing.currency)}</span>
                      <span className="product-card-title" title={listing.title}>{listing.title}</span>
                    </span>
                  </button>
                ))}
              </div>
              {hasMore ? (
                <div className="product-pagination" aria-busy={loadingMore}>
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

      {selectedListing ? (
        <ListingDetailDialog
          key={selectedListing.id}
          listing={selectedListing}
          categoryLabel={categoryNames[selectedListing.category] ?? "Otros"}
          currentUserId={currentUserId}
          onDismiss={() => setSelectedListing(null)}
        />
      ) : null}
    </section>
  );
}
