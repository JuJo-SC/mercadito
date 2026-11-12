"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

type UserProfileMenuProps = {
  userName?: string | null;
  facultyName?: string | null;
  universityName?: string | null;
  action: () => Promise<void>;
};

function getInitials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("mercadito-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("mercadito-theme-change", callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  try {
    const saved = localStorage.getItem("mercadito-theme") as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // storage not available
  }
  return "system";
}

function getThemeServerSnapshot(): ThemeMode {
  return "system";
}

export function UserProfileMenu({
  userName,
  facultyName,
  universityName,
  action,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleThemeChange(newTheme: ThemeMode) {
    try {
      localStorage.setItem("mercadito-theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (newTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      window.dispatchEvent(new Event("mercadito-theme-change"));
    } catch {
      // storage unavailable
    }
  }

  function handleClearSession() {
    try {
      sessionStorage.clear();
    } catch {
      // storage unavailable
    }
  }

  const initials = getInitials(userName);
  const displayName = userName || "Estudiante";
  const displayFaculty = facultyName || universityName || "Universidad Autónoma de Tamaulipas";

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button
        type="button"
        className="app-account-trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Mi perfil y opciones"
      >
        <span className="app-avatar" aria-hidden="true">
          {initials ? initials : <UserRound size={17} strokeWidth={2} />}
        </span>
        <span className="account-name">{displayName}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`account-chevron ${isOpen ? "is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="profile-popover" role="dialog" aria-label="Perfil y opciones">
          <div className="profile-popover-identity">
            <div className="profile-popover-avatar" aria-hidden="true">
              {initials ? initials : <UserRound size={22} strokeWidth={2} />}
            </div>
            <div className="profile-popover-info">
              <div className="profile-popover-name-row">
                <span className="profile-popover-name" title={displayName}>
                  {displayName}
                </span>
                <span className="profile-popover-badge">UAT</span>
              </div>
              <p className="profile-popover-faculty" title={displayFaculty}>
                {displayFaculty}
              </p>
            </div>
          </div>

          <div className="profile-popover-section">
            <div className="profile-popover-section-label">
              <span>Tema de la interfaz</span>
              <span className="theme-current-tag">
                {theme === "dark" ? "Oscuro" : theme === "light" ? "Claro" : "Auto"}
              </span>
            </div>
            <div className="theme-segmented-control" role="radiogroup" aria-label="Seleccionar tema">
              <button
                type="button"
                role="radio"
                aria-checked={theme === "light"}
                className={`theme-segment ${theme === "light" ? "is-active" : ""}`}
                onClick={() => handleThemeChange("light")}
              >
                <Sun size={14} strokeWidth={2} aria-hidden="true" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={theme === "dark"}
                className={`theme-segment ${theme === "dark" ? "is-active" : ""}`}
                onClick={() => handleThemeChange("dark")}
              >
                <Moon size={14} strokeWidth={2} aria-hidden="true" />
                <span>Oscuro</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={theme === "system"}
                className={`theme-segment ${theme === "system" ? "is-active" : ""}`}
                onClick={() => handleThemeChange("system")}
              >
                <Monitor size={14} strokeWidth={2} aria-hidden="true" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          <div className="profile-popover-footer">
            <form action={action} onSubmit={handleClearSession}>
              <button
                type="submit"
                className="profile-popover-logout"
                onClick={handleClearSession}
              >
                <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}