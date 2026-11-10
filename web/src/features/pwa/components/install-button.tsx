"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, MoreVertical, Share } from "lucide-react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};
type ExtendedNavigator = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string; id?: string }>>;
};

const STORAGE_KEY = "mercadito_pwa_installed";

function isStandaloneEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  const isStandaloneMedia =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches;

  const isIosStandalone = Boolean((window.navigator as ExtendedNavigator).standalone);
  const isAndroidReferrer =
    typeof document !== "undefined" && document.referrer.startsWith("android-app://");
  const isUrlParam =
    window.location.search.includes("mode=standalone") ||
    window.location.search.includes("source=pwa");

  return isStandaloneMedia || isIosStandalone || isAndroidReferrer || isUrlParam;
}

function hasStoredInstallation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistInstalledStatus(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Si la navegación privada restringe el almacenamiento, no interrumpir la ejecución
  }
}

function subscribeInstallEnvironment(onChange: () => void) {
  const mqls = [
    window.matchMedia("(display-mode: standalone)"),
    window.matchMedia("(display-mode: fullscreen)"),
    window.matchMedia("(display-mode: minimal-ui)"),
  ];

  mqls.forEach((mql) => mql.addEventListener("change", onChange));
  window.addEventListener("storage", onChange);

  return () => {
    mqls.forEach((mql) => mql.removeEventListener("change", onChange));
    window.removeEventListener("storage", onChange);
  };
}

function getInstallEnvironment(): number {
  const standalone = isStandaloneEnvironment() || hasStoredInstallation();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const android = /android/i.test(navigator.userAgent);

  if (standalone) {
    persistInstalledStatus();
  }

  return (standalone ? 1 : 0) | (ios ? 2 : 0) | (android ? 4 : 0);
}

function getServerInstallEnvironment(): number {
  return 0;
}

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const environment = useSyncExternalStore(
    subscribeInstallEnvironment,
    getInstallEnvironment,
    getServerInstallEnvironment,
  );
  const [installedAfterPrompt, setInstalledAfterPrompt] = useState(false);
  const isInstalled = installedAfterPrompt || Boolean(environment & 1);
  const isIos = !isInstalled && Boolean(environment & 2);
  const isAndroid = !isInstalled && Boolean(environment & 4);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (
      window.location.search.includes("mode=standalone") ||
      window.location.search.includes("source=pwa")
    ) {
      persistInstalledStatus();
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("mode");
      cleanUrl.searchParams.delete("source");
      window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }

    const extendedNav = navigator as ExtendedNavigator;
    if ("getInstalledRelatedApps" in navigator && typeof extendedNav.getInstalledRelatedApps === "function") {
      extendedNav
        .getInstalledRelatedApps()
        .then((relatedApps) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            persistInstalledStatus();
            setInstalledAfterPrompt(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js?v=1", { scope: "/" }).catch(() => {
      // Offline support is progressive enhancement; installation controls still work.
    });
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      if (isStandaloneEnvironment()) {
        return;
      }
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      persistInstalledStatus();
      setInstalledAfterPrompt(true);
      setPromptEvent(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) {
      setShowInstructions((current) => !current);
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === "accepted") {
        persistInstalledStatus();
        setInstalledAfterPrompt(true);
        setShowInstructions(false);
      }
    } catch {
      // Ignorar cancelaciones o interrupciones del diálogo del sistema
    } finally {
      setPromptEvent(null);
    }
  }

  if (isInstalled) return null;

  return (
    <div className="install-control">
      <button
        className="install-button"
        type="button"
        onClick={install}
        aria-label="Instalar Mercadito"
        title="Instalar Mercadito"
      >
        <ArrowDownToLine aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Instalar</span>
      </button>
      {showInstructions ? (
        <div className="install-instructions" role="status">
          {isIos ? (
            <Share aria-hidden="true" size={16} />
          ) : (
            <MoreVertical aria-hidden="true" size={16} />
          )}
          <p>
            {isIos
              ? "En Safari, toca Compartir y después “Añadir a pantalla de inicio”."
              : isAndroid
                ? "En Chrome para Android, abre el menú y elige «Instalar aplicación» o «Añadir a pantalla principal»."
                : "Abre el menú del navegador y busca «Instalar aplicación» o «Añadir a pantalla de inicio». La opción depende del navegador."}
          </p>
          <button
            type="button"
            className="install-dismiss"
            onClick={() => setShowInstructions(false)}
          >
            Entendido
          </button>
        </div>
      ) : null}
    </div>
  );
}
