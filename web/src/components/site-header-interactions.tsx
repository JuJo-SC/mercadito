"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

type DashboardNavigationLinkProps = Omit<ComponentProps<typeof Link>, "onNavigate" | "scroll"> & {
  activePath?: string;
};

export function DashboardNavigationLink({ activePath, ...props }: DashboardNavigationLinkProps) {
  const pathname = usePathname();
  const target = activePath ?? (typeof props.href === "string" ? props.href : "");
  const selected = target && !target.includes("#") &&
    (pathname === target || (target !== "/" && pathname.startsWith(target + "/")));
  return <Link {...props} aria-current={selected ? "page" : undefined} scroll={false} />;
}

export function SiteHeaderFrame({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  return <header className={"site-header app-header" + (signedIn ? " is-authenticated" : "")}>{children}</header>;
}

export function AppSectionTitle() {
  const pathname = usePathname();
  const title = pathname.startsWith("/mensajes") ? "Mensajes"
    : pathname.startsWith("/mis-avisos") ? "Mis publicaciones"
    : pathname.startsWith("/publicar") ? "Publicar"
    : pathname.startsWith("/ingresar") ? "Acceso a tu comunidad"
    : "Explorar";
  return <span className="app-section-title">{title}</span>;
}
