"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    // Run after the destination DOM and the router's layout effects commit.
    // Query-only changes keep their position; anchor links keep their target.
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
