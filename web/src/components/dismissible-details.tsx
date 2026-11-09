"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/** Native disclosure with outside-pointer and Escape dismissal. */
export function DismissibleDetails(props: ComponentPropsWithoutRef<"details">) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const details = ref.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }
    function dismissWithEscape(event: KeyboardEvent) {
      const details = ref.current;
      if (event.key !== "Escape" || !details?.open) return;
      const hadFocus = details.contains(document.activeElement);
      details.open = false;
      if (hadFocus) details.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissWithEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissWithEscape);
    };
  }, []);

  return <details ref={ref} {...props} />;
}
