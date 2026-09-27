"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CircleCheck, Info } from "lucide-react";

function slugFromName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function UniversityRegistrationForm({ enabled }: { enabled: boolean }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugChanged, setSlugChanged] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/universities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          slug: String(form.get("slug") ?? ""),
          websiteUrl: String(form.get("websiteUrl") ?? ""),
          contactName: String(form.get("contactName") ?? ""),
          contactEmail: String(form.get("contactEmail") ?? ""),
          privacyAccepted: form.get("privacyAccepted") === "on",
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          result?.error ?? "No pudimos enviar la solicitud. Revisa tus datos.",
        );
      }
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos enviar la solicitud. Intenta de nuevo.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!enabled) {
    return (
      <section className="form-notice" role="status" aria-labelledby="application-gate-title">
        <span className="form-notice-mark" aria-hidden="true">
          <Info size={18} strokeWidth={1.8} />
        </span>
        <div>
          <h2 id="application-gate-title">Registro universitario en preparación.</h2>
          <p>
            Antes de recopilar datos de contacto, publicaremos el aviso de
            privacidad aprobado y un canal para atender dudas.
          </p>
          <p>Por ahora, esta página no envía ni almacena datos.</p>
        </div>
      </section>
    );
  }

  if (sent) {
    return (
      <section className="form-success" role="status">
        <span className="success-registration-mark" aria-hidden="true">
          <CircleCheck size={18} strokeWidth={1.8} />
        </span>
        <div>
          <h2>Recibimos la solicitud.</h2>
          <p>
            Revisaremos los datos para valorar la integración. El envío no activa
            automáticamente una comunidad ni sus cuentas estudiantiles.
          </p>
        </div>
      </section>
    );
  }

  return (
    <form className="university-form" onSubmit={submit}>
      <div className="form-section-heading">
        <h2>Datos de la universidad</h2>
        <p>Los campos marcados con * son necesarios para revisar la solicitud.</p>
      </div>

      <div className="field-grid">
        <label className="field field-wide" htmlFor="university-name">
          <span>Nombre oficial *</span>
          <input
            id="university-name"
            name="name"
            type="text"
            autoComplete="organization"
            minLength={3}
            maxLength={140}
            value={name}
            onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (!slugChanged) setSlug(slugFromName(value));
            }}
            required
          />
        </label>
        <label className="field" htmlFor="university-slug">
          <span>Identificador web *</span>
          <input
            id="university-slug"
            name="slug"
            type="text"
            autoComplete="off"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            minLength={3}
            maxLength={60}
            value={slug}
            onChange={(event) => {
              setSlugChanged(true);
              setSlug(event.target.value.toLowerCase());
            }}
            required
          />
          <small>Se usará para identificar la comunidad.</small>
        </label>
        <label className="field" htmlFor="university-website">
          <span>Sitio oficial *</span>
          <input
            id="university-website"
            name="websiteUrl"
            type="url"
            autoComplete="url"
            placeholder="https://universidad.mx"
            maxLength={240}
            required
          />
        </label>
      </div>

      <div className="form-section-heading contact-heading">
        <h2>Persona de contacto</h2>
        <p>Alguien que pueda coordinar los siguientes pasos.</p>
      </div>

      <div className="field-grid">
        <label className="field" htmlFor="contact-name">
          <span>Nombre *</span>
          <input
            id="contact-name"
            name="contactName"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label className="field" htmlFor="contact-email">
          <span>Correo de contacto *</span>
          <input
            id="contact-email"
            name="contactEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
      </div>

      <div className="form-consent">
        <input id="privacy-accepted" name="privacyAccepted" type="checkbox" required />
        <label htmlFor="privacy-accepted">
          Autorizo que estos datos de contacto se usen para revisar la solicitud
          y dar seguimiento a la integración.
        </label>
      </div>
      <p className="privacy-note">
        No incluyas datos de alumnos. La solicitud se mantiene pendiente hasta
        que se revisen la identidad y los datos institucionales.
      </p>

      {error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : null}

      <button className="button-ink form-submit" type="submit" disabled={pending}>
        {pending ? "Enviando solicitud…" : "Enviar solicitud"}
        <ArrowRight aria-hidden="true" size={17} />
      </button>
    </form>
  );
}
