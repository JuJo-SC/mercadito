"use client";

import { useEffect } from "react";

export function SignInSessionCleaner() {
  useEffect(() => {
    try {
      sessionStorage.clear();
    } catch {
      // Storage unavailable
    }
  }, []);

  return null;
}

