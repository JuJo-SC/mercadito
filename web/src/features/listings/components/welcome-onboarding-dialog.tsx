"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, X } from "lucide-react";

type WelcomeOnboardingDialogProps = {
  universityName: string;
  studentId: string;
  loginSessionId?: string;
};

function formatUniversityShortName(name: string) {
  if (/aut[oó]noma de tamaulipas/i.test(name) || /tamaulipas/i.test(name)) {
    return "UAT";
  }
  return name;
}

export function WelcomeOnboardingDialog({
  universityName,
  studentId,
  loginSessionId,
}: WelcomeOnboardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const dismissedKey = "mercadito:onboarding:dismissed:" + studentId;
  const visitsKey = "mercadito:onboarding:visits:" + studentId;
  const sessionSeenKey =
    "mercadito:onboarding:session_seen:" +
    studentId +
    (loginSessionId ? ":" + loginSessionId : "");

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed === "true") return;

      const alreadySeenThisSession = sessionStorage.getItem(sessionSeenKey);
      if (alreadySeenThisSession === "true") return;

      sessionStorage.setItem(sessionSeenKey, "true");

      const rawVisits = localStorage.getItem(visitsKey);
      const visits = rawVisits ? parseInt(rawVisits, 10) : 0;
      const currentVisits = visits + 1;
      localStorage.setItem(visitsKey, String(currentVisits));

      window.requestAnimationFrame(() => {
        setIsReturning(currentVisits > 1);
        setOpen(true);
      });
    } catch {
      // Storage unavailable
    }
  }, [dismissedKey, visitsKey, sessionSeenKey]);

  function handleDismiss() {
    setOpen(false);
    if (doNotShowAgain) {
      try {
        localStorage.setItem(dismissedKey, "true");
      } catch {
        // Fallback
      }
    }
  }

  if (!open) return null;

  const shortUniversity = formatUniversityShortName(universityName);

  return (
    <div
      className="welcome-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="welcome-dialog-card">
        <button
          type="button"
          className="welcome-dialog-close"
          aria-label="Cerrar ventana"
          onClick={() => handleDismiss()}
        >
          <X aria-hidden="true" size={18} strokeWidth={2.2} />
        </button>

        <header className="welcome-dialog-header">
          <div className="welcome-dialog-badge">
            <span aria-hidden="true">👋</span>
            <span>¡Bienvenido a Mercadito {shortUniversity}!</span>
          </div>
          <h2 id="welcome-dialog-title">¿Qué te gustaría hacer hoy?</h2>
        </header>

        <div className="welcome-dialog-choices">
          {/* Opción 1: Publicar y vender */}
          <div className="welcome-choice-card">
            <div className="welcome-choice-body">
              <div className="welcome-choice-title-row">
                <span className="welcome-choice-icon is-sell" aria-hidden="true">
                  <Package size={17} strokeWidth={2.2} />
                </span>
                <h3>Publicar y vender</h3>
              </div>
              <p>
                Ofrece libros, calculadoras, material de clases, tecnología, ropa o snacks y comida de tu emprendimiento para tus compañeros de campus.
              </p>
            </div>
            <Link
              className="welcome-choice-btn is-primary"
              href="/publicar"
              onClick={() => handleDismiss()}
            >
              <span>Publicar ya</span>
              <ArrowRight aria-hidden="true" size={15} strokeWidth={2.4} />
            </Link>
          </div>

          {/* Opción 2: Explorar y comprar */}
          <div className="welcome-choice-card">
            <div className="welcome-choice-body">
              <div className="welcome-choice-title-row">
                <span className="welcome-choice-icon is-buy" aria-hidden="true">
                  <ShoppingBag size={17} strokeWidth={2.2} />
                </span>
                <h3>Explorar y comprar</h3>
              </div>
              <p>
                Encuentra libros de materias, útiles escolares, tecnología, uniformes, accesorios o antojitos preparados por estudiantes de tu universidad.
              </p>
            </div>
            <button
              type="button"
              className="welcome-choice-btn is-secondary"
              onClick={() => handleDismiss()}
            >
              <span>Ver cosas de mi interés</span>
              <ArrowRight aria-hidden="true" size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {isReturning ? (
          <div className="welcome-dialog-foot">
            <label className="welcome-dialog-checkbox-label">
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={(e) => {
                  setDoNotShowAgain(e.target.checked);
                  if (e.target.checked) {
                    try {
                      localStorage.setItem(dismissedKey, "true");
                    } catch {
                      // Fallback
                    }
                  } else {
                    try {
                      localStorage.removeItem(dismissedKey);
                    } catch {
                      // Fallback
                    }
                  }
                }}
              />
              <span>No volver a mostrar esta ventana</span>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
