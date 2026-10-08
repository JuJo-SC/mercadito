import { ArrowRight, CircleHelp, LayoutGrid, MessageCircle, PlusCircle, Store } from "lucide-react";
import Link from "next/link";
import { PublicFeatureDetails } from "@/components/public-feature-guide";
import { DashboardNavigationLink } from "@/components/site-header-interactions";
import { UnreadMessagesNavLink } from "@/features/conversations/components/unread-messages-navigation";

export function AppNavigation({ signedIn, universityName, publicGuide = false }: { signedIn: boolean; universityName: string | null; publicGuide?: boolean }) {
  const destination = (path: string) => signedIn ? path : "/ingresar?returnTo=" + encodeURIComponent(path);

  return (
    <aside className={"app-navigation" + (publicGuide && !signedIn ? " app-navigation-guide" : "")}>
      <nav className="app-navigation-links" aria-label="Navegación principal">
        <DashboardNavigationLink href={signedIn ? "/mercadito" : "/"} className="app-nav-link">
          <Store aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>Explorar</span>
        </DashboardNavigationLink>
        {publicGuide && !signedIn ? (
          <>
            <div className="app-nav-guide-item">
              <DashboardNavigationLink href={destination("/mensajes")} className="app-nav-link">
                <MessageCircle aria-hidden="true" size={22} strokeWidth={1.8} /><span>Mensajes</span>
              </DashboardNavigationLink>
              <div className="public-nav-details"><PublicFeatureDetails feature="messages" /></div>
            </div>
            <div className="app-nav-guide-item">
              <DashboardNavigationLink href={destination("/publicar")} className="app-nav-link app-nav-publish">
                <PlusCircle aria-hidden="true" size={22} strokeWidth={1.8} /><span>Publicar</span>
              </DashboardNavigationLink>
              <div className="public-nav-details"><PublicFeatureDetails feature="publish" /></div>
            </div>
            <div className="app-nav-guide-item">
              <DashboardNavigationLink href={destination("/mis-avisos")} className="app-nav-link">
                <LayoutGrid aria-hidden="true" size={22} strokeWidth={1.8} /><span>Mis publicaciones</span>
              </DashboardNavigationLink>
              <div className="public-nav-details"><PublicFeatureDetails feature="listings" /></div>
            </div>
          </>
        ) : (
          <>
            <UnreadMessagesNavLink href={destination("/mensajes")} />
            <DashboardNavigationLink href={destination("/publicar")} activePath="/publicar" className="app-nav-link app-nav-publish">
              <PlusCircle aria-hidden="true" size={22} strokeWidth={1.8} />
              <span>Publicar</span>
            </DashboardNavigationLink>
            <DashboardNavigationLink href={destination("/mis-avisos")} activePath="/mis-avisos" className="app-nav-link">
              <LayoutGrid aria-hidden="true" size={22} strokeWidth={1.8} />
              <span className="app-nav-publications-label">Mis publicaciones</span>
            </DashboardNavigationLink>
          </>
        )}
      </nav>
      {publicGuide && !signedIn && (
        <div className="public-nav-access">
          <p className="feature-example-note">Ejemplos de lo que podrás hacer.</p>
          <Link className="button-ink" href="/ingresar?returnTo=%2Fmercadito">Entrar al mercadito<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
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
