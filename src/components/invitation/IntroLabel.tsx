"use client";

import styles from "./IntroLabel.module.css";

interface IntroLabelProps {
  phase: "preload" | "envelope";
  visible: boolean;
}

export default function IntroLabel({ phase, visible }: IntroLabelProps) {
  const className = [
    styles.introLabel,
    phase === "envelope" ? styles.envelopePhase : "",
    visible ? "" : styles.fadeOut,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className={styles.eyebrowLine}>The Wedding Of</div>
      <div className={styles.namesLine}>Ivan &amp; Banin</div>
    </div>
  );
}
