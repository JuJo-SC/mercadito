"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DashboardNavigationLink } from "@/components/site-header-interactions";

type UnreadMessagesContextValue = number;
const UnreadMessagesContext = createContext<UnreadMessagesContextValue>(0);

type UnreadMessagesProviderProps = {
  active: boolean;
  initialUnreadCount: number;
  excludeConversationId?: string;
  children: ReactNode;
};

export function UnreadMessagesProvider({
  active,
  initialUnreadCount,
  excludeConversationId,
  children,
}: UnreadMessagesProviderProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const requestInFlight = useRef(false);

  const [previousInitialCount, setPreviousInitialCount] = useState(initialUnreadCount);
  if (previousInitialCount !== initialUnreadCount) {
    setPreviousInitialCount(initialUnreadCount);
    setUnreadCount(initialUnreadCount);
  }

  useEffect(() => {
    if (!active) return;

    async function refresh() {
      if (requestInFlight.current || document.visibilityState !== "visible") return;
      requestInFlight.current = true;
      const query = excludeConversationId
        ? `?exclude=${encodeURIComponent(excludeConversationId)}`
        : "";

      try {
        const response = await fetch(`/api/conversations/unread${query}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json().catch(() => null)) as
          | { unreadMessageCount?: number }
          | null;
        if (
          response.ok &&
          typeof payload?.unreadMessageCount === "number" &&
          Number.isSafeInteger(payload.unreadMessageCount) &&
          payload.unreadMessageCount >= 0
        ) {
          setUnreadCount(payload.unreadMessageCount);
        }
      } catch {
        // Keep the last known count until the next refresh.
      } finally {
        requestInFlight.current = false;
      }
    }

    const timer = window.setInterval(() => void refresh(), 20000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, excludeConversationId]);

  return (
    <UnreadMessagesContext.Provider value={unreadCount}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function UnreadMessagesNavLink() {
  const unreadMessageCount = useContext(UnreadMessagesContext);
  const label = unreadMessageCount > 0
    ? `Mensajes, ${unreadMessageCount} sin leer`
    : "Mensajes";

  return (
    <DashboardNavigationLink className="messages-nav-link" href="/mensajes" aria-label={label}>
      <span>Mensajes</span>
      {unreadMessageCount > 0 ? (
        <span className="messages-unread-count" aria-hidden="true">
          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
        </span>
      ) : null}
    </DashboardNavigationLink>
  );
}
