"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const categories = [
  ["BOOKS", "Libros y apuntes"],
  ["TECHNOLOGY", "Tecnología"],
  ["HOME", "Hogar"],
  ["CLOTHING", "Ropa"],
  ["ACCESSORIES", "Accesorios"],
  ["SERVICES", "Servicios"],
  ["OTHER", "Otros"],
];

const conditions = [
  ["NEW", "Nuevo"],
  ["LIKE_NEW", "Como nuevo"],
  ["GOOD", "Buen estado"],
  ["FAIR", "Con detalles"],
];

export function ListingForm({ universityName }: { universityName: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          price: Number(form.get("price")),
          category: String(form.get("category") ?? "OTHER"),
          condition: String(form.get("condition") ?? "GOOD"),
          imageUrl: "",
          publish: true,
        }),
      });
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

  if (sent) {
    return (
      <section className="form-success" role="status">
        <span className="success-registration-mark" aria-hidden="true">✓</span>
        <div>
          <h2>Tu aviso está publicado.</h2>
          <p>
            Aparece en el mercadito privado de {universityName}. Puedes
            consultarlo en la portada de tu comunidad.
          </p>
          <Link className="text-action" href="/">
            Volver a los avisos
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className="university-form listing-form" onSubmit={submit}>
      <div className="form-section-heading">
        <h2>Artículo en {universityName}</h2>
        <p>Este aviso se mostrará solo a alumnos activos de tu universidad.</p>
      </div>

      <label className="field" htmlFor="listing-title">
        <span>¿Qué artículo publicas? *</span>
        <input
          id="listing-title"
          name="title"
          type="text"
          minLength={4}
          maxLength={90}
          placeholder="Ej. Libro de cálculo, edición reciente"
          required
        />
      </label>

      <label className="field" htmlFor="listing-description">
        <span>Descripción *</span>
        <textarea
          id="listing-description"
          name="description"
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Describe el estado, la edición, detalles importantes y qué incluye."
          required
        />
      </label>

      <div className="field-grid listing-field-grid">
        <label className="field" htmlFor="listing-price">
          <span>Precio en pesos mexicanos *</span>
          <input
            id="listing-price"
            name="price"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            inputMode="decimal"
            required
          />
        </label>
        <label className="field" htmlFor="listing-condition">
          <span>Condición *</span>
          <select id="listing-condition" name="condition" defaultValue="GOOD">
            {conditions.map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="listing-category">
          <span>Categoría *</span>
          <select id="listing-category" name="category" defaultValue="BOOKS">
            {categories.map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="privacy-note">
        El precio se muestra en MXN. Mercadito no procesa el pago ni comparte
        información de contacto fuera de tu comunidad universitaria.
      </p>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button className="button-ink form-submit" type="submit" disabled={pending}>
        {pending ? "Publicando aviso…" : "Publicar aviso"}
        <ArrowRight aria-hidden="true" size={17} />
      </button>
    </form>
  );
}
