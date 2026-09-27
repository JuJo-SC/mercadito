"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Share } from "lucide-react";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};
type ExtendedNavigator = Navigator & { standalone?: boolean };

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as ExtendedNavigator).standalone);
    const appleDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsInstalled(standalone);
    setIsIos(appleDevice && !standalone);

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

  if (isInstalled || (!promptEvent && !isIos)) return null;

  return (
    <div className="install-control">
      <button className="install-button" type="button" onClick={install}>
        <ArrowDownToLine aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Instalar</span>
      </button>
      {showInstructions && isIos ? (
        <div className="install-instructions" role="status">
          <Share aria-hidden="true" size={16} />
          <p>
            En Safari, toca Compartir y después “Añadir a pantalla de inicio”.
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
