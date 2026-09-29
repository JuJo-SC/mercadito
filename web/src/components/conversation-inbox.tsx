"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ConversationSummary = {
  id: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
  };
  otherStudentName: string;
  direction: "received" | "initiated";
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
};

function formatActivity(value: string) {
  const date = new Date(value);
  const now = new Date();
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  });
  const sameDay = dayKey.format(date) === dayKey.format(now);
  return new Intl.DateTimeFormat("es-MX", sameDay
    ? { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }
    : { day: "2-digit", month: "short", timeZone: "America/Mexico_City" },
  ).format(date).replace(".", "");
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

export function ConversationInbox({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationSummary[];
  currentUserId: string;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (requestInFlight.current || document.visibilityState !== "visible") return;
    requestInFlight.current = true;
    try {
      const response = await fetch("/api/conversations", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as
        | { conversations?: ConversationSummary[]; error?: string }
        | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? "No pudimos actualizar tus mensajes.");
      }
      setConversations(payload.conversations ?? []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar tus mensajes.");
    } finally {
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 12000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  if (!conversations.length) {
    return (
      <section className="messages-empty" aria-live="polite">
        <h2>Tu próximo intercambio puede empezar aquí.</h2>
        <p>
          Cuando preguntes por una publicación o alguien responda a la tuya,
          el intercambio aparecerá aquí.
        </p>
        <Link className="button-ink" href="/mercadito#productos">
          Explorar publicaciones
          <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </Link>
        {error ? <p className="messages-refresh-error" role="status">{error}</p> : null}
      </section>
    );
  }

  const groups = [
    {
      id: "needs-reply",
      title: "Por responder",
      conversations: conversations.filter(
        (conversation) =>
          Boolean(conversation.lastMessage) &&
          conversation.lastMessage?.senderId !== currentUserId,
      ),
    },
    {
      id: "waiting",
      title: "Esperando respuesta",
      conversations: conversations.filter(
        (conversation) =>
          Boolean(conversation.lastMessage) &&
          conversation.lastMessage?.senderId === currentUserId,
      ),
    },
    {
      id: "start",
      title: "Por iniciar",
      conversations: conversations.filter((conversation) => !conversation.lastMessage),
    },
  ].filter((group) => group.conversations.length > 0);

  return (
    <section className="conversation-inbox" aria-labelledby="conversation-list-title">
      <div className="conversation-inbox-heading">
        <h2 id="conversation-list-title">Tus conversaciones</h2>
        <p>{conversations.length} {conversations.length === 1 ? "hilo" : "hilos"}</p>
      </div>
      {error ? <p className="messages-refresh-error" role="status">{error}</p> : null}
      {groups.map((group) => (
        <section
          className="conversation-group"
          key={group.id}
          aria-labelledby={"conversation-group-" + group.id}
        >
          <div className="conversation-group-heading">
            <h3 id={"conversation-group-" + group.id}>{group.title}</h3>
            <p>{group.conversations.length} {group.conversations.length === 1 ? "hilo" : "hilos"}</p>
          </div>
          <ol className="conversation-index">
            {group.conversations.map((conversation) => {
              const lastMessage = conversation.lastMessage;
              const preview = lastMessage
                ? (lastMessage.senderId === currentUserId ? "Tú: " : "") + lastMessage.body
                : "Abre el hilo para continuar.";
              return (
                <li key={conversation.id}>
                  <Link className="conversation-index-row" href={"/mensajes/" + conversation.id}>
                    <time
                      className="conversation-index-date"
                      dateTime={lastMessage?.createdAt ?? conversation.updatedAt}
                    >
                      {lastMessage ? formatActivity(lastMessage.createdAt) : formatActivity(conversation.updatedAt)}
                    </time>
                    <span className="conversation-index-main">
                      <span className="conversation-index-kicker">
                        <span className="conversation-direction">
                          {conversation.direction === "received" ? "Te preguntaron" : "Preguntaste tú"}
                        </span>
                      </span>
                      <span className="conversation-counterpart">{conversation.otherStudentName}</span>
                      <span className="conversation-listing-title">{conversation.listing.title}</span>
                      <span className="conversation-preview">{preview}</span>
                    </span>
                    <span className="conversation-index-meta">
                      <span className="conversation-price">{formatPrice(conversation.listing.price, conversation.listing.currency)}</span>
                      <span className="conversation-availability">{availabilityName(conversation.listing.status)}</span>
                      {conversation.unreadCount > 0 ? (
                        <span className="conversation-unread">
                          {conversation.unreadCount} {conversation.unreadCount === 1 ? "nuevo" : "nuevos"}
                        </span>
                      ) : null}
                    </span>
                    <ArrowRight className="conversation-index-arrow" aria-hidden="true" size={18} strokeWidth={1.8} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </section>
  );
}
