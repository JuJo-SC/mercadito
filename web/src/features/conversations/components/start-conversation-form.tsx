"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Send } from "lucide-react";

export function StartConversationForm({
  listingId,
  sellerId,
  sellerName,
  currentUserId,
  signedIn,
  isDemo,
}: {
  listingId: string;
  sellerId: string;
  sellerName: string;
  currentUserId: string | null;
  signedIn: boolean;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageRequestRef = useRef<{ body: string; id: string } | null>(null);

  if (isDemo) {
    return (
      <p className="notice-contact-note">
        Esta publicación es ficticia; en la demostración no se envían mensajes.
      </p>
    );
  }

  if (!signedIn || !currentUserId) {
    return (
      <div className="notice-contact-gate">
        <p>Inicia sesión con tu cuenta institucional para escribirle a {sellerName}.</p>
        <Link className="text-action" href="/ingresar?returnTo=%2F">
          Acceso institucional
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    );
  }

  if (sellerId === currentUserId) {
    return <p className="notice-contact-note">Esta es tu publicación. Las personas interesadas pueden escribirte aquí.</p>;
  }

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = body.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    const previousRequest = messageRequestRef.current;
    const request = previousRequest?.body === message
      ? previousRequest
      : { body: message, id: crypto.randomUUID() };
    messageRequestRef.current = request;

    try {
      let response: Response;
      try {
        response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ listingId, body: message, clientRequestId: request.id }),
        });
      } catch {
        setError("No pudimos confirmar si la pregunta se envió. Comprueba tu conexión y vuelve a intentar con el mismo texto; evitaremos duplicarla.");
        setSending(false);
        return;
      }
      const payload = (await response.json().catch(() => null)) as
        | { conversationId?: string; error?: string }
        | null;
      if (!response.ok || !payload?.conversationId) {
        throw new Error(payload?.error ?? "No pudimos enviar la pregunta. Intenta de nuevo.");
      }
      router.push(`/mensajes/${payload.conversationId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos enviar la pregunta. Intenta de nuevo.");
      setSending(false);
    }
  }

  const limitId = `first-message-limit-${listingId}`;

  return (
    <form className="notice-contact-form" onSubmit={startConversation}>
      <h3>Pregunta por esta publicación</h3>
      <label htmlFor={`first-message-${listingId}`}>Primer mensaje para {sellerName}</label>
      <textarea
        id={`first-message-${listingId}`}
        aria-describedby={limitId}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="¿Sigue disponible? ¿Podemos acordar un lugar para el intercambio?"
        maxLength={2000}
        rows={2}
        required
      />
      <div className="notice-contact-foot">
        <div className="notice-contact-meta">
          <p id={limitId}>{body.length}/2,000 caracteres</p>
          <p>Solo texto · pagos fuera de Mercadito</p>
        </div>
        <button className="button-ink" type="submit" disabled={sending || !body.trim()}>
          {sending ? "Enviando…" : "Enviar pregunta"}
          {sending ? null : <Send aria-hidden="true" size={16} strokeWidth={1.8} />}
        </button>
      </div>
      {error ? <p className="thread-error" role="alert">{error}</p> : null}
    </form>
  );
}
