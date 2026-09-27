"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
} from "lucide-react";

const categories = [
  { value: "BOOKS", label: "Libros y apuntes" },
  { value: "TECHNOLOGY", label: "Tecnología" },
  { value: "HOME", label: "Hogar" },
  { value: "CLOTHING", label: "Ropa" },
  { value: "ACCESSORIES", label: "Accesorios" },
  { value: "SERVICES", label: "Servicios" },
  { value: "OTHER", label: "Otros" },
];

const conditions = [
  { value: "NEW", label: "Nuevo" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "GOOD", label: "Buen estado" },
  { value: "FAIR", label: "Con detalles" },
];

const steps = ["Artículo", "Detalles", "Revisar"] as const;

type ListingDraft = {
  title: string;
  category: string;
  condition: string;
  price: string;
  description: string;
};

type EditableListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: "DRAFT" | "PUBLISHED" | "RESERVED" | "SOLD" | "ARCHIVED";
  imageUrl: string | null;
};

const listingStatusLabels = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  RESERVED: "Apartado",
  SOLD: "Vendido",
  ARCHIVED: "Archivado",
} as const;

const emptyDraft: ListingDraft = {
  title: "",
  category: "",
  condition: "",
  price: "",
  description: "",
};

function formatPrice(value: string) {
  if (!value.trim()) return "Precio pendiente";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Precio pendiente";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ListingForm({
  universityName,
  demo = false,
  listing,
}: {
  universityName: string;
  demo?: boolean;
  listing?: EditableListing;
}) {
  const editing = Boolean(listing);
  const [draft, setDraft] = useState<ListingDraft>(() =>
    listing
      ? {
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          price: String(listing.price),
          description: listing.description,
        }
      : emptyDraft,
  );
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const currentPhotoUrl = photoPreviewUrl ??
    (removePhoto ? null : listing?.imageUrl ?? null);

  function updateDraft(field: keyof ListingDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    setError("");
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function continueStep() {
    const requiredIds =
      step === 0
        ? ["listing-title", "listing-category", "listing-condition-new"]
        : ["listing-price", "listing-description"];

    for (const id of requiredIds) {
      const field = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      if (field && !field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return;
      }
    }

    goToStep(Math.min(step + 1, steps.length - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      continueStep();
      return;
    }

    setPending(true);
    setError("");

    if (demo) {
      setSent(true);
      setPending(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.set("title", draft.title);
      formData.set("description", draft.description);
      formData.set("price", String(Number(draft.price)));
      formData.set("category", draft.category);
      formData.set("condition", draft.condition);
      formData.set("publish", "true");
      if (photoFile) formData.set("photo", photoFile);
      if (removePhoto) formData.set("removePhoto", "true");

      const response = await fetch(
        listing ? `/api/listings/${encodeURIComponent(listing.id)}` : "/api/listings",
        {
          method: listing ? "PUT" : "POST",
          body: formData,
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          result?.error ?? "No pudimos publicar el aviso. Revisa tus datos.",
        );
      }
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos publicar el aviso. Intenta de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }

  function startAgain() {
    setDraft(emptyDraft);
    setStep(0);
    setError("");
    setSent(false);
    setPhotoFile(null);
    setRemovePhoto(false);
  }

  const categoryLabel =
    categories.find((category) => category.value === draft.category)?.label ??
    "Categoría pendiente";
  const conditionLabel =
    conditions.find((condition) => condition.value === draft.condition)?.label ??
    "Condición pendiente";

  const preview = (
    <article className="classified-preview" aria-label="Vista previa del aviso">
      {currentPhotoUrl ? (
        <img
          className="classified-preview-photo"
          src={currentPhotoUrl}
          alt={`Foto de ${draft.title || "tu artículo"}`}
        />
      ) : null}
      <div className="classified-preview-heading">
        <div>
          <h3>{draft.title || "Título del artículo"}</h3>
          <p>
            <span>{categoryLabel}</span>
            <span aria-hidden="true"> · </span>
            <span>{conditionLabel}</span>
          </p>
        </div>
        <strong>{formatPrice(draft.price)}</strong>
      </div>
      <p className="classified-preview-description">
        {draft.description || "La descripción aparecerá aquí."}
      </p>
    </article>
  );

  if (sent) {
    return (
      <section className="form-success publish-success" role="status">
        <span className="success-registration-mark" aria-hidden="true">
          <CircleCheck size={19} strokeWidth={1.8} />
        </span>
        <div>
          <h2>
            {demo
              ? "Tu vista previa está lista."
              : editing
                ? "Tu aviso quedó actualizado."
                : "Tu aviso ya está publicado."}
          </h2>
          <p>
            {demo
              ? "Este recorrido es una demostración: el aviso no se publicó, no se guardó y no se envió a ningún servicio."
              : editing
                ? `Guardamos los cambios en ${universityName}. El aviso conserva su estado: ${listing ? listingStatusLabels[listing.status].toLowerCase() : "sin cambios"}.`
                : `El aviso aparece en el mercadito privado de ${universityName}. Puedes revisar su estado desde Mis avisos.`}
          </p>
          {preview}
          <div className="publish-success-actions">
            {demo ? (
              <button className="text-action" type="button" onClick={startAgain}>
                Empezar otro aviso
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            ) : (
              <Link className="text-action" href="/mis-avisos">
                Gestionar mis avisos
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
            <Link className="text-action" href="/">
              {demo ? "Volver a los avisos" : "Explorar el mercadito"}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="listing-flow">
      <ol className="publish-progress" aria-label="Pasos para publicar">
        {steps.map((label, index) => (
          <li
            className={
              index === step
                ? "publish-progress-step is-current"
                : index < step
                  ? "publish-progress-step is-complete"
                  : "publish-progress-step"
            }
            key={label}
          >
            <span className="publish-progress-rule" aria-hidden="true" />
            <span aria-current={index === step ? "step" : undefined}>
              {index < step ? (
                <>
                  <Check className="progress-check" aria-hidden="true" size={14} />
                  <span className="sr-only">Completado: </span>
                </>
              ) : null}
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Paso {step + 1} de {steps.length}: {steps[step]}.
      </p>

      <form
        className="university-form listing-form publish-form"
        onSubmit={submit}
      >
        <div className="form-section-heading publish-step-heading">
          <h2 id="listing-step-title" ref={headingRef} tabIndex={-1}>
            {step === 0
              ? editing
                ? "¿Qué artículo quieres actualizar?"
                : "¿Qué artículo quieres vender?"
              : step === 1
                ? editing
                  ? "Ajusta el precio y el contexto."
                  : "Ponle precio y contexto."
                : editing
                  ? "Revisa los cambios antes de guardar."
                  : "Revisa tu clasificado."}
          </h2>
          <p>
            {step === 0
              ? editing
                ? "Corrige el título, la categoría o la condición del artículo."
                : "Empieza por lo que alguien necesitaría para reconocerlo."
              : step === 1
                ? editing
                  ? "Ajusta el precio o añade el contexto que haga falta."
                  : "Una condición clara y una buena descripción evitan dudas."
                : editing
                  ? "Así quedará el aviso. Su disponibilidad no cambiará."
                  : `Así lo verán los estudiantes activos de ${universityName}.`}
          </p>
        </div>

        {step === 0 ? (
          <div className="publish-step-fields">
            <label className="field" htmlFor="listing-title">
              <span>Nombre del artículo *</span>
              <input
                id="listing-title"
                name="title"
                type="text"
                minLength={4}
                maxLength={90}
                placeholder="Ej. Libro de cálculo, edición reciente"
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                required
              />
              <small>Usa un nombre que se entienda al leerlo en la lista.</small>
            </label>

            <label className="field" htmlFor="listing-category">
              <span>Categoría *</span>
              <select
                id="listing-category"
                name="category"
                value={draft.category}
                onChange={(event) => updateDraft("category", event.target.value)}
                required
              >
                <option value="">Elige una categoría</option>
                {categories.map(({ value, label }) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>

            <fieldset className="condition-fieldset">
              <legend>Condición *</legend>
              <div className="condition-options">
                {conditions.map(({ value, label }, index) => {
                  const id = `listing-condition-${value.toLowerCase()}`;
                  return (
                    <label
                      className={
                        draft.condition === value
                          ? "condition-option is-selected"
                          : "condition-option"
                      }
                      htmlFor={id}
                      key={value}
                    >
                      <input
                        id={id}
                        name="condition"
                        type="radio"
                        value={value}
                        checked={draft.condition === value}
                        onChange={(event) =>
                          updateDraft("condition", event.target.value)
                        }
                        required={index === 0}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="listing-photo-field">
              <label htmlFor="listing-photo">Foto del artículo <span>Opcional</span></label>
              <p id="listing-photo-help">
                Una imagen basta para mostrar su estado. JPG, PNG o WebP; máximo 8 MB.
              </p>
              {currentPhotoUrl ? (
                <img
                  className="listing-photo-preview"
                  src={currentPhotoUrl}
                  alt={`Foto de ${draft.title || "tu artículo"}`}
                />
              ) : null}
              <input
                className="listing-photo-input"
                id="listing-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="listing-photo-help"
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0] ?? null;
                  event.currentTarget.value = "";
                  if (!selected) return;
                  if (selected.size > 8 * 1024 * 1024) {
                    setError("La foto pesa más de 8 MB. Elige una imagen más ligera.");
                    return;
                  }
                  setError("");
                  setRemovePhoto(false);
                  setPhotoFile(selected);
                }}
              />
              {currentPhotoUrl ? (
                <button
                  className="text-action listing-photo-remove"
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setRemovePhoto(true);
                  }}
                >
                  Quitar foto
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="publish-step-fields">
            <label className="field" htmlFor="listing-price">
              <span>Precio de venta *</span>
              <div className="price-input-wrap">
                <span className="price-input-symbol" aria-hidden="true">$</span>
                <input
                  id="listing-price"
                  name="price"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={draft.price}
                  onChange={(event) => updateDraft("price", event.target.value)}
                  required
                />
                <span className="price-input-currency" aria-hidden="true">MXN</span>
              </div>
              <small>El precio que aparecerá junto al artículo.</small>
            </label>

            <div className="field">
              <label htmlFor="listing-description">Descripción *</label>
              <textarea
                id="listing-description"
                name="description"
                aria-describedby="listing-description-help listing-description-limit"
                minLength={10}
                maxLength={2000}
                rows={6}
                placeholder="Anota la edición, medidas, detalles visibles o qué incluye."
                value={draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                required
              />
              <div className="listing-description-meta">
                <small id="listing-description-help">
                  Incluye solo lo que otra persona necesita saber antes de escribirte.
                </small>
                <small id="listing-description-limit" aria-live="polite" aria-atomic="true">
                  {draft.description.length}/2,000 caracteres
                </small>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="publish-review">
            <div className="publish-review-campus">
              <span>{universityName}</span>
              {demo ? <span className="notice-demo">Ejemplo</span> : null}
            </div>
            {preview}
            <div className="publish-review-edits">
              <button
                className="text-action"
                type="button"
                onClick={() => goToStep(0)}
              >
                Editar artículo
              </button>
              <button
                className="text-action"
                type="button"
                onClick={() => goToStep(1)}
              >
                Editar precio y descripción
              </button>
            </div>
            <p className="publish-review-note">
              {demo
                ? "Al terminar verás la vista previa. No se enviará ni guardará el aviso."
                : editing && listing
                  ? `Disponibilidad actual: ${listingStatusLabels[listing.status]}. Al guardar, se conserva este estado.`
                  : "Lo verán estudiantes activos de tu universidad. Quien se interese puede escribirte por el chat. Mercadito no procesa pagos; el pago se acuerda fuera de la plataforma."}
            </p>
          </div>
        ) : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className={`publish-step-actions${step === 0 ? " is-first-step" : ""}`}>
          {step > 0 ? (
            <button
              className="text-action step-back"
              type="button"
              onClick={() => goToStep(step - 1)}
              disabled={pending}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Atrás
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button
              className="button-ink step-next"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                continueStep();
              }}
            >
              Continuar
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          ) : (
            <button
              className="button-ink form-submit step-next"
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle className="publish-loading-icon" aria-hidden="true" size={17} />
              ) : null}
              {pending
                ? editing
                  ? "Guardando cambios…"
                  : "Publicando…"
                : demo
                  ? "Terminar demostración"
                  : editing
                    ? "Guardar cambios"
                    : "Publicar aviso"}
              {!pending ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
