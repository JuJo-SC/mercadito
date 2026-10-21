"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { StartConversationForm } from "@/features/conversations/components/start-conversation-form";
import {
  conditionNames,
  formatListingDate,
  formatPrice,
  fullListingDate,
  type MarketplaceListing,
} from "@/features/listings/lib/listing-presentation";

export function ListingDetailDialog({
  listing,
  categoryLabel,
  currentUserId,
  onDismiss,
}: {
  listing: MarketplaceListing;
  categoryLabel: string;
  currentUserId: string;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoDialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const hasPhotos = listing.imageUrls.length > 0;
  const multiplePhotos = listing.imageUrls.length > 1;
  const seller = listing.seller.name ?? "Estudiante";
  const price = formatPrice(listing.price, listing.currency);
  const condition = conditionNames[listing.condition] ?? "Condición no indicada";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    const scroll = scrollRef.current;
    const gallery = galleryRef.current;
    if (!scroll || !gallery || !hasPhotos) return;
    const mobile = window.matchMedia("(max-width: 760px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initialHeight = multiplePhotos ? 284 : 220;
    const distance = initialHeight - 72;
    let frame = 0;

    // The reserved photo space stays fixed; only its overlay is clipped and scaled.
    const paint = () => {
      frame = 0;
      if (!mobile.matches || reduced.matches) {
        gallery.style.removeProperty("--photo-collapse");
        gallery.style.removeProperty("--photo-x");
        gallery.style.removeProperty("--photo-scale");
        gallery.style.removeProperty("--photo-context-opacity");
        delete gallery.dataset.collapsed;
        return;
      }
      const amount = Math.min(distance, Math.max(0, scroll.scrollTop));
      const progress = amount / distance;
      const x = ((scroll.clientWidth - 196) / 2) * (1 - progress) + 16 * progress;
      gallery.style.setProperty("--photo-collapse", amount + "px");
      gallery.style.setProperty("--photo-x", x + "px");
      gallery.style.setProperty("--photo-scale", String(1 - (1 - 48 / 196) * progress));
      gallery.style.setProperty("--photo-context-opacity", String(Math.max(0, (progress - .94) / .06)));
      gallery.dataset.collapsed = progress > .5 ? "true" : "false";
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    scroll.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    reduced.addEventListener("change", schedule);
    paint();
    return () => {
      window.cancelAnimationFrame(frame);
      scroll.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [hasPhotos, multiplePhotos]);

  function movePhoto(direction: -1 | 1) {
    setPhotoIndex((current) => (current + direction + listing.imageUrls.length) % listing.imageUrls.length);
  }

  const arrows = multiplePhotos ? (
    <div className="listing-gallery-arrows">
      <button type="button" aria-label="Ver foto anterior" onClick={() => movePhoto(-1)}>
        <ChevronLeft aria-hidden="true" size={20} />
      </button>
      <button type="button" aria-label="Ver foto siguiente" onClick={() => movePhoto(1)}>
        <ChevronRight aria-hidden="true" size={20} />
      </button>
    </div>
  ) : null;

  return (
    <dialog
      ref={dialogRef}
      className={"listing-detail-dialog listing-detail-refined" + (multiplePhotos ? " has-multiple-photos" : "") + (!hasPhotos ? " has-no-photos" : "")}
      aria-labelledby="listing-detail-title"
      onClose={(event) => { if (event.target === event.currentTarget) onDismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
        if (hasPhotos && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
          event.preventDefault();
          event.stopPropagation();
          movePhoto(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="listing-detail-shell">
        <button className="listing-detail-close" type="button" aria-label="Cerrar detalles" onClick={() => dialogRef.current?.close()}>
          <X aria-hidden="true" size={19} strokeWidth={1.9} />
        </button>
        <div className="listing-detail-gallery" ref={galleryRef} aria-label="Fotos del producto">
          {hasPhotos ? (
            <>
              <div className="listing-detail-image-wrap">
                <button className="listing-detail-photo-button" type="button" aria-label="Ampliar foto del producto" onClick={() => photoDialogRef.current?.showModal()}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- Las fotos privadas conservan la sesión y no pasan por un proxy. */}
                  <img src={listing.imageUrls[photoIndex]} alt={"Foto " + (photoIndex + 1) + " de " + listing.title} decoding="async" />
                </button>
                {arrows}
              </div>
              <div className="listing-detail-mini-context" aria-hidden="true">
                <strong>{listing.title}</strong>
                <span>{price} · {condition}</span>
              </div>
              {multiplePhotos ? (
                <div className="listing-gallery-pagination">
                  <span aria-live="polite">{photoIndex + 1} de {listing.imageUrls.length} fotos</span>
                  <div role="group" aria-label="Elegir foto">
                    {listing.imageUrls.map((_, index) => (
                      <button className={index === photoIndex ? "is-selected" : ""} key={index} type="button" aria-label={"Mostrar foto " + (index + 1) + " de " + listing.imageUrls.length} aria-pressed={index === photoIndex} onClick={() => setPhotoIndex(index)}>
                        <span aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="listing-detail-no-image"><Camera aria-hidden="true" size={32} strokeWidth={1.5} /><span>Sin fotos</span></div>
          )}
        </div>
        <div className="listing-detail-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Información de la publicación">
          <div className="listing-detail-photo-space" aria-hidden="true" />
          <div className="listing-detail-info">
            <h2 id="listing-detail-title">{listing.title}</h2>
            <div className="listing-detail-price-row">
              <p className="listing-detail-price">{price}</p>
              <span className="listing-detail-condition">{condition}</span>
            </div>
            <section className="listing-detail-description" aria-label="Descripción">
              <p>{listing.description}</p>
            </section>
            <div className="listing-detail-author">
              <span>Por <strong>{seller}</strong></span>
              <time dateTime={listing.createdAt} title={fullListingDate(listing.createdAt)}>{formatListingDate(listing.createdAt, true)}</time>
            </div>
            <details className="listing-detail-more">
              <summary>Más información <ChevronDown aria-hidden="true" size={16} /></summary>
              <dl>
                <div><dt>Categoría</dt><dd>{categoryLabel}</dd></div>
                <div><dt>Facultad</dt><dd>{listing.seller.facultyName ?? "Por confirmar"}</dd></div>
              </dl>
              <p>La entrega y cualquier pago se acuerdan fuera de Mercadito.</p>
            </details>
            {listing.isDemo ? (
              <p className="listing-detail-demo-note" role="note">Publicación ficticia de demostración. No representa una oferta real.</p>
            ) : null}
            <div className="listing-detail-contact">
              <StartConversationForm listingId={listing.id} sellerId={listing.seller.id} sellerName={seller} currentUserId={currentUserId} signedIn isDemo={listing.isDemo} compact />
            </div>
          </div>
        </div>
      </div>
      {hasPhotos ? (
        <dialog
          ref={photoDialogRef}
          className="listing-photo-lightbox"
          aria-label={"Foto ampliada de " + listing.title}
          onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
          onKeyDown={(event) => {
            // Keep Escape and navigation inside the topmost photo dialog.
            event.stopPropagation();
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              movePhoto(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          <button className="listing-detail-close" type="button" aria-label="Cerrar foto ampliada" onClick={() => photoDialogRef.current?.close()}>
            <X aria-hidden="true" size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- La ampliación usa la misma ruta privada de fotos. */}
          <img src={listing.imageUrls[photoIndex]} alt={"Foto " + (photoIndex + 1) + " de " + listing.title} />
          {arrows}
          {multiplePhotos ? <p aria-live="polite">{photoIndex + 1} de {listing.imageUrls.length} fotos</p> : null}
        </dialog>
      ) : null}
    </dialog>
  );
}
