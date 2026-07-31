"use client";

/* eslint-disable @next/next/no-img-element */

import type { KeyboardEvent } from "react";
import { useFloralClick } from "./FloralClickContext";
import styles from "./Envelope.module.css";

interface EnvelopeProps {
  open: boolean;
  hidden: boolean;
  onOpen: () => void;
}

export default function Envelope({ open, hidden, onOpen }: EnvelopeProps) {
  const handleFloralClick = useFloralClick();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <div className={`${styles.envelopeScreen}${hidden ? ` ${styles.hidden}` : ""}`}>
      <img
        className={`${styles.envCorner} ${styles.envCornerLeft} floral rotate`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      <img
        className={`${styles.envCorner} ${styles.envCornerRight} floral rotate d2`}
        src="/assets/spray.webp"
        alt=""
        onClick={handleFloralClick}
      />
      {/* spacer only: the visible label is IntroLabel, which slides in from the preloader and
          measures itself against this element once it reaches the envelope phase */}
      <div
        className={styles.envEyebrow}
        style={{ visibility: "hidden" }}
        data-intro-anchor="envelope"
        aria-hidden="true"
      >
        The Wedding Of
      </div>
      <div
        className={`${styles.envelopeWrap}${open ? ` ${styles.open}` : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Buka undangan"
        onClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.envShadow} />
        <div className={styles.envBody}>
          <div className={styles.letter}>
            <span className={styles.letterMono}>I&nbsp;&amp;&nbsp;B</span>
          </div>
          <div className={styles.envFlap} />
          <div className={styles.seal}>
            <svg viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="19" fill="none" stroke="#c7a561" strokeWidth="0.9" />
              <ellipse cx="10" cy="16" rx="4.5" ry="2" fill="#8fa178" transform="rotate(-30 10 16)" />
              <ellipse cx="34" cy="16" rx="4.5" ry="2" fill="#8fa178" transform="rotate(30 34 16)" />
              <ellipse cx="8" cy="30" rx="4" ry="1.8" fill="#5f6f4c" transform="rotate(30 8 30)" />
              <ellipse cx="36" cy="30" rx="4" ry="1.8" fill="#5f6f4c" transform="rotate(-30 36 30)" />
              <circle cx="10" cy="10" r="2" fill="#fffdf8" stroke="#e2e9d5" strokeWidth="0.4" />
              <circle cx="34" cy="10" r="2" fill="#fffdf8" stroke="#e2e9d5" strokeWidth="0.4" />
              <circle cx="6" cy="34" r="1.8" fill="#fffdf8" stroke="#e2e9d5" strokeWidth="0.4" />
              <circle cx="38" cy="34" r="1.8" fill="#fffdf8" stroke="#e2e9d5" strokeWidth="0.4" />
              <text
                x="22"
                y="26"
                textAnchor="middle"
                style={{ fontFamily: "var(--script)" }}
                fontSize="13"
                fill="#5f6f4c"
              >
                I&amp;B
              </text>
            </svg>
          </div>
        </div>
      </div>
      <div className={styles.tapHint}>Ketuk amplop untuk membuka</div>
    </div>
  );
}
