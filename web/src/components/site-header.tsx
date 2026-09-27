import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { InstallButton } from "@/components/install-button";

type SiteHeaderProps = {
  signedIn?: boolean;
  userName?: string | null;
};

async function leaveAccount() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export function SiteHeader({ signedIn = false, userName }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner page-width">
        <Link className="brand-lockup" href="/" aria-label="Mercadito, inicio">
          <span className="brand-symbol" aria-hidden="true">
            <span className="brand-symbol-head" />
            <span className="brand-symbol-rule" />
            <span className="brand-symbol-row" />
            <span className="brand-symbol-dot" />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Mercadito</span>
            <span className="brand-description">Gaceta de intercambio</span>
          </span>
        </Link>

        <nav className="primary-navigation" aria-label="Navegación principal">
          <Link href="/#avisos">Explorar</Link>
          <Link href="/publicar">Publicar</Link>
          <Link href="/universidades">Universidades</Link>
        </nav>

        <div className="header-actions">
          <InstallButton />
          {signedIn ? (
            <>
              {userName ? (
                <span className="account-name" title={userName}>
                  {userName}
                </span>
              ) : null}
              <form action={leaveAccount}>
                <button
                  className="signout-button"
                  type="submit"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut aria-hidden="true" size={17} strokeWidth={1.8} />
                </button>
              </form>
            </>
          ) : (
            <Link className="header-login" href="/ingresar">
              <span>Entrar</span>
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
            </Link>
          )}
        </div>
      </div>
      <div className="mobile-navigation page-width" aria-label="Accesos rápidos">
        <Link href="/#avisos">Explorar avisos</Link>
        <Link href="/publicar">Publicar un artículo</Link>
        <Link href="/universidades">Registrar universidad</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Link className="footer-brand" href="/">
          <span>Mercadito</span>
          <span>Gaceta de intercambio</span>
        </Link>
        <p>Un aviso claro. Una comunidad cerca.</p>
        <nav aria-label="Enlaces al pie">
          <Link href="/universidades">Integrar una universidad</Link>
          <Link href="/ingresar">Acceso institucional</Link>
        </nav>
        <span className="footer-mark">M · MX</span>
      </div>
    </footer>
  );
}
