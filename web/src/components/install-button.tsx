"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, MoreVertical, Share } from "lucide-react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};
type ExtendedNavigator = Navigator & { standalone?: boolean };

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as ExtendedNavigator).standalone);
    const userAgent = navigator.userAgent;
    const appleDevice = /iphone|ipad|ipod/i.test(userAgent);
    setIsInstalled(standalone);
    setIsIos(appleDevice && !standalone);
    setIsAndroid(/android/i.test(userAgent) && !standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
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
