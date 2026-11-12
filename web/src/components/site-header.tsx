import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { signOut } from "@/features/auth/auth";
import { activeUniversityName } from "@/features/community/lib/active-community";
import { InstallButton } from "@/features/pwa/components/install-button";
import { startInstitutionalLogin } from "@/features/auth/actions";
import {
  DashboardNavigationLink,
  SiteHeaderFrame,
  AppSectionTitle,
} from "@/components/site-header-interactions";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { AppNavigation } from "@/components/app-navigation";
import {
  UnreadMessagesProvider,
} from "@/features/conversations/components/unread-messages-navigation";

type SiteHeaderProps = {
  signedIn?: boolean;
  userName?: string | null;
  facultyName?: string | null;
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
  facultyName,
  universityName = activeUniversityName,
  unreadMessageCount = 0,
  excludeUnreadConversationId,
}: SiteHeaderProps) {
  async function handleLogin() {
    "use server";
    await startInstitutionalLogin("/mercadito");
  }

  return (
    <UnreadMessagesProvider
      active={signedIn}
      initialUnreadCount={unreadMessageCount}
      excludeConversationId={excludeUnreadConversationId}
    >
      <SiteHeaderFrame signedIn={signedIn}>
        <div className="site-header-inner">
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

          <AppSectionTitle />

          <div className="header-actions">
            <InstallButton />
            {signedIn ? (
              <UserProfileMenu
                userName={userName}
                facultyName={facultyName}
                universityName={universityName}
                action={leaveAccount}
              />
            ) : (
              <form action={handleLogin}>
                <button type="submit" className="header-login cursor-pointer">
                  <span>Entrar</span>
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                </button>
              </form>
            )}
          </div>
        </div>
      </SiteHeaderFrame>
      {signedIn ? <AppNavigation signedIn={signedIn} universityName={universityName} /> : null}
    </UnreadMessagesProvider>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <Link className="footer-brand" href="/">
          <span>Mercadito</span>
          <span>{activeUniversityName}</span>
        </Link>
        <p>Compra y vende entre estudiantes de {activeUniversityName}.</p>
        <nav aria-label="Enlaces al pie">
          <Link href="/#como-funciona">Cómo funciona</Link>
          <Link href="/ingresar?returnTo=%2Fmercadito">Entrar a {activeUniversityName}</Link>
        </nav>
        <span className="footer-mark">M · MX</span>
      </div>
    </footer>
  );
}