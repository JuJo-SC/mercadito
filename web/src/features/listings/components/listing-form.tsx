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
  CircleCheck,
  CircleHelp,
  LoaderCircle,
  Plus,
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
  { value: "NEW", label: "Nuevo" },
  { value: "LIKE_NEW", label: "Usado · Como nuevo" },
  { value: "GOOD", label: "Usado · Buen estado" },
  { value: "FAIR", label: "Usado · Con detalles" },
] as const;

function inferCategory(title: string): (typeof categories)[number]["value"] | null {
  const t = title.toLowerCase();
  if (t.includes("libro") || t.includes("calculo") || t.includes("cálculo") || t.includes("bata") || t.includes("atlas") || t.includes("manual") || t.includes("apuntes")) {
    return "BOOKS";
  }
  if (t.includes("audifono") || t.includes("audífono") || t.includes("telefono") || t.includes("teléfono") || t.includes("mouse") || t.includes("teclado") || t.includes("calculadora") || t.includes("laptop") || t.includes("monitor") || t.includes("cargador") || t.includes("pantalla")) {
    return "TECHNOLOGY";
  }
  if (t.includes("pay") || t.includes("galleta") || t.includes("brownie") || t.includes("cafe") || t.includes("café") || t.includes("comida") || t.includes("snack") || t.includes("agua") || t.includes("pastel")) {
    return "FOOD";
  }
  if (t.includes("mochila") || t.includes("termo") || t.includes("gorra") || t.includes("lentes") || t.includes("reloj") || t.includes("funda") || t.includes("estuche")) {
    return "ACCESSORIES";
  }
  if (t.includes("sudadera") || t.includes("camisa") || t.includes("pantalon") || t.includes("pantalón") || t.includes("chamarra") || t.includes("tenis") || t.includes("playera") || t.includes("sueter") || t.includes("suéter")) {
    return "CLOTHING";
  }
  if (t.includes("lampara") || t.includes("lámpara") || t.includes("silla") || t.includes("escritorio") || t.includes("maceta") || t.includes("organizador") || t.includes("espejo")) {
    return "HOME";
  }
  return null;
}

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

