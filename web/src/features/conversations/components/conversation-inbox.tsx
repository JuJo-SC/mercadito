"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumbnail } from "@/features/listings/components/product-thumbnail";

type ConversationSummary = {
  id: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    photoUrl: string | null;
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
  const [direction, setDirection] = useState<"received" | "initiated">("received");
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

  const sections = [
    { id: "received" as const, title: "Ventas", description: "Personas que preguntan por tus productos." },
    { id: "initiated" as const, title: "Compras", description: "Conversaciones que iniciaste con otros vendedores." },
  ];
  const visibleConversations = conversations.filter((conversation) => conversation.direction === direction);
  const selected = sections.find((section) => section.id === direction)!;

  return (
    <section className="conversation-inbox" aria-label="Tus conversaciones">
      <div className="conversation-switcher" role="group" aria-label="Tipo de conversación">
        {sections.map((section) => {
          const items = conversations.filter((conversation) => conversation.direction === section.id);
          const unread = items.reduce((total, conversation) => total + conversation.unreadCount, 0);
          return (
            <button key={section.id} type="button" aria-pressed={direction === section.id}
              onClick={() => setDirection(section.id)}>
              {section.title}<span className="conversation-section-count">{items.length}</span>
              {unread > 0 ? <span className="conversation-section-unread" aria-label={unread + " mensajes sin leer"}>{unread}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="conversation-section-description">{selected.description}</p>
      {error ? <p className="messages-refresh-error" role="status">{error} <button className="text-action" type="button" onClick={() => void refresh()}>Reintentar</button></p> : null}
      {visibleConversations.length === 0 ? (
        <div className="messages-empty">
          <h2>{direction === "received" ? "Aún no recibes consultas." : "Aún no has preguntado por un producto."}</h2>
          <p>{direction === "received" ? "Cuando alguien te escriba por una publicación, verás aquí el producto y su mensaje." : "Abre un producto que te interese y escribe al vendedor. Encontrarás aquí esa conversación."}</p>
          <Link className="button-ink" href={direction === "received" ? "/mis-avisos" : "/mercadito"}>
            {direction === "received" ? "Ver mis publicaciones" : "Explorar productos"}
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      ) : (
        <ol className="conversation-product-list" aria-label={selected.title}>
          {visibleConversations.map((conversation) => {
            const lastMessage = conversation.lastMessage;
            const needsReply = lastMessage && lastMessage.senderId !== currentUserId;
            const preview = lastMessage
              ? (lastMessage.senderId === currentUserId ? "Tú: " : "") + lastMessage.body
              : "Abre la conversación para continuar.";
            return (
              <li key={conversation.id}>
                <Link className={"conversation-product-row" + (conversation.unreadCount > 0 ? " has-unread" : "")}
                  href={"/mensajes/" + conversation.id}>
                  <ProductThumbnail photoUrl={conversation.listing.photoUrl} title={conversation.listing.title} />
                  <span className="conversation-product-content">
                    <span className="conversation-product-heading">
                      <strong>{conversation.listing.title}</strong>
                      <time dateTime={lastMessage?.createdAt ?? conversation.updatedAt}>
                        {formatActivity(lastMessage?.createdAt ?? conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="conversation-product-person">{conversation.otherStudentName} · {formatPrice(conversation.listing.price, conversation.listing.currency)}</span>
                    <span className="conversation-product-preview">{preview}</span>
                    <span className="conversation-product-status">
                      <span>{availabilityName(conversation.listing.status)}</span>
                      {needsReply ? <span>Por responder</span> : lastMessage ? <span>Esperando respuesta</span> : null}
                      {conversation.unreadCount > 0 ? <span className="conversation-unread">{conversation.unreadCount} sin leer</span> : null}
                    </span>
                  </span>
                  <ArrowRight className="conversation-product-arrow" aria-hidden="true" size={18} />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
