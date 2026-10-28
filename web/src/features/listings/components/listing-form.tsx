"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_PHOTO_BYTES,
  MAX_TOTAL_LISTING_PHOTO_BYTES,
} from "@/features/listings/lib/listing-photo-limits";
import { DismissibleDetails } from "@/components/dismissible-details";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react";

const categories = [
  { value: "FOOD", label: "Alimentos" },
  { value: "BOOKS", label: "Libros y material académico" },
  { value: "TECHNOLOGY", label: "Dispositivos electrónicos" },
  { value: "HOME", label: "Decoración y artículos de oficina u hogar" },
  { value: "CLOTHING", label: "Ropa" },
  { value: "ACCESSORIES", label: "Accesorios y complementos" },
  { value: "OTHER", label: "Otros" },
] as const;

const conditions = [
  { value: "NEW", label: "Nuevo", Icon: Sparkles },
  { value: "LIKE_NEW", label: "Usado · Como nuevo", Icon: Star },
  { value: "GOOD", label: "Usado · Buen estado", Icon: Check },
  { value: "FAIR", label: "Usado · Con detalles", Icon: CircleAlert },
] as const;

const titleExamplesByCategory: Record<string, readonly string[]> = {
  FOOD: [
    "Ej. Pay de queso casero, brownies o galletas",
    "Ej. Agua de frutas natural o café frío",
    "Ej. Ensalada fresca, baguettes o fruta picada",
  ],
  BOOKS: [
    "Ej. Libro de cálculo, edición reciente",
    "Ej. Bata de laboratorio talla M o gafas protectoras",
    "Ej. Estuche de disección, atlas de anatomía o manual",
  ],
  TECHNOLOGY: [
    "Ej. Audífonos inalámbricos, teclado mecánico o teléfono",
    "Ej. Bocina portátil, mouse ergonómico o calculadora científica",
    "Ej. Monitor, tableta gráfica o cargador original",
  ],
  HOME: [
    "Ej. Lámpara de escritorio, maceta pequeña u organizador",
    "Ej. Silla de oficina, porta lápices o repisa de madera",
    "Ej. Espejo de mesa, planta decorativa o pizarrón de corcho",
  ],
  CLOTHING: [
    "Ej. Sudadera universitaria talla M o chamarra de mezclilla",
    "Ej. Camisa casual, tenis deportivos o pantalón en buen estado",
  ],
  ACCESSORIES: [
    "Ej. Mochila impermeable, gorra, reloj o termo de acero",
    "Ej. Bolsa de tela, lentes de sol, llavero o funda para laptop",
  ],
  OTHER: [
    "Ej. Guitarra acústica, balón de basquetbol o patineta",
    "Ej. Restirador de dibujo, juego de mesa o maletín deportivo",
  ],
};

const generalTitleExamples = [
  "Ej. Libro de cálculo, bata de laboratorio o kit de disección",
  "Ej. Audífonos inalámbricos, teclado mecánico o teléfono",
  "Ej. Pay de queso casero, galletas o agua de frutas natural",
  "Ej. Lámpara de escritorio, silla de oficina o maceta decorativa",
  "Ej. Mochila impermeable, termo de acero, gorra o reloj",
  "Ej. Sudadera universitaria talla M o chamarra de mezclilla",
  "Ej. Guitarra acústica, balón de basquetbol o restirador",
] as const;

