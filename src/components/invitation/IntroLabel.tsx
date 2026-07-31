"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import styles from "./IntroLabel.module.css";

interface IntroLabelProps {
  phase: "preload" | "envelope";
  visible: boolean;
}

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function IntroLabel({ phase, visible }: IntroLabelProps) {
  // The preloader and the envelope each render an invisible spacer where this label belongs.
  // Measuring that anchor keeps the two phases aligned at any viewport size, instead of relying
  // on percentages that only happen to line up at one particular height.
  const [top, setTop] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const anchor = document.querySelector<HTMLElement>(`[data-intro-anchor="${phase}"]`);
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      setTop(r.top + r.height / 2);
    };

    measure();
    window.addEventListener("resize", measure);
    // webfonts land after first paint and change the spacer's height slightly
    document.fonts?.ready.then(measure).catch(() => {});

    return () => window.removeEventListener("resize", measure);
  }, [phase]);

  const className = [
    styles.introLabel,
    phase === "envelope" ? styles.envelopePhase : styles.preloadPhase,
    visible ? "" : styles.fadeOut,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} style={top === null ? undefined : { top: `${top}px` }}>
      <div className={styles.eyebrowLine}>The Wedding Of</div>
      <div className={styles.namesLine}>Ivan &amp; Banin</div>
    </div>
  );
}
