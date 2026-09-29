"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";

type ThreadMessage = {
  id: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(new Date(value)).replace(",", " ·").replace(".", "");
}

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

function availabilityName(status: string) {
  if (status === "RESERVED") return "Apartado";
  if (status === "SOLD") return "Vendido";
  if (status === "ARCHIVED") return "Archivado";
  return "Publicado";
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherStudentName,
  listing,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherStudentName: string;
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    condition: string;
    status: string;
  };
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionNotice, setConnectionNotice] = useState("");
  const messageListRef = useRef<HTMLOListElement>(null);
  const messagesRef = useRef(initialMessages);
  const polling = useRef(false);
  const messageRequestRef = useRef<{ body: string; id: string } | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
    const list = messageListRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages]);

  useEffect(() => {
    async function markRead() {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        cache: "no-store",
      }).catch(() => undefined);
    }

    async function refresh() {
      if (polling.current || document.visibilityState !== "visible") return;
      polling.current = true;
      try {
        const latest = messagesRef.current.at(-1)?.id;
        const query = latest ? `?after=${encodeURIComponent(latest)}` : "";
        const response = await fetch(
          `/api/conversations/${conversationId}/messages${query}`,
          { cache: "no-store", headers: { Accept: "application/json" } },
        );
        const payload = (await response.json().catch(() => null)) as
          | { messages?: ThreadMessage[]; error?: string }
          | null;
        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? "No pudimos actualizar los mensajes.");
        }
        const incoming = payload.messages ?? [];
        const knownIds = new Set(messagesRef.current.map((message) => message.id));
        const additions = incoming.filter((message) => !knownIds.has(message.id));
        if (additions.length) {
          setMessages((current) => {
            const existing = new Set(current.map((message) => message.id));
            const unseen = additions.filter((message) => !existing.has(message.id));
            return unseen.length ? [...current, ...unseen].slice(-120) : current;
          });
          if (additions.some((message) => message.senderId !== currentUserId)) void markRead();
        }
        setConnectionNotice("");
      } catch {
        setConnectionNotice("No pudimos actualizar. Revisa tu conexión; volveremos a intentar.");
      } finally {
        polling.current = false;
      }
    }

    void markRead();
    const timer = window.setInterval(() => void refresh(), 7000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [conversationId, currentUserId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    const previousRequest = messageRequestRef.current;
    const request = previousRequest?.body === body
      ? previousRequest
      : { body, id: crypto.randomUUID() };
    messageRequestRef.current = request;
    try {
      let response: Response;
      try {
        response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ body, clientRequestId: request.id }),
        });
      } catch {
        setError("No pudimos confirmar si el mensaje se envió. Comprueba tu conexión y vuelve a intentar con el mismo texto; evitaremos duplicarlo.");
        return;
      }
      const payload = (await response.json().catch(() => null)) as
        | { message?: ThreadMessage; error?: string }
        | null;
      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error ?? "No pudimos enviar el mensaje. Intenta de nuevo.");
      }
      const sentMessage = payload.message;
      setMessages((current) =>
        current.some((message) => message.id === sentMessage.id)
          ? current
          : [...current, sentMessage].slice(-120),
      );
      messageRequestRef.current = null;
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos enviar el mensaje. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="message-thread-page page-width">
      <Link className="back-link" href="/mensajes">
        <ArrowRight aria-hidden="true" size={16} />
        Volver a mensajes
      </Link>
      <div className="message-thread-heading">
        <h1>Con {otherStudentName}</h1>
        <p>Coordinen aquí los detalles del intercambio.</p>
      </div>

      <section className="thread-listing" aria-label="Producto de esta conversación">
        <div className="thread-listing-copy">
          <h2>{listing.title}</h2>
          <p>{listing.condition} · {availabilityName(listing.status)}</p>
        </div>
        <strong>{formatPrice(listing.price, listing.currency)}</strong>
      </section>

      <p className="thread-payment-note">
        Mercadito facilita la coordinación, no recibe ni procesa pagos. Si ambas
        personas lo deciden, pueden continuar por otro medio.
      </p>

      <section className="thread-exchange" aria-label={`Mensajes con ${otherStudentName}`}>
        <ol className="thread-messages" ref={messageListRef} aria-live="polite" aria-relevant="additions">
          {messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <li className={mine ? "thread-message is-mine" : "thread-message"} key={message.id}>
                <article className="thread-message-paper">
                  <p>{message.body}</p>
                  <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                </article>
              </li>
            );
          })}
          <li className="thread-scroll-anchor" aria-hidden="true" />
        </ol>

        {connectionNotice ? <p className="thread-status" role="status">{connectionNotice}</p> : null}
        {error ? <p className="thread-error" role="alert">{error}</p> : null}
        <form className="thread-composer" onSubmit={sendMessage}>
          <label htmlFor="thread-message">Tu mensaje</label>
          <textarea
            id="thread-message"
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe una pregunta o acuerda dónde encontrarse…"
            maxLength={2000}
            rows={2}
            required
          />
          <div className="thread-composer-foot">
            <p>Solo texto · {draft.length}/2,000</p>
            <button className="button-ink thread-send" type="submit" disabled={sending || !draft.trim()}>
              {sending ? "Enviando…" : "Enviar"}
              {sending ? null : <Send aria-hidden="true" size={16} strokeWidth={1.8} />}
            </button>
          </div>
        </form>
        <Link className="thread-index-link" href="/mensajes">
          Ir a la bandeja
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </main>
  );
}