const steps = ["Publicación", "Detalles", "Revisar"] as const;

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
  imageUrls: string[];
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
  studentId,
  demo = false,
  testCampus = false,
  listing,
}: {
  universityName: string;
  studentId?: string;
  demo?: boolean;
  testCampus?: boolean;
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
  const [exampleIndex, setExampleIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submissionConflict, setSubmissionConflict] = useState(false);
  const [sent, setSent] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [keptPhotoPositions, setKeptPhotoPositions] = useState<number[]>(() =>
    listing?.imageUrls.map((_, position) => position) ?? [],
  );
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [publishedPhotoUrls, setPublishedPhotoUrls] = useState<string[] | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const addPhotoButtonRef = useRef<HTMLButtonElement>(null);
  const submissionIdRef = useRef<string | null>(null);

  const allocatedPhotoUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = allocatedPhotoUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    if (step !== 0 || draft.title.trim()) return;
    const timer = window.setInterval(() => {
      setExampleIndex((current) => current + 1);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [step, draft.title, draft.category]);

  const activeTitleExamples =
    draft.category && titleExamplesByCategory[draft.category]
      ? titleExamplesByCategory[draft.category]
      : generalTitleExamples;
  const activeTitlePlaceholder =
    activeTitleExamples[exampleIndex % activeTitleExamples.length];

  function updatePhotoFiles(files: File[]) {
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    allocatedPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    allocatedPhotoUrls.current.clear();
    previewUrls.forEach((url) => allocatedPhotoUrls.current.add(url));
    setPhotoFiles(files);
    setPhotoPreviewUrls(previewUrls);
  }

  const storedPhotoUrls = listing?.imageUrls ?? publishedPhotoUrls ?? [];
  const visibleStoredPhotos = storedPhotoUrls
    .map((url, position) => ({ url, position }))
    .filter(({ position }) => !listing || keptPhotoPositions.includes(position));
  const currentPhotoUrls = [
    ...visibleStoredPhotos.map(({ url }) => url),
    ...photoPreviewUrls,
  ];

  function updateDraft(field: keyof ListingDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === "category") setExampleIndex(0);
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

    if (step === 0 && currentPhotoUrls.length === 0) {
      setError("Sube al menos 1 foto del producto para continuar.");
      addPhotoButtonRef.current?.focus();
      return;
    }

    goToStep(Math.min(step + 1, steps.length - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submissionConflict) return;
    if (step < steps.length - 1) {
      continueStep();
      return;
    }

    if (currentPhotoUrls.length === 0) {
      setError("Sube al menos 1 foto del producto para publicar.");
      setStep(0);
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
      if (!editing && studentId) {
        const storageKey = "mercadito:publish-attempt:" + studentId;
        let submissionId = submissionIdRef.current;
        if (!submissionId) {
          try {
            submissionId = sessionStorage.getItem(storageKey);
          } catch {
            submissionId = null;
          }
        }
        if (!submissionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
          submissionId = crypto.randomUUID();
        }
        submissionIdRef.current = submissionId;
        formData.set("submissionId", submissionId);
        try {
          sessionStorage.setItem(storageKey, submissionId);
        } catch {
          // Keep the key in memory so a retry in this form remains idempotent.
        }
      }
      if (listing) formData.set("keepPhotoPositions", JSON.stringify(keptPhotoPositions));
      for (const photoFile of photoFiles) formData.append("photo", photoFile);

      const response = await fetch(
        listing ? `/api/listings/${encodeURIComponent(listing.id)}` : "/api/listings",
        {
          method: listing ? "PUT" : "POST",
          body: formData,
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string; listing?: { imageUrls?: string[] } }
        | null;
      if (!response.ok) {
        if (response.status === 409) setSubmissionConflict(true);
        throw new Error(
          result?.error ?? "No pudimos guardar tu publicación. Revisa los datos e inténtalo de nuevo.",
        );
      }
      if (result?.listing?.imageUrls) setPublishedPhotoUrls(result.listing.imageUrls);
      if (!editing && studentId) {
        try {
          sessionStorage.removeItem("mercadito:publish-attempt:" + studentId);
        } catch {
          // The completed flow is still usable when browser storage is unavailable.
        }
      }
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar la publicación. Intenta de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }

  function resetConflictingSubmission() {
    if (studentId) {
      try {
        sessionStorage.setItem(
          "mercadito:publish-attempt:" + studentId,
          crypto.randomUUID(),
        );
      } catch {
        // The next form can create an in-memory key when storage is unavailable.
      }
    }
    submissionIdRef.current = null;
    setSubmissionConflict(false);
    setError("");
  }

  function startAgain() {
    setDraft(emptyDraft);
    setStep(0);
    setError("");
    setSubmissionConflict(false);
    setSent(false);
    updatePhotoFiles([]);
    setKeptPhotoPositions([]);
    setPublishedPhotoUrls(null);
  }

  const categoryLabel =
    categories.find((category) => category.value === draft.category)?.label ??
    (draft.category === "SERVICES" ? "Servicios" : "Categoría pendiente");
  const conditionLabel =
    conditions.find((condition) => condition.value === draft.condition)?.label ??
    "Condición pendiente";

  const preview = (
    <article className="product-preview" aria-label="Vista previa de la publicación">
      <div className="product-preview-media">
        {currentPhotoUrls[0] ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Fotos con sesión y vistas blob requieren carga directa en el navegador. */}
            <img
              className="product-preview-photo"
              src={currentPhotoUrls[0]}
              alt={"Foto principal de " + (draft.title || "tu producto")}
            />
            {currentPhotoUrls.length > 1 ? (
              <span className="product-preview-photo-count">{currentPhotoUrls.length} fotos</span>
            ) : null}
          </>
        ) : (
          <div className="product-preview-no-photo">
            <Camera aria-hidden="true" size={27} strokeWidth={1.5} />
            <span>Sin foto principal</span>
          </div>
        )}
      </div>
      <div className="product-preview-content">
        <div className="product-preview-meta">
          <span>{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{conditionLabel}</span>
        </div>
        <div className="product-preview-heading">
          <h3>{draft.title || "Nombre de lo que quieres vender"}</h3>
          <strong>{formatPrice(draft.price)}</strong>
        </div>
        <p className="product-preview-description">
          {draft.description || "La descripción aparecerá aquí."}
        </p>
      </div>
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
                ? "Tu publicación se actualizó."
                : "Tu publicación ya está en el mercadito."}
          </h2>
          <p>
            {demo
              ? "Este recorrido es una demostración: la publicación no se envió ni se guardó."
              : editing
                ? `Guardamos los cambios en ${universityName}. La publicación conserva su estado: ${listing ? listingStatusLabels[listing.status].toLowerCase() : "sin cambios"}.`
                : `La publicación aparece en el mercadito privado de ${universityName}. Puedes revisar su estado en Mis publicaciones.`}
          </p>
          {preview}
          <div className="publish-success-actions">
            {demo ? (
              <button className="text-action" type="button" onClick={startAgain}>
                Empezar otra publicación
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            ) : (
              <Link className="text-action" href="/mis-avisos">
                Gestionar mis publicaciones
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
            <Link className="text-action" href="/">
              {demo ? "Volver al mercadito" : "Explorar el mercadito"}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="listing-flow">
      <header className="publish-card-header">
        <div className="publish-card-title-row">
          <h1>
            {demo
              ? "Probar publicación"
              : editing
                ? "Editar publicación"
                : "Publicar producto"}
          </h1>
          <DismissibleDetails className="publish-help">
            <summary aria-label="Normas de publicación" title="Normas de publicación">
              <CircleHelp aria-hidden="true" size={17} strokeWidth={2} />
            </summary>
            <div className="publish-help-popover">
              <p className="publish-help-title">Normas de publicación</p>
              <ul className="publish-help-list">
                <li>
                  <strong>Respeta las normas del campus:</strong> solo artículos físicos permitidos (sin tareas, apuntes, servicios ni objetos restringidos).
                </li>
                <li>
                  <strong>Foto obligatoria:</strong> sube al menos 1 foto real de lo que vendes.
                </li>
                <li>
                  <strong>Comunidad universitaria:</strong> visible solo para estudiantes activos de {universityName}.
                </li>
              </ul>
              {testCampus ? (
                <p className="publish-help-note">Campus de prueba: usa datos ficticios.</p>
              ) : null}
              {demo ? (
                <p className="publish-help-note">Recorrido de demostración: no se guarda.</p>
              ) : null}
            </div>
          </DismissibleDetails>
        </div>

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
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Paso {step + 1} de {steps.length}: {steps[step]}.
      </p>

      <form
        className="university-form listing-form publish-form"
        onSubmit={submit}
      >
        <div className="form-section-heading publish-step-heading">
          <h2 id="listing-step-title" ref={headingRef} tabIndex={-1}>
            {step === 0 ? "Detalles del producto" : step === 1 ? "Precio y descripción" : "Revisar publicación"}
          </h2>
          {step > 1 ? (
            <p>
              {editing
                ? "Así se verá la publicación. Su disponibilidad no cambiará."
                : `Así lo verán los estudiantes activos de ${universityName}.`}
            </p>
          ) : null}
        </div>

        {step === 0 ? (
          <div className="publish-step-fields">
            <div className="publish-primary-row">
              <label className="field" htmlFor="listing-title">
                <span>Nombre de lo que quieres vender *</span>
                <input
                  id="listing-title"
                  name="title"
                  type="text"
                  minLength={4}
                  maxLength={90}
                  placeholder={activeTitlePlaceholder}
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  required
                />
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
                  {editing && draft.category === "SERVICES" ? (
                    <option value="SERVICES">Servicios</option>
                  ) : null}
                </select>
              </label>
            </div>

            <fieldset className="condition-fieldset">
              <legend>Condición *</legend>
              <div className="condition-options">
                {conditions.map(({ value, label, Icon }, index) => {
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
                        className="condition-radio-input"
                        value={value}
                        checked={draft.condition === value}
                        onChange={(event) =>
                          updateDraft("condition", event.target.value)
                        }
                        required={index === 0}
                      />
                      <span className="condition-option-icon" aria-hidden="true">
                        <Icon aria-hidden="true" size={15} strokeWidth={2} />
                      </span>
                      <span className="condition-option-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="listing-photo-field">
              <div className="listing-photo-bar">
                <div className="listing-photo-title-group">
                  <label htmlFor="listing-photo">
                    Fotos del producto <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <span
                    className={
                      currentPhotoUrls.length
                        ? "listing-photo-count has-photos"
                        : "listing-photo-count"
                    }
                    id="listing-photo-state"
                    aria-live="polite"
                  >
                    <Camera aria-hidden="true" size={12} strokeWidth={2} />
                    <span>{currentPhotoUrls.length}/{MAX_LISTING_PHOTOS}</span>
                  </span>
                </div>

                {currentPhotoUrls.length < MAX_LISTING_PHOTOS ? (
                  <button
                    ref={addPhotoButtonRef}
                    className="listing-photo-add"
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera aria-hidden="true" size={16} strokeWidth={1.8} />
                    {currentPhotoUrls.length ? "Agregar fotos" : "Elegir fotos"}
                  </button>
                ) : null}
              </div>

              {currentPhotoUrls.length ? (
                <div className="listing-photo-thumbnails" aria-label="Fotos de la publicación">
                  {visibleStoredPhotos.map(({ url, position }, index) => (
                    <div className="listing-photo-thumb" key={`stored-${position}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Fotos con sesión y vistas blob requieren carga directa en el navegador. */}
                      <img
                        src={url}
                        alt={`Foto ${index + 1} de ${draft.title || "tu producto"}`}
                      />
                      <button
                        className="listing-photo-remove"
                        type="button"
                        aria-label={`Quitar foto ${index + 1}`}
                        onClick={() => setKeptPhotoPositions((current) =>
                          current.filter((currentPosition) => currentPosition !== position),
                        )}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                      {index === 0 ? <span className="listing-photo-primary">Principal</span> : null}
                    </div>
                  ))}
                  {photoPreviewUrls.map((url, index) => (
                    <div className="listing-photo-thumb" key={`${url}-${index}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- Fotos con sesión y vistas blob requieren carga directa en el navegador. */}
                      <img
                        src={url}
                        alt={`Nueva foto ${index + 1} de ${draft.title || "tu producto"}`}
                      />
                      <button
                        className="listing-photo-remove"
                        type="button"
                        aria-label={`Quitar foto ${visibleStoredPhotos.length + index + 1}`}
                        onClick={() => updatePhotoFiles(
                          photoFiles.filter((_, currentIndex) => currentIndex !== index),
                        )}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                      {visibleStoredPhotos.length + index === 0 ? (
                        <span className="listing-photo-primary">Principal</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <input
                ref={photoInputRef}
                className="listing-photo-input"
                id="listing-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                aria-label="Elegir fotos del producto"
                aria-describedby="listing-photo-state"
                onChange={(event) => {
                  const selected = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  if (!selected.length) return;
                  if (selected.some((file) => file.size > MAX_LISTING_PHOTO_BYTES)) {
                    setError("Cada foto puede pesar hasta 8 MB. Elige archivos más ligeros.");
                    return;
                  }
                  const remainingSlots = MAX_LISTING_PHOTOS - visibleStoredPhotos.length - photoFiles.length;
                  if (selected.length > remainingSlots) {
                    setError("Una publicación puede tener hasta 5 fotos. Quita alguna para agregar otras.");
                    return;
                  }
                  const combinedBytes = [...photoFiles, ...selected]
                    .reduce((sum, file) => sum + file.size, 0);
                  if (combinedBytes > MAX_TOTAL_LISTING_PHOTO_BYTES) {
                    setError("Las fotos pueden sumar hasta 20 MB. Elige archivos más ligeros.");
                    return;
                  }
                  setError("");
                  updatePhotoFiles([...photoFiles, ...selected]);
                }}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="publish-step-fields">
            <label className="field" htmlFor="listing-price">
              <span>¿Cuánto costará? *</span>
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
            </label>

            <div className="field">
              <label htmlFor="listing-description">Descripción *</label>
              <textarea
                id="listing-description"
                name="description"
                minLength={10}
                maxLength={2000}
                rows={4}
                placeholder="Detalles visibles, qué incluye, edición o puntos de entrega en el campus…"
                value={draft.description}
                onChange={(event) =>
                  updateDraft("description", event.target.value)
                }
                required
              />
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
                Editar publicación
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
                ? "Al terminar verás la vista previa. No se publicará ni se guardará."
                : editing && listing
                  ? `Disponibilidad actual: ${listingStatusLabels[listing.status]}. Al guardar, se conserva este estado.`
                  : "Lo verán estudiantes activos de tu universidad. Quien se interese puede escribirte por el chat. Mercadito no procesa pagos; el pago se acuerda fuera de la plataforma."}
            </p>
          </div>
        ) : null}

        {submissionConflict ? (
          <>
            <p className="form-error" role="alert">
              Este intento ya guardó una publicación con otros datos. Revisa Mis publicaciones antes de volver a publicar.
            </p>
            <div className="form-actions">
              <Link
                className="text-action"
                href="/mis-avisos"
                onNavigate={resetConflictingSubmission}
              >
                Revisar Mis publicaciones
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </>
        ) : error ? <p className="form-error" role="alert">{error}</p> : null}

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
              disabled={pending || submissionConflict}
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
                    : "Publicar en Mercadito"}
              {!pending ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
