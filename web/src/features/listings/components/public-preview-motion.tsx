"use client";

import { useEffect, useRef, type ReactNode } from "react";

type PreviewKind = "home" | "messages" | "publish" | "listings";

export function PublicPreviewMotion({ kind, children }: { kind: PreviewKind; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-flow-item]"));
    const mock = root.querySelector<HTMLElement>(".chat-mock, .publish-mock");
    const timers: number[] = [];
    const clear = () => {
      timers.splice(0).forEach(window.clearTimeout);
      steps.forEach((step) => step.classList.remove("is-flow-active"));
      mock?.classList.remove("is-fresh");
    };
    const play = () => {
      clear();
      if (preference.matches) return;
      mock?.classList.add("is-fresh");
      steps.forEach((step, index) => {
        timers.push(window.setTimeout(() => {
          steps.forEach((item) => item.classList.remove("is-flow-active"));
          step.classList.add("is-flow-active");
        }, index * 900));
      });
      if (steps.length) timers.push(window.setTimeout(clear, steps.length * 900));
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        play();
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(root.querySelector(".hero-visual, .intro-visual") ?? root);
    preference.addEventListener("change", clear);
    return () => { observer.disconnect(); clear(); preference.removeEventListener("change", clear); };
  }, [kind]);
  return <div className="public-preview" ref={ref}>{children}</div>;
}
