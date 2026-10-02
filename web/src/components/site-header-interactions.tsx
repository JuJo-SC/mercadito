"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

type DashboardNavigationLinkProps = Omit<ComponentProps<typeof Link>, "onNavigate">;

function scrollToTop() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousScrollBehavior;
}

export function DashboardNavigationLink(props: DashboardNavigationLinkProps) {
  return <Link {...props} onNavigate={scrollToTop} />;
}

export function SiteHeaderFrame({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let directionAnchor = window.scrollY;
    let latestScrollY = directionAnchor;
    let frameId: number | null = null;

    const updateVisibility = () => {
      frameId = null;
      if (latestScrollY <= 96) {
        setIsHidden(false);
        directionAnchor = latestScrollY;
        return;
      }

      const delta = latestScrollY - directionAnchor;
      if (delta >= 4) {
        setIsHidden(true);
        directionAnchor = latestScrollY;
      } else if (delta <= -4) {
        setIsHidden(false);
        directionAnchor = latestScrollY;
      }
    };

    const handleScroll = () => {
      latestScrollY = window.scrollY;
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <header className={"site-header" + (isHidden ? " is-scroll-hidden" : "")}>
      {children}
    </header>
  );
}