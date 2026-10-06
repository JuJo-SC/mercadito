import { CircleHelp, LayoutGrid, PlusCircle, Store } from "lucide-react";
import { DashboardNavigationLink } from "@/components/site-header-interactions";
import { UnreadMessagesNavLink } from "@/features/conversations/components/unread-messages-navigation";

export function AppNavigation({ signedIn, universityName }: { signedIn: boolean; universityName: string | null }) {
  const destination = (path: string) => signedIn ? path : "/ingresar?returnTo=" + encodeURIComponent(path);

  return (
    <aside className="app-navigation">
      <nav className="app-navigation-links" aria-label="Navegación principal">
        <DashboardNavigationLink href={signedIn ? "/mercadito" : "/"} className="app-nav-link">
          <Store aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>Explorar</span>
        </DashboardNavigationLink>
        <UnreadMessagesNavLink href={destination("/mensajes")} />
        <DashboardNavigationLink href={destination("/publicar")} activePath="/publicar" className="app-nav-link app-nav-publish">
          <PlusCircle aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>Publicar</span>
        </DashboardNavigationLink>
        <DashboardNavigationLink href={destination("/mis-avisos")} activePath="/mis-avisos" className="app-nav-link">
          <LayoutGrid aria-hidden="true" size={22} strokeWidth={1.8} />
          <span className="app-nav-publications-label">Mis publicaciones</span>
        </DashboardNavigationLink>
      </nav>
      <div className="app-navigation-context">
        <span className="app-community-symbol" aria-hidden="true"><Store size={18} strokeWidth={1.8} /></span>
        <div><strong>{universityName ?? "Tu comunidad"}</strong><span>Tu comunidad universitaria</span></div>
      </div>
      {!signedIn && (
        <DashboardNavigationLink className="app-help-link" href="/#como-funciona">
          <CircleHelp aria-hidden="true" size={18} strokeWidth={1.8} />Cómo funciona
        </DashboardNavigationLink>
      )}
    </aside>
  );
}
