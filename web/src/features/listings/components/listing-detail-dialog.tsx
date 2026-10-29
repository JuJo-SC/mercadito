"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [photoIndex, setPhotoIndex] = useState(0);
  const hasPhotos = listing.imageUrls.length > 0;
  const multiplePhotos = listing.imageUrls.length > 1;
  const seller = listing.seller.name ?? "Estudiante";
  const price = formatPrice(listing.price, listing.currency);
  const condition = conditionNames[listing.condition] ?? "Condición no indicada";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

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
      <button className="listing-detail-close" type="button" aria-label="Cerrar detalles" onClick={() => dialogRef.current?.close()}>
        <X aria-hidden="true" size={19} strokeWidth={1.9} />
      </button>
      <div className="listing-detail-shell" tabIndex={0} role="region" aria-label="Ficha del producto">
        <div className="listing-detail-gallery" aria-label="Fotos del producto">
          {hasPhotos ? (
            <div className="listing-detail-image-wrap">
              <button
                className="listing-detail-photo-button"
                type="button"
                aria-label="Ampliar foto del producto"
                onClick={() => photoDialogRef.current?.showModal()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Las fotos privadas conservan la sesión y no pasan por un proxy. */}
                <img
                  src={listing.imageUrls[photoIndex]}
                  alt={"Foto " + (photoIndex + 1) + " de " + listing.title}
                  decoding="async"
                />
              </button>
              {arrows}
              {multiplePhotos ? (
                <div className="listing-detail-photo-badge">
                  <Camera aria-hidden="true" size={12} strokeWidth={2} />
                  <span>{photoIndex + 1} de {listing.imageUrls.length} fotos</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="listing-detail-no-image">
              <Camera aria-hidden="true" size={28} strokeWidth={1.6} />
              <span>Sin fotos</span>
            </div>
          )}
        </div>

        <div className="listing-detail-scroll" tabIndex={0} role="region" aria-label="Información de la publicación">
          <div className="listing-detail-info">
            <div className="listing-detail-tags">
              <span className="listing-tag-category">{categoryLabel}</span>
              <span className="listing-tag-condition">{condition}</span>
            </div>

            <h2 id="listing-detail-title">{listing.title}</h2>

            <div className="listing-detail-price-row">
              <p className="listing-detail-price">{price}</p>
            </div>

            <section className="listing-detail-description" aria-label="Descripción">
              <p>{listing.description}</p>
            </section>

            <div className="listing-detail-meta-row">
              <div className="listing-detail-seller-info">
                <span className="listing-detail-seller-avatar" aria-hidden="true">
                  {seller.charAt(0).toUpperCase()}
                </span>
                <span className="listing-detail-seller-name">{seller}</span>
                {listing.seller.facultyName ? (
                  <span className="listing-detail-seller-faculty">· {listing.seller.facultyName}</span>
                ) : null}
              </div>

              <div className="listing-detail-meta-right">
                <time className="listing-detail-date" dateTime={listing.createdAt} title={fullListingDate(listing.createdAt)}>
                  {formatListingDate(listing.createdAt, true)}
                </time>

                <details className="listing-detail-help">
                  <summary aria-label="Información sobre entregas y pagos">?</summary>
                  <div className="listing-detail-help-popover" role="note">
                    <div className="listing-detail-help-header">
                      <strong>Trato entre estudiantes</strong>
                    </div>
                    <p>
                      La entrega y el pago se acuerdan directamente entre ustedes fuera de la plataforma. Mercadito únicamente se encarga de publicar los productos y facilitar el contacto seguro entre miembros de la universidad.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            {listing.isDemo ? (
              <p className="listing-detail-demo-note" role="note">
                Publicación ficticia de demostración. No representa una oferta real.
              </p>
            ) : null}

            <div className="listing-detail-contact">
              <StartConversationForm
                listingId={listing.id}
                sellerId={listing.seller.id}
                sellerName={seller}
                currentUserId={currentUserId}
                signedIn
                isDemo={listing.isDemo}
                compact
              />
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