const emptyDraft: ListingDraft = {
  title: "",
  category: "",
  condition: "GOOD",
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
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(Boolean(listing?.category));
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
    if (draft.title.trim()) return;
    const timer = window.setInterval(() => {
      setExampleIndex((current) => current + 1);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [draft.title, draft.category]);

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
  }

  function handleTitleChange(value: string) {
    setDraft((current) => {
      let category = current.category;
      if (!categoryManuallySelected && (!category || category === "OTHER")) {
        const detected = inferCategory(value);
        if (detected) category = detected;
      }
      return { ...current, title: value, category };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>, publishStatus = true) {
    event.preventDefault();
    if (pending || submissionConflict) return;

    if (currentPhotoUrls.length === 0) {
      setError("Sube al menos 1 foto del producto para publicar.");
      return;
    }

    if (!draft.title.trim() || draft.title.trim().length < 4) {
      setError("El nombre de lo que vendes debe tener al menos 4 caracteres.");
      return;
    }

    if (!draft.category) {
      setError("Elige una categoría para el producto.");
      return;
    }

    const priceNum = Number(draft.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Ingresa un precio válido en MXN.");
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
      formData.set("title", draft.title.trim());
      formData.set("description", draft.description.trim());
      formData.set("price", String(priceNum));
      formData.set("category", draft.category);
      formData.set("condition", draft.condition || "GOOD");
      formData.set("publish", publishStatus ? "true" : "false");
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
          // Keep key in memory
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
          // storage fallback
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
        // memory key
      }
    }
    submissionIdRef.current = null;
    setSubmissionConflict(false);
    setError("");
  }

  function startAgain() {
    setDraft(emptyDraft);
    setCategoryManuallySelected(false);
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
    <article className="publish-preview-card" aria-label="Vista previa de la publicación">
      <div className="publish-preview-media">
        {currentPhotoUrls[0] ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="publish-preview-img"
              src={currentPhotoUrls[0]}
              alt={"Foto de " + (draft.title || "tu producto")}
            />
            {currentPhotoUrls.length > 1 ? (
              <span className="publish-preview-badge">
                <Camera aria-hidden="true" size={12} strokeWidth={2} />
                <span>{currentPhotoUrls.length} fotos</span>
              </span>
            ) : null}
          </>
        ) : (
          <div className="publish-preview-no-photo">
            <Camera aria-hidden="true" size={24} strokeWidth={1.6} />
            <span>Sin fotos</span>
          </div>
        )}
      </div>
      <div className="publish-preview-info">
        <div className="publish-preview-details">
          <div className="publish-preview-tags">
            {categoryLabel ? <span className="publish-tag-category">{categoryLabel}</span> : null}
            {conditionLabel ? <span className="publish-tag-condition">{conditionLabel}</span> : null}
          </div>
          <h4 className="publish-preview-title">{draft.title || "Nombre de lo que quieres vender"}</h4>
          <div className="publish-preview-price">
            <span>{formatPrice(draft.price)}</span>
            <span className="publish-preview-currency">MXN</span>
          </div>
          {draft.description ? (
            <p className="publish-preview-description">
              {draft.description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (sent) {
    return (
      <section className="form-success publish-success" role="status">
        <div className="publish-success-card">
          <div className="publish-success-header">
            <span className="success-registration-mark" aria-hidden="true">
              <CircleCheck size={18} strokeWidth={2.4} />
            </span>
            <h2>{editing ? "Actualizado" : "Publicado"}</h2>
          </div>
          {preview}
        </div>
        <div className="publish-success-actions">
          <Link className="button-secondary" href="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Explorar catálogo
          </Link>
          {editing ? (
            <Link className="button-ink step-next" href="/mis-avisos">
              Gestionar mis publicaciones
              <ArrowRight aria-hidden="true" size={16} strokeWidth={2.2} />
            </Link>
          ) : (
            <button className="button-ink step-next" type="button" onClick={startAgain}>
              <Plus aria-hidden="true" size={16} strokeWidth={2.4} />
              Publicar otro producto
            </button>
          )}
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
      </header>

      <form
        className="university-form listing-form publish-form"
        onSubmit={(event) => submit(event, true)}
      >
        <div className="publish-step-fields">
          {/* 1. FOTOS ARRIBA EN PRIMER PLANO */}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* 2. TÍTULO Y CATEGORÍA */}
          <div className="publish-primary-row">
            <label className="field" htmlFor="listing-title">
              <span>¿Qué vendes? *</span>
              <input
                id="listing-title"
                name="title"
                type="text"
                minLength={4}
                maxLength={90}
                placeholder={activeTitlePlaceholder}
                value={draft.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                required
              />
            </label>

            <label className="field" htmlFor="listing-category">
              <span>Categoría *</span>
              <select
                id="listing-category"
                name="category"
                value={draft.category}
                onChange={(event) => {
                  setCategoryManuallySelected(true);
                  updateDraft("category", event.target.value);
                }}
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

          {/* 3. PRECIO Y CONDICIÓN */}
          <div className="publish-primary-row">
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

            <label className="field" htmlFor="listing-condition-select">
              <span>Condición *</span>
              <select
                id="listing-condition-select"
                name="condition"
                value={draft.condition}
                onChange={(event) => updateDraft("condition", event.target.value)}
                required
              >
                {conditions.map(({ value, label }) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* 4. DESCRIPCIÓN INTEGRADA (OPCIONAL) */}
          <div className="field">
            <label htmlFor="listing-description">
              <span>Descripción </span>
              <span style={{ color: "var(--muted)", fontWeight: "normal", fontSize: "0.8rem" }}>(opcional)</span>
            </label>
            <textarea
              id="listing-description"
              name="description"
              maxLength={2000}
              rows={3}
              placeholder="Detalles sobre el estado, talla, punto de entrega en el campus…"
              value={draft.description}
              onChange={(event) =>
                updateDraft("description", event.target.value)
              }
            />
          </div>
        </div>

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

        <div className="publish-step-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {!editing ? (
            <button
              className="step-back"
              type="button"
              onClick={(e) => submit(e as unknown as FormEvent<HTMLFormElement>, false)}
              disabled={pending || submissionConflict}
            >
              Guardar borrador
            </button>
          ) : (
            <Link className="step-back" href="/mis-avisos">
              Cancelar
            </Link>
          )}

          <button
            className="form-submit step-next"
            type="submit"
            disabled={pending || submissionConflict}
          >
            {pending ? (
              <LoaderCircle className="publish-loading-icon" aria-hidden="true" size={16} />
            ) : null}
            <span>
              {pending
                ? editing
                  ? "Guardando cambios…"
                  : "Publicando…"
                : editing
                  ? "Guardar cambios"
                  : "Publicar en Mercadito"}
            </span>
            {!pending ? <ArrowRight aria-hidden="true" size={16} /> : null}
          </button>
        </div>
      </form>
    </div>
  );
}

