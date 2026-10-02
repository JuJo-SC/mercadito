import Link from "next/link";
import { ArrowRight, LogOut, Store } from "lucide-react";
import { signOut } from "@/auth";
import { InstallButton } from "@/components/install-button";
import {
  DashboardNavigationLink,
  SiteHeaderFrame,
} from "@/components/site-header-interactions";
import {
  UnreadMessagesNavLink,
  UnreadMessagesProvider,
} from "@/components/unread-messages-navigation";

type SiteHeaderProps = {
  signedIn?: boolean;
  userName?: string | null;
  universityName?: string | null;
  unreadMessageCount?: number;
  excludeUnreadConversationId?: string;
};

async function leaveAccount() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export function SiteHeader({
  signedIn = false,
  userName,
  universityName,
  unreadMessageCount = 0,
  excludeUnreadConversationId,
}: SiteHeaderProps) {
  return (
    <UnreadMessagesProvider
      active={signedIn}
      initialUnreadCount={unreadMessageCount}
      excludeConversationId={excludeUnreadConversationId}
    >
      <SiteHeaderFrame>
        <div className="site-header-inner page-width">
          <DashboardNavigationLink
            className="brand-lockup"
            href="/"
            aria-label={universityName ? "Mercadito, " + universityName + ", inicio" : "Mercadito, inicio"}
          >
            <span className="brand-symbol" aria-hidden="true">
              <Store aria-hidden="true" size={21} strokeWidth={1.9} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Mercadito</span>
              <span
                className={universityName ? "brand-description brand-campus-name" : "brand-description"}
                title={universityName ?? "Mercado del campus"}
              >
                {universityName ?? "Mercado del campus"}
              </span>
            </span>
          </DashboardNavigationLink>

          <nav className="primary-navigation" aria-label="Navegación principal">
            {signedIn ? (
              <>
                <DashboardNavigationLink href="/mercadito">Mercadito</DashboardNavigationLink>
                <DashboardNavigationLink href="/publicar">Publicar</DashboardNavigationLink>
                <DashboardNavigationLink href="/mis-avisos">Mis publicaciones</DashboardNavigationLink>
                <UnreadMessagesNavLink />
              </>
            ) : (
              <DashboardNavigationLink href="/#como-funciona">Cómo funciona</DashboardNavigationLink>
            )}
            <DashboardNavigationLink href="/universidades">Universidades</DashboardNavigationLink>
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
              <Link className="header-login" href="/ingresar?returnTo=%2Fmercadito">
                <span>Entrar</span>
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
              </Link>
            )}
          </div>
        </div>
        <nav
          className={signedIn ? "mobile-navigation page-width has-messages" : "mobile-navigation page-width"}
          aria-label="Accesos rápidos"
        >
          {signedIn ? (
            <>
              <DashboardNavigationLink href="/mercadito">Mercadito</DashboardNavigationLink>
              <UnreadMessagesNavLink />
              <DashboardNavigationLink href="/mis-avisos">Mis publicaciones</DashboardNavigationLink>
              <DashboardNavigationLink href="/publicar">Publicar</DashboardNavigationLink>
            </>
          ) : (
            <>
              <DashboardNavigationLink href="/#como-funciona">Cómo funciona</DashboardNavigationLink>
              <DashboardNavigationLink href="/universidades">Universidades</DashboardNavigationLink>
              <DashboardNavigationLink href="/ingresar?returnTo=%2Fmercadito">Entrar</DashboardNavigationLink>
            </>
          )}
        </nav>
      </SiteHeaderFrame>
    </UnreadMessagesProvider>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Link className="footer-brand" href="/">
          <span>Mercadito</span>
          <span>Mercado del campus</span>
        </Link>
        <p>Compra y vende dentro de tu comunidad.</p>
        <nav aria-label="Enlaces al pie">
          <Link href="/universidades">Integrar una universidad</Link>
          <Link href="/ingresar?returnTo=%2Fmercadito">Acceso institucional</Link>
        </nav>
        <span className="footer-mark">M · MX</span>
      </div>
    </footer>
  );
}
