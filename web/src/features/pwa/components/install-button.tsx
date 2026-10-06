"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, MoreVertical, Share } from "lucide-react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};
type ExtendedNavigator = Navigator & { standalone?: boolean };

function subscribeInstallEnvironment(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getInstallEnvironment() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as ExtendedNavigator).standalone);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const android = /android/i.test(navigator.userAgent);
  return (standalone ? 1 : 0) | (ios ? 2 : 0) | (android ? 4 : 0);
}

function getServerInstallEnvironment() {
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
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js?v=1", { scope: "/" }).catch(() => {
      // Offline support is progressive enhancement; installation controls still work.
    });
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
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
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (isInstalled) return null;

  return (
    <div className="install-control">
      <button className="install-button" type="button" onClick={install}>
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
