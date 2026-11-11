"use client";

import { useEffect, useRef } from "react";
import { startInstitutionalLogin } from "@/features/auth/actions";

export function AutoSignInForm({ returnTo }: { returnTo: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={() => startInstitutionalLogin(returnTo)}>
      <noscript>
        <button type="submit" className="button-ink" style={{ marginTop: "16px" }}>
          Continuar al acceso institucional
        </button>
      </noscript>
    </form>
  );
}
